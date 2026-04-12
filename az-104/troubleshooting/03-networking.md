# Troubleshooting: Networking

Covers VNet connectivity, NSGs, VNet peering, DNS, VPN Gateway, Load Balancer, and Network Watcher diagnostics.

---

## Network Security Groups (NSGs)

NSGs are stateful packet filters. The most common cause of connectivity failures in Azure is an NSG rule blocking traffic.

### NSG Rule Evaluation Order

1. Rules are evaluated **lowest priority number first** (100 = evaluated before 4096)
2. The **first matching rule wins** — evaluation stops at the first match
3. Both the **subnet NSG** and the **NIC NSG** are evaluated; both must allow the traffic
4. Default rules at priority 65000–65500 cannot be deleted:
   - `AllowVnetInBound` — allows traffic within the VNet
   - `AllowAzureLoadBalancerInBound` — allows Azure Load Balancer health probes
   - `DenyAllInBound` — denies everything else

### Common NSG Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Traffic blocked despite Allow rule | A lower-numbered Deny rule matches first | Check priorities — a Deny at priority 100 beats an Allow at priority 200 |
| Allow rule added but still blocked | Second NSG (on NIC or subnet) has a Deny rule | Check **both** the subnet NSG and the NIC NSG |
| Traffic allowed by NSG but still not reaching app | Windows Firewall or iptables inside the VM is blocking | Disable host firewall temporarily to test |
| All traffic blocked from specific IP | NSG rule with the correct port but wrong source IP | Check SourceAddressPrefix in the blocking rule |
| Azure service cannot reach VM | Azure service tag not in the NSG allow list | Add service tag (e.g. `AzureBackup`, `AzureMonitor`) as source in NSG rule |

**Key diagnostic tools:**

1. **IP flow verify** (Network Watcher) — tests whether a specific packet would be allowed or denied by NSG rules, and shows the matching rule:
   ```bash
   az network watcher test-ip-flow \
     --resource-group myRG \
     --vm myVM \
     --direction Inbound \
     --local 10.0.1.4:3389 \
     --remote 203.0.113.0:* \
     --protocol TCP
   ```

2. **Effective security rules** — portal > VM > Networking > "Effective security rules" — shows all NSG rules merged from NIC + subnet NSGs sorted by priority

3. **NSG flow logs** — records all traffic (allowed/denied) per NSG to a storage account; used for audit and forensics

---

## VNet Connectivity

### VM-to-VM Communication Failing

| Symptom | Cause | Fix |
|---------|-------|-----|
| VM in same VNet cannot ping another VM | NSG blocks ICMP (ping uses ICMP, not TCP/UDP) | Either allow ICMP in NSG, or test with TCP (Test-NetConnection on port 80) instead |
| VM in same subnet cannot reach another VM | NSG on NIC (not subnet) blocking traffic | Check NIC-level NSG rules |
| VM cannot reach internet | Missing outbound NSG rule, or no NAT Gateway, or no public IP | Default outbound access exists for VMs without public IPs, but this is being deprecated; use NAT Gateway |
| VM can ping another VM but app port fails | App not listening, or host firewall blocking the port | Verify app is running and listening; check host firewall |

### Outbound Internet Connectivity

In Azure, VMs without public IPs use **default outbound access** (anonymous SNAT), which is being deprecated. Best practices:

| Method | Use Case |
|--------|---------|
| **NAT Gateway on subnet** | Reliable, predictable SNAT for all VMs in subnet |
| **Public IP on VM** | Simple; VM uses its own public IP for outbound |
| **Load Balancer with outbound rules** | For VM Scale Sets or multiple VMs behind a LB |
| **NVA/Firewall** | When inspection or filtering of outbound traffic is needed |

> **Exam note:** SMTP port 25 (outbound) is blocked by default in Azure for all IPs. This cannot be unblocked for new subscriptions without special approval. Use port 587 or an email relay service instead.

---

## VNet Peering Issues

### Peering States

| Status | Meaning | Action |
|--------|---------|--------|
| **Connected** | Both sides of peering are established; traffic can flow | None — healthy state |
| **Initiated** | Only one side of the peering exists | Create the peering from the second VNet |
| **Disconnected** | One peering link was deleted; the remaining link becomes Disconnected | Delete the remaining link and recreate both links |

> **Critical:** You cannot just recreate the missing side when one is in Disconnected state — you must delete both sides and start over.

### Common Peering Failures

| Issue | Cause | Fix |
|-------|-------|-----|
| Cannot create peering | Overlapping address spaces — you cannot peer VNets with overlapping CIDRs | Resize one VNet's address space to remove overlap before peering |
| Peering status is Connected but traffic still fails | NSG rules or UDR (route table) blocking traffic between VNets | Use IP flow verify and check effective routes |
| On-prem cannot reach spoke VNet via hub | Missing "Allow gateway transit" on hub VNet peering, or missing "Use remote gateway" on spoke peering | Enable gateway transit on hub side, use remote gateway on spoke side |
| Spoke-to-spoke communication failing in hub-spoke | Peering is non-transitive — spoke1 cannot directly reach spoke2 via peering alone | Route spoke-to-spoke traffic through an NVA/firewall in the hub using UDRs |
| Peering broken after address space change | Address space was modified but peering was not synced | Sync the peering: portal > VNet > Peering > Sync |
| Cross-subscription peering fails | Insufficient permissions in the target subscription | Need **Network Contributor** role in both subscriptions |
| Cross-tenant peering fails | Cannot authenticate to the other tenant | Use PowerShell/CLI with cross-tenant auth; portal cannot handle this |

> **Exam note:** VNet peering is **non-transitive**. If VNet A is peered with VNet B, and VNet B is peered with VNet C, traffic from A cannot reach C unless there is a direct peering between A and C, OR a hub NVA routes traffic between them with appropriate UDRs.

---

## User-Defined Routes (UDR) and Routing Issues

### Effective Route Diagnostics

Check effective routes on a VM's NIC:
- Portal: VM > Networking > NIC > Effective routes
- CLI: `az network nic show-effective-route-table --resource-group myRG --name myNIC`

**Route priority (highest to lowest):**
1. User-Defined Routes (UDR)
2. BGP routes (from VPN/ExpressRoute)
3. System default routes (VNet, internet, etc.)

UDRs always win over system and BGP routes for the same prefix.

### Routing Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Traffic going to NVA but not returning (asymmetric routing) | UDR only on source subnet sends through NVA, but return path bypasses NVA | Add UDR on destination subnet to route return traffic through same NVA |
| VNet peering route overridden by UDR | UDR on subnet has a prefix that overlaps with the peered VNet range | Remove or adjust the conflicting UDR entry |
| Traffic to on-prem being dropped | VPN Gateway not in route table, or BGP not advertising the on-prem routes | Verify BGP/route advertisements from gateway; check effective routes |
| 0.0.0.0/0 UDR sending all internet traffic to NVA but VM can't reach internet | NVA not configured to forward traffic, or NVA not properly routing | Ensure NVA has IP forwarding enabled and proper outbound NAT rules |

---

## DNS Troubleshooting

### Azure-Provided DNS vs Custom DNS

By default, Azure VMs use Azure's built-in DNS (168.63.129.16) which resolves:
- Public DNS names
- Azure-internal VM hostnames within the same VNet
- Private DNS zones linked to the VNet

| Issue | Cause | Fix |
|-------|-------|-----|
| VMs cannot resolve each other by hostname | VMs are in different VNets with no private DNS zone | Create a private DNS zone, link to both VNets with auto-registration enabled |
| Custom DNS server not resolving Azure internal names | Custom DNS not configured to forward to 168.63.129.16 | Configure DNS forwarder on custom DNS server to forward unknown queries to 168.63.129.16 |
| Private DNS zone names not resolving | Private DNS zone not linked to the VNet | Link the private DNS zone to the VNet (portal: Private DNS zone > Virtual network links) |
| Private DNS zone resolving but wrong IP returned | Old record, or auto-registration conflict | Check DNS records in the private zone; delete stale records |
| Storage account private endpoint not resolving | Private DNS zone `privatelink.blob.core.windows.net` not linked to VNet | Link the private DNS zone to the VNet used by the client |

> **Exam note:** Azure DNS resolver IP is **168.63.129.16** — this is a virtual IP used by all Azure VMs. It always resolves Azure internal names. If you set a custom DNS server, it must forward unknown queries to this IP or Azure internal name resolution breaks.

---

## VPN Gateway

### Site-to-Site VPN Not Connecting

| Symptom | Cause | Fix |
|---------|-------|-----|
| VPN tunnel stays in "Disconnected" | Mismatched IKE/IPSec settings (encryption, DH group, lifetime) | Match Phase 1 and Phase 2 settings exactly on both sides |
| VPN connects but no traffic flows | Mismatched or missing traffic selectors (local/remote network ranges) | Verify the address spaces on both sides are correct and symmetrical |
| VPN tunnel flaps (connects and disconnects) | Dead peer detection timeout, unstable internet link, or NAT-T issues | Enable NAT traversal; check on-prem device logs |
| BGP routes not propagating | BGP not enabled on the Azure gateway, or wrong ASN | Enable BGP on both Azure gateway and on-prem device; match ASNs |
| Cannot reach Azure VMs from on-prem | Missing or incorrect routes on the on-prem device | On-prem router must have routes pointing to Azure address ranges via the VPN |
| Point-to-site VPN not connecting | Certificate not in gateway root cert store, or VPN client package outdated | Upload root certificate to gateway; re-download and install VPN client package |

**Key diagnostic tool:**
```bash
# Troubleshoot VPN gateway connection
az network watcher troubleshooting start \
  --resource-group myRG \
  --resource-type vnetGateway \
  --resource myVpnGateway \
  --storage-account mystorageacct \
  --storage-path https://mystorageacct.blob.core.windows.net/networkwatcher
```

---

## Load Balancer

### Load Balancer Health Probe Failures

The health probe is the most common cause of LB issues. If the probe fails, the backend instance is removed from rotation.

| Issue | Cause | Fix |
|-------|-------|-----|
| All backend VMs marked unhealthy | NSG on backend subnet blocking probe traffic | Add NSG rule to allow `AzureLoadBalancer` service tag as source |
| One backend VM unhealthy | App not running on probe port, or app is crashed | Check the application inside the VM on the probe port |
| Health probe passes but traffic still not reaching VMs | Load balancing rule not configured correctly (wrong port mapping) | Verify frontend port → backend port mapping in LB rule |
| Cannot connect to LB VIP from within the VNet | Standard SKU LB with no outbound rule, or hairpin NAT not supported | Use floating IP or place clients outside the backend pool |
| Load Balancer shows as healthy but app is broken | Probe only tests TCP connectivity — it doesn't test app logic | Use HTTP probe with a health check endpoint that validates app state |

> **Exam note:** The Azure Load Balancer health probe source IP is **168.63.129.16**. NSG rules must allow inbound traffic from `AzureLoadBalancer` service tag (which maps to this IP) on the probe port. Blocking this breaks health probes even if the app is healthy.

### Standard vs Basic Load Balancer

| Feature | Basic SKU | Standard SKU |
|---------|----------|-------------|
| Backend pool | VMs in single availability set or VMSS | Any VM in a VNet |
| Health probes | TCP, HTTP | TCP, HTTP, HTTPS |
| SLA | None | 99.99% |
| Availability Zones | Not supported | Supported (zone-redundant) |
| Global peering | Not supported | Supported (NOTE: Basic LB was retired Sept 2025) |
| Outbound rules | Not supported | Supported |
| NSG required on backend | Optional | **Required** — no implicit outbound access |

---

## Application Gateway

| Issue | Cause | Fix |
|-------|-------|-----|
| 502 Bad Gateway | Backend server unhealthy, or backend not accepting App Gateway's probe on the probe port | Verify backend health in portal; check NSG allows HTTP/HTTPS from App Gateway subnet |
| 504 Gateway Timeout | Backend too slow to respond within timeout | Increase request timeout in backend HTTP settings |
| SSL/TLS error | Certificate mismatch or untrusted certificate on backend | Upload trusted CA cert to App Gateway if using end-to-end TLS |
| Backend shows "Unknown" health | NSG blocks health probe from App Gateway subnet | Allow inbound from the App Gateway subnet CIDR on the probe port |
| WAF blocking legitimate traffic | WAF rule false positive | Review WAF logs; set WAF to Detection mode for testing; create custom exclusion |

> **Exam note:** Application Gateway needs its **own dedicated subnet** (no other resources). The NSG on the Application Gateway subnet must allow inbound TCP 65503–65534 (v1) or 65200–65535 (v2) from `GatewayManager` service tag — these are required for App Gateway health and management.

---

## Network Watcher Quick Reference

| Tool | What it Does | When to Use |
|------|-------------|------------|
| **IP flow verify** | Tests if NSG allows/denies a specific packet; shows the matching rule | VM can't connect on a specific port |
| **Effective security rules** | Shows merged NSG rules from NIC + subnet | Understanding combined NSG effect |
| **Next hop** | Shows the next hop for a packet from a VM to a destination | Routing issues, traffic going wrong way |
| **Connection troubleshoot** | Tests TCP connectivity from VM to a destination, with latency | Diagnosing VM-to-VM or VM-to-internet issues |
| **Effective routes** | Shows the full routing table for a NIC | Why is traffic not taking the expected path |
| **NSG flow logs** | Logs all allowed/denied traffic for an NSG | Security audit, traffic analysis |
| **Packet capture** | Captures raw packets from a VM's NIC | Deep network debugging |
| **VPN diagnostics** | Troubleshoots VPN gateway connection | Site-to-site VPN issues |

```bash
# Most useful commands for exam scenarios:

# Is NSG allowing traffic? (IP flow verify)
az network watcher test-ip-flow \
  --resource-group myRG --vm myVM \
  --direction Inbound --local 10.0.1.4:22 \
  --remote 203.0.113.1:* --protocol TCP

# What is the next hop for traffic from VM to 8.8.8.8?
az network watcher show-next-hop \
  --resource-group myRG --vm myVM \
  --source-ip 10.0.1.4 --dest-ip 8.8.8.8

# Test TCP connection from VM
az network watcher test-connectivity \
  --resource-group myRG \
  --source-resource myVM \
  --dest-address 10.0.2.4 --dest-port 443
```
