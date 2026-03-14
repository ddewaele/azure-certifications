# Azure Storage

Azure Storage is a managed cloud storage solution offering different storage types for different data shapes and access patterns.

---

## Storage Account

All Azure Storage services live inside a **storage account** — the top-level container for your data.

```bash
az storage account create \
  --name mystorageacct123 \
  --resource-group my-rg \
  --location westeurope \
  --sku Standard_LRS \
  --kind StorageV2
```

- Account name must be globally unique (3–24 chars, lowercase letters and numbers only)
- The SKU controls redundancy (see below)
- `StorageV2` (general-purpose v2) is the recommended type — supports all storage services

### Types

- Standard general-purpose v2
- Premium block blobs (high-performance SSD for block blobs)
- Premium file shares (high-performance SSD for file shares)
- Premium page blobs (high-performance SSD for page blobs, used for VM disks)



### Redundancy Options

- **LRS** : Locally redundant storage
- **GRS** : Geo-redundant storage
- **RA-GRS** : Read-access geo-redundant storage
- **ZRS** : Zone-redundant storage
- **GZRS** : Geo-zone-redundant storage
- **RA-GZRS** : Read-access geo-zone-redundant storage

---

## Storage Services

### Blob Storage
Object storage for unstructured data — files, images, videos, backups, logs, anything.

- Accessible via HTTP/S from anywhere
- Three blob types:
  - **Block blobs** — most common; text, binary, media files
  - **Append blobs** — optimized for append operations; log files
  - **Page blobs** — random read/write; used for VM disks (VHDs)
- Organized into: Storage Account → Container → Blob

```bash
# Create a container
az storage container create --name mycontainer --account-name mystorageacct123

# Upload a file
az storage blob upload \
  --account-name mystorageacct123 \
  --container-name mycontainer \
  --name myfile.txt \
  --file ./myfile.txt

# List blobs
az storage blob list \
  --account-name mystorageacct123 \
  --container-name mycontainer \
  --output table
```

### Access Tiers (Blob)
Blob storage has four access tiers optimized for different access frequencies:

| Tier | Access frequency | Storage cost | Access cost | Min storage duration |
|---|---|---|---|---|
| **Hot** | Frequent | High | Low | None |
| **Cool** | Infrequent (≥30 days) | Lower | Higher | 30 days |
| **Cold** | Rare (≥90 days) | Lower | Higher | 90 days |
| **Archive** | Rarely, offline | Lowest | Highest | 180 days |

- Archive blobs must be "rehydrated" before they can be read (takes hours)
- Lifecycle management policies can automatically move blobs between tiers

### Azure File Storage
Fully managed file shares accessible over SMB (Server Message Block) and NFS protocols.

- Can be mounted on Windows, Linux, and macOS — just like a network drive
- Use case: lift-and-shift apps that need shared file system access, replacing on-premises file servers
- Supports Azure File Sync to sync on-premises file servers with cloud shares

```bash
az storage share create \
  --name myfileshare \
  --account-name mystorageacct123 \
  --quota 10
```

### Azure Queue Storage
Message queue for storing large numbers of messages accessible via HTTP/S.

- Each message can be up to 64 KB
- Queue can hold millions of messages
- Use case: decouple application components, asynchronous processing

```bash
az storage queue create --name my-queue --account-name mystorageacct123
az storage message put --queue-name my-queue --account-name mystorageacct123 --content "hello"
```

### Azure Table Storage
NoSQL key-value store for structured, non-relational data.

- Schema-less — each row can have different columns
- Fast for simple key-based lookups
- Use case: storing large amounts of structured data that doesn't need relational queries
- Lower cost than Azure SQL or Cosmos DB for simple scenarios

### Azure Disk Storage
Block-level storage volumes used as virtual hard disks for Azure VMs.

- **Managed disks** — Azure manages storage account complexity for you (recommended)
- Disk types by performance:

| Type | Backing | Use case |
|---|---|---|
| Ultra Disk | SSD | Mission-critical, highest IOPS |
| Premium SSD v2 | SSD | Production databases |
| Premium SSD | SSD | Production workloads |
| Standard SSD | SSD | Dev/test, light production |
| Standard HDD | HDD | Backup, archival, non-critical |

---

## Storage Redundancy

Redundancy protects your data against hardware failures. More redundancy = higher cost and higher durability.

### Within a region

| Option | Full name | Description |
|---|---|---|
| **LRS** | Locally Redundant Storage | 3 synchronous copies within a single datacenter |
| **ZRS** | Zone-Redundant Storage | 3 synchronous copies across 3 availability zones in one region |

![alt text](image-8.png)
![alt text](image-9.png)


### Cross-region (geo-redundant)

| Option | Full name | Description |
|---|---|---|
| **GRS** | Geo-Redundant Storage | LRS in primary + async copy to secondary region (LRS) |
| **GZRS** | Geo-Zone-Redundant Storage | ZRS in primary + async copy to secondary region (LRS) |
| **RA-GRS** | Read-Access GRS | GRS + read access to secondary region |
| **RA-GZRS** | Read-Access GZRS | GZRS + read access to secondary region |

![alt text](image-10.png)
![alt text](image-11.png)


Durability: all options provide at least **11 nines** (99.999999999%) of durability.

Because data is replicated to the secondary region asynchronously, a failure that affects the primary region may result in data loss if the primary region can't be recovered. The interval between the most recent writes to the primary region and the last write to the secondary region is known as the recovery point objective (RPO). The RPO indicates the point in time to which data can be recovered. Azure Storage typically has an RPO of less than 15 minutes, although there's currently no SLA on how long it takes to replicate data to the secondary region.


**Key exam point:** secondary region data is read-only unless a failover is initiated (unless using RA-GRS/RA-GZRS).

---

## Storage Summary

| Service | Use for |
|---|---|
| Blob | Unstructured files, media, backups |
| Files | Shared drives (SMB/NFS mount) |
| Queue | Message queuing between services |
| Table | Simple structured NoSQL data |
| Disk | VM hard drives |

---

## Shared Access Signatures (SAS)

A SAS provides delegated, time-limited, permission-scoped access to storage resources without sharing account keys.

```bash
# Generate a SAS token for a blob
az storage blob generate-sas \
  --account-name mystorageacct123 \
  --container-name mycontainer \
  --name myfile.txt \
  --permissions r \
  --expiry 2025-12-31
```
