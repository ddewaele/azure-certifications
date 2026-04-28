# Domain 4 — Networking Cheatsheet (15–20%)

## Virtual Network basics

| Concept | Detail |
|---------|--------|
| **Address space** | RFC 1918 ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16); add public CIDRs if you must |
| **Subnet** | Smaller CIDR within VNet; one NSG, one route table per subnet |
| **Reserved IPs in each subnet** | First 4 + last 1 = **5 IPs reserved** (network, gateway, DNS x2, broadcast) |
| **Smallest subnet** | /29 (3 usable IPs) |
| **VNet peering** | Connect 2 VNets; non-transitive |

### Reserved IPs example

| Range | Reserved |
|-------|----------|
| 10.0.0.0 | Network address |
| 10.0.0.1 | Default gateway |
| 10.0.0.2 / 10.0.0.3 | Azure DNS |
| 10.0.0.255 (or last) | Broadcast |

So for a /24 (256 addresses) you have **251 usable**.

---

## Mandatory subnet names

Some subnets must be named exactly:

| Subnet | Min size | Used by |
|--------|---------|---------|
| **GatewaySubnet** | **/27** (recommended) — minimum /29 | VPN Gateway / ExpressRoute Gateway |
| **AzureBastionSubnet** | **/26** minimum | Azure Bastion |
| **AzureFirewallSubnet** | **/26** minimum | Azure Firewall |
| **AzureFirewallManagementSubnet** | **/26** minimum | Azure Firewall (forced tunneling) |
| **RouteServerSubnet** | **/27** minimum | Azure Route Server |

> **TRAP:** These names are case-sensitive and not interchangeable. The wizard auto-creates them but only if you name them correctly.

---

## NSG (Network Security Group)

### What it does

Stateful packet filter at **subnet** OR **NIC** level. Both can be applied; both evaluate.

### Default rules (cannot be deleted)

| Direction | Rule | Priority | Effect |
|-----------|------|----------|--------|
| Inbound | AllowVNetInBound | 65000 | Allow VNet → VNet |
| Inbound | AllowAzureLoadBalancerInBound | 65001 | Allow LB probes |
| Inbound | DenyAllInBound | 65500 | Block everything else |
| Outbound | AllowVNetOutBound | 65000 | |
| Outbound | AllowInternetOutBound | 65001 | |
| Outbound | DenyAllOutBound | 65500 | |

### Rule order

1. Lower priority number = evaluated first (1 → 4096 user range; 65000+ default)
2. First match wins
3. Subnet NSG evaluated, then NIC NSG (inbound) — both must allow

### Service tags (use these, not hardcoded IPs)

| Tag | Use |
|-----|-----|
| `Internet` | The public internet |
| `VirtualNetwork` | All VNet space + connected on-prem |
| `AzureLoadBalancer` | LB health probe source (`168.63.129.16`) |
| `AzureCloud` | All Azure public IPs (regional variants exist) |
| `Storage` / `Sql` / `KeyVault` | Service-specific (regional variants too) |

> **TRAP:** Probe source `168.63.129.16` must be allowed to reach VMs — use the `AzureLoadBalancer` tag, not the IP directly.

### Application Security Groups (ASG)

- Logical grouping of VMs; reference by **name** in NSG rules instead of IPs
- Both source and destination of an NSG rule can be ASGs
- ASG and NSG must be in the **same region**

---

## Routing & UDR (User Defined Routes)

### Default system routes

| Destination | Next hop |
|-------------|----------|
| 0.0.0.0/0 | Internet |
| VNet address space | VnetLocal |
| Peered VNets | VNetPeering |
| Connected gateway | VirtualNetworkGateway |

### UDR overrides

You can override system routes with a route table:

| Next hop type | Use |
|---------------|-----|
| **VirtualAppliance** | Send traffic to an NVA (firewall) — set `nextHopIpAddress` to the NVA's NIC IP |
| **VirtualNetworkGateway** | Send to VPN/ExpressRoute |
| **None** | Drop traffic |
| **Internet** | Force out to internet (overrides 0.0.0.0/0 → VnetLocal etc.) |
| **VnetLocal** | Force traffic to stay in the VNet |

### Forced tunneling

UDR sending 0.0.0.0/0 to VirtualNetworkGateway = all internet traffic forced through on-prem.

### Longest-prefix match

Most specific route wins. UDR > BGP > system routes within same prefix length.

---

## VNet peering

| Setting | Effect |
|---------|--------|
| **Allow virtual network access** | Default; basic peering |
| **Allow forwarded traffic** | Allow traffic from outside the peered VNet (e.g., NVA hop) |
| **Allow gateway transit** | Let peered VNet use this VNet's gateway |
| **Use remote gateway** | Use the peered VNet's gateway (mutually exclusive with "Allow gateway transit") |

### Peering rules

- **Non-transitive** — A↔B and B↔C does NOT mean A↔C
- Cross-region peering = **Global VNet Peering**
- Peering both ends must be configured (asymmetric peerings = traffic dropped)

> **TRAP:** Hub-and-spoke transit needs **gateway transit** + **use remote gateway**, OR an NVA in the hub.

---

## VPN Gateway

### Setup sequence (memorize)

```
1. GatewaySubnet (≥/27)
2. Public IP for the gateway
3. VPN Gateway (basic/VpnGw1-5; specify VPN type: Route-based or Policy-based)
4. Local Network Gateway (represents on-prem)
5. Connection (links VPN GW + Local NG; share key)
```

### Gateway SKUs

| SKU | Tunnels | Throughput | BGP |
|-----|---------|-----------|-----|
| **Basic** | 10 | 100 Mbps | NO; legacy; single tunnel point-to-site |
| **VpnGw1** | 30 | 650 Mbps | Yes |
| **VpnGw2** | 30 | 1 Gbps | Yes |
| **VpnGw3** | 30 | 1.25 Gbps | Yes |
| **VpnGw4 / 5** | More | More | Yes |

> **TRAP:** Basic SKU does NOT support BGP, active-active, or zone redundancy. Pick VpnGw1+ if any of those matter.

### Active-active

Two instances of the gateway, two public IPs, two tunnels — high availability. Requires VpnGw1+.

---

## ExpressRoute

| Concept | Detail |
|---------|--------|
| **Circuit** | The connection (purchased through provider); has Provider + Peering Location + Bandwidth |
| **Peerings** | Private (VNet-bound) + Microsoft (Microsoft 365, Azure PaaS) |
| **Gateway** | ExpressRoute gateway (different from VPN gateway) |
| **FastPath** | Bypass gateway for higher throughput (Ultra Performance / ErGw3AZ) |
| **Global Reach** | Connects on-prem sites via the Microsoft backbone |

### When to choose what

| Need | Choose |
|------|--------|
| Cheaper hybrid | **VPN** |
| Higher throughput, dedicated, predictable latency | **ExpressRoute** |
| Both with failover | **ExpressRoute + VPN coexistence** |

---

## Load Balancer (Layer 4)

### SKUs

| Feature | Basic | Standard |
|---------|-------|----------|
| SLA | None | 99.99% |
| Backend pool | Single AS / VMSS | Mix; up to 1000 |
| Zone redundancy | NO | YES |
| Public IP SKU required | Basic | **Standard only** |
| HA Ports | NO | YES |
| Outbound rules | Implicit | Explicit (or NAT GW) |
| NSG required | Optional | **Implicit deny outside the VNet** — add NSG rules to allow |
| Status | Legacy / phasing out | **Default — pick Standard** |

> **TRAPS:**
> - **Basic public IP cannot attach to a Standard LB**, even if VM is running
> - Standard LB has implicit deny — must explicitly allow inbound via NSG
> - Basic is being deprecated; pick Standard unless told otherwise

### Health probe

| Protocol | Detail |
|----------|--------|
| **TCP** | Just checks port reachability |
| **HTTP / HTTPS** | Checks 200-OK at a path |
| Default interval | 15 sec |
| Default unhealthy threshold | 2 failures |
| Source IP | `168.63.129.16` (allow via `AzureLoadBalancer` service tag) |

### Internal vs Public LB

| Type | Frontend | Use |
|------|----------|-----|
| **Public LB** | Public IP | Internet → backend pool |
| **Internal LB** | Private IP | Tier-to-tier within VNet, on-prem-to-Azure via VPN/ExpressRoute |

> **TRAP:** Traffic from on-prem over VPN is **internal** — use Internal LB, not Public LB.

---

## Application Gateway (Layer 7)

| Feature | Detail |
|---------|--------|
| OSI layer | 7 (HTTP/HTTPS) — inspects URI, headers |
| SKUs | Standard_v2, **WAF_v2** (with OWASP ruleset) |
| Subnet | Dedicated; min /28 (recommendations vary, /24 for prod) |
| Routing | URL-path based, host-header based, multi-site |
| SSL | Offload at GW or end-to-end (re-encrypt to backend) |
| Backend types | VMs (IP/FQDN), VMSS, App Service, Storage |

### App Gateway vs Load Balancer vs Front Door vs Traffic Manager

| Service | Layer | Scope | Use |
|---------|-------|-------|-----|
| **Load Balancer** | 4 | Regional | TCP/UDP load balancing within a region |
| **Application Gateway** | 7 | Regional | HTTP/S routing, WAF, SSL offload, URL routing |
| **Traffic Manager** | DNS | Global | DNS-based geo routing across regions |
| **Front Door** | 7 | Global | HTTP/S routing, WAF, anycast, accelerated |

### WAF modes

| Mode | Effect |
|------|--------|
| **Detection** | Logs only |
| **Prevention** | Logs + blocks matching requests |

---

## Azure DNS

### Public DNS zones

- Hosted on Azure global DNS infrastructure
- 4 NS records assigned at creation — copy to your registrar to delegate
- Records: A, AAAA, CNAME, MX, TXT, SRV, PTR, CAA, NS, SOA
- **Alias record** = Azure-managed dynamic record pointing at LB / Traffic Manager / CDN

### Private DNS zones

- VNet-scoped resolution
- Linked to one or more VNets
- **Auto-registration** — when enabled, VM A records created automatically (TTL = 10s, fixed)
- One zone can be linked to many VNets but only **one** VNet per zone has auto-registration

> **TRAP:** Auto-registered records use the VM's **OS hostname** (computer name), not the resource name. If `--computer-name` differs from `--name`, the DNS record uses the computer name.

---

## Bastion

| Concept | Detail |
|---------|--------|
| Subnet | **AzureBastionSubnet** (/26 minimum) |
| Public IP | Standard SKU required |
| SSH/RDP target | VMs in the same VNet (or peered with proper config) |
| **Developer SKU** | Cheapest; not on every subscription/region |
| **Basic SKU** | Portal access only |
| **Standard SKU** | Native client (CLI tunnel), file copy, port shareable |
| **Premium SKU** | Session recording |

### CLI native client (Standard+ only)

```bash
az network bastion ssh \
  --name bastion1 --resource-group RG \
  --target-resource-id <vm-id> \
  --auth-type ssh-key --username azureuser --ssh-key ~/.ssh/id_rsa
```

> **TRAP:** Native client (`az network bastion ssh`) **requires Standard SKU** with `enableTunneling=true`. Basic returns "Bastion Host SKU must be Standard or Premium".

---

## NAT Gateway

| Concept | Detail |
|---------|--------|
| Use | Outbound-only public IPv4 for many VMs in a subnet |
| Replaces | LB outbound SNAT or VM public IP for egress |
| Scope | Per subnet (one NAT GW per subnet at most) |
| SNAT ports | 64,000 per public IP; supports multiple IPs |
| Idle timeout | 4 minutes default |

> **TRAP:** NAT Gateway is **outbound only** — it doesn't accept inbound traffic.

---

## Quick CLI patterns

```bash
# VNet + 2 subnets
az network vnet create --name vnet1 --address-prefix 10.0.0.0/16 --resource-group RG
az network vnet subnet create --name subnet-app --vnet-name vnet1 --address-prefix 10.0.1.0/24 --resource-group RG

# NSG with rule allowing HTTP from internet
az network nsg create --name nsg-web --resource-group RG
az network nsg rule create --nsg-name nsg-web --resource-group RG \
  --name allow-http --priority 100 --protocol Tcp \
  --destination-port-ranges 80 --access Allow

# Peer two VNets
az network vnet peering create --name vnet1-to-vnet2 --vnet-name vnet1 \
  --remote-vnet vnet2 --resource-group RG --allow-vnet-access

# Public Standard LB
az network lb create --name lb1 --sku Standard --resource-group RG \
  --frontend-ip-name fe1 --public-ip-address pip-lb --backend-pool-name be1

# UDR pointing to NVA
az network route-table create --name rt1 --resource-group RG
az network route-table route create --route-table-name rt1 --resource-group RG \
  --name route-to-nva --address-prefix 10.0.2.0/24 \
  --next-hop-type VirtualAppliance --next-hop-ip-address 10.0.0.4

# Private DNS zone with auto-registration link
az network private-dns zone create --name internal.corp --resource-group RG
az network private-dns link vnet create --name link1 --zone-name internal.corp \
  --virtual-network vnet1 --registration-enabled true --resource-group RG
```
