# Lab 04 — VM Scale Sets

**Concepts covered:** Horizontal scaling, elasticity, autoscale, load balancing, identical instance management

**Estimated cost:** ~$0.20–0.50 (2–4 B1s VMs for ~30 min — delete promptly)

---

## Setup

```bash
RESOURCE_GROUP="az900-lab04-rg"
LOCATION="westeurope"
VMSS_NAME="lab04-vmss"

az group create --name $RESOURCE_GROUP --location $LOCATION
```

---

## Step 1 — Create a VM Scale Set

This creates a scale set with a public load balancer, 2 initial instances, and a simple nginx web server via cloud-init.

First, create a cloud-init config to install nginx on each VM:

```bash
cat > cloud-init.txt << 'EOF'
#cloud-config
package_upgrade: true
packages:
  - nginx
runcmd:
  - echo "<h1>Hello from $(hostname)</h1>" > /var/www/html/index.html
  - systemctl enable nginx
  - systemctl start nginx
EOF
```

Create the scale set:

```bash
az vmss create \
  --resource-group $RESOURCE_GROUP \
  --name $VMSS_NAME \
  --image Ubuntu2204 \
  --vm-sku Standard_B1s \
  --instance-count 2 \
  --upgrade-policy-mode automatic \
  --admin-username azureuser \
  --generate-ssh-keys \
  --custom-data cloud-init.txt \
  --load-balancer "$VMSS_NAME-lb" \
  --backend-pool-name "$VMSS_NAME-backend"
```

This takes a few minutes. It creates:
- The scale set (2 identical VMs)
- A public IP address
- A load balancer distributing traffic across the VMs
- An NSG

---

## Step 2 — Open Port 80 and Get the Load Balancer IP

```bash
# Add an inbound NAT rule to allow port 80
az network lb rule create \
  --resource-group $RESOURCE_GROUP \
  --lb-name "$VMSS_NAME-lb" \
  --name http-rule \
  --protocol Tcp \
  --frontend-port 80 \
  --backend-port 80 \
  --frontend-ip-name loadBalancerFrontEnd \
  --backend-pool-name "$VMSS_NAME-backend" \
  --probe-name "$VMSS_NAME-probe" 2>/dev/null || true

# Create a health probe if it doesn't exist
az network lb probe create \
  --resource-group $RESOURCE_GROUP \
  --lb-name "$VMSS_NAME-lb" \
  --name "$VMSS_NAME-probe" \
  --protocol Http \
  --port 80 \
  --path "/" 2>/dev/null || true

# Get the public IP
LB_IP=$(az network public-ip show \
  --resource-group $RESOURCE_GROUP \
  --name "${VMSS_NAME}LBPublicIP" \
  --query ipAddress \
  --output tsv 2>/dev/null || \
  az network public-ip list \
    --resource-group $RESOURCE_GROUP \
    --query "[0].ipAddress" \
    --output tsv)

echo "Load Balancer IP: $LB_IP"
```

Wait a couple of minutes for cloud-init to finish installing nginx, then:
```bash
# Hit the load balancer repeatedly — notice different hostnames
for i in {1..6}; do curl -s http://$LB_IP; echo; done
```

Each request is routed to one of the VMs by the load balancer. The hostname in the response changes.

---

## Step 3 — List Instances

```bash
# List all instances in the scale set
az vmss list-instances \
  --resource-group $RESOURCE_GROUP \
  --name $VMSS_NAME \
  --output table
```

---

## Step 4 — Manual Scale Out and In

```bash
# Scale out to 4 instances
az vmss scale \
  --resource-group $RESOURCE_GROUP \
  --name $VMSS_NAME \
  --new-capacity 4

# Watch instances being added
az vmss list-instances \
  --resource-group $RESOURCE_GROUP \
  --name $VMSS_NAME \
  --output table

# Hit the load balancer again — now 4 VMs serving requests
for i in {1..8}; do curl -s http://$LB_IP; echo; done

# Scale back to 2
az vmss scale \
  --resource-group $RESOURCE_GROUP \
  --name $VMSS_NAME \
  --new-capacity 2
```

This is **horizontal scaling** (elasticity) — adding/removing instances rather than making them bigger.

---

## Step 5 — Autoscale

Set up automatic scaling based on CPU load:

```bash
# Get the scale set resource ID
VMSS_ID=$(az vmss show \
  --resource-group $RESOURCE_GROUP \
  --name $VMSS_NAME \
  --query id \
  --output tsv)

# Create an autoscale profile
az monitor autoscale create \
  --resource-group $RESOURCE_GROUP \
  --resource $VMSS_ID \
  --resource-type Microsoft.Compute/virtualMachineScaleSets \
  --name autoscale-lab04 \
  --min-count 2 \
  --max-count 5 \
  --count 2

# Add a scale-out rule: if avg CPU > 70% for 5 minutes, add 1 instance
az monitor autoscale rule create \
  --resource-group $RESOURCE_GROUP \
  --autoscale-name autoscale-lab04 \
  --scale out 1 \
  --condition "Percentage CPU > 70 avg 5m"

# Add a scale-in rule: if avg CPU < 30% for 5 minutes, remove 1 instance
az monitor autoscale rule create \
  --resource-group $RESOURCE_GROUP \
  --autoscale-name autoscale-lab04 \
  --scale in 1 \
  --condition "Percentage CPU < 30 avg 5m"

# View the autoscale settings
az monitor autoscale show \
  --resource-group $RESOURCE_GROUP \
  --name autoscale-lab04
```

The autoscale engine will now automatically add or remove VMs based on CPU utilization — this is what **elasticity** means in practice.

---

## Step 6 — Update Instances (Rolling Upgrade)

One of the key benefits of scale sets is the ability to push updates to all instances:

```bash
# Update the nginx page on all instances
az vmss run-command invoke \
  --resource-group $RESOURCE_GROUP \
  --name $VMSS_NAME \
  --command-id RunShellScript \
  --scripts "echo '<h1>Updated: $(hostname)</h1>' > /var/www/html/index.html"

# Confirm the update
for i in {1..4}; do curl -s http://$LB_IP; echo; done
```

---

## Step 7 — Understand the Difference: Scale Set vs Individual VMs

| | Individual VMs | VM Scale Set |
|---|---|---|
| Configuration | Each VM configured separately | All VMs identical, managed as a group |
| Scaling | Manual — add/remove VMs one by one | Single command or automatic |
| Updates | Update each VM manually | Rolling update across all instances |
| Load balancing | You configure it yourself | Built-in integration |
| Use case | Different VMs with different configs | Identical stateless workers |

---

## Cleanup

```bash
rm -f cloud-init.txt
az group delete --name $RESOURCE_GROUP --yes --no-wait
```

---

## What You Learned

- Scale sets deploy and manage groups of identical VMs
- Horizontal scaling: more instances handles more load (vs vertical = bigger instance)
- The load balancer distributes traffic across all healthy instances
- Autoscale rules react to metrics (CPU, memory, custom) to add/remove instances automatically
- This is what "elasticity" means as a cloud benefit — the infrastructure stretches to meet demand and shrinks when demand drops
