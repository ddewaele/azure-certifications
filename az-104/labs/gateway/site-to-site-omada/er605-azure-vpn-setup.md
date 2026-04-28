# ER605 to Azure Site-to-Site VPN — Setup Summary

## Architecture Overview

```
MacBook (10.2.0.100)
    │
    │  VLAN3 untagged port (port 4)
    ▼
ER605 router
  ├── LAN1: 192.168.5.0/24 (VLAN1, untagged on all ports)
  └── LAN2: 10.2.0.0/16   (VLAN3, tagged on all ports → untagged port 4)
    │
    │  IPsec tunnel (ESP / SHA1 / AES-256)
    │  NAT: 192.168.0.194 → <REDACTED-PUBLIC-IP> (Telenet public IP)
    ▼
Telenet modem (192.168.0.1)
    │
    │  internet
    ▼
Azure VPN Gateway (20.103.209.44)
    │
    │  vnet-hybrid (10.0.0.0/16)
    ▼
vm-internal @ subnet1 (10.0.1.4)
```

---

## Azure Side

### Virtual Network
| Resource | Value |
|---|---|
| VNet | `vnet-hybrid` — `10.0.0.0/16` |
| Gateway subnet | `10.0.2.0/24` |
| subnet1 | `10.0.1.0/24` (VMs live here) |
| subnet2 | `10.0.3.0/24` |
| VPN Gateway public IP | `20.103.209.44` |

### Local Network Gateway
Represents your on-premises network to Azure:

| Field | Value |
|---|---|
| IP address | `<REDACTED-PUBLIC-IP>` (your home public IP) |
| Address space | `10.2.0.0/16` (your ER605 LAN2) |

> ⚠️ If your home public IP changes (Telenet can reassign it), update this value.

### Connection
| Field | Value |
|---|---|
| Type | Site-to-site (IPsec) |
| IKE protocol | IKEv2 |
| IPsec/IKE policy | Default |
| Authentication | Shared Key (PSK) |
| Connection mode | Default |

> ⚠️ **Basic SKU VPN Gateway limitation**: Custom IKE policies are not supported on Basic SKU. The Default policy must be used, which dictates which crypto proposals will be accepted.

---

## ER605 Side

### IPsec Policy (Basic)
| Field | Value |
|---|---|
| Policy Name | `policy1` |
| Mode | LAN-to-LAN |
| Remote Gateway | `20.103.209.44` |
| WAN | WAN1 |
| Local Networks | LAN2 (`10.2.0.0/16`) |
| Remote Subnet | `10.0.0.0/16` |
| Pre-shared Key | *(your PSK)* |

### IPsec Advanced Settings — Phase 1
| Field | Value |
|---|---|
| IKE Version | IKEv2 |
| Negotiation Mode | **Initiator** |
| Proposals | Default (all) |
| SA Lifetime | 28800s |
| DPD | Enabled |

### IPsec Advanced Settings — Phase 2
| Field | Value |
|---|---|
| Encapsulation | Tunnel Mode |
| Proposals | Default (all) |
| PFS | none |
| SA Lifetime | 28800s |

> 💡 Using **all default proposals** on the ER605 is what made it work with the Azure Basic SKU — the devices negotiated a mutually acceptable set automatically.

---

## VLAN / LAN Configuration

### ER605 LAN Networks
| ID | Name | VLAN ID | IP | Subnet Mask | DHCP |
|---|---|---|---|---|---|
| 1 | LAN1 | 1 | 192.168.5.1 | 255.255.255.0 | Enabled |
| 2 | LAN2 | 3 | 10.2.0.1 | 255.255.0.0 | Enabled |

### VLAN Port Assignment
| VLAN | Port 2 | Port 3 | Port 4 | Port 5 |
|---|---|---|---|---|
| vlan1 (LAN1) | UNTAG | UNTAG | UNTAG | UNTAG |
| vlan3 (LAN2) | TAG | TAG | **UNTAG** | TAG |

Port 4 was changed from TAG to UNTAG on vlan3 so that a regular device (MacBook) plugged into port 4 automatically receives a `10.2.0.x` IP without needing VLAN-aware configuration.

> A device on LAN1 (`192.168.5.x`) cannot route through the VPN tunnel because the tunnel's traffic selector only covers `10.2.0.0/16 ↔ 10.0.0.0/16`. To use the VPN, devices must be on LAN2.

---

## Why No DMZ Is Needed

The ER605 is configured as the **Initiator** — it always starts the IKE negotiation outbound to Azure. This means:

1. The Telenet modem sees outbound UDP 500 traffic from the ER605
2. It creates a NAT session automatically
3. Azure's replies match the existing session and are let through
4. No inbound firewall rules or DMZ are needed

DMZ would only be required if Azure were the initiator trying to reach the ER605 unsolicited.

---

## IPsec SA — Healthy State

When the tunnel is up, the IPsec SA table should show two entries:

| Direction | Tunnel | Data Flow | Protocol | ESP Auth | ESP Enc |
|---|---|---|---|---|---|
| in | `20.103.209.44 → 192.168.0.194` | `10.0.0.0/16 → 10.2.0.0/16` | ESP | SHA1 | AES-256 |
| out | `192.168.0.194 → 20.103.209.44` | `10.2.0.0/16 → 10.0.0.0/16` | ESP | SHA1 | AES-256 |

---

## Connecting to Azure VM

From a device on LAN2 (`10.2.0.x`):

```bash
ssh -i ~/.ssh/ed25519 azureuser@10.0.1.4
```

No jump host, no public IP, no Bastion required.

---

## Troubleshooting Reference

| Symptom | Likely Cause | Fix |
|---|---|---|
| IPsec SA empty | Tunnel not establishing | Check system log for errors |
| `NO_PROPOSAL_CHOSEN` | Crypto mismatch | Align proposals with what Azure accepts |
| Phase 1 fails, tunnel reaches Azure | Local ID mismatch (NAT) | Set Local ID to public IP in Phase 1 advanced settings |
| Can't reach Azure VMs | Wrong remote subnet | Change to `10.0.0.0/16` to cover all Azure subnets |
| Tunnel drops after IP change | Telenet reassigned public IP | Update Azure Local Network Gateway IP |
| Device can't use VPN | Device is on LAN1, not LAN2 | Move device to a port untagged on VLAN3 |

---

## Previous Working Config (strongSwan on Hetzner)

For reference — the config that originally worked, connecting a Hetzner Ubuntu VM to the same Azure gateway:

```ini
conn azure-s2s
    type=tunnel
    auto=start
    keyexchange=ikev2
    authby=secret
    left=%defaultroute
    leftid=89.167.64.33
    leftsubnet=10.2.0.0/16
    right=20.103.209.44
    rightsubnet=10.0.0.0/16
    ike=aes256-sha1-modp1024
    esp=aes256-sha1
    keyingtries=%forever
    ikelifetime=28800s
    lifetime=3600s
    dpddelay=30s
    dpdtimeout=120s
    dpdaction=restart
```

This required a dummy interface on the Hetzner VM to source traffic from within the `10.2.0.0/16` subnet:

```bash
sudo ip link add dummy0 type dummy
sudo ip link set dummy0 up
sudo ip addr add 10.2.0.1/32 dev dummy0
```
