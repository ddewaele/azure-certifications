# Deploy and Manage Azure Compute Resources (20-25%)

This is one of the **two largest domains** on the AZ-104 exam. It covers VMs, containers, App Service, and IaC templates.

---

## ARM Templates and Bicep

Infrastructure as Code (IaC) enables repeatable, consistent deployments.

### ARM Template Structure

```json
{
  "$schema": "...",
  "contentVersion": "1.0.0.0",
  "parameters": {},
  "variables": {},
  "functions": [],
  "resources": [],
  "outputs": {}
}
```

| Section | Description |
|---------|-------------|
| **parameters** | Runtime inputs; use `allowedValues`, `defaultValue`, `type` |
| **variables** | Reusable values calculated within the template |
| **resources** | The Azure resources to deploy |
| **outputs** | Values returned after deployment |
| **dependsOn** | Explicit dependency between resources |

### ARM vs Bicep

| Feature | ARM (JSON) | Bicep |
|---------|-----------|-------|
| Syntax | JSON (verbose) | DSL (concise) |
| Compilation | Native | Transpiles to ARM |
| Type safety | Limited | Strong |
| Modules | Linked templates | Bicep modules |
| Learning curve | Steeper | Easier |
| Tooling | Full support | Full support |

### Deploy Templates

```bash
# Deploy ARM template to resource group
az deployment group create \
  --resource-group myRG \
  --template-file main.bicep \
  --parameters @params.json

# Export existing resource as ARM template (portal or CLI)
az group export --name myRG > template.json
```

---

## Virtual Machines

### VM Creation Considerations

| Setting | Options / Notes |
|---------|----------------|
| **Region** | Choose based on proximity, compliance, service availability |
| **Availability option** | None, Availability Set, Availability Zone |
| **Image** | OS image (Windows Server, Ubuntu, RHEL, custom) |
| **Size** | vCPU, RAM, temp storage, data disks, NICs |
| **Authentication** | SSH key (Linux), password, or both |
| **OS disk type** | Standard HDD, Standard SSD, Premium SSD, Ultra Disk |
| **Data disks** | Managed disks attached for additional storage |
| **Networking** | VNet, subnet, public IP, NSG |
| **Boot diagnostics** | Serial console access; requires storage account |

### VM Size Families

| Family | Prefix | Description |
|--------|--------|-------------|
| **General purpose** | B, D, DC, A | Balanced CPU/memory; dev/test, small-medium databases |
| **Compute optimised** | F | High CPU-to-memory ratio; batch processing, gaming |
| **Memory optimised** | E, M, G | High memory-to-CPU ratio; SAP, SQL, in-memory DBs |
| **Storage optimised** | L | High disk throughput and IOPS; NoSQL databases |
| **GPU** | N (NC, ND, NV) | Rendering, machine learning, visualisation |
| **High performance compute** | H | MPI workloads, computational science |
| **Burstable** | B | Variable CPU; baseline + burst credits |

### VM Disk Types

| Disk Type | Max IOPS | Use Case |
|-----------|----------|---------|
| **Standard HDD** | 500 IOPS | Dev/test, backups |
| **Standard SSD** | 6,000 IOPS | Web servers, lightly loaded apps |
| **Premium SSD** | 20,000 IOPS | Production workloads, databases |
| **Premium SSD v2** | 80,000 IOPS | Performance-sensitive workloads |
| **Ultra Disk** | 160,000 IOPS | Mission-critical, high-throughput |

### Managed vs Unmanaged Disks

| Feature | Managed | Unmanaged |
|---------|---------|-----------|
| Storage account | Azure manages | Customer manages |
| Availability set alignment | Automatic | Manual |
| Snapshots/images | Simple | Complex |
| Recommended | Yes | No (legacy) |

### Availability Options

| Option | Protection From | SLA |
|--------|----------------|-----|
| **No redundancy** | Nothing | 99.9% (Premium SSD) |
| **Availability Set** | Rack/power/network failure (fault/update domains) | 99.95% |
| **Availability Zone** | Datacenter (zone) failure | 99.99% |
| **VMSS with zones** | Zone failure + scale | 99.99% |

**Availability Sets:**
- **Fault domains (FD)**: Separate physical rack, power, network (default 2, max 3)
- **Update domains (UD)**: Only one UD rebooted at a time during planned maintenance (default 5, max 20)

**Availability Zones:**
- Physically separate datacenters within a region
- Zone-redundant services span all AZs automatically
- VM pinned to a specific zone (Zone 1, 2, or 3)

### VM Scale Sets (VMSS)

| Feature | Description |
|---------|-------------|
| **Orchestration modes** | Uniform (identical VMs) or Flexible (mix of VM types) |
| **Autoscale** | Scale out/in based on metrics (CPU, schedule, custom) |
| **Instance count** | Min, max, default instance counts |
| **Update policy** | Automatic, rolling, manual |
| **Overprovisioning** | Provision extra VMs and delete excess (faster scaling) |

### VM Extensions

| Extension | Description |
|-----------|-------------|
| **Custom Script Extension** | Run scripts on Windows/Linux after deployment |
| **DSC Extension** | Apply PowerShell DSC configurations |
| **Azure Monitor Agent** | Collect logs and metrics for Azure Monitor |
| **Disk Encryption** | Azure Disk Encryption (ADE) using BitLocker/DM-Crypt |
| **Dependency Agent** | Network dependency mapping for VM Insights |

### Azure Bastion

| Feature | Description |
|---------|-------------|
| **Purpose** | Browser-based RDP/SSH without exposing public IP |
| **Deployment** | Subnet named `AzureBastionSubnet` (min /26) in the VNet |
| **SKUs** | Basic (no native client) and Standard (native client, tunneling) |
| **Benefits** | No public IP on VM, no NSG rules for RDP/SSH, session recorded |

### Move VM to Different Scope

| Destination | Notes |
|-------------|-------|
| **Resource group** | Same subscription; resources must pass move validation |
| **Subscription** | Both subscriptions must be in the same Entra tenant |
| **Region** | Use Azure Resource Mover; creates new resources in target region |

### Encryption at Host

- Encrypts the VM host (temp disk and cache) in addition to OS and data disks
- Must be enabled at the subscription level first: `az feature register --namespace Microsoft.Compute --name EncryptionAtHost`
- Different from Azure Disk Encryption (ADE) which encrypts at the OS level

---

## Containers in Azure

### Azure Container Registry (ACR)

| SKU | Use Case | Features |
|-----|---------|---------|
| **Basic** | Dev/test | Lower throughput, smaller storage |
| **Standard** | Production | Geo-replication not included |
| **Premium** | Enterprise | Geo-replication, private link, content trust |

Common operations:
```bash
az acr build --registry myACR --image myapp:v1 .
az acr login --name myACR
docker push myACR.azurecr.io/myapp:v1
```

### Azure Container Instances (ACI)

| Feature | Description |
|---------|-------------|
| **Serverless** | No cluster or node management |
| **Billing** | Per-second, per-resource (CPU+memory) |
| **Restart policies** | Always, OnFailure, Never |
| **Container groups** | Multiple containers on same host (share IP, storage) |
| **Limitations** | No autoscale, no load balancer, not for long-running production |

### Azure Container Apps (ACA)

| Feature | Description |
|---------|-------------|
| **Purpose** | Microservices, event-driven apps, background workers |
| **Scaling** | KEDA-based; scale to zero |
| **Dapr** | Built-in Dapr sidecar support |
| **Ingress** | External (public) or internal (VNet only) |
| **Revisions** | Immutable snapshots; traffic splitting between revisions |
| **Environment** | Shared network and log workspace for container apps |

### ACI vs ACA vs AKS

| Feature | ACI | ACA | AKS |
|---------|-----|-----|-----|
| Serverless | Yes | Yes | No (managed nodes) |
| Autoscale | No | Yes (KEDA) | Yes |
| Kubernetes API | No | No | Yes |
| Complexity | Low | Medium | High |
| Use case | Simple tasks, CI/CD | Microservices | Full Kubernetes workloads |

---

## Azure App Service

### App Service Plan Tiers

| Tier | Category | Features |
|------|----------|---------|
| **F1** | Free | Shared, 60 min/day compute, no custom domain |
| **D1** | Shared | Shared, custom domain, no SSL |
| **B1/B2/B3** | Basic | Dedicated, manual scale, up to 3 instances |
| **S1/S2/S3** | Standard | Autoscale, deployment slots (5), custom SSL |
| **P1v3/P2v3/P3v3** | Premium | More scale, more slots (20), VNet integration |
| **I1v2/I2v2** | Isolated | Dedicated env (ASE), max isolation, max scale |

### App Service Features

| Feature | Description |
|---------|-------------|
| **Deployment slots** | Staging environments; swap with zero downtime |
| **VNet integration** | Route outbound traffic through a VNet |
| **Private endpoint** | Inbound private access via Private Link |
| **Custom domain** | Map CNAME or A record to app URL |
| **Managed certificate** | Free SSL for custom domains (App Service managed) |
| **Backup** | App code + linked database; manual or scheduled |
| **WebJobs** | Background tasks (scripts/programs) within App Service |
| **Hybrid Connections** | Access on-premises resources from App Service |

### Scaling

| Type | Description |
|------|-------------|
| **Scale up (vertical)** | Change to larger App Service plan SKU |
| **Scale out (horizontal)** | Add more instances; manual or autoscale rules |
| **Autoscale** | Rules based on metrics (CPU, HTTP queue, schedule) |

### Deployment Slots

| Concept | Description |
|---------|-------------|
| **Slot** | A separate instance with its own URL (e.g., myapp-staging.azurewebsites.net) |
| **Swap** | Exchange configuration between slots (e.g., staging → production) |
| **Slot settings** | Settings marked as "sticky" do not swap |
| **Traffic splitting** | Route a % of traffic to a slot for A/B testing |

### App Service Configuration

| Setting | Description |
|---------|-------------|
| **App settings** | Environment variables; override Web.config/appsettings.json |
| **Connection strings** | Database connection strings; overrides local config |
| **Always On** | Keep app warm; prevents cold starts (requires Basic+) |
| **HTTP/2** | Enable HTTP/2 protocol |
| **TLS minimum version** | Enforce TLS 1.2 or 1.3 |

---

## Exam Tips

- **Availability Sets** protect from rack/power failure (fault domains) and planned maintenance (update domains); they do **not** protect from datacenter/zone failure.
- **Availability Zones** protect from datacenter failure; they provide a higher SLA (99.99%) than Availability Sets (99.95%).
- **VMSS** is required for autoscaling VMs — individual VMs cannot autoscale.
- **Azure Bastion** requires a subnet named exactly `AzureBastionSubnet` with a minimum /26 prefix.
- **Deployment slots** require Standard App Service plan or higher.
- **Swap** operations move the deployment but "sticky" settings stay with the slot.
- **ACI** is for simple, short-lived containers; **ACA** is for microservices with autoscale; **AKS** is for full Kubernetes.
- **Burstable (B-series) VMs** accumulate CPU credits during idle periods and spend them during bursts — cost-effective for variable workloads.
- **Premium SSD** is required for VMs in an Availability Set to achieve the 99.95% SLA.
- **Encryption at host** must be enabled at subscription level before it can be used on VMs — it is not on by default.

---

## References

- [Azure Virtual Machines documentation](https://learn.microsoft.com/en-us/azure/virtual-machines/)
- [VM sizes](https://learn.microsoft.com/en-us/azure/virtual-machines/sizes)
- [Availability sets and zones](https://learn.microsoft.com/en-us/azure/virtual-machines/availability)
- [VM Scale Sets](https://learn.microsoft.com/en-us/azure/virtual-machine-scale-sets/)
- [Azure Container Instances](https://learn.microsoft.com/en-us/azure/container-instances/)
- [Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/)
- [Azure App Service documentation](https://learn.microsoft.com/en-us/azure/app-service/)
- [ARM templates](https://learn.microsoft.com/en-us/azure/azure-resource-manager/templates/)
- [Bicep documentation](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/)
- [Azure Bastion](https://learn.microsoft.com/en-us/azure/bastion/)
