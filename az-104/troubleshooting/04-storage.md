# Troubleshooting: Storage

Covers Blob Storage access issues, Azure Files SMB connectivity, File Sync problems, SAS tokens, and network rules.

---

## Storage Account Access — General

### Authentication Methods (in order of security)

1. **Entra ID (RBAC)** — most secure; assign Storage Blob Data Reader/Contributor etc. to users/identities
2. **User Delegation SAS** — signed with Entra ID credentials; no account key needed
3. **Service SAS / Account SAS** — signed with account key; should be rotated; limited lifetime
4. **Account key** — full access; treat like a root password; store in Key Vault

### Common 403 / 401 Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `AuthorizationFailure` (403) | User/app has no RBAC role on storage account or container | Assign Storage Blob Data Reader/Contributor on the container or account |
| `AuthenticationFailed` (401) | Wrong account key, expired SAS, or wrong connection string | Regenerate key; check SAS expiry; update connection string |
| `PublicAccessNotPermitted` | Container has anonymous access disabled | Use proper auth (key/SAS/Entra ID) — do not enable anonymous access on production |
| `AuthorizationPermissionMismatch` | RBAC role assigned at account level but DataAction requires explicit container/blob role | Assign role with appropriate DataActions scope |
| `SasTokenExpired` | SAS token validity period has passed | Generate a new SAS token with future expiry |
| `SasTokenInvalidSignature` | SAS was signed with a different key than currently active | Regenerate SAS with the current key |

> **Exam note:** RBAC roles for storage have two categories:
> - **Management plane** (e.g. Contributor) — manage the storage account itself (keys, settings), NOT blob data
> - **Data plane** (e.g. Storage Blob Data Contributor) — read/write blob data
>
> A user with Contributor cannot read blob data via Entra ID unless they also have a Data role. But they CAN use the account key.

---

## Network Rules (Firewall) Blocking Access

When **Selected networks** or **Disabled (private endpoint only)** is configured, the default action is Deny.

### Diagnosing Network Rule Blocks

| Symptom | Cause | Fix |
|---------|-------|-----|
| Storage Explorer / CLI gets 403 from office network | Storage account firewall set to Selected networks; office IP not in allow list | Add office IP range to storage firewall IP rules |
| Azure service (e.g., Azure Functions) cannot access storage | Azure service not in the trusted services list | Enable "Allow Azure services on the trusted services list to access this storage account" OR add service endpoint/private endpoint |
| Storage account not reachable from VM in VNet | Service endpoint not configured on the VM's subnet | Add Microsoft.Storage service endpoint to the subnet + add subnet to storage network rules |
| Access works from portal but not from on-prem script | Portal access uses a trusted Microsoft IP; script uses on-prem IP | Add on-prem IP range to storage firewall |
| Backup job fails for storage account with firewall | Azure Backup service IP not in allowed list | Enable "Allow trusted Microsoft services" exception on the storage firewall |

```bash
# Check current network rules
az storage account show \
  --name mystorageacct --resource-group myRG \
  --query "networkRuleSet"

# Add your IP to the firewall
az storage account network-rule add \
  --account-name mystorageacct \
  --resource-group myRG \
  --ip-address 203.0.113.50
```

---

## Blob Storage

### Soft Delete and Versioning Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Blob was deleted but cannot find it in soft delete | Soft delete was not enabled before deletion | Cannot recover — soft delete only protects blobs deleted AFTER enabling |
| Soft-deleted blob not visible | Not filtering by "Show deleted blobs" in portal / `--include-deleted` in CLI | Enable the deleted blobs filter in Storage Browser |
| Cannot enable versioning | Storage account is GPv1, Premium, or has HNS enabled | Upgrade to GPv2 Standard; versioning incompatible with Hierarchical Namespace |
| Change feed not working | Storage account has HNS enabled (ADLS Gen2) | Cannot use change feed with HNS — must use a flat namespace account |
| Object replication not working | Source or destination account doesn't have versioning enabled | Enable versioning on BOTH accounts before configuring object replication |

### Lifecycle Management Not Running

| Issue | Cause | Fix |
|-------|-------|-----|
| Blobs not tiering to Cool/Cold/Archive as expected | Lifecycle policy rule condition not met (last modified date, access date) | Verify the "days after last modification" threshold; ensure last access tracking is enabled for access-time conditions |
| Archive rehydration taking too long | Standard priority rehydration can take up to 15 hours | Use "High Priority" rehydration (up to 1 hour) — costs more |
| Lifecycle policy created but nothing is happening | Policy propagation and evaluation can take up to 24 hours | Wait; lifecycle policies do not run immediately |

### Immutable Blob Storage (WORM)

| Issue | Cause | Fix |
|-------|-------|-----|
| Cannot delete a blob in an immutable container | Time-based retention policy is active and not expired | Wait for retention period to expire; legal hold must be cleared first |
| Cannot reduce retention period | You can only increase the retention period on a locked policy | This is by design — locked immutability policies cannot be shortened |
| Lifecycle management not deleting immutable blobs | Lifecycle management cannot delete blobs under an active immutability policy | Immutability takes precedence over lifecycle management |

---

## Azure Files (SMB Connectivity)

Azure Files uses **SMB 3.x** over **TCP port 445**. This port is commonly blocked by ISPs and corporate firewalls.

### Port 445 Blocked

**This is the #1 cause of Azure Files mount failures.**

| Where 445 is blocked | Symptom | Fix |
|---------------------|---------|-----|
| Home/office ISP | `net use` fails with "System error 53" or "System error 67" | Use Azure VPN or VNet service endpoint so traffic stays private; or use Azure File Sync as proxy |
| Corporate firewall | Mount works from Azure VM but not from office laptop | Work with network team to open TCP 445 outbound to Azure; or mount via Azure VPN |
| Azure NSG | Mount from Azure VM fails | NSG allows outbound TCP 445 by default — check for custom Deny rules |

**Test connectivity to port 445:**
```bash
# Windows (PowerShell)
Test-NetConnection -ComputerName mystorageacct.file.core.windows.net -Port 445

# Linux
nc -zvw3 mystorageacct.file.core.windows.net 445
```

### Common SMB Error Codes

| Error Code / Message | Cause | Fix |
|---------------------|-------|-----|
| `System error 53` — "Network path was not found" | DNS resolution failure, or TCP 445 blocked | Verify DNS resolution; check port 445 connectivity |
| `System error 86` — "Incorrect password" | Wrong storage account key in mount command | Verify key with `az storage account keys list` |
| `System error 87` — "Invalid parameter" | SMB dialect mismatch (Azure Files requires SMB 2.1+) | Windows 7/2008 R2 need KB2798694 update; use `vers=3.0` on Linux |
| `System error 5` — "Access denied" | Wrong storage key, or trying SMB 1.0 | Use correct key; ensure SMB 2.1+ is used |
| `AADSTS70011` / "Invalid client secret" | Identity-based auth configured but Kerberos ticket not available | Ensure device is joined to the correct domain (AD DS / Entra DS) |
| Mount disappears after reboot | Mount command not persisted | Windows: use `net use /persistent:yes` or store credentials in Credential Manager; Linux: add to /etc/fstab with `_netdev,nofail` |

### Identity-Based Authentication for Azure Files (Kerberos)

| Error | Cause | Fix |
|-------|-------|-----|
| "Access denied" despite correct share-level permissions | NTFS permissions not set on the share | Mount the share with the admin key, then use `icacls` / `chmod` to set NTFS permissions |
| Kerberos auth not working from on-prem | Storage account not joined to on-prem AD DS | Run `AzFilesHybrid` module: `Join-AzStorageAccountForAuth` |
| Azure Files Kerberos fails from Azure VM | VM not joined to Entra Domain Services | Join the VM to Entra DS and wait for DNS propagation |
| "Error 0x80070005 - Access Denied" | Share-level RBAC role not assigned | Assign Storage File Data SMB Share Reader/Contributor/Elevated Contributor role |

**Identity-based auth flow:**
1. Client acquires Kerberos ticket from domain controller (AD DS or Entra DS)
2. Client presents Kerberos ticket to Azure Files
3. Azure Files validates ticket
4. Share-level access checked (RBAC / share permissions)
5. File-level access checked (NTFS permissions)

> **Exam note:** Share-level permissions (RBAC roles) and file-level permissions (NTFS ACLs) are **independent layers** — both must allow access. Share-level controls whether you can connect to the share; NTFS controls what you can read/write within it.

---

## Azure File Sync

### Sync Errors

| Issue | Cause | Fix |
|-------|-------|-----|
| Server endpoint shows errors in portal | Agent version outdated; firewall blocking sync; disk full | Update agent; open ports 443 (outbound HTTPS) and 445 to Azure; free disk space |
| Files not syncing from server to cloud | Agent not running or server endpoint unhealthy | Restart FileSyncSvc service; check portal for error codes |
| Sync going but some files failing | Files locked by another process (open handles) | Close the application holding the file; or configure "offline" sync for temp files |
| Namespace sync completed but content not downloaded | Cloud tiering is enabled — files are tiered stubs | Touch or open the file to trigger recall; or use Invoke-StorageSyncFileRecall |
| Conflict files appearing (e.g., `filename-cloudpc.txt`) | Same file modified on two endpoints before sync completed | Manual resolution: keep the correct version; delete the conflict copy |
| Cloud tiering leaves only stubs on server | By design — tiering frees local space while keeping namespace | Disable cloud tiering on server endpoint if full local copy is required |

### Agent Registration Failures

| Issue | Cause | Fix |
|-------|-------|-----|
| Cannot register server | Firewall blocking ports 443 and/or 9443 | Open TCP 443 (HTTPS) outbound to Azure; Azure File Sync also needs port 9443 for registration |
| Server shows as "offline" in portal | Agent service not running | Start `FileSyncSvc` Windows service |
| Server endpoint stuck in "Pending" | Sync service initializing | Wait; first sync after setup takes time depending on data volume |

---

## SAS Token Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| SAS token returns 403 | Wrong permissions in SAS; resource type mismatch (sco vs blob only) | Regenerate SAS with correct permissions and resource type |
| SAS token returns 403 after key rotation | SAS was signed with the old key | Regenerate SAS with the new key |
| SAS token works from one machine but not another | Start time set in the future, or clock skew | Set start time 15 minutes in the past to allow for clock skew |
| User Delegation SAS stops working | Entra ID credentials that signed it expired or user was removed | Re-issue a new user delegation SAS with current credentials |
| Stored Access Policy revoked SAS | Stored access policy was deleted or modified | Regenerate SAS with a new stored access policy |

> **Exam note:** Revoking a Service SAS / Account SAS without a stored access policy requires rotating the account key — which also invalidates ALL other tokens signed with that key. Using **Stored Access Policies** allows you to revoke a specific SAS without rotating the key.

---

## Storage Redundancy and Availability

| Issue | Cause | Fix |
|-------|-------|-----|
| Cannot change from LRS to GRS | Large file shares is enabled (LRS/ZRS only) | Cannot use GRS with large file shares — must disable large file shares (irreversible once enabled) |
| RA-GRS secondary reads returning old data | Geo-replication has a lag (typically <15 min, but SLA is the RPO) | This is expected behavior — secondary is eventually consistent |
| Storage account unavailable during planned failover | Failover is being performed (takes ~1 hour) | Wait for failover to complete |
| After failover, account is now LRS | Customer-managed failover converts GRS to LRS in the new primary region | You must reconfigure GRS redundancy after failover |
