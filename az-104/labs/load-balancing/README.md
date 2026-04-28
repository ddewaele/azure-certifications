# Lab: Name Resolution & Load Balancing (AZ-104 Domain 4)

## Overview

This lab covers Azure DNS, Azure Load Balancer, and Azure Application Gateway — the core name resolution and traffic distribution services for AZ-104 Domain 4: Implement and Manage Virtual Networking.

### Learning Objectives

- Create and manage Azure DNS public and private zones
- Add A, CNAME, MX, and TXT records to DNS zones
- Deploy a Standard public Load Balancer with health probes and load-balancing rules
- Deploy an internal Load Balancer for private workloads
- Deploy an Application Gateway with URL-based routing and WAF policy
- Diagnose common issues: probe failures, backend pool misconfigurations, listener conflicts

### Exam Topics Covered (Domain 4)

| Topic | AZ-104 Objective |
|-------|-----------------|
| Azure DNS public zones | Configure Azure DNS |
| Azure DNS private zones | Configure Azure DNS |
| Standard Load Balancer | Configure Azure Load Balancer |
| Internal Load Balancer | Configure Azure Load Balancer |
| Application Gateway (Layer 7) | Configure Azure Application Gateway |
| WAF policy | Configure Azure Application Gateway |
| URL-path routing | Configure Azure Application Gateway |
| Health probes | Troubleshoot load balancing |

### Estimated Time

| Section | Time |
|---------|------|
| Part 1 – Azure DNS | ~20 min |
| Part 2 – Azure Load Balancer | ~30 min |
| Part 3 – Application Gateway | ~40 min |
| Part 4 – Troubleshooting | ~15 min |

### Prerequisites

- Azure subscription with Contributor role
- Azure Cloud Shell (Bash) or Azure CLI ≥ 2.50

---

## Shared Variables

Run these once at the start; every section references them.

```bash
RG="rg-lb-lab"
LOCATION="westeurope"
IMAGE="Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest"
VM_SIZE="Standard_B2ts_v2"
VNET_NAME="vnet-lb-lab"
VNET_PREFIX="10.10.0.0/16"
SUBNET_BACKEND="subnet-backend"
SUBNET_BACKEND_PREFIX="10.10.1.0/24"
SUBNET_APPGW="subnet-appgw"
SUBNET_APPGW_PREFIX="10.10.2.0/24"
SUBNET_ILB="subnet-ilb"
SUBNET_ILB_PREFIX="10.10.3.0/24"
```

```bash
# Create resource group and VNet
az group create --name $RG --location $LOCATION

az network vnet create \
  --name $VNET_NAME \
  --resource-group $RG \
  --location $LOCATION \
  --address-prefix $VNET_PREFIX

az network vnet subnet create \
  --name $SUBNET_BACKEND \
  --vnet-name $VNET_NAME \
  --resource-group $RG \
  --address-prefix $SUBNET_BACKEND_PREFIX

az network vnet subnet create \
  --name $SUBNET_APPGW \
  --vnet-name $VNET_NAME \
  --resource-group $RG \
  --address-prefix $SUBNET_APPGW_PREFIX

az network vnet subnet create \
  --name $SUBNET_ILB \
  --vnet-name $VNET_NAME \
  --resource-group $RG \
  --address-prefix $SUBNET_ILB_PREFIX
```

---

## Part 1 – Azure DNS

### 1.1 Create a Public DNS Zone

A public DNS zone hosts records resolvable from the internet. You delegate the zone by pointing your domain registrar's nameservers to the four NS records Azure assigns.

```bash
DNS_ZONE="lab.example.com"

az network dns zone create \
  --name $DNS_ZONE \
  --resource-group $RG

# View the NS records Azure assigned — copy these to your registrar
az network dns record-set ns show \
  --zone-name $DNS_ZONE \
  --resource-group $RG \
  --name "@"
```

### 1.2 Add DNS Records to the Public Zone

```bash
# A record — maps hostname to IPv4
az network dns record-set a add-record \
  --zone-name $DNS_ZONE \
  --resource-group $RG \
  --record-set-name "www" \
  --ipv4-address "203.0.113.10" \
  --ttl 300

# CNAME record — alias (cannot coexist with other records on the same name)
az network dns record-set cname set-record \
  --zone-name $DNS_ZONE \
  --resource-group $RG \
  --record-set-name "blog" \
  --cname "www.lab.example.com"

# MX record — mail exchange
az network dns record-set mx add-record \
  --zone-name $DNS_ZONE \
  --resource-group $RG \
  --record-set-name "@" \
  --exchange "mail.lab.example.com" \
  --preference 10

# TXT record — SPF / domain verification
az network dns record-set txt add-record \
  --zone-name $DNS_ZONE \
  --resource-group $RG \
  --record-set-name "@" \
  --value "v=spf1 include:spf.protection.outlook.com -all"
```

```bash
# List all record sets in the zone
az network dns record-set list \
  --zone-name $DNS_ZONE \
  --resource-group $RG \
  --output table
```

### 1.3 Create a Private DNS Zone

Private zones are only resolvable from linked VNets. Auto-registration means Azure creates A records for VMs automatically.

```bash
PRIVATE_ZONE="internal.corp"

az network private-dns zone create \
  --name $PRIVATE_ZONE \
  --resource-group $RG
```

### 1.4 Link the Private Zone to a VNet

```bash
# Enable auto-registration so VM NICs get A records automatically
az network private-dns link vnet create \
  --name "link-vnet-lb-lab" \
  --resource-group $RG \
  --zone-name $PRIVATE_ZONE \
  --virtual-network $VNET_NAME \
  --registration-enabled true
```

```bash
# Verify the link
az network private-dns link vnet show \
  --name "link-vnet-lb-lab" \
  --resource-group $RG \
  --zone-name $PRIVATE_ZONE \
  --output table
```

### 1.5 Add Records to the Private Zone

```bash
az network private-dns record-set a add-record \
  --zone-name $PRIVATE_ZONE \
  --resource-group $RG \
  --record-set-name "backend01" \
  --ipv4-address "10.10.1.4"

az network private-dns record-set a add-record \
  --zone-name $PRIVATE_ZONE \
  --resource-group $RG \
  --record-set-name "backend02" \
  --ipv4-address "10.10.1.5"
```

### 1.6 Verify Auto-Registration with Two VMs

Auto-registration means Azure creates an A record in the private zone automatically when a VM NIC gets an IP in the linked VNet — no manual `add-record` needed.

```bash
# Create two minimal VMs sequentially
# Use --ssh-key-values instead of --generate-ssh-keys to avoid a CLI JSON
# parsing bug where key-generation output corrupts the response stream
for i in 1 2; do
  az vm create \
    --name "vm-dns-test-0${i}" \
    --computer-name "vm-dns-test-0${i}" \
    --resource-group $RG \
    --location $LOCATION \
    --image $IMAGE \
    --size $VM_SIZE \
    --vnet-name $VNET_NAME \
    --subnet $SUBNET_BACKEND \
    --public-ip-address "" \
    --nsg "" \
    --admin-username azureuser \
    --generate-ssh-keys \
    --output none
done
```

```bash
# List all A records in the private zone — vm-dns-test-01 and vm-dns-test-02 should appear automatically
# --output table fails here because aRecords is a nested array; use --query to flatten it
az network private-dns record-set a list \
  --zone-name $PRIVATE_ZONE \
  --resource-group $RG \
  --query "[].{Name:name, IP:aRecords[0].ipv4Address, TTL:ttl, AutoRegistered:isAutoRegistered}" \
  --output table
```

Expected output:

```
Name            IP          TTL    AutoRegistered
--------------  ----------  -----  ----------------
vm-dns-test-01  10.10.1.4   10     True
vm-dns-test-02  10.10.1.5   10     True
```

The `AutoRegistered: True` flag confirms Azure created the record — not a manual entry. TTL is fixed at 10 seconds for auto-registered records and cannot be changed.

```bash
# Confirm by looking up one VM's private IP and cross-checking the DNS record
VM1_IP=$(az vm show \
  --name vm-dns-test-01 \
  --resource-group $RG \
  --show-details \
  --query privateIps \
  --output tsv)

echo "vm-dns-test-01 private IP : $VM1_IP"

az network private-dns record-set a show \
  --zone-name $PRIVATE_ZONE \
  --resource-group $RG \
  --name "vm-dns-test-01"
```

```bash
# Optional: SSH into vm-dns-test-02 via a jump box or Bastion and resolve vm-dns-test-01 by name
# nslookup vm-dns-test-01.internal.corp
# ping vm-dns-test-01.internal.corp
```

> **What to observe:**
> - The record is created with the VM's hostname (not the NIC name) as the record name
> - Deleting a VM automatically removes its auto-registered A record
> - You cannot manually edit auto-registered records — delete the VM to remove them

```bash
# Cleanup test VMs when done (records disappear automatically)
az vm delete --name vm-dns-test-01 --resource-group $RG --yes --no-wait
az vm delete --name vm-dns-test-02 --resource-group $RG --yes --no-wait
```

### Key Concepts – DNS

| Concept | Detail |
|---------|--------|
| Public zone delegation | Copy NS records to your registrar; Azure becomes authoritative |
| Private zone auto-registration | Azure auto-creates/deletes A records when VMs join/leave the VNet |
| TTL | Lower TTL = faster propagation during changes; higher TTL = fewer queries |
| CNAME apex restriction | You cannot use a CNAME at the zone apex (@); use an A record or Azure Alias |
| Alias record sets | Special Azure type — points to Load Balancer, Traffic Manager, or CDN without IP hardcoding |

---

## Part 2 – Azure Load Balancer

### Architecture

```
Internet → Public IP → External LB (frontend: public IP)
                           → vm-backend-01 (subnet-backend, web tier / nginx)
                           → vm-backend-02 (subnet-backend, web tier / nginx)
                                   │  GET /api/*  →  proxy_pass http://10.10.3.100
                                   ▼
                           Internal LB (frontend: 10.10.3.100, no public IP)
                           → vm-app-01 (subnet-ilb, app tier / JSON API)
                           → vm-app-02 (subnet-ilb, app tier / JSON API)
```

### 2.1 Create Two Backend VMs

These lightweight VMs run a simple HTTP page so the health probe and traffic can be verified.

```bash
# NSG allowing SSH and HTTP from anywhere (lab only — tighten in production)
az network nsg create \
  --name nsg-backend \
  --resource-group $RG \
  --location $LOCATION

az network nsg rule create \
  --nsg-name nsg-backend \
  --resource-group $RG \
  --name allow-ssh \
  --priority 100 \
  --protocol Tcp \
  --destination-port-ranges 22 \
  --access Allow

az network nsg rule create \
  --nsg-name nsg-backend \
  --resource-group $RG \
  --name allow-http \
  --priority 110 \
  --protocol Tcp \
  --destination-port-ranges 80 \
  --access Allow
```

```bash
for i in 1 2; do
  az vm create \
    --name "vm-backend-0${i}" \
    --computer-name "vm-backend-0${i}" \
    --resource-group $RG \
    --location $LOCATION \
    --image $IMAGE \
    --size $VM_SIZE \
    --vnet-name $VNET_NAME \
    --subnet $SUBNET_BACKEND \
    --nsg nsg-backend \
    --public-ip-address "" \
    --admin-username azureuser \
    --generate-ssh-keys \
    --custom-data '#!/bin/bash
apt-get update -y
apt-get install -y nginx
echo "<h1>Backend $(hostname)</h1>" > /var/www/html/index.html
systemctl enable nginx
systemctl start nginx'
done
```

> **Note:** `--public-ip-address ""` means no public IP — traffic only flows through the Load Balancer.

### 2.2 Create a Standard Public Load Balancer

```bash
LB_NAME="lb-public-std"
LB_PIP="pip-lb-public"
LB_FRONTEND="fe-public"
LB_BACKEND="be-pool"
LB_PROBE="probe-http"
LB_RULE="rule-http"

# Public IP (Standard SKU required for Standard LB)
az network public-ip create \
  --name $LB_PIP \
  --resource-group $RG \
  --location $LOCATION \
  --sku Standard \
  --allocation-method Static

# Load Balancer
az network lb create \
  --name $LB_NAME \
  --resource-group $RG \
  --location $LOCATION \
  --sku Standard \
  --frontend-ip-name $LB_FRONTEND \
  --public-ip-address $LB_PIP \
  --backend-pool-name $LB_BACKEND
```

### 2.3 Configure Health Probe and Load-Balancing Rule

```bash
# HTTP health probe — checks GET / on port 80
az network lb probe create \
  --lb-name $LB_NAME \
  --resource-group $RG \
  --name $LB_PROBE \
  --protocol Http \
  --port 80 \
  --path "/" \
  --interval 15 \
  --threshold 2

# Load-balancing rule — distribute TCP:80 across backend pool
az network lb rule create \
  --lb-name $LB_NAME \
  --resource-group $RG \
  --name $LB_RULE \
  --protocol Tcp \
  --frontend-port 80 \
  --backend-port 80 \
  --frontend-ip-name $LB_FRONTEND \
  --backend-pool-name $LB_BACKEND \
  --probe-name $LB_PROBE \
  --idle-timeout 4 \
  --enable-tcp-reset true
```

### 2.4 Add VMs to the Backend Pool

```bash
for i in 1 2; do
  NIC_ID=$(az vm show \
    --name "vm-backend-0${i}" \
    --resource-group $RG \
    --query "networkProfile.networkInterfaces[0].id" \
    --output tsv)

  IP_CONFIG=$(az network nic show \
    --ids $NIC_ID \
    --query "ipConfigurations[0].name" \
    --output tsv)

  az network nic ip-config address-pool add \
    --address-pool $LB_BACKEND \
    --ip-config-name $IP_CONFIG \
    --nic-name $(basename $NIC_ID) \
    --resource-group $RG \
    --lb-name $LB_NAME
done
```

```bash
# Verify backend pool membership
az network lb address-pool show \
  --lb-name $LB_NAME \
  --resource-group $RG \
  --name $LB_BACKEND \
  --output table
```

```bash
# Test: get the public IP and curl it a few times
PIP_ADDR=$(az network public-ip show \
  --name $LB_PIP \
  --resource-group $RG \
  --query ipAddress \
  --output tsv)

echo "Load Balancer IP: $PIP_ADDR"
curl http://$PIP_ADDR
```

### 2.5 Create an Internal (Private) Load Balancer

An internal LB has no public IP — it serves traffic within the VNet (e.g., front-end tier to back-end tier).

```bash
ILB_NAME="lb-internal"
ILB_FRONTEND="fe-internal"
ILB_BACKEND="be-pool-internal"
ILB_PROBE="probe-internal"
ILB_RULE="rule-internal"

az network lb create \
  --name $ILB_NAME \
  --resource-group $RG \
  --location $LOCATION \
  --sku Standard \
  --frontend-ip-name $ILB_FRONTEND \
  --vnet-name $VNET_NAME \
  --subnet $SUBNET_ILB \
  --private-ip-address "10.10.3.100" \
  --private-ip-address-version IPv4 \
  --backend-pool-name $ILB_BACKEND

az network lb probe create \
  --lb-name $ILB_NAME \
  --resource-group $RG \
  --name $ILB_PROBE \
  --protocol Tcp \
  --port 80

az network lb rule create \
  --lb-name $ILB_NAME \
  --resource-group $RG \
  --name $ILB_RULE \
  --protocol Tcp \
  --frontend-port 80 \
  --backend-port 80 \
  --frontend-ip-name $ILB_FRONTEND \
  --backend-pool-name $ILB_BACKEND \
  --probe-name $ILB_PROBE
```

### 2.6 Create App-Tier VMs

The app-tier VMs live in `subnet-ilb` with no public IP. They run nginx returning a JSON response so the web tier can verify which app-tier instance served the request.

```bash
# NSG for app tier — allow probe and traffic from within the VNet only
az network nsg create \
  --name nsg-app \
  --resource-group $RG \
  --location $LOCATION

az network nsg rule create \
  --nsg-name nsg-app \
  --resource-group $RG \
  --name allow-http-from-vnet \
  --priority 100 \
  --protocol Tcp \
  --source-address-prefixes VirtualNetwork \
  --destination-port-ranges 80 \
  --access Allow

az network nsg rule create \
  --nsg-name nsg-app \
  --resource-group $RG \
  --name deny-internet-inbound \
  --priority 4000 \
  --protocol "*" \
  --source-address-prefixes Internet \
  --destination-port-ranges "*" \
  --access Deny
```

```bash
for i in 1 2; do
  az vm create \
    --name "vm-app-0${i}" \
    --computer-name "vm-app-0${i}" \
    --resource-group $RG \
    --location $LOCATION \
    --image $IMAGE \
    --size $VM_SIZE \
    --vnet-name $VNET_NAME \
    --subnet $SUBNET_ILB \
    --nsg nsg-app \
    --public-ip-address "" \
    --admin-username azureuser \
    --generate-ssh-keys \
    --custom-data '#!/bin/bash
apt-get update -y
apt-get install -y nginx
HOSTNAME=$(hostname)
cat > /etc/nginx/sites-available/default << EOF
server {
    listen 80;
    location / {
        add_header Content-Type application/json;
        return 200 '"'"'{"service":"app-tier","host":"'"'"'$HOSTNAME'"'"'"}'"'"';
    }
    location /health {
        add_header Content-Type application/json;
        return 200 '"'"'{"status":"ok"}'"'"';
    }
}
EOF
nginx -t && systemctl restart nginx' \
    --output none
  echo "vm-app-0${i} created"
done
```

### 2.7 Add App-Tier VMs to the Internal LB Backend Pool

```bash
for i in 1 2; do
  NIC_ID=$(az vm show \
    --name "vm-app-0${i}" \
    --resource-group $RG \
    --query "networkProfile.networkInterfaces[0].id" \
    --output tsv)

  IP_CONFIG=$(az network nic show \
    --ids $NIC_ID \
    --query "ipConfigurations[0].name" \
    --output tsv)

  az network nic ip-config address-pool add \
    --address-pool $ILB_BACKEND \
    --ip-config-name $IP_CONFIG \
    --nic-name $(basename $NIC_ID) \
    --resource-group $RG \
    --lb-name $ILB_NAME
done
```

```bash
# Verify both app VMs are in the backend pool
az network lb address-pool show \
  --lb-name $ILB_NAME \
  --resource-group $RG \
  --name $ILB_BACKEND \
  --query "loadBalancerBackendAddresses[].{Name:name, IP:privateIpAddress}" \
  --output table
```

### 2.8 Configure Web-Tier Nginx to Proxy /api/ to the Internal LB

The web-tier VMs already serve static HTML. Update their nginx config to forward any `/api/` request to the internal LB frontend IP (`10.10.3.100`).

```bash
for i in 1 2; do
  az vm run-command invoke \
    --command-id RunShellScript \
    --name "vm-backend-0${i}" \
    --resource-group $RG \
    --scripts '
cat > /etc/nginx/sites-available/default << '"'"'NGINXEOF'"'"'
server {
    listen 80;

    location /api/ {
        proxy_pass http://10.10.3.100/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        root /var/www/html;
        index index.html;
    }
}
NGINXEOF
nginx -t && systemctl reload nginx
echo "nginx reloaded on '"'"'$(hostname)'"'"'"
' \
    --output table
done
```

### 2.9 End-to-End Test

```bash
PIP_ADDR=$(az network public-ip show \
  --name $LB_PIP \
  --resource-group $RG \
  --query ipAddress \
  --output tsv)

echo "External LB IP: $PIP_ADDR"

# Static web page from web tier
curl http://$PIP_ADDR/

# API call — web tier proxies to internal LB → app tier
curl http://$PIP_ADDR/api/

# Run multiple times to see load balancing across both app-tier VMs
for i in $(seq 1 6); do curl -s http://$PIP_ADDR/api/ ; echo; done
```

Expected output (host alternates between app-tier VMs):
```json
{"service":"app-tier","host":"vm-app-01"}
{"service":"app-tier","host":"vm-app-02"}
{"service":"app-tier","host":"vm-app-01"}
...
```

> **What this demonstrates:** The external LB distributes internet traffic across the two web-tier VMs. Each web-tier VM proxies `/api/` requests to the internal LB at `10.10.3.100`, which in turn distributes those requests across the two app-tier VMs. The app-tier VMs are completely private — no public IP, not reachable from the internet directly.

### Key Concepts – Load Balancer

| Concept | Detail |
|---------|--------|
| Basic vs Standard SKU | Basic: free, no SLA, open by default. Standard: SLA 99.99%, secure by default (NSG required), zone-redundant |
| Health probe protocols | TCP, HTTP, HTTPS. HTTP/HTTPS check response code; TCP just checks port reachability |
| Probe interval & threshold | Default: 15 s interval, unhealthy after 2 failures (= 30 s to mark down) |
| Session persistence | None (default, 5-tuple hash), Client IP (2-tuple), Client IP+Protocol (3-tuple) |
| Outbound SNAT | Standard LB requires explicit outbound rules or NAT Gateway for VM egress |
| Floating IP (DSR) | Allows backend to receive packets with the LB's frontend IP — required for SQL Always On |
| Internal LB use case | Tier-to-tier routing, private APIs, HA NVA clusters |

---

## Part 3 – Azure Application Gateway

### Architecture

```
Internet → Public IP → Application Gateway (Layer 7)
                          ├── Listener (HTTP :80, HTTPS :443)
                          ├── Routing Rule
                          │     ├── /api/*  → Backend Pool: api-pool
                          │     └── /*      → Backend Pool: web-pool
                          └── WAF Policy (OWASP 3.2)
```

### 3.1 Create the Application Gateway Public IP

```bash
APPGW_NAME="appgw-lab"
APPGW_PIP="pip-appgw"
APPGW_FRONTEND="fe-appgw"
APPGW_BACKEND_WEB="be-pool-web"
APPGW_BACKEND_API="be-pool-api"

az network public-ip create \
  --name $APPGW_PIP \
  --resource-group $RG \
  --location $LOCATION \
  --sku Standard \
  --allocation-method Static \
  --dns-name "appgw-lab-$(cat /proc/sys/kernel/random/uuid | cut -c1-8)"
```

### 3.2 Create the Application Gateway (WAF_v2 SKU)

```bash
az network application-gateway create \
  --name $APPGW_NAME \
  --resource-group $RG \
  --location $LOCATION \
  --sku WAF_v2 \
  --capacity 1 \
  --vnet-name $VNET_NAME \
  --subnet $SUBNET_APPGW \
  --public-ip-address $APPGW_PIP \
  --frontend-port 80 \
  --http-settings-port 80 \
  --http-settings-protocol Http \
  --routing-rule-type Basic \
  --priority 100
```

> **Note:** Provisioning an Application Gateway takes ~5–8 minutes.

### 3.3 Create a WAF Policy

```bash
WAF_POLICY="waf-policy-lab"

az network application-gateway waf-policy create \
  --name $WAF_POLICY \
  --resource-group $RG \
  --location $LOCATION

# Set OWASP 3.2 managed rule set
az network application-gateway waf-policy managed-rule rule-set add \
  --policy-name $WAF_POLICY \
  --resource-group $RG \
  --type OWASP \
  --version 3.2

# Switch to Prevention mode (Detection mode only logs, Prevention blocks)
az network application-gateway waf-policy policy-setting update \
  --policy-name $WAF_POLICY \
  --resource-group $RG \
  --mode Prevention \
  --state Enabled

# Associate WAF policy with the gateway
az network application-gateway update \
  --name $APPGW_NAME \
  --resource-group $RG \
  --waf-policy $WAF_POLICY
```

### 3.4 Add Backend Pools

```bash
# Web backend pool (add VM IPs from the backend subnet)
az network application-gateway address-pool create \
  --gateway-name $APPGW_NAME \
  --resource-group $RG \
  --name $APPGW_BACKEND_WEB \
  --servers "10.10.1.4" "10.10.1.5"

# API backend pool (separate set of servers)
az network application-gateway address-pool create \
  --gateway-name $APPGW_NAME \
  --resource-group $RG \
  --name $APPGW_BACKEND_API \
  --servers "10.10.1.6"
```

### 3.5 Configure URL-Path Based Routing

URL-path routing maps URI patterns to different backend pools. This enables a single gateway to front multiple services.

```bash
# Create a URL path map
az network application-gateway url-path-map create \
  --gateway-name $APPGW_NAME \
  --resource-group $RG \
  --name "url-path-map" \
  --paths "/api/*" \
  --address-pool $APPGW_BACKEND_API \
  --http-settings appGatewayBackendHttpSettings \
  --default-address-pool $APPGW_BACKEND_WEB \
  --default-http-settings appGatewayBackendHttpSettings

# Create a new routing rule using path-based routing
az network application-gateway rule create \
  --gateway-name $APPGW_NAME \
  --resource-group $RG \
  --name "rule-path-based" \
  --rule-type PathBasedRouting \
  --address-pool $APPGW_BACKEND_WEB \
  --http-settings appGatewayBackendHttpSettings \
  --http-listener appGatewayHttpListener \
  --url-path-map "url-path-map" \
  --priority 200
```

### 3.6 Add a Health Probe to Application Gateway

```bash
az network application-gateway probe create \
  --gateway-name $APPGW_NAME \
  --resource-group $RG \
  --name "probe-http" \
  --protocol Http \
  --host "10.10.1.4" \
  --path "/" \
  --interval 30 \
  --timeout 30 \
  --threshold 3

# Associate the probe with the HTTP settings
az network application-gateway http-settings update \
  --gateway-name $APPGW_NAME \
  --resource-group $RG \
  --name appGatewayBackendHttpSettings \
  --probe "probe-http"
```

### 3.7 Verify Application Gateway

```bash
APPGW_PIP_ADDR=$(az network public-ip show \
  --name $APPGW_PIP \
  --resource-group $RG \
  --query ipAddress \
  --output tsv)

echo "Application Gateway IP: $APPGW_PIP_ADDR"

# Test default path (→ web pool)
curl -v http://$APPGW_PIP_ADDR/

# Test API path (→ api pool)
curl -v http://$APPGW_PIP_ADDR/api/health
```

### Key Concepts – Application Gateway

| Concept | Detail |
|---------|--------|
| Layer 7 vs Layer 4 | App Gateway inspects HTTP headers/URI; Load Balancer operates on IP/TCP only |
| Listener types | Basic (single site) vs Multi-site (SNI hostname routing on same IP) |
| Routing rule types | Basic (one pool for all traffic) vs PathBasedRouting (URI-pattern → pool) |
| Backend HTTP settings | Defines how App GW connects to backends: port, protocol, cookie-based affinity, timeout |
| WAF modes | Detection (log only) vs Prevention (block matching requests) |
| SKUs | Standard_v2 (no WAF), WAF_v2 (WAF included); v1 SKUs are retired |
| Autoscaling | WAF_v2/Standard_v2 support autoscaling; set min-capacity to 0 for cost savings in dev |
| SSL offloading | Terminate TLS at the gateway; backend receives plain HTTP — reduces VM CPU load |
| End-to-end TLS | Re-encrypt traffic between gateway and backend using a backend certificate |

---

## Part 4 – Troubleshooting

### 4.1 Check Load Balancer Health Probe Status

```bash
# Shows per-backend health state (Healthy / Unhealthy)
az network lb probe list \
  --lb-name $LB_NAME \
  --resource-group $RG \
  --output table

# Check backend pool — are IPs associated?
az network lb address-pool show \
  --lb-name $LB_NAME \
  --resource-group $RG \
  --name $LB_BACKEND
```

### 4.2 Check Application Gateway Backend Health

```bash
# Detailed per-backend health including probe result and status
az network application-gateway show-backend-health \
  --name $APPGW_NAME \
  --resource-group $RG \
  --output table
```

The output shows `backendAddressPool`, `backendHttpSettingsCollection`, and per-server `health` (Healthy / Unhealthy / Unknown).

### 4.3 Common Problems and Fixes

#### Load Balancer — Backend VMs Not Receiving Traffic

| Symptom | Cause | Fix |
|---------|-------|-----|
| Probe status Unhealthy | Application not listening on probe port | Verify nginx/service is running: `systemctl status nginx` |
| Probe status Unhealthy | NSG blocking probe source `168.63.129.16` | Add NSG inbound rule allowing `AzureLoadBalancer` service tag |
| No traffic despite Healthy | VM not in backend pool | Re-run address-pool add-record command |
| Asymmetric routing | Guest OS has own default route bypassing LB | Remove conflicting routes or use Floating IP |
| Standard LB — no internet egress | No outbound rule / NAT GW | Add outbound rule or attach NAT Gateway |

#### Application Gateway — 502 Bad Gateway

| Symptom | Cause | Fix |
|---------|-------|-----|
| 502 on all requests | Probe failing — backend unhealthy | Run `show-backend-health`; check probe path returns 200 |
| 502 intermittently | One backend down | Check backend VM status; remove it from pool or fix app |
| 502 after cert change | Backend cert mismatch (end-to-end TLS) | Update backend authentication certificate on HTTP settings |
| 404 on path rules | Path map not matched | Confirm URI exactly matches path pattern including leading `/` |
| WAF blocking legitimate requests | False positive rule match | Check WAF logs in Diagnostic settings; add exclusion or tune rule |

### 4.4 Check NSG Flow Logs

NSG flow logs show allowed/denied traffic at the NIC or subnet level — essential when the probe source `168.63.129.16` is being blocked.

```bash
# Enable NSG flow logs (requires Storage Account)
SA_NAME="stlblabdiag$(cat /proc/sys/kernel/random/uuid | cut -c1-6)"
az storage account create \
  --name $SA_NAME \
  --resource-group $RG \
  --location $LOCATION \
  --sku Standard_LRS

NSG_ID=$(az network nsg show \
  --name nsg-backend \
  --resource-group $RG \
  --query id \
  --output tsv)

az network watcher flow-log create \
  --name "flow-log-backend" \
  --nsg $NSG_ID \
  --resource-group $RG \
  --storage-account $SA_NAME \
  --enabled true \
  --format JSON \
  --log-version 2
```

### 4.5 Use Network Watcher — IP Flow Verify

Quickly test whether an NSG would allow or deny a specific 5-tuple flow.

```bash
VM_ID=$(az vm show \
  --name vm-backend-01 \
  --resource-group $RG \
  --query id \
  --output tsv)

az network watcher test-ip-flow \
  --direction Inbound \
  --local "10.10.1.4:80" \
  --protocol TCP \
  --remote "168.63.129.16:65200" \
  --vm $VM_ID \
  --resource-group $RG
```

> `168.63.129.16` is the Azure platform probe source IP. If IP Flow Verify shows **Deny**, add an NSG rule allowing `AzureLoadBalancer` service tag.

---

## Cleanup

```bash
az group delete --name $RG --yes --no-wait
```

---

## Summary

| Service | Key SKU/Tier | Use Case |
|---------|-------------|----------|
| DNS Public Zone | N/A | Internet-resolvable records; delegate via NS records |
| DNS Private Zone | N/A | VNet-scoped resolution; auto-registration for VMs |
| Load Balancer Basic | Basic (free) | Dev/test; no SLA; no zone redundancy |
| Load Balancer Standard | Standard | Production; 99.99% SLA; zone-redundant; outbound rules |
| Internal Load Balancer | Standard | Tier-to-tier; no public IP |
| Application Gateway | Standard_v2 | Layer 7 LB, SSL offload, URL routing |
| Application Gateway | WAF_v2 | Same + OWASP WAF; production workloads facing internet |

---

## PowerShell Reference

All commands below use the `Az` module (`Install-Module Az -Scope CurrentUser`). Run `Connect-AzAccount` before starting.

### Shared Variables

```powershell
$RG                  = "rg-lb-lab"
$Location            = "westeurope"
$VmSize              = "Standard_B2ts_v2"
$Image               = "Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest"
$VNetName            = "vnet-lb-lab"
$VNetPrefix          = "10.10.0.0/16"
$SubnetBackend       = "subnet-backend"
$SubnetBackendPrefix = "10.10.1.0/24"
$SubnetAppGw         = "subnet-appgw"
$SubnetAppGwPrefix   = "10.10.2.0/24"
$SubnetIlb           = "subnet-ilb"
$SubnetIlbPrefix     = "10.10.3.0/24"
```

```powershell
New-AzResourceGroup -Name $RG -Location $Location

$vnet = New-AzVirtualNetwork `
  -Name $VNetName `
  -ResourceGroupName $RG `
  -Location $Location `
  -AddressPrefix $VNetPrefix

Add-AzVirtualNetworkSubnetConfig -Name $SubnetBackend -VirtualNetwork $vnet -AddressPrefix $SubnetBackendPrefix | Set-AzVirtualNetwork
Add-AzVirtualNetworkSubnetConfig -Name $SubnetAppGw   -VirtualNetwork $vnet -AddressPrefix $SubnetAppGwPrefix   | Set-AzVirtualNetwork
Add-AzVirtualNetworkSubnetConfig -Name $SubnetIlb     -VirtualNetwork $vnet -AddressPrefix $SubnetIlbPrefix     | Set-AzVirtualNetwork
```

---

### Part 1 – Azure DNS

#### Public DNS Zone

```powershell
$DnsZone = "lab.example.com"

New-AzDnsZone -Name $DnsZone -ResourceGroupName $RG

# View NS records
Get-AzDnsRecordSet -ZoneName $DnsZone -ResourceGroupName $RG -Name "@" -RecordType NS
```

#### Add Records to the Public Zone

```powershell
# A record
New-AzDnsRecordSet -ZoneName $DnsZone -ResourceGroupName $RG `
  -Name "www" -RecordType A -Ttl 300 `
  -DnsRecords (New-AzDnsRecordConfig -Ipv4Address "203.0.113.10")

# CNAME record
New-AzDnsRecordSet -ZoneName $DnsZone -ResourceGroupName $RG `
  -Name "blog" -RecordType CNAME -Ttl 300 `
  -DnsRecords (New-AzDnsRecordConfig -Cname "www.lab.example.com")

# MX record
New-AzDnsRecordSet -ZoneName $DnsZone -ResourceGroupName $RG `
  -Name "@" -RecordType MX -Ttl 300 `
  -DnsRecords (New-AzDnsRecordConfig -Exchange "mail.lab.example.com" -Preference 10)

# TXT record
New-AzDnsRecordSet -ZoneName $DnsZone -ResourceGroupName $RG `
  -Name "@" -RecordType TXT -Ttl 300 `
  -DnsRecords (New-AzDnsRecordConfig -Value "v=spf1 include:spf.protection.outlook.com -all")

# List all record sets
Get-AzDnsRecordSet -ZoneName $DnsZone -ResourceGroupName $RG
```

#### Private DNS Zone + VNet Link

```powershell
$PrivateZone = "internal.corp"

New-AzPrivateDnsZone -Name $PrivateZone -ResourceGroupName $RG

$vnet = Get-AzVirtualNetwork -Name $VNetName -ResourceGroupName $RG

New-AzPrivateDnsVirtualNetworkLink `
  -ZoneName $PrivateZone `
  -ResourceGroupName $RG `
  -Name "link-vnet-lb-lab" `
  -VirtualNetworkId $vnet.Id `
  -EnableRegistration

# Add A records to the private zone
New-AzPrivateDnsRecordSet -ZoneName $PrivateZone -ResourceGroupName $RG `
  -Name "backend01" -RecordType A -Ttl 300 `
  -PrivateDnsRecords (New-AzPrivateDnsRecordConfig -Ipv4Address "10.10.1.4")

New-AzPrivateDnsRecordSet -ZoneName $PrivateZone -ResourceGroupName $RG `
  -Name "backend02" -RecordType A -Ttl 300 `
  -PrivateDnsRecords (New-AzPrivateDnsRecordConfig -Ipv4Address "10.10.1.5")
```

---

### Part 2 – Azure Load Balancer

#### NSG for Backend VMs

```powershell
$nsg = New-AzNetworkSecurityGroup -Name "nsg-backend" -ResourceGroupName $RG -Location $Location

$nsg | Add-AzNetworkSecurityRuleConfig `
  -Name "allow-ssh" -Priority 100 -Protocol Tcp `
  -SourceAddressPrefix "*" -SourcePortRange "*" `
  -DestinationAddressPrefix "*" -DestinationPortRange 22 `
  -Access Allow -Direction Inbound | Set-AzNetworkSecurityGroup

$nsg | Add-AzNetworkSecurityRuleConfig `
  -Name "allow-http" -Priority 110 -Protocol Tcp `
  -SourceAddressPrefix "*" -SourcePortRange "*" `
  -DestinationAddressPrefix "*" -DestinationPortRange 80 `
  -Access Allow -Direction Inbound | Set-AzNetworkSecurityGroup
```

#### Backend VMs

```powershell
$vnet   = Get-AzVirtualNetwork -Name $VNetName -ResourceGroupName $RG
$subnet = Get-AzVirtualNetworkSubnetConfig -Name $SubnetBackend -VirtualNetwork $vnet
$nsg    = Get-AzNetworkSecurityGroup -Name "nsg-backend" -ResourceGroupName $RG

$initScript = @"
#!/bin/bash
apt-get update -y
apt-get install -y nginx
echo '<h1>Backend $(hostname)</h1>' > /var/www/html/index.html
systemctl enable nginx && systemctl start nginx
"@
$encodedScript = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($initScript))

foreach ($i in 1..2) {
  $nicName = "nic-backend-0$i"
  $vmName  = "vm-backend-0$i"

  $nic = New-AzNetworkInterface `
    -Name $nicName `
    -ResourceGroupName $RG `
    -Location $Location `
    -SubnetId $subnet.Id `
    -NetworkSecurityGroupId $nsg.Id

  $vmConfig = New-AzVMConfig -VMName $vmName -VMSize $VmSize |
    Set-AzVMOperatingSystem -Linux -ComputerName $vmName -Credential (Get-Credential -Message "Set admin password") |
    Set-AzVMSourceImage -PublisherName "Canonical" -Offer "0001-com-ubuntu-server-jammy" -Skus "22_04-lts-gen2" -Version "latest" |
    Add-AzVMNetworkInterface -Id $nic.Id |
    Set-AzVMCustomScriptExtension -CustomData $encodedScript

  New-AzVM -ResourceGroupName $RG -Location $Location -VM $vmConfig
}
```

#### Standard Public Load Balancer

```powershell
$LbName      = "lb-public-std"
$LbPipName   = "pip-lb-public"
$FeName      = "fe-public"
$BeName      = "be-pool"
$ProbeName   = "probe-http"
$RuleName    = "rule-http"

$pip = New-AzPublicIpAddress `
  -Name $LbPipName `
  -ResourceGroupName $RG `
  -Location $Location `
  -Sku Standard `
  -AllocationMethod Static

$feConfig = New-AzLoadBalancerFrontendIpConfig -Name $FeName -PublicIpAddress $pip
$bePool   = New-AzLoadBalancerBackendAddressPoolConfig -Name $BeName
$probe    = New-AzLoadBalancerProbeConfig `
  -Name $ProbeName -Protocol Http -Port 80 -RequestPath "/" -IntervalInSeconds 15 -ProbeCount 2
$rule     = New-AzLoadBalancerRuleConfig `
  -Name $RuleName -Protocol Tcp -FrontendPort 80 -BackendPort 80 `
  -FrontendIpConfiguration $feConfig -BackendAddressPool $bePool `
  -Probe $probe -IdleTimeoutInMinutes 4 -EnableTcpReset

$lb = New-AzLoadBalancer `
  -Name $LbName `
  -ResourceGroupName $RG `
  -Location $Location `
  -Sku Standard `
  -FrontendIpConfiguration $feConfig `
  -BackendAddressPool $bePool `
  -Probe $probe `
  -LoadBalancingRule $rule
```

#### Add VMs to the Backend Pool

```powershell
$lb     = Get-AzLoadBalancer -Name $LbName -ResourceGroupName $RG
$bePool = Get-AzLoadBalancerBackendAddressPoolConfig -LoadBalancer $lb -Name $BeName

foreach ($i in 1..2) {
  $nic = Get-AzNetworkInterface -Name "nic-backend-0$i" -ResourceGroupName $RG
  $nic.IpConfigurations[0].LoadBalancerBackendAddressPools = $bePool
  Set-AzNetworkInterface -NetworkInterface $nic
}

# Verify
$pip = Get-AzPublicIpAddress -Name $LbPipName -ResourceGroupName $RG
Write-Host "Load Balancer IP: $($pip.IpAddress)"
```

#### Internal Load Balancer

```powershell
$IlbName    = "lb-internal"
$IlbFeName  = "fe-internal"
$IlbBeName  = "be-pool-internal"
$IlbProbe   = "probe-internal"
$IlbRule    = "rule-internal"

$vnet      = Get-AzVirtualNetwork -Name $VNetName -ResourceGroupName $RG
$ilbSubnet = Get-AzVirtualNetworkSubnetConfig -Name $SubnetIlb -VirtualNetwork $vnet

$ilbFe    = New-AzLoadBalancerFrontendIpConfig -Name $IlbFeName -SubnetId $ilbSubnet.Id -PrivateIpAddress "10.10.3.100"
$ilbBe    = New-AzLoadBalancerBackendAddressPoolConfig -Name $IlbBeName
$ilbProbe = New-AzLoadBalancerProbeConfig -Name $IlbProbe -Protocol Tcp -Port 80 -IntervalInSeconds 15 -ProbeCount 2
$ilbRule  = New-AzLoadBalancerRuleConfig `
  -Name $IlbRule -Protocol Tcp -FrontendPort 80 -BackendPort 80 `
  -FrontendIpConfiguration $ilbFe -BackendAddressPool $ilbBe -Probe $ilbProbe

New-AzLoadBalancer `
  -Name $IlbName `
  -ResourceGroupName $RG `
  -Location $Location `
  -Sku Standard `
  -FrontendIpConfiguration $ilbFe `
  -BackendAddressPool $ilbBe `
  -Probe $ilbProbe `
  -LoadBalancingRule $ilbRule
```

---

### Part 3 – Application Gateway

#### Public IP for Application Gateway

```powershell
$AppGwName       = "appgw-lab"
$AppGwPipName    = "pip-appgw"
$AppGwBeWeb      = "be-pool-web"
$AppGwBeApi      = "be-pool-api"
$WafPolicyName   = "waf-policy-lab"

$appGwPip = New-AzPublicIpAddress `
  -Name $AppGwPipName `
  -ResourceGroupName $RG `
  -Location $Location `
  -Sku Standard `
  -AllocationMethod Static `
  -DomainNameLabel ("appgw-lab-" + (New-Guid).ToString().Substring(0,8))
```

#### Create the Application Gateway (WAF_v2)

```powershell
$vnet      = Get-AzVirtualNetwork -Name $VNetName -ResourceGroupName $RG
$appGwSubnet = Get-AzVirtualNetworkSubnetConfig -Name $SubnetAppGw -VirtualNetwork $vnet

$gwIpConfig  = New-AzApplicationGatewayIPConfiguration -Name "gwIpConfig" -Subnet $appGwSubnet
$fePip       = New-AzApplicationGatewayFrontendIPConfig -Name "fePip" -PublicIPAddress $appGwPip
$fePort      = New-AzApplicationGatewayFrontendPort -Name "fePort80" -Port 80
$bePoolWeb   = New-AzApplicationGatewayBackendAddressPool -Name $AppGwBeWeb -BackendIPAddresses "10.10.1.4","10.10.1.5"
$bePoolApi   = New-AzApplicationGatewayBackendAddressPool -Name $AppGwBeApi -BackendIPAddresses "10.10.1.6"
$beSettings  = New-AzApplicationGatewayBackendHttpSetting -Name "beHttpSettings" -Port 80 -Protocol Http -CookieBasedAffinity Disabled -RequestTimeout 30
$listener    = New-AzApplicationGatewayHttpListener -Name "httpListener" -Protocol Http -FrontendIPConfiguration $fePip -FrontendPort $fePort
$routingRule = New-AzApplicationGatewayRequestRoutingRule -Name "rule-basic" -RuleType Basic -HttpListener $listener -BackendAddressPool $bePoolWeb -BackendHttpSettings $beSettings -Priority 100
$sku         = New-AzApplicationGatewaySku -Name WAF_v2 -Tier WAF_v2 -Capacity 1

New-AzApplicationGateway `
  -Name $AppGwName `
  -ResourceGroupName $RG `
  -Location $Location `
  -GatewayIPConfigurations $gwIpConfig `
  -FrontendIPConfigurations $fePip `
  -FrontendPorts $fePort `
  -BackendAddressPools $bePoolWeb, $bePoolApi `
  -BackendHttpSettingsCollection $beSettings `
  -HttpListeners $listener `
  -RequestRoutingRules $routingRule `
  -Sku $sku
```

> **Note:** Provisioning takes ~5–8 minutes.

#### WAF Policy

```powershell
$wafPolicy = New-AzApplicationGatewayFirewallPolicy `
  -Name $WafPolicyName `
  -ResourceGroupName $RG `
  -Location $Location

# Add OWASP 3.2 managed rule set
$owasp = New-AzApplicationGatewayFirewallPolicyManagedRuleSet -RuleSetType OWASP -RuleSetVersion 3.2
$managedRules = New-AzApplicationGatewayFirewallPolicyManagedRule -ManagedRuleSet $owasp
$wafPolicy.ManagedRules = $managedRules

# Set Prevention mode
$wafPolicy.PolicySettings.State = "Enabled"
$wafPolicy.PolicySettings.Mode  = "Prevention"
Set-AzApplicationGatewayFirewallPolicy -InputObject $wafPolicy

# Associate policy with the gateway
$appGw = Get-AzApplicationGateway -Name $AppGwName -ResourceGroupName $RG
$appGw.FirewallPolicy = New-Object Microsoft.Azure.Commands.Network.Models.PSResourceId
$appGw.FirewallPolicy.Id = $wafPolicy.Id
Set-AzApplicationGateway -ApplicationGateway $appGw
```

#### URL-Path Based Routing

```powershell
$appGw      = Get-AzApplicationGateway -Name $AppGwName -ResourceGroupName $RG
$beSettings = Get-AzApplicationGatewayBackendHttpSetting -ApplicationGateway $appGw -Name "beHttpSettings"
$bePoolWeb  = Get-AzApplicationGatewayBackendAddressPool  -ApplicationGateway $appGw -Name $AppGwBeWeb
$bePoolApi  = Get-AzApplicationGatewayBackendAddressPool  -ApplicationGateway $appGw -Name $AppGwBeApi

$pathRule = New-AzApplicationGatewayPathRuleConfig `
  -Name "api-rule" `
  -Paths "/api/*" `
  -BackendAddressPool $bePoolApi `
  -BackendHttpSettings $beSettings

Add-AzApplicationGatewayUrlPathMapConfig `
  -ApplicationGateway $appGw `
  -Name "url-path-map" `
  -PathRules $pathRule `
  -DefaultBackendAddressPool $bePoolWeb `
  -DefaultBackendHttpSettings $beSettings

Set-AzApplicationGateway -ApplicationGateway $appGw
```

#### Health Probe

```powershell
$appGw      = Get-AzApplicationGateway -Name $AppGwName -ResourceGroupName $RG
$beSettings = Get-AzApplicationGatewayBackendHttpSetting -ApplicationGateway $appGw -Name "beHttpSettings"

Add-AzApplicationGatewayProbeConfig `
  -ApplicationGateway $appGw `
  -Name "probe-http" `
  -Protocol Http `
  -HostName "10.10.1.4" `
  -Path "/" `
  -Interval 30 `
  -Timeout 30 `
  -UnhealthyThreshold 3

$probe = Get-AzApplicationGatewayProbeConfig -ApplicationGateway $appGw -Name "probe-http"
$beSettings.Probe = $probe
Set-AzApplicationGateway -ApplicationGateway $appGw

# Verify
$pip = Get-AzPublicIpAddress -Name $AppGwPipName -ResourceGroupName $RG
Write-Host "Application Gateway IP: $($pip.IpAddress)"
```

---

### Part 4 – Troubleshooting

#### Check Load Balancer Probe Config

```powershell
$lb = Get-AzLoadBalancer -Name $LbName -ResourceGroupName $RG
Get-AzLoadBalancerProbeConfig -LoadBalancer $lb

# Check backend pool
Get-AzLoadBalancerBackendAddressPoolConfig -LoadBalancer $lb -Name $BeName
```

#### Check Application Gateway Backend Health

```powershell
# Async — returns a job; wait for it then inspect
$job = Get-AzApplicationGatewayBackendHealth -Name $AppGwName -ResourceGroupName $RG -AsJob
$result = $job | Wait-Job | Receive-Job
$result.BackendAddressPools | ForEach-Object {
  $_.BackendHttpSettingsCollection | ForEach-Object {
    $_.Servers | Select-Object Address, Health
  }
}
```

#### NSG Flow Logs

```powershell
$saName = "stlblabdiag" + (New-Guid).ToString().Replace("-","").Substring(0,6)

New-AzStorageAccount `
  -Name $saName `
  -ResourceGroupName $RG `
  -Location $Location `
  -SkuName Standard_LRS

$nsg = Get-AzNetworkSecurityGroup -Name "nsg-backend" -ResourceGroupName $RG
$sa  = Get-AzStorageAccount -Name $saName -ResourceGroupName $RG

Set-AzNetworkWatcherFlowLog `
  -Location $Location `
  -Name "flow-log-backend" `
  -TargetResourceId $nsg.Id `
  -StorageId $sa.Id `
  -Enabled $true `
  -FormatType JSON `
  -FormatVersion 2
```

#### IP Flow Verify

```powershell
$watcher = Get-AzNetworkWatcher -Location $Location
$vm      = Get-AzVM -Name "vm-backend-01" -ResourceGroupName $RG

Test-AzNetworkWatcherIPFlow `
  -NetworkWatcher $watcher `
  -TargetVirtualMachineId $vm.Id `
  -Direction Inbound `
  -Protocol TCP `
  -LocalIPAddress "10.10.1.4" `
  -LocalPort 80 `
  -RemoteIPAddress "168.63.129.16" `
  -RemotePort 65200
```

---

### Cleanup

```powershell
Remove-AzResourceGroup -Name $RG -Force -AsJob
```
