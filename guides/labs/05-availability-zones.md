# Lab 05 — Availability Zones and High Availability

**Concepts covered:** Availability zones, fault domains, SLA tiers, zone-redundant deployments, load balancing for HA

**Estimated cost:** ~$0.20–0.50 (2 B1s VMs + load balancer — delete promptly)

---

## Background

Availability zones are physically separate datacenters within a single Azure region. Each zone has independent:
- Power
- Cooling
- Networking

By spreading VMs across zones, your application survives a datacenter-level failure.

| Deployment | SLA | What it protects against |
|---|---|---|
| Single VM (Premium SSD) | 99.9% (~8.7 hrs downtime/year) | Hardware failure on one machine |
| Availability Set | 99.95% (~4.4 hrs/year) | Rack-level failures (fault domains) |
| Availability Zones | 99.99% (~52 min/year) | Datacenter-level failures |

---

## Setup

```bash
RESOURCE_GROUP="az900-lab05-rg"
LOCATION="westeurope"  # must support availability zones

az group create --name $RESOURCE_GROUP --location $LOCATION

# Verify this region supports availability zones
az account list-locations \
  --query "[?name=='westeurope'].{name:name, zones:availabilityZoneMappings[].logicalZone}" \
  --output table
```

---

## Step 1 — Deploy VMs in Different Availability Zones

Create two VMs, each in a different availability zone:

```bash
# Cloud-init to install a simple web server
cat > cloud-init.txt << 'EOF'
#cloud-config
packages:
  - nginx
runcmd:
  - echo "<h1>Zone VM: $(hostname)</h1><p>This VM is in zone $(curl -s -H 'Metadata:true' 'http://169.254.169.254/metadata/instance/compute/zone?api-version=2021-02-01&format=text')</p>" > /var/www/html/index.html
  - systemctl enable nginx
  - systemctl start nginx
EOF

# VM in Zone 1
az vm create \
  --resource-group $RESOURCE_GROUP \
  --name vm-zone1 \
  --image Ubuntu2204 \
  --size Standard_B1s \
  --zone 1 \
  --admin-username azureuser \
  --generate-ssh-keys \
  --custom-data cloud-init.txt \
  --no-wait

# VM in Zone 2
az vm create \
  --resource-group $RESOURCE_GROUP \
  --name vm-zone2 \
  --image Ubuntu2204 \
  --size Standard_B1s \
  --zone 2 \
  --admin-username azureuser \
  --generate-ssh-keys \
  --custom-data cloud-init.txt \
  --no-wait

# Wait for both to be ready
az vm wait --resource-group $RESOURCE_GROUP --name vm-zone1 --created
az vm wait --resource-group $RESOURCE_GROUP --name vm-zone2 --created
```

Verify the zone assignments:
```bash
az vm list \
  --resource-group $RESOURCE_GROUP \
  --query "[].{name:name, zone:zones[0], size:hardwareProfile.vmSize}" \
  --output table
```

---

## Step 2 — Create a Zone-Redundant Load Balancer

A Standard load balancer distributes traffic across both VMs and detects if one goes unhealthy.

```bash
# Create a public IP (Standard SKU required for zone-redundant LB)
az network public-ip create \
  --resource-group $RESOURCE_GROUP \
  --name lab05-pip \
  --sku Standard \
  --zone 1 2 3

# Create the load balancer
az network lb create \
  --resource-group $RESOURCE_GROUP \
  --name lab05-lb \
  --sku Standard \
  --public-ip-address lab05-pip \
  --frontend-ip-name lab05-frontend \
  --backend-pool-name lab05-backend

# Create a health probe
az network lb probe create \
  --resource-group $RESOURCE_GROUP \
  --lb-name lab05-lb \
  --name http-probe \
  --protocol Http \
  --port 80 \
  --path /

# Create a load balancing rule
az network lb rule create \
  --resource-group $RESOURCE_GROUP \
  --lb-name lab05-lb \
  --name http-rule \
  --protocol Tcp \
  --frontend-port 80 \
  --backend-port 80 \
  --frontend-ip-name lab05-frontend \
  --backend-pool-name lab05-backend \
  --probe-name http-probe
```

---

## Step 3 — Add VMs to the Load Balancer Backend Pool

```bash
# Get the backend pool ID
BACKEND_POOL_ID=$(az network lb address-pool show \
  --resource-group $RESOURCE_GROUP \
  --lb-name lab05-lb \
  --name lab05-backend \
  --query id \
  --output tsv)

# Add vm-zone1's NIC to the backend pool
VM1_NIC=$(az vm show \
  --resource-group $RESOURCE_GROUP \
  --name vm-zone1 \
  --query "networkProfile.networkInterfaces[0].id" \
  --output tsv)

az network nic ip-config update \
  --ids "$VM1_NIC/ipConfigurations/ipconfig1" \
  --add loadBalancerBackendAddressPools id=$BACKEND_POOL_ID

# Add vm-zone2's NIC to the backend pool
VM2_NIC=$(az vm show \
  --resource-group $RESOURCE_GROUP \
  --name vm-zone2 \
  --query "networkProfile.networkInterfaces[0].id" \
  --output tsv)

az network nic ip-config update \
  --ids "$VM2_NIC/ipConfigurations/ipconfig1" \
  --add loadBalancerBackendAddressPools id=$BACKEND_POOL_ID
```

---

## Step 4 — Open Port 80 on Both VMs' NSGs

```bash
for VM in vm-zone1 vm-zone2; do
  NSG=$(az network nsg list \
    --resource-group $RESOURCE_GROUP \
    --query "[?contains(name, '$VM')].name" \
    --output tsv)

  az network nsg rule create \
    --resource-group $RESOURCE_GROUP \
    --nsg-name $NSG \
    --name allow-http \
    --priority 100 \
    --protocol Tcp \
    --destination-port-ranges 80 \
    --access Allow
done
```

---

## Step 5 — Test the Load Balanced, Zone-Redundant Setup

```bash
LB_IP=$(az network public-ip show \
  --resource-group $RESOURCE_GROUP \
  --name lab05-pip \
  --query ipAddress \
  --output tsv)

echo "Load Balancer IP: $LB_IP"

# Wait for cloud-init to finish (~2 min), then test
for i in {1..6}; do curl -s http://$LB_IP; echo; done
```

You should see responses alternating between zone 1 and zone 2 VMs.

---

## Step 6 — Simulate a Zone Failure

Deallocate one VM and observe the load balancer route all traffic to the surviving VM:

```bash
# Take zone1 VM "offline"
az vm deallocate \
  --resource-group $RESOURCE_GROUP \
  --name vm-zone1 \
  --no-wait

echo "Waiting for health probe to detect the failure (~30 seconds)..."
sleep 30

# All requests should now go to zone2 only
for i in {1..6}; do curl -s http://$LB_IP; echo; done
```

The health probe detects that vm-zone1 is no longer responding and removes it from rotation. Your application keeps serving requests from zone 2 — this is high availability in action.

Bring it back:
```bash
az vm start --resource-group $RESOURCE_GROUP --name vm-zone1
```

---

## Step 7 — Availability Sets (for comparison)

Availability Sets are an older mechanism for HA within a single datacenter (not across zones). They spread VMs across:
- **Fault domains** — different physical racks (separate power/network)
- **Update domains** — groups that are rebooted sequentially during platform maintenance

```bash
# Create an availability set
az vm availability-set create \
  --resource-group $RESOURCE_GROUP \
  --name lab05-avset \
  --platform-fault-domain-count 2 \
  --platform-update-domain-count 5

az vm availability-set show \
  --resource-group $RESOURCE_GROUP \
  --name lab05-avset \
  --query "{faultDomains:platformFaultDomainCount, updateDomains:platformUpdateDomainCount}"
```

**When to use what:**
| | Availability Set | Availability Zone |
|---|---|---|
| Protects against | Rack failure, planned maintenance | Datacenter failure |
| Scope | Single datacenter | Across datacenters in a region |
| SLA | 99.95% | 99.99% |
| Cost | No extra cost | Slight data transfer cost between zones |
| Supported regions | All | Regions with 3+ zones only |

---

## Cleanup

```bash
rm -f cloud-init.txt
az group delete --name $RESOURCE_GROUP --yes --no-wait
```

---

## What You Learned

- Availability zones are physically separate datacenters in the same region
- Deploying across zones gives you 99.99% SLA (vs 99.9% for a single VM)
- The Standard load balancer distributes traffic and health-probes backends
- When a zone goes down, the LB automatically stops sending traffic there
- Availability sets provide HA within a single datacenter (rack-level), while availability zones provide HA across datacenters
