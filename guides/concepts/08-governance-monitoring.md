# Governance, Compliance, and Monitoring

Tools for keeping your Azure environment consistent, compliant, and observable.

---

## Azure Policy

Azure Policy enforces organizational standards and evaluates compliance across your resources.

- Define rules (policies) that resources must comply with
- Azure automatically evaluates existing and new resources against policies
- Non-compliant resources are flagged — policies can optionally **deny** deployment of non-compliant resources
- Policies can be grouped into **initiatives** (formerly called policy sets)

Common built-in policies:
- Require a specific tag on all resources
- Restrict which regions resources can be deployed to
- Require encryption on storage accounts
- Allow only specific VM SKUs

```bash
# List built-in policy definitions
az policy definition list --query "[?policyType=='BuiltIn'].{name:displayName}" --output table

# Assign a policy to a resource group
az policy assignment create \
  --name "require-tag-env" \
  --policy "$(az policy definition list --query "[?displayName=='Require a tag on resources'].name" -o tsv)" \
  --scope /subscriptions/<sub-id>/resourceGroups/my-rg \
  --params '{"tagName": {"value": "Environment"}}'

# List policy assignments
az policy assignment list --output table
```

---

## Resource Locks

Locks prevent accidental deletion or modification of resources, regardless of RBAC permissions.

Two lock types:
| Lock | Effect |
|---|---|
| **CanNotDelete** | Read and modify are allowed, but delete is blocked |
| **ReadOnly** | Only reads are allowed — no modifications or deletes |

Locks apply to the resource, resource group, or subscription — and are inherited by child resources.

**Key exam point:** Even if you are an Owner on a resource, you cannot delete it if a CanNotDelete lock is applied. You must first remove the lock.

```bash
# Apply a delete lock to a resource group
az lock create \
  --name no-delete \
  --resource-group my-rg \
  --lock-type CanNotDelete

# List locks
az lock list --resource-group my-rg --output table

# Remove a lock
az lock delete --name no-delete --resource-group my-rg
```

---

## Microsoft Purview

Microsoft Purview (formerly Azure Purview) is a unified data governance service.

- Discover, classify, and understand data across your entire data estate (Azure, on-premises, other clouds)
- Create a data catalog so teams can find the data they need
- Track data lineage — where data comes from and how it flows
- Enforce data classification and sensitivity labels

AZ-900 level: understand that Purview is for data governance and compliance — classifying and understanding your data at scale.

---

## Azure Blueprints

Blueprints package multiple governance artifacts together for repeatable, compliant environment deployments:
- ARM templates
- Azure Policies
- RBAC role assignments
- Resource groups

Use case: "Every new project subscription should have these resource groups, this policy set, and this RBAC configuration — apply it all in one step."

**Note:** Azure Blueprints is being deprecated in favor of deploying the same components individually via Azure DevOps/Pipelines or using Deployment Stacks. For AZ-900, understand the concept.

---

## Management and Deployment Tools

### Azure Portal
Web-based graphical interface at portal.azure.com. Good for exploration and one-off tasks. Not suitable for automation.

### Azure CLI
Command-line tool for managing Azure. Cross-platform (Windows, macOS, Linux). Good for scripting and automation. This is what you've been using.

### Azure PowerShell
PowerShell module for Azure management. Same capabilities as CLI, preferred in Windows/Microsoft environments.

### Azure Cloud Shell
Browser-based shell accessible from the portal — comes pre-configured with Azure CLI, PowerShell, and common tools. Backed by persistent storage.

```bash
# You can access Cloud Shell at: https://shell.azure.com
```

### ARM Templates
JSON files that declaratively define the resources you want to deploy. Infrastructure as Code (IaC) for Azure.

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "resources": [
    {
      "type": "Microsoft.Storage/storageAccounts",
      "apiVersion": "2023-01-01",
      "name": "mystorageacct123",
      "location": "westeurope",
      "sku": { "name": "Standard_LRS" },
      "kind": "StorageV2"
    }
  ]
}
```

```bash
az deployment group create \
  --resource-group my-rg \
  --template-file template.json
```

### Bicep
A domain-specific language (DSL) that compiles to ARM templates. More readable and concise than raw JSON.

```bicep
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: 'mystorageacct123'
  location: 'westeurope'
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
}
```

### Azure Arc
Extends Azure management to resources outside Azure — on-premises servers, VMs in other clouds, Kubernetes clusters anywhere.

- Manage non-Azure servers as if they were Azure resources
- Apply Azure Policy, RBAC, and monitoring to non-Azure infrastructure
- Use Azure services (like Defender for Cloud) on-premises

---

## Monitoring

### Azure Monitor
The central monitoring service for Azure — collects, analyzes, and acts on telemetry from all Azure resources.

- **Metrics** — numerical time-series data (CPU %, requests/sec, etc.)
- **Logs** — structured log data stored in Log Analytics workspaces, queried with KQL
- **Alerts** — notifications triggered when metrics or log conditions are met
- **Dashboards** — custom visualizations in the portal

```bash
# List available metric definitions for a VM
az monitor metrics list-definitions \
  --resource /subscriptions/<sub-id>/resourceGroups/my-rg/providers/Microsoft.Compute/virtualMachines/my-vm \
  --output table

# Create an alert rule (CPU > 80%)
az monitor metrics alert create \
  --name high-cpu-alert \
  --resource-group my-rg \
  --scopes /subscriptions/<sub-id>/resourceGroups/my-rg/providers/Microsoft.Compute/virtualMachines/my-vm \
  --condition "avg Percentage CPU > 80" \
  --description "Alert when CPU exceeds 80%"
```

### Azure Service Health
Personalized dashboard showing the health of Azure services in the regions you use.

- **Azure Status** — global Azure outages (public)
- **Service Health** — issues affecting your subscriptions and regions
- **Resource Health** — health of your specific individual resources

Set up alerts to be notified when Azure services affecting you have incidents.

```bash
az monitor service-health alert list --output table
```

### Azure Advisor
Personalized recommendation engine that analyzes your Azure usage and suggests improvements across five categories:

| Category | Examples |
|---|---|
| **Cost** | Shut down idle VMs, right-size over-provisioned resources |
| **Security** | Enable MFA, apply missing security patches |
| **Reliability** | Enable backups, add redundancy |
| **Operational Excellence** | Apply tags, use ARM templates |
| **Performance** | Upgrade storage SKUs, optimize query performance |

```bash
az advisor recommendation list --output table
az advisor recommendation list --category Cost --output table
```

---

## Summary: Pick the Right Tool

| Need | Tool |
|---|---|
| Enforce rules on resources | Azure Policy |
| Prevent accidental deletion | Resource Locks |
| Classify and govern data | Microsoft Purview |
| Deploy standardized environments | Blueprints / ARM / Bicep |
| Manage non-Azure resources | Azure Arc |
| View metrics and logs | Azure Monitor |
| Check Azure service outages | Azure Service Health |
| Get cost/security recommendations | Azure Advisor |
