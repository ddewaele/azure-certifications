# Lab: Azure Bastion

## Overview

Deploy Azure Bastion to securely connect to VMs that have no public IP address. This lab builds the full stack from scratch: VNet with subnets, private VMs, and a Basic SKU Bastion host.

### Learning Objectives

- Create a VNet with a private workload subnet and the mandatory `AzureBastionSubnet`
- Deploy VMs with no public IP and no direct internet exposure
- Deploy Azure Bastion (Basic SKU) with a Standard public IP
- Connect to a private VM via Bastion using SSH key and password authentication
- Understand why the Developer SKU may not work on all subscriptions

### Exam Topics Covered (Domain 4)

| Topic | AZ-104 Objective |
|-------|-----------------|
| AzureBastionSubnet requirements | Configure Azure Bastion |
| Basic vs Developer SKU | Configure Azure Bastion |
| Connecting without public IP | Configure Azure Bastion |
| NSG rules for Bastion | Troubleshoot connectivity |

### Estimated Time

~25 minutes (excludes ~5 min Bastion provisioning wait)

### Prerequisites

- Azure subscription with Contributor role
- Azure Cloud Shell (Bash) or Azure CLI ≥ 2.50

---

## Architecture

```
                        Internet
                            │
                     Standard Public IP
                            │
                   ┌────────────────┐
                   │  Azure Bastion │  (AzureBastionSubnet 10.0.1.0/26)
                   └───────┬────────┘
                           │  HTTPS port 443 inbound
                           │  SSH/RDP to VMs on private subnet
                   ┌───────▼────────────────────┐
                   │       vnet-bastion-lab       │
                   │        10.0.0.0/16           │
                   │                              │
                   │  subnet-private 10.0.0.0/24  │
                   │   ┌──────────┐ ┌──────────┐  │
                   │   │  vm-01   │ │  vm-02   │  │
                   │   │ no PIP   │ │ no PIP   │  │
                   │   └──────────┘ └──────────┘  │
                   └──────────────────────────────┘
```

---

## Shared Variables

```bash
RG="rg-bastion-lab"
LOCATION="westeurope"
IMAGE="Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest"
VM_SIZE="Standard_B2ts_v2"
VNET_NAME="vnet-bastion-lab"
VNET_PREFIX="10.0.0.0/16"
SUBNET_PRIVATE="subnet-private"
SUBNET_PRIVATE_PREFIX="10.0.0.0/24"
SUBNET_BASTION="AzureBastionSubnet"
SUBNET_BASTION_PREFIX="10.0.1.0/26"
BASTION_NAME="bastion-lab"
BASTION_PIP="pip-bastion"
```

---

## Step 1 – Resource Group and VNet

```bash
az group create --name $RG --location $LOCATION
```

```bash
az network vnet create \
  --name $VNET_NAME \
  --resource-group $RG \
  --location $LOCATION \
  --address-prefix $VNET_PREFIX
```

---

## Step 2 – Subnets

Two subnets are required:
- **`subnet-private`** — where your workload VMs live
- **`AzureBastionSubnet`** — reserved name Azure requires; minimum /26

```bash
az network vnet subnet create \
  --name $SUBNET_PRIVATE \
  --vnet-name $VNET_NAME \
  --resource-group $RG \
  --address-prefix $SUBNET_PRIVATE_PREFIX

az network vnet subnet create \
  --name $SUBNET_BASTION \
  --vnet-name $VNET_NAME \
  --resource-group $RG \
  --address-prefix $SUBNET_BASTION_PREFIX
```

```bash
# Verify both subnets exist
az network vnet subnet list \
  --vnet-name $VNET_NAME \
  --resource-group $RG \
  --query "[].{Name:name, Prefix:addressPrefix}" \
  --output table
```

Expected output:
```
Name                 Prefix
-------------------  ------------
subnet-private       10.0.0.0/24
AzureBastionSubnet   10.0.1.0/26
```

---

## Step 3 – NSG for the Private Subnet

Bastion connects to VMs on port 22 (SSH) or 3389 (RDP) sourced from the **VirtualNetwork** service tag — not from the internet directly. The NSG should allow this while blocking direct internet access.

```bash
az network nsg create \
  --name nsg-private \
  --resource-group $RG \
  --location $LOCATION
```

```bash
# Allow SSH from VirtualNetwork (Bastion → VM)
az network nsg rule create \
  --nsg-name nsg-private \
  --resource-group $RG \
  --name allow-ssh-from-bastion \
  --priority 100 \
  --protocol Tcp \
  --source-address-prefixes VirtualNetwork \
  --destination-port-ranges 22 \
  --access Allow \
  --direction Inbound

# Deny all other inbound internet traffic
az network nsg rule create \
  --nsg-name nsg-private \
  --resource-group $RG \
  --name deny-internet-inbound \
  --priority 4000 \
  --protocol "*" \
  --source-address-prefixes Internet \
  --destination-port-ranges "*" \
  --access Deny \
  --direction Inbound
```

```bash
# Attach NSG to the private subnet
az network vnet subnet update \
  --name $SUBNET_PRIVATE \
  --vnet-name $VNET_NAME \
  --resource-group $RG \
  --network-security-group nsg-private
```

---

## Step 4 – Private VMs (No Public IP)

```bash
for i in 1 2; do
  az vm create \
    --name "vm-private-0${i}" \
    --resource-group $RG \
    --location $LOCATION \
    --image $IMAGE \
    --size $VM_SIZE \
    --vnet-name $VNET_NAME \
    --subnet $SUBNET_PRIVATE \
    --public-ip-address "" \
    --nsg "" \
    --admin-username azureuser \
    --generate-ssh-keys \
    --output none
  echo "vm-private-0${i} created"
done
```

> `--public-ip-address ""` ensures no public IP is assigned — the VM is only reachable through Bastion.

```bash
# Confirm VMs are running with private IPs only
az vm list \
  --resource-group $RG \
  --show-details \
  --query "[].{Name:name, State:powerState, PrivateIP:privateIps, PublicIP:publicIps}" \
  --output table
```

Expected: `PublicIP` column is empty for both VMs.

---

## Step 5 – Bastion Public IP

Bastion Basic SKU requires a **Standard SKU static public IP**.

```bash
az network public-ip create \
  --name $BASTION_PIP \
  --resource-group $RG \
  --location $LOCATION \
  --sku Standard \
  --allocation-method Static
```

---

## Step 6 – Deploy Azure Bastion

```bash
az network bastion create \
  --name $BASTION_NAME \
  --resource-group $RG \
  --location $LOCATION \
  --vnet-name $VNET_NAME \
  --public-ip-address $BASTION_PIP \
  --sku Basic
```

> Provisioning takes ~5–8 minutes. Wait until the command returns before proceeding.

```bash
# Confirm Bastion is provisioned
az network bastion show \
  --name $BASTION_NAME \
  --resource-group $RG \
  --query "{Name:name, SKU:sku.name, State:provisioningState, IP:dnsName}" \
  --output table
```

---

## Step 7 – Connect to a Private VM via Bastion

### Option A: Azure Portal (Basic SKU)

The portal is the only connection method available with the Basic SKU.

1. Go to **Virtual Machines** → select `vm-private-01`
2. Click **Connect** → **Bastion**
3. Enter username `azureuser` and your SSH private key or password
4. Click **Connect** — a terminal opens in the browser

### Option B: Azure CLI native tunnel (Standard SKU only)

`az network bastion ssh` requires **Standard SKU** with **Native Client** enabled. It will fail with Basic SKU.

Upgrade the existing Bastion to Standard and enable native client:

```bash
az network bastion update \
  --name $BASTION_NAME \
  --resource-group $RG \
  --set sku.name=Standard \
  --enable-tunneling true
```

Then connect via CLI:

```bash
# Install the bastion extension if prompted
az extension add --name bastion

VM_ID=$(az vm show \
  --name vm-private-01 \
  --resource-group $RG \
  --query id \
  --output tsv)

az network bastion ssh \
  --name $BASTION_NAME \
  --resource-group $RG \
  --target-resource-id $VM_ID \
  --auth-type ssh-key \
  --username azureuser \
  --ssh-key ~/.ssh/id_rsa
```

### Option C: RDP tunnel via CLI (Standard SKU only)

```bash
az network bastion tunnel \
  --name $BASTION_NAME \
  --resource-group $RG \
  --target-resource-id $VM_ID \
  --resource-port 3389 \
  --port 50022
# Then connect your RDP client to localhost:50022
```

---

## Step 8 – Verify Connectivity from Inside the VM

Once connected via Bastion, run these inside the VM to confirm the network setup:

```bash
# No public IP on the NIC
curl -s --max-time 3 ifconfig.me || echo "No outbound internet (expected)"

# Private IP is assigned
hostname -I

# DNS resolves internal names (if private DNS zone is linked)
nslookup vm-private-02.internal.corp 2>/dev/null || echo "No private DNS zone linked"
```

---

## Bastion SKU Comparison

| Feature | Developer | Basic | Standard |
|---------|-----------|-------|----------|
| Price | Free | ~$140/month | ~$280/month+ |
| AzureBastionSubnet required | No | Yes (/26 min) | Yes (/26 min) |
| Concurrent connections | 1 | 25 | 50+ |
| Native client support (CLI tunnel) | No | No | Yes |
| Custom port | No | No | Yes |
| IP-based connection | No | No | Yes |
| Availability | Limited (preview regions) | GA everywhere | GA everywhere |

> **Why Developer SKU may show "No available items":** the Developer SKU is not supported on all subscription types (free trial, CSP, Visual Studio Dev/Test) and has limited regional availability. Use Basic SKU for reliable lab use.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| "No available items" in VM dropdown | Developer SKU not supported on subscription | Use Basic SKU |
| `InvalidResourceReference` on bastion create | `AzureBastionSubnet` missing | Create subnet first, then retry |
| Bastion subnet too small | Prefix longer than /26 | Recreate with /26 or shorter |
| SSH connection refused | NSG blocking port 22 from VirtualNetwork | Add inbound rule allowing TCP:22 from `VirtualNetwork` service tag |
| `az network bastion ssh` fails | `ssh` extension not installed | `az extension add --name ssh` |
| Native client (CLI tunnel) not available | Basic SKU doesn't support native client | Upgrade to Standard SKU or use portal |

---

## Cleanup

```bash
az group delete --name $RG --yes --no-wait
```

---

## PowerShell Reference

```powershell
$RG                   = "rg-bastion-lab"
$Location             = "westeurope"
$VmSize               = "Standard_B2ts_v2"
$VNetName             = "vnet-bastion-lab"
$SubnetPrivate        = "subnet-private"
$SubnetBastion        = "AzureBastionSubnet"
$BastionName          = "bastion-lab"
$BastionPipName       = "pip-bastion"
```

```powershell
New-AzResourceGroup -Name $RG -Location $Location

$vnet = New-AzVirtualNetwork `
  -Name $VNetName -ResourceGroupName $RG -Location $Location `
  -AddressPrefix "10.0.0.0/16"

Add-AzVirtualNetworkSubnetConfig -Name $SubnetPrivate  -VirtualNetwork $vnet -AddressPrefix "10.0.0.0/24" | Set-AzVirtualNetwork
Add-AzVirtualNetworkSubnetConfig -Name $SubnetBastion  -VirtualNetwork $vnet -AddressPrefix "10.0.1.0/26" | Set-AzVirtualNetwork
```

```powershell
# NSG for private subnet
$nsg = New-AzNetworkSecurityGroup -Name "nsg-private" -ResourceGroupName $RG -Location $Location

$nsg | Add-AzNetworkSecurityRuleConfig `
  -Name "allow-ssh-from-bastion" -Priority 100 -Protocol Tcp `
  -SourceAddressPrefix VirtualNetwork -SourcePortRange "*" `
  -DestinationAddressPrefix "*" -DestinationPortRange 22 `
  -Access Allow -Direction Inbound | Set-AzNetworkSecurityGroup

$vnet   = Get-AzVirtualNetwork -Name $VNetName -ResourceGroupName $RG
$subnet = Get-AzVirtualNetworkSubnetConfig -Name $SubnetPrivate -VirtualNetwork $vnet
$subnet.NetworkSecurityGroup = $nsg
Set-AzVirtualNetwork -VirtualNetwork $vnet
```

```powershell
# Private VMs
$vnet   = Get-AzVirtualNetwork -Name $VNetName -ResourceGroupName $RG
$subnet = Get-AzVirtualNetworkSubnetConfig -Name $SubnetPrivate -VirtualNetwork $vnet

foreach ($i in 1..2) {
  $nic = New-AzNetworkInterface `
    -Name "nic-private-0$i" -ResourceGroupName $RG -Location $Location `
    -SubnetId $subnet.Id

  $cred = Get-Credential -Message "Admin password for vm-private-0$i"

  $vmConfig = New-AzVMConfig -VMName "vm-private-0$i" -VMSize $VmSize |
    Set-AzVMOperatingSystem -Linux -ComputerName "vm-private-0$i" -Credential $cred |
    Set-AzVMSourceImage -PublisherName "Canonical" -Offer "0001-com-ubuntu-server-jammy" -Skus "22_04-lts-gen2" -Version "latest" |
    Add-AzVMNetworkInterface -Id $nic.Id

  New-AzVM -ResourceGroupName $RG -Location $Location -VM $vmConfig
}
```

```powershell
# Bastion
$pip = New-AzPublicIpAddress `
  -Name $BastionPipName -ResourceGroupName $RG -Location $Location `
  -Sku Standard -AllocationMethod Static

$vnet = Get-AzVirtualNetwork -Name $VNetName -ResourceGroupName $RG

New-AzBastion `
  -Name $BastionName `
  -ResourceGroupName $RG `
  -PublicIpAddressRgName $RG `
  -PublicIpAddressName $BastionPipName `
  -VirtualNetworkRgName $RG `
  -VirtualNetworkName $VNetName `
  -Sku Basic
```

```powershell
# Verify
Get-AzBastion -Name $BastionName -ResourceGroupName $RG |
  Select-Object Name, @{N="SKU";E={$_.Sku.Name}}, ProvisioningState, DnsName
```
