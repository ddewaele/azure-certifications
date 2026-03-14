# Lab 12 — Routing and User-Defined Routes

**Concepts covered:** Azure default routing, route tables, user-defined routes (UDR), forced tunneling, hub-and-spoke traffic inspection

**Estimated cost:** ~$0.10–0.20 (a few VMs + NAT gateway — delete promptly)

---

## Background

Azure automatically handles routing between subnets within a VNet, between peered VNets, and to the internet. You don't configure this — it just works.

But sometimes you need to override the defaults:
- Force all internet-bound traffic through a firewall/NVA (Network Virtual Appliance)
- Route traffic between spoke VNets through a hub
- Block certain traffic at the routing layer (not just NSG)

This is done with **Route Tables** containing **User-Defined Routes (UDRs)**.

### How Azure Route Selection Works

For each outbound packet, Azure looks up routes in priority order:
1. **User-defined routes** (highest priority — your routes override everything)
2. **BGP routes** (learned from VPN/ExpressRoute connections)
3. **System routes** (Azure defaults — lowest priority)

Azure default system routes:
| Address prefix | Next hop |
|---|---|
| VNet address space | VirtualNetwork (intra-VNet) |
| 0.0.0.0/0 | Internet |
| Specific Azure service prefixes | Internet |

---

## Setup

```bash
RESOURCE_GROUP="az900-lab12-rg"
LOCATION="westeurope"

az group create --name $RESOURCE_GROUP --location $LOCATION

# Hub-and-spoke topology
# hub-vnet: central VNet containing a "firewall" VM
# spoke1-vnet: workload VNet, traffic must go through hub

az network vnet create \
  --resource-group $RESOURCE_GROUP \
  --name hub-vnet \
  --address-prefix 10.0.0.0/16

az network vnet subnet create \
  --resource-group $RESOURCE_GROUP \
  --vnet-name hub-vnet \
  --name firewall-subnet \
  --address-prefix 10.0.0.0/24

az network vnet create \
  --resource-group $RESOURCE_GROUP \
  --name spoke1-vnet \
  --address-prefix 10.1.0.0/16

az network vnet subnet create \
  --resource-group $RESOURCE_GROUP \
  --vnet-name spoke1-vnet \
  --name workload-subnet \
  --address-prefix 10.1.0.0/24
```

---

## Part A — View Default System Routes

Before adding any custom routes, let's see what Azure configures by default.

```bash
# Deploy a VM in the spoke — we'll use its NIC to inspect routes
az network nsg create --resource-group $RESOURCE_GROUP --name spoke-nsg
az network nsg rule create \
  --resource-group $RESOURCE_GROUP --nsg-name spoke-nsg \
  --name allow-ssh --priority 100 --protocol Tcp \
  --destination-port-ranges 22 --access Allow --direction Inbound

az vm create \
  --resource-group $RESOURCE_GROUP \
  --name spoke-vm \
  --image Ubuntu2204 \
  --size Standard_B1s \
  --vnet-name spoke1-vnet \
  --subnet workload-subnet \
  --admin-username azureuser \
  --generate-ssh-keys \
  --nsg spoke-nsg

# Get the NIC name
SPOKE_NIC=$(az vm show \
  --resource-group $RESOURCE_GROUP \
  --name spoke-vm \
  --query "networkProfile.networkInterfaces[0].id" \
  --output tsv | xargs basename)

# View effective routes — shows what the VM will actually use
az network nic show-effective-route-table \
  --resource-group $RESOURCE_GROUP \
  --name $SPOKE_NIC \
  --output table
```

You'll see system routes like:
- `10.1.0.0/16 → VnetLocal` (intra-VNet)
- `0.0.0.0/0 → Internet` (default internet route)

---

## Part B — Peer Hub and Spoke

```bash
az network vnet peering create \
  --resource-group $RESOURCE_GROUP \
  --name spoke1-to-hub \
  --vnet-name spoke1-vnet \
  --remote-vnet hub-vnet \
  --allow-vnet-access \
  --allow-forwarded-traffic    # important: allows hub to forward traffic on behalf of spoke

az network vnet peering create \
  --resource-group $RESOURCE_GROUP \
  --name hub-to-spoke1 \
  --vnet-name hub-vnet \
  --remote-vnet spoke1-vnet \
  --allow-vnet-access \
  --allow-forwarded-traffic \
  --allow-gateway-transit      # allows hub to share its gateway with spokes

# After peering, check routes again — hub address space appears
az network nic show-effective-route-table \
  --resource-group $RESOURCE_GROUP \
  --name $SPOKE_NIC \
  --output table
```

---

## Part C — Deploy a Simulated Firewall (NVA)

In a real hub-and-spoke, you'd use Azure Firewall or a third-party NVA. Here we simulate it with a VM that has IP forwarding enabled.

```bash
# Create the NVA VM in the hub
az vm create \
  --resource-group $RESOURCE_GROUP \
  --name hub-nva \
  --image Ubuntu2204 \
  --size Standard_B1s \
  --vnet-name hub-vnet \
  --subnet firewall-subnet \
  --admin-username azureuser \
  --generate-ssh-keys \
  --nsg "" \
  --public-ip-sku Standard

# Get the NVA's private IP
HUB_NIC=$(az vm show \
  --resource-group $RESOURCE_GROUP \
  --name hub-nva \
  --query "networkProfile.networkInterfaces[0].id" \
  --output tsv | xargs basename)

NVA_PRIVATE_IP=$(az network nic show \
  --resource-group $RESOURCE_GROUP \
  --name $HUB_NIC \
  --query "ipConfigurations[0].privateIPAddress" \
  --output tsv)

echo "NVA private IP: $NVA_PRIVATE_IP"

# Enable IP forwarding on the NVA's NIC
# (required for Azure to allow the VM to forward packets not addressed to itself)
az network nic update \
  --resource-group $RESOURCE_GROUP \
  --name $HUB_NIC \
  --ip-forwarding true

# Enable IP forwarding inside the OS too
az vm run-command invoke \
  --resource-group $RESOURCE_GROUP \
  --name hub-nva \
  --command-id RunShellScript \
  --scripts "sysctl -w net.ipv4.ip_forward=1 && echo 'net.ipv4.ip_forward=1' >> /etc/sysctl.conf"
```

---

## Part D — Create a Route Table with User-Defined Routes

Now force all internet-bound traffic from the spoke through the NVA:

```bash
# Create a route table
az network route-table create \
  --resource-group $RESOURCE_GROUP \
  --name spoke1-rt \
  --disable-bgp-route-propagation false

# UDR 1: Override the default internet route — send to NVA instead
az network route-table route create \
  --resource-group $RESOURCE_GROUP \
  --route-table-name spoke1-rt \
  --name force-internet-to-nva \
  --address-prefix 0.0.0.0/0 \
  --next-hop-type VirtualAppliance \
  --next-hop-ip-address $NVA_PRIVATE_IP

# UDR 2: Keep intra-VNet traffic direct (don't route it through NVA)
az network route-table route create \
  --resource-group $RESOURCE_GROUP \
  --route-table-name spoke1-rt \
  --name keep-vnet-direct \
  --address-prefix 10.1.0.0/16 \
  --next-hop-type VnetLocal

# View the route table
az network route-table show \
  --resource-group $RESOURCE_GROUP \
  --name spoke1-rt \
  --query "routes[].{name:name,prefix:addressPrefix,nextHop:nextHopType,nextHopIP:nextHopIpAddress}" \
  --output table
```

### Associate the Route Table with the Spoke Subnet

```bash
az network vnet subnet update \
  --resource-group $RESOURCE_GROUP \
  --vnet-name spoke1-vnet \
  --name workload-subnet \
  --route-table spoke1-rt

# Verify effective routes — 0.0.0.0/0 should now show VirtualAppliance
az network nic show-effective-route-table \
  --resource-group $RESOURCE_GROUP \
  --name $SPOKE_NIC \
  --output table
```

---

## Part E — Forced Tunneling (On-Premises via VPN)

Forced tunneling redirects all internet-bound traffic from Azure VMs back to on-premises through a VPN or ExpressRoute connection (e.g., for compliance — all traffic must go through corporate firewall).

```bash
# This is the route you'd add to force-tunnel through a VPN gateway:
az network route-table route create \
  --resource-group $RESOURCE_GROUP \
  --route-table-name spoke1-rt \
  --name force-tunnel-example \
  --address-prefix 0.0.0.0/0 \
  --next-hop-type VirtualNetworkGateway
  # In a real setup, the VPN/ExpressRoute gateway handles the rest

echo "In a real forced tunneling setup:"
echo "0.0.0.0/0 → VirtualNetworkGateway → on-premises → corporate firewall → internet"

# Remove this example route
az network route-table route delete \
  --resource-group $RESOURCE_GROUP \
  --route-table-name spoke1-rt \
  --name force-tunnel-example
```

---

## Part F — Block a Specific CIDR with a Route

Drop traffic to a specific range by routing it to `None` (blackhole):

```bash
# Block all traffic to the 192.168.100.0/24 range
az network route-table route create \
  --resource-group $RESOURCE_GROUP \
  --route-table-name spoke1-rt \
  --name block-192-168-100 \
  --address-prefix 192.168.100.0/24 \
  --next-hop-type None   # drop the packets

az network route-table show \
  --resource-group $RESOURCE_GROUP \
  --name spoke1-rt \
  --query "routes[].{name:name,prefix:addressPrefix,nextHop:nextHopType,nextHopIP:nextHopIpAddress}" \
  --output table
```

---

## Part G — Route Between Two Spoke VNets via Hub

In a hub-and-spoke topology, spoke VNets often aren't peered with each other — traffic between them goes through the hub NVA for inspection.

```bash
# Create a second spoke
az network vnet create \
  --resource-group $RESOURCE_GROUP \
  --name spoke2-vnet \
  --address-prefix 10.2.0.0/16

az network vnet subnet create \
  --resource-group $RESOURCE_GROUP \
  --vnet-name spoke2-vnet \
  --name workload-subnet \
  --address-prefix 10.2.0.0/24

# Peer spoke2 ↔ hub
az network vnet peering create \
  --resource-group $RESOURCE_GROUP \
  --name spoke2-to-hub \
  --vnet-name spoke2-vnet \
  --remote-vnet hub-vnet \
  --allow-vnet-access \
  --allow-forwarded-traffic

az network vnet peering create \
  --resource-group $RESOURCE_GROUP \
  --name hub-to-spoke2 \
  --vnet-name hub-vnet \
  --remote-vnet spoke2-vnet \
  --allow-vnet-access \
  --allow-forwarded-traffic

# Add a UDR in spoke1 to route spoke2-bound traffic via NVA
az network route-table route create \
  --resource-group $RESOURCE_GROUP \
  --route-table-name spoke1-rt \
  --name spoke1-to-spoke2-via-nva \
  --address-prefix 10.2.0.0/16 \
  --next-hop-type VirtualAppliance \
  --next-hop-ip-address $NVA_PRIVATE_IP

# Create a matching route table for spoke2
az network route-table create \
  --resource-group $RESOURCE_GROUP \
  --name spoke2-rt

az network route-table route create \
  --resource-group $RESOURCE_GROUP \
  --route-table-name spoke2-rt \
  --name spoke2-to-spoke1-via-nva \
  --address-prefix 10.1.0.0/16 \
  --next-hop-type VirtualAppliance \
  --next-hop-ip-address $NVA_PRIVATE_IP

az network vnet subnet update \
  --resource-group $RESOURCE_GROUP \
  --vnet-name spoke2-vnet \
  --name workload-subnet \
  --route-table spoke2-rt

echo "spoke1 ↔ spoke2 traffic now flows: spoke1 → NVA → spoke2"
echo "NVA can inspect, log, or filter this traffic"
```

---

## Summary: Next Hop Types

| Next hop type | What it means |
|---|---|
| `VnetLocal` | Route within the VNet — use Azure's default forwarding |
| `Internet` | Send directly to the internet via Azure's internet gateway |
| `VirtualAppliance` | Forward to a specific IP (a VM acting as firewall/router) |
| `VirtualNetworkGateway` | Forward to VPN or ExpressRoute gateway (e.g., forced tunneling) |
| `None` | Drop the packet (blackhole route) |

---

## Cleanup

```bash
az group delete --name $RESOURCE_GROUP --yes --no-wait
```
