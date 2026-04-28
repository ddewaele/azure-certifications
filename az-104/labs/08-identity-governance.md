# Lab 08: Identity, Governance & Storage Gaps

## Overview

Targets the Identity & Governance (61.1%) and Storage (68.75%) weak areas. Covers root management group elevation, tags and locks, SSPR scoping, managed identities with RBAC, object replication, storage account upgrade order, and Recovery Services vault constraints.

### Exam Trap Summary

| You might think... | Actually... |
|--------------------|-------------|
| Global Admin has root MG access by default | Must self-elevate via "Access management for Azure resources" in Entra ID first |
| Management Groups support locks | They don't — subscriptions and below only |
| SSPR applies to all users once enabled | Only the scoped group(s); Group2 gets nothing if SSPR is scoped to Group1 |
| 1 method satisfies SSPR if set to 2 required | No — the count is a hard gate regardless of answers |
| User Administrator can manage security questions | Requires Global Administrator |
| GRS gives read access to the secondary | Only RA-GRS does; GRS requires a failover first |
| v1 storage can use ZRS | Must upgrade to v2 first, then switch replication |
| RSV backs up resources in any region | RSV only backs up resources **in the same region** |
| App Service uses RSV or Backup Vault | App Service has its own built-in backup — neither vault |

---

## Part 1 – Root Management Group Elevation

### Concept

Nobody — including Global Administrators — has root management group access by default. The elevation process:

1. Global Admin enables **"Access management for Azure resources"** in Entra ID → Portal → Microsoft Entra ID → Properties
2. This grants **User Access Administrator** at the root `/` scope
3. From there, assign **Owner** or other roles to other principals at root or any child MG

> **Exam trap:** Owner role alone is not sufficient — the elevation step via Entra ID Properties is required first.

### Portal Steps

1. Navigate to **Microsoft Entra ID** → **Properties**
2. Under "Access management for Azure resources", toggle **Yes**
3. Click **Save**
4. Go to **Management Groups** → Root MG → **Access control (IAM)**
5. Assign **Owner** to the target user

### CLI Steps

```bash
# Step 1: Check your current role assignments at root scope
az role assignment list \
  --scope "/" \
  --output table

# Step 2: After enabling elevation in the portal, assign Owner at root scope
PRINCIPAL_ID=$(az ad user show \
  --id "admin@yourtenant.onmicrosoft.com" \
  --query id --output tsv)

az role assignment create \
  --role "Owner" \
  --assignee $PRINCIPAL_ID \
  --scope "/"

# Step 3: Verify
az role assignment list --scope "/" --output table
```

---

## Part 2 – Tags and Locks

### What supports tags and locks

| Resource type | Tags | Locks |
|---------------|------|-------|
| Management Groups | Yes | **No** |
| Subscriptions | Yes | Yes |
| Resource Groups | Yes | Yes |
| Resources | Yes | Yes |

> **Exam trap:** Management Groups look like containers you'd want to lock — but they don't support locks.

### Apply a lock to a resource group

```bash
RG="rg-governance-lab"
LOCATION="westeurope"

az group create --name $RG --location $LOCATION

# ReadOnly lock — blocks all writes including deletes
az lock create \
  --name "lock-rg-readonly" \
  --resource-group $RG \
  --lock-type ReadOnly \
  --notes "Lab: preventing accidental changes"

# CanNotDelete lock — allows writes, blocks deletes
az lock create \
  --name "lock-rg-nodelete" \
  --resource-group $RG \
  --lock-type CanNotDelete
```

```bash
# List locks on a resource group
az lock list --resource-group $RG --output table

# Remove a lock
az lock delete --name "lock-rg-readonly" --resource-group $RG
```

### Tags

```bash
# Apply tags to a resource group
az group update \
  --name $RG \
  --tags env=lab owner=davy costcenter=training

# Tags are additive with --set, not with az group update (which replaces)
az tag update \
  --resource-id $(az group show --name $RG --query id --output tsv) \
  --operation Merge \
  --tags department=platform

# List all resource groups with a specific tag
az group list \
  --tag env=lab \
  --query "[].{Name:name, Location:location}" \
  --output table
```

---

## Part 3 – SSPR Scoping and Method Count

### Concept

SSPR (Self-Service Password Reset) in Microsoft Entra ID has three scope options:
- **None** — disabled for all
- **Selected** — enabled only for the specified group(s)
- **All** — enabled for all users

> **Exam traps:**
> - If scoped to Group1, users in Group2 get **nothing** — there's no inheritance or fallback
> - "Number of methods required to reset" is a **hard gate** — if set to 2, a user answering security questions alone (even all of them) is never enough
> - Only **Global Administrator** can configure authentication methods and security questions — User Administrator cannot

### Portal Steps

1. **Microsoft Entra ID** → **Password reset** → **Properties**
2. Set Self service password reset enabled: **Selected**
3. Pick the group
4. Go to **Authentication methods** → set "Number of methods required to reset" → **2**
5. Enable methods: Mobile app code, Email, Security questions

### CLI (verify SSPR config via Graph)

```bash
# View current SSPR policy via Azure CLI (requires AzureAD or Graph module)
az rest \
  --method GET \
  --uri "https://graph.microsoft.com/v1.0/policies/authenticationMethodsPolicy" \
  --headers "Content-Type=application/json"
```

---

## Part 4 – Managed Identities

### Concept

When a VM needs to manage Azure resources without storing credentials, use a **managed identity**:

1. Enable **system-assigned managed identity** on the VM → Azure creates a service principal in Entra ID
2. Assign an **RBAC role** to that identity on the target resource (e.g., Contributor on a storage account)
3. The VM's code calls the Azure Instance Metadata Service (IMDS) to get a token — no passwords anywhere

> **Exam trap:** This is different from configuring IAM on the resource group directly. The identity lives on the VM; the RBAC assignment lives on the target resource.

```bash
SA_NAME="stmanagedid$(cat /proc/sys/kernel/random/uuid | tr -d '-' | cut -c1-8)"

az storage account create \
  --name $SA_NAME \
  --resource-group $RG \
  --location $LOCATION \
  --sku Standard_LRS
```

```bash
# Step 1: Create a VM
az vm create \
  --name vm-managed-id \
  --computer-name vm-managed-id \
  --resource-group $RG \
  --location $LOCATION \
  --image Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest \
  --size Standard_B2ts_v2 \
  --public-ip-address "" \
  --nsg "" \
  --admin-username azureuser \
  --generate-ssh-keys \
  --output none
```

```bash
# Step 2: Enable system-assigned managed identity on the VM
az vm identity assign \
  --name vm-managed-id \
  --resource-group $RG

# Get the principal ID of the VM's managed identity
PRINCIPAL_ID=$(az vm show \
  --name vm-managed-id \
  --resource-group $RG \
  --query "identity.principalId" \
  --output tsv)

echo "VM Managed Identity Principal ID: $PRINCIPAL_ID"
```

```bash
# Step 3: Assign Storage Blob Data Contributor to the identity on the storage account
SA_ID=$(az storage account show \
  --name $SA_NAME \
  --resource-group $RG \
  --query id --output tsv)

az role assignment create \
  --role "Storage Blob Data Contributor" \
  --assignee $PRINCIPAL_ID \
  --scope $SA_ID
```

```bash
# Verify the assignment
az role assignment list \
  --scope $SA_ID \
  --assignee $PRINCIPAL_ID \
  --output table
```

Inside the VM, code can now authenticate to storage using:
```bash
# Get a token from IMDS (no password needed)
curl -s -H Metadata:true \
  "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://storage.azure.com/"
```

---

## Part 5 – Storage Account Upgrade Order

### ZRS upgrade path

> **Exam trap:** General-purpose v1 does **not** support ZRS. Attempting to switch replication to ZRS on a v1 account will fail.

**Required order:**
1. Upgrade v1 → v2
2. Change replication to ZRS

```bash
# Create a v1 storage account (legacy — for demo only)
V1_SA="stv1demo$(cat /proc/sys/kernel/random/uuid | tr -d '-' | cut -c1-8)"

az storage account create \
  --name $V1_SA \
  --resource-group $RG \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind Storage

# Confirm it's v1
az storage account show \
  --name $V1_SA \
  --resource-group $RG \
  --query "{Kind:kind, Sku:sku.name}" \
  --output table
```

```bash
# Step 1: Upgrade to v2 first
az storage account update \
  --name $V1_SA \
  --resource-group $RG \
  --set kind=StorageV2

# Step 2: Now switch to ZRS
az storage account update \
  --name $V1_SA \
  --resource-group $RG \
  --sku Standard_ZRS
```

### Object Replication prerequisites

> **Exam trap:** Both source AND destination accounts must meet the requirements — not just the source.

| Requirement | Source | Destination |
|-------------|--------|-------------|
| Account type | GPv2 or Premium Block Blob | GPv2 or Premium Block Blob |
| Blob versioning | Must be enabled | Must be enabled |
| Change feed | Must be enabled | Not required |

```bash
SRC_SA="stobjsrc$(cat /proc/sys/kernel/random/uuid | tr -d '-' | cut -c1-8)"
DST_SA="stobjdst$(cat /proc/sys/kernel/random/uuid | tr -d '-' | cut -c1-8)"

for SA in $SRC_SA $DST_SA; do
  az storage account create \
    --name $SA \
    --resource-group $RG \
    --location $LOCATION \
    --sku Standard_LRS \
    --kind StorageV2

  # Enable blob versioning on both
  az storage account blob-service-properties update \
    --account-name $SA \
    --resource-group $RG \
    --enable-versioning true
done

# Enable change feed on source only
az storage account blob-service-properties update \
  --account-name $SRC_SA \
  --resource-group $RG \
  --enable-change-feed true

# Create containers
az storage container create --name source-container --account-name $SRC_SA
az storage container create --name dest-container   --account-name $DST_SA
```

```bash
# Create the object replication policy (destination side first — returns a policy ID)
DST_SA_ID=$(az storage account show --name $DST_SA --resource-group $RG --query id --output tsv)
SRC_SA_ID=$(az storage account show --name $SRC_SA --resource-group $RG --query id --output tsv)

POLICY_ID=$(az storage account or-policy create \
  --account-name $DST_SA \
  --resource-group $RG \
  --source-account $SRC_SA_ID \
  --destination-account $DST_SA_ID \
  --source-container source-container \
  --destination-container dest-container \
  --query policyId --output tsv)

# Apply the same policy ID to the source account
az storage account or-policy create \
  --account-name $SRC_SA \
  --resource-group $RG \
  --policy-id $POLICY_ID \
  --source-account $SRC_SA_ID \
  --destination-account $DST_SA_ID \
  --source-container source-container \
  --destination-container dest-container
```

---

## Part 6 – Recovery Services Vault vs Backup Vault

### Which vault backs up what

| Workload | Vault type |
|----------|-----------|
| Azure VMs | Recovery Services Vault (RSV) |
| SQL Server in Azure VMs | RSV |
| Azure File Shares | RSV |
| On-premises (MARS/DPM) | RSV |
| Azure Blobs | **Backup Vault** |
| Azure Disks | **Backup Vault** |
| Azure Database for PostgreSQL | **Backup Vault** |
| Azure App Service | **Neither** — uses App Service built-in backup |
| Azure Container Instances | **Neither** — not supported by either vault |

> **Exam trap:** RSV can only back up resources **in the same region**. A VM in East Asia needs an RSV in East Asia.

```bash
# Create a Recovery Services Vault
az backup vault create \
  --name rsv-governance-lab \
  --resource-group $RG \
  --location $LOCATION

# Verify
az backup vault show \
  --name rsv-governance-lab \
  --resource-group $RG \
  --query "{Name:name, Location:location, StorageType:properties.storageModelType}" \
  --output table
```

```bash
# Create a VM in the same region and enable backup
az vm create \
  --name vm-backup-test \
  --computer-name vm-backup-test \
  --resource-group $RG \
  --location $LOCATION \
  --image Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest \
  --size Standard_B2ts_v2 \
  --public-ip-address "" \
  --nsg "" \
  --admin-username azureuser \
  --generate-ssh-keys \
  --output none

az backup protection enable-for-vm \
  --vault-name rsv-governance-lab \
  --resource-group $RG \
  --vm vm-backup-test \
  --policy-name DefaultPolicy
```

```bash
# Confirm backup is configured
az backup item list \
  --vault-name rsv-governance-lab \
  --resource-group $RG \
  --output table
```

---

## Cleanup

```bash
az group delete --name $RG --yes --no-wait
```
