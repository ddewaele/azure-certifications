# Lab 05: Implement Virtual Networking

## Overview

Create Virtual Networks and subnets, configure Network Security Groups, peer two VNets, configure Azure DNS private zones, and test connectivity. This lab covers AZ-104 Domain 4 networking fundamentals.

### Learning Objectives

- Create VNets and subnets with planned address spaces
- Create and associate Network Security Groups with custom inbound/outbound rules
- Configure VNet peering between two VNets
- Configure a private DNS zone with auto-registration
- Use Network Watcher tools to verify and troubleshoot connectivity
- Configure User-Defined Routes (UDR)

## Prerequisites

- Azure subscription with Contributor role
- Azure CLI installed or use Azure Cloud Shell

---

## Steps

### 1. Create Two Virtual Networks

```bash
# Variables
RG="rg-network-lab"
LOCATION="eastus"

az group create --name $RG --location $LOCATION

# VNet 1 - Hub (10.1.0.0/16)
az network vnet create \
  --name vnet-hub \
  --resource-group $RG \
  --location $LOCATION \
  --address-prefix 10.1.0.0/16

# Subnets in VNet Hub
az network vnet subnet create \
  --name subnet-web \
  --vnet-name vnet-hub \
  --resource-group $RG \
  --address-prefix 10.1.1.0/24

az network vnet subnet create \
  --name subnet-app \
  --vnet-name vnet-hub \
  --resource-group $RG \
  --address-prefix 10.1.2.0/24

# VNet 2 - Spoke (10.2.0.0/16)
az network vnet create \
  --name vnet-spoke \
  --resource-group $RG \
  --location $LOCATION \
  --address-prefix 10.2.0.0/16

az network vnet subnet create \
  --name subnet-db \
  --vnet-name vnet-spoke \
  --resource-group $RG \
  --address-prefix 10.2.1.0/24

echo "VNets and subnets created"
```

**Explore (Portal):**
- Navigate to `vnet-hub` → **Subnets** — confirm two subnets with correct CIDR ranges
- Note: Azure reserves 5 IPs per subnet; /24 = 251 usable addresses

---

### 2. Create Network Security Groups

#### Create NSG for Web Subnet

```bash
# Create NSG
az network nsg create \
  --name nsg-web \
  --resource-group $RG

# Allow HTTP (port 80) inbound from internet
az network nsg rule create \
  --nsg-name nsg-web \
  --resource-group $RG \
  --name Allow-HTTP-Inbound \
  --priority 100 \
  --direction Inbound \
  --access Allow \
  --protocol Tcp \
  --source-address-prefix Internet \
  --source-port-range '*' \
  --destination-address-prefix '*' \
  --destination-port-range 80

# Allow HTTPS (port 443) inbound from internet
az network nsg rule create \
  --nsg-name nsg-web \
  --resource-group $RG \
  --name Allow-HTTPS-Inbound \
  --priority 110 \
  --direction Inbound \
  --access Allow \
  --protocol Tcp \
  --source-address-prefix Internet \
  --source-port-range '*' \
  --destination-address-prefix '*' \
  --destination-port-range 443

# Deny all other inbound
az network nsg rule create \
  --nsg-name nsg-web \
  --resource-group $RG \
  --name Deny-All-Inbound \
  --priority 4000 \
  --direction Inbound \
  --access Deny \
  --protocol '*' \
  --source-address-prefix '*' \
  --source-port-range '*' \
  --destination-address-prefix '*' \
  --destination-port-range '*'

# Associate NSG with subnet-web
az network vnet subnet update \
  --name subnet-web \
  --vnet-name vnet-hub \
  --resource-group $RG \
  --network-security-group nsg-web
```

#### Create NSG for App Subnet

```bash
# Create NSG for app tier
az network nsg create \
  --name nsg-app \
  --resource-group $RG

# Allow traffic from web subnet only (on port 8080)
az network nsg rule create \
  --nsg-name nsg-app \
  --resource-group $RG \
  --name Allow-From-Web-Tier \
  --priority 100 \
  --direction Inbound \
  --access Allow \
  --protocol Tcp \
  --source-address-prefix 10.1.1.0/24 \
  --source-port-range '*' \
  --destination-address-prefix '*' \
  --destination-port-range 8080

# Associate NSG with subnet-app
az network vnet subnet update \
  --name subnet-app \
  --vnet-name vnet-hub \
  --resource-group $RG \
  --network-security-group nsg-app
```

**Explore:**
- Navigate to `nsg-web` in the portal → **Inbound security rules**
- Notice the default rules at priority 65000-65500 cannot be deleted
- View **Outbound security rules** — AllowInternetOutBound exists by default

---

### 3. Configure VNet Peering

VNet peering is bidirectional — you create one peering object in each VNet.

```bash
# Peer hub → spoke
az network vnet peering create \
  --name hub-to-spoke \
  --vnet-name vnet-hub \
  --resource-group $RG \
  --remote-vnet vnet-spoke \
  --allow-vnet-access true \
  --allow-forwarded-traffic true

# Peer spoke → hub
az network vnet peering create \
  --name spoke-to-hub \
  --vnet-name vnet-spoke \
  --resource-group $RG \
  --remote-vnet vnet-hub \
  --allow-vnet-access true \
  --allow-forwarded-traffic true

# Verify peering status (should show "Connected")
az network vnet peering list \
  --vnet-name vnet-hub \
  --resource-group $RG \
  --output table
```

**Test peering with VMs:**

```bash
# Deploy test VMs in each VNet (no public IPs)
az vm create \
  --name vm-hub \
  --resource-group $RG \
  --image Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest \
  --size Standard_B1s \
  --admin-username azureuser \
  --generate-ssh-keys \
  --vnet-name vnet-hub \
  --subnet subnet-web \
  --public-ip-address "" \
  --nsg ""

az vm create \
  --name vm-spoke \
  --resource-group $RG \
  --image Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest \
  --size Standard_B1s \
  --admin-username azureuser \
  --generate-ssh-keys \
  --vnet-name vnet-spoke \
  --subnet subnet-db \
  --public-ip-address "" \
  --nsg ""

# Get spoke VM private IP
SPOKE_IP=$(az vm show -d --name vm-spoke --resource-group $RG --query privateIps -o tsv)
echo "Spoke VM IP: $SPOKE_IP"

# Test connectivity from hub to spoke via run-command
az vm run-command invoke \
  --name vm-hub \
  --resource-group $RG \
  --command-id RunShellScript \
  --scripts "ping -c 3 $SPOKE_IP"
```

---

### 4. Configure Private DNS Zone

```bash
# Create a private DNS zone
az network private-dns zone create \
  --name "lab.internal" \
  --resource-group $RG

# Link the private DNS zone to vnet-hub with auto-registration
az network private-dns link vnet create \
  --name link-hub \
  --resource-group $RG \
  --zone-name lab.internal \
  --virtual-network vnet-hub \
  --registration-enabled true

# Link to vnet-spoke without auto-registration (for resolution only)
az network private-dns link vnet create \
  --name link-spoke \
  --resource-group $RG \
  --zone-name lab.internal \
  --virtual-network vnet-spoke \
  --registration-enabled false

# Manually add an A record
az network private-dns record-set a create \
  --name "web01" \
  --zone-name lab.internal \
  --resource-group $RG

az network private-dns record-set a add-record \
  --record-set-name "web01" \
  --zone-name lab.internal \
  --resource-group $RG \
  --ipv4-address 10.1.1.10

# List all records in the zone
az network private-dns record-set list \
  --zone-name lab.internal \
  --resource-group $RG \
  --output table
```

**Explore:**
- From `vm-hub`: `nslookup web01.lab.internal` — should resolve to 10.1.1.10
- From `vm-hub`: `nslookup vm-hub.lab.internal` — should auto-resolve (auto-registration enabled)
- From `vm-spoke`: `nslookup web01.lab.internal` — should also resolve (resolution link)

---

### 5. Configure User-Defined Routes and Hub-Spoke Transit

#### Why UDRs are needed

By default, Azure automatically creates system routes that allow all subnets within a VNet to communicate, and also allows peered VNets to reach each other. However, **VNet peering is non-transitive**: if Spoke A is peered to the hub and Spoke B is peered to the hub, Spoke A and Spoke B **cannot reach each other** through the hub — traffic simply has no path.

```
vnet-spoke (10.2.0.0/16)  ←——peering——→  vnet-hub (10.1.0.0/16)  ←——peering——→  vnet-spoke2 (10.3.0.0/16)
                                                     ↑
                              VMs here see both spokes but spokes CANNOT see each other
```

To allow spoke-to-spoke communication, you need:

1. A **Network Virtual Appliance (NVA)** in the hub — a VM that forwards packets between spokes. Azure Firewall is the managed NVA option; a Linux VM with IP forwarding enabled is the DIY option.
2. **UDRs on both spoke subnets** pointing the other spoke's address range at the NVA's private IP.
3. **IP forwarding enabled** on the NVA — at both the Azure NIC level and the OS level.

#### Step 5a: Add a second spoke and peer it to the hub

```bash
# Second spoke VNet
az network vnet create \
  --name vnet-spoke2 \
  --resource-group $RG \
  --location $LOCATION \
  --address-prefix 10.3.0.0/16

az network vnet subnet create \
  --name subnet-app2 \
  --vnet-name vnet-spoke2 \
  --resource-group $RG \
  --address-prefix 10.3.1.0/24

# Peer hub ↔ spoke2
az network vnet peering create \
  --name hub-to-spoke2 \
  --vnet-name vnet-hub \
  --resource-group $RG \
  --remote-vnet vnet-spoke2 \
  --allow-vnet-access true \
  --allow-forwarded-traffic true

az network vnet peering create \
  --name spoke2-to-hub \
  --vnet-name vnet-spoke2 \
  --resource-group $RG \
  --remote-vnet vnet-hub \
  --allow-vnet-access true \
  --allow-forwarded-traffic true

# Deploy a test VM in spoke2
az vm create \
  --name vm-spoke2 \
  --resource-group $RG \
  --image Ubuntu2204 \
  --size Standard_B1s \
  --admin-username azureuser \
  --generate-ssh-keys \
  --vnet-name vnet-spoke2 \
  --subnet subnet-app2 \
  --public-ip-address "" \
  --nsg ""
```

At this point, `vm-spoke` (10.2.x.x) **cannot reach** `vm-spoke2` (10.3.x.x) even though both are peered to the hub. Traffic has no route.

#### Step 5b: Deploy and configure an NVA in the hub

The NVA sits in the hub and forwards packets between the two spokes. Here we use a Linux VM as a simple NVA. In production this would typically be Azure Firewall or a third-party appliance.

```bash
# Deploy the NVA VM into the hub (subnet-app, 10.1.2.0/24)
# Using a static private IP so UDRs can reference it reliably
az vm create \
  --name vm-nva \
  --resource-group $RG \
  --image Ubuntu2204 \
  --size Standard_B1s \
  --admin-username azureuser \
  --generate-ssh-keys \
  --vnet-name vnet-hub \
  --subnet subnet-app \
  --private-ip-address 10.1.2.4 \
  --public-ip-address "" \
  --nsg ""
```

**IP forwarding — two layers are required:**

| Layer | What it does | How to enable |
|-------|-------------|---------------|
| **Azure NIC level** | Allows the NIC to receive packets not addressed to its own IP | `az network nic update --enable-ip-forwarding true` |
| **OS level (Linux)** | Allows the Linux kernel to route packets between interfaces | `sysctl -w net.ipv4.ip_forward=1` |

Both must be enabled. If only the Azure NIC level is enabled, Azure will accept the packets from the wire but the Linux kernel will drop them (it only processes packets addressed to itself). If only the OS level is enabled, Azure's NIC will silently drop packets not addressed to the NIC's own IP before they even reach the VM.

```bash
# 1. Enable IP forwarding at the Azure NIC level
NVA_NIC=$(az vm nic list --vm-name vm-nva --resource-group $RG --query '[0].id' -o tsv)

az network nic update \
  --ids $NVA_NIC \
  --ip-forwarding true

# Verify
az network nic show --ids $NVA_NIC --query "enableIpForwarding"
# Expected: true

# 2. Enable IP forwarding at the Linux OS level (inside the VM)
az vm run-command invoke \
  --name vm-nva \
  --resource-group $RG \
  --command-id RunShellScript \
  --scripts "
    # Enable immediately
    sysctl -w net.ipv4.ip_forward=1

    # Persist across reboots
    echo 'net.ipv4.ip_forward=1' >> /etc/sysctl.conf

    # Confirm
    sysctl net.ipv4.ip_forward
  "
```

#### Step 5c: Create UDRs on both spoke subnets

This is the critical step. For spoke-to-spoke transit via the NVA, **both spoke subnets need a UDR** — one to reach the other spoke going forward, and one to route the return traffic back. Without the return route, packets travel one way but responses never arrive (asymmetric routing).

```
vm-spoke (10.2.1.x) → [UDR: 10.3.0.0/16 → NVA 10.1.2.4] → vm-nva → vm-spoke2 (10.3.1.x)
vm-spoke2 (10.3.1.x) → [UDR: 10.2.0.0/16 → NVA 10.1.2.4] → vm-nva → vm-spoke (10.2.1.x)
```

```bash
# --- Route table for spoke1 (vnet-spoke, 10.2.0.0/16) ---
az network route-table create \
  --name rt-spoke1 \
  --resource-group $RG

# Route: traffic destined for spoke2 (10.3.0.0/16) → NVA
az network route-table route create \
  --route-table-name rt-spoke1 \
  --resource-group $RG \
  --name route-to-spoke2 \
  --address-prefix 10.3.0.0/16 \
  --next-hop-type VirtualAppliance \
  --next-hop-ip-address 10.1.2.4

# Associate with spoke1's subnet
az network vnet subnet update \
  --name subnet-db \
  --vnet-name vnet-spoke \
  --resource-group $RG \
  --route-table rt-spoke1


# --- Route table for spoke2 (vnet-spoke2, 10.3.0.0/16) ---
az network route-table create \
  --name rt-spoke2 \
  --resource-group $RG

# Route: traffic destined for spoke1 (10.2.0.0/16) → NVA
az network route-table route create \
  --route-table-name rt-spoke2 \
  --resource-group $RG \
  --name route-to-spoke1 \
  --address-prefix 10.2.0.0/16 \
  --next-hop-type VirtualAppliance \
  --next-hop-ip-address 10.1.2.4

# Associate with spoke2's subnet
az network vnet subnet update \
  --name subnet-app2 \
  --vnet-name vnet-spoke2 \
  --resource-group $RG \
  --route-table rt-spoke2
```

> **Are UDRs needed in both directions?**
> Yes. Each UDR only affects traffic leaving that subnet. A UDR on spoke1 routes *outbound* traffic toward spoke2 via the NVA. Without a matching UDR on spoke2, the *return* packets (spoke2 → spoke1) take Azure's default direct peering path back — but the NVA is sitting in the middle on the forward path. This **asymmetric routing** breaks stateful connections. Both spokes must point at the NVA for the round-trip to work correctly.

#### Step 5d: Verify effective routes and test connectivity

```bash
# Check effective routes on spoke1 VM — should show 10.3.0.0/16 → VirtualAppliance
SPOKE1_NIC=$(az vm nic list --vm-name vm-spoke --resource-group $RG --query '[0].id' -o tsv)
az network nic show-effective-route-table --ids $SPOKE1_NIC --output table

# Check effective routes on spoke2 VM — should show 10.2.0.0/16 → VirtualAppliance
SPOKE2_NIC=$(az vm nic list --vm-name vm-spoke2 --resource-group $RG --query '[0].id' -o tsv)
az network nic show-effective-route-table --ids $SPOKE2_NIC --output table

# Test connectivity: spoke1 → spoke2 via NVA
SPOKE2_IP=$(az vm show -d --name vm-spoke2 --resource-group $RG --query privateIps -o tsv)

az vm run-command invoke \
  --name vm-spoke \
  --resource-group $RG \
  --command-id RunShellScript \
  --scripts "ping -c 4 $SPOKE2_IP"
```

**What to look for in effective routes:**

| Destination | Next Hop Type | Source | Meaning |
|-------------|--------------|--------|---------|
| 10.2.0.0/16 | VNetLocal | Default | Direct VNet range |
| 10.1.0.0/16 | VNetPeering | Default | Hub via peering |
| 10.3.0.0/16 | VirtualAppliance (10.1.2.4) | **User** | UDR — spoke2 via NVA |
| 0.0.0.0/0 | Internet | Default | Default internet route |

The `User` source in the last column confirms your UDR is active and overriding system routes.

---

### 6. Network Watcher Verification

```bash
# Enable Network Watcher for the region (if not already enabled)
az network watcher configure \
  --locations eastus \
  --resource-group NetworkWatcherRG \
  --enabled true

# IP flow verify: check if NSG would allow HTTP from internet to vm-hub
HUB_NIC=$(az vm nic list --vm-name vm-hub --resource-group $RG --query '[0].id' -o tsv)

az network watcher test-ip-flow \
  --vm vm-hub \
  --resource-group $RG \
  --direction Inbound \
  --local 10.1.1.x:80 \
  --remote 1.2.3.4:12345 \
  --protocol TCP

# Connection troubleshoot: test SSH from hub to spoke
az network watcher test-connectivity \
  --source-resource vm-hub \
  --source-resource-group $RG \
  --dest-resource vm-spoke \
  --dest-resource-group $RG \
  --protocol Tcp \
  --dest-port 22
```

---

## Cleanup

```bash
az group delete --name $RG --yes --no-wait
echo "Resource group deletion initiated"
```

---

## Key Takeaways

| Topic | Key Point |
|-------|-----------|
| NSG rules | Lower priority number = evaluated first; first match wins; default rules cannot be deleted |
| VNet peering | Must create peering in both directions; non-transitive — Spoke A and Spoke B cannot reach each other through the hub without UDRs + NVA |
| Private DNS zone | VNet link with registration-enabled=true enables auto-registration of VMs |
| UDR | Overrides default Azure routing; `VirtualAppliance` next-hop type sends traffic to an NVA IP |
| Hub-spoke transit | Requires UDRs on **both** spoke subnets pointing at the NVA — asymmetric routing breaks stateful connections |
| IP forwarding (NIC) | Must enable `--ip-forwarding true` on the NVA's Azure NIC or Azure drops non-self-addressed packets at the wire |
| IP forwarding (OS) | Must also enable `net.ipv4.ip_forward=1` in the Linux kernel or the OS drops forwarded packets; persist in `/etc/sysctl.conf` |
| Effective routes | `az network nic show-effective-route-table` shows active routes; `User` source confirms a UDR is applied |
| Network Watcher | IP flow verify answers NSG allow/deny; connection troubleshoot tests end-to-end path |
| Subnet reserved IPs | First 4 + last 1 = 5 reserved; /29 = only 3 usable hosts |

## References

- [Virtual Network documentation](https://learn.microsoft.com/en-us/azure/virtual-network/)
- [NSG overview](https://learn.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview)
- [VNet peering](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-peering-overview)
- [Azure private DNS](https://learn.microsoft.com/en-us/azure/dns/private-dns-overview)
- [User-defined routes](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-udr-overview)
- [Network virtual appliances](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-scenario-udr-gw-nva)
- [IP forwarding for NVAs](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-network-interface#enable-or-disable-ip-forwarding)
- [Hub-spoke topology in Azure](https://learn.microsoft.com/en-us/azure/architecture/networking/architecture/hub-spoke)
- [Network Watcher](https://learn.microsoft.com/en-us/azure/network-watcher/)
