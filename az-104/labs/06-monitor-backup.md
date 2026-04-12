# Lab 06: Monitor Resources and Configure Backup

## Overview

Set up a Log Analytics workspace, configure diagnostic settings, create Azure Monitor alerts with action groups, configure VM backup using a Recovery Services vault, and explore Azure Site Recovery concepts. This lab covers AZ-104 Domain 5.

### Learning Objectives

- Create a Log Analytics workspace and configure diagnostic settings
- Write basic KQL queries to analyse log data
- Create an Azure Monitor alert rule with an action group
- Configure VM backup with a Recovery Services vault
- Perform an on-demand backup and explore restore options
- Configure Azure Site Recovery (ASR) for a VM

## Prerequisites

- Azure subscription with Contributor role
- A VM deployed (use the VM from Lab 04, or create a new one)
- Azure CLI installed or use Azure Cloud Shell
- An email address for alert notifications

---

## Steps

### 1. Create a Log Analytics Workspace

```bash
# Variables
RG="rg-monitor-lab"
LOCATION="eastus"
VM_RG="rg-vm-lab"   # resource group where your VM lives (from Lab 04)
VM_NAME="vm-linux01"  # adjust as needed

az group create --name $RG --location $LOCATION

# Create Log Analytics workspace
az monitor log-analytics workspace create \
  --workspace-name law-az104-lab \
  --resource-group $RG \
  --location $LOCATION \
  --sku PerGB2018 \
  --retention-time 30

LAW_ID=$(az monitor log-analytics workspace show \
  --workspace-name law-az104-lab \
  --resource-group $RG \
  --query id -o tsv)
echo "Workspace ID: $LAW_ID"
```

**Portal Explore:**
- Navigate to **Log Analytics workspaces** → `law-az104-lab`
- Click **Logs** — this is the KQL query editor
- The workspace is empty until data sources are configured

---

### 2. Configure Diagnostic Settings

#### Send Azure Activity Logs to the Workspace

```bash
# Get subscription ID
SUB_ID=$(az account show --query id -o tsv)

# Route subscription activity log to the workspace
az monitor diagnostic-settings create \
  --name "send-activity-to-law" \
  --resource "/subscriptions/$SUB_ID" \
  --workspace $LAW_ID \
  --logs '[
    {
      "category": "Administrative",
      "enabled": true
    },
    {
      "category": "Security",
      "enabled": true
    },
    {
      "category": "Policy",
      "enabled": true
    }
  ]'
```

#### Install Azure Monitor Agent on VM

```bash
# Install the Azure Monitor Agent extension on the Linux VM
az vm extension set \
  --vm-name $VM_NAME \
  --resource-group $VM_RG \
  --name AzureMonitorLinuxAgent \
  --publisher Microsoft.Azure.Monitor \
  --version 1.0

# Verify
az vm extension list \
  --vm-name $VM_NAME \
  --resource-group $VM_RG \
  --output table
```

#### Create a Data Collection Rule

```bash
# Create a DCR to send Syslog to the workspace
az monitor data-collection rule create \
  --name dcr-syslog-lab \
  --resource-group $RG \
  --location $LOCATION \
  --data-flows '[
    {
      "streams": ["Microsoft-Syslog"],
      "destinations": ["law-destination"]
    }
  ]' \
  --destinations '{
    "logAnalytics": [
      {
        "workspaceResourceId": "'"$LAW_ID"'",
        "name": "law-destination"
      }
    ]
  }' \
  --data-sources '{
    "syslog": [
      {
        "streams": ["Microsoft-Syslog"],
        "facilityNames": ["kern", "syslog"],
        "logLevels": ["Warning", "Error", "Critical"],
        "name": "syslog-source"
      }
    ]
  }'

# Associate DCR with the VM
VM_ID=$(az vm show --name $VM_NAME --resource-group $VM_RG --query id -o tsv)
DCR_ID=$(az monitor data-collection rule show --name dcr-syslog-lab --resource-group $RG --query id -o tsv)

az monitor data-collection rule association create \
  --name "dcr-vm-linux01" \
  --resource $VM_ID \
  --rule-id $DCR_ID
```

---

### 3. Query Logs with KQL

**Portal — navigate to Log Analytics workspace → Logs:**

```kql
// Query heartbeat (confirms agent is connected)
Heartbeat
| where TimeGenerated > ago(1h)
| summarize LastHeartbeat = max(TimeGenerated) by Computer
| order by LastHeartbeat desc

// Query Azure activity log for resource deletions
AzureActivity
| where TimeGenerated > ago(24h)
| where OperationNameValue contains "delete" or OperationNameValue contains "Delete"
| project TimeGenerated, Caller, ResourceGroup, OperationNameValue, ActivityStatusValue

// Count operations by caller
AzureActivity
| where TimeGenerated > ago(24h)
| summarize OperationCount = count() by Caller
| order by OperationCount desc
| take 10

// Syslog errors
Syslog
| where TimeGenerated > ago(1h)
| where SeverityLevel in ("err", "crit", "alert", "emerg")
| project TimeGenerated, Computer, Facility, SeverityLevel, SyslogMessage
```

---

### 4. Create an Alert Rule with Action Group

#### Create an Action Group (Portal)

1. Navigate to **Monitor** → **Alerts** → **Action groups** → **Create**
2. Configure:
   - **Resource group**: rg-monitor-lab
   - **Action group name**: ag-lab-notifications
   - **Display name**: Lab Notifications
3. **Notifications** tab:
   - **Notification type**: Email/SMS message/Push/Voice
   - **Name**: email-alert
   - **Email**: your email address
4. Click **Review + create** → **Create**

#### Create an Action Group (CLI)

```bash
az monitor action-group create \
  --name ag-lab-notifications \
  --resource-group $RG \
  --short-name LabAlert \
  --action email email-admin your@email.com
```

#### Create a CPU Alert Rule (CLI)

```bash
# Get VM resource ID
VM_ID=$(az vm show --name $VM_NAME --resource-group $VM_RG --query id -o tsv)
AG_ID=$(az monitor action-group show --name ag-lab-notifications --resource-group $RG --query id -o tsv)

# Create metric alert for CPU > 80%
az monitor metrics alert create \
  --name "alert-high-cpu-vm-linux01" \
  --resource-group $RG \
  --scopes $VM_ID \
  --condition "avg Percentage CPU > 80" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --severity 2 \
  --description "Alert when CPU exceeds 80% for 5 minutes" \
  --action $AG_ID
```

#### Create an Activity Log Alert (Portal)

1. Navigate to **Monitor** → **Alerts** → **Create** → **Alert rule**
2. **Scope**: select your subscription or resource group
3. **Condition**: Activity log → select signal type **"Delete Virtual Machine (Microsoft.Compute/virtualMachines)"**
4. **Actions**: select `ag-lab-notifications`
5. **Details**: name `alert-vm-deleted`, severity 1
6. Click **Review + create** → **Create**

**Test the Alert:**
```bash
# Trigger CPU stress to test the metric alert (on the VM via run-command)
az vm run-command invoke \
  --name $VM_NAME \
  --resource-group $VM_RG \
  --command-id RunShellScript \
  --scripts "apt-get install -y stress && stress --cpu 4 --timeout 360 &"
```

---

### 5. Configure VM Backup

#### Create Recovery Services Vault

```bash
# Create Recovery Services vault
az backup vault create \
  --name rsv-az104-lab \
  --resource-group $RG \
  --location $LOCATION

# Set storage redundancy to GRS (default; best practice)
az backup vault backup-properties set \
  --vault-name rsv-az104-lab \
  --resource-group $RG \
  --backup-storage-redundancy GeoRedundant
```

#### Enable Backup on a VM

```bash
# Enable VM backup with the default policy
az backup protection enable-for-vm \
  --vault-name rsv-az104-lab \
  --resource-group $RG \
  --vm $(az vm show --name $VM_NAME --resource-group $VM_RG --query id -o tsv) \
  --policy-name DefaultPolicy

# Trigger an on-demand backup
az backup protection backup-now \
  --vault-name rsv-az104-lab \
  --resource-group $RG \
  --container-name "IaasVMContainer;iaasvmcontainerv2;${VM_RG};${VM_NAME}" \
  --item-name "VM;iaasvmcontainerv2;${VM_RG};${VM_NAME}" \
  --retain-until $(date -d "+30 days" '+%d-%m-%Y' 2>/dev/null || date -v+30d '+%d-%m-%Y')

# Monitor backup job status
az backup job list \
  --vault-name rsv-az104-lab \
  --resource-group $RG \
  --output table
```

**Portal Explore:**
- Navigate to `rsv-az104-lab` → **Protected items** → **Backup items** → **Azure Virtual Machine**
- Click the VM backup item to see:
  - **Last backup status**
  - **Restore points** (recovery points)
  - **Backup policy** applied

#### Create a Custom Backup Policy (Portal)

1. Navigate to **rsv-az104-lab** → **Manage** → **Backup policies** → **Add**
2. Select **Azure Virtual Machine**
3. Configure:
   - **Policy name**: daily-90d
   - **Backup schedule**: Daily at 2:00 AM
   - **Instant restore snapshots**: 2 days
   - **Daily retention**: 90 days
   - **Weekly retention**: 12 weeks (Sunday)
4. Click **Create**

---

### 6. Explore Restore Options

**Portal:**

1. Navigate to `rsv-az104-lab` → **Backup items** → select the VM
2. Click **Restore VM** to see options:
   - **Create new** → new VM in same or different region/resource group
   - **Replace existing** → replace OS disk on existing VM
3. Click **File Recovery** to explore:
   - Select a recovery point
   - Download the script to mount the disk
   - Note: mounting requires ILR (Item Level Recovery) support

---

## Cleanup

```bash
# Stop VM backup protection (retains existing recovery points)
az backup protection disable \
  --vault-name rsv-az104-lab \
  --resource-group $RG \
  --container-name "IaasVMContainer;iaasvmcontainerv2;${VM_RG};${VM_NAME}" \
  --item-name "VM;iaasvmcontainerv2;${VM_RG};${VM_NAME}" \
  --delete-backup-data true \
  --yes

# Delete all resources
az group delete --name $RG --yes --no-wait
echo "Monitor resource group deletion initiated"
```

---

## Key Takeaways

| Topic | Key Point |
|-------|-----------|
| Log Analytics | Central log store; agents send data; KQL for queries |
| Diagnostic settings | Not auto-enabled; must configure per resource |
| Data Collection Rules | Modern way to configure what AMA agent collects and where to send |
| Alert rules | Scope + condition + action group; severity 0 = Critical, 4 = Verbose |
| Action groups | Reusable across multiple alert rules; supports email, SMS, webhook, runbook |
| Recovery Services vault | VM backup + ASR; GRS recommended for vault storage |
| On-demand backup | Useful to capture current state before changes; keeps recovery point per retention rule |
| File recovery | Mounts recovery point as drive; no need to restore whole VM for single file recovery |

## References

- [Azure Monitor documentation](https://learn.microsoft.com/en-us/azure/azure-monitor/)
- [Log Analytics workspace](https://learn.microsoft.com/en-us/azure/azure-monitor/logs/log-analytics-workspace-overview)
- [KQL quick reference](https://learn.microsoft.com/en-us/azure/data-explorer/kql-quick-reference)
- [Azure Monitor Alerts](https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/alerts-overview)
- [Azure Backup](https://learn.microsoft.com/en-us/azure/backup/backup-azure-arm-vms-introduction)
- [Azure Site Recovery](https://learn.microsoft.com/en-us/azure/site-recovery/azure-to-azure-tutorial-enable-replication)
- [Data Collection Rules](https://learn.microsoft.com/en-us/azure/azure-monitor/essentials/data-collection-rule-overview)
