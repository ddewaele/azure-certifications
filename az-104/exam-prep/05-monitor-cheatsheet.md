# Domain 5 — Monitor & Maintain Cheatsheet (10–15%)

## Azure Monitor at a glance

```
Sources                  Pipeline                      Storage           Action
─────────                ────────────                  ───────────       ──────
VM/AMA   ─→  Data Collection Endpoint  ─→  Data Collection Rule  ─→  Log Analytics WS  ─→  Alerts
Resource ─→  Diagnostic Settings (no DCE/DCR needed)              ─→  Log Analytics WS / Storage / Event Hub
Resource ─→  Platform Metrics                                     ─→  Azure Monitor Metrics (time-series, 93 days)
```

### Data types

| Data | Stored in | Retention |
|------|-----------|-----------|
| **Metrics** | Azure Monitor Metrics (time-series) | 93 days (platform) |
| **Logs** | Log Analytics workspace | 30–730 days (default 30); 7 years with archive |
| **Activity log** | Free for 90 days; longer if exported | |

---

## Pipeline order (with AMA)

> **EXAM RULE:** When **Azure Monitor Agent (AMA)** is involved, the order is:
>
> **1. Log Analytics Workspace → 2. Data Collection Endpoint (DCE) → 3. Data Collection Rule (DCR) → 4. DCR Association on VM**

| Component | Role |
|-----------|------|
| Log Analytics Workspace | Final destination; stores and queries via KQL |
| **Data Collection Endpoint (DCE)** | HTTPS ingestion URL (only needed for AMA / AMPLS / Logs Ingestion API) |
| **Data Collection Rule (DCR)** | What to collect, transform, where to send |
| DCR Association | Attach a DCR to a specific VM |

> **TRAP:** DCE is NOT needed for diagnostic settings; only for AMA-based collection.

---

## Diagnostic settings

Per-resource configuration to ship logs/metrics to one of:

| Destination | Use |
|-------------|-----|
| Log Analytics workspace | Query, alert, visualize |
| Storage account | Long-term archive |
| Event Hub | Stream to SIEM / 3rd party |
| Partner solution | Direct to Datadog, etc. |

Categories: `AllMetrics`, `Audit`, `Operational`, etc. (varies per service)

---

## Azure Monitor Agent (AMA)

- Replaces legacy MMA (Microsoft Monitoring Agent) and OMS Agent
- Uses DCRs (no longer one-config-fits-all)
- Required for VM Insights in new deployments
- Supports Linux + Windows
- For on-prem: install via Azure Arc

> **TRAP:** Connection Monitor uses **AMA**, not the MARS/Recovery Services agent.

---

## Alerts

### Components

| Part | Detail |
|------|--------|
| **Scope** | Resource(s) the alert watches |
| **Condition** | Metric / KQL log query / activity log filter |
| **Action group** | Reusable list of notifications/automations |
| **Severity** | 0 (Critical) → 4 (Verbose) |
| **Alert processing rules** | Suppress for maintenance windows |

### Action types in an Action Group

| Action | Detail |
|--------|--------|
| Email / SMS / Voice / Push | Up to 1000 emails/h, 1 SMS/min/number |
| Webhook | HTTP POST |
| Logic App | Workflow |
| Azure Function | Custom code |
| Automation Runbook | PowerShell/Python |
| ITSM | ServiceNow / others |
| Event Hub | Stream alerts |

### Alert signal types

| Type | Signal | Example |
|------|--------|---------|
| **Metric** | Threshold on a metric | CPU > 80% for 5 min |
| **Log** | KQL query result | Heartbeat missing for 15 min |
| **Activity log** | Operation triggered | VM deleted |
| **Resource health** | Availability change | Resource degraded |
| **Service health** | Platform incident | Region-wide outage |

---

## Log Analytics & KQL

### Common tables

| Table | Data |
|-------|------|
| `AzureActivity` | Subscription-level operations |
| `Heartbeat` | Agent connectivity |
| `Syslog` | Linux syslog |
| `Event` / `SecurityEvent` | Windows event logs |
| `AzureDiagnostics` | Resource-level diagnostic logs |
| `Perf` | Performance counters |
| `AzureNetworkAnalytics_CL` | Traffic Analytics |

### KQL skeletons

```kql
// Errors by computer in last 24h
Event
| where TimeGenerated > ago(24h)
| where EventLevelName == "Error"
| summarize Count = count() by Computer
| order by Count desc

// VMs not heartbeating in last 5m
Heartbeat
| summarize LastHeartbeat = max(TimeGenerated) by Computer
| where LastHeartbeat < ago(5m)

// Top NSG denies in last hour
AzureNetworkAnalytics_CL
| where SubType_s == "FlowLog" and FlowStatus_s == "D"
| summarize Denies = count() by SrcIP_s, DestIP_s, DestPort_d
| top 20 by Denies
```

---

## Network Watcher

### Tool selection (THE exam trap)

| Question | Tool |
|----------|------|
| "Is this NSG blocking this packet?" | **IP Flow Verify** |
| "Allowed by NSG but still failing — where's the traffic going?" | **Next Hop** |
| "Show all allowed/denied flows on an NSG" | **NSG Flow Logs** |
| "Visualize / heatmap flow data" | **Traffic Analytics** |
| "Continuous latency/connectivity check" | **Connection Monitor** |
| "Record raw packets to/from a VM" | **Packet Capture** (max **5 hours**) |
| "Show all NSG rules effective on a NIC" | **Effective Security Rules** |

### IP Flow Verify vs Next Hop

| Tool | Tells you | Common failure mode |
|------|-----------|---------------------|
| IP Flow Verify | NSG allow/deny + which rule | Says **Allow** but traffic fails → routing issue |
| Next Hop | The route table's next hop | Use this when IP Flow Verify says Allow but traffic drops |

### Traffic Analytics requirements

| Requirement | Detail |
|-------------|--------|
| **NSG Flow Logs v2** | v1 only writes to storage |
| **Log Analytics workspace** | Where Traffic Analytics stores processed data |
| **Network Watcher** | Must be registered in the region |
| **Storage account** | For raw flow blob storage |

> **TRAP:** Flow logs **v1** does NOT feed Traffic Analytics. Must be **v2**.

### Connection Monitor — agent

- **Azure Monitor Agent (AMA)** on Azure VMs
- For on-prem: AMA via Azure Arc
- **NOT** the MARS / Recovery Services agent (that's for backup)

---

## VM Insights & Container Insights

| Insight | Monitors | Requires |
|---------|---------|----------|
| **VM Insights** | CPU, memory, disk, network, dependency map | Azure Monitor Agent + Log Analytics workspace |
| **Container Insights** | AKS performance, pod health | Workspace + AKS add-on |
| **Network Insights** | NSGs, gateways, topology | Auto-enabled with Network Watcher |
| **Application Insights** | App telemetry (requests, exceptions, dependencies) | App-side SDK or auto-instrumentation |

---

## Update Management

### Azure Update Manager (current)

| Feature | Detail |
|---------|--------|
| Scope | Azure VMs + Azure Arc-enabled servers (on-prem, multicloud) |
| Assessment | Scan for missing patches |
| Maintenance config | Schedule patching |
| Compliance reporting | Cross-subscription view |

> Replaces: legacy "Update Management in Automation Account" — being deprecated.

---

## Azure Backup quick recap

(see also Compute cheatsheet)

| Concept | Detail |
|---------|--------|
| **RSV region constraint** | Vault region = workload region |
| **Cross-Region Restore (CRR)** | Opt-in; GRS-only; 48h replication lag |
| **Soft delete** | 14 days retention after delete (default) |
| **Backup vault** vs RSV | Backup vault = Blob/Disk/PostgreSQL/AKS; RSV = VM, Files, on-prem |

---

## Region constraints summary

### Region-bound

| Resource | Why |
|----------|-----|
| Recovery Services Vault | Same region as workload |
| Backup Vault | Same region as workload |
| Log Analytics Workspace | Data stored in workspace region |
| Data Collection Endpoint | Same region as VMs |
| Data Collection Rule | Same region as VMs |
| Network Watcher | One per region (auto in `NetworkWatcherRG`) |
| NSG | Same region as the subnet/NIC |
| VPN/ER Gateway | Same region as the VNet |
| Azure VM Backup | Same region as VM |

### Cross-region capable

| Resource | Capability |
|----------|-----------|
| Azure Site Recovery (ASR) | **Designed** for cross-region replication |
| Connection Monitor | Cross-region, cross-subscription monitoring |
| Traffic Manager | Global DNS-based routing |
| Front Door | Global Layer 7 routing |
| Action Groups | Notify across regions |
| RA-GRS storage | Read access to paired secondary |
| Cross-Region Restore (CRR) | Opt-in failover restore |

---

## Quick CLI patterns

```bash
# Create LAW
az monitor log-analytics workspace create \
  --workspace-name law1 --resource-group RG --location westeurope --sku PerGB2018

# DCE → DCR pipeline
az monitor data-collection endpoint create --name dce1 --resource-group RG --location westeurope
az monitor data-collection rule create --name dcr1 --resource-group RG --location westeurope \
  --data-collection-endpoint-id <dce-id> \
  --destinations '[{"logAnalytics":[{"workspaceResourceId":"<law-id>","name":"law1"}]}]' \
  --data-flows '[{"streams":["Microsoft-Syslog"],"destinations":["law1"]}]'

# IP Flow Verify
az network watcher test-ip-flow --vm vm1 --resource-group RG \
  --direction Inbound --protocol TCP --local 10.0.1.4:80 --remote 1.2.3.4:54321

# Next Hop
az network watcher show-next-hop --vm vm1 --resource-group RG \
  --source-ip 10.0.1.4 --dest-ip 8.8.8.8

# NSG Flow Logs v2 + Traffic Analytics
az network watcher flow-log create --name fl1 --nsg <nsg-id> --resource-group RG \
  --storage-account <sa-id> --enabled true --format JSON --log-version 2
az network watcher flow-log update --name fl1 --nsg <nsg-id> --resource-group RG \
  --workspace <law-id> --traffic-analytics true

# Metric alert: CPU > 80% for 5 min
az monitor metrics alert create --name cpu-high --resource-group RG \
  --scopes <vm-id> --condition "avg Percentage CPU > 80" --window-size 5m \
  --action <action-group-id>

# Action group with email
az monitor action-group create --name ag1 --resource-group RG \
  --action email admin admin@contoso.com
```
