# Numbers & Limits to Memorize

The exam tests specific values directly. Drill these.

---

## Subnet sizes (mandatory)

| Subnet | Min size | Recommended |
|--------|---------|-------------|
| `GatewaySubnet` | /29 | **/27** |
| `AzureBastionSubnet` | **/26** | /26 |
| `AzureFirewallSubnet` | **/26** | /26 |
| `AzureFirewallManagementSubnet` | **/26** | /26 |
| `RouteServerSubnet` | **/27** | /27 |
| `AppGatewaySubnet` (custom name) | /28 | /24 in prod |
| Standard subnet | /29 | /24 |

**Reserved IPs in every subnet: 5** (network, gateway, 2× Azure DNS, broadcast)

---

## SLAs

| Tier | SLA |
|------|-----|
| Single VM with Premium disks | 99.9% |
| 2+ VMs in Availability Set | **99.95%** |
| 2+ VMs across Availability Zones | **99.99%** |
| Standard Load Balancer | 99.99% |
| Basic Load Balancer | None |
| Storage GRS / GZRS | 99.9% (read/write) |
| ExpressRoute | 99.95% |

---

## Azure Backup / RSV

| Item | Value |
|------|-------|
| Soft delete retention | **14 days** default (up to 180) |
| Cross-Region Restore replication lag | Up to **48 hours** |
| Instant restore retention | **1–5 days** (default 2) |
| Max recovery points | **9999** per protected item |
| Snapshot frequency (VM) | **Daily** for default policy; up to multiple per day |
| Azure Files snapshot count | **200** per share |

---

## Storage tiers — minimum retention

| Tier | Min retention before tier-down penalty |
|------|----------------------------------------|
| Hot | none |
| Cool | **30 days** |
| Cold | **90 days** |
| Archive | **180 days** |

---

## Archive rehydration

| Method | Time |
|--------|------|
| Standard | **up to 15 hours** |
| High priority | < 1 hour (small blobs only) |

---

## NSG

| Item | Value |
|------|-------|
| Default deny priority | **65500** |
| User rule priority range | **100 – 4096** |
| Default rule priority range | 65000 – 65500 (immutable) |
| Max NSG rules | 1000 (default; can request 5000) |
| Max NSGs per subscription per region | 5000 |

---

## Load Balancer

| Item | Basic | Standard |
|------|-------|----------|
| SLA | none | **99.99%** |
| Backend pool size | 300 | **1000** |
| Health probe interval | 15 sec default | 5 sec min |
| Probe unhealthy threshold | 2 | 2 |
| Idle timeout | 4 min default (4-30) | 4 min default (4-100) |

---

## VPN Gateway

| SKU | Tunnels | Throughput | BGP |
|-----|---------|-----------|-----|
| Basic | 10 | 100 Mbps | NO |
| VpnGw1 | 30 | 650 Mbps | YES |
| VpnGw2 | 30 | 1 Gbps | YES |
| VpnGw3 | 30 | 1.25 Gbps | YES |
| VpnGw4 | 100 | 5 Gbps | YES |
| VpnGw5 | 100 | 10 Gbps | YES |

VPN setup: GatewaySubnet → Public IP → Gateway → Local Network Gateway → Connection.

---

## Azure DNS

| Item | Value |
|------|-------|
| NS records on a public zone | **4** |
| Auto-registered private DNS A record TTL | **10 sec** (fixed) |
| Max records per record set | 20 |
| Public zones per subscription | 250 (default) |
| Private zones per subscription | 1000 |

---

## Bastion

| SKU | Concurrent connections | Native client | Subnet |
|-----|----------------------|---------------|--------|
| Developer | 1 | NO | None — VNet level |
| Basic | 25 | NO | AzureBastionSubnet /26 |
| Standard | 50 | YES | AzureBastionSubnet /26 |
| Premium | 50 + recording | YES | AzureBastionSubnet /26 |

---

## Storage

| Item | Value |
|------|-------|
| Storage account name | **3–24 chars, lowercase + digits, globally unique** |
| Max storage accounts per subscription per region | 250 (default; up to 500 with request) |
| Max single block blob size | **190.7 TiB** |
| Single file in Azure Files | up to 4 TiB (1 TiB on Premium) |
| Max file share size (Premium) | 100 TiB |
| Anonymous access | Disabled by default on new accounts (since 2022) |

### SAS URL components

`https://<account>.blob.core.windows.net/<container>/<blob>?<sas-token>`

---

## VM

| Item | Value |
|------|-------|
| VM name length | **1–15 chars (Windows)** / 1–64 (Linux) |
| Computer name length | 15 chars (Windows NetBIOS limit) |
| Max data disks per VM | Depends on size — typically 4 (B-series) to 64 (large) |
| Default fault domains | 2 (or 3 in some regions) |
| Default update domains | 5 (max 20) |

---

## Conditional Access

| Item | Value |
|------|-------|
| Min license | **P1** for Conditional Access |
| Max policies per tenant | 195 |
| MFA registration grace period | Configurable per policy |

---

## Network Watcher

| Tool | Limit |
|------|-------|
| Packet Capture | Max **5 hours** (18,000 sec) |
| NSG Flow Log retention | 365 days (in storage account) |
| Traffic Analytics processing interval | 10 min or 60 min |
| Connection Monitor min frequency | 30 sec |

---

## Common ports

| Port | Service |
|------|---------|
| 22 | SSH |
| 25 | SMTP (often blocked outbound on Azure) |
| 53 | DNS |
| 80 | HTTP |
| 443 | HTTPS |
| 445 | SMB (Azure Files; many ISPs block) |
| 1433 | SQL Server |
| 3389 | RDP |
| 5985 / 5986 | WinRM (HTTP / HTTPS) |
| 8080 | Common alt-HTTP |

---

## Azure platform IPs to remember

| IP | What |
|----|------|
| `168.63.129.16` | Azure platform virtual public IP — DNS, DHCP, LB health probes |
| `169.254.169.254` | Instance Metadata Service (IMDS) — managed identity tokens |

> NSG rule allowing `AzureLoadBalancer` covers `168.63.129.16` (probe source).

---

## Reserved subnet IPs (in every subnet)

For `10.0.0.0/24`:

| IP | Use |
|----|-----|
| 10.0.0.0 | Network address |
| 10.0.0.1 | Default gateway |
| 10.0.0.2 | Azure DNS |
| 10.0.0.3 | Azure DNS |
| 10.0.0.255 | Broadcast |

→ **Usable: 10.0.0.4 — 10.0.0.254 (251 addresses)**

---

## Azure Resource Manager limits (commonly tested)

| Item | Limit |
|------|-------|
| Resource groups per subscription | 980 |
| Resources per RG | 800 (per type) |
| Tag count per resource | 50 |
| Tag name length | 512 chars |
| Tag value length | 256 chars |
| RBAC role assignments per subscription | 4000 |
| Custom roles per tenant | 5000 |
| Locks per resource | No documented limit; typically 1–2 in practice |
