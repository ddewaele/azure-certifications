# AZ-104 Lab 04 — PowerShell Command Reference

## What we're building

This guide walks through deploying the full AZ-104 Lab 04 networking environment using PowerShell, then extending it with compute resources to demonstrate how NSGs and ASGs actually work in practice.

The official lab creates the networking scaffolding — two VNets, subnets, an NSG (`myNSGSecure`), and an ASG (`asg-web`) — but never deploys any VMs to test them. We fill that gap by deploying two VMs in the same subnet, both running a web server on port 80. The only difference between them is ASG membership:

- **web-vm** — NIC tagged with `asg-web`. Inbound HTTP traffic from the internet is **allowed** (matches the AllowASG rule on ports 80/443).
- **noasg-vm** — NIC not in any ASG. Inbound HTTP traffic from the internet is **denied** (no rule matches, default deny kicks in).

Both VMs sit behind the same NSG (`myNSGSecure`) on the same subnet (`SharedServicesSubnet`). This proves that ASGs provide **role-based micro-segmentation within a single subnet** — the NSG is the gate, but the ASG controls which VMs the rules apply to.

The outbound deny rule (`DenyInternetOutbound`) applies to both VMs equally because it uses `Source: Any` — ASG membership is irrelevant for that rule.

To test it, you can attach a public IP or a load balancer and `curl` both VMs on port 80. One responds, the other times out. Then tag the second VM with `asg-web` and watch it start responding — same VM, same subnet, same NSG, only the ASG membership changed.

---

## 0. Variables

```powershell
$location = "West Europe"
$rgName   = "az104-rg4"
```

Store the region and resource group name in variables so they're easy to change and consistent throughout. Every command below uses `$location` and `$rgName` instead of hard-coded strings.

---

## 1. Resource Group

```powershell
New-AzResourceGroup -Name $rgName -Location $location -Force
```

Creates the resource group that holds everything. The `-Force` flag means it won't error if the group already exists — it just updates the tags/location silently.

---

## 2. CoreServicesVnet (10.20.0.0/16)

### Define the subnets first

```powershell
$sharedServicesSubnet = New-AzVirtualNetworkSubnetConfig `
    -Name "SharedServicesSubnet" `
    -AddressPrefix "10.20.10.0/24"
```

Creates a subnet configuration object in memory. This doesn't deploy anything yet — it's a definition that gets passed into the VNet creation. The `/24` gives 256 addresses, 251 usable after Azure's 5 reserved.

```powershell
$databaseSubnet = New-AzVirtualNetworkSubnetConfig `
    -Name "DatabaseSubnet" `
    -AddressPrefix "10.20.20.0/24"
```

Same thing for the database subnet. Note the address starts at `10.20.20.0`, leaving the `10.20.11.0` through `10.20.19.0` range free for future subnets.

### Create the VNet with both subnets

```powershell
$coreVnet = New-AzVirtualNetwork `
    -ResourceGroupName $rgName `
    -Location $location `
    -Name "CoreServicesVnet" `
    -AddressPrefix "10.20.0.0/16" `
    -Subnet $sharedServicesSubnet, $databaseSubnet
```

Creates the virtual network and attaches both subnet configs in a single call. The `/16` address space supports up to 65,536 addresses across all subnets. The subnet objects from above are passed as an array.

> **Note:** Make sure the VNet name matches exactly what you type later. Azure resource names are case-sensitive — `CoreServicesVnet` and `CoreServicesNet` are two different resources. A typo here gives you a 404 `ResourceNotFound` error later, not a helpful suggestion.

---

## 3. ManufacturingVnet (10.30.0.0/16)

```powershell
$sensorSubnet1 = New-AzVirtualNetworkSubnetConfig `
    -Name "SensorSubnet1" `
    -AddressPrefix "10.30.20.0/24"

$sensorSubnet2 = New-AzVirtualNetworkSubnetConfig `
    -Name "SensorSubnet2" `
    -AddressPrefix "10.30.21.0/24"
```

Two sensor subnets with adjacent ranges. `10.30.21.0` sits right after `10.30.20.0` — consecutive /24 blocks.

```powershell
$mfgVnet = New-AzVirtualNetwork `
    -ResourceGroupName $rgName `
    -Location $location `
    -Name "ManufacturingVnet" `
    -AddressPrefix "10.30.0.0/16" `
    -Subnet $sensorSubnet1, $sensorSubnet2
```

Same pattern as CoreServicesVnet. The `10.30.0.0/16` space doesn't overlap with `10.20.0.0/16` — this is a requirement for peering to work later.

---

## 4. Application Security Group

```powershell
$asgWeb = New-AzApplicationSecurityGroup `
    -ResourceGroupName $rgName `
    -Location $location `
    -Name "asg-web"
```

Creates a logical grouping called `asg-web`. On its own it does nothing — it's just a label. It becomes meaningful when you assign NICs to it and reference it in NSG rules. The `$asgWeb.Id` is used later in both the NSG rule and the NIC creation.

---

## 5. Network Security Group

### Define the inbound rule

```powershell
$ruleAllowASG = New-AzNetworkSecurityRuleConfig `
    -Name "AllowASG" `
    -Description "Allow HTTP/HTTPS inbound to asg-web members" `
    -Access Allow `
    -Protocol Tcp `
    -Direction Inbound `
    -Priority 100 `
    -SourceAddressPrefix Internet `
    -SourcePortRange * `
    -DestinationApplicationSecurityGroupId $asgWeb.Id `
    -DestinationPortRange 80, 443
```

This is the key rule. Instead of specifying a destination IP or CIDR, it uses `-DestinationApplicationSecurityGroupId` to target only NICs that are members of `asg-web`. Traffic from the internet on ports 80/443 is allowed, but only to those specific NICs. A VM in the same subnet whose NIC isn't in `asg-web` won't match this rule.

### Define the outbound rule

```powershell
$ruleDenyInternet = New-AzNetworkSecurityRuleConfig `
    -Name "DenyInternetOutbound" `
    -Description "Block all outbound internet access" `
    -Access Deny `
    -Protocol * `
    -Direction Outbound `
    -Priority 4096 `
    -SourceAddressPrefix * `
    -SourcePortRange * `
    -DestinationAddressPrefix Internet `
    -DestinationPortRange *
```

Blocks all outbound internet traffic from every VM in the subnet. Uses `Source *` so ASG membership is irrelevant here — this applies to everyone. The `Internet` service tag covers all public IP ranges. Priority 4096 sits below the default `AllowInternetOutBound` (65001), so this rule wins.

### Create the NSG with both rules

```powershell
$nsg = New-AzNetworkSecurityGroup `
    -ResourceGroupName $rgName `
    -Location $location `
    -Name "myNSGSecure" `
    -SecurityRules $ruleAllowASG, $ruleDenyInternet
```

Creates the NSG and attaches both rule configs in one call. You can also create the NSG first and add rules later with `Add-AzNetworkSecurityRuleConfig`, but passing them at creation time is cleaner.

### Associate the NSG with a subnet

```powershell
$coreVnet = Get-AzVirtualNetwork -Name "CoreServicesVnet" -ResourceGroupName $rgName
$subnet = $coreVnet | Get-AzVirtualNetworkSubnetConfig -Name "SharedServicesSubnet"
$subnet.NetworkSecurityGroup = $nsg
$coreVnet | Set-AzVirtualNetwork
```

This is a three-step pattern common in Azure PowerShell: get the parent resource, modify a child property, then push the parent back with `Set-`. You can't associate an NSG with a subnet directly — you have to update the VNet object. After this, every NIC in SharedServicesSubnet is subject to `myNSGSecure`.

The pipe into `Get-AzVirtualNetworkSubnetConfig` extracts one specific subnet's configuration from the VNet object in memory. It's saying "from this VNet, give me the subnet called SharedServicesSubnet." This is all happening against the local in-memory copy — nothing changes in Azure until `Set-AzVirtualNetwork` pushes it back.

---

## 6. SSH Key

### Create an SSH key pair and store the public key in Azure

```powershell
New-AzSshKey -ResourceGroupName $rgName -Name "my-ssh-key"
```

Generates an SSH key pair. The public key is stored as an Azure resource (visible in the portal by searching "SSH keys"). The private key is saved locally — note the path it prints:

```
Private key is saved to /home/davy/.ssh/1775467374
Public key is saved to /home/davy/.ssh/1775467374.pub
```

> **Important:** The private key file is saved to your Cloud Shell session storage. If your Cloud Shell storage is backed by an Azure Files share (check with `df -h ~`), it survives session timeouts. For extra safety, store it in Key Vault:
>
> ```powershell
> $privateKey = Get-Content "~/.ssh/1775467374" -Raw
> $secret = ConvertTo-SecureString $privateKey -AsPlainText -Force
> Set-AzKeyVaultSecret -VaultName "your-vault-name" -Name "my-ssh-private-key" -SecretValue $secret
> ```

### Prepare the credential object

```powershell
$password = Read-Host -Prompt "Enter VM admin password" -AsSecureString
$credential = New-Object PSCredential("azureuser", $password)
```

Even with SSH key authentication, Azure still requires a `PSCredential` object for the username. The password is ignored when `-DisablePasswordAuthentication` is set on the VM config, but the cmdlet won't run without it. You can enter any value for the password — it won't be used.

> **Tip:** To discover SSH-related commands, use `Get-Command *SshKey*`. For detailed help on any command, use `Get-Help New-AzSshKey -Examples`.

---

## 7. Virtual Machines

### Get the subnet ID

```powershell
$coreVnet = Get-AzVirtualNetwork -Name "CoreServicesVnet" -ResourceGroupName $rgName
$subnetId = ($coreVnet | Get-AzVirtualNetworkSubnetConfig -Name "SharedServicesSubnet").Id
```

Refreshes the VNet object (needed because we modified it when associating the NSG) and extracts the subnet's resource ID. This ID is passed to the NIC so the VM lands in the correct subnet.

### Create web-vm (ASG member)

```powershell
$nicWeb = New-AzNetworkInterface `
    -ResourceGroupName $rgName `
    -Location $location `
    -Name "web-vm-nic" `
    -SubnetId $subnetId `
    -ApplicationSecurityGroupId $asgWeb.Id
```

Creates a NIC in SharedServicesSubnet and tags it with `asg-web` in one step. This is where ASG membership is assigned — at the NIC level, not the VM level. No public IP is specified, so the VM will only be reachable privately (or via a load balancer).

```powershell
$vmConfigWeb = New-AzVMConfig -VMName "web-vm" -VMSize "Standard_B1s" |
    Set-AzVMOperatingSystem -Linux -ComputerName "web-vm" `
        -Credential $credential -DisablePasswordAuthentication |
    Add-AzVMSshPublicKey `
        -KeyData (Get-Content ~/.ssh/1775467374.pub -Raw) `
        -Path "/home/azureuser/.ssh/authorized_keys" |
    Set-AzVMSourceImage -PublisherName "Canonical" `
        -Offer "0001-com-ubuntu-server-jammy" `
        -Skus "22_04-lts-gen2" `
        -Version "latest" |
    Add-AzVMNetworkInterface -Id $nicWeb.Id |
    Set-AzVMBootDiagnostic -Disable
```

Builds the VM configuration using a pipeline. Each cmdlet adds a layer to the config object. Key details:

- `Standard_B1s` is the cheapest burstable size (1 vCPU, 1 GB RAM).
- `-DisablePasswordAuthentication` means only SSH key login is allowed.
- `Add-AzVMSshPublicKey` (not `Set-AzVMSshPublicKey` — that cmdlet doesn't exist) places the public key into the VM's `authorized_keys` file.
- `-KeyData` reads your public key file. Replace the path with wherever your `.pub` file was saved.
- Boot diagnostics are disabled to avoid needing a storage account.
- The entire pipeline must be one assignment to `$vmConfigWeb`. If you run parts separately without capturing the output, the variable stays `$null` and `New-AzVM` will error with "The argument is null or empty."

```powershell
New-AzVM -ResourceGroupName $rgName -Location $location -VM $vmConfigWeb
```

Actually deploys the VM. This is the slow part — takes 2-3 minutes.

### Create noasg-vm (no ASG)

```powershell
$nicNoAsg = New-AzNetworkInterface `
    -ResourceGroupName $rgName `
    -Location $location `
    -Name "noasg-vm-nic" `
    -SubnetId $subnetId
```

Same subnet, same NSG applies — but no `-ApplicationSecurityGroupId` parameter. This NIC is not in any ASG, so the AllowASG inbound rule won't match traffic destined for it.

```powershell
$vmConfigNoAsg = New-AzVMConfig -VMName "noasg-vm" -VMSize "Standard_B1s" |
    Set-AzVMOperatingSystem -Linux -ComputerName "noasg-vm" `
        -Credential $credential -DisablePasswordAuthentication |
    Add-AzVMSshPublicKey `
        -KeyData (Get-Content ~/.ssh/1775467374.pub -Raw) `
        -Path "/home/azureuser/.ssh/authorized_keys" |
    Set-AzVMSourceImage -PublisherName "Canonical" `
        -Offer "0001-com-ubuntu-server-jammy" `
        -Skus "22_04-lts-gen2" `
        -Version "latest" |
    Add-AzVMNetworkInterface -Id $nicNoAsg.Id |
    Set-AzVMBootDiagnostic -Disable

New-AzVM -ResourceGroupName $rgName -Location $location -VM $vmConfigNoAsg
```

Same VM config pattern, just with a different name and NIC. Uses the same SSH key so you can access both VMs with the same private key.

---

## 8. Web Server Installation

### Define the web server script

```powershell
$webServerScript = @'
cat <<'EOF' > /etc/systemd/system/webserver.service
[Unit]
Description=Simple Web Server
After=network.target

[Service]
ExecStart=/usr/bin/python3 -m http.server 80
WorkingDirectory=/var/www
Restart=always

[Install]
WantedBy=multi-user.target
EOF

mkdir -p /var/www
echo "<h1>$(hostname) is serving on port 80</h1><p>Private IP: $(hostname -I | awk '{print $1}')</p>" > /var/www/index.html
systemctl daemon-reload
systemctl enable --now webserver.service
'@
```

This defines a multi-line string using PowerShell's **here-string** syntax (`@' ... '@`). Everything between the delimiters is treated as literal text — no escaping needed for quotes or special characters. The script does four things inside the VM:

1. Writes a systemd unit file that runs Python's built-in HTTP server on port 80
2. Creates `/var/www/index.html` with the VM's hostname and private IP (so you can tell which VM responded)
3. Reloads systemd to pick up the new service
4. Enables and starts the service (survives reboots)

This approach uses Python 3 which is pre-installed on every Ubuntu Azure VM image — no `apt install` needed. This matters because the `DenyInternetOutbound` NSG rule blocks package downloads from the internet.

> **Important:** You must run this `$webServerScript = ...` definition in your Cloud Shell session **before** calling `Invoke-AzVMRunCommand` below, or the `-ScriptString` parameter will be empty.

### Run the script on both VMs

```powershell
Invoke-AzVMRunCommand `
    -ResourceGroupName $rgName `
    -VMName "web-vm" `
    -CommandId "RunShellScript" `
    -ScriptString $webServerScript

Invoke-AzVMRunCommand `
    -ResourceGroupName $rgName `
    -VMName "noasg-vm" `
    -CommandId "RunShellScript" `
    -ScriptString $webServerScript
```

Executes the script inside each VM via the Azure VM Agent. The agent communicates over Azure's internal management channel, bypassing NSG rules entirely — no SSH or public IP needed.

---

## 9. VNet Peering

```powershell
$coreVnet = Get-AzVirtualNetwork -Name "CoreServicesVnet" -ResourceGroupName $rgName
$mfgVnet  = Get-AzVirtualNetwork -Name "ManufacturingVnet" -ResourceGroupName $rgName
```

Gets fresh references to both VNets. You need the full object (with its resource ID) to create peering links.

```powershell
Add-AzVirtualNetworkPeering `
    -Name "CoreToManufacturing" `
    -VirtualNetwork $coreVnet `
    -RemoteVirtualNetworkId $mfgVnet.Id
```

Creates a peering link from CoreServicesVnet to ManufacturingVnet. This is one-directional — it tells CoreServicesVnet that it can route to ManufacturingVnet's address space.

```powershell
Add-AzVirtualNetworkPeering `
    -Name "ManufacturingToCore" `
    -VirtualNetwork $mfgVnet `
    -RemoteVirtualNetworkId $coreVnet.Id
```

Creates the reverse link. Both links must exist for traffic to flow in both directions. If you only create one, the peering status will show as "Initiated" instead of "Connected" and traffic won't flow.

---

## 10. Testing the NSG / ASG Setup

This is where the lab extension pays off. Both VMs run a web server on port 80, but the NSG only allows inbound HTTP to NICs in `asg-web`.

### Option A: Add public IPs and test directly

```powershell
# Public IP for web-vm
$pipWeb = New-AzPublicIpAddress -Name "web-vm-pip" -ResourceGroupName $rgName `
    -Location $location -AllocationMethod Static -Sku Basic

$nicWeb = Get-AzNetworkInterface -Name "web-vm-nic" -ResourceGroupName $rgName
$nicWeb.IpConfigurations[0].PublicIpAddress = $pipWeb
$nicWeb | Set-AzNetworkInterface

# Public IP for noasg-vm
$pipNoAsg = New-AzPublicIpAddress -Name "noasg-vm-pip" -ResourceGroupName $rgName `
    -Location $location -AllocationMethod Static -Sku Basic

$nicNoAsg = Get-AzNetworkInterface -Name "noasg-vm-nic" -ResourceGroupName $rgName
$nicNoAsg.IpConfigurations[0].PublicIpAddress = $pipNoAsg
$nicNoAsg | Set-AzNetworkInterface
```

Then from Cloud Shell or your local machine:

```bash
# Get the public IPs
az vm show -g az104-rg4 -n web-vm -d --query publicIps -o tsv
az vm show -g az104-rg4 -n noasg-vm -d --query publicIps -o tsv

# Test web-vm (ASG member) — should return the nginx page
curl http://<web-vm-public-ip> --connect-timeout 5

# Test noasg-vm (no ASG) — should time out
curl http://<noasg-vm-public-ip> --connect-timeout 5
```

**Expected results:**

- **web-vm:** HTML page returned — the AllowASG rule (priority 100) matches because the NIC is in `asg-web`
- **noasg-vm:** Connection times out — no inbound rule allows port 80 to a NIC outside `asg-web`, so the default deny kicks in

### Option B: The "aha" moment — tag noasg-vm and retest

```powershell
# Add noasg-vm's NIC to asg-web
$nicNoAsg = Get-AzNetworkInterface -Name "noasg-vm-nic" -ResourceGroupName $rgName
$nicNoAsg.IpConfigurations[0].ApplicationSecurityGroups = @($asgWeb)
$nicNoAsg | Set-AzNetworkInterface
```

Now retest:

```bash
# Should now return the HTML page
curl http://<noasg-vm-public-ip> --connect-timeout 5
```

Same VM, same subnet, same NSG — only the ASG membership changed. This is the proof that ASGs provide per-VM rule targeting within a shared NSG.

---

## 11. SSH Access (Optional)

To SSH into the VMs, you need a rule allowing port 22 inbound. Add a temporary rule:

```powershell
$nsg = Get-AzNetworkSecurityGroup -Name "myNSGSecure" -ResourceGroupName $rgName
$nsg | Add-AzNetworkSecurityRuleConfig `
    -Name "AllowSSH" `
    -Access Allow `
    -Protocol Tcp `
    -Direction Inbound `
    -Priority 110 `
    -SourceAddressPrefix Internet `
    -SourcePortRange * `
    -DestinationAddressPrefix * `
    -DestinationPortRange 22
$nsg | Set-AzNetworkSecurityGroup
```

Then connect using your private key:

```bash
ssh -i ~/.ssh/1775467374 azureuser@<public-ip>
```

> **Note:** Remove the SSH rule when you're done to keep the environment secure. Alternatively, skip the public IP entirely and use `Invoke-AzVMRunCommand` from Cloud Shell — it works over Azure's internal management channel and doesn't need any NSG rules.

---

## 12. Load Balancer (Optional)

An alternative to public IPs on each VM. The LB gets one public IP and forwards traffic to backend VMs by private IP.

### Public IP for the LB frontend

```powershell
$lbPip = New-AzPublicIpAddress `
    -ResourceGroupName $rgName `
    -Location $location `
    -Name "web-lb-pip" `
    -Sku Standard `
    -AllocationMethod Static
```

Creates a Standard SKU static public IP. Standard is required to match the Standard LB SKU — you can't mix Basic and Standard.

### Build the LB components

```powershell
$feConfig = New-AzLoadBalancerFrontendIpConfig `
    -Name "web-frontend" `
    -PublicIpAddress $lbPip
```

Defines the frontend — this is the public-facing side that receives incoming traffic on the LB's public IP.

```powershell
$bePool = New-AzLoadBalancerBackendAddressPoolConfig `
    -Name "web-backend"
```

Defines the backend pool — the group of VMs (by their NICs) that will receive forwarded traffic.

```powershell
$probe = New-AzLoadBalancerProbeConfig `
    -Name "http-probe" `
    -Protocol Tcp `
    -Port 80 `
    -IntervalInSeconds 15 `
    -ProbeCount 2
```

Health probe that checks port 80 every 15 seconds. If a backend VM fails 2 consecutive probes, the LB stops sending it traffic.

```powershell
$lbRule = New-AzLoadBalancerRuleConfig `
    -Name "http-rule" `
    -FrontendIpConfiguration $feConfig `
    -BackendAddressPool $bePool `
    -Probe $probe `
    -Protocol Tcp `
    -FrontendPort 80 `
    -BackendPort 80
```

The load balancing rule ties everything together: traffic arriving on the frontend (port 80) gets distributed to the backend pool (port 80), using the health probe to determine which backends are healthy.

### Create the Load Balancer

```powershell
$lb = New-AzLoadBalancer `
    -ResourceGroupName $rgName `
    -Location $location `
    -Name "web-lb" `
    -Sku Standard `
    -FrontendIpConfiguration $feConfig `
    -BackendAddressPool $bePool `
    -Probe $probe `
    -LoadBalancingRule $lbRule
```

Deploys the LB with all components in one call.

### Add a VM's NIC to the backend pool

```powershell
$lb = Get-AzLoadBalancer -Name "web-lb" -ResourceGroupName $rgName
$backendPool = $lb | Get-AzLoadBalancerBackendAddressPoolConfig -Name "web-backend"

$nicWeb = Get-AzNetworkInterface -Name "web-vm-nic" -ResourceGroupName $rgName
$nicWeb.IpConfigurations[0].LoadBalancerBackendAddressPools = @($backendPool)
$nicWeb | Set-AzNetworkInterface
```

Associates web-vm's NIC with the backend pool. This is the same get-modify-set pattern used for the NSG-to-subnet association. After this, traffic hitting the LB's public IP on port 80 gets forwarded to web-vm's private IP (10.20.10.4) on port 80.

---

## 13. Cleanup

```powershell
Remove-AzResourceGroup -Name $rgName -Force
```

Deletes the entire resource group and everything in it. The `-Force` flag skips the confirmation prompt. This is the cleanest way to tear down a lab — no need to delete individual resources.

To delete a single VNet without removing the whole resource group:

```powershell
Remove-AzVirtualNetwork -Name "CoreServicesVnet" -ResourceGroupName $rgName -Force
```

This will fail if the VNet has dependent resources (NICs, peerings, subnet delegations) — delete those first.

---

## Quick Reference: Command to Purpose

| Command | What it does |
|---|---|
| `New-AzResourceGroup` | Create a resource group |
| `New-AzVirtualNetworkSubnetConfig` | Define a subnet (in memory, not deployed) |
| `New-AzVirtualNetwork` | Create a VNet with subnets |
| `Remove-AzVirtualNetwork` | Delete a VNet |
| `New-AzApplicationSecurityGroup` | Create a logical VM grouping (ASG) |
| `New-AzNetworkSecurityRuleConfig` | Define an NSG rule (in memory) |
| `New-AzNetworkSecurityGroup` | Create an NSG with rules |
| `Add-AzNetworkSecurityRuleConfig` | Add a rule to an existing NSG |
| `Set-AzNetworkSecurityGroup` | Push NSG changes back to Azure |
| `Get-AzVirtualNetwork` | Retrieve a VNet object |
| `Get-AzVirtualNetworkSubnetConfig` | Get a subnet from a VNet (in memory) |
| `Set-AzVirtualNetwork` | Push VNet changes back to Azure |
| `New-AzSshKey` | Generate SSH key pair, store public key in Azure |
| `New-AzNetworkInterface` | Create a NIC (with optional ASG) |
| `New-AzVMConfig` | Start building a VM configuration |
| `Set-AzVMOperatingSystem` | Set OS type, credentials, and auth mode |
| `Add-AzVMSshPublicKey` | Add an SSH public key to the VM config |
| `Set-AzVMSourceImage` | Set the marketplace image |
| `Add-AzVMNetworkInterface` | Attach a NIC to the VM config |
| `Set-AzVMBootDiagnostic` | Enable/disable boot diagnostics |
| `New-AzVM` | Deploy the VM |
| `Invoke-AzVMRunCommand` | Run a script inside a VM (no SSH needed) |
| `Add-AzVirtualNetworkPeering` | Create a one-way peering link |
| `New-AzPublicIpAddress` | Create a public IP |
| `Get-AzNetworkInterface` | Retrieve a NIC object |
| `Set-AzNetworkInterface` | Push NIC changes back to Azure |
| `New-AzLoadBalancerFrontendIpConfig` | Define a LB frontend |
| `New-AzLoadBalancerBackendAddressPoolConfig` | Define a LB backend pool |
| `New-AzLoadBalancerProbeConfig` | Define a health probe |
| `New-AzLoadBalancerRuleConfig` | Define a LB forwarding rule |
| `New-AzLoadBalancer` | Create the load balancer |
| `Set-AzKeyVaultSecret` | Store a secret (e.g. SSH private key) in Key Vault |
| `Get-AzKeyVaultSecret` | Retrieve a secret from Key Vault |
| `Remove-AzResourceGroup` | Delete everything in one go |
| `Get-Command` | Discover commands (e.g. `Get-Command *SshKey*`) |
| `Get-Help` | Get help on a command (e.g. `Get-Help New-AzVM -Examples`) |
