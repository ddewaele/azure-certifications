# Debugging: VM Has No Outbound Internet Connectivity

A VM in a private subnet has no outbound internet access even though its routing table and effective routes look correct.

---

## Variables

```bash
RG=rg-vnet-peering
VM=vm-hub
VNET=vnet-hub
SUBNET=subnet1
```

---

## Symptoms

- `ping google.com` fails on all Azure VMs → **this is normal**, Azure's outbound SNAT doesn't forward ICMP. Use `curl` instead.
- `curl https://google.com` works on one VM but hangs silently on another in a different subnet.
- The OS routing table (`route -n`) looks identical on both VMs.

---

## Step 1: Check effective routes

The OS routing table only shows what the guest OS knows. Azure SDN routing sits above that and is not visible to the VM.

```bash
NIC_ID=$(az vm show -g $RG -n $VM --query "networkProfile.networkInterfaces[0].id" -o tsv)
az network nic show-effective-route-table --ids $NIC_ID -o table
```

**Output from a VM with no outbound connectivity:**

```
Source    State    Address Prefix    Next Hop Type    Next Hop IP
--------  -------  ----------------  ---------------  -------------
Default   Active   10.3.0.0/16       VnetLocal
Default   Active   10.1.0.0/16       VNetPeering
Default   Active   10.2.0.0/16       VNetPeering
Default   Active   0.0.0.0/0         Internet
Default   Active   10.0.0.0/8        None
Default   Active   127.0.0.0/8       None
...
```

The `0.0.0.0/0 → Internet` route looks correct — but this doesn't mean outbound works. The route and the SNAT are two separate things. Without SNAT, the packet reaches the Azure edge and is dropped because there's no public IP to translate it to.

---

## Step 2: Check for a UDR, NSG, and NAT Gateway on the subnet

```bash
# UDR attached to subnet?
az network vnet subnet show -g $RG --vnet-name $VNET -n $SUBNET --query routeTable

# NSG on the subnet?
az network vnet subnet show -g $RG --vnet-name $VNET -n $SUBNET --query networkSecurityGroup

# NSG on the NIC?
az network nic show --ids $NIC_ID --query networkSecurityGroup

# NAT Gateway attached?
az network vnet subnet show -g $RG --vnet-name $VNET -n $SUBNET --query natGateway
```

If there's no UDR, no outbound NSG deny, and no NAT Gateway — and effective routes show `Internet` — the culprit is almost certainly the **private subnet** setting.

---

## Step 3: Check defaultOutboundAccess on the subnet

```bash
az network vnet subnet show \
  -g $RG \
  --vnet-name $VNET \
  -n $SUBNET \
  --query defaultOutboundAccess
```

Returns `false` (or nothing, which also means disabled) → the subnet was created with **private subnet** enabled.

---

## Root cause: Private subnet disables default SNAT

Azure used to give every VM implicit outbound internet access via a shared SNAT pool — no public IP required. This is called **default outbound access** and it is being retired.

When you create a subnet with **"Enable private subnet (no default outbound access)"** checked, Azure sets `defaultOutboundAccess: false`. VMs in that subnet get no implicit SNAT. Traffic is routed toward the internet but dropped at the edge.

> **After March 31, 2026, private subnet becomes the default for all new VNets.** Any setup relying on legacy default outbound access will break.

Two VMs can behave differently because they are in different subnets — one created with the flag, one without.

---

## Fix

### Option 1: NAT Gateway (recommended for subnets)

```bash
NAT_GW=natgw-hub
PIP_NAT=pip-natgw-hub

# Create public IP and NAT Gateway
az network public-ip create -g $RG -n $PIP_NAT --sku Standard --allocation-method Static
az network nat gateway create -g $RG -n $NAT_GW --sku Standard --public-ip-addresses $PIP_NAT

# Attach to subnet
az network vnet subnet update \
  -g $RG \
  --vnet-name $VNET \
  -n $SUBNET \
  --nat-gateway $NAT_GW
```

### Option 2: Assign a public IP to the VM NIC (cheapest for a single VM)

```bash
PIP_VM=pip-$VM

az network public-ip create -g $RG -n $PIP_VM --sku Standard --allocation-method Static

NIC_NAME=$(az vm show -g $RG -n $VM --query "networkProfile.networkInterfaces[0].id" -o tsv | cut -d'/' -f9)
az network nic ip-config update \
  -g $RG \
  --nic-name $NIC_NAME \
  -n ipconfig1 \
  --public-ip-address $PIP_VM
```

### Option 3: Flip defaultOutboundAccess back on (may not work reliably post-creation)

```bash
az network vnet subnet update \
  -g $RG \
  --vnet-name $VNET \
  -n $SUBNET \
  --default-outbound-access true
```

> Changing this in the portal or via CLI after subnet creation may not take effect on existing VMs. If it doesn't work, deallocate and restart the VM. For a reliable fix, use Option 1 or 2.

---

## Cost of a NAT Gateway

| Component | Price |
|-----------|-------|
| Resource fee | ~$0.045/hour ≈ **$32/month** (billed while it exists, even if idle) |
| Data processing | ~$0.045/GB processed |

**Alternatives:**

| Option | Approx. cost | Notes |
|--------|-------------|-------|
| NAT Gateway | ~$32/month + $0.045/GB | Covers all VMs on the subnet; no public IP per VM |
| Public IP per VM | ~$3.60/month per IP | Exposes VM directly; add NSG rules |
| Standard Load Balancer + outbound rules | ~$18/month + $0.008/GB | Useful if you need a LB anyway |
| Legacy default outbound access | Free | Retired March 31, 2026 |

For a **lab with a single VM** that just needs outbound for package installs or testing: assign a public IP directly — it's ~10× cheaper than a NAT Gateway.

For **multiple VMs on a private subnet** where you don't want public IPs: NAT Gateway is the right tool and the cost is shared across all VMs.

---

## Quick verification after the fix

```bash
# From the VM — should return a 301 redirect from Google
curl -I https://google.com

# Check the public IP the VM is NAT'd behind
curl -s https://ifconfig.me
```
