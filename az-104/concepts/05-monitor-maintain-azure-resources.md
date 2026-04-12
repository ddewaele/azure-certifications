# Monitor and Maintain Azure Resources (10-15%)

This domain covers Azure Monitor, Log Analytics, backup, and disaster recovery — essential for day-to-day Azure administration.

---

## Azure Monitor Overview

Azure Monitor collects, analyses, and acts on telemetry from Azure and on-premises environments.

### Data Types in Azure Monitor

| Data Type | Description | Store |
|-----------|-------------|-------|
| **Metrics** | Numerical values collected at regular intervals (e.g., CPU%, disk IOPS) | Azure Monitor Metrics (time-series DB) |
| **Logs** | Structured or unstructured records with timestamps and context | Log Analytics workspace |
| **Traces** | Distributed traces from applications (Application Insights) | Log Analytics workspace |
| **Changes** | Configuration changes to Azure resources | Azure Resource Graph |

---

## Azure Monitor Metrics

| Concept | Description |
|---------|-------------|
| **Platform metrics** | Automatically collected from Azure resources (no agent needed) |
| **Custom metrics** | Sent by applications, extensions, or Azure Monitor Agent |
| **Metric explorer** | Visual chart tool in the Azure portal |
| **Retention** | 93 days for most platform metrics |
| **Granularity** | 1 minute to 1 hour aggregations |

### Metric Aggregations

| Aggregation | Description |
|-------------|-------------|
| **Average** | Mean value over the time period |
| **Count** | Number of data points |
| **Min / Max** | Minimum or maximum value |
| **Sum** | Total of all values |

---

## Log Analytics Workspace

Central repository for log data from Azure resources, VMs, and on-premises.

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Workspace** | Azure resource that stores all log data |
| **Tables** | Data organised into tables (AzureActivity, Heartbeat, Syslog, etc.) |
| **Data collection rules (DCR)** | Define what data to collect, transform, and where to send it |
| **Diagnostic settings** | Configure Azure resources to send logs to a workspace |
| **Retention** | Default 30 days (configurable 30-730 days; 7 years with archive) |

### Common Log Tables

| Table | Data |
|-------|------|
| **AzureActivity** | Azure subscription activity log (create, delete, update operations) |
| **Heartbeat** | Agent heartbeat for VM connectivity |
| **Syslog** | Linux system logs |
| **Event** | Windows Event Logs |
| **SecurityEvent** | Windows Security events |
| **AzureDiagnostics** | Diagnostic logs from multiple Azure services |
| **VMComputer** | VM inventory data (VM Insights) |

### KQL (Kusto Query Language) Basics

```kql
// Count errors by computer in last 24 hours
Event
| where TimeGenerated > ago(24h)
| where EventLevelName == "Error"
| summarize Count = count() by Computer
| order by Count desc

// Azure activity for a resource group
AzureActivity
| where ResourceGroup == "myRG"
| project TimeGenerated, Caller, OperationNameValue, ActivityStatusValue
```

### Azure Monitor Agent (AMA)

- Replaces the older MMA (Microsoft Monitoring Agent) and OMS Agent
- Uses **Data Collection Rules** to define what to collect
- Supports Windows and Linux
- Required for VM Insights in new deployments

---

## Diagnostic Settings

Configure Azure resources to send data to monitoring destinations.

| Destination | Use Case |
|-------------|---------|
| **Log Analytics workspace** | Query, alert, and visualise logs |
| **Storage account** | Long-term archive, compliance |
| **Event Hub** | Stream to SIEM or third-party tools |
| **Partner solution** | Send directly to supported monitoring partners |

Categories commonly available:
- **AllMetrics** — send resource metrics
- **Audit** — audit and access logs
- **Operational** — operational events

---

## Azure Monitor Alerts

### Alert Rule Components

| Component | Description |
|-----------|-------------|
| **Scope** | The resource(s) to monitor |
| **Condition** | Signal + threshold that triggers the alert |
| **Action group** | Who to notify and how |
| **Alert processing rule** | Suppress or modify alert behavior (maintenance windows) |
| **Severity** | 0 (Critical) to 4 (Verbose) |

### Alert Signal Types

| Signal | Description |
|--------|-------------|
| **Metric** | Threshold on a metric value (e.g., CPU > 90%) |
| **Log search** | KQL query result threshold |
| **Activity log** | Azure operation triggered (e.g., VM deleted) |
| **Resource health** | Resource availability change |
| **Service health** | Azure platform-level incidents |

### Action Groups

Actions that execute when an alert fires:

| Action Type | Description |
|-------------|-------------|
| **Email/SMS/Push/Voice** | Notify individuals |
| **Azure Function** | Trigger a serverless function |
| **Logic App** | Run an automation workflow |
| **Webhook** | HTTP POST to an endpoint |
| **Automation Runbook** | Run a PowerShell runbook |
| **ITSM** | Create ticket in ServiceNow etc. |
| **Event Hub** | Stream alert to Event Hub |

---

## Azure Monitor Insights

Pre-built monitoring experiences for specific Azure services.

| Insight | Monitors |
|---------|---------|
| **VM Insights** | VM performance (CPU, memory, disk, network), process and dependency map |
| **Container Insights** | AKS cluster health, node/pod metrics, container logs |
| **Network Insights** | Network topology, connectivity, VNet health |
| **Storage Insights** | Storage account performance, capacity, availability |
| **Application Insights** | App telemetry (requests, dependencies, exceptions, page views) |

### VM Insights Requirements

- Azure Monitor Agent (or legacy MMA) installed on VM
- Log Analytics workspace configured
- Enables performance charts and Map view (dependency mapping)

---

## Network Watcher

| Feature | Description |
|---------|-------------|
| **Connection Monitor** | Continuously test connectivity between sources and destinations (cross-region, cross-subscription) |
| **IP flow verify** | Quick yes/no: would an NSG block this traffic? |
| **NSG diagnostics** | Show all NSG rules affecting a NIC |
| **Next hop** | Which route table entry handles traffic to a destination? |
| **Packet capture** | Capture packets from a VM (max 5 hours, stored in storage account) |
| **VPN troubleshoot** | Diagnose VPN gateway connectivity |
| **Flow logs** | Record all IP flows through an NSG (stored in storage account) |

---

## Azure Backup

### Backup Vaults

| Vault Type | Supports | Notes |
|------------|---------|-------|
| **Recovery Services vault** | Azure VMs, Azure Files, SQL in VM, SAP HANA | Older; most VM backup scenarios |
| **Backup vault** | Azure Blobs, Managed Disks, PostgreSQL, AKS | Newer; for newer data sources |

### Backup Policy Components

| Component | Description |
|-----------|-------------|
| **Schedule** | Daily, weekly frequency and time |
| **Retention** | Daily, weekly, monthly, yearly retention ranges |
| **Backup tier** | Snapshot tier (fast restore) + vault tier (long-term) |
| **Instant restore** | Snapshot retained for 1-5 days for fast restore |

### Azure VM Backup Flow

1. Azure Backup triggers snapshot of VM disks
2. Snapshot transferred to Recovery Services vault
3. Backup item shows as "Protected" in vault

### Restore Options

| Option | Description |
|--------|-------------|
| **Create new VM** | Restore to a new VM from a recovery point |
| **Restore disk** | Restore the disk; attach to existing or new VM |
| **Replace existing disk** | Replace the VM's disk in-place |
| **File recovery** | Mount recovery point as a drive; copy individual files |

### Backup for Azure Files

- Vault-based backup (snapshot-based)
- Supports scheduled and on-demand backups
- Retention up to 10 years
- Integrated with Recovery Services vault

---

## Azure Site Recovery (ASR)

ASR provides disaster recovery (DR) by replicating workloads to a secondary region.

### ASR Concepts

| Concept | Description |
|---------|-------------|
| **Recovery Services vault** | Container for ASR replication configuration |
| **Source / target region** | Where the VM lives vs where it will fail over to |
| **Replication policy** | RPO (recovery point objective) — how often recovery points are created |
| **Recovery point** | Point-in-time snapshot of the replicated VM |
| **Recovery plan** | Ordered sequence of failover steps; can include scripts and manual actions |

### Failover Types

| Type | Description |
|------|-------------|
| **Test failover** | Non-disruptive validation; creates a test VM in isolated network |
| **Planned failover** | Graceful failover (source shutdown first); zero data loss |
| **Unplanned failover** | Emergency failover (source may still be running); possible data loss |
| **Failback** | Return to original region after recovery |

### RTO and RPO

| Term | Definition |
|------|-----------|
| **RPO (Recovery Point Objective)** | Maximum acceptable data loss; how old can the recovery point be? |
| **RTO (Recovery Time Objective)** | Maximum acceptable downtime; how quickly must service be restored? |

ASR typical RPO: 30 seconds to 24 hours (configurable).

---

## Azure Update Manager

Azure Update Manager (successor to Update Management in Automation) manages OS updates for Azure and Arc-enabled VMs.

| Feature | Description |
|---------|-------------|
| **Assessment** | Scan VMs for missing patches |
| **Maintenance configuration** | Schedule when updates are applied |
| **On-demand patching** | Install updates immediately |
| **Compliance reporting** | View patch compliance across subscriptions |
| **Supported OS** | Windows Server, major Linux distros |

---

## Exam Tips

- **Azure Monitor collects metrics AND logs** — metrics go to the time-series store, logs go to Log Analytics workspace.
- **Diagnostic settings** must be configured per resource — they are not enabled by default for most services.
- **Action groups** define the notification/remediation actions — they are shared across multiple alert rules.
- **Alert processing rules** are used for maintenance windows to suppress alerts — they do not modify the alert rule itself.
- **Recovery Services vault** = VM backup and ASR; **Backup vault** = blobs, managed disks, AKS.
- **Test failover** in ASR is non-disruptive — it does not affect the production environment.
- **Instant restore** uses snapshots (fast, short retention); vault-tier uses transferred data (slower, long retention).
- **File recovery** allows mounting a recovery point as a drive to restore individual files without restoring the entire VM.
- **Connection Monitor** is the modern tool for continuous connectivity testing, replacing the older Network Performance Monitor.
- **VM Insights** requires the Azure Monitor Agent — it cannot collect performance data without an agent.

---

## References

- [Azure Monitor documentation](https://learn.microsoft.com/en-us/azure/azure-monitor/)
- [Log Analytics workspace](https://learn.microsoft.com/en-us/azure/azure-monitor/logs/log-analytics-workspace-overview)
- [Azure Monitor Alerts](https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/alerts-overview)
- [Azure Backup documentation](https://learn.microsoft.com/en-us/azure/backup/)
- [Recovery Services vault](https://learn.microsoft.com/en-us/azure/backup/backup-azure-recovery-services-vault-overview)
- [Azure Site Recovery](https://learn.microsoft.com/en-us/azure/site-recovery/)
- [Network Watcher](https://learn.microsoft.com/en-us/azure/network-watcher/)
- [Azure Update Manager](https://learn.microsoft.com/en-us/azure/update-manager/)
- [KQL reference](https://learn.microsoft.com/en-us/azure/data-explorer/kql-quick-reference)
