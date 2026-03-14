# Azure Networking

Azure networking connects your resources to each other, to on-premises environments, and to the internet.

---

## Azure Virtual Network (VNet)

A VNet is the fundamental networking building block in Azure — it's your own isolated network in the cloud.

- Logically isolated from other VNets and from the internet by default
- Resources in the same VNet can communicate by default
- A VNet exists within a single region (not global)
- You define an address space using CIDR notation (e.g., `10.0.0.0/16`)

```bash
az network vnet create \
  --resource-group my-rg \
  --name my-vnet \
  --address-prefix 10.0.0.0/16 \
  --subnet-name default \
  --subnet-prefix 10.0.0.0/24
```

### Subnets
VNets are divided into subnets to organize and isolate resources:
- A subnet is a range within the VNet address space
- Azure reserves 5 IP addresses per subnet (first 4 + last 1)
- Common pattern: separate subnets for web tier, app tier, database tier

### Network Security Groups (NSGs)
NSGs filter inbound and outbound network traffic using rules:
- Can be attached to a subnet or a network interface
- Rules have: priority, source, destination, port, protocol, action (Allow/Deny)
- Lower number = higher priority

```bash
az network nsg create --name my-nsg --resource-group my-rg
az network nsg rule create \
  --nsg-name my-nsg \
  --resource-group my-rg \
  --name allow-ssh \
  --priority 100 \
  --source-address-prefixes '*' \
  --destination-port-ranges 22 \
  --protocol Tcp \
  --access Allow
```

---

## VNet Peering

VNet peering connects two VNets so resources in each can communicate as if they were on the same network.

- Can peer VNets in the same region or different regions (global peering)
- Non-transitive by default: if VNet A peers with B and B peers with C, A cannot reach C
- Peering uses Azure's backbone network, not the public internet
- Traffic does not cross region gateways — low latency, high bandwidth

```bash
az network vnet peering create \
  --name vnet1-to-vnet2 \
  --resource-group my-rg \
  --vnet-name vnet1 \
  --remote-vnet vnet2 \
  --allow-vnet-access
```

---

## Connecting to On-Premises

### Azure VPN Gateway
Sends encrypted traffic between Azure VNets and on-premises networks over the public internet.

- Uses IPsec/IKE VPN tunnels
- Two types:
  - **Site-to-Site (S2S)**: connects on-premises network to Azure VNet (persistent)
  - **Point-to-Site (P2S)**: connects individual clients to Azure VNet
- Maximum bandwidth: up to ~10 Gbps depending on SKU
- Requires a gateway subnet in the VNet

### Azure ExpressRoute
A private, dedicated connection between on-premises and Azure — traffic never goes over the public internet.

- Provided through connectivity partners (telcos)
- Higher reliability, faster speeds, lower latency than VPN
- Bandwidth: 50 Mbps to 100 Gbps
- More expensive and longer to set up than VPN
- Use when: compliance, performance, or reliability requirements exceed what VPN can provide

| | VPN Gateway | ExpressRoute |
|---|---|---|
| Connection | Over internet | Private / dedicated |
| Encryption | Yes (IPsec) | Optional (MACsec) |
| Bandwidth | Up to ~10 Gbps | Up to 100 Gbps |
| SLA | 99.9% | 99.95% |
| Setup time | Hours | Weeks/months |
| Cost | Lower | Higher |

---

## Azure DNS

Azure DNS hosts your DNS domains and resolves queries using Azure's infrastructure.

- Not a domain registrar — you buy domains elsewhere and delegate to Azure DNS
- Supports public zones (internet-facing) and private zones (within VNets)
- Integrates with Azure services for automatic DNS record management

```bash
az network dns zone create --resource-group my-rg --name mysite.com
az network dns record-set a add-record \
  --resource-group my-rg \
  --zone-name mysite.com \
  --record-set-name www \
  --ipv4-address 203.0.113.5
```

---

## Load Balancing Services

Azure has multiple load balancing options for different scenarios:

| Service | OSI Layer | Scope | Use case |
|---|---|---|---|
| Azure Load Balancer | Layer 4 (TCP/UDP) | Regional | High availability for VMs within a region |
| Application Gateway | Layer 7 (HTTP/S) | Regional | Web apps, SSL termination, WAF |
| Azure Front Door | Layer 7 (HTTP/S) | Global | Global load balancing, CDN, WAF |
| Traffic Manager | DNS-based | Global | Route users to nearest/healthiest endpoint |

### Azure Load Balancer
- Distributes inbound traffic across backend pool of VMs
- Health probes detect unhealthy instances and remove them
- Public (internet-facing) or internal (within VNet)
- No additional cost for the basic tier

### Application Gateway
- HTTP-aware load balancer
- Can route based on URL path (e.g., `/api/*` to one backend, `/images/*` to another)
- Built-in Web Application Firewall (WAF) to protect against OWASP threats
- SSL termination — decrypts traffic at the gateway

---

## Azure Content Delivery Network (CDN)

CDN caches content at edge nodes distributed globally, so users receive content from a nearby location rather than the origin server.

- Reduces latency for static content (images, videos, scripts)
- Reduces load on origin server
- Azure CDN integrates with Azure Blob Storage, App Service, and custom origins

---

## Key Networking Concepts for AZ-900

| Concept | One-liner |
|---|---|
| VNet | Your private network in Azure |
| Subnet | Segment of a VNet |
| NSG | Firewall rules for subnets/NICs |
| VNet Peering | Connect two VNets privately |
| VPN Gateway | Encrypted tunnel to on-premises |
| ExpressRoute | Private dedicated line to on-premises |
| Load Balancer | Distribute traffic across VMs (L4) |
| Application Gateway | Distribute HTTP traffic with routing (L7) |
| Azure DNS | Host DNS zones in Azure |
| CDN | Cache content at edge for lower latency |
