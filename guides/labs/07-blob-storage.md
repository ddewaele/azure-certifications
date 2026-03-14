# Lab 07 — Storage Fundamentals

**Concepts covered:** Blob storage, Azure Files, Queue storage, Table storage, SAS tokens, access tiers, local upload/download

**Estimated cost:** ~$0.01 (a few cents for storage — delete promptly)

---

## Setup

```bash
RESOURCE_GROUP="az900-lab07-rg"
LOCATION="westeurope"
STORAGE_ACCOUNT="az900lab07$(openssl rand -hex 4)"  # globally unique, no hyphens, max 24 chars

az group create --name $RESOURCE_GROUP --location $LOCATION

az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2 \
  --access-tier Hot

# Export account name for convenience — most storage commands need it
export AZURE_STORAGE_ACCOUNT=$STORAGE_ACCOUNT

# Get and export the account key
export AZURE_STORAGE_KEY=$(az storage account keys list \
  --resource-group $RESOURCE_GROUP \
  --account-name $STORAGE_ACCOUNT \
  --query "[0].value" \
  --output tsv)

echo "Storage account: $STORAGE_ACCOUNT"
```

---

## Part A — Blob Storage

### A1 — Create a Container and Upload Files

```bash
# Create a container (like a top-level folder)
az storage container create --name uploads

# Create some test files locally
echo "Hello from Azure Blob Storage" > file1.txt
echo '{"name": "test", "value": 42}' > data.json
dd if=/dev/urandom bs=1M count=5 2>/dev/null | base64 > largefile.txt  # ~5MB

# Upload individual files
az storage blob upload \
  --container-name uploads \
  --name file1.txt \
  --file file1.txt

az storage blob upload \
  --container-name uploads \
  --name data/data.json \       # blob name can include virtual "folders" with /
  --file data.json

# Upload a whole local directory
mkdir -p mydir/subdir
echo "file a" > mydir/a.txt
echo "file b" > mydir/subdir/b.txt

az storage blob upload-batch \
  --destination uploads \
  --source mydir \
  --destination-path backups

# List blobs in the container
az storage blob list \
  --container-name uploads \
  --output table
```

### A2 — Download Files

```bash
# Download a single blob
az storage blob download \
  --container-name uploads \
  --name file1.txt \
  --file downloaded-file1.txt

cat downloaded-file1.txt

# Download all blobs matching a prefix
az storage blob download-batch \
  --destination ./downloaded \
  --source uploads \
  --pattern "backups/*"

ls -R ./downloaded
```

### A3 — Blob Properties and Metadata

```bash
# Show blob properties (size, content type, last modified, ETag)
az storage blob show \
  --container-name uploads \
  --name file1.txt \
  --output table

# Set custom metadata on a blob
az storage blob metadata update \
  --container-name uploads \
  --name file1.txt \
  --metadata author=azureuser purpose=lab

# Read the metadata back
az storage blob metadata show \
  --container-name uploads \
  --name file1.txt
```

### A4 — Access Tiers

```bash
# Upload the large file and set it to Cool tier (accessed infrequently)
az storage blob upload \
  --container-name uploads \
  --name largefile.txt \
  --file largefile.txt \
  --tier Cool

# Move it to Archive (offline — must rehydrate to read)
az storage blob set-tier \
  --container-name uploads \
  --name largefile.txt \
  --tier Archive

# Check the tier
az storage blob show \
  --container-name uploads \
  --name largefile.txt \
  --query "properties.blobTier" \
  --output tsv

# Try to download an archived blob — this will fail
az storage blob download \
  --container-name uploads \
  --name largefile.txt \
  --file /dev/null 2>&1 | grep -i error || echo "Expected: archived blobs cannot be read directly"

# Rehydrate to Hot tier (takes minutes to hours depending on priority)
az storage blob set-tier \
  --container-name uploads \
  --name largefile.txt \
  --tier Hot \
  --rehydrate-priority Standard
```

### A5 — Shared Access Signatures (SAS)

A SAS token grants time-limited, scoped access to a blob without sharing your account key.

```bash
# Generate a read-only SAS for file1.txt, valid for 1 hour
EXPIRY=$(date -u -v+1H '+%Y-%m-%dT%H:%MZ' 2>/dev/null || date -u -d '+1 hour' '+%Y-%m-%dT%H:%MZ')

SAS_TOKEN=$(az storage blob generate-sas \
  --account-name $STORAGE_ACCOUNT \
  --account-key $AZURE_STORAGE_KEY \
  --container-name uploads \
  --name file1.txt \
  --permissions r \
  --expiry $EXPIRY \
  --output tsv)

# Build the full URL
BLOB_URL="https://$STORAGE_ACCOUNT.blob.core.windows.net/uploads/file1.txt?$SAS_TOKEN"
echo "SAS URL: $BLOB_URL"

# Anyone with this URL can download the file (no auth header needed)
curl -s "$BLOB_URL"

# After expiry, or with wrong permissions, access is denied
# Generate a write-only SAS for uploads
SAS_WRITE=$(az storage blob generate-sas \
  --account-name $STORAGE_ACCOUNT \
  --account-key $AZURE_STORAGE_KEY \
  --container-name uploads \
  --name newfile.txt \
  --permissions w \
  --expiry $EXPIRY \
  --output tsv)

# You can upload to this URL but not read from it
curl -X PUT \
  -H "x-ms-blob-type: BlockBlob" \
  -H "Content-Type: text/plain" \
  -d "uploaded via SAS" \
  "https://$STORAGE_ACCOUNT.blob.core.windows.net/uploads/newfile.txt?$SAS_WRITE"
```

### A6 — Public vs Private Containers

```bash
# Create a public container (anyone can read blobs without a SAS)
az storage container create \
  --name public-assets \
  --public-access blob   # 'blob' = public read for blobs, 'container' = also list blobs

# Upload a file
az storage blob upload \
  --container-name public-assets \
  --name logo.txt \
  --file file1.txt

# Access directly with no credentials
curl "https://$STORAGE_ACCOUNT.blob.core.windows.net/public-assets/logo.txt"

# The 'uploads' container is private — direct access returns 404/403
curl "https://$STORAGE_ACCOUNT.blob.core.windows.net/uploads/file1.txt"
```

---

## Part B — Azure File Storage

Azure Files provides fully managed SMB/NFS file shares — you can mount them like a network drive.

```bash
# Create a file share (100 GB quota)
az storage share create \
  --name myfileshare \
  --quota 100

# Create a directory in the share
az storage directory create \
  --share-name myfileshare \
  --name documents

# Upload a file to the share
az storage file upload \
  --share-name myfileshare \
  --source file1.txt \
  --path documents/file1.txt

# List files
az storage file list \
  --share-name myfileshare \
  --path documents \
  --output table

# Download from the share
az storage file download \
  --share-name myfileshare \
  --path documents/file1.txt \
  --dest downloaded-from-share.txt

cat downloaded-from-share.txt
```

### Mount on macOS/Linux (SMB)

```bash
# Get the mount command from Azure
az storage account show \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --query "primaryEndpoints.file"

# Mount on macOS (requires port 445 to be open — may be blocked by ISP)
# sudo mkdir /Volumes/myfileshare
# sudo mount_smbfs \
#   //azureuser:$AZURE_STORAGE_KEY@$STORAGE_ACCOUNT.file.core.windows.net/myfileshare \
#   /Volumes/myfileshare

# Mount on Linux
# sudo mkdir /mnt/myfileshare
# sudo mount -t cifs \
#   //$STORAGE_ACCOUNT.file.core.windows.net/myfileshare /mnt/myfileshare \
#   -o username=$STORAGE_ACCOUNT,password=$AZURE_STORAGE_KEY,dir_mode=0777,file_mode=0777
```

> **Note:** Port 445 (SMB) is often blocked by residential ISPs. If mounting fails locally, it works reliably from inside Azure (VMs, ACI, App Service).

---

## Part C — Queue Storage

Queues decouple producers and consumers — one component puts messages in, another reads them.

```bash
# Create a queue
az storage queue create --name myqueue

# Send messages
az storage message put --queue-name myqueue --content "Process order #1001"
az storage message put --queue-name myqueue --content "Process order #1002"
az storage message put --queue-name myqueue --content "Process order #1003"

# Peek (read without removing)
az storage message peek --queue-name myqueue --num-messages 3 --output table

# Get and process a message (makes it invisible to other consumers for 30s)
MSG=$(az storage message get \
  --queue-name myqueue \
  --visibility-timeout 30 \
  --output json)

echo "Message content: $(echo $MSG | python3 -c 'import sys,json,base64; msgs=json.load(sys.stdin); print(base64.b64decode(msgs[0]["content"]).decode())')"

# After processing, delete the message using its ID and pop receipt
MSG_ID=$(echo $MSG | python3 -c 'import sys,json; msgs=json.load(sys.stdin); print(msgs[0]["id"])')
POP_RECEIPT=$(echo $MSG | python3 -c 'import sys,json; msgs=json.load(sys.stdin); print(msgs[0]["popReceipt"])')

az storage message delete \
  --queue-name myqueue \
  --id $MSG_ID \
  --pop-receipt "$POP_RECEIPT"

# Check remaining messages
az storage message peek --queue-name myqueue --num-messages 5 --output table
```

---

## Part D — Table Storage

Table storage is a NoSQL key-value store for structured data. No schema — rows can have different columns.

```bash
# Create a table
az storage table create --name products

# Insert entities (rows)
az storage entity insert \
  --table-name products \
  --entity PartitionKey=electronics RowKey=001 Name=Laptop Price=999 InStock=true

az storage entity insert \
  --table-name products \
  --entity PartitionKey=electronics RowKey=002 Name=Phone Price=699 InStock=false

az storage entity insert \
  --table-name products \
  --entity PartitionKey=books RowKey=001 Name="Azure Fundamentals" Price=49 Pages=320

# Query all entities
az storage entity query \
  --table-name products \
  --output table

# Query with a filter
az storage entity query \
  --table-name products \
  --filter "PartitionKey eq 'electronics'" \
  --output table

# Get a single entity by partition + row key
az storage entity show \
  --table-name products \
  --partition-key electronics \
  --row-key 001 \
  --output table
```

---

## Cleanup

```bash
rm -f file1.txt data.json largefile.txt downloaded-file1.txt downloaded-from-share.txt
rm -rf mydir downloaded

az group delete --name $RESOURCE_GROUP --yes --no-wait
```

---

## What You Learned

| Service | Key operations | When to use |
|---|---|---|
| Blob | upload/download, SAS, tiers | Files, media, backups, logs |
| Files | SMB/NFS mount, directory structure | Shared drives, lift-and-shift |
| Queue | put/get/delete messages | Decoupled async processing |
| Table | insert/query entities (partition+row key) | Simple structured NoSQL data |

- SAS tokens give time-limited, scoped access without sharing your account key
- Blob access tiers (Hot/Cool/Archive) trade access cost for storage cost
- Archived blobs must be rehydrated before they can be read
