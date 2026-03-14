# Azure Compute

Azure offers multiple compute models suited to different workloads. Choosing the right one is a core AZ-900 concept.

---

## Compute Models Overview

| Service | Model | You manage | Best for |
|---|---|---|---|
| Virtual Machines | IaaS | OS, runtime, app | Full control, legacy apps |
| VM Scale Sets | IaaS | OS, runtime, app | Autoscaling identical VMs |
| App Service | PaaS | App code only | Web apps, APIs, mobile backends |
| Azure Functions | Serverless/PaaS | Function code only | Event-driven, short-lived tasks |
| Container Instances | PaaS | Container image | Simple containerized workloads |
| AKS | PaaS (managed K8s) | App, K8s config | Complex container orchestration |
| Azure Virtual Desktop | SaaS/PaaS | Users, apps | Remote desktop / VDI |

---

## Virtual Machines (VMs)

Azure VMs are IaaS — you get virtualized hardware and install/manage everything on top.

### VM Sizes
Sizes are grouped into families:

| Family | Use case | Example SKUs |
|---|---|---|
| B (Burstable) | Dev/test, low sustained CPU | B1s, B2s |
| D (General purpose) | Balanced CPU/memory | D2s_v5, D4s_v5 |
| E (Memory optimized) | In-memory databases | E8s_v5 |
| F (Compute optimized) | High CPU-to-memory | F8s_v2 |
| L (Storage optimized) | High disk I/O | L8s_v3 |
| N (GPU) | ML, rendering | NC6s_v3 |

### VM Disks
- **OS disk** — contains the OS, persists after VM stop
- **Temporary disk** — local SSD, fast but non-persistent (lost on reallocation)
- **Data disks** — additional persistent managed disks you attach

### VM States and Billing

| State | CPU billed? | Description |
|---|---|---|
| Running | Yes | VM is on |
| Stopped (OS shutdown) | **Yes** | OS is off but Azure still allocates hardware |
| Stopped (deallocated) | **No** | Hardware released, no compute charge |
| Deleted | No | VM and resources removed |

**Key point:** `az vm stop` stops the OS but keeps the hardware allocated — you're still charged. Use `az vm deallocate` to stop billing for compute.

### Availability Options
- **No redundancy** — single VM, lowest SLA (99.9% with Premium SSD)
- **Availability Sets** — spread VMs across fault domains (different racks) and update domains. SLA 99.95%
- **Availability Zones** — spread VMs across physically separate datacenters. SLA 99.99%


### Availability Sets

- A logical grouping of VMs to ensure they are distributed across fault and update domains
- Fault domain: group of VMs that share a common power source and network switch (like a rack)
- Update domain: group of VMs that are updated together during planned maintenance
- At least 2 VMs required for availability set


---

## VM Scale Sets (VMSS)

Scale sets let you deploy and manage a group of identical, load-balanced VMs that can scale automatically.

- All VMs in a scale set use the same base image and configuration
- Horizontal scaling: add or remove VM instances
- Integrates with Azure Load Balancer and Application Gateway
- Supports autoscale rules based on CPU, memory, or custom metrics
- Two modes: **Uniform** (identical instances) and **Flexible** (mix of VM configs)

```bash
# Create a scale set
az vmss create \
  --resource-group my-rg \
  --name my-vmss \
  --image Ubuntu2204 \
  --upgrade-policy-mode automatic \
  --instance-count 2 \
  --vm-sku Standard_B1s

# Scale manually
az vmss scale --name my-vmss --resource-group my-rg --new-capacity 4
```

---

## Azure App Service

App Service is a fully managed PaaS platform for hosting web applications, REST APIs, and mobile backends.

- Supports: .NET, Java, Node.js, Python, PHP, Ruby, custom containers
- Built-in features: auto-scaling, custom domains, TLS/SSL, CI/CD integration, authentication
- No OS management — Microsoft handles patching and platform maintenance
- Runs on App Service Plans (defines region, VM size, and pricing tier)

### App Service Plans

| Tier | Use case |
|---|---|
| Free / Shared | Dev/test only, shared infrastructure |
| Basic | Dev/test with manual scale |
| Standard | Production workloads, autoscale, staging slots |
| Premium | Enhanced performance, VNet integration |
| Isolated | Fully dedicated, VNet-isolated environment |

Multiple apps can share a single App Service Plan.

```bash
# Create an App Service Plan
az appservice plan create \
  --name my-plan \
  --resource-group my-rg \
  --sku FREE

# Create a web app
az webapp create \
  --name my-unique-app-name \
  --resource-group my-rg \
  --plan my-plan \
  --runtime "NODE:20-lts"
```

---

## Azure Functions

Functions is an event-driven serverless compute platform. You write code that responds to triggers, and Azure handles everything else.

- **Serverless**: no infrastructure provisioning or management
- **Triggers**: HTTP, timer, queue message, blob upload, Event Hub, Cosmos DB change feed, and more
- **Bindings**: declarative input/output connections to other services (no SDK boilerplate)
- **Pricing (Consumption plan)**: pay per execution and execution duration — first 1M executions/month free

### Hosting Plans
| Plan | Cold start | Max duration | Best for |
|---|---|---|---|
| Consumption | Yes | 10 min | Infrequent, bursty workloads |
| Premium | No | Unlimited | Production, needs VNet |
| Dedicated (App Service) | No | Unlimited | Predictable load, existing plan |

```bash
# Create a storage account (required by Functions)
az storage account create \
  --name mystorageacct123 \
  --resource-group my-rg \
  --sku Standard_LRS

# Create a function app
az functionapp create \
  --name my-func-app \
  --resource-group my-rg \
  --storage-account mystorageacct123 \
  --consumption-plan-location westeurope \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4
```

---

## Azure Container Instances (ACI)

ACI lets you run containers directly in Azure without managing any VMs or orchestrators. It's the fastest way to get a container running.

- No cluster to manage
- Per-second billing
- Supports Linux and Windows containers
- Can use public registry images or Azure Container Registry
- Supports persistent storage via Azure File shares

```bash
az container create \
  --resource-group my-rg \
  --name my-container \
  --image nginx \
  --ports 80 \
  --dns-name-label my-unique-label \
  --os-type Linux
```

**Compared to VMs:** faster startup, no OS management, but less control and not suited for long-running stateful workloads.

---

## Azure Kubernetes Service (AKS)

AKS is a managed Kubernetes service. Azure manages the control plane (scheduler, API server, etcd) — you manage the worker nodes and deployments.

- Reduces the operational overhead of running Kubernetes
- Integrates with Azure AD, Azure Monitor, Container Registry, and networking
- Supports autoscaling (cluster autoscaler + horizontal pod autoscaler)
- More complex than ACI — better for large-scale, multi-container applications

AZ-900 only expects you to know AKS at a conceptual level — you won't be asked to configure it.

---

## Azure Virtual Desktop (AVD)

AVD is a desktop and application virtualization service hosted in Azure. It delivers a Windows desktop experience to any device.

- Full Windows 11 / Windows 10 experience in the browser or remote desktop client
- Supports multi-session Windows (multiple users on one VM)
- Useful for remote workers, BYOD scenarios, regulated industries
- You manage the session hosts (VMs) and user access; Microsoft manages the service infrastructure

---

## Choosing the Right Compute Service

```
Do you need OS-level access?
  Yes → Virtual Machine
  No ↓

Is it containerized?
  Yes → Do you need orchestration?
    Yes → AKS
    No  → ACI
  No ↓

Is it event-driven / short-lived?
  Yes → Azure Functions
  No  → App Service
```
