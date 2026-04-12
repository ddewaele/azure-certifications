# Implement and Manage Virtual Networking (15-20%)

Azure networking provides the foundation for connecting, securing, and routing traffic between Azure resources and on-premises environments.

---

## Virtual Networks and Subnets

### Virtual Network (VNet) Basics

| Concept | Description |
|---------|-------------|
| **Address space** | One or more CIDR blocks (e.g., 10.0.0.0/16); non-overlapping with on-premises or peered VNets |
| **Subnets** | Sub-divisions of the address space; resources deployed into subnets |
| **Region** | A VNet exists in a single Azure region |
| **Subscription** | A VNet belongs to a single subscription |
| **DNS** | Default Azure DNS (168.63.129.16) or custom DNS servers |

### Reserved Addresses in Each Subnet

Azure reserves 5 IP addresses in every subnet:
- x.x.x.0 — Network address
- x.x.x.1 — Default gateway
- x.x.x.2, x.x.x.3 — Azure DNS
- x.x.x.255 — Broadcast

A /29 subnet (8 addresses) yields only 3 usable host IPs.

### Subnet Planning

| Subnet | Purpose | Notes |
|--------|---------|-------|
| **AzureFirewallSubnet** | Azure Firewall | Must be named exactly; minimum /26 |
| **AzureBastionSubnet** | Azure Bastion | Must be named exactly; minimum /26 |
| **GatewaySubnet** | VPN Gateway or ExpressRoute Gateway | Must be named exactly; /27 or larger |
| **Application** | App tier VMs | Custom name |
| **Data** | Database tier VMs | Custom name |

---

## Virtual Network Peering

VNet peering connects two VNets for private, high-bandwidth, low-latency traffic.

| Feature | Local Peering | Global Peering |
|---------|--------------|----------------|
| **Scope** | Same region | Different regions |
| **Latency** | Very low | Low (across regions) |
| **Cost** | Per GB | Per GB (higher) |
| **Traffic** | Stays on Microsoft backbone | Stays on Microsoft backbone |

### Peering Configuration Options

| Setting | Description |
|---------|-------------|
| **Allow VNet access** | Controls whether peered VNet can communicate with resources |
| **Allow forwarded traffic** | Allow traffic from a third VNet forwarded through the peered VNet |
| **Allow gateway transit** | Allow the remote VNet to use this VNet's gateway (hub-spoke) |
| **Use remote gateways** | Use the peered VNet's gateway for on-premises connectivity |

Peering is **non-transitive** — if VNet A peers with B and B peers with C, A cannot reach C without a direct peering or a hub NVA/gateway.

---

## Public IP Addresses

| Setting | Basic SKU | Standard SKU |
|---------|-----------|--------------|
| **Allocation** | Dynamic or static | Static only |
| **Zone redundancy** | No | Yes (zone-redundant by default) |
| **Routing** | Default internet routing | Supports routing preference |
| **Security** | Open by default | Secure by default (NSG required) |
| **Recommended** | Legacy only | Yes — for all new deployments |

---

## User-Defined Routes (UDR)

Route tables override Azure's default routing. Applied to subnets.

### Default System Routes

| Address Prefix | Next Hop |
|---------------|---------|
| VNet address space | Virtual network |
| 0.0.0.0/0 | Internet |
| 10.0.0.0/8 (and other RFC1918) | None (dropped) |

### Custom Route Next Hop Types

| Next Hop | Description |
|----------|-------------|
| **Virtual network gateway** | Route to VPN/ExpressRoute gateway |
| **Virtual network** | Route within the VNet |
| **Internet** | Route to internet via Azure default |
| **Virtual appliance** | Route through NVA (e.g., firewall); specify private IP |
| **None** | Drop packets (black hole) |

---

## Network Security Groups (NSG)

NSGs filter inbound and outbound network traffic using security rules.

### NSG Rule Properties

| Property | Description |
|----------|-------------|
| **Name** | Unique within the NSG |
| **Priority** | 100-4096; lower number = higher priority; first match wins |
| **Source/destination** | IP, CIDR, service tag, or ASG |
| **Protocol** | TCP, UDP, ICMP, Any |
| **Port range** | Single port, range, or * |
| **Direction** | Inbound or outbound |
| **Action** | Allow or Deny |

### Default NSG Rules (Cannot be deleted, only overridden)

| Priority | Name | Direction | Description |
|----------|------|-----------|-------------|
| 65000 | AllowVnetInBound | Inbound | Allow VNet to VNet |
| 65001 | AllowAzureLoadBalancerInBound | Inbound | Allow Azure LB health probes |
| 65500 | DenyAllInBound | Inbound | Deny all other inbound |
| 65000 | AllowVnetOutBound | Outbound | Allow VNet to VNet |
| 65001 | AllowInternetOutBound | Outbound | Allow outbound to internet |
| 65500 | DenyAllOutBound | Outbound | Deny all other outbound |

### NSG Association

- NSGs can be associated with **subnets** and/or **network interfaces (NICs)**
- When associated with both, both sets of rules apply
- Inbound: subnet NSG first, then NIC NSG
- Outbound: NIC NSG first, then subnet NSG

### Service Tags

Built-in groups of IP prefixes for well-known Azure services:

| Service Tag | Represents |
|-------------|-----------|
| **Internet** | Public IP address space |
| **VirtualNetwork** | VNet address space + peered VNets |
| **AzureLoadBalancer** | Azure infrastructure load balancer IP |
| **Storage** | Azure Storage service IP ranges |
| **Sql** | Azure SQL service IP ranges |
| **AppService** | App Service front-end IP ranges |

### Application Security Groups (ASG)

- Group VMs by workload role (e.g., WebServers, DatabaseServers)
- Use ASG names as source/destination in NSG rules instead of IP addresses
- Automatically updates as VMs join/leave the ASG

---

## Azure Bastion

Provides secure browser-based RDP and SSH without public IPs on VMs.

| SKU | Features |
|-----|---------|
| **Basic** | Browser-based RDP/SSH only |
| **Standard** | + Native client support, shareable links, IP-based connections, file transfer |
| **Developer** | No subnet required; uses existing VNet (preview) |

Deployment requirements:
- Subnet named `AzureBastionSubnet` in the same VNet as target VMs
- Minimum /26 prefix length
- Standard public IP (Standard SKU)

---

## Service Endpoints vs Private Endpoints

| Feature | Service Endpoint | Private Endpoint |
|---------|-----------------|-----------------|
| **How** | Routes traffic from VNet subnet through Azure backbone | Places a private NIC with private IP in your VNet |
| **IP** | Public IP of service | Private IP from VNet address space |
| **DNS** | No change to DNS | Requires private DNS zone |
| **Cost** | Free | Per-hour + data processing |
| **Scope** | Service level (all instances) | Specific resource instance |
| **On-premises access** | No | Yes (via VPN/ExpressRoute) |

---

## Azure DNS

### DNS Zone Types

| Type | Description |
|------|-------------|
| **Public DNS zone** | Authoritative DNS for internet-accessible domain names |
| **Private DNS zone** | Name resolution within VNets; no internet exposure |

### Common DNS Record Types

| Type | Description | Example |
|------|-------------|---------|
| **A** | IPv4 address | www → 20.1.2.3 |
| **AAAA** | IPv6 address | www → 2001:db8::1 |
| **CNAME** | Alias to another hostname | www → myapp.azurewebsites.net |
| **MX** | Mail exchange | @ → mail.contoso.com |
| **TXT** | Text record | Domain verification, SPF |
| **NS** | Nameserver | Delegation records |
| **SOA** | Start of authority | Zone metadata |
| **PTR** | Reverse lookup | IP → hostname |
| **SRV** | Service location | VoIP, Teams |

### Private DNS Zone

- Link VNets to the private zone for automatic resolution
- **Auto-registration** — VMs auto-register their hostnames when linked with auto-registration enabled
- Requires private DNS zone + VNet link per VNet

---

## Load Balancing

### Azure Load Balancer

| SKU | Layer | Features |
|-----|-------|---------|
| **Basic** | Layer 4 | Free, limited features, no SLA, open by default |
| **Standard** | Layer 4 | SLA, zone-redundant, secure by default, outbound rules |

| Feature | Basic | Standard |
|---------|-------|---------|
| Zone redundancy | No | Yes |
| Global load balancing | No | Yes (with Traffic Manager) |
| NSG requirement | Optional | Required (secure by default) |
| SLA | None | 99.99% |
| Cost | Free | Per rule + data |
| HTTPS health probes | No | Yes |

### Load Balancer Components

| Component | Description |
|-----------|-------------|
| **Frontend IP** | Public or private IP that clients connect to |
| **Backend pool** | VMs or VMSS that receive traffic |
| **Health probe** | TCP/HTTP/HTTPS check; unhealthy backends removed |
| **Load balancing rule** | Maps frontend IP:port to backend pool:port |
| **Inbound NAT rule** | Map a frontend port to a specific backend VM port |
| **Outbound rule** | Configure SNAT for outbound connectivity |

### Application Gateway

| Feature | Description |
|---------|-------------|
| **Layer** | Layer 7 (HTTP/HTTPS) |
| **URL routing** | Route based on URL path or hostname |
| **SSL offload** | Terminate SSL at the gateway |
| **WAF** | Web Application Firewall (OWASP rules) |
| **Session affinity** | Cookie-based session persistence |
| **Autoscaling** | v2 SKU scales automatically |

### Load Balancer vs Application Gateway

| Feature | Azure Load Balancer | Application Gateway |
|---------|--------------------|--------------------|
| Layer | 4 (TCP/UDP) | 7 (HTTP/HTTPS) |
| URL-based routing | No | Yes |
| SSL termination | No | Yes |
| WAF | No | Yes (WAF SKU) |
| Protocols | Any TCP/UDP | HTTP, HTTPS, WebSocket |

---

## VPN Gateway and ExpressRoute

### VPN Gateway

| SKU | Max throughput | Use Case |
|-----|---------------|---------|
| **Basic** | 100 Mbps | Dev/test only; no zone redundancy |
| **VpnGw1** | 650 Mbps | Small production |
| **VpnGw2** | 1 Gbps | Medium production |
| **VpnGw3** | 1.25 Gbps | Large production |
| **VpnGw1AZ-3AZ** | Same + zone redundant | Zone-resilient deployments |

### Connection Types

| Type | Description |
|------|-------------|
| **Site-to-Site (S2S)** | IPsec/IKE VPN between on-premises VPN device and Azure |
| **Point-to-Site (P2S)** | Individual client to Azure VPN (remote workers) |
| **VNet-to-VNet** | Between Azure VNets using VPN (use peering instead where possible) |
| **ExpressRoute** | Private, dedicated circuit through a connectivity provider |

### ExpressRoute vs VPN Gateway

| Feature | VPN Gateway | ExpressRoute |
|---------|------------|-------------|
| **Connectivity** | Over internet (encrypted) | Private circuit |
| **Bandwidth** | Up to 1.25 Gbps | Up to 100 Gbps |
| **Reliability** | Internet dependent | SLA-backed |
| **Cost** | Lower | Higher |
| **Setup time** | Hours | Weeks |
| **Use case** | General connectivity, P2S | Regulated, high bandwidth |

---

## Network Watcher

| Tool | Description |
|------|-------------|
| **IP flow verify** | Test if traffic is allowed/denied by NSG rules for a given IP:port |
| **NSG diagnostics** | View effective NSG rules applied to a NIC |
| **Effective routes** | View the effective routing table for a NIC |
| **Connection troubleshoot** | Test TCP/ICMP connectivity between two endpoints |
| **Packet capture** | Capture network traffic to/from a VM |
| **Connection monitor** | Continuous monitoring of network connections |
| **Topology** | Visualise VNet resource topology |
| **Flow logs** | Log all traffic through NSG (stored in storage account) |

---

## Exam Tips

- **NSG rule priority**: lower number wins; rules evaluated from lowest to highest until a match. Default rules (65000+) cannot be deleted.
- **NSG association**: both subnet and NIC NSGs apply — inbound goes subnet then NIC; outbound goes NIC then subnet.
- **Service endpoints** keep traffic on the Microsoft backbone but the resource still has a public IP. **Private endpoints** assign a private IP from your VNet.
- **VNet peering is non-transitive** — A-B and B-C peering does not allow A to reach C without direct peering or a hub device.
- **Standard Load Balancer requires NSGs** — backends are secure by default and traffic must be explicitly allowed.
- **Basic SKU public IPs are dynamic by default**; Standard SKU is always static.
- **GatewaySubnet**, **AzureFirewallSubnet**, and **AzureBastionSubnet** must use those exact names.
- **Azure DNS private zones** require a VNet link with auto-registration to have VMs auto-register.
- **ExpressRoute** is private (not over internet); **VPN Gateway** uses IPsec over the internet.
- **Application Gateway** is Layer 7 (understands HTTP/HTTPS); **Load Balancer** is Layer 4 (TCP/UDP only).

---

## References

- [Azure Virtual Network documentation](https://learn.microsoft.com/en-us/azure/virtual-network/)
- [Network security groups](https://learn.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview)
- [Azure Bastion](https://learn.microsoft.com/en-us/azure/bastion/)
- [Azure DNS](https://learn.microsoft.com/en-us/azure/dns/)
- [Azure Load Balancer](https://learn.microsoft.com/en-us/azure/load-balancer/)
- [Application Gateway](https://learn.microsoft.com/en-us/azure/application-gateway/)
- [VPN Gateway](https://learn.microsoft.com/en-us/azure/vpn-gateway/)
- [ExpressRoute](https://learn.microsoft.com/en-us/azure/expressroute/)
- [Private endpoints](https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-overview)
- [Network Watcher](https://learn.microsoft.com/en-us/azure/network-watcher/)
