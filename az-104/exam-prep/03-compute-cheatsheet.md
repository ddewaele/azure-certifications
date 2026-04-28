# Domain 3 — Compute Cheatsheet (20–25%)

## VM sizes (families)

| Family | Letter | Use |
|--------|--------|-----|
| General purpose | A, B, D, DC | Web servers, small DBs, dev/test |
| Compute optimized | F | High CPU:RAM ratio, batch processing |
| Memory optimized | E, M | In-memory DBs, large caches |
| Storage optimized | L | NoSQL, big data, transactional DBs |
| GPU | N (NC, ND, NV) | ML training, rendering, visualisation |
| HPC | H | High-performance computing |
| Burstable | **B** | Low-baseline workloads with bursts (cheap) |

### Burstable B-series — read carefully

- Earns **CPU credits** when idle, spends them when bursting
- Out of credits → throttled to base CPU %
- B1ls, B1s, B2s, B2ts_v2 — common cheap lab choices
- B1ls is **Linux-only** and **not available in all regions** (incl. West Europe sometimes)

---

## Disks

### Disk types

| Type | Performance | Use |
|------|-------------|-----|
| **Standard HDD** | Cheapest, slow | Dev/test, infrequent access |
| **Standard SSD** | Better latency | Web servers, light prod |
| **Premium SSD** | Low latency, high IOPS | Production VMs |
| **Premium SSD v2** | Same as Premium + decoupled IOPS/throughput | Large production workloads |
| **Ultra Disk** | Sub-ms latency, configurable IOPS/throughput | SAP HANA, top-tier DBs |

### Disk roles per VM

| Disk | Purpose | Persistent |
|------|---------|-----------|
| **OS disk** | OS image, /, C:\ | Yes |
| **Temporary disk** | Pagefile, scratch | **NO** — wiped on resize/redeploy |
| **Data disk** | Application data | Yes |

> **TRAP:** Never store data on the temporary disk. It's wiped on stop/dealloc/redeploy.

### Disk encryption

| Method | Keys | Encrypts |
|--------|------|----------|
| **SSE (Storage Service Encryption)** | Platform-managed keys (default) | At-rest data on managed disks |
| **SSE with CMK** | Customer-managed keys (Key Vault) | Same; you control key rotation/revocation |
| **Azure Disk Encryption (ADE)** | BitLocker (Windows) / dm-crypt (Linux) | Encrypts within the OS |
| **Encryption at host** | Platform-managed | Encrypts host caching + temp disk |
| **Confidential VMs** | Hardware-based | Memory + state |

> Pick **SSE with CMK** for "control over keys"; **ADE** for "encrypt OS+data disks"; **encryption at host** for "encrypt temp disk".

---

## Availability options

### Availability Set vs Availability Zones

| Feature | Availability Set | Availability Zone |
|---------|------------------|-------------------|
| Scope | Single datacenter | Multiple datacenters in a region |
| Components | Fault Domains (FD) + Update Domains (UD) | Physically separate buildings |
| SLA (≥2 instances) | **99.95%** | **99.99%** |
| Use when | Within-rack/rackrow protection | Region-level zone failure protection |

> **TRAP:** SLA requires multiple instances **and** the matching SKU (Premium SSD, Standard public IP). A single VM has 99.9% SLA only with Premium disks.

### Update / Fault Domains (Availability Set)

- **5 update domains** by default (max 20)
- **2 or 3 fault domains** depending on region
- Default: 2 FDs, 5 UDs

### VM Scale Sets (VMSS)

| Mode | Detail |
|------|--------|
| **Uniform orchestration** | All VMs identical; up to 1000 instances; legacy mode |
| **Flexible orchestration** | Mix of VM sizes; up to 1000 across zones; default for new VMSS |

#### Scaling

| Type | Detail |
|------|--------|
| **Manual** | Set instance count |
| **Schedule-based** | Cron-style scale to N instances |
| **Metric-based** | Auto-scale on CPU%, memory, custom metrics |

#### Auto-scale rules — read carefully

- **Threshold + duration** — must exceed threshold for the **full duration** before scaling
- **Cool-down** — wait time before next scale event
- **Scale-in respects min instance count** — even if math says go lower
- Scale-out uses `>` and scale-in uses `<`

```text
Rule: Scale OUT if CPU > 75% for 10 min — duration must elapse before action
Rule: Scale IN if CPU < 25% for 10 min — same; respect min count
```

---

## VM lifecycle states

| State | Billing | Notes |
|-------|---------|-------|
| **Running** | Compute + storage | |
| **Stopped (from OS)** | Compute + storage | Billed even when stopped from inside |
| **Stopped (deallocated)** | Storage only | Stopped via Azure portal/CLI; releases compute |
| **Generalized** | After Sysprep / waagent -deprovision | Required before capturing as image |

> **TRAP:** Stopping a VM from inside the OS does NOT stop billing. **Deallocate** via Azure to stop compute charges.

---

## Redeploy vs Move

| Action | Region | Host | Use when |
|--------|--------|------|----------|
| **Redeploy** | Same | New host | VM is unresponsive / hardware suspected |
| **Reapply** | Same | Same | Refresh VM config after a manual edit |
| **Move resource** | Same or different | Same | Reorganize resource groups/subscriptions |
| **Resource Mover** | **Different** region | New | Cross-region migration |
| **Site Recovery (ASR)** | **Different** region | New | DR with replication |

> **TRAP:** "Redeploy moves a VM to another region" — **FALSE**. Redeploy = new host, same region only.

---

## Azure Backup for VMs

### What backs up what

| Vault | Workload |
|-------|---------|
| **Recovery Services Vault (RSV)** | Azure VM, SQL in VM, SAP HANA, Azure Files, on-prem (MARS/DPM) |
| **Backup Vault** | Blob, managed disk, PostgreSQL, Kubernetes |

> **TRAP:** App Service uses its own built-in backup, not RSV/Backup Vault.

### RSV constraints

- Vault region = workload region (cannot back up across regions by default)
- **Cross-Region Restore (CRR)** is **opt-in** + GRS-only — gives a paired-region restore option
- A vault can hold many policies; instance can have only one
- **Soft-delete** retains backups 14 days after deletion (default 14, configurable up to 180)

### Backup policy basics

| Component | Detail |
|-----------|--------|
| Schedule | Daily/weekly + time |
| Retention | Daily, weekly, monthly, yearly |
| Instant Restore | Snapshot kept for 1–5 days for fast restore |
| Vault tier | Long-term, slower |

### Restore options

| Option | Effect |
|--------|--------|
| **Create new VM** | Restores full VM as a new resource |
| **Restore disks** | Mount disks separately |
| **Replace existing** | Overwrite the VM's disks |
| **File recovery** | Mount recovery point as a drive; copy individual files |

---

## Azure Site Recovery (ASR)

| Concept | Detail |
|---------|--------|
| Source / target region | Where the VM lives → where it fails over |
| RPO | How recent the recovery point is (typically seconds → minutes) |
| RTO | How long failover takes |
| Recovery plan | Ordered failover sequence + scripts |

### Failover types

| Type | Effect |
|------|--------|
| **Test failover** | Non-disruptive; isolated test VM in test VNet |
| **Planned failover** | Graceful (source shut down first); zero data loss |
| **Unplanned failover** | Emergency; possible data loss |
| **Failback** | Return to original region |

> **TRAP:** Test failover does **NOT** affect production. Run before a real DR event.

---

## Containers

### Compare AKS vs ACI vs Container Apps vs App Service Containers

| Service | Use |
|---------|-----|
| **Azure Kubernetes Service (AKS)** | Full Kubernetes, complex orchestration |
| **Azure Container Instances (ACI)** | Single-container, no orchestration, fast spin-up |
| **Azure Container Apps** | Serverless containers w/ scale-to-zero, KEDA-based |
| **App Service for Containers** | Single web container with App Service features (slots, custom domains) |
| **Container Registry (ACR)** | Private Docker registry; geo-replication; Tasks |

### AKS basics

| Concept | Detail |
|---------|--------|
| **Node pools** | Set of VMs of same size; system pool + user pools |
| **Cluster autoscaler** | Adjusts node count |
| **HPA** | Adjusts pod count |
| **Network plugins** | Kubenet (simpler), Azure CNI (advanced; pods get VNet IPs) |
| **Identity** | Managed identity preferred over service principal |

### ACR SKUs

| SKU | Features |
|-----|----------|
| **Basic** | Same APIs as Standard, smaller storage/throughput |
| **Standard** | Default for most |
| **Premium** | Geo-replication, content trust, private endpoints |

---

## App Service

### Plan tiers

| Tier | Use |
|------|-----|
| **Free / Shared** | Tiny test apps |
| **Basic** | Dev/test, no autoscale |
| **Standard** | Prod, autoscale, slots |
| **Premium v2/v3** | Enhanced perf, more slots, VNet integration |
| **Isolated (ASE)** | Single-tenant, in your VNet, full isolation |

### Deployment slots

- Available on Standard and above
- Standard: **5** slots; Premium: **20**; Isolated: **20**
- Swap = blue/green deployment with warm-up
- Slot-specific settings (config + connection strings) stay with the slot

### Scaling

| Type | Detail |
|------|--------|
| Scale **up** | Bigger plan SKU (more cores/RAM) |
| Scale **out** | More instances (autoscale rules supported on Standard+) |

### App Service backups

App Service has its own backup feature (not RSV). Includes app files + database (linked storage account required).

---

## Quick CLI patterns

```bash
# Create a VM with managed identity, no public IP, password disabled
az vm create \
  --name vm1 --resource-group RG \
  --image Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest \
  --size Standard_B2ts_v2 \
  --vnet-name vnet1 --subnet subnet1 \
  --public-ip-address "" --nsg "" \
  --admin-username azureuser --generate-ssh-keys \
  --assign-identity '[system]'

# Resize VM
az vm resize --name vm1 --resource-group RG --size Standard_D2s_v3

# Stop and deallocate (stops billing)
az vm deallocate --name vm1 --resource-group RG

# Redeploy (same region, new host)
az vm redeploy --name vm1 --resource-group RG

# Create a VMSS with autoscale
az vmss create --name vmss1 --resource-group RG --image Ubuntu2204 --instance-count 2

# Attach a data disk
az vm disk attach --vm-name vm1 --resource-group RG --name disk1 --new --size-gb 100
```
