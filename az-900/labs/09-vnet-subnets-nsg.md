# Lab 09 — VNet, Subnets, and NSGs

**Concepts covered:** Virtual networks, public vs private subnets, Network Security Groups, bastion/jump host pattern, intra-VNet communication, subnet isolation

**Estimated cost:** ~$0.20–0.40 (2 VMs — delete promptly)

---

## Background

Azure doesn't have a formal "private subnet" concept the way AWS does. Instead, a subnet is made "private" by:
- Not assigning public IPs to VMs inside it
- Using NSG rules to block inbound traffic from the internet

The pattern in this lab:
```
Internet
    │
    ▼
[Public Subnet]  ← NSG allows SSH from internet
  jump-vm        ← Public IP, SSH accessible
    │  (private IP)
    ▼
[Private Subnet] ← NSG blocks all inbound from internet
  app-vm         ← No public IP, only reachable from jump-vm
```

---

## Setup

```bash
RESOURCE_GROUP="az900-lab09-rg"
LOCATION="westeurope"
VNET_NAME="lab09-vnet"

az group create --name $RESOURCE_GROUP --location $LOCATION
```

---

## Step 1 — Create a VNet with Two Subnets

```bash
# Create the VNet with an address space
az network vnet create \
  --resource-group $RESOURCE_GROUP \
  --name $VNET_NAME \
  --address-prefix 10.0.0.0/16

# Public subnet — for internet-facing resources
az network vnet subnet create \
  --resource-group $RESOURCE_GROUP \
  --vnet-name $VNET_NAME \
  --name public-subnet \
  --address-prefix 10.0.1.0/24

# Private subnet — for internal resources only
az network vnet subnet create \
  --resource-group $RESOURCE_GROUP \
  --vnet-name $VNET_NAME \
  --name private-subnet \
  --address-prefix 10.0.2.0/24

# Verify
az network vnet subnet list \
  --resource-group $RESOURCE_GROUP \
  --vnet-name $VNET_NAME \
  --output table
```

---

## Step 2 — Create NSGs

### NSG for the public subnet — allow SSH from internet

```bash
az network nsg create \
  --resource-group $RESOURCE_GROUP \
  --name public-nsg

# Allow SSH (port 22) inbound from anywhere
az network nsg rule create \
  --resource-group $RESOURCE_GROUP \
  --nsg-name public-nsg \
  --name allow-ssh-inbound \
  --priority 100 \
  --protocol Tcp \
  --source-address-prefixes '*' \
  --destination-port-ranges 22 \
  --access Allow \
  --direction Inbound

# Allow ICMP (ping) inbound
az network nsg rule create \
  --resource-group $RESOURCE_GROUP \
  --nsg-name public-nsg \
  --name allow-icmp-inbound \
  --priority 110 \
  --protocol Icmp \
  --source-address-prefixes '*' \
  --destination-port-ranges '*' \
  --access Allow \
  --direction Inbound
```

### NSG for the private subnet — block internet, allow from VNet only

```bash
az network nsg create \
  --resource-group $RESOURCE_GROUP \
  --name private-nsg

# Allow all traffic from within the VNet
az network nsg rule create \
  --resource-group $RESOURCE_GROUP \
  --nsg-name private-nsg \
  --name allow-vnet-inbound \
  --priority 100 \
  --source-address-prefixes VirtualNetwork \
  --destination-port-ranges '*' \
  --protocol '*' \
  --access Allow \
  --direction Inbound

# Deny all other inbound traffic (this is actually the default, but making it explicit)
az network nsg rule create \
  --resource-group $RESOURCE_GROUP \
  --nsg-name private-nsg \
  --name deny-internet-inbound \
  --priority 200 \
  --source-address-prefixes Internet \
  --destination-port-ranges '*' \
  --protocol '*' \
  --access Deny \
  --direction Inbound

# View all rules (including Azure defaults)
az network nsg show \
  --resource-group $RESOURCE_GROUP \
  --name private-nsg \
  --query "securityRules" \
  --output table
```

### Attach NSGs to Subnets

```bash
az network vnet subnet update \
  --resource-group $RESOURCE_GROUP \
  --vnet-name $VNET_NAME \
  --name public-subnet \
  --network-security-group public-nsg

az network vnet subnet update \
  --resource-group $RESOURCE_GROUP \
  --vnet-name $VNET_NAME \
  --name private-subnet \
  --network-security-group private-nsg
```

---

## Step 3 — Create the Jump Host (Public Subnet)

```bash
# Create a public IP for the jump host
az network public-ip create \
  --resource-group $RESOURCE_GROUP \
  --name jump-pip \
  --sku Standard \
  --allocation-method Static

# Create the NIC in the public subnet
az network nic create \
  --resource-group $RESOURCE_GROUP \
  --name jump-nic \
  --vnet-name $VNET_NAME \
  --subnet public-subnet \
  --public-ip-address jump-pip \
  --network-security-group public-nsg

# Create the VM
az vm create \
  --resource-group $RESOURCE_GROUP \
  --name jump-vm \
  --nics jump-nic \
  --image Ubuntu2204 \
  --size Standard_B1s \
  --admin-username azureuser \
  --generate-ssh-keys \
  --no-wait

JUMP_IP=$(az network public-ip show \
  --resource-group $RESOURCE_GROUP \
  --name jump-pip \
  --query ipAddress \
  --output tsv)

echo "Jump host public IP: $JUMP_IP"
```

---

## Step 4 — Create the App VM (Private Subnet — No Public IP)

```bash
# NIC in private subnet — no public IP attached
az network nic create \
  --resource-group $RESOURCE_GROUP \
  --name app-nic \
  --vnet-name $VNET_NAME \
  --subnet private-subnet \
  --network-security-group private-nsg
  # note: no --public-ip-address

# Create the VM
az vm create \
  --resource-group $RESOURCE_GROUP \
  --name app-vm \
  --nics app-nic \
  --image Ubuntu2204 \
  --size Standard_B1s \
  --admin-username azureuser \
  --generate-ssh-keys \
  --no-wait

# Wait for both VMs
az vm wait --resource-group $RESOURCE_GROUP --name jump-vm --created
az vm wait --resource-group $RESOURCE_GROUP --name app-vm --created

# Get the private IP of app-vm
APP_PRIVATE_IP=$(az vm show \
  --resource-group $RESOURCE_GROUP \
  --name app-vm \
  --show-details \
  --query privateIps \
  --output tsv)

echo "app-vm private IP: $APP_PRIVATE_IP"
echo "app-vm has NO public IP — unreachable from internet directly"
```

---

## Step 5 — Test Connectivity

### From your machine — jump host is reachable, app-vm is not

```bash
# Jump host — should work
ssh -o StrictHostKeyChecking=no azureuser@$JUMP_IP "echo 'Connected to jump-vm'"

# app-vm from internet — should NOT work (no public IP)
ssh azureuser@$APP_PRIVATE_IP  # this will fail — private IP not routable from internet
```

### From jump-vm → app-vm (via private IP — same VNet)

```bash
# Copy your SSH key to the jump host so it can reach the app-vm
# (in production you'd use a proper SSH agent or bastion)
ssh-copy-id -i ~/.ssh/id_rsa.pub azureuser@$JUMP_IP

# SSH to jump-vm, then hop to app-vm using its private IP
ssh -o StrictHostKeyChecking=no azureuser@$JUMP_IP \
  "ssh -o StrictHostKeyChecking=no azureuser@$APP_PRIVATE_IP 'hostname && ip addr show eth0 | grep inet'"
```

The app-vm is reachable from inside the VNet but not from the internet — this is the private subnet pattern.

---

## Step 6 — Inspect Effective NSG Rules

Azure shows you the final effective rules (NSG rules + defaults) for a given NIC:

```bash
# Effective rules for the jump host NIC
az network nic show-effective-nsg \
  --resource-group $RESOURCE_GROUP \
  --name jump-nic \
  --query "effectiveNetworkSecurityGroups[].effectiveSecurityRules[].{name:name,access:access,direction:direction,priority:priority,src:sourceAddressPrefix,dst:destinationAddressPrefix,port:destinationPortRange}" \
  --output table

# Effective rules for the app NIC
az network nic show-effective-nsg \
  --resource-group $RESOURCE_GROUP \
  --name app-nic \
  --query "effectiveNetworkSecurityGroups[].effectiveSecurityRules[].{name:name,access:access,direction:direction,priority:priority,src:sourceAddressPrefix}" \
  --output table
```

---

## Step 7 — Add an NSG Rule Dynamically

Suppose you need to temporarily allow HTTP on the jump host:

```bash
# Add rule
az network nsg rule create \
  --resource-group $RESOURCE_GROUP \
  --nsg-name public-nsg \
  --name allow-http \
  --priority 120 \
  --protocol Tcp \
  --destination-port-ranges 80 \
  --access Allow \
  --direction Inbound

az network nsg rule list \
  --resource-group $RESOURCE_GROUP \
  --nsg-name public-nsg \
  --output table

# Remove it when done
az network nsg rule delete \
  --resource-group $RESOURCE_GROUP \
  --nsg-name public-nsg \
  --name allow-http
```

NSG rules take effect within seconds — no reboot required.

---

## Step 8 — VNet Peering (Connect Two VNets)

```bash
# Create a second VNet to simulate a separate environment (e.g., shared services)
az network vnet create \
  --resource-group $RESOURCE_GROUP \
  --name shared-vnet \
  --address-prefix 10.1.0.0/16 \
  --subnet-name default \
  --subnet-prefix 10.1.0.0/24

# Peer lab09-vnet → shared-vnet
az network vnet peering create \
  --resource-group $RESOURCE_GROUP \
  --name lab09-to-shared \
  --vnet-name $VNET_NAME \
  --remote-vnet shared-vnet \
  --allow-vnet-access

# Peer shared-vnet → lab09-vnet (peering must be created in both directions)
az network vnet peering create \
  --resource-group $RESOURCE_GROUP \
  --name shared-to-lab09 \
  --vnet-name shared-vnet \
  --remote-vnet $VNET_NAME \
  --allow-vnet-access

# Verify peering status — should show 'Connected'
az network vnet peering list \
  --resource-group $RESOURCE_GROUP \
  --vnet-name $VNET_NAME \
  --output table
```

---

## Key Concepts

| Concept | Azure implementation |
|---|---|
| Public subnet | Subnet + VMs with public IPs + NSG allowing inbound |
| Private subnet | Subnet + VMs with no public IP + NSG blocking internet inbound |
| Jump host / Bastion | A public VM used as the gateway to private VMs |
| NSG | Stateful firewall rules at subnet or NIC level |
| VNet peering | Connect VNets — non-transitive, uses Azure backbone |
| Default NSG rules | Azure always allows VNet-to-VNet and denies Internet inbound by default |

---

## Cleanup

```bash
az group delete --name $RESOURCE_GROUP --yes --no-wait
```
