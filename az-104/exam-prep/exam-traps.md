# Exam Traps — "Looks Obvious But Isn't"

The single highest-leverage file in this folder. These traps appear repeatedly across practice assessments and the real exam. Read this twice.

---

## Identity & Governance

| You might think... | Actually... |
|--------------------|-------------|
| Global Administrator has root MG access | They don't until they self-elevate via **Entra ID → Properties → "Access management for Azure resources" → Yes** |
| Owner role lets you assign any role | True — but Owner ≠ root MG access by default |
| Contributor can assign roles | **NO** — only Owner or User Access Administrator can |
| User Administrator can manage MFA / security questions | **NO** — Global Administrator only |
| Management Groups support locks | **They don't** — subscriptions and below only |
| Tags inherit to child resources | **They don't** — use Azure Policy `inherit a tag from the resource group` |
| ReadOnly lock allows portal viewing only | It also blocks DELETE — that's the point |
| SSPR enabled = everyone can reset | **NO** — only the scoped group(s); others get nothing |
| Conditional Access works on Free tier | **NO** — needs Entra ID P1 |
| PIM / Identity Protection on P1 | **NO** — both need P2 |
| Removing a user from a group = immediate access change | Cached tokens remain valid until expiry; group-based access reviews are P2 |

---

## Storage

| You might think... | Actually... |
|--------------------|-------------|
| GRS gives read access to the secondary | **NO** — only **RA-GRS / RA-GZRS** do |
| GPv1 supports ZRS | **NO** — must upgrade to GPv2 first, then change replication |
| Object replication only needs source config | **NO** — both source AND destination must be GPv2/Premium with versioning enabled |
| Enabling versioning is enough for object replication | Source also needs **change feed** enabled |
| Setting `--public-access blob` on a container makes it public | Only if **`allowBlobPublicAccess=true`** is set on the account first (default disabled since 2022) |
| Archive blobs can be read directly | **NO** — must rehydrate first (up to 15 hours standard) |
| Lifecycle rules apply immediately | **NO** — evaluated **once a day** |
| Account SAS can use stored access policies | **NO** — only Service SAS can |
| Storage Account Contributor lets you read blobs | **NO** — that's the management plane. Need `Storage Blob Data Reader/Contributor` for data plane |
| You can use Standard public IPs with a Basic LB | **NO** — SKUs must match (Standard ↔ Standard, Basic ↔ Basic) |
| Soft delete recovers deleted **storage accounts** | **NO** — soft delete is for blobs/containers; deleted accounts can be recovered within **14 days** via portal but it's a different feature |

---

## Compute

| You might think... | Actually... |
|--------------------|-------------|
| Stopping a VM from inside the OS stops billing | **NO** — must **deallocate** via Azure portal/CLI |
| Redeploy = move to another region | **NO** — same region, new host (troubleshooting only) |
| Moving a VM to another resource group changes its host/region | **NO** — RGs are logical only |
| You need ASR for cross-region migration | Or **Resource Mover** for one-time migration |
| Temp disk persists across deallocation | **NO** — wiped on deallocate, redeploy, or resize |
| Premium SSD v2 is just faster Premium SSD | It also **decouples IOPS/throughput from disk size** — pay for performance separately |
| Single VM has 99.95% SLA in Availability Set | Single VM SLA = 99.9% (Premium disks). 99.95% needs **2+ instances in AS** |
| 99.99% requires Availability Zones AND multiple instances | Yes — single VM in a zone is still 99.9% |
| Scale-out triggers immediately when threshold hit | **NO** — must exceed threshold for **full duration window** |
| Scale-in goes below the configured minimum if math says so | **NO** — minimum is a hard floor |
| App Service backup uses RSV | **NO** — App Service has its own built-in backup |

---

## Networking

| You might think... | Actually... |
|--------------------|-------------|
| `GatewaySubnet` name is flexible | **NO** — must be exactly `GatewaySubnet` (case-sensitive) |
| Smallest VPN gateway subnet is /29 | Technically yes, but use **/27** to allow growth |
| `AzureBastionSubnet` can be /27 | **NO** — minimum **/26** |
| VNet peering is transitive | **NO** — A↔B and B↔C does NOT mean A↔C |
| Standard LB is wide-open by default | **NO** — Standard LB has implicit deny; add NSG rules |
| Basic LB still recommended for prod | **NO** — being deprecated; use Standard |
| NAT Gateway accepts inbound | **NO** — outbound only |
| NSG inheritance | NSGs don't "inherit" — both subnet AND NIC NSG apply if both exist |
| First match in NSG = winner | Yes — but lower priority number = evaluated **first**, not last |
| `AzureLoadBalancer` service tag is for the LB resource | It represents the **probe source IP** `168.63.129.16` |
| Auto-registered DNS records use the VM resource name | **NO** — they use the **OS hostname** (`--computer-name`). Hyphens get stripped, so `vm-app-01` may register as `vmapp01` or `vm000000` |
| Private DNS zone with auto-registration on multiple VNets | Only **one** linked VNet can have auto-registration enabled per zone |
| Application Gateway works at Layer 4 | **NO** — Layer 7 (HTTP/S) |
| WAF Detection mode blocks attacks | **NO** — Detection only logs; **Prevention** blocks |
| Traffic from on-prem over VPN should use Public LB | **NO** — that's internal traffic; use **Internal LB** |
| Azure Firewall replaces NSGs | **NO** — they're complementary; NSGs at subnet/NIC, Firewall at perimeter |
| ExpressRoute = encrypted by default | **NO** — encryption is opt-in (MACsec / IPsec over ER) |

---

## Monitor & Maintain

| You might think... | Actually... |
|--------------------|-------------|
| DCR can exist without a DCE | Only if NOT using AMA. With AMA, DCE must come first |
| IP Flow Verify catches all connectivity issues | **NO** — only NSG. Routing issues need **Next Hop** |
| Connection Monitor uses MARS agent | **NO** — needs **Azure Monitor Agent (AMA)** |
| NSG Flow Logs v1 feeds Traffic Analytics | **NO** — must be **v2** |
| Recovery Services Vault is region-agnostic | **NO** — same region as workload (cross-region only via opt-in CRR) |
| Cross-Region Restore is enabled by default | **NO** — opt-in, requires GRS, 48h replication lag |
| Packet Capture runs forever | **NO** — max **5 hours** |
| Activity log retains everything for free forever | **90 days** free; longer requires export |
| Metrics retention can be extended | **NO** — platform metrics fixed at **93 days**. Export to LAW/Storage for longer |
| Azure Monitor is global | The control plane is global, but data lives in the workspace's region |

---

## Backup & DR

| You might think... | Actually... |
|--------------------|-------------|
| RSV can back up VMs in any region | **NO** — must be in the same region as the workload |
| Soft delete is forever | **NO** — 14 days default, configurable up to 180 |
| Test failover affects production | **NO** — runs in an isolated test network |
| GRS = backup | **NO** — GRS is replication; backup needs an explicit policy + recovery points |
| App Service uses RSV | **NO** — App Service built-in backup |
| Container Instances are backable via RSV / Backup Vault | **NO** — neither supports ACI directly |

---

## Pricing & SLAs

| You might think... | Actually... |
|--------------------|-------------|
| Stopped VM = no cost | Compute stops only on **Deallocate**; disk costs continue regardless |
| Free tier = unlimited | Free tier resources have hard limits; exceeding = chargeable |
| Reserved instances apply automatically | They apply, but you must **purchase** + match the SKU/family/region |
| Spot VMs always work | **NO** — can be evicted with 30-second warning |
| Multi-region = automatic | **NO** — explicit replication / load balancing required |

---

## Question phrasing watch-outs

| Phrase | Means |
|--------|-------|
| "Solution: X. Does this meet the goal?" | Yes/No series — each question independent; answer based on whether THIS solution alone achieves the goal |
| "Each correct answer presents a complete solution" | Multiple right answers possible — pick simplest that works |
| "Minimum role / minimum permissions" | Don't pick Owner/Global Admin if a narrower role works |
| "From the Azure portal" / "From PowerShell" | Sticks to that tool — don't pick CLI if it says PowerShell |
| "Without using credentials" / "without storing secrets" | Managed identity |
| "Cost should be minimized" + needs HA | Trade-off — typically still pick the HA option, but the cheapest HA tier |
| "You need to ensure that..." (multiple bullet conditions) | All must be satisfied |
