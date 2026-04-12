# Troubleshooting: Monitoring and Backup

Covers Azure Monitor, Log Analytics, alerts, diagnostic settings, Azure Backup, and Site Recovery.

---

## Azure Monitor

### Metrics Not Appearing

| Issue | Cause | Fix |
|-------|-------|-----|
| No metrics data for a resource | Metrics collection takes 1–5 minutes after resource is created | Wait a few minutes; metrics are near-real-time but not instant |
| Custom metrics not appearing | Application/agent not sending metrics to the Azure Monitor endpoint | Verify agent configuration and connectivity to `*.monitor.azure.com:443` |
| Metrics visible but chart shows gaps | Resource was deallocated during that time window | Deallocated VMs do not emit metrics — this is expected |
| Metrics available in portal but not via API | Wrong metric namespace or metric name in API call | Use the portal to copy the exact metric name; namespaces differ by resource type |

### Alerts Not Firing

| Issue | Cause | Fix |
|-------|-------|-----|
| Alert rule condition met but no notification | Action group not attached to alert rule | Edit the alert rule and attach an action group |
| Action group attached but no email received | Email in spam, or action group has wrong email address | Check spam; verify email in action group; test action group via "Test action group" button |
| Alert fires but at wrong threshold | Alert uses "Total" aggregation instead of "Average" | Check the aggregation type in the alert condition (Average, Max, Min, Total, Count) |
| Alert rule shows "Resolved" immediately | Evaluation window is too short for intermittent spikes | Increase the aggregation granularity and evaluation period |
| Log alert not firing | KQL query returns no results, or wrong time range | Test the KQL query directly in Log Analytics; verify the alert evaluation window |
| Metric alert fires too frequently | Threshold too low or evaluation frequency too high | Raise threshold; increase evaluation frequency from 1m to 5m |
| Alert fires but VM was fine | Alert evaluated an aggregation across VMSS instances — one instance was high | Use "Split by" dimension to get per-instance alerts |

### Action Groups

| Issue | Cause | Fix |
|-------|-------|-----|
| Webhook receiver not getting calls | Firewall blocks incoming webhook calls from Azure | Azure Monitor webhooks come from multiple IPs — use service tag `ActionGroup` in NSG |
| Email action failing | Soft bounce from receiving mail server | Try a different email address; check mail server MX records |
| SMS not received | Phone number format wrong (must include country code) | Use E.164 format: +1XXXXXXXXXX |
| ITSM connector not creating tickets | Workspace not linked to ITSM tool | Re-configure ITSM connector in Log Analytics workspace |

---

## Log Analytics (Azure Monitor Logs)

### Agent Not Sending Data

The legacy **Log Analytics agent (MMA/OMS)** and the newer **Azure Monitor Agent (AMA)** both require connectivity and proper configuration.

| Issue | Cause | Fix |
|-------|-------|-----|
| Heartbeat missing for a VM | Agent not installed, or service stopped | Install/reinstall the agent; check `HealthService` (Windows) or `omsagent` (Linux) service |
| Agent installed but no data in workspace | Agent connected to wrong workspace (wrong Workspace ID/Key) | Verify workspace ID and key in agent configuration; reinstall with correct values |
| Linux agent shows "Not Healthy" | Permission issue, or SELinux blocking agent | Check `/var/log/omsagent.log`; ensure agent can write to its working directories |
| Windows agent event viewer error: "Keyset does not exist" (0x80090016) | Certificate store issue — agent cannot complete TLS handshake | Delete the agent's certificate and re-register: stop service, delete cert from cert store, restart |
| Data visible in workspace but query returns nothing | Wrong time range in KQL query, or filtering on wrong column | Remove time filters; use `search * | take 10` to verify data exists |
| AMA agent not sending data | Data Collection Rule (DCR) not associated with the VM | Associate a DCR with the VM in Azure Monitor > Data Collection Rules |

**Key tables to know for KQL queries:**

| Table | Contains |
|-------|---------|
| `Heartbeat` | Agent heartbeat — used to verify agent is alive |
| `Perf` | Performance counters (CPU, memory, disk) |
| `Event` | Windows Event Log entries |
| `Syslog` | Linux syslog entries |
| `AzureActivity` | Azure Activity Log (ARM plane operations) |
| `SecurityEvent` | Windows Security Event Log (requires Security solution) |
| `AzureDiagnostics` | Diagnostic logs from Azure resources |
| `AzureMetrics` | Azure resource metrics sent to workspace |

**Useful KQL patterns for troubleshooting:**
```kql
// Check if agent is alive (last heartbeat)
Heartbeat
| summarize LastHeartbeat = max(TimeGenerated) by Computer
| where LastHeartbeat < ago(1h)

// High CPU events
Perf
| where ObjectName == "Processor" and CounterName == "% Processor Time"
| where CounterValue > 90
| project TimeGenerated, Computer, CounterValue

// Failed sign-ins (if Security solution enabled)
SecurityEvent
| where EventID == 4625
| summarize FailedLogins = count() by Account, IpAddress
| sort by FailedLogins desc
```

### Diagnostic Settings

| Issue | Cause | Fix |
|-------|-------|-----|
| Resource diagnostic logs not appearing in workspace | Diagnostic setting not configured | Portal: Resource > Diagnostic settings > Add diagnostic setting > select workspace |
| Diagnostic setting configured but logs not flowing | Category not selected in diagnostic setting | Edit diagnostic setting; select the specific log categories (e.g. "StorageRead", "Delete") |
| Activity Log not forwarding to workspace | Activity Log diagnostic setting configured at subscription, not resource level | Activity Log forwarding is configured at the subscription level: Monitor > Activity log > Export settings |
| Deleted Event Hub re-created by diagnostic setting | Diagnostic setting targets a deleted Event Hub — Azure auto-recreates it | Update or delete the diagnostic setting to point to a different Event Hub |

---

## Azure Backup

### VM Backup Failures

| Issue | Cause | Fix |
|-------|-------|-----|
| "UserErrorGuestAgentStatusUnavailable" | VM agent not running or outdated | Update VM agent: Windows: download latest `WindowsAzureVmAgent.msi`; Linux: `sudo apt-get upgrade walinuxagent` |
| "GuestAgentSnapshotTaskStatusError" | VM agent cannot communicate with backup extension | Restart VM; re-register backup extension |
| Backup failing for encrypted VM (ADE) | Key Vault access policy doesn't allow the Backup service | Grant "get" permission on Keys and Secrets to the Backup service principal in Key Vault access policy |
| "UserErrorVmNotInDesirableState" | VM is in a failed provisioning state | Fix the VM state before backup can run |
| Backup snapshot takes too long | Large disks, heavy I/O load on VM during backup window | Schedule backup during low-activity periods; consider Premium SSD for faster snapshot |
| Recovery point inconsistency warning | Application-consistent backup requires VSS (Windows) / pre-post scripts (Linux) to be configured | Install VM agent; for Linux custom scripts: configure pre/post backup scripts |
| Backup succeeds but restore fails | Disk configuration changed (e.g., added data disks) since backup | Check restore options; may need to restore to a new VM and re-attach data disks manually |

### Backup Policy Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Old recovery points not deleted despite retention policy | Policy change does not retroactively delete existing recovery points | Old points expire naturally on their original retention date; new backups follow the new policy |
| Cannot change backup policy | Recovery Services vault has immutability enabled | Immutable vaults prevent policy changes — check vault settings |
| "ItemNotFound" error in backup | VM was deleted but backup item still exists in vault | Stop backup and delete backup data in the vault |
| Soft-deleted backup items appearing | Soft delete is enabled on the vault — deleted items are retained for 14 days | In vault > Backup items > filter by "Soft deleted"; permanently delete if needed |

### Restore Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Cannot restore to original VM | Original VM still exists and is running | Stop/deallocate the original VM, or restore to a new VM instead |
| File recovery mount not working | The recovery script requires specific Python version (Linux) or admin permissions (Windows) | Ensure Python 2.7+ is installed (Linux); run script as Administrator (Windows) |
| Restored VM has no network connectivity | Restored VM has same NIC config as original; IP conflict | Assign a new static IP or use DHCP; check for IP conflicts |

> **Exam note:** Azure Backup uses **application-consistent snapshots** on Windows (via VSS) and **file-system-consistent** snapshots on Linux by default. For application-consistent backups on Linux, you must configure pre/post backup scripts.

---

## Azure Site Recovery (ASR)

### Replication Not Starting

| Issue | Cause | Fix |
|-------|-------|-----|
| "Connectivity check failed" during ASR setup | Mobility service on source VM cannot reach ASR service | Open ports 443 and 9443 outbound from source VM to ASR service URLs |
| Source VM agent not discovered | Mobility service not installed on the VM | Install Mobility Service manually or use the portal's "Enable replication" which installs it automatically |
| Replication stuck at 0% | Network bandwidth insufficient, or large initial replica | Check bandwidth throttling settings; initial replication transfers full disk |

### Replication Health Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| RPO warning or breach | Replication lag — delta changes not syncing fast enough | Check network bandwidth from source to Azure; reduce network congestion |
| "Critical" replication health | Agent out of date, network disconnected, or source VM unhealthy | Update Mobility service agent; check network connectivity; resolve VM issues |
| Replicated VM shows "Resynchronization required" | Replication out of sync (VM restarted during sync, or snapshot failure) | Trigger resync from portal: Replication health > "Resynchronize" |

### Failover Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Test failover VM has no IP | Test failover network not configured | Before test failover, specify a test failover VNet in the recovery plan |
| Failover VM boots but application doesn't start | Startup scripts or dependencies not in recovery plan | Add automation scripts to the recovery plan to configure the environment after failover |
| Post-failover VM cannot access on-prem resources | Routing not updated after failover | Update DNS and routing tables after failover; update on-prem firewall rules |
| Cannot commit failover | Test failover not cleaned up | Clean up test failover first, then run actual failover |

> **Exam note:**
> - **Test failover** — non-disruptive; VM starts in isolated VNet; production unchanged
> - **Planned failover** — graceful; source VM is shut down cleanly before failover; zero data loss
> - **Unplanned failover** — emergency; source is already down; possible data loss up to the RPO
> - After failover: **re-protect** the VM so it starts replicating back to the original region (for failback)

---

## Resource Health and Service Health

| Tool | What it Shows | When to Use |
|------|--------------|------------|
| **Resource Health** | Whether your specific resource has any Azure platform issues | "Is Azure having problems with MY resource?" |
| **Service Health** | Azure-wide service outages, planned maintenance, and advisories | "Is Azure having a regional outage?" |
| **Azure Status** (status.azure.com) | Public status page for all Azure services globally | Major incidents visible publicly |
| **Activity Log** | Who did what to which resource and when | "Who deleted/changed my resource?" |
| **Advisor** | Recommendations for cost, security, reliability, performance | Proactive improvements |

### Activity Log — Common Use Cases

| Scenario | KQL / Filter |
|----------|-------------|
| Who deleted a resource | Filter: Operation = "Delete" → shows caller identity and time |
| Who changed an NSG rule | Filter: Resource type = NSG, Operation = "Write" |
| When was a VM stopped | Filter: Resource = VM name, Operation = "Deallocate" |
| Failed ARM deployments | Filter: Status = "Failed", Category = "Administrative" |

```bash
# Query Activity Log via CLI
az monitor activity-log list \
  --resource-group myRG \
  --start-time 2026-04-01 \
  --query "[?status.value=='Failed']" \
  --output table
```

---

## Quick Troubleshooting Reference

| Symptom | First Tool to Use |
|---------|------------------|
| Alert not firing | Check action group; test from portal |
| No logs in Log Analytics | Check Heartbeat table; verify agent; check DCR |
| VM backup failing | Check VM agent status |
| Can't restore VM | Check recovery point; verify target VNet |
| Replication health critical | Check Mobility service version and connectivity |
| Not sure if Azure platform issue | Resource Health + Service Health |
| Who changed my resource | Activity Log |
| Alert fires too often | Adjust threshold and evaluation window |
