# Lab 11 — DNS (Public and Private Zones)

**Concepts covered:** Azure public DNS zones, private DNS zones, split-horizon DNS, VM hostname resolution within a VNet, private endpoints DNS

**Estimated cost:** ~$0.05 (DNS zones are cheap — delete promptly)

---

## Background

Azure DNS has two distinct use cases:

| | Public DNS Zone | Private DNS Zone |
|---|---|---|
| Resolves for | Anyone on the internet | Resources within a VNet only |
| Use case | `mysite.com` → public IP | `app-vm.internal` → private IP |
| Registration | You delegate your domain | Linked to a VNet |
| Accessible from | Everywhere | Only linked VNets |

**Split-horizon DNS**: the same domain name resolves to different IPs depending on where the query originates — a private IP from inside the VNet, a public IP from the internet.

---

## Setup

```bash
RESOURCE_GROUP="az900-lab11-rg"
LOCATION="westeurope"

az group create --name $RESOURCE_GROUP --location $LOCATION

# VNet for private DNS experiments
az network vnet create \
  --resource-group $RESOURCE_GROUP \
  --name lab11-vnet \
  --address-prefix 10.0.0.0/16 \
  --subnet-name default \
  --subnet-prefix 10.0.0.0/24
```

---

## Part A — Public DNS Zone

A public DNS zone hosts records for an internet-facing domain. You own the domain and delegate NS records to Azure.

> **Note:** You need to own a domain to fully test public DNS delegation. This section shows how to manage records — even without a domain, the records are created and you can query them via Azure's nameservers.

### A1 — Create a Public Zone

```bash
# Using a domain you own — replace with your actual domain
# If you don't have one, use a placeholder to see how it works
PUBLIC_ZONE="myazuredomain.example.com"

az network dns zone create \
  --resource-group $RESOURCE_GROUP \
  --name $PUBLIC_ZONE

# View the zone's authoritative nameservers
# These are what you'd put as NS records in your registrar
az network dns zone show \
  --resource-group $RESOURCE_GROUP \
  --name $PUBLIC_ZONE \
  --query "nameServers" \
  --output table
```

### A2 — Create DNS Records

```bash
# A record — hostname → IPv4
az network dns record-set a create \
  --resource-group $RESOURCE_GROUP \
  --zone-name $PUBLIC_ZONE \
  --name www \
  --ttl 300

az network dns record-set a add-record \
  --resource-group $RESOURCE_GROUP \
  --zone-name $PUBLIC_ZONE \
  --record-set-name www \
  --ipv4-address 203.0.113.10

# CNAME — alias to another hostname
az network dns record-set cname create \
  --resource-group $RESOURCE_GROUP \
  --zone-name $PUBLIC_ZONE \
  --name blog \
  --ttl 300

az network dns record-set cname set-record \
  --resource-group $RESOURCE_GROUP \
  --zone-name $PUBLIC_ZONE \
  --record-set-name blog \
  --cname www.$PUBLIC_ZONE

# MX record — mail server
az network dns record-set mx create \
  --resource-group $RESOURCE_GROUP \
  --zone-name $PUBLIC_ZONE \
  --name "@" \
  --ttl 3600

az network dns record-set mx add-record \
  --resource-group $RESOURCE_GROUP \
  --zone-name $PUBLIC_ZONE \
  --record-set-name "@" \
  --exchange mail.$PUBLIC_ZONE \
  --preference 10

# TXT record — SPF, domain verification, etc.
az network dns record-set txt create \
  --resource-group $RESOURCE_GROUP \
  --zone-name $PUBLIC_ZONE \
  --name "@" \
  --ttl 300

az network dns record-set txt add-record \
  --resource-group $RESOURCE_GROUP \
  --zone-name $PUBLIC_ZONE \
  --record-set-name "@" \
  --value "v=spf1 include:spf.protection.outlook.com -all"

# List all record sets
az network dns record-set list \
  --resource-group $RESOURCE_GROUP \
  --zone-name $PUBLIC_ZONE \
  --output table
```

### A3 — Query via Azure's Nameservers

Even before delegating your domain, you can test resolution against Azure's nameservers:

```bash
# Get Azure's nameservers for this zone
NS=$(az network dns zone show \
  --resource-group $RESOURCE_GROUP \
  --name $PUBLIC_ZONE \
  --query "nameServers[0]" \
  --output tsv)

echo "Azure nameserver: $NS"

# Query Azure's nameserver directly
dig @$NS www.$PUBLIC_ZONE A
dig @$NS blog.$PUBLIC_ZONE CNAME
```

---

## Part B — Private DNS Zone

Private zones resolve inside your VNet only — perfect for internal service discovery.

### B1 — Create a Private Zone

```bash
PRIVATE_ZONE="internal.lab"

az network private-dns zone create \
  --resource-group $RESOURCE_GROUP \
  --name $PRIVATE_ZONE
```

### B2 — Link the Zone to a VNet

Without a VNet link, the private zone doesn't resolve for anything.

```bash
az network private-dns link vnet create \
  --resource-group $RESOURCE_GROUP \
  --zone-name $PRIVATE_ZONE \
  --name lab11-vnet-link \
  --virtual-network lab11-vnet \
  --registration-enabled true   # auto-registers VM hostnames in this zone

# Check the link status
az network private-dns link vnet show \
  --resource-group $RESOURCE_GROUP \
  --zone-name $PRIVATE_ZONE \
  --name lab11-vnet-link \
  --query "{status:virtualNetworkLinkState, registration:registrationEnabled}" \
  --output table
```

`--registration-enabled true` means VMs in the linked VNet automatically get A records in this zone matching their hostname.

### B3 — Create Private DNS Records

```bash
# A record for an internal service
az network private-dns record-set a create \
  --resource-group $RESOURCE_GROUP \
  --zone-name $PRIVATE_ZONE \
  --name api \
  --ttl 300

az network private-dns record-set a add-record \
  --resource-group $RESOURCE_GROUP \
  --zone-name $PRIVATE_ZONE \
  --record-set-name api \
  --ipv4-address 10.0.0.10

# A record for a database
az network private-dns record-set a create \
  --resource-group $RESOURCE_GROUP \
  --zone-name $PRIVATE_ZONE \
  --name db \
  --ttl 300

az network private-dns record-set a add-record \
  --resource-group $RESOURCE_GROUP \
  --zone-name $PRIVATE_ZONE \
  --record-set-name db \
  --ipv4-address 10.0.0.20

# CNAME for a service alias
az network private-dns record-set cname create \
  --resource-group $RESOURCE_GROUP \
  --zone-name $PRIVATE_ZONE \
  --name gateway \
  --ttl 300

az network private-dns record-set cname set-record \
  --resource-group $RESOURCE_GROUP \
  --zone-name $PRIVATE_ZONE \
  --record-set-name gateway \
  --cname api.$PRIVATE_ZONE

# List all records
az network private-dns record-set list \
  --resource-group $RESOURCE_GROUP \
  --zone-name $PRIVATE_ZONE \
  --output table
```

### B4 — Deploy a VM and Test Private DNS Resolution

```bash
# Create a VM in the VNet — it will auto-register in the private zone
az network nsg create --resource-group $RESOURCE_GROUP --name lab11-nsg
az network nsg rule create \
  --resource-group $RESOURCE_GROUP --nsg-name lab11-nsg \
  --name allow-ssh --priority 100 --protocol Tcp \
  --destination-port-ranges 22 --access Allow --direction Inbound

az vm create \
  --resource-group $RESOURCE_GROUP \
  --name dns-test-vm \
  --image Ubuntu2204 \
  --size Standard_B1s \
  --vnet-name lab11-vnet \
  --subnet default \
  --admin-username azureuser \
  --generate-ssh-keys \
  --nsg lab11-nsg

VM_IP=$(az vm show \
  --resource-group $RESOURCE_GROUP \
  --name dns-test-vm \
  --show-details \
  --query publicIps --output tsv)

# SSH in and test DNS resolution
ssh -o StrictHostKeyChecking=no azureuser@$VM_IP << 'EOF'
echo "=== Resolving private zone records ==="
host api.internal.lab
host db.internal.lab

echo ""
echo "=== Auto-registered VM hostname ==="
host dns-test-vm.internal.lab

echo ""
echo "=== Public internet still works ==="
host google.com

echo ""
echo "=== This doesn't resolve from internet — private only ==="
echo "(run: dig api.internal.lab from your local machine — will fail)"
EOF
```

### B5 — Split-Horizon DNS

The same domain name resolves differently inside vs outside the VNet:

```bash
# Create a public zone for the same name
az network dns zone create \
  --resource-group $RESOURCE_GROUP \
  --name $PRIVATE_ZONE

az network dns record-set a add-record \
  --resource-group $RESOURCE_GROUP \
  --zone-name $PRIVATE_ZONE \
  --record-set-name api \
  --ipv4-address 203.0.113.99  # public IP

# Now:
# From internet: api.internal.lab → 203.0.113.99  (public IP, via public zone)
# From inside VNet: api.internal.lab → 10.0.0.10  (private IP, via private zone)
echo "Split-horizon: same name, different answer depending on where you ask from"
```

---

## Part C — Private Endpoints and DNS

When you create a Private Endpoint for a service (e.g., a storage account), you get a private IP for it inside your VNet. Azure recommends creating a private DNS zone so the service's public hostname resolves to the private IP automatically.

```bash
# Create a storage account to use as the target
STORAGE="az900lab11$(openssl rand -hex 4)"
az storage account create \
  --name $STORAGE \
  --resource-group $RESOURCE_GROUP \
  --sku Standard_LRS

STORAGE_ID=$(az storage account show \
  --name $STORAGE \
  --resource-group $RESOURCE_GROUP \
  --query id --output tsv)

# Create a Private Endpoint for blob storage in the VNet
az network private-endpoint create \
  --resource-group $RESOURCE_GROUP \
  --name lab11-blob-pe \
  --vnet-name lab11-vnet \
  --subnet default \
  --private-connection-resource-id $STORAGE_ID \
  --group-id blob \
  --connection-name lab11-blob-conn

# Get the private IP assigned to the endpoint
PE_NIC=$(az network private-endpoint show \
  --resource-group $RESOURCE_GROUP \
  --name lab11-blob-pe \
  --query "networkInterfaces[0].id" --output tsv)

PE_IP=$(az network nic show --ids $PE_NIC \
  --query "ipConfigurations[0].privateIPAddress" --output tsv)

echo "Storage private endpoint IP: $PE_IP"

# Create the private DNS zone for blob storage
az network private-dns zone create \
  --resource-group $RESOURCE_GROUP \
  --name "privatelink.blob.core.windows.net"

# Link to VNet
az network private-dns link vnet create \
  --resource-group $RESOURCE_GROUP \
  --zone-name "privatelink.blob.core.windows.net" \
  --name lab11-blob-dns-link \
  --virtual-network lab11-vnet \
  --registration-enabled false

# Create a DNS record: storage-account-name → private endpoint IP
az network private-dns record-set a create \
  --resource-group $RESOURCE_GROUP \
  --zone-name "privatelink.blob.core.windows.net" \
  --name $STORAGE \
  --ttl 10

az network private-dns record-set a add-record \
  --resource-group $RESOURCE_GROUP \
  --zone-name "privatelink.blob.core.windows.net" \
  --record-set-name $STORAGE \
  --ipv4-address $PE_IP

# From inside the VNet, the storage FQDN now resolves to the private IP
# $STORAGE.blob.core.windows.net → 10.0.0.x (private, never leaves Azure)
# From internet → $STORAGE.blob.core.windows.net → still public IP
ssh -o StrictHostKeyChecking=no azureuser@$VM_IP \
  "host $STORAGE.blob.core.windows.net"
```

---

## Cleanup

```bash
az group delete --name $RESOURCE_GROUP --yes --no-wait
```

---

## What You Learned

| Concept | What it does |
|---|---|
| Public DNS zone | Hosts internet-facing DNS records for a domain you own |
| Private DNS zone | Resolves hostnames inside a VNet — invisible to the internet |
| VNet link | Associates a private zone with a VNet; optionally auto-registers VMs |
| Split-horizon DNS | Same name, different answer depending on where you query from |
| Private endpoints + DNS | Routes traffic to Azure services entirely within Azure's backbone |
| Auto-registration | VMs automatically get DNS entries in the linked private zone |
