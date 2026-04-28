# Lab 07: Azure Monitor, Network Watcher & Connectivity Diagnosis

## Overview

Builds a three-tier network with intentional connectivity problems, then uses Network Watcher tools to diagnose and fix each one. Every tool is demonstrated against a real scenario, not a hypothetical.

### Learning Objectives

- Build the DCE → DCR → Log Analytics workspace pipeline in the correct order
- Enable NSG Flow Logs and Traffic Analytics
- Use each Network Watcher tool against a real connectivity problem
- Understand which tool answers which question

### Exam Trap Reference

| Question | Tool |
|----------|------|
| "Is this NSG blocking this specific packet?" | **IP Flow Verify** |
| "Where is this traffic actually going?" | **Next Hop** |
| "Show me all traffic through an NSG" | **NSG Flow Logs** |
| "Visualise/analyse flow log data" | **Traffic Analytics** |
| "Ongoing latency/connectivity monitoring" | **Connection Monitor** |
| "Record all packets to/from a VM" | **Packet Capture** (max 5 hours) |

---

## Architecture

```
                    Internet
                        │
                  (ssh for lab access)
                        │
              ┌─────────▼──────────┐
              │  subnet-mgmt        │  10.20.3.0/24
              │  vm-jump (pub IP)   │  ← entry point
              └─────────┬──────────┘
                        │ allowed: ssh to web + app
                        │
              ┌─────────▼──────────┐
              │  subnet-web         │  10.20.1.0/24
              │  vm-web (no PIP)    │  nginx :80
              └─────────┬──────────┘
                        │ should reach app on :8080
                        │ ← BLOCKED by NSG (Scenario 1)
                        │ ← MISROUTED by UDR (Scenario 2)
              ┌─────────▼──────────┐
              │  subnet-app         │  10.20.2.0/24
              │  vm-app (no PIP)    │  Python API :8080
              └────────────────────┘
```

### What's broken (intentionally)

| Scenario | Problem | Diagnosis tool | Fix |
|----------|---------|----------------|-----|
| 1 | NSG on subnet-app blocks port 8080 from subnet-web | IP Flow Verify | Add allow rule |
| 2 | UDR routes web→app traffic to a non-existent NVA | Next Hop | Delete bad route |
| 3 | Flow logs not enabled — no traffic visibility | NSG Flow Logs | Enable + query |
| 4 | Connection Monitor shows intermittent failure | Connection Monitor | Identify flapping rule |

---

## Shared Variables

```bash
RG="rg-monitor-lab"
LOCATION="westeurope"
IMAGE="Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest"
VM_SIZE="Standard_B2ts_v2"
VNET_NAME="vnet-monitor-lab"
LAW_NAME="law-monitor-lab"
```

---

## Step 1 – Resource Group, VNet and Subnets

```bash
az group create --name $RG --location $LOCATION

az network vnet create \
  --name $VNET_NAME \
  --resource-group $RG \
  --location $LOCATION \
  --address-prefix 10.20.0.0/16

az network vnet subnet create --name subnet-web  --vnet-name $VNET_NAME --resource-group $RG --address-prefix 10.20.1.0/24
az network vnet subnet create --name subnet-app  --vnet-name $VNET_NAME --resource-group $RG --address-prefix 10.20.2.0/24
az network vnet subnet create --name subnet-mgmt --vnet-name $VNET_NAME --resource-group $RG --address-prefix 10.20.3.0/24
```

---

## Step 2 – NSGs

### Management subnet — allow SSH inbound only

```bash
az network nsg create --name nsg-mgmt --resource-group $RG --location $LOCATION

az network nsg rule create \
  --nsg-name nsg-mgmt --resource-group $RG \
  --name allow-ssh-inbound \
  --priority 100 --protocol Tcp \
  --destination-port-ranges 22 --access Allow --direction Inbound

az network vnet subnet update \
  --name subnet-mgmt --vnet-name $VNET_NAME --resource-group $RG \
  --network-security-group nsg-mgmt
```

### Web subnet — allow HTTP inbound, allow all outbound

```bash
az network nsg create --name nsg-web --resource-group $RG --location $LOCATION

az network nsg rule create \
  --nsg-name nsg-web --resource-group $RG \
  --name allow-http-inbound \
  --priority 100 --protocol Tcp \
  --destination-port-ranges 80 --access Allow --direction Inbound

az network vnet subnet update \
  --name subnet-web --vnet-name $VNET_NAME --resource-group $RG \
  --network-security-group nsg-web
```

### App subnet — SSH allowed from mgmt, port 8080 intentionally BLOCKED

```bash
az network nsg create --name nsg-app --resource-group $RG --location $LOCATION

# Allow SSH only from the management subnet
az network nsg rule create \
  --nsg-name nsg-app --resource-group $RG \
  --name allow-ssh-from-mgmt \
  --priority 100 --protocol Tcp \
  --source-address-prefixes 10.20.3.0/24 \
  --destination-port-ranges 22 --access Allow --direction Inbound

# Port 8080 is NOT added — this is Scenario 1's intentional block

az network vnet subnet update \
  --name subnet-app --vnet-name $VNET_NAME --resource-group $RG \
  --network-security-group nsg-app
```

---

## Step 3 – Virtual Machines

### vm-jump (management, has public IP)

```bash
az vm create \
  --name vm-jump \
  --computer-name vm-jump \
  --resource-group $RG \
  --location $LOCATION \
  --image $IMAGE \
  --size $VM_SIZE \
  --vnet-name $VNET_NAME \
  --subnet subnet-mgmt \
  --nsg "" \
  --admin-username azureuser \
  --generate-ssh-keys \
  --output none

JUMP_IP=$(az vm show \
  --name vm-jump --resource-group $RG \
  --show-details --query publicIps --output tsv)
echo "Jump IP: $JUMP_IP"
```

### vm-web (web tier, no public IP)

```bash
az vm create \
  --name vm-web \
  --computer-name vm-web \
  --resource-group $RG \
  --location $LOCATION \
  --image $IMAGE \
  --size $VM_SIZE \
  --vnet-name $VNET_NAME \
  --subnet subnet-web \
  --nsg "" \
  --public-ip-address "" \
  --admin-username azureuser \
  --generate-ssh-keys \
  --custom-data '#!/bin/bash
apt-get update -y && apt-get install -y nginx curl
echo "<h1>web tier: $(hostname)</h1>" > /var/www/html/index.html
systemctl enable nginx && systemctl start nginx' \
  --output none
```

### vm-app (app tier, no public IP, runs API on port 8080)

```bash
az vm create \
  --name vm-app \
  --computer-name vm-app \
  --resource-group $RG \
  --location $LOCATION \
  --image $IMAGE \
  --size $VM_SIZE \
  --vnet-name $VNET_NAME \
  --subnet subnet-app \
  --nsg "" \
  --public-ip-address "" \
  --admin-username azureuser \
  --generate-ssh-keys \
  --custom-data '#!/bin/bash
apt-get update -y && apt-get install -y python3
cat > /opt/api.py << '"'"'EOF'"'"'
from http.server import HTTPServer, BaseHTTPRequestHandler
import json, socket

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"host": socket.gethostname(), "path": self.path}).encode())
    def log_message(self, *args): pass

HTTPServer(("0.0.0.0", 8080), Handler).serve_forever()
EOF
cat > /etc/systemd/system/api.service << EOF
[Unit]
After=network.target
[Service]
ExecStart=/usr/bin/python3 /opt/api.py
Restart=always
[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload && systemctl enable api && systemctl start api' \
  --output none
```

```bash
# Capture private IPs for use in diagnostics
WEB_IP=$(az vm show --name vm-web --resource-group $RG --show-details --query privateIps --output tsv)
APP_IP=$(az vm show --name vm-app --resource-group $RG --show-details --query privateIps --output tsv)
echo "vm-web: $WEB_IP  |  vm-app: $APP_IP"
```

---

## Step 4 – Log Analytics Workspace (required before DCE/DCR)

```bash
az monitor log-analytics workspace create \
  --workspace-name $LAW_NAME \
  --resource-group $RG \
  --location $LOCATION \
  --sku PerGB2018 \
  --retention-time 30

LAW_ID=$(az monitor log-analytics workspace show \
  --workspace-name $LAW_NAME \
  --resource-group $RG \
  --query id --output tsv)
echo "LAW ID: $LAW_ID"
```

---

## Step 5 – NSG Flow Logs

Flow logs write raw traffic records per NSG. Required before Traffic Analytics can show anything.

```bash
# Storage account for raw flow blobs
SA_NAME="stmonlab$(cat /proc/sys/kernel/random/uuid | tr -d '-' | cut -c1-8)"
az storage account create \
  --name $SA_NAME --resource-group $RG \
  --location $LOCATION --sku Standard_LRS

SA_ID=$(az storage account show --name $SA_NAME --resource-group $RG --query id --output tsv)

# Ensure Network Watcher exists in the region
az network watcher configure \
  --resource-group NetworkWatcherRG \
  --locations $LOCATION --enabled true
```

```bash
# Enable flow logs v2 on all three NSGs + connect to Traffic Analytics
for NSG in nsg-mgmt nsg-web nsg-app; do
  NSG_ID=$(az network nsg show --name $NSG --resource-group $RG --query id --output tsv)

  az network watcher flow-log create \
    --name "fl-${NSG}" \
    --nsg $NSG_ID \
    --resource-group $RG \
    --storage-account $SA_ID \
    --enabled true \
    --format JSON \
    --log-version 2

  az network watcher flow-log update \
    --name "fl-${NSG}" \
    --nsg $NSG_ID \
    --resource-group $RG \
    --workspace $LAW_ID \
    --traffic-analytics true \
    --interval 10

  echo "Flow logs enabled for $NSG"
done
```

---

## Scenario 1 – IP Flow Verify: NSG Blocking Port 8080

### Problem

`vm-web` tries to reach `vm-app:8080` but gets no response. You suspect the NSG on `subnet-app` is blocking it, but you don't know which rule.

### Diagnose with IP Flow Verify

```bash
WEB_VM_ID=$(az vm show --name vm-web --resource-group $RG --query id --output tsv)

az network watcher test-ip-flow \
  --vm vm-web \
  --direction Outbound \
  --protocol TCP \
  --local "${WEB_IP}:12345" \
  --remote "${APP_IP}:8080" \
  --resource-group $RG
```

Expected result:
```
Access    RuleName
--------  ---------------------------
Deny      DenyAllInBound    ← the default deny rule on nsg-app
```

The output tells you exactly which rule is blocking and on which NSG. No guessing.

### Fix — add the missing allow rule

```bash
az network nsg rule create \
  --nsg-name nsg-app \
  --resource-group $RG \
  --name allow-8080-from-web \
  --priority 200 \
  --protocol Tcp \
  --source-address-prefixes 10.20.1.0/24 \
  --destination-port-ranges 8080 \
  --access Allow \
  --direction Inbound
```

### Verify the fix

```bash
az network watcher test-ip-flow \
  --vm vm-web \
  --direction Outbound \
  --protocol TCP \
  --local "${WEB_IP}:12345" \
  --remote "${APP_IP}:8080" \
  --resource-group $RG
```

Expected result now:
```
Access    RuleName
--------  --------------------------
Allow     allow-8080-from-web
```

### Confirm with a real request from vm-web

```bash
az vm run-command invoke \
  --command-id RunShellScript \
  --name vm-web \
  --resource-group $RG \
  --scripts "curl -s http://${APP_IP}:8080/"
```

Expected: `{"host": "vm-app", "path": "/"}`

---

## Scenario 2 – Next Hop: Traffic Misrouted by a UDR

### Problem

A route table was applied to `subnet-web` routing all traffic destined for the app subnet through an NVA at `10.20.99.99` — which doesn't exist. Traffic silently drops. IP Flow Verify shows **Allow** (the NSG isn't blocking it) but requests still fail.

### Inject the bad route

```bash
az network route-table create \
  --name rt-web-broken \
  --resource-group $RG \
  --location $LOCATION

az network route-table route create \
  --route-table-name rt-web-broken \
  --resource-group $RG \
  --name route-to-nva \
  --address-prefix 10.20.2.0/24 \
  --next-hop-type VirtualAppliance \
  --next-hop-ip-address 10.20.99.99

az network vnet subnet update \
  --name subnet-web \
  --vnet-name $VNET_NAME \
  --resource-group $RG \
  --route-table rt-web-broken
```

### IP Flow Verify — still shows Allow

```bash
az network watcher test-ip-flow \
  --vm vm-web \
  --direction Outbound \
  --protocol TCP \
  --local "${WEB_IP}:12345" \
  --remote "${APP_IP}:8080" \
  --resource-group $RG
```

Result: `Allow` — the NSG is fine. But requests still fail. This is the key distinction: **IP Flow Verify only checks NSG rules, not routing.**

### Diagnose with Next Hop

```bash
az network watcher show-next-hop \
  --vm vm-web \
  --resource-group $RG \
  --source-ip $WEB_IP \
  --dest-ip $APP_IP
```

Expected result:
```json
{
  "nextHopIpAddress": "10.20.99.99",
  "nextHopType": "VirtualAppliance",
  "routeTableId": "/subscriptions/.../rt-web-broken"
}
```

The next hop is `10.20.99.99` — a VirtualAppliance that doesn't exist. Traffic is being sent there and dropped.

### Fix — remove the bad route table

```bash
az network vnet subnet update \
  --name subnet-web \
  --vnet-name $VNET_NAME \
  --resource-group $RG \
  --route-table ""
```

### Verify with Next Hop again

```bash
az network watcher show-next-hop \
  --vm vm-web \
  --resource-group $RG \
  --source-ip $WEB_IP \
  --dest-ip $APP_IP
```

Expected result now:
```json
{
  "nextHopIpAddress": "",
  "nextHopType": "VnetLocal"
}
```

`VnetLocal` means the traffic stays within the VNet and routes directly. Requests from vm-web to vm-app will now succeed.

---

## Scenario 3 – NSG Flow Logs: Who Is Talking to vm-app?

After fixing Scenarios 1 and 2, generate some traffic then query the flow logs to see which IPs are reaching vm-app.

### Generate traffic

```bash
# SSH into vm-web via the jump box and make requests to vm-app
az vm run-command invoke \
  --command-id RunShellScript \
  --name vm-web \
  --resource-group $RG \
  --scripts "for i in \$(seq 1 10); do curl -s http://${APP_IP}:8080/; echo; done"
```

### Query flow logs in Log Analytics (after ~10 minutes for ingestion)

```bash
WORKSPACE_ID=$(az monitor log-analytics workspace show \
  --workspace-name $LAW_NAME \
  --resource-group $RG \
  --query customerId --output tsv)

az monitor log-analytics query \
  --workspace $WORKSPACE_ID \
  --analytics-query "
AzureNetworkAnalytics_CL
| where SubType_s == 'FlowLog'
| where DestIP_s == '${APP_IP}'
| project TimeGenerated, SrcIP_s, DestIP_s, DestPort_d, FlowStatus_s, AllowedOutFlows_d, DeniedOutFlows_d
| order by TimeGenerated desc
| take 20
" \
  --output table
```

Flow log fields explained:

| Field | Meaning |
|-------|---------|
| `SrcIP_s` | Source IP of the connection |
| `DestIP_s` | Destination IP |
| `FlowStatus_s` | `A` = Allowed, `D` = Denied |
| `AllowedOutFlows_d` | Count of allowed flows in this record |
| `DeniedOutFlows_d` | Count of denied flows — non-zero means NSG was blocking |

---

## Scenario 4 – Connection Monitor: Ongoing Health Check

Connection Monitor continuously probes a source → destination pair and records latency, packet loss, and reachability. Use it to catch intermittent failures.

```bash
APP_VM_ID=$(az vm show --name vm-app --resource-group $RG --query id --output tsv)
WEB_VM_ID=$(az vm show --name vm-web --resource-group $RG --query id --output tsv)

az network watcher connection-monitor create \
  --name "cm-web-to-app" \
  --resource-group $RG \
  --location $LOCATION \
  --endpoints '[
    {"name":"web","type":"AzureVM","resourceId":"'"$WEB_VM_ID"'"},
    {"name":"app","type":"AzureVM","resourceId":"'"$APP_VM_ID"'"}
  ]' \
  --test-configurations '[
    {"name":"tcp-8080","protocol":"Tcp","tcpConfiguration":{"port":8080},"testFrequencySec":30}
  ]' \
  --test-groups '[
    {"name":"web-to-app","sources":["web"],"destinations":["app"],"testConfigurations":["tcp-8080"]}
  ]'
```

```bash
# Check current status
az network watcher connection-monitor query \
  --name "cm-web-to-app" \
  --location $LOCATION \
  --output table
```

### Simulate a failure to see Connection Monitor catch it

```bash
# Block port 8080 again
az network nsg rule update \
  --nsg-name nsg-app \
  --resource-group $RG \
  --name allow-8080-from-web \
  --access Deny

# Wait ~2 minutes then check Connection Monitor — it should show Unreachable
az network watcher connection-monitor query \
  --name "cm-web-to-app" \
  --location $LOCATION \
  --output table

# Restore
az network nsg rule update \
  --nsg-name nsg-app \
  --resource-group $RG \
  --name allow-8080-from-web \
  --access Allow
```

> **Exam trap:** Connection Monitor requires **Azure Monitor Agent** on the source/destination. For on-premises sources, this means AMA — **not** the Recovery Services (MARS) agent.

---

## Scenario 5 – Packet Capture: Record Raw Traffic on vm-app

Packet Capture records all packets to/from a VM. Useful when you need the full request/response, not just allow/deny.

```bash
SA_NAME_EXISTING=$(az storage account list --resource-group $RG --query "[0].name" --output tsv)

az network watcher packet-capture create \
  --resource-group $RG \
  --vm vm-app \
  --name "cap-app-port8080" \
  --storage-account $SA_NAME_EXISTING \
  --time-limit 120 \
  --filters '[{"protocol":"TCP","localPort":"8080"}]'
```

```bash
# Generate traffic while capture runs
az vm run-command invoke \
  --command-id RunShellScript \
  --name vm-web \
  --resource-group $RG \
  --scripts "for i in \$(seq 1 5); do curl -s http://${APP_IP}:8080/test; echo; done"
```

```bash
# Check capture status
az network watcher packet-capture show-status \
  --name "cap-app-port8080" \
  --location $LOCATION

# List captures
az network watcher packet-capture list --location $LOCATION --output table
```

> **Limits:** Maximum duration is **5 hours** (18000 seconds). The `.cap` file is saved to the storage account and can be opened in Wireshark.

---

## DCE → DCR → Log Analytics Pipeline

When Azure Monitor Agent is in use, the creation order matters:

```
1. Log Analytics Workspace   ← destination
2. Data Collection Endpoint  ← ingestion URL (network entry point)
3. Data Collection Rule      ← what to collect + where to send
4. DCR Association           ← attach DCR to VM
```

> **Exam rule:** DCE must exist before DCR. Creating a DCR that references a non-existent DCE will fail.

```bash
DCE_NAME="dce-monitor-lab"

az monitor data-collection endpoint create \
  --name $DCE_NAME \
  --resource-group $RG \
  --location $LOCATION \
  --public-network-access Enabled

DCE_ID=$(az monitor data-collection endpoint show \
  --name $DCE_NAME \
  --resource-group $RG \
  --query id --output tsv)
```

```bash
DCR_NAME="dcr-monitor-lab"

az monitor data-collection rule create \
  --name $DCR_NAME \
  --resource-group $RG \
  --location $LOCATION \
  --data-collection-endpoint-id $DCE_ID \
  --destinations '[{"logAnalytics": [{"workspaceResourceId": "'"$LAW_ID"'", "name": "law-dest"}]}]' \
  --data-flows '[{"streams": ["Microsoft-Syslog"], "destinations": ["law-dest"]}]' \
  --stream-declarations '{}'

DCR_ID=$(az monitor data-collection rule show \
  --name $DCR_NAME \
  --resource-group $RG \
  --query id --output tsv)
```

```bash
# Install Azure Monitor Agent and associate DCR on vm-app
az vm extension set \
  --name AzureMonitorLinuxAgent \
  --publisher Microsoft.Azure.Monitor \
  --vm-name vm-app \
  --resource-group $RG \
  --settings '{}'

VM_APP_ID=$(az vm show --name vm-app --resource-group $RG --query id --output tsv)

az monitor data-collection rule association create \
  --name "dcr-assoc-vm-app" \
  --resource "$VM_APP_ID" \
  --rule-id "$DCR_ID"
```

---

## Key Concepts

| Concept | Detail |
|---------|--------|
| IP Flow Verify scope | Only checks NSG rules — routing problems (UDR, BGP) return Allow even if traffic is dropped |
| Next Hop VnetLocal | Traffic stays inside the VNet — expected for intra-VNet communication |
| Next Hop None | No matching route — packet is silently dropped |
| Flow log v2 vs v1 | v2 required for Traffic Analytics; v1 only writes raw blobs to storage |
| Traffic Analytics lag | ~10 min before data appears in Log Analytics after flow logs are enabled |
| Connection Monitor agent | Requires Azure Monitor Agent — not the MARS/Recovery Services agent |
| Packet Capture max duration | 5 hours; output is a `.cap` file readable by Wireshark |
| DCE creation order | Must be created before DCR when Azure Monitor Agent is involved |

---

## Cleanup

```bash
az group delete --name $RG --yes --no-wait
```
