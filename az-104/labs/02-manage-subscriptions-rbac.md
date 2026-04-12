# Lab 02: Manage Subscriptions, RBAC, and Governance

## Overview

Configure RBAC role assignments at multiple scopes, apply resource locks, create Azure Policy definitions, manage resource tags, and explore cost management. These governance skills are tested heavily in the AZ-104 exam Domain 1.

### Learning Objectives

- Assign RBAC roles at subscription and resource group scope
- Apply CanNotDelete and ReadOnly resource locks and test their effects
- Create and assign an Azure Policy to enforce resource tagging
- Apply tags to resources and review them in Cost Analysis
- Explore Azure Cost Management: budgets and alerts

## Prerequisites

- Azure subscription (Owner role required for role assignment and policy)
- Azure CLI installed or use Azure Cloud Shell

---

## Steps

### 1. Configure RBAC at Multiple Scopes

#### Create Test Resources

```bash
# Create two resource groups
az group create --name rg-governance-prod --location eastus
az group create --name rg-governance-dev --location eastus

# Create a test user (or use an existing one)
az ad user create \
  --display-name "Dev User" \
  --user-principal-name "dev.user@<yourdomain>.onmicrosoft.com" \
  --password "TempPass@123!" \
  --force-change-password-next-sign-in true

DEV_USER_ID=$(az ad user show --id dev.user@<yourdomain>.onmicrosoft.com --query id -o tsv)
echo "Dev user ID: $DEV_USER_ID"
```

#### Assign Reader at Subscription Scope, Contributor at Resource Group Scope

```bash
# Get subscription ID
SUB_ID=$(az account show --query id -o tsv)

# Assign Reader at subscription scope
az role assignment create \
  --role "Reader" \
  --assignee-object-id $DEV_USER_ID \
  --scope "/subscriptions/$SUB_ID"

# Assign Contributor at rg-governance-dev scope
az role assignment create \
  --role "Contributor" \
  --assignee-object-id $DEV_USER_ID \
  --scope $(az group show --name rg-governance-dev --query id -o tsv)

# View effective assignments
az role assignment list --assignee $DEV_USER_ID --output table
```

**Explore:**
- The dev user has **Reader** inherited on `rg-governance-prod` (from subscription)
- The dev user has **Contributor** (overrides) on `rg-governance-dev`
- Navigate to `rg-governance-prod` → **Access control (IAM)** → **Check access** → search dev user

---

### 2. Apply Resource Locks

#### CanNotDelete Lock (Portal)

1. Navigate to `rg-governance-prod` → **Settings** → **Locks** → **Add**
2. Configure:
   - **Lock name**: `lock-no-delete`
   - **Lock type**: Delete
3. Click **OK**

**Test:** Try to delete the resource group → should fail with "scope is locked"

#### ReadOnly Lock (CLI)

```bash
# Apply a ReadOnly lock to a storage account (create one first)
az storage account create \
  --name "sa$(date +%s)" \
  --resource-group rg-governance-dev \
  --sku Standard_LRS

# Apply ReadOnly lock
az lock create \
  --name "lock-readonly" \
  --resource-group rg-governance-dev \
  --lock-type ReadOnly

# Try to create a resource in the locked group (should fail)
az storage container create \
  --name mycontainer \
  --account-name <storage-account-name>
# Expected: ManagementLockConflict error

# Remove the lock
az lock delete \
  --name "lock-readonly" \
  --resource-group rg-governance-dev
```

**Explore:**
- ReadOnly lock prevents even writes/creates, not just deletes
- Locks are visible in the Azure portal under the resource's **Locks** blade
- Locks apply to child resources (a lock on a resource group covers all its resources)

---

### 3. Create and Assign an Azure Policy

#### Create a Policy: Require a Tag on Resource Groups (Portal)

1. Navigate to **Policy** → **Definitions** → search for "Require a tag on resource groups"
2. Click the built-in policy → **Assign**
3. Configure:
   - **Scope**: your subscription
   - **Exclusions**: leave empty
4. Click **Parameters** tab:
   - **Tag name**: `Environment`
5. Click **Review + create** → **Create**

#### Create a Custom Policy via CLI

```bash
# Create a policy definition that requires an Environment tag
cat > /tmp/policy-rule.json << 'EOF'
{
  "if": {
    "allOf": [
      {
        "field": "type",
        "equals": "Microsoft.Resources/resourceGroups"
      },
      {
        "field": "tags['Environment']",
        "exists": "false"
      }
    ]
  },
  "then": {
    "effect": "audit"
  }
}
EOF

az policy definition create \
  --name "require-environment-tag" \
  --display-name "Audit resource groups without Environment tag" \
  --description "Audits resource groups that do not have the Environment tag" \
  --rules /tmp/policy-rule.json \
  --mode All

# Assign the policy to the subscription
az policy assignment create \
  --name "audit-rg-environment-tag" \
  --display-name "Audit RGs without Environment tag" \
  --policy "require-environment-tag" \
  --scope "/subscriptions/$(az account show --query id -o tsv)"
```

**Explore:**
- Navigate to **Policy** → **Compliance** — newly assigned policies show as Non-compliant for existing resources
- Compliance evaluation can take up to 30 minutes
- Try creating a resource group without the `Environment` tag — with Audit effect it is allowed but logged

---

### 4. Apply and Manage Tags

#### Apply Tags to Resource Groups

```bash
# Tag the production resource group
az group update \
  --name rg-governance-prod \
  --tags Environment=Production CostCenter=IT

# Tag the dev resource group
az group update \
  --name rg-governance-dev \
  --tags Environment=Development CostCenter=Engineering

# View tags
az group show --name rg-governance-prod --query tags
```

#### Apply Tags to Individual Resources (Portal)

1. Navigate to any resource → **Tags** blade → add Name/Value pairs
2. Note: resource group tags do NOT automatically apply to child resources

**Try:**
- Navigate to **Cost Management** → **Cost analysis**
- Group by **Tag: Environment** to see cost breakdown by environment
- Note: tags take up to 24 hours to appear in cost reports

---

### 5. Explore Cost Management

#### Create a Budget with Alert

1. Navigate to **Cost Management + Billing** → **Budgets** → **Add**
2. Configure:
   - **Name**: `budget-lab-monthly`
   - **Reset period**: Monthly
   - **Amount**: $50 (or suitable amount)
3. Click **Next: Alerts**:
   - **Alert conditions**: 90% actual, 110% forecasted
   - **Alert recipients (email)**: your email
4. Click **Create**

#### Azure Advisor Cost Recommendations

1. Navigate to **Advisor** → **Cost** tab
2. Review any recommendations (idle VMs, reserved instances, right-size suggestions)

```bash
# View cost management budgets
az consumption budget list --output table

# View Azure Advisor recommendations (cost category)
az advisor recommendation list --category Cost --output table
```

---

## Cleanup

```bash
# Remove policy assignment and definition
az policy assignment delete --name "audit-rg-environment-tag" \
  --scope "/subscriptions/$(az account show --query id -o tsv)"
az policy definition delete --name "require-environment-tag"

# Remove locks
az lock delete --name "lock-no-delete" --resource-group rg-governance-prod

# Delete resource groups (and all resources in them)
az group delete --name rg-governance-prod --yes --no-wait
az group delete --name rg-governance-dev --yes --no-wait

# Delete test user
az ad user delete --id dev.user@<yourdomain>.onmicrosoft.com
```

---

## Key Takeaways

| Topic | Key Point |
|-------|-----------|
| RBAC scopes | Broader scope assignments inherit downward; more specific scope can grant additional permissions |
| Role stacking | Effective access = union of all role assignments; Deny assignments override |
| Resource locks | Lock must be removed before the operation can proceed; applies regardless of RBAC role |
| Azure Policy | Audit logs non-compliance; Deny prevents; DeployIfNotExists auto-remediates |
| Tags | Manual or policy-enforced; used in cost allocation reports |
| Cost Management | Budgets alert on spend; Advisor gives optimisation recommendations |

## References

- [Azure RBAC documentation](https://learn.microsoft.com/en-us/azure/role-based-access-control/)
- [Resource locks](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/lock-resources)
- [Azure Policy](https://learn.microsoft.com/en-us/azure/governance/policy/overview)
- [Resource tagging](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/tag-resources)
- [Azure Cost Management](https://learn.microsoft.com/en-us/azure/cost-management-billing/)
