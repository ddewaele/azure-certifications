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
  --image Ubuntu2204 \
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
  --image Ubuntu2204 \
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

### 5. Configure User-Defined Routes

```bash
# Create a route table
az network route-table create \
  --name rt-web \
  --resource-group $RG

# Add a custom route to direct traffic to 0.0.0.0/0 through an NVA (simulated here as a VM IP)
# In production, this would be an NVA or Azure Firewall private IP
az network route-table route create \
  --route-table-name rt-web \
  --resource-group $RG \
  --name route-to-internet-via-nva \
  --address-prefix 0.0.0.0/0 \
  --next-hop-type VirtualAppliance \
  --next-hop-ip-address 10.1.2.4

# Associate route table with subnet-web
az network vnet subnet update \
  --name subnet-web \
  --vnet-name vnet-hub \
  --resource-group $RG \
  --route-table rt-web

# View effective routes on a NIC
VM_NIC=$(az vm nic list --vm-name vm-hub --resource-group $RG --query '[0].id' -o tsv)
az network nic show-effective-route-table --ids $VM_NIC --output table
```

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
| VNet peering | Must create peering in both directions; non-transitive (A-B-C ≠ A-C) |
| Private DNS zone | VNet link with registration-enabled=true enables auto-registration of VMs |
| UDR | Overrides default Azure routing; used to route through NVA or Firewall |
| Network Watcher | IP flow verify answers NSG allow/deny; connection troubleshoot tests end-to-end |
| Subnet reserved IPs | First 4 + last 1 = 5 reserved; /29 = only 3 usable hosts |

## References

- [Virtual Network documentation](https://learn.microsoft.com/en-us/azure/virtual-network/)
- [NSG overview](https://learn.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview)
- [VNet peering](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-peering-overview)
- [Azure private DNS](https://learn.microsoft.com/en-us/azure/dns/private-dns-overview)
- [User-defined routes](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-udr-overview)
- [Network Watcher](https://learn.microsoft.com/en-us/azure/network-watcher/)
