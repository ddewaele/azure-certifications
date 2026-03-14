# Lab 10 — Public and Private IPs

**Concepts covered:** Static vs dynamic IPs, public IP SKUs, private IP assignment, NAT gateway for outbound internet from private subnets

**Estimated cost:** ~$0.10–0.20 (delete promptly — static IPs and NAT gateway have a small hourly cost)

---

## Background

Every Azure VM has a **private IP** (from the subnet CIDR). Optionally, it also has a **public IP** for internet access. Understanding how these work — and how resources in private subnets reach the internet — is a key networking concept.

```
Public IP  →  NIC  →  VM (has a private IP from the subnet)
                         │
              No public IP VMs can only reach internet via:
                    - NAT Gateway (recommended)
                    - Load Balancer outbound rules
                    - Azure Firewall
```

---

## Setup

```bash
RESOURCE_GROUP="az900-lab10-rg"
LOCATION="westeurope"

az group create --name $RESOURCE_GROUP --location $LOCATION

az network vnet create \
  --resource-group $RESOURCE_GROUP \
  --name lab10-vnet \
  --address-prefix 10.0.0.0/16

az network vnet subnet create \
  --resource-group $RESOURCE_GROUP \
  --vnet-name lab10-vnet \
  --name public-subnet \
  --address-prefix 10.0.1.0/24

az network vnet subnet create \
  --resource-group $RESOURCE_GROUP \
  --vnet-name lab10-vnet \
  --name private-subnet \
  --address-prefix 10.0.2.0/24
```

---

## Part A — Public IPs

### A1 — Dynamic vs Static Public IPs

```bash
# Dynamic IP — assigned when NIC is attached, may change if VM is deallocated
az network public-ip create \
  --resource-group $RESOURCE_GROUP \
  --name dynamic-pip \
  --sku Basic \
  --allocation-method Dynamic

# Static IP — reserved and never changes even across deallocations
az network public-ip create \
  --resource-group $RESOURCE_GROUP \
  --name static-pip \
  --sku Standard \
  --allocation-method Static

# Static IP is assigned immediately
az network public-ip show \
  --resource-group $RESOURCE_GROUP \
  --name static-pip \
  --query "{ip:ipAddress, sku:sku.name, allocation:publicIpAllocationMethod}" \
  --output table

# Dynamic IP has no address yet (not attached)
az network public-ip show \
  --resource-group $RESOURCE_GROUP \
  --name dynamic-pip \
  --query "{ip:ipAddress, sku:sku.name, allocation:publicIpAllocationMethod}" \
  --output table
```

### A2 — Public IP SKUs Compared

| | Basic SKU | Standard SKU |
|---|---|---|
| Allocation | Static or Dynamic | Static only |
| Zone redundancy | No | Yes |
| Security | Open by default | Closed by default (needs NSG) |
| Load balancer | Basic only | Standard only |
| Recommended | No (being retired) | Yes |

### A3 — Attach a Static IP to a VM and Observe Persistence

```bash
# Create a VM with the static IP
az network nic create \
  --resource-group $RESOURCE_GROUP \
  --name static-nic \
  --vnet-name lab10-vnet \
  --subnet public-subnet \
  --public-ip-address static-pip

az vm create \
  --resource-group $RESOURCE_GROUP \
  --name static-vm \
  --nics static-nic \
  --image Ubuntu2204 \
  --size Standard_B1s \
  --admin-username azureuser \
  --generate-ssh-keys

# Record the IP
STATIC_IP=$(az network public-ip show \
  --resource-group $RESOURCE_GROUP \
  --name static-pip \
  --query ipAddress --output tsv)
echo "Static IP: $STATIC_IP"

# Deallocate the VM
az vm deallocate --resource-group $RESOURCE_GROUP --name static-vm

# Check the IP — it's still reserved (that's what static means)
az network public-ip show \
  --resource-group $RESOURCE_GROUP \
  --name static-pip \
  --query ipAddress --output tsv
# Same IP as before

# Start the VM again
az vm start --resource-group $RESOURCE_GROUP --name static-vm

# Still the same IP
az network public-ip show \
  --resource-group $RESOURCE_GROUP \
  --name static-pip \
  --query ipAddress --output tsv
```

Use static IPs when: DNS records point to it, firewall allowlists it, or any other system depends on the IP staying the same.

---

## Part B — Private IPs

### B1 — Default Dynamic Private IP

By default, VMs get a private IP dynamically from the subnet range via DHCP.

```bash
# Create a VM without a public IP — it gets a dynamic private IP
az network nic create \
  --resource-group $RESOURCE_GROUP \
  --name private-nic \
  --vnet-name lab10-vnet \
  --subnet private-subnet
  # no --public-ip-address

az vm create \
  --resource-group $RESOURCE_GROUP \
  --name private-vm \
  --nics private-nic \
  --image Ubuntu2204 \
  --size Standard_B1s \
  --admin-username azureuser \
  --generate-ssh-keys

# View the private IP assignment
az network nic show \
  --resource-group $RESOURCE_GROUP \
  --name private-nic \
  --query "ipConfigurations[0].{privateIP:privateIPAddress, allocationMethod:privateIPAllocationMethod}" \
  --output table
```

### B2 — Set a Static Private IP

Useful for DNS servers, load balancer backends, or anything requiring a predictable internal address.

```bash
# Get the current private IP
CURRENT_IP=$(az network nic show \
  --resource-group $RESOURCE_GROUP \
  --name private-nic \
  --query "ipConfigurations[0].privateIPAddress" \
  --output tsv)

echo "Current private IP: $CURRENT_IP"

# Set a specific static private IP within the subnet range
az network nic ip-config update \
  --resource-group $RESOURCE_GROUP \
  --nic-name private-nic \
  --name ipconfig1 \
  --private-ip-address 10.0.2.10 \
  --private-ip-address-version IPv4

az network nic show \
  --resource-group $RESOURCE_GROUP \
  --name private-nic \
  --query "ipConfigurations[0].{privateIP:privateIPAddress, allocationMethod:privateIPAllocationMethod}" \
  --output table
```

### B3 — Multiple Private IPs on One NIC

A single NIC can have multiple IP configurations — useful for hosting multiple services on one VM.

```bash
# Add a second IP config to the NIC
az network nic ip-config create \
  --resource-group $RESOURCE_GROUP \
  --nic-name private-nic \
  --name ipconfig2 \
  --private-ip-address 10.0.2.11

az network nic show \
  --resource-group $RESOURCE_GROUP \
  --name private-nic \
  --query "ipConfigurations[].{name:name,ip:privateIPAddress}" \
  --output table
```

---

## Part C — NAT Gateway (Outbound Internet for Private VMs)

A VM with no public IP cannot reach the internet by default. A NAT Gateway provides outbound internet access to entire subnets without exposing VMs to inbound traffic.

```
private-vm (10.0.2.10, no public IP)
        │ outbound traffic
        ▼
   NAT Gateway (has a public IP — appears as source for outbound connections)
        │
        ▼
    Internet
```

### C1 — Create a NAT Gateway

```bash
# Create a public IP for the NAT Gateway
az network public-ip create \
  --resource-group $RESOURCE_GROUP \
  --name nat-pip \
  --sku Standard \
  --allocation-method Static

# Create the NAT Gateway
az network nat gateway create \
  --resource-group $RESOURCE_GROUP \
  --name lab10-nat \
  --public-ip-addresses nat-pip \
  --idle-timeout 10

# Associate NAT Gateway with the private subnet
az network vnet subnet update \
  --resource-group $RESOURCE_GROUP \
  --vnet-name lab10-vnet \
  --name private-subnet \
  --nat-gateway lab10-nat

NAT_IP=$(az network public-ip show \
  --resource-group $RESOURCE_GROUP \
  --name nat-pip \
  --query ipAddress --output tsv)

echo "NAT Gateway public IP: $NAT_IP"
echo "All outbound internet traffic from private-subnet will appear as $NAT_IP"
```

### C2 — Test Outbound Connectivity from Private VM

The private VM has no public IP, so we need to reach it via the jump host (or use `az vm run-command`):

```bash
# Use run-command to execute inside the private VM without SSH access from internet
az vm run-command invoke \
  --resource-group $RESOURCE_GROUP \
  --name private-vm \
  --command-id RunShellScript \
  --scripts "curl -s https://api.ipify.org"
```

The IP returned should match your NAT Gateway's public IP — that's the outbound IP the internet sees.

### C3 — NSG + NAT Gateway: Inbound vs Outbound

```bash
# Create an NSG that blocks ALL inbound from internet (private VM stays private)
az network nsg create \
  --resource-group $RESOURCE_GROUP \
  --name private-nsg

az network nsg rule create \
  --resource-group $RESOURCE_GROUP \
  --nsg-name private-nsg \
  --name deny-internet-inbound \
  --priority 100 \
  --source-address-prefixes Internet \
  --destination-port-ranges '*' \
  --protocol '*' \
  --access Deny \
  --direction Inbound

az network vnet subnet update \
  --resource-group $RESOURCE_GROUP \
  --vnet-name lab10-vnet \
  --name private-subnet \
  --network-security-group private-nsg

# Result:
# Inbound from internet: BLOCKED by NSG
# Outbound to internet: ALLOWED via NAT Gateway
# Inbound from VNet: ALLOWED (Azure default rule)
echo "Private VM: can reach internet but cannot be reached from internet"
```

---

## Summary: IP and Connectivity Patterns

| Scenario | Config | Inbound from internet | Outbound to internet |
|---|---|---|---|
| Public VM | Public IP + NSG allow | Yes (via NSG rules) | Yes (via public IP) |
| Private VM (no internet) | No public IP, no NAT | No | No |
| Private VM (outbound only) | No public IP + NAT Gateway | No | Yes (via NAT) |
| Jump host | Public IP + NSG allow SSH only | SSH only | Yes |

---

## Cleanup

```bash
az group delete --name $RESOURCE_GROUP --yes --no-wait
```
