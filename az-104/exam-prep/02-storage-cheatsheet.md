# Domain 2 — Storage Cheatsheet (15–20%)

## Storage account kinds

| Kind | Supports | Use when |
|------|----------|----------|
| **General-purpose v2 (StorageV2)** | All services (blob, file, queue, table) + lifecycle policies | **Default — pick this unless told otherwise** |
| **General-purpose v1 (Storage)** | Legacy; no lifecycle, no hot/cool tiers, no ZRS | Avoid; upgrade to v2 |
| **BlockBlobStorage** | Premium block blob only | High-throughput blob workloads |
| **FileStorage** | Premium file shares only | High-IOPS / low-latency SMB |

> **TRAP:** **GPv1 doesn't support ZRS.** Sequence to enable ZRS on a v1 account = upgrade to v2 first, then change replication.

---

## Redundancy options

| Replication | Copies | Across | Read access to secondary |
|-------------|--------|--------|--------------------------|
| **LRS** | 3 | Single datacenter | N/A |
| **ZRS** | 3 | 3 zones in 1 region | N/A |
| **GRS** | 6 | Primary region (3) + paired secondary (3, async) | **NO** — failover required first |
| **RA-GRS** | 6 | Same as GRS | **YES** — read-only secondary endpoint |
| **GZRS** | 6 | Primary 3 zones + paired secondary 3 copies | NO — failover required |
| **RA-GZRS** | 6 | Same as GZRS | **YES** |

### "Read access to secondary?" decision

| Need | Pick |
|------|------|
| DR with failover | GRS / GZRS |
| DR + read secondary without failover | **RA-GRS / RA-GZRS** |

> **TRAP:** GRS does **NOT** give read access to the secondary. Only the **RA-** prefixed variants do.

### Pair regions

Each Azure region has a designated paired region (e.g., West Europe ↔ North Europe, East US ↔ West US). GRS/RA-GRS replicates to the pair — you can't pick the secondary.

---

## Access tiers (blob)

| Tier | Storage cost | Access cost | Min retention | Use case |
|------|-------------|-------------|----------------|----------|
| **Hot** | Highest | Lowest | None | Frequently accessed |
| **Cool** | Lower | Higher | **30 days** | Infrequent (≥30 d) |
| **Cold** | Even lower | Higher still | **90 days** | Rare (≥90 d) |
| **Archive** | Lowest | Very high + rehydration | **180 days** | Long-term backup |

### Archive rehydration

Archive blobs cannot be read directly. Two options:

| Method | Time |
|--------|------|
| Standard rehydration | Up to **15 hours** |
| High-priority rehydration | < 1 hour (small blobs only, premium pricing) |

### Tier-change rules

- **Hot ↔ Cool ↔ Cold** can be changed instantly via portal/CLI/lifecycle rule
- **Archive → any tier** requires rehydration (always slow)
- Setting a tier **before** the minimum retention period incurs an early-deletion charge

---

## Lifecycle management

JSON-based rules that move/delete blobs based on **last modified** or **last accessed**.

```json
{
  "rules": [{
    "name": "archive-old",
    "type": "Lifecycle",
    "enabled": true,
    "definition": {
      "filters": { "blobTypes": ["blockBlob"] },
      "actions": {
        "baseBlob": {
          "tierToCool":    { "daysAfterModificationGreaterThan": 30 },
          "tierToArchive": { "daysAfterModificationGreaterThan": 90 },
          "delete":        { "daysAfterModificationGreaterThan": 365 }
        }
      }
    }
  }]
}
```

> **TRAPS:**
> - Lifecycle runs **once a day** — changes are not immediate
> - Only supported on **GPv2, BlockBlobStorage, BlobStorage** — not GPv1
> - Last-accessed tracking must be **enabled on the account first**

---

## Blob containers — public access

| Level | Effect |
|-------|--------|
| **Private** (default) | Only authenticated requests |
| **Blob** | Anonymous read of blobs (not listing) |
| **Container** | Anonymous read + listing |

> **TRAP (since 2022 default):** New storage accounts disable anonymous access at the **account level**. The `--public-access blob/container` flag is silently ignored unless `allowBlobPublicAccess=true` is set on the account first.

```bash
az storage account update --name $SA --resource-group $RG --allow-blob-public-access true
```

---

## SAS (Shared Access Signature)

### Three flavors

| Type | Signed by | Use when |
|------|-----------|----------|
| **Account SAS** | Storage account key | Multi-service or admin operations |
| **Service SAS** | Storage account key OR stored access policy | Single service (blob/file/queue/table) |
| **User Delegation SAS** | **Entra ID credentials** (not account key) | **Most secure** — preferred answer when "minimize risk" |

### Constraints SAS can include

- Start/end time (always set an expiry)
- Permissions (read, write, delete, list, add, create)
- IP range
- HTTPS only
- Protocol (https, https+http)

### Stored access policy

A container-level policy that a **Service SAS** can reference. Lets you **revoke** all SAS tokens that use that policy without rotating the key. Up to 5 per container.

> **TRAP:** Account SAS cannot reference a stored access policy — only Service SAS can.

---

## Authentication methods

| Method | Use when |
|--------|----------|
| **Account key** | Admin scenarios; full account access |
| **SAS** | Time/permission-limited delegation |
| **Entra ID** | Enterprise; RBAC-driven; preferred for "least privilege" answers |
| **Anonymous** | Public read only; off by default on new accounts |

### Entra ID data-plane roles

| Role | Use |
|------|-----|
| **Storage Blob Data Reader** | Read blob data |
| **Storage Blob Data Contributor** | Read/write blob data |
| **Storage Blob Data Owner** | Full data + POSIX ACL management |
| **Storage Queue Data Reader / Contributor** | Queue equivalents |
| **Storage File Data SMB Share Reader / Contributor** | Azure Files via SMB + Entra ID |

> **TRAP:** "Storage Account Contributor" controls the management plane (account properties). Data-plane access requires the `*Data*` roles above.

---

## Object replication

Async copy of block blobs from a **source** account to a **destination** account.

### Requirements (BOTH accounts)

| Requirement | Source | Destination |
|-------------|--------|-------------|
| Account kind | GPv2 or Premium block blob | GPv2 or Premium block blob |
| Blob versioning | **Required** | **Required** |
| Change feed | **Required** | Not required |

> **TRAP:** Versioning must be on at **both** accounts, not just the source.

---

## Azure Files

| Feature | Detail |
|---------|--------|
| **Protocols** | SMB 2.1 / 3.0 / 3.1.1, NFS 4.1 (premium tier) |
| **Authentication** | Account key, Entra ID Domain Services, on-prem AD DS |
| **Tiers** | Transaction-optimized, Hot, Cool, Premium |
| **Snapshot count** | Up to 200 share snapshots |
| **Azure File Sync** | Cache shares on Windows Server with cloud tiering |

### Mount options

| Client | Method |
|--------|--------|
| Windows | `net use Z: \\<account>.file.core.windows.net\<share>` |
| Linux | `mount -t cifs //<account>.file.core.windows.net/<share> /mnt/...` |
| macOS | Finder → Go → Connect to Server → smb://... |

> **TRAP:** Direct internet SMB needs port **445** open outbound — many ISPs block it. Use **Azure File Sync** or VPN.

---

## AzCopy patterns

```bash
# Upload directory
azcopy copy '/local/dir/*' 'https://acct.blob.core.windows.net/cont/?<SAS>' --recursive

# Sync (only changed files)
azcopy sync '/local/dir' 'https://acct.blob.core.windows.net/cont/?<SAS>' --recursive

# Copy between two storage accounts
azcopy copy 'https://src.blob.core.windows.net/cont1/?<SAS>' 'https://dst.blob.core.windows.net/cont2/?<SAS>' --recursive
```

| Tool | Use when |
|------|----------|
| **AzCopy** | Bulk transfer (large volumes, scripting) |
| **Storage Explorer** | GUI exploration / occasional uploads |
| **Data Box family** | Multi-TB physical-shipment transfer |
| **Azure File Sync** | Hybrid file share caching |
| **Storage Mover** | Server-to-Azure file migration |

### Data Box variants

| Variant | Capacity |
|---------|----------|
| **Data Box Disk** | 8 TB per disk, up to 5 disks |
| **Data Box** | 80 TB usable |
| **Data Box Heavy** | 800 TB |

---

## Network rules / firewall

| Setting | Effect |
|---------|--------|
| Default action: **Allow** | All public traffic accepted (default for new accounts) |
| Default action: **Deny** | Block all unless rule allows |
| Allowed IPs / CIDRs | Public IP allow-list (no private RFC1918) |
| Allowed VNets | Service-endpoint subnet allow-list |
| Allowed Microsoft services | "Trusted Microsoft services" exception toggle |
| **Private endpoint** | Account gets a private IP in your VNet; bypasses all public network rules |

### Private endpoint vs Service endpoint

| Aspect | Service endpoint | Private endpoint |
|--------|------------------|------------------|
| Cost | Free | Per-hour + data |
| Network reach | Subnet → service over Microsoft backbone | Service has a private IP in your VNet |
| Public IP usage | Still uses public endpoint | Private only |
| Cross-region | No | Yes |
| **Pick when** | Lock storage to a VNet but service is still publicly addressable | Need to disable public access entirely / on-prem connectivity over VPN/ExpressRoute |

---

## Quick CLI patterns

```bash
# Create GPv2 LRS account with secure defaults
az storage account create \
  --name acctname \
  --resource-group RG \
  --sku Standard_LRS \
  --kind StorageV2 \
  --min-tls-version TLS1_2 \
  --https-only true \
  --allow-blob-public-access false

# Change replication
az storage account update --name acctname --resource-group RG --sku Standard_GRS

# Generate a service SAS for a container (1 hour, read+list)
END=$(date -u -v+1H '+%Y-%m-%dT%H:%MZ')
az storage container generate-sas \
  --name container1 --account-name acctname \
  --permissions rl --expiry $END --account-key $KEY

# Apply lifecycle policy
az storage account management-policy create \
  --account-name acctname --resource-group RG --policy @lifecycle.json
```
