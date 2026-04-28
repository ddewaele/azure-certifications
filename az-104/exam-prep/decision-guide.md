# Decision Guide — Scenario → Answer Patterns

About 60% of AZ-104 questions follow templates. If you can recognise the template, the answer is usually one of 2–3 candidates. Use this as a last-mile lookup.

---

## "Connect to a VM that has no public IP"

| Constraint | Answer |
|------------|--------|
| Default | **Azure Bastion** |
| From a single admin machine | Bastion or **point-to-site VPN** |
| Site-to-site already exists | RDP/SSH over the **VPN** |
| Quick CLI access from local | **Bastion native client** (Standard SKU + tunneling) |
| One-off troubleshooting only | Add temporary public IP + NSG rule (NOT exam-preferred) |

---

## "Securely access an Azure PaaS service from a VNet"

| Constraint | Answer |
|------------|--------|
| Lock service to your VNet, but it's still publicly addressable | **Service endpoint** |
| Disable public access entirely / on-prem reachability | **Private endpoint** |
| Enterprise hub-spoke + on-prem | Private endpoint + **Private DNS zone** linked to hub |

---

## "Cross-region migration"

| Need | Use |
|------|-----|
| One-time move of resources | **Azure Resource Mover** |
| Ongoing replication for DR | **Azure Site Recovery (ASR)** |
| Same region, different RG/subscription | **Move resources** (logical only) |

> Redeploy is **not** cross-region — same region, new host.

---

## "Authenticate to Azure resource without storing credentials"

| Caller | Answer |
|--------|--------|
| Azure VM | **System-assigned managed identity** |
| Azure VM with shared identity across many VMs | **User-assigned managed identity** |
| App Service / Functions / Logic Apps | Same — managed identity |
| External / multi-cloud | **Workload identity federation** (no secret) |
| On-prem service | **Service principal with certificate** |

---

## "Hybrid identity"

| Need | Answer |
|------|--------|
| Default cloud auth, simplest | **Password Hash Sync (PHS)** |
| Auth against on-prem AD in real time | **Pass-through Authentication (PTA)** |
| Existing AD FS / complex SSO | **Federation** |
| Enable SSPR with on-prem writeback | **Entra Connect** + P1 |

---

## "Backup something"

| Workload | Vault / tool |
|----------|--------------|
| Azure VM | **Recovery Services Vault** |
| Azure Files | **Recovery Services Vault** |
| Azure Blob | **Backup Vault** |
| Managed Disk | **Backup Vault** |
| PostgreSQL | **Backup Vault** |
| App Service | **Built-in App Service backup** (linked storage account) |
| On-prem servers | RSV + **MARS** agent or **Azure Backup Server (DPM)** |
| Container Instances | **Not supported** — design data in external storage |

> Vault region must match workload region (CRR is opt-in only).

---

## "DR / failover across regions"

| Need | Answer |
|------|--------|
| VM-level DR | **Azure Site Recovery** |
| Web app DR | Front Door / Traffic Manager + multi-region App Service |
| Database DR | Service-specific (SQL geo-replication, Cosmos DB multi-region writes) |
| Storage failover | Customer-managed account failover (RA-GRS / RA-GZRS) |

---

## "Choose the right load balancer"

| Question | Answer |
|----------|--------|
| Layer 4, TCP/UDP, regional | **Azure Load Balancer (Standard)** |
| Layer 7, HTTP, URL routing, WAF, regional | **Application Gateway (WAF_v2)** |
| Global HTTP/S, accelerated, anycast | **Front Door** |
| Global DNS-based, region failover | **Traffic Manager** |
| Layer 7 SaaS, per-customer routing | Front Door + WAF |
| On-prem traffic over VPN to Azure backends | **Internal Load Balancer** |

---

## "Network problem diagnosis"

| Symptom | Tool |
|---------|------|
| "Is this NSG blocking?" | **IP Flow Verify** |
| "Where does my traffic go?" | **Next Hop** |
| "Show all denied packets" | **NSG Flow Logs** |
| "Heatmap / overview of flows" | **Traffic Analytics** |
| "Continuous monitoring" | **Connection Monitor** |
| "Capture full packet payload" | **Packet Capture** |
| "All NSG rules effective on a NIC" | **Effective Security Rules** |
| "Why can't VM reach the internet?" | Next Hop + IP Flow Verify outbound + check default route table |

---

## "Storage redundancy"

| Need | Answer |
|------|--------|
| Cheapest, single DC | **LRS** |
| Zone-redundant in one region | **ZRS** |
| Geo-redundant DR (no read on secondary) | **GRS** |
| Geo-redundant + read access to secondary | **RA-GRS** |
| Zone + geo-redundant | **GZRS** |
| GZRS + read | **RA-GZRS** |

---

## "Restrict storage account access"

| Constraint | Answer |
|------------|--------|
| Only specific IPs | Network rules with IP allowlist |
| Only specific VNets | **Service endpoint** + VNet rule |
| No public network at all | **Private endpoint** |
| Time-limited delegate access | **SAS** (prefer **User Delegation SAS**) |
| Revocable delegate access | Service SAS + **Stored Access Policy** |
| Per-blob-container permissions | **Entra ID RBAC** + Storage Blob Data roles |

---

## "Encrypt a VM disk"

| Need | Answer |
|------|--------|
| Default at-rest encryption | **SSE** (already on, platform keys) |
| Bring your own keys | **SSE with CMK** (Key Vault) |
| Encrypt OS + data disks within the OS | **Azure Disk Encryption (ADE)** |
| Also encrypt host caching + temp disk | **Encryption at host** |
| Memory + state encryption | **Confidential VM** |

---

## "Scale a workload"

| Workload | Scale answer |
|----------|--------------|
| Stateless VM tier | **VM Scale Set with autoscale** |
| Need more CPU/RAM per instance | **Scale up** (resize VM) |
| Need more instances | **Scale out** (VMSS / App Service plan) |
| Web app | **App Service autoscale** rules |
| AKS pods | **Horizontal Pod Autoscaler (HPA)** |
| AKS nodes | **Cluster autoscaler** |
| Containers without managing infra | **Container Apps** with KEDA scale rules (scale to zero) |

---

## "Ensure HA"

| Tier | Solution |
|------|----------|
| Single-region | **Availability Zones** (3 zones, 99.99% SLA) |
| Within a single DC | **Availability Set** (2 FDs, 5 UDs, 99.95%) |
| Multi-region active-passive | **ASR** + **Traffic Manager / Front Door** |
| Multi-region active-active | App-level (multi-region App Service) + **Front Door** |
| Database | Service-specific HA features (SQL AGs, Cosmos multi-region) |

---

## "Apply governance"

| Goal | Answer |
|------|--------|
| Enforce naming convention | **Azure Policy** with `Modify` or `Deny` |
| Auto-tag new resources | **Azure Policy** `Modify` effect |
| Inherit tags from RG to resources | **Azure Policy** `inherit a tag from the resource group` |
| Restrict regions | **Azure Policy** with allowed locations |
| Limit SKUs | **Azure Policy** with allowed SKUs |
| Prevent accidental deletion | **CanNotDelete lock** on resource/RG |
| Prevent any change | **ReadOnly lock** |
| Initiative for many policies | **Azure Policy Initiative** |
| Audit but not block | **Audit** effect |
| Block new violations | **Deny** effect |

---

## "Move resources"

| Move | Tool |
|------|------|
| Different resource group | **az resource move** (some types unsupported) |
| Different subscription | Same — `az resource move` |
| Different region | **Azure Resource Mover** |
| Multi-region DR replication | **Azure Site Recovery** |
| Storage data | **AzCopy / Storage Mover / Data Box** |

---

## "Choose a data transfer tool"

| Volume | Tool |
|--------|------|
| < few GB | **AzCopy** or portal upload |
| 10s of GB | **AzCopy** with `--recursive` / `sync` |
| Hundreds of GB / Many TB online | **Azure File Sync / Data Migration / AzCopy** with sufficient bandwidth |
| Multi-TB offline / poor connectivity | **Data Box family** (Disk → 8 TB; Box → 80 TB; Heavy → 800 TB) |
| Server-to-Azure file migration | **Storage Mover** |

---

## "Identity & RBAC scope"

| Need | Scope |
|------|-------|
| Apply role to all subs | Management group |
| Apply to one app | Resource group containing the app |
| Apply to one VM only | The VM resource |
| Read-only auditor | **Reader** at subscription |
| App owner | **Owner** at resource group |

---

## "Diagnose blocked ports / connectivity"

```
Step 1: az network nic show-effective-route-table   →  routing
Step 2: az network nic list-effective-nsg            →  NSG rules
Step 3: az network watcher test-ip-flow              →  yes/no allowed
Step 4: az network watcher show-next-hop             →  routing destination
Step 5: az network watcher packet-capture            →  raw bytes if needed
```

---

## "Microsoft 365 / hybrid identity sync"

| Need | Tool |
|------|------|
| Sync on-prem AD users to Entra ID | **Entra Connect** (or Cloud Sync) |
| Multi-forest / lighter sync | **Entra Cloud Sync** |
| Sync passwords | Choose **PHS** (default) |
| Auth against on-prem AD in real time | **PTA** |
| Customer-owned federation infrastructure | **AD FS** federation |

---

## "VM image / generalize / capture"

```
1. Run sysprep (Windows) / waagent -deprovision (Linux)
2. Stop VM (deallocate)
3. Generalize the VM
4. Capture as a managed image OR use Compute Gallery (recommended)
5. Deploy new VMs from image / gallery
```

---

## "Resource locks"

| Goal | Lock |
|------|------|
| Prevent deletion only | **CanNotDelete** |
| Prevent any modification | **ReadOnly** |
| Test environment cleanup safe | No lock; let auto-cleanup run |
| Production critical resource | **CanNotDelete** at the RG |

> Locks override RBAC for the locked actions — even Owner cannot delete a CanNotDelete-locked resource without removing the lock first.
