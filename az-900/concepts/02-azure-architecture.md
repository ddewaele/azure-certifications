# Azure Architecture

Understanding how Azure is physically and logically organized is fundamental for everything else.

---

## Physical Infrastructure

### Datacenters
Azure runs on thousands of physical datacenters around the world — each with its own power, cooling, and networking. You don't interact with datacenters directly; they're abstracted into regions and availability zones.

### Regions
A region is a geographic area containing one or more datacenters that are close together and connected via a low-latency network.

- Examples: `West Europe` (Netherlands), `East US`, `Southeast Asia`
- When you deploy a resource, you choose a region
- Not all services are available in all regions
- Data residency and compliance requirements often dictate which region to use

List available regions:
```bash
az account list-locations --output table
```

### Region Pairs
Most Azure regions are paired with another region at least 300 miles away in the same geography. Region pairs are used for:
- Geo-redundant storage replication
- Planned maintenance is staggered (one in the pair at a time)
- Recovery priority during outages

Example pairs: `East US` ↔ `West US`, `West Europe` ↔ `North Europe`

### Sovereign Regions
Isolated instances of Azure for specific compliance requirements:
- **Azure Government** — US government agencies
- **Azure China** — operated by 21Vianet, separate from global Azure

---

## Availability Zones

Availability zones are physically separate datacenters within a single region, each with independent power, cooling, and networking.

```
Region: West Europe
├── Zone 1 (Datacenter A)
├── Zone 2 (Datacenter B)
└── Zone 3 (Datacenter C)
```

- Not all regions support availability zones
- Deploying across zones protects against datacenter-level failures
- Services are either **zonal** (pinned to a zone) or **zone-redundant** (automatically spread)

SLA impact:
| Deployment | VM SLA |
|---|---|
| Single VM with Premium SSD | 99.9% |
| VMs in an Availability Set | 99.95% |
| VMs across Availability Zones | 99.99% |

Check which regions support zones:
```bash
az account list-locations --query "[?availabilityZoneMappings != null].name" --output table
```

---

## Logical Infrastructure

### Resources
A resource is any manageable item in Azure — a VM, a storage account, a virtual network, a database, etc.

### Resource Groups
A resource group is a logical container for related resources. It holds resources that share the same lifecycle — you deploy, manage, and delete them together.

Rules and behaviors:
- Every resource must belong to exactly one resource group
- A resource group exists in a region, but can contain resources from other regions
- Deleting a resource group deletes all resources inside it
- Permissions (RBAC) and policies can be applied at the resource group level

```bash
# Create
az group create --name my-rg --location westeurope

# List
az group list --output table

# Delete (and everything in it)
az group delete --name my-rg --yes --no-wait
```

### Subscriptions
A subscription is a billing and access boundary in Azure. All resources belong to a subscription.

- A single Azure account can have multiple subscriptions
- Each subscription has its own billing, cost tracking, and limits/quotas
- Common pattern: separate subscriptions for dev, staging, production
- RBAC can be applied at subscription level

```bash
az account list --output table
az account show
az account set --subscription "<id-or-name>"
```

### Management Groups
Management groups sit above subscriptions and allow you to organize multiple subscriptions into a hierarchy for governance at scale.

```
Root Management Group
├── Management Group: Production
│   ├── Subscription: Prod-East
│   └── Subscription: Prod-West
├── Management Group: Development
│   └── Subscription: Dev
```

- Azure Policy and RBAC applied to a management group inherits down to all subscriptions within it
- Up to 6 levels deep (not counting root)
- Each Azure AD tenant has a single root management group

---

## Azure Resource Manager (ARM)

ARM is the deployment and management layer for Azure. Every interaction — portal, CLI, PowerShell, REST API — goes through ARM.

```
You (CLI / Portal / SDK)
        ↓
  Azure Resource Manager
        ↓
  Individual Services (Compute, Storage, Network...)
```

ARM provides:
- **Unified API** — consistent way to manage all resources
- **Declarative templates** — define infrastructure as JSON (ARM templates) or Bicep
- **Dependency management** — deploy resources in the right order
- **RBAC** — access control integrated at every level
- **Tagging** — metadata on resources for organization and cost tracking
- **Locking** — prevent accidental deletion or modification

---

## Scope Hierarchy

Azure has four levels of management scope. Policies, RBAC, and costs flow down:

```
Management Groups
    └── Subscriptions
            └── Resource Groups
                    └── Resources
```

Apply a policy at the Management Group level → applies to all subscriptions and resources below it.
Apply RBAC at the Resource Group level → applies to all resources within that group.
