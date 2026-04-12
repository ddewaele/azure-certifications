# AZ-104 Quick Reference Cheatsheet

Fast-reference tables for the AZ-104 exam. Use this alongside the concept files for exam review.

---

## 1. Identity and Governance Quick Reference

### Built-in RBAC Roles

| Role | Manage Resources | Assign Roles | Notes |
|------|-----------------|-------------|-------|
| **Owner** | Yes | Yes | Full access |
| **Contributor** | Yes | No | Cannot manage access |
| **Reader** | No (read only) | No | View only |
| **User Access Administrator** | No | Yes | Manage access only, not resources |

### RBAC Scope Hierarchy (top = broadest)

```
Management Group → Subscription → Resource Group → Resource
```

Roles assigned higher in the hierarchy are **inherited** downward.

### Entra ID License Features

| Feature | Free | P1 | P2 |
|---------|------|----|----|
| Users/Groups | Yes | Yes | Yes |
| SSO (unlimited apps) | No | Yes | Yes |
| Conditional Access | No | Yes | Yes |
| SSPR | No | Yes | Yes |
| Dynamic groups | No | Yes | Yes |
| Identity Protection | No | No | Yes |
| PIM | No | No | Yes |

### Azure Policy vs Resource Locks

| Feature | Azure Policy | Resource Lock |
|---------|-------------|---------------|
| Purpose | Enforce governance rules | Prevent accidental changes |
| Scope | Management group → resource | Subscription → resource |
| Inheritance | Yes | Yes |
| Bypass with RBAC? | No (deny effect is absolute) | No (must remove lock first) |
| Types | Audit, Deny, Modify, DeployIfNotExists, etc. | CanNotDelete, ReadOnly |

### Lock Types

| Lock | Allows Read | Allows Modify | Allows Delete |
|------|------------|--------------|--------------|
| **CanNotDelete** | Yes | Yes | No |
| **ReadOnly** | Yes | No | No |

### Management Group Limits

| Limit | Value |
|-------|-------|
| Max nesting levels | 6 (below root) |
| Subscriptions per management group | Unlimited |
| Management groups per directory | 10,000 |

---

## 2. Storage Quick Reference

### Storage Redundancy Options

| Option | Copies | Regions | Zone Resilient | Read Secondary |
|--------|--------|---------|---------------|----------------|
| **LRS** | 3 | 1 | No | No |
| **ZRS** | 3 | 1 (3 zones) | Yes | No |
| **GRS** | 6 | 2 | No | No |
| **GZRS** | 6 | 2 | Yes (primary) | No |
| **RA-GRS** | 6 | 2 | No | Yes |
| **RA-GZRS** | 6 | 2 | Yes (primary) | Yes |

### Blob Access Tiers

| Tier | Access | Storage Cost | Access Cost | Min Duration | Retrieval |
|------|--------|-------------|-------------|-------------|---------|
| **Hot** | Frequent | Highest | Lowest | None | Immediate |
| **Cool** | ≥30 days | Medium | Medium | 30 days | Immediate |
| **Cold** | ≥90 days | Lower | Higher | 90 days | Immediate |
| **Archive** | ≥180 days | Lowest | Highest | 180 days | Up to 15h |

### SAS Token Types

| Type | Scope | Signed With |
|------|-------|------------|
| **Account SAS** | Account, multiple services | Account key |
| **Service SAS** | Single service | Account key |
| **User Delegation SAS** | Blob/Data Lake only | Entra ID credentials (more secure) |

### Storage Account Types

| Type | Services | Performance |
|------|---------|------------|
| **Standard GPv2** | Blob, File, Queue, Table | Standard (HDD) |
| **Premium Block Blobs** | Block blobs only | Premium (SSD) |
| **Premium File Shares** | Files only | Premium (SSD) |
| **Premium Page Blobs** | Page blobs only | Premium (SSD) |

---

## 3. Compute Quick Reference

### VM Size Families

| Family | Prefix | Optimised For |
|--------|--------|--------------|
| General purpose | B, D | Balanced; dev/test, small apps |
| Compute optimised | F | High CPU; batch, gaming |
| Memory optimised | E, M | High RAM; databases, SAP |
| Storage optimised | L | High disk IOPS; NoSQL |
| GPU | N (NC, ND, NV) | ML, rendering |
| Burstable | B | Variable CPU; baseline + burst |

### Availability Options and SLAs

| Option | Protects From | SLA | Minimum |
|--------|--------------|-----|---------|
| None (single VM Premium SSD) | Nothing extra | 99.9% | 1 VM |
| Availability Set | Rack/power failure | 99.95% | 2 VMs |
| Availability Zone | Datacenter failure | 99.99% | 2 VMs in 2 zones |
| VMSS with zones | Zone failure + scale | 99.99% | Varies |

### App Service Plan Tiers

| Tier | Category | Custom Domain | SSL | Slots | Autoscale |
|------|----------|--------------|-----|-------|-----------|
| F1 | Free | No | No | 0 | No |
| D1 | Shared | Yes | No | 0 | No |
| B1-B3 | Basic | Yes | Yes | 0 | No |
| S1-S3 | Standard | Yes | Yes | 5 | Yes |
| P1v3-P3v3 | Premium | Yes | Yes | 20 | Yes |
| I1v2-I2v2 | Isolated | Yes | Yes | 20 | Yes |

### Container Services Comparison

| Feature | ACI | ACA | AKS |
|---------|-----|-----|-----|
| Cluster management | None | None | Yes |
| Autoscale | No | Yes (KEDA) | Yes |
| Kubernetes API | No | No | Yes |
| Scale to zero | No | Yes | Yes |
| Complexity | Low | Medium | High |

---

## 4. Networking Quick Reference

### NSG Rule Priorities

| Priority Range | Use |
|---------------|-----|
| 100-200 | Critical allow/deny rules |
| 200-1000 | Custom rules |
| 1000-4096 | Lower priority custom rules |
| 65000-65500 | Default system rules (cannot delete) |

Lower priority number = evaluated first = higher precedence.

### Load Balancer SKU Comparison

| Feature | Basic | Standard |
|---------|-------|---------|
| Zone redundancy | No | Yes |
| Inbound NAT rules | Pool-based | Per-instance or pool |
| Secure by default | No | Yes (NSG required) |
| Outbound rules | No | Yes |
| SLA | None | 99.99% |
| Cost | Free | Per rule + data |

### Common DNS Record Types

| Type | Purpose | Example |
|------|---------|---------|
| A | IPv4 → hostname | 20.1.2.3 ← www |
| AAAA | IPv6 → hostname | 2001:db8::1 ← www |
| CNAME | Alias hostname | www → myapp.azurewebsites.net |
| MX | Mail routing | @ → mail.contoso.com |
| TXT | Text / verification | SPF, DKIM, domain ownership |
| NS | Name server | Delegation |
| PTR | Reverse lookup | IP → hostname |

### VPN Gateway vs ExpressRoute

| Feature | VPN Gateway | ExpressRoute |
|---------|------------|-------------|
| Path | Over internet (IPsec) | Private dedicated circuit |
| Max bandwidth | 1.25 Gbps | 100 Gbps |
| Reliability | Internet SLA | Provider SLA + Azure SLA |
| Cost | Lower | Higher |
| Setup time | Hours | Weeks |
| Encryption | Yes (IPsec) | Not by default (optional MACsec) |

### Service Endpoints vs Private Endpoints

| Feature | Service Endpoint | Private Endpoint |
|---------|-----------------|-----------------|
| Traffic path | Azure backbone | Azure backbone |
| PaaS IP | Still public | Private IP in your VNet |
| DNS change needed | No | Yes (private DNS zone) |
| On-premises access | No | Yes (via VPN/ER) |
| Cost | Free | Per hour + data |

---

## 5. Monitor and Backup Quick Reference

### Azure Monitor Alert Components

| Component | Description |
|-----------|-------------|
| Scope | Resource(s) being monitored |
| Condition | Signal + threshold |
| Action group | What to do when alert fires |
| Severity | 0=Critical, 1=Error, 2=Warning, 3=Info, 4=Verbose |
| Alert processing rule | Suppress or modify (maintenance windows) |

### Backup Vault Types

| Vault | Supports | Notes |
|-------|---------|-------|
| **Recovery Services vault** | Azure VMs, Azure Files, SQL in VM, SAP HANA | Most common; also used for ASR |
| **Backup vault** | Azure Blobs, Managed Disks, PostgreSQL, AKS | New data sources |

### VM Restore Options

| Option | Use Case |
|--------|---------|
| Create new VM | Full VM restore to new resource |
| Restore disk | Get disk; attach to VM manually |
| Replace existing disk | In-place disk replacement |
| File recovery | Mount recovery point; copy individual files |

### ASR Failover Types

| Type | Disruptive | Data Loss Risk | Use |
|------|-----------|---------------|-----|
| Test failover | No | None | DR drill validation |
| Planned failover | Yes (graceful) | None (source shut down first) | Planned migration |
| Unplanned failover | Yes | Possible | Emergency |
| Failback | Yes | Possible | Return to primary |

### Network Watcher Tools

| Tool | Question it Answers |
|------|---------------------|
| IP flow verify | "Would this NSG rule block/allow this traffic?" |
| NSG diagnostics | "What NSG rules apply to this NIC?" |
| Effective routes | "What route handles traffic to this destination?" |
| Connection troubleshoot | "Can I reach this endpoint from this VM?" |
| Packet capture | "What traffic is this VM actually sending/receiving?" |
| Connection Monitor | "Is connectivity to this endpoint consistently working?" |

---

## 6. References

- [AZ-104 Study Guide](https://aka.ms/AZ104-StudyGuide)
- [Azure documentation](https://learn.microsoft.com/en-us/azure/)
- [Azure RBAC built-in roles](https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles)
- [Storage redundancy](https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy)
- [NSG overview](https://learn.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview)
- [App Service plans](https://learn.microsoft.com/en-us/azure/app-service/overview-hosting-plans)
- [Azure Backup](https://learn.microsoft.com/en-us/azure/backup/)
- [Azure Site Recovery](https://learn.microsoft.com/en-us/azure/site-recovery/)
