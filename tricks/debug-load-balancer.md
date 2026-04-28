# Debugging: Load Balancer Not Reachable

Health probes are green but the load balancer's public IP doesn't respond on the expected port. This is almost always an NSG issue on the backend VMs — but the full checklist covers everything else too.

---

## Variables

```bash
RG=rg-lb-lab
LB=lb-frontend
BACKEND_POOL=backend-pool
PROBE=health-probe
VM=vm-backend-1          # one of the backend VMs
NSG=vm-backend-nsg
VNET=vnet-lab
SUBNET=subnet-backend
LB_PUBLIC_IP=20.54.138.175
```

---

## Why health probes pass but traffic doesn't reach you

Azure's Standard Load Balancer is **not a reverse proxy** — it is a Layer 4 pass-through device. It only rewrites the **destination** of packets (frontend IP → backend VM private IP). It does **not** rewrite the source IP.

When a client at `5.6.7.8` connects to the LB:

```
Client (5.6.7.8:12345)
  → LB applies DNAT: dst 20.54.138.175:80 → 10.1.0.4:80
  → Backend VM receives packet with src = 5.6.7.8  ← original client IP, unchanged
  → Backend VM responds directly to 5.6.7.8 (Direct Server Return)
```

The backend VM sees the **original client IP**, not the LB's IP. The LB is invisible at the source level.

This means health probes and client traffic arrive from entirely different sources:

| Traffic type | Source IP | Matches service tag |
|---|---|---|
| Health probe | `168.63.129.16` | `AzureLoadBalancer` |
| Client traffic | Real client IP (e.g. `5.6.7.8`) | `Internet` |

An NSG rule allowing only `AzureLoadBalancer → port 80` is sufficient for probes to pass — but actual client traffic arrives from `Internet` and hits an implicit deny. The portal shows the backend as healthy while real traffic is silently dropped. This is by design with the Standard SKU: all inbound is denied unless explicitly allowed.

---

## Step 1: Inspect the full LB configuration

Verify that every piece of the chain is wired up correctly.

```bash
# Frontend IP — is the public IP attached?
az network lb frontend-ip list -g $RG --lb-name $LB -o table

# Load balancing rules — port, protocol, backend pool, probe
az network lb rule list -g $RG --lb-name $LB -o table

# Backend pool — are VMs/NICs actually in it?
az network lb address-pool show -g $RG --lb-name $LB -n $BACKEND_POOL \
  --query "backendIPConfigurations[].id" -o tsv

# Health probe — port and protocol
az network lb probe list -g $RG --lb-name $LB -o table
```

Things to check:
- Frontend IP config references the public IP (`20.54.138.175`)
- LB rule references the correct frontend IP config, backend pool, and health probe
- Backend pool is not empty
- Probe port matches what the VM is actually listening on

---

## Step 2: Check the NSG on the backend VMs

This is the #1 cause of "probes healthy, traffic blocked" with Standard LB.

```bash
# Get the NIC of a backend VM
NIC_ID=$(az vm show -g $RG -n $VM --query "networkProfile.networkInterfaces[0].id" -o tsv)

# Effective NSG rules — what's actually being applied (subnet + NIC combined)
az network nic list-effective-nsg --ids $NIC_ID -o table
```

Look for a rule that **allows TCP port 80 inbound from `*` or `Internet`**. If the only allow rule for port 80 uses `AzureLoadBalancer` as the source, client traffic will be blocked.

Add the missing rule if needed:

```bash
az network nsg rule create \
  --resource-group $RG \
  --nsg-name $NSG \
  --name Allow-HTTP-Inbound \
  --priority 300 \
  --direction Inbound \
  --access Allow \
  --protocol Tcp \
  --source-address-prefixes '*' \
  --destination-port-ranges 80
```

> If you want to restrict to load balancer traffic only (no direct VM access), use `AzureLoadBalancer` as the source prefix — but also make sure no higher-priority Deny rule blocks `Internet` before the probe rule matches.

---

## Step 3: Verify the app is listening on the backend VM

Health probe passing means the VM responded on the probe port — but the app might be bound to `127.0.0.1` only (not `0.0.0.0`), or listening on a different port than what the LB rule expects.

SSH into a backend VM and check:

```bash
# What is actually listening on port 80?
ss -tlnp | grep ':80'
# or
sudo netstat -tlnp | grep ':80'

# Expected output — bound to 0.0.0.0 or :::
# tcp  LISTEN  0.0.0.0:80   *     users:(("python3",pid=...))

# Quick local test — does the app respond?
curl -s http://localhost:80
```

If the process is bound to `127.0.0.1:80` instead of `0.0.0.0:80`, traffic from the LB will be refused. Fix the app's bind address.

---

## Step 4: Test direct connectivity to a backend VM (bypassing the LB)

If the VM has a public IP or you can reach it via Bastion, test it directly to isolate whether the issue is the LB or the VM:

```bash
# Get the private IP of the backend VM
PRIVATE_IP=$(az vm show -g $RG -n $VM -d --query "privateIps" -o tsv)

# From another VM in the same VNet
curl http://$PRIVATE_IP:80

# From your machine if the VM has a public IP
VM_PUBLIC_IP=$(az vm show -g $RG -n $VM -d --query "publicIps" -o tsv)
curl http://$VM_PUBLIC_IP:80
```

- If direct access works but LB doesn't → LB misconfiguration or NSG difference
- If direct access also fails → the app or VM-level NSG is the problem

---

## Step 5: Use IP Flow Verify on a backend VM

IP Flow Verify tests whether the NSG would allow or deny a specific flow.

```bash
YOUR_IP=$(curl -s https://ifconfig.me)

az network watcher test-ip-flow \
  --vm $VM \
  --direction Inbound \
  --protocol TCP \
  --local-port 80 \
  --remote-address $YOUR_IP \
  --remote-port '*' \
  --resource-group $RG
```

Returns `Allow` or `Deny` and names the specific NSG rule responsible.

---

## Step 6: Check backend pool member health in detail

The portal shows a green/red indicator, but the CLI gives you the actual probe status per member:

```bash
az network lb show \
  -g $RG \
  -n $LB \
  --query "backendAddressPools[].backendIPConfigurations[].{id:id}" \
  -o table
```

For more detail on health state per backend, use the REST API or the portal's **Backend health** blade under the LB → **Monitoring**.

---

## Common root causes summary

| Symptom | Most likely cause |
|---|---|
| Probes healthy, port 80 times out | NSG blocks `Internet → port 80` on backend VMs |
| Probes unhealthy | App not listening, wrong probe port, or NSG blocks `AzureLoadBalancer` |
| Backend pool empty | VM NIC not added to pool, or NIC in wrong VNet |
| Some backends respond, some don't | NSG differs between VMs, or app not running on all VMs |
| Intermittent failures | Health probe interval too short, or app crashes and restarts |
| 0 bytes response, no error | Floating IP enabled but VM not configured to handle the frontend IP |

---

## Floating IP / Direct Server Return note

If **Floating IP** is enabled on the LB rule, the VM receives packets destined for the **frontend IP** (not its own private IP). The VM must have a loopback or secondary IP configuration matching the frontend IP, otherwise it will silently drop the packets even though the NIC receives them. Disable floating IP unless you specifically need it (e.g., SQL Always On, certain NVA configs).

```bash
# Check if floating IP is enabled on the rule
az network lb rule list -g $RG --lb-name $LB --query "[].{name:name,floatingIP:enableFloatingIP}" -o table
```
