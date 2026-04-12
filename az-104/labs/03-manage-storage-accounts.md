# Lab 03: Manage Storage Accounts

## Overview

Create a storage account, configure redundancy and access settings, upload blobs, create SAS tokens, configure lifecycle management policies, and use Azure Storage Explorer and AzCopy. This lab covers the key storage tasks tested in AZ-104 Domain 2.

### Learning Objectives

- Create a storage account with specific redundancy settings
- Configure network access rules and firewalls
- Create blob containers and upload files
- Generate and test SAS tokens
- Configure lifecycle management policies
- Use AzCopy for data transfer

## Prerequisites

- Azure subscription with Contributor or Storage Account Contributor role
- Azure CLI installed or use Azure Cloud Shell
- Azure Storage Explorer downloaded (optional — https://azure.microsoft.com/features/storage-explorer/)
- AzCopy downloaded (optional — https://aka.ms/downloadazcopy-v10)

---

## Steps

### 1. Create a Storage Account

#### Azure CLI

```bash
# Variables
RG="rg-storage-lab"
LOCATION="eastus"
SA_NAME="salab$(date +%s | tail -c 6)"   # must be globally unique, 3-24 lowercase alphanumeric
echo "Storage account name: $SA_NAME"

# Create resource group
az group create --name $RG --location $LOCATION

# Create storage account (Standard GPv2, LRS)
az storage account create \
  --name $SA_NAME \
  --resource-group $RG \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2 \
  --access-tier Hot \
  --min-tls-version TLS1_2 \
  --https-only true

# Get the connection string
CONN_STR=$(az storage account show-connection-string \
  --name $SA_NAME --resource-group $RG --query connectionString -o tsv)
echo "Connection string retrieved"
```

#### Portal

1. Navigate to **Storage accounts** → **Create**
2. Configure:
   - **Resource group**: rg-storage-lab
   - **Storage account name**: globally unique name
   - **Region**: East US
   - **Performance**: Standard
   - **Redundancy**: Locally-redundant storage (LRS)
3. **Advanced** tab → set **Minimum TLS version**: TLS 1.2
4. Click **Review** → **Create**

**Explore:**
- After creation, navigate to **Data management** → **Redundancy** — observe LRS configuration
- Note the primary and secondary region fields (secondary only shows for GRS/GZRS)

---

### 2. Change Redundancy and Configure Network Rules

#### Change Redundancy to GRS (Portal)

1. Navigate to the storage account → **Data management** → **Redundancy**
2. Change from LRS to **Geo-redundant storage (GRS)**
3. Click **Save** — note the secondary region that is paired

#### Configure Network Firewall (CLI)

```bash
# Restrict access to specific networks (deny all public by default, then add exceptions)
az storage account update \
  --name $SA_NAME \
  --resource-group $RG \
  --default-action Deny

# Allow access from your current public IP
MY_IP=$(curl -s https://api.ipify.org)
az storage account network-rule add \
  --account-name $SA_NAME \
  --resource-group $RG \
  --ip-address $MY_IP

# Verify
az storage account network-rule list \
  --account-name $SA_NAME \
  --resource-group $RG \
  --output table
```

**Explore:**
- In the portal: **Security + networking** → **Networking** → **Firewalls and virtual networks**
- You will now see "Enabled from selected virtual networks and IP addresses" is active

---

### 3. Create Containers and Upload Blobs

#### CLI

```bash
# Re-enable public access for remaining lab steps
az storage account update \
  --name $SA_NAME \
  --resource-group $RG \
  --default-action Allow

# Get account key
ACCOUNT_KEY=$(az storage account keys list \
  --account-name $SA_NAME \
  --resource-group $RG \
  --query '[0].value' -o tsv)

# Create a container with private access
az storage container create \
  --name "private-data" \
  --account-name $SA_NAME \
  --account-key $ACCOUNT_KEY

# Create a container with blob-level public access
az storage container create \
  --name "public-blobs" \
  --account-name $SA_NAME \
  --account-key $ACCOUNT_KEY \
  --public-access blob

# Upload a test file
echo "Hello Azure Storage!" > /tmp/testfile.txt
az storage blob upload \
  --container-name "private-data" \
  --name "testfile.txt" \
  --file /tmp/testfile.txt \
  --account-name $SA_NAME \
  --account-key $ACCOUNT_KEY

# List blobs
az storage blob list \
  --container-name "private-data" \
  --account-name $SA_NAME \
  --account-key $ACCOUNT_KEY \
  --output table
```

**Explore:**
- In the portal: **Data storage** → **Containers** → select `private-data` → click the blob
- View **Properties** — note the URL, tier (Hot), and last modified time
- Try accessing the blob URL directly in a browser — should return 403 (private container)
- Upload a blob to `public-blobs` and access its URL — should be accessible

---

### 4. Create and Test SAS Tokens

#### Service SAS for a Single Container (CLI)

```bash
# Create a SAS token valid for 1 hour with read-only access to private-data
END_DATE=$(date -u -d "+1 hour" '+%Y-%m-%dT%H:%MZ' 2>/dev/null || date -u -v+1H '+%Y-%m-%dT%H:%MZ')

SAS_TOKEN=$(az storage container generate-sas \
  --name "private-data" \
  --account-name $SA_NAME \
  --account-key $ACCOUNT_KEY \
  --permissions rl \
  --expiry $END_DATE \
  --output tsv)

echo "SAS Token: $SAS_TOKEN"
echo "SAS URL: https://$SA_NAME.blob.core.windows.net/private-data?$SAS_TOKEN"
```

#### User Delegation SAS (Portal)

1. Navigate to the storage account → **Shared access signature**
2. Under **Allowed services**: Blob only
3. Under **Allowed resource types**: Object
4. Under **Allowed permissions**: Read, List
5. Set an expiry 1 hour in the future
6. Click **Generate SAS and connection string**
7. Copy the **Blob service SAS URL**

**Try:**
- Paste the SAS URL in a browser — you should be able to list blobs
- Modify the expiry to a past date — the request should return `AuthenticationFailed`

---

### 5. Configure Lifecycle Management

#### Portal

1. Navigate to storage account → **Data management** → **Lifecycle management** → **Add a rule**
2. Configure:
   - **Rule name**: `archive-old-blobs`
   - **Rule scope**: Limit blobs with filters → Blob type: Block blobs
3. **Base blobs** tab:
   - **Move to cool storage**: After 30 days since last modified
   - **Move to archive storage**: After 90 days since last modified
   - **Delete the blob**: After 365 days since last modified
4. Click **Add**

#### Azure CLI

```bash
cat > /tmp/lifecycle-policy.json << 'EOF'
{
  "rules": [
    {
      "name": "archive-old-blobs",
      "enabled": true,
      "type": "Lifecycle",
      "definition": {
        "filters": {
          "blobTypes": ["blockBlob"]
        },
        "actions": {
          "baseBlob": {
            "tierToCool": { "daysAfterModificationGreaterThan": 30 },
            "tierToArchive": { "daysAfterModificationGreaterThan": 90 },
            "delete": { "daysAfterModificationGreaterThan": 365 }
          }
        }
      }
    }
  ]
}
EOF

az storage account management-policy create \
  --account-name $SA_NAME \
  --resource-group $RG \
  --policy @/tmp/lifecycle-policy.json
```

**Explore:**
- Navigate to **Data management** → **Lifecycle management** to view the rule in the portal
- Lifecycle rules are evaluated once per day; changes do not take effect immediately

---

### 6. Use AzCopy

```bash
# If AzCopy is not installed, download it first
# https://aka.ms/downloadazcopy-v10

# Authenticate AzCopy with account key
export AZCOPY_ACCOUNT_KEY=$ACCOUNT_KEY

# Upload a directory of files
mkdir -p /tmp/upload-test
echo "file1" > /tmp/upload-test/file1.txt
echo "file2" > /tmp/upload-test/file2.txt

azcopy copy '/tmp/upload-test/*' \
  "https://$SA_NAME.blob.core.windows.net/private-data/" \
  --recursive

# List blobs in container
azcopy list "https://$SA_NAME.blob.core.windows.net/private-data/"

# Sync (upload new/changed, skip existing)
azcopy sync '/tmp/upload-test/' \
  "https://$SA_NAME.blob.core.windows.net/private-data/" \
  --recursive
```

---

## Cleanup

```bash
az group delete --name $RG --yes --no-wait
echo "Resource group deletion initiated"
```

---

## Key Takeaways

| Topic | Key Point |
|-------|-----------|
| Redundancy | LRS = 1 DC; ZRS = 3 AZs; GRS = 2 regions; RA-GRS = read secondary |
| Access tiers | Archive requires rehydration (up to 15h); lifecycle rules automate tier changes |
| SAS tokens | Limit by time, permission, IP, and protocol; User Delegation SAS = most secure |
| Stored access policies | Attach to container for server-side revocability of SAS tokens |
| Network rules | Default deny = all public blocked; add specific IP/VNet rules for exceptions |
| AzCopy | Faster than portal for bulk uploads; supports copy, sync, and remove |

## References

- [Azure Storage documentation](https://learn.microsoft.com/en-us/azure/storage/)
- [Blob storage access tiers](https://learn.microsoft.com/en-us/azure/storage/blobs/access-tiers-overview)
- [SAS tokens](https://learn.microsoft.com/en-us/azure/storage/common/storage-sas-overview)
- [Lifecycle management](https://learn.microsoft.com/en-us/azure/storage/blobs/lifecycle-management-overview)
- [AzCopy](https://learn.microsoft.com/en-us/azure/storage/common/storage-use-azcopy-v10)
- [Storage firewall](https://learn.microsoft.com/en-us/azure/storage/common/storage-network-security)
