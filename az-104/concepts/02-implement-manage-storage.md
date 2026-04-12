# Implement and Manage Storage (15-20%)

Azure Storage is the foundational managed storage platform covering blobs, files, queues, tables, and disks.

---

## Storage Account Overview

A storage account is the top-level namespace for all Azure Storage services. The account type determines which services and redundancy options are available.

### Storage Account Types

| Account Type | Supported Services | Use Case |
|-------------|-------------------|---------|
| **Standard GPv2** | Blob, File, Queue, Table | General purpose; recommended for most scenarios |
| **Premium Block Blobs** | Block blobs only | High transaction rates, low latency (SSD-backed) |
| **Premium File Shares** | Azure Files only | High-performance SMB/NFS file shares (SSD-backed) |
| **Premium Page Blobs** | Page blobs only | Unmanaged VM disks, random I/O workloads |

Standard GPv2 is the recommended account type for most scenarios due to its flexibility and tiering support.

### Performance Tiers

| Tier | Storage | Use Case |
|------|---------|---------|
| **Standard** | HDD-backed | General workloads, archives, backups |
| **Premium** | SSD-backed | Low latency, high IOPS workloads |

---

## Storage Redundancy Options

Redundancy protects data from hardware failure, datacenter outage, or regional disasters.

### Redundancy Comparison

| Option | Full Name | Copies | Replication Scope | Recovery |
|--------|-----------|--------|-------------------|---------|
| **LRS** | Locally Redundant Storage | 3 | Single datacenter (same building) | Datacenter failure = data loss |
| **ZRS** | Zone-Redundant Storage | 3 | Three AZs in same region | Zone failure = protected |
| **GRS** | Geo-Redundant Storage | 6 (3+3) | Primary + secondary region | Regional disaster = protected |
| **GZRS** | Geo-Zone-Redundant Storage | 6 | ZRS primary + LRS secondary | Zone + regional = protected |
| **RA-GRS** | Read-Access GRS | 6 | Same as GRS | Read from secondary region |
| **RA-GZRS** | Read-Access GZRS | 6 | Same as GZRS | Read from secondary region |

- Secondary region is predetermined by Azure (paired regions)
- With RA-GRS/RA-GZRS, reads from the secondary use a `-secondary` suffix URL
- Failover to secondary region can be initiated manually (customer-managed failover)

---

## Access Tiers for Blob Storage

Access tiers optimise cost based on data access frequency.

| Tier | Use Case | Storage Cost | Access Cost | Minimum Duration |
|------|----------|-------------|-------------|-----------------|
| **Hot** | Frequently accessed | Highest | Lowest | None |
| **Cool** | Infrequently accessed (30+ days) | Medium | Medium | 30 days |
| **Cold** | Rarely accessed (90+ days) | Lower | Higher | 90 days |
| **Archive** | Long-term archive (180+ days) | Lowest | Highest | 180 days |

- **Archive** tier blobs are offline; must be **rehydrated** to Hot or Cool before access (up to 15 hours standard, 1 hour high priority)
- Tiers can be set at the **account level** (Hot/Cool default) or per **blob**
- Cold tier available at blob level only (not account level default)

### Lifecycle Management

Automatically move or delete blobs based on age:

| Rule Action | Description |
|-------------|-------------|
| **Tier to Cool** | After N days since last modified |
| **Tier to Cold** | After N days since last modified |
| **Tier to Archive** | After N days since last modified |
| **Delete blob** | After N days since last modified |
| **Delete snapshot** | After N days since snapshot created |

---

## Configure Access to Storage

### Access Keys

- Every storage account has **two 512-bit keys**
- Keys provide full access to the storage account
- Rotate keys regularly; store in Azure Key Vault
- Rotating key1 while apps use key2 prevents downtime

### Shared Access Signatures (SAS)

SAS tokens provide delegated, time-limited access to storage resources.

| SAS Type | Scope | Auth |
|----------|-------|------|
| **Account SAS** | Storage account level; multiple services | Signed with account key |
| **Service SAS** | Single service (Blob, File, Queue, Table) | Signed with account key |
| **User Delegation SAS** | Blob or Data Lake only | Signed with Entra ID credentials (more secure) |

SAS parameters:
- **Permissions**: Read, Write, Delete, List, Add, Create, Update
- **Resource types**: Service, container, object
- **Start/expiry time**: Window of validity
- **Allowed IP**: Restrict to specific IP ranges
- **Protocol**: HTTPS only (recommended)

### Stored Access Policies

- Server-side policy attached to a container/queue/table/share
- Referenced in Service SAS tokens
- Allows **revocation** of SAS tokens without regenerating keys
- Up to 5 stored access policies per container

### Azure Storage Firewalls and Virtual Networks

| Rule Type | Description |
|-----------|-------------|
| **Allow all networks** | Default; public access from anywhere |
| **Selected networks** | Allow specific VNets (via service endpoints) or IP ranges |
| **Disabled** | No public access; private endpoint only |
| **Resource instance rules** | Allow access from specific Azure services (e.g., Azure Backup) |

### Identity-Based Access for Azure Files

| Method | Description |
|--------|-------------|
| **On-premises AD DS** | Domain-join storage account to on-premises AD |
| **Entra Domain Services** | Managed AD DS in Azure |
| **Entra Kerberos** | For hybrid identities (AAD-joined or registered devices) |

---

## Azure Blob Storage

### Blob Types

| Type | Description | Use Case |
|------|-------------|---------|
| **Block blob** | Composed of blocks; optimised for sequential access | Documents, images, videos, backups |
| **Append blob** | Optimised for append operations only | Logs, audit records |
| **Page blob** | Random read/write access; 512-byte pages | VM disks (unmanaged), databases |

### Container Access Levels

| Access Level | Description |
|-------------|-------------|
| **Private** | No anonymous access; requires auth for all operations |
| **Blob** | Anonymous read for blobs; container listing requires auth |
| **Container** | Anonymous read for blobs and container listing |

### Blob Features

| Feature | Description |
|---------|-------------|
| **Versioning** | Automatically keep previous versions when blob is overwritten |
| **Soft delete (blobs)** | Retain deleted blobs for a configurable retention period (1-365 days) |
| **Soft delete (containers)** | Retain deleted containers |
| **Snapshots** | Read-only point-in-time copy of a blob |
| **Change feed** | Log of all changes to blobs (create, delete, tier change) |
| **Object replication** | Async copy of block blobs to another account/region |
| **Immutable storage** | WORM (write once, read many) via time-based or legal hold policies |

---

## Azure Files

Azure Files provides fully managed SMB and NFS file shares in the cloud.

### Azure Files vs Blob Storage

| Feature | Azure Files | Blob Storage |
|---------|------------|--------------|
| Protocol | SMB 3.0, NFS 4.1, REST | REST, HTTPS |
| Mount as drive | Yes (SMB/NFS) | No |
| Use case | Lift-and-shift, shared drives | Unstructured data, backups |
| Snapshots | Share snapshots | Blob snapshots |
| Soft delete | Per-share | Per-blob |

### Azure File Sync

Azure File Sync extends Azure Files to on-premises:

| Component | Description |
|-----------|-------------|
| **Storage Sync Service** | Top-level Azure resource for File Sync |
| **Sync group** | Defines the sync topology (cloud endpoint + server endpoints) |
| **Cloud endpoint** | Azure file share in the sync group |
| **Server endpoint** | Path on a registered Windows Server |
| **Cloud tiering** | Infrequently accessed files replaced with stubs; downloaded on demand |

### Azure Files Authentication

- **Storage account key** — full access, not user-specific
- **Identity-based (Kerberos)** — user-level access control with NTFS permissions
- **SAS tokens** — REST access with limited permissions

---

## Storage Security and Encryption

### Encryption

| Type | Description |
|------|-------------|
| **Encryption at rest** | All data encrypted by default using AES-256 (Storage Service Encryption) |
| **Microsoft-managed keys** | Default; keys managed by Microsoft |
| **Customer-managed keys (CMK)** | Keys stored in Azure Key Vault; customer controls rotation |
| **Customer-provided keys** | Customer sends key with each request (not stored by Azure) |
| **Encryption in transit** | HTTPS enforced by setting "Secure transfer required" |
| **Infrastructure encryption** | Optional double encryption at infrastructure level |

### Minimum TLS Version

- Set at account level
- Minimum TLS 1.2 recommended
- Connections using older TLS rejected

---

## Data Management Tools

| Tool | Description |
|------|-------------|
| **Azure Storage Explorer** | GUI tool for browsing and managing storage accounts (download on desktop) |
| **AzCopy** | Command-line tool for high-performance data copy to/from storage |
| **Azure Data Factory** | Orchestrated data pipelines for large-scale transfers |
| **Azure Import/Export service** | Physical disk shipping for large offline data transfers |

### AzCopy Common Commands

```bash
# Copy local file to blob
azcopy copy 'localfile.txt' 'https://<account>.blob.core.windows.net/<container>/<blob>' --recursive

# Sync local folder to blob container
azcopy sync 'C:\data' 'https://<account>.blob.core.windows.net/<container>' --recursive

# Copy between storage accounts
azcopy copy 'https://<src>.blob.core.windows.net/<container>?<SAS>' 'https://<dst>.blob.core.windows.net/<container>?<SAS>' --recursive
```

---

## Storage Limits and Quotas

Key numbers that appear in AZ-104 scenario questions.

### Storage Account Limits

| Limit | Value |
|-------|-------|
| Max storage accounts per subscription per region | 250 |
| Max storage account capacity | 5 PiB |
| Max ingress (West US, West Europe, etc.) | 10 Gbps (Standard) |
| Max egress | 50 Gbps (Standard) |
| Max request rate per account | 20,000 IOPS |

### Blob Storage Limits

| Limit | Value |
|-------|-------|
| Max **block blob** size | 190.7 TiB |
| Max single block size | 4,000 MiB |
| Max blocks per blob | 50,000 |
| Max **page blob** size | 8 TiB |
| Max **append blob** size | 195 GiB |
| Max blob name length | 1,024 characters |
| Max blob tags per blob | 10 |
| Soft delete retention (blobs/containers) | 1–365 days |
| Max stored access policies per container | 5 |

### Azure Files Limits

| Limit | Value |
|-------|-------|
| Max file share size (standard, default) | 5 TiB |
| Max file share size (**large file shares enabled**) | 100 TiB |
| Max file size | 4 TiB |
| Max files in a share | No practical limit |
| Max IOPS per standard share | 1,000 |
| Max IOPS per premium share | 100,000 |
| Max throughput per premium share | 10 GiB/s |
| Max share snapshots | 200 per share |
| Max storage sync services per subscription | 15 per region |
| Max sync groups per storage sync service | 100 |
| Max server endpoints per sync group | 50 |
| Max cloud endpoints per sync group | **1** |

### Queue Storage Limits

| Limit | Value |
|-------|-------|
| Max queue size | 500 TiB |
| Max message size | **64 KiB** |
| Max message TTL (time-to-live) | 7 days (default); up to **7 days** max via API |
| Max messages retrieved per dequeue | 32 |
| Visibility timeout range | 0 sec – 7 days |

> **Exam note:** If a message payload exceeds 64 KiB, the pattern is to store the payload in Blob Storage and put only the blob reference in the queue message.

### Table Storage Limits

| Limit | Value |
|-------|-------|
| Max entity (row) size | 1 MiB |
| Max property (column) value size | 64 KiB |
| Max properties per entity | 255 (including 3 system properties: PartitionKey, RowKey, Timestamp) |
| Max table name length | 63 characters |

### Managed Disk Limits

| Disk Type | Max Size | Max IOPS | Max Throughput |
|-----------|----------|----------|----------------|
| **Standard HDD (S)** | 32 TiB | 500 | 60 MB/s |
| **Standard SSD (E)** | 32 TiB | 6,000 | 750 MB/s |
| **Premium SSD (P)** | 32 TiB | 20,000 | 900 MB/s |
| **Ultra Disk** | 64 TiB | 160,000 | 2,000 MB/s |

| Limit | Value |
|-------|-------|
| Max data disks per VM (general) | Varies by VM size (e.g., Standard_D4s_v3 = 8 disks) |
| Max disk size (any type) | 64 TiB |
| Max snapshots per subscription | 25,000 per region |

### Key Feature Compatibility Constraints

| Feature | Requires | Incompatible With |
|---------|----------|-------------------|
| Blob versioning | StorageV2 or BlobStorage, Standard | Hierarchical Namespace (HNS) |
| Change feed | StorageV2, Standard | Hierarchical Namespace (HNS) |
| Large file shares | LRS or ZRS only | GRS, GZRS, RA-GRS, RA-GZRS |
| Large file shares | StorageV2 or FileStorage | Cannot be disabled once enabled |
| Object replication | Versioning enabled on both accounts | Archive tier source blobs |
| Hierarchical Namespace | Enabled at creation only | Versioning, change feed, object replication |
| NFS file shares | Premium FileStorage account | SMB at the same time on same share |
| Archive tier | GPv2 or BlobStorage account | Page blobs, append blobs |

---

## Exam Tips

- **LRS** = 3 copies in one datacenter; **ZRS** = 3 copies across 3 AZs; **GRS** = 6 copies across two regions.
- **Archive tier blobs are offline** — you must rehydrate before reading; standard rehydration can take up to 15 hours.
- **User Delegation SAS** is more secure than Account/Service SAS because it uses Entra ID credentials instead of the account key.
- **Stored access policies** allow you to revoke a SAS without regenerating the key.
- **Soft delete** must be enabled before accidental deletion — it does not protect data deleted before the feature was enabled.
- **Object replication** is asynchronous — data in the destination account may lag behind the source.
- **Azure Files** supports SMB and NFS protocols and can be mounted as a drive; Blob Storage cannot.
- **Azure File Sync cloud tiering** means files appear on the server but are actually stored in Azure — a stub is served until the file is accessed.
- **Encryption at rest** is always on (AES-256) — you cannot disable it; you can only choose who manages the keys.
- **RA-GRS** allows **read** access to the secondary region; regular GRS does not.

---

## References

- [Azure Storage documentation](https://learn.microsoft.com/en-us/azure/storage/)
- [Storage redundancy](https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy)
- [Blob storage access tiers](https://learn.microsoft.com/en-us/azure/storage/blobs/access-tiers-overview)
- [SAS tokens](https://learn.microsoft.com/en-us/azure/storage/common/storage-sas-overview)
- [Azure Files](https://learn.microsoft.com/en-us/azure/storage/files/storage-files-introduction)
- [Azure File Sync](https://learn.microsoft.com/en-us/azure/storage/file-sync/file-sync-introduction)
- [Lifecycle management](https://learn.microsoft.com/en-us/azure/storage/blobs/lifecycle-management-overview)
- [AzCopy](https://learn.microsoft.com/en-us/azure/storage/common/storage-use-azcopy-v10)
