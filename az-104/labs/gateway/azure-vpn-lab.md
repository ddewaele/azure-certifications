# Azure VPN Lab — Site-to-Site & Point-to-Site Hands-On Guide

> **Target audience:** AZ-104 candidates and practitioners who want to understand Azure hybrid connectivity by building it, not just reading about it.
>
> **Lab environment:** MacBook (Parallels-capable), Azure subscription, one Hetzner Cloud VM (or equivalent with a public IP), optional Ubiquiti EdgeRouter.
>
> **Estimated cost:** €2–5 per full lab session if torn down promptly.
>
> **Estimated time:** 2–4 hours for the full S2S walkthrough, 30–60 minutes for P2S.

---

## Table of Contents

1. [Why this lab exists](#1-why-this-lab-exists)
2. [Core concepts — S2S vs P2S vs the rest](#2-core-concepts--s2s-vs-p2s-vs-the-rest)
3. [Connectivity option decision tree](#3-connectivity-option-decision-tree)
4. [Azure VPN Gateway SKU matrix](#4-azure-vpn-gateway-sku-matrix)
5. [Lab architecture](#5-lab-architecture)
6. [Prerequisites](#6-prerequisites)
7. [Scenario A — Site-to-Site with Libreswan on a cloud VM](#7-scenario-a--site-to-site-with-libreswan-on-a-cloud-vm)
8. [Scenario B — Point-to-Site from a laptop / Ubuntu VM](#8-scenario-b--point-to-site-from-a-laptop--ubuntu-vm)
9. [Scenario C — VNet-to-VNet as a "pure Azure" S2S simulation](#9-scenario-c--vnet-to-vnet-as-a-pure-azure-s2s-simulation)
10. [Verification & troubleshooting](#10-verification--troubleshooting)
11. [Security hardening checklist](#11-security-hardening-checklist)
12. [Teardown & cost control](#12-teardown--cost-control)
13. [AZ-104 exam takeaways](#13-az-104-exam-takeaways)
14. [Appendix A — Openswan vs Libreswan vs strongSwan](#14-appendix-a--openswan-vs-libreswan-vs-strongswan)
15. [Appendix B — Reusable scripts](#15-appendix-b--reusable-scripts)

---

## 1. Why this lab exists

Azure hybrid connectivity is one of those topics where the theory is simple ("encrypted tunnel between on-prem and Azure") but the implementation has a dozen moving parts that all need to agree. Reading about it teaches you the vocabulary; building it teaches you what actually fails and why.

By the end of this lab you will have:

- Established a real IPsec Site-to-Site tunnel between a cloud VM (acting as "on-prem") and an Azure VPN Gateway
- Established a Point-to-Site tunnel from a laptop-class device
- Understood why each option exists and when to use which
- Troubleshot the classic failure modes (address space mismatches, NSG blocks, missing routes, PSK issues)
- Developed an intuition for IPsec that transfers to real hardware (EdgeRouter, Cisco, Fortinet, etc.)

This lab intentionally uses a **cloud VM** for the on-prem side rather than hardware, because the skills transfer and the cost is trivial. Once this lab clicks, configuring a physical device is just syntax.

---

## 2. Core concepts — S2S vs P2S vs the rest

Azure has multiple ways to connect networks to a VNet. They solve different problems.

### 2.1 Site-to-Site (S2S) VPN

**What it connects:** An entire on-premises network to an Azure VNet.

**Who initiates:** Either side; the tunnel is "always on."

**Transport:** IPsec/IKE (IKEv1 or IKEv2), over the public internet.

**On-prem requirement:** A VPN device with a **routable public IP** that speaks IPsec (firewall, router, RRAS, pfSense, strongSwan, Libreswan, Cisco, Fortinet, etc.).

**Authentication:** Pre-shared key (PSK) or certificate.

**Typical use case:** Branch office with many devices that all need to reach Azure.

**Mental model:** Two offices connected by a private tunnel. Everyone in either office can reach everyone in the other, seamlessly.

### 2.2 Point-to-Site (P2S) VPN

**What it connects:** A single client device to an Azure VNet.

**Who initiates:** The client, on demand.

**Transport:** Choice of three protocols — see table below.

**On-prem requirement:** None. Just a VPN client on the device.

**Authentication:** Certificate, Microsoft Entra ID (formerly Azure AD), or RADIUS.

**Typical use case:** Remote worker with a laptop; developer who occasionally needs access.

**Mental model:** A VPN dial-in connection. You're in or you're out.

**P2S protocol options:**

| Protocol | Clients | Notes |
|----------|---------|-------|
| **SSTP** | Windows only | Legacy, TCP 443, firewall-friendly |
| **IKEv2** | Windows, macOS, Linux, iOS | IPsec-based, modern |
| **OpenVPN** | All major OSes including Android | Most flexible; required for Entra ID auth |

### 2.3 VNet-to-VNet

Same technology as S2S (IPsec), but both sides are Azure VPN Gateways in different VNets. Used when two VNets need to connect and VNet peering isn't an option (e.g., different tenants, different regions without global peering, legacy reasons). Rare today — VNet peering is almost always preferable.

### 2.4 VNet Peering

Not VPN at all. Azure-internal connection between two VNets, private backbone, no tunnel. Very high bandwidth, low latency, cheap. First choice for Azure-to-Azure connectivity.

### 2.5 ExpressRoute

Dedicated private circuit between an on-prem network and Azure via a connectivity provider (Telco). Not over the public internet. High bandwidth (50 Mbps–10 Gbps+), low latency, SLA-backed. Expensive (starts around ~€200–300/month for small circuits, plus carrier fees). For enterprises with serious hybrid workloads.

### 2.6 Comparison table

| Feature | VNet Peering | S2S VPN | P2S VPN | ExpressRoute |
|---------|-------------|---------|---------|--------------|
| Connects | VNet ↔ VNet | On-prem ↔ VNet | Client ↔ VNet | On-prem ↔ VNet |
| Over public internet | No | Yes | Yes | No (private) |
| Encryption | No (private backbone) | IPsec | IPsec/TLS | None default (add MACsec) |
| Bandwidth | Up to 100+ Gbps | Up to ~10 Gbps (VpnGw5) | Per-client | 50 Mbps – 100 Gbps |
| SLA | 99.9%+ | 99.9% (VpnGw1+) | No SLA | 99.95% |
| Cost (starter) | ~€0.01/GB | ~€25–150/month | ~€25–150/month | ~€200+/month + carrier |
| Setup complexity | Low | Medium | Low–Medium | High |

---

## 3. Connectivity option decision tree

Use this to pick the right tool.

```
START: What are you connecting?

├── VNet to another VNet (same or different region)?
│   └── Use VNet Peering (default). VNet-to-VNet VPN only if peering is unavailable.
│
├── A branch office / datacenter / multiple devices on a network to a VNet?
│   ├── Is encryption over public internet acceptable?
│   │   ├── Yes → S2S VPN
│   │   └── No, need private circuit → ExpressRoute
│   └── Need redundant paths? → ExpressRoute + S2S as backup
│
├── Individual remote users / laptops to a VNet?
│   └── P2S VPN
│
└── Both branch AND individual users?
    └── Coexistence: Same VPN Gateway handles both simultaneously.
```

---

## 4. Azure VPN Gateway SKU matrix

The **VPN Gateway SKU** determines what features you get and how much you pay. The gateway is the single most expensive component in this lab — know it well.

| SKU | Throughput | S2S tunnels | P2S clients | BGP | Active-Active | Zone redundant | Custom IPsec policy | Approximate cost (24/7) |
|-----|-----------|-------------|-------------|-----|---------------|----------------|--------------------|-----------------------|
| Basic | 100 Mbps | 10 | 128 (SSTP only) | ❌ | ❌ | ❌ | ❌ | ~€26/month |
| VpnGw1 | 650 Mbps | 30 | 250 | ✅ | ✅ | ❌ | ✅ | ~€140/month |
| VpnGw2 | 1 Gbps | 30 | 500 | ✅ | ✅ | ❌ | ✅ | ~€360/month |
| VpnGw3 | 1.25 Gbps | 30 | 1000 | ✅ | ✅ | ❌ | ✅ | ~€920/month |
| VpnGw1AZ | 650 Mbps | 30 | 250 | ✅ | ✅ | ✅ | ✅ | ~€180/month |
| VpnGw4–5 / AZ | 5–10 Gbps | 100+ | 10,000 | ✅ | ✅ | ✅ | ✅ | €1500+/month |

**Key exam facts:**

- **Basic** does not support BGP, active-active, zone-redundancy, or custom IPsec policies
- **Basic** cannot use **IKEv2 for P2S** (only SSTP) — and Microsoft is deprecating Basic
- **AZ SKUs** (VpnGw1AZ, VpnGw2AZ, etc.) are zone-redundant — pin to these for production
- Gateway SKU can be resized upward (Basic → VpnGw1 etc.) without recreating
- The **GatewaySubnet** must be named exactly `GatewaySubnet` and sized at least `/27` (recommended `/26`)

**Lab recommendation:** Use **Basic** or **VpnGw1**. Basic for bare-bones cost, VpnGw1 if you want to experiment with BGP or custom policies.

---

## 5. Lab architecture

### 5.1 Topology overview

```
                   ┌──────────────────────────┐
                   │  Azure — vnet-hybrid     │
                   │  10.0.0.0/16             │
                   │                          │
  ┌─────────────┐  │ ┌──────────────────────┐ │
  │  On-prem    │  │ │ GatewaySubnet        │ │
  │  simulator  │  │ │ 10.0.2.0/24          │ │
  │             │  │ │ ┌──────────────────┐ │ │
  │ Cloud VM    │──┼─┼─┤ VPN Gateway      │ │ │
  │ strongSwan/ │  │ │ │ (VpnGw1 or Basic)│ │ │
  │ Libreswan   │◄─┼─┼─┤ Public IP        │ │ │
  │             │  │ │ └────────┬─────────┘ │ │
  │ Public IP   │  │ │          │           │ │
  │             │  │ │ ┌────────┴─────────┐ │ │
  │ Claimed LAN │  │ │ │ subnet1          │ │ │
  │ 10.2.0.0/16 │  │ │ │ 10.0.1.0/24      │ │ │
  └─────────────┘  │ │ │ ┌──────────────┐ │ │ │
                   │ │ │ │ VM 10.0.1.4  │ │ │ │
                   │ │ │ └──────────────┘ │ │ │
                   │ │ └──────────────────┘ │ │
                   │ │ ┌──────────────────┐ │ │
                   │ │ │ subnet2          │ │ │
                   │ │ │ 10.0.3.0/24      │ │ │
                   │ │ │ ┌──────────────┐ │ │ │
                   │ │ │ │ VM 10.0.3.4  │ │ │ │
                   │ │ │ └──────────────┘ │ │ │
                   │ │ └──────────────────┘ │ │
                   │ └──────────────────────┘ │
                   └──────────────────────────┘

For P2S: laptop / Ubuntu VM connects directly to VPN Gateway's public IP
         via OpenVPN or IKEv2, gets assigned IP from P2S address pool (172.16.0.0/24)
```

### 5.2 Address space plan

| Role | CIDR | Notes |
|------|------|-------|
| Azure VNet (`vnet-hybrid`) | `10.0.0.0/16` | Main workload network |
| GatewaySubnet | `10.0.2.0/24` | Reserved name, required for VPN GW |
| subnet1 | `10.0.1.0/24` | VM 10.0.1.4 |
| subnet2 | `10.0.3.0/24` | VM 10.0.3.4 |
| Simulated on-prem LAN | `10.2.0.0/16` | Must not overlap Azure |
| P2S client pool | `172.16.0.0/24` | Must not overlap Azure or on-prem |

**Golden rule:** No two ranges in this table can overlap. Azure will reject overlapping address spaces and tunnels will fail silently.

### 5.3 Resource inventory

Create in resource group `rg-vpn-lab`, region `westeurope`:

1. Virtual network `vnet-hybrid` with three subnets (above)
2. Two Linux VMs (`vm-1` in subnet1, `vm-2` in subnet2) — B1s Ubuntu, no public IP
3. Public IP `pip-vpngw`
4. Virtual network gateway `vpngw-hybrid` (SKU: VpnGw1 or Basic)
5. Local network gateway `lng-onprem` (represents cloud VM)
6. Connection `conn-s2s-onprem` (links VPN GW ↔ local network GW)
7. NSG `nsg-hybrid` applied to VM subnets
8. **Cloud VM outside Azure** (Hetzner, DigitalOcean, etc.) with public IP for on-prem simulation

---

## 6. Prerequisites

### 6.1 Accounts & access

- [ ] Azure subscription with Contributor rights
- [ ] Hetzner Cloud (or AWS / DigitalOcean / any cloud with public IPv4) account
- [ ] SSH key pair for VM access

### 6.2 Local tools

```bash
# On your MacBook:
brew install azure-cli
brew install hcloud-cli   # optional, if using Hetzner
az login
```

### 6.3 Budget reminder

The Virtual Network Gateway is billed **per hour** as long as it exists. Tear it down at the end of each lab session. Basic SKU is ~€0.03/hour, VpnGw1 is ~€0.19/hour. Budget ~€1–2 per evening of practice.

---

## 7. Scenario A — Site-to-Site with Libreswan on a cloud VM

This is the main event. We'll build a working S2S tunnel between a cloud VM and an Azure VPN Gateway using **Libreswan** — the direct descendant of Openswan and the modern equivalent for RHEL-lineage systems (see [Appendix A](#14-appendix-a--openswan-vs-libreswan-vs-strongswan) for the family tree).

> **Note on Openswan:** Openswan hasn't had a stable release since 2014 and is effectively abandoned. Libreswan is its spiritual successor, fully maintained, and the default IPsec stack on Rocky Linux, Alma, RHEL, and Fedora. Ubuntu can run either Libreswan or strongSwan. This guide uses Libreswan as requested in spirit (Openswan-lineage) while using actively maintained software.

### 7.1 Step 1 — Create the Azure infrastructure

```bash
# Variables
RG="rg-vpn-lab"
LOC="westeurope"
VNET="vnet-hybrid"
GWNAME="vpngw-hybrid"
PIPNAME="pip-vpngw"
LNGNAME="lng-onprem"
CONNNAME="conn-s2s-onprem"
PSK="$(openssl rand -base64 32)"   # Strong PSK, save this!

echo "PSK = $PSK"   # write this down

# Resource group
az group create -n $RG -l $LOC

# VNet and subnets
az network vnet create -g $RG -n $VNET \
  --address-prefixes 10.0.0.0/16 \
  --subnet-name subnet1 --subnet-prefixes 10.0.1.0/24

az network vnet subnet create -g $RG --vnet-name $VNET \
  -n GatewaySubnet --address-prefixes 10.0.2.0/24

az network vnet subnet create -g $RG --vnet-name $VNET \
  -n subnet2 --address-prefixes 10.0.3.0/24

# Public IP for the gateway
# (Standard SKU is required for AZ SKUs and recommended everywhere)
az network public-ip create -g $RG -n $PIPNAME \
  --allocation-method Static --sku Standard

# VPN Gateway (takes 20-45 minutes to provision)
az network vnet-gateway create -g $RG -n $GWNAME \
  --public-ip-addresses $PIPNAME \
  --vnet $VNET --gateway-type Vpn --vpn-type RouteBased \
  --sku VpnGw1 --no-wait

# While you wait, note the gateway's public IP once available:
az network public-ip show -g $RG -n $PIPNAME --query ipAddress -o tsv
```

### 7.2 Step 2 — Provision the cloud VM ("on-prem")

Any cloud will do. Hetzner example:

```bash
# Via Hetzner Cloud console or CLI, create:
# - Ubuntu 24.04 LTS
# - Smallest VM size (CX11 / CPX11 is plenty)
# - Public IPv4
# - SSH key attached
#
# Note the public IP: ONPREM_PUBLIC_IP
```

SSH into it and install Libreswan:

```bash
ssh deploy@ONPREM_PUBLIC_IP

# Update and install
sudo apt update
sudo apt install -y libreswan

# Verify
sudo ipsec --version
```

### 7.3 Step 3 — Create the Local Network Gateway

The Local Network Gateway represents your "on-prem" side in Azure. It needs the cloud VM's public IP and the address space you'll claim to represent.

```bash
ONPREM_PUBLIC_IP="89.167.64.33"   # your cloud VM's public IP

az network local-gateway create -g $RG -n $LNGNAME \
  --gateway-ip-address $ONPREM_PUBLIC_IP \
  --local-address-prefixes 10.2.0.0/16
```

### 7.4 Step 4 — Create the Connection

This glues the VPN Gateway and the Local Network Gateway together with the PSK.

```bash
# Wait for VPN gateway to finish provisioning if not done
az network vnet-gateway wait -g $RG -n $GWNAME --created

az network vpn-connection create -g $RG -n $CONNNAME \
  --vnet-gateway1 $GWNAME \
  --local-gateway2 $LNGNAME \
  --shared-key "$PSK" \
  --enable-bgp false

# Get the Azure VPN Gateway public IP (you'll need this on the on-prem side)
AZURE_GW_IP=$(az network public-ip show -g $RG -n $PIPNAME --query ipAddress -o tsv)
echo "Azure VPN Gateway IP: $AZURE_GW_IP"
```

### 7.5 Step 5 — Configure Libreswan on the cloud VM

Libreswan uses `/etc/ipsec.conf` and `/etc/ipsec.secrets`, similar to strongSwan but with subtle differences.

```bash
# On the cloud VM
sudo mkdir -p /etc/ipsec.d

# Create the connection config
sudo tee /etc/ipsec.d/azure-s2s.conf > /dev/null <<'EOF'
conn azure-s2s
    type=tunnel
    authby=secret
    auto=start
    keyexchange=ikev2
    ike=aes256-sha1;modp1024
    phase2alg=aes_gcm256
    ikelifetime=28800s
    salifetime=3600s
    rekeymargin=3m
    keyingtries=%forever
    dpddelay=30
    dpdtimeout=120
    dpdaction=restart
    left=%defaultroute
    leftid=ONPREM_PUBLIC_IP
    leftsubnet=10.2.0.0/16
    right=AZURE_GW_IP
    rightid=AZURE_GW_IP
    rightsubnet=10.0.0.0/16
EOF

# Replace placeholders with real values
sudo sed -i "s/ONPREM_PUBLIC_IP/$(curl -s4 ifconfig.me)/" /etc/ipsec.d/azure-s2s.conf
sudo sed -i "s/AZURE_GW_IP/20.103.209.44/" /etc/ipsec.d/azure-s2s.conf  # replace with your actual Azure GW IP

# Create the PSK file
# Format: <left> <right> : PSK "<secret>"
sudo tee /etc/ipsec.d/azure-s2s.secrets > /dev/null <<EOF
$(curl -s4 ifconfig.me) 20.103.209.44 : PSK "YOUR_PSK_HERE"
EOF
sudo chmod 600 /etc/ipsec.d/azure-s2s.secrets

# Enable IP forwarding
echo 'net.ipv4.ip_forward=1' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Start Libreswan
sudo systemctl enable --now ipsec
sudo ipsec auto --add azure-s2s
sudo ipsec auto --up azure-s2s

# Check status
sudo ipsec status
sudo ipsec trafficstatus
```

Successful output looks like:

```
000 "azure-s2s":   routed TUNNEL;
006 #1: "azure-s2s":500 STATE_V2_ESTABLISHED_IKE_SA (authenticated IKE SA); ...
006 #2: "azure-s2s":500 STATE_V2_ESTABLISHED_CHILD_SA (IPsec SA established); ...
```

### 7.6 Step 6 — Create the dummy interface (lab-only)

Because the cloud VM doesn't actually have a LAN on 10.2.0.0/16, we fake one:

```bash
# Create dummy interface with a "LAN-side" IP
sudo ip link add dummy0 type dummy
sudo ip link set dummy0 up
sudo ip addr add 10.2.0.1/32 dev dummy0

# Optional: add SNAT rule so ANY traffic from the VM to Azure looks like it came from 10.2.0.1
sudo iptables -t nat -A POSTROUTING -d 10.0.0.0/16 -j SNAT --to-source 10.2.0.1
```

### 7.7 Step 7 — Deploy Azure test VMs

```bash
# Create cloud-init to allow ICMP and ensure SSH is ready
cat > /tmp/cloud-init.yml <<'EOF'
#cloud-config
package_update: true
packages: [iputils-ping]
EOF

# Create two Linux VMs, no public IP
az vm create -g $RG -n vm-1 \
  --image Ubuntu2404 --size Standard_B1s \
  --vnet-name $VNET --subnet subnet1 \
  --public-ip-address "" \
  --admin-username azureuser \
  --ssh-key-values ~/.ssh/id_rsa.pub \
  --custom-data /tmp/cloud-init.yml

az vm create -g $RG -n vm-2 \
  --image Ubuntu2404 --size Standard_B1s \
  --vnet-name $VNET --subnet subnet2 \
  --public-ip-address "" \
  --admin-username azureuser \
  --ssh-key-values ~/.ssh/id_rsa.pub \
  --custom-data /tmp/cloud-init.yml
```

### 7.8 Step 8 — Configure NSG to allow traffic from on-prem

```bash
# Find the NSG Azure auto-created with the VMs
NSG1=$(az network nic show -g $RG -n vm-1VMNic --query networkSecurityGroup.id -o tsv)
NSG1_NAME=$(basename $NSG1)

# Allow all traffic from 10.2.0.0/16
az network nsg rule create -g $RG --nsg-name $NSG1_NAME \
  -n AllowOnPremLab --priority 200 \
  --source-address-prefixes 10.2.0.0/16 \
  --destination-port-ranges '*' \
  --access Allow --protocol '*' \
  --direction Inbound

# Repeat for vm-2's NSG
NSG2=$(az network nic show -g $RG -n vm-2VMNic --query networkSecurityGroup.id -o tsv)
NSG2_NAME=$(basename $NSG2)
az network nsg rule create -g $RG --nsg-name $NSG2_NAME \
  -n AllowOnPremLab --priority 200 \
  --source-address-prefixes 10.2.0.0/16 \
  --destination-port-ranges '*' \
  --access Allow --protocol '*' \
  --direction Inbound
```

### 7.9 Step 9 — Test the tunnel

From the cloud VM:

```bash
# Ping VM 1 with source from 10.2.0.1 (matches tunnel selector)
ping -c 4 -I 10.2.0.1 10.0.1.4

# Or, if SNAT rule is active:
ping -c 4 10.0.1.4

# SSH into the Azure VM via its private IP
ssh -b 10.2.0.1 azureuser@10.0.1.4
# Or with SNAT:
ssh azureuser@10.0.1.4

# Verify byte counters climbing
sudo ipsec trafficstatus
```

Expected output from `trafficstatus`:

```
006 #2: "azure-s2s", type=ESP, add_time=1713264000, inBytes=336, outBytes=336, maxBytes=2^63B, id='ONPREM_IP'
```

**If `inBytes` and `outBytes` both grow, the tunnel works end-to-end.** That's the milestone.

### 7.10 Step 10 — Make things persistent (optional)

Persist the dummy interface and SNAT across reboots:

```bash
# Netplan approach (Ubuntu default)
sudo tee /etc/netplan/99-lab-dummy.yaml > /dev/null <<EOF
network:
  version: 2
  dummy-devices:
    dummy0:
      addresses: [10.2.0.1/32]
EOF
sudo chmod 600 /etc/netplan/99-lab-dummy.yaml
sudo netplan apply

# Persist iptables SNAT
sudo apt install -y iptables-persistent
sudo netfilter-persistent save
```

---

## 8. Scenario B — Point-to-Site from a laptop / Ubuntu VM

P2S gives you VPN access from a single device with no public IP requirement. This is the **correct pattern for laptops, Parallels VMs, or any NAT'd client**.

### 8.1 When to use P2S instead of S2S

Use P2S when:

- Your client has no public IP (laptop, VM behind NAT, CGNAT)
- You only have one or a few devices that need Azure access
- The client is mobile (different networks, different IPs)
- You don't want to maintain "on-prem" infrastructure

Use S2S instead when:

- You have many devices on a fixed network that all need Azure access
- Your network has a proper VPN router with a public IP
- You need always-on site connectivity

### 8.2 Enable P2S on the existing VPN Gateway

The same VPN Gateway can serve S2S and P2S simultaneously. We'll add P2S without touching the S2S from Scenario A.

```bash
# Note: Basic SKU supports P2S only via SSTP. For OpenVPN or IKEv2, you need VpnGw1+.

# For certificate-based P2S (simplest), you need a root certificate.
# Generate a root cert and client cert on your MacBook:

# Root cert
openssl req -x509 -newkey rsa:4096 -keyout root.key -out root.crt \
  -days 365 -nodes -subj "/CN=VPN Root CA"

# Export root cert in base64 (without BEGIN/END lines) for Azure
openssl x509 -in root.crt -outform der | base64 | tr -d '\n' > root.b64

# Client cert (signed by root)
openssl req -newkey rsa:4096 -keyout client.key -out client.csr \
  -nodes -subj "/CN=vpn-client-1"

openssl x509 -req -in client.csr -CA root.crt -CAkey root.key \
  -CAcreateserial -out client.crt -days 365

# Now configure P2S on the Azure VPN Gateway
ROOT_CERT_B64=$(cat root.b64)

az network vnet-gateway update -g $RG -n $GWNAME \
  --address-prefixes 172.16.0.0/24 \
  --client-protocol OpenVPN IkeV2 \
  --root-cert-data "$ROOT_CERT_B64" \
  --root-cert-name "VpnRootCA"
```

### 8.3 Download the VPN client package

```bash
# Generate the client configuration package (ZIP)
az network vnet-gateway vpn-client generate \
  -g $RG -n $GWNAME \
  --processor-architecture Amd64 \
  > vpnclient-url.txt

# The command returns a URL; download the ZIP
VPN_URL=$(cat vpnclient-url.txt | tr -d '"')
curl -o vpnclient.zip "$VPN_URL"
unzip vpnclient.zip -d vpnclient/

# Inside vpnclient/OpenVPN/ you'll find vpnconfig.ovpn
```

### 8.4 Connect from Ubuntu (VM on laptop or standalone)

```bash
# Install OpenVPN
sudo apt install -y openvpn

# Copy the OVPN config
cp vpnclient/OpenVPN/vpnconfig.ovpn ~/azure-p2s.ovpn

# Embed the client cert and key (or reference them externally)
# The OVPN template from Azure has placeholders like <cert>P2S_CLIENT_CERTIFICATE</cert>
sed -i "s|P2S_CLIENT_CERTIFICATE|$(cat client.crt | sed 's/$/\\n/' | tr -d '\n')|" ~/azure-p2s.ovpn
sed -i "s|P2S_CLIENT_CERTIFICATE_PRIVATE_KEY|$(cat client.key | sed 's/$/\\n/' | tr -d '\n')|" ~/azure-p2s.ovpn

# Connect
sudo openvpn --config ~/azure-p2s.ovpn
```

### 8.5 Verify P2S connectivity

In a separate terminal:

```bash
# Check the assigned IP
ip addr show tun0
# Should show an IP in 172.16.0.0/24

# Ping an Azure VM's private IP
ping 10.0.1.4

# SSH
ssh azureuser@10.0.1.4
```

No dummy interface, no SNAT, no `-b` flag needed. The OpenVPN client handles source addressing automatically because the tunnel interface itself has an IP in the P2S pool.

### 8.6 Connect from Windows, macOS, iOS

The downloaded ZIP contains installers and configs for all supported platforms:

- `WindowsAmd64/` — SSTP/IKEv2 native configuration (click the .exe)
- `Generic/` — IKEv2 config for macOS (import into System Settings → VPN)
- `OpenVPN/` — OpenVPN config for any OS with an OpenVPN client (and the Azure VPN Client app for Entra ID auth)
- Mobile: use the Azure VPN Client app (iOS / Android) with the XML config

---

## 9. Scenario C — VNet-to-VNet as a "pure Azure" S2S simulation

If you want to practice S2S mechanics without any on-prem or cloud VM at all, do VNet-to-VNet. You create two VNets, each with its own VPN gateway, and connect them. Azure handles all the IPsec under the hood, but you still configure all the objects that a real S2S uses.

### 9.1 Setup

```bash
RG="rg-vnet2vnet-lab"
LOC="westeurope"
PSK="$(openssl rand -base64 32)"

az group create -n $RG -l $LOC

# VNet A
az network vnet create -g $RG -n vnet-a \
  --address-prefixes 10.10.0.0/16 \
  --subnet-name workload --subnet-prefixes 10.10.1.0/24

az network vnet subnet create -g $RG --vnet-name vnet-a \
  -n GatewaySubnet --address-prefixes 10.10.2.0/24

# VNet B
az network vnet create -g $RG -n vnet-b \
  --address-prefixes 10.20.0.0/16 \
  --subnet-name workload --subnet-prefixes 10.20.1.0/24

az network vnet subnet create -g $RG --vnet-name vnet-b \
  -n GatewaySubnet --address-prefixes 10.20.2.0/24

# Public IPs
az network public-ip create -g $RG -n pip-gw-a --allocation-method Static --sku Standard
az network public-ip create -g $RG -n pip-gw-b --allocation-method Static --sku Standard

# VPN Gateways (takes 20-45 min each; can run in parallel)
az network vnet-gateway create -g $RG -n gw-a \
  --public-ip-addresses pip-gw-a --vnet vnet-a \
  --gateway-type Vpn --vpn-type RouteBased \
  --sku VpnGw1 --no-wait

az network vnet-gateway create -g $RG -n gw-b \
  --public-ip-addresses pip-gw-b --vnet vnet-b \
  --gateway-type Vpn --vpn-type RouteBased \
  --sku VpnGw1 --no-wait

# Wait for both
az network vnet-gateway wait -g $RG -n gw-a --created
az network vnet-gateway wait -g $RG -n gw-b --created

# Connections (A→B and B→A)
az network vpn-connection create -g $RG -n conn-a-to-b \
  --vnet-gateway1 gw-a --vnet-gateway2 gw-b \
  --shared-key "$PSK"

az network vpn-connection create -g $RG -n conn-b-to-a \
  --vnet-gateway1 gw-b --vnet-gateway2 gw-a \
  --shared-key "$PSK"
```

### 9.2 Verify

```bash
az network vpn-connection show -g $RG -n conn-a-to-b \
  --query "{status:connectionStatus, egress:egressBytesTransferred, ingress:ingressBytesTransferred}"
```

Deploy a VM in each VNet and ping across.

### 9.3 Trade-offs

**Pros:** No external infrastructure needed, pure Azure, fully supported, teaches Azure-side S2S config end-to-end.

**Cons:** Twice the VPN Gateway cost (~€280/month on VpnGw1 if left running), doesn't teach on-prem VPN device config.

---

## 10. Verification & troubleshooting

### 10.1 The byte counter diagnostic

This is the single most useful troubleshooting tool. Run on the cloud VM:

```bash
sudo ipsec trafficstatus
```

| inBytes | outBytes | Diagnosis |
|---------|----------|-----------|
| 0 | 0 | Nothing entering the tunnel. Check source IP / traffic selectors / dummy interface. |
| 0 | >0 | Packets leaving, nothing returning. Check Azure NSG, VM firewall, effective routes. |
| >0 | 0 | Azure is sending, on-prem side can't decrypt. Check IPsec policies match. |
| >0 | >0 | 🎉 Tunnel fully functional. |

### 10.2 Azure connection status

```bash
az network vpn-connection show -g $RG -n $CONNNAME \
  --query "{status:connectionStatus, egress:egressBytesTransferred, ingress:ingressBytesTransferred}"
```

`connectionStatus` values: `Unknown`, `Connecting`, `Connected`, `NotConnected`.

### 10.3 Effective routes

```bash
# Check what routes an Azure VM's NIC sees
az network nic show-effective-route-table -g $RG -n vm-1VMNic -o table
```

You should see a route like:

```
Source                    State    Address Prefix    Next Hop Type              Next Hop IP
------------------------  -------  ----------------  -------------------------  -------------
VirtualNetworkGateway     Active   10.2.0.0/16       VirtualNetworkGateway      ...
```

If the route isn't there, the Local Network Gateway address space or the connection is misconfigured.

### 10.4 Common failure modes

#### Failure: Tunnel establishes but no traffic flows

- **Check traffic selectors match** on both sides (Azure `connectionStatus=Connected` AND Libreswan shows matching subnets)
- **Check dummy interface exists** on cloud VM (`ip addr show dummy0`)
- **Check NSG rules** allow source from simulated on-prem range
- **Check effective routes** on Azure VMs include the on-prem CIDR
- **Check Azure VM OS firewall** (ufw, Windows Firewall)

#### Failure: Tunnel never establishes (IKE SA fails)

- **Check PSK matches exactly** on both sides (copy-paste, no trailing whitespace)
- **Check public IPs match** what's configured on both sides
- **Check IKE version matches** (IKEv2 on both)
- **Check NAT-Traversal** if cloud VM is behind any NAT (rare for cloud VMs, common for home)
- **Check firewall allows UDP 500, UDP 4500, and ESP** (IP proto 50) on the cloud VM
- **Check IPsec/IKE policy match** — if Azure uses "Default" and cloud VM uses custom, they may conflict

#### Failure: Intermittent connectivity

- **Check Dead Peer Detection (DPD)** settings — mismatched DPD can cause false positives
- **Check rekeying intervals** — too aggressive rekeying can briefly drop traffic
- **Check MTU / MSS** — IPsec reduces usable MTU; clamp MSS to 1350 on the tunnel interface

### 10.5 Packet capture for deep debugging

```bash
# On the cloud VM, capture IPsec traffic
sudo tcpdump -i any -n 'udp port 500 or udp port 4500 or esp' -w /tmp/ipsec.pcap

# Let it run while you test, then analyze with Wireshark
```

---

## 11. Security hardening checklist

The lab defaults are fine for learning but lax for anything production-adjacent. Before taking these patterns to real work:

### 11.1 PSK / authentication

- [ ] **PSK is at least 32 chars, random** (`openssl rand -base64 32`). Never use words, service names, or sequences.
- [ ] **PSK is stored securely** — not in shell history, not in git, not in chat logs
- [ ] **Rotate PSK periodically** (quarterly or annually)
- [ ] **Consider certificate-based authentication** for production (harder to set up, much harder to compromise)

### 11.2 Cryptographic policy

- [ ] **Use IKEv2**, not IKEv1
- [ ] **Use DH group 14 (MODP_2048) minimum**, preferably group 19 (ECP_256) or higher
- [ ] **Use SHA-256 or SHA-384**, not SHA-1, for integrity
- [ ] **Use AES-GCM-256** for ESP (authenticated encryption)
- [ ] **Configure custom IPsec/IKE policy** if your SKU supports it (VpnGw1+)

Example Azure custom policy:

```bash
az network vpn-connection ipsec-policy add \
  -g $RG --connection-name $CONNNAME \
  --ike-encryption AES256 --ike-integrity SHA256 \
  --dh-group DHGroup14 \
  --ipsec-encryption GCMAES256 --ipsec-integrity GCMAES256 \
  --pfs-group PFS2048 --sa-lifetime 3600 --sa-max-size 102400000
```

### 11.3 Network-level controls

- [ ] **NSGs restrict by port, not just by source range** — allow only what's needed (22, 443, etc.)
- [ ] **Separate NSGs per subnet / tier** — defense in depth
- [ ] **Consider Azure Firewall or NVA** between VPN GW and workload subnets
- [ ] **Enable DDoS Protection Standard** on the VPN Gateway public IP

### 11.4 Identity & access

- [ ] **SSH key auth only** on cloud VM and Azure VMs — no passwords
- [ ] **Azure RBAC least privilege** on the VPN Gateway and related resources
- [ ] **Activity log monitoring** — alert on gateway changes, connection creations

### 11.5 Monitoring & logging

- [ ] **VPN Gateway diagnostic logs** sent to Log Analytics
- [ ] **Tunnel connection metrics** alerted (disconnects, packet drops)
- [ ] **Cloud VM auth log monitoring** (failed SSH, sudo activity)

---

## 12. Teardown & cost control

**Most important step.** The VPN Gateway is expensive and keeps billing whether you use it or not.

### 12.1 Teardown order (save money)

```bash
# 1. Delete connections first (quick, free)
az network vpn-connection delete -g $RG -n $CONNNAME

# 2. Delete the VPN Gateway (THE expensive resource)
az network vnet-gateway delete -g $RG -n $GWNAME

# 3. Delete the public IP (cheap but cleans up)
az network public-ip delete -g $RG -n $PIPNAME

# 4. Delete local network gateway (free)
az network local-gateway delete -g $RG -n $LNGNAME

# 5. Delete VMs (cheap if small, still accruing storage cost)
az vm delete -g $RG -n vm-1 --yes
az vm delete -g $RG -n vm-2 --yes

# 6. (Optional) nuke the whole resource group
az group delete -n $RG --yes --no-wait
```

### 12.2 Cost summary by scenario

| Scenario | Hourly cost | 4-hour session | 24/7 weekend |
|----------|-------------|----------------|--------------|
| Basic SKU S2S | ~€0.03 | ~€0.12 | ~€1.50 |
| VpnGw1 S2S | ~€0.19 | ~€0.80 | ~€9.00 |
| VpnGw1 VNet-to-VNet (2 gateways) | ~€0.38 | ~€1.60 | ~€18.00 |
| Hetzner CX11 VM (always on) | ~€0.007 | €0.03 | ~€4/month |

**Always verify teardown** by checking the portal or running:

```bash
az resource list -g $RG -o table
```

### 12.3 Keeping things running between sessions

If you want to resume tomorrow without rebuilding everything:

- **Keep:** VNet, subnets, Local Network Gateway, Connection resource, NSGs, VMs (deallocated)
- **Delete:** VPN Gateway (reprovision takes 20-45 min but saves 90%+ of cost)

When you want to resume:

```bash
az vm start -g $RG -n vm-1 -n vm-2
az network vnet-gateway create -g $RG -n $GWNAME \
  --public-ip-addresses $PIPNAME --vnet $VNET ...
```

---

## 13. AZ-104 exam takeaways

What this lab teaches that the exam tests:

### Conceptual

- ✅ Difference between S2S, P2S, VNet-to-VNet, VNet peering, ExpressRoute
- ✅ Required Azure resources: VPN Gateway, Local Network Gateway, Connection, GatewaySubnet
- ✅ Why the GatewaySubnet is special (name must be exact, minimum /27)
- ✅ Route-based vs policy-based VPNs (use route-based unless forced otherwise)
- ✅ SKU capabilities: Basic limitations, when to upgrade

### Technical

- ✅ IPsec/IKE basics: IKEv1 vs IKEv2, PSK vs cert, Phase 1 vs Phase 2
- ✅ Address space overlap rules — why they exist and how they fail
- ✅ NSGs as the final line of defense — tunnel up ≠ traffic flowing
- ✅ P2S client authentication: certificate, Entra ID, RADIUS
- ✅ Point-to-Site protocols: SSTP, IKEv2, OpenVPN — which clients support which

### Common exam question patterns

1. *"Company wants 50 remote users to connect to VNet — what should they implement?"* → **P2S VPN**
2. *"Branch office with a VPN-capable firewall needs always-on access to Azure"* → **S2S VPN**
3. *"Two VNets in different regions need to communicate securely"* → **VNet peering** (not VPN)
4. *"Need private, dedicated connection with SLA and 10 Gbps"* → **ExpressRoute**
5. *"Users need P2S with Entra ID authentication"* → requires **OpenVPN protocol** + VpnGw1+ SKU
6. *"S2S tunnel shows Connected but pings fail"* → check **NSGs, effective routes, address space match**
7. *"Need zone-redundant VPN Gateway"* → **AZ SKU** (VpnGw1AZ, etc.), requires Standard SKU public IP

---

## 14. Appendix A — Openswan vs Libreswan vs strongSwan

IPsec implementations on Linux have a tangled family history. Here's the lineage:

```
FreeS/WAN (1999-2004)
    │
    ├── Openswan (2004-2014, effectively abandoned)
    │       │
    │       └── Libreswan (2012-present, actively maintained)
    │
    └── strongSwan (2005-present, actively maintained)
```

### Comparison

| Feature | Openswan | Libreswan | strongSwan |
|---------|----------|-----------|------------|
| Maintained | ❌ (last release ~2014) | ✅ | ✅ |
| Default on RHEL/Fedora | - | ✅ | - |
| Default on Debian/Ubuntu | - | alternative | ✅ primary |
| IKEv2 support | limited | ✅ | ✅ (originated IKEv2) |
| Kernel integration | NETKEY / KLIPS | NETKEY (XFRM) | NETKEY (XFRM) |
| Config style | `ipsec.conf` | `ipsec.conf` (Openswan-compatible) | `ipsec.conf` (subtly different) or `swanctl.conf` |
| IKE charon/pluto | pluto | pluto (modernized) | charon |

### When to pick which

- **Libreswan:** You're on RHEL/Rocky/Alma/Fedora, or want Openswan-compatible configs with active maintenance
- **strongSwan:** You're on Debian/Ubuntu, want IKEv2 excellence, or need advanced features (EAP, certificates, high availability, multiple workers)
- **Openswan:** Don't. Use Libreswan instead. Anything that would work with Openswan works with Libreswan.

### Config portability

The good news: `ipsec.conf` is largely compatible between Libreswan and Openswan. Migration from Openswan → Libreswan is usually drop-in. Migration to strongSwan requires minor syntax adjustments (e.g., `phase2alg` → `esp`, slightly different algorithm naming).

For this lab, **either Libreswan or strongSwan works**. The S2S scenario shows Libreswan since you specifically asked about "Openswan" (its ancestor). If you want strongSwan syntax, it's:

```
conn azure-s2s
    type=tunnel
    auto=start
    keyexchange=ikev2
    ike=aes256-sha1-modp1024!
    esp=aes256gcm16!
    authby=secret
    left=%defaultroute
    leftid=ONPREM_IP
    leftsubnet=10.2.0.0/16
    right=AZURE_GW_IP
    rightsubnet=10.0.0.0/16
    # ... rest similar
```

---

## 15. Appendix B — Reusable scripts

### 15.1 Lab bootstrap (cloud VM side)

Save as `~/lab-up.sh`:

```bash
#!/bin/bash
set -e
echo "Bringing up lab network interfaces..."

# Dummy interface
sudo ip link add dummy0 type dummy 2>/dev/null || true
sudo ip link set dummy0 up
sudo ip addr add 10.2.0.1/32 dev dummy0 2>/dev/null || true

# SNAT rule (idempotent)
if ! sudo iptables -t nat -C POSTROUTING -d 10.0.0.0/16 -j SNAT --to-source 10.2.0.1 2>/dev/null; then
  sudo iptables -t nat -A POSTROUTING -d 10.0.0.0/16 -j SNAT --to-source 10.2.0.1
fi

# Ensure IPsec is up
sudo systemctl restart ipsec
sleep 3

# Status
echo ""
echo "=== IPsec status ==="
sudo ipsec status | grep -E "STATE_V2|routed" || true
echo ""
echo "=== Traffic status ==="
sudo ipsec trafficstatus
echo ""
echo "Lab ready. Try: ping 10.0.1.4"
```

### 15.2 Lab teardown (cloud VM side)

Save as `~/lab-down.sh`:

```bash
#!/bin/bash
echo "Tearing down lab interfaces..."
sudo ip link delete dummy0 2>/dev/null || true
sudo iptables -t nat -D POSTROUTING -d 10.0.0.0/16 -j SNAT --to-source 10.2.0.1 2>/dev/null || true
echo "Done."
```

### 15.3 Azure teardown (MacBook side)

Save as `~/azure-vpn-lab-down.sh`:

```bash
#!/bin/bash
RG="${1:-rg-vpn-lab}"

echo "Tearing down VPN lab in $RG..."

# Delete connections first (fast)
for c in $(az network vpn-connection list -g $RG --query '[].name' -o tsv 2>/dev/null); do
  echo "  Deleting connection: $c"
  az network vpn-connection delete -g $RG -n $c
done

# Delete VPN Gateway (the expensive one)
for gw in $(az network vnet-gateway list -g $RG --query '[].name' -o tsv 2>/dev/null); do
  echo "  Deleting VPN gateway: $gw"
  az network vnet-gateway delete -g $RG -n $gw
done

# Delete public IPs
for pip in $(az network public-ip list -g $RG --query '[].name' -o tsv 2>/dev/null); do
  echo "  Deleting public IP: $pip"
  az network public-ip delete -g $RG -n $pip
done

# Delete local network gateways
for lng in $(az network local-gateway list -g $RG --query '[].name' -o tsv 2>/dev/null); do
  echo "  Deleting local gateway: $lng"
  az network local-gateway delete -g $RG -n $lng
done

echo ""
echo "VPN-related resources deleted."
echo "VMs and VNet remain. To delete everything:"
echo "  az group delete -n $RG --yes --no-wait"
```

### 15.4 Quick tunnel status check

Save as `~/vpn-status.sh`:

```bash
#!/bin/bash
RG="${1:-rg-vpn-lab}"
CONN="${2:-conn-s2s-onprem}"

echo "=== Azure side ==="
az network vpn-connection show -g $RG -n $CONN \
  --query "{status:connectionStatus, egress:egressBytesTransferred, ingress:ingressBytesTransferred, tunnelStatus:tunnelConnectionStatus[0].connectionStatus}" \
  -o jsonc

echo ""
echo "=== On-prem effective routes (for VM in subnet1) ==="
VM_NIC=$(az vm show -g $RG -n vm-1 --query 'networkProfile.networkInterfaces[0].id' -o tsv | xargs basename)
az network nic show-effective-route-table -g $RG -n $VM_NIC \
  --query "value[?contains(addressPrefix[0], '10.2.')]" -o table
```

---

## Recap — what you learned

By completing this lab, you've:

1. Built a real Azure VPN infrastructure end-to-end via CLI
2. Configured a Linux IPsec stack (Libreswan) to terminate an S2S tunnel
3. Established the fundamental S2S flow: VNet GW ↔ Local Network GW ↔ Connection ↔ on-prem device
4. Understood why address spaces must match and not overlap
5. Experienced the "dummy interface" pattern for simulating on-prem LAN presence
6. Set up P2S as the correct alternative for NAT'd clients
7. Troubleshot using byte counters, effective routes, and NSG rules
8. Learned the cost model and teardown discipline

This foundation transfers directly to:

- **Real hardware** (Cisco, Fortinet, Palo Alto, EdgeRouter, pfSense) — same IPsec, different syntax
- **AWS / GCP hybrid** — different cloud, identical concepts
- **ExpressRoute** — the private-circuit version, same network-design principles
- **Zero-trust migrations** — VPN tunnels are increasingly replaced by identity-aware proxies, but the underlying network concepts still matter

Most AZ-104 candidates pass the exam knowing the theory. You now have the theory **and** muscle memory from building it.

Happy labbing. 🛠️
