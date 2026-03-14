# Azure Fundamentals Tutorial (AZ-900)

A hands-on learning repo for the [Microsoft Azure Fundamentals (AZ-900)](https://learn.microsoft.com/en-us/certifications/exams/az-900/) exam. Each topic includes notes, CLI commands, and small experiments to solidify understanding.

## Prerequisites

- An active Azure subscription
- Azure CLI installed and configured ([setup guide](./guides/01-azure-cli-setup.md))
- Basic familiarity with cloud concepts and the terminal

---

## Exam Topics

The AZ-900 exam is divided into three domain areas:

### 1. Cloud Concepts (25–30%)

| Topic | Notes | Lab |
|-------|-------|-----|
| What is cloud computing? | [Cloud Concepts](./guides/concepts/01-cloud-concepts.md) | — |
| Shared responsibility model | [Cloud Concepts](./guides/concepts/01-cloud-concepts.md) | — |
| Cloud service types: IaaS, PaaS, SaaS | [Cloud Concepts](./guides/concepts/01-cloud-concepts.md) | — |
| Cloud deployment models: public, private, hybrid | [Cloud Concepts](./guides/concepts/01-cloud-concepts.md) | — |
| CapEx vs OpEx | [Cloud Concepts](./guides/concepts/01-cloud-concepts.md) | — |
| Benefits: high availability, scalability, elasticity, agility, geo-distribution, disaster recovery | [Cloud Concepts](./guides/concepts/01-cloud-concepts.md) | — |

### 2. Azure Architecture and Services (35–40%)

#### Core Architecture
| Topic | Notes | Lab |
|-------|-------|-----|
| Azure regions and region pairs | [Azure Architecture](./guides/concepts/02-azure-architecture.md) | — |
| Availability zones | [Azure Architecture](./guides/concepts/02-azure-architecture.md) | [Lab 05](./guides/labs/05-availability-zones.md) |
| Azure datacenters | [Azure Architecture](./guides/concepts/02-azure-architecture.md) | — |
| Azure resources and resource groups | [Azure Architecture](./guides/concepts/02-azure-architecture.md) | — |
| Subscriptions | [Azure Architecture](./guides/concepts/02-azure-architecture.md) | — |
| Management groups | [Azure Architecture](./guides/concepts/02-azure-architecture.md) | — |
| Azure Resource Manager (ARM) | [Azure Architecture](./guides/concepts/02-azure-architecture.md) | — |

#### Compute
| Topic | Notes | Lab |
|-------|-------|-----|
| Virtual Machines (VMs) | [Compute](./guides/concepts/03-compute.md) | [Lab 01](./guides/labs/01-vm-lifecycle.md) |
| VM Scale Sets | [Compute](./guides/concepts/03-compute.md) | [Lab 04](./guides/labs/04-vm-scale-sets.md) |
| Azure App Service | [Compute](./guides/concepts/03-compute.md) | [Lab 02](./guides/labs/02-app-service.md) |
| Azure Container Instances (ACI) | [Compute](./guides/concepts/03-compute.md) | [Lab 06](./guides/labs/06-container-instances.md) |
| Azure Kubernetes Service (AKS) | [Compute](./guides/concepts/03-compute.md) | — |
| Azure Functions | [Compute](./guides/concepts/03-compute.md) | [Lab 03](./guides/labs/03-azure-functions.md) |
| Azure Virtual Desktop | [Compute](./guides/concepts/03-compute.md) | — |

#### Networking
| Topic | Notes | Lab |
|-------|-------|-----|
| Azure Virtual Network (VNet) | [Networking](./guides/concepts/04-networking.md) | [Lab 09](./guides/labs/09-vnet-subnets-nsg.md) |
| VNet peering | [Networking](./guides/concepts/04-networking.md) | [Lab 09](./guides/labs/09-vnet-subnets-nsg.md) |
| Azure VPN Gateway | [Networking](./guides/concepts/04-networking.md) | — |
| Azure ExpressRoute | [Networking](./guides/concepts/04-networking.md) | — |
| Azure DNS | [Networking](./guides/concepts/04-networking.md) | [Lab 11](./guides/labs/11-dns.md) |
| Azure Load Balancer | [Networking](./guides/concepts/04-networking.md) | [Lab 04](./guides/labs/04-vm-scale-sets.md) |
| Azure Application Gateway | [Networking](./guides/concepts/04-networking.md) | — |
| Azure Content Delivery Network (CDN) | [Networking](./guides/concepts/04-networking.md) | — |

#### Storage
| Topic | Notes | Lab |
|-------|-------|-----|
| Azure Blob Storage | [Storage](./guides/concepts/05-storage.md) | [Lab 07](./guides/labs/07-blob-storage.md) |
| Azure File Storage | [Storage](./guides/concepts/05-storage.md) | [Lab 07](./guides/labs/07-blob-storage.md) |
| Azure Queue Storage | [Storage](./guides/concepts/05-storage.md) | [Lab 07](./guides/labs/07-blob-storage.md) |
| Azure Table Storage | [Storage](./guides/concepts/05-storage.md) | [Lab 07](./guides/labs/07-blob-storage.md) |
| Azure Disk Storage | [Storage](./guides/concepts/05-storage.md) | [Lab 01](./guides/labs/01-vm-lifecycle.md) |
| Storage redundancy options (LRS, ZRS, GRS, GZRS) | [Storage](./guides/concepts/05-storage.md) | [Lab 07](./guides/labs/07-blob-storage.md) |
| Storage tiers (Hot, Cool, Cold, Archive) | [Storage](./guides/concepts/05-storage.md) | [Lab 07](./guides/labs/07-blob-storage.md) |

#### Identity, Access, and Security
| Topic | Notes | Lab |
|-------|-------|-----|
| Microsoft Entra ID (Azure AD) | [Identity & Security](./guides/concepts/06-identity-security.md) | — |
| Authentication vs Authorization | [Identity & Security](./guides/concepts/06-identity-security.md) | — |
| Azure RBAC (Role-Based Access Control) | [Identity & Security](./guides/concepts/06-identity-security.md) | — |
| Zero Trust model | [Identity & Security](./guides/concepts/06-identity-security.md) | — |
| Defense-in-depth | [Identity & Security](./guides/concepts/06-identity-security.md) | — |
| Microsoft Defender for Cloud | [Identity & Security](./guides/concepts/06-identity-security.md) | — |

### 3. Azure Management and Governance (30–35%)

#### Cost Management
| Topic | Notes | Lab |
|-------|-------|-----|
| Factors affecting cost | [Cost Management](./guides/concepts/07-cost-management.md) | — |
| Azure Pricing Calculator | [Cost Management](./guides/concepts/07-cost-management.md) | — |
| Total Cost of Ownership (TCO) Calculator | [Cost Management](./guides/concepts/07-cost-management.md) | — |
| Azure Cost Management + Billing | [Cost Management](./guides/concepts/07-cost-management.md) | — |
| Tags for cost allocation | [Cost Management](./guides/concepts/07-cost-management.md) | — |
| Azure support plans | [Cost Management](./guides/concepts/07-cost-management.md) | — |

#### Governance
| Topic | Notes | Lab |
|-------|-------|-----|
| Azure Blueprints | [Governance & Monitoring](./guides/concepts/08-governance-monitoring.md) | — |
| Azure Policy | [Governance & Monitoring](./guides/concepts/08-governance-monitoring.md) | — |
| Resource locks | [Governance & Monitoring](./guides/concepts/08-governance-monitoring.md) | — |
| Microsoft Purview | [Governance & Monitoring](./guides/concepts/08-governance-monitoring.md) | — |

#### Monitoring and Management Tools
| Topic | Notes | Lab |
|-------|-------|-----|
| Azure Portal | [Governance & Monitoring](./guides/concepts/08-governance-monitoring.md) | — |
| Azure CLI | [CLI Setup](./guides/01-azure-cli-setup.md) | — |
| Azure PowerShell | [Governance & Monitoring](./guides/concepts/08-governance-monitoring.md) | — |
| Azure Cloud Shell | [Governance & Monitoring](./guides/concepts/08-governance-monitoring.md) | — |
| Azure Arc | [Governance & Monitoring](./guides/concepts/08-governance-monitoring.md) | — |
| Azure Resource Manager (ARM) templates | [Governance & Monitoring](./guides/concepts/08-governance-monitoring.md) | — |
| Bicep | [Governance & Monitoring](./guides/concepts/08-governance-monitoring.md) | — |
| Azure Monitor | [Governance & Monitoring](./guides/concepts/08-governance-monitoring.md) | — |
| Azure Service Health | [Governance & Monitoring](./guides/concepts/08-governance-monitoring.md) | — |
| Azure Advisor | [Governance & Monitoring](./guides/concepts/08-governance-monitoring.md) | — |

---

## Guides

### Setup
- [01 - Azure CLI Setup](./guides/01-azure-cli-setup.md)

### Concept Guides
- [01 - Cloud Concepts](./guides/concepts/01-cloud-concepts.md) — IaaS/PaaS/SaaS, deployment models, CapEx vs OpEx, cloud benefits
- [02 - Azure Architecture](./guides/concepts/02-azure-architecture.md) — Regions, availability zones, resource groups, subscriptions, ARM
- [03 - Compute](./guides/concepts/03-compute.md) — VMs, Scale Sets, App Service, Functions, ACI, AKS
- [04 - Networking](./guides/concepts/04-networking.md) — VNet, NSGs, VPN Gateway, ExpressRoute, Load Balancer
- [05 - Storage](./guides/concepts/05-storage.md) — Blob, Files, Queue, Table, Disk, redundancy tiers
- [06 - Identity and Security](./guides/concepts/06-identity-security.md) — Entra ID, RBAC, Zero Trust, Defender for Cloud
- [07 - Cost Management](./guides/concepts/07-cost-management.md) — Pricing, TCO, budgets, reserved instances, tags, support plans
- [08 - Governance and Monitoring](./guides/concepts/08-governance-monitoring.md) — Policy, locks, Purview, Monitor, Advisor

### Hands-On Labs
- [Lab 01 - VM Lifecycle](./guides/labs/01-vm-lifecycle.md) — Create VMs, SSH, stop vs deallocate, resize, snapshots
- [Lab 02 - App Service](./guides/labs/02-app-service.md) — Deploy a web app on PaaS, scaling, deployment slots
- [Lab 03 - Azure Functions](./guides/labs/03-azure-functions.md) — Serverless HTTP and timer triggers, consumption model
- [Lab 04 - VM Scale Sets](./guides/labs/04-vm-scale-sets.md) — Horizontal scaling, autoscale, load balancing
- [Lab 05 - Availability Zones](./guides/labs/05-availability-zones.md) — Zone-redundant deployments, HA load balancer, simulating failures
- [Lab 06 - Container Instances](./guides/labs/06-container-instances.md) — Run containers without VMs, persistent storage, container groups

#### Storage
- [Lab 07 - Storage Fundamentals](./guides/labs/07-blob-storage.md) — Blob, Files, Queue, Table: upload/download, SAS tokens, access tiers
- [Lab 08 - Storage Integrations](./guides/labs/08-storage-integrations.md) — App Service + blob, Functions blob/queue triggers, ACI file mounts, managed identity

#### Networking
- [Lab 09 - VNet, Subnets, NSGs](./guides/labs/09-vnet-subnets-nsg.md) — Public/private subnet pattern, NSG rules, jump host, VNet peering
- [Lab 10 - Public and Private IPs](./guides/labs/10-public-private-ip.md) — Static vs dynamic, NAT gateway for private subnet outbound
- [Lab 11 - DNS](./guides/labs/11-dns.md) — Public zones, private zones, split-horizon DNS, private endpoints
- [Lab 12 - Routing](./guides/labs/12-routing.md) — Route tables, user-defined routes, hub-and-spoke, forced tunneling

---

## Quiz Bank

69 multiple-choice questions covering all AZ-900 exam domains, in structured JSON format.

- [Quiz README + how to run](./quiz/README.md)
- [01 - Cloud Concepts](./quiz/01-cloud-concepts.json) (10 questions)
- [02 - Azure Architecture](./quiz/02-azure-architecture.json) (8 questions)
- [03 - Compute](./quiz/03-compute.json) (8 questions)
- [04 - Networking](./quiz/04-networking.json) (8 questions)
- [05 - Storage](./quiz/05-storage.json) (8 questions)
- [06 - Identity and Security](./quiz/06-identity-security.json) (8 questions)
- [07 - Cost Management](./quiz/07-cost-management.json) (11 questions)
- [08 - Governance and Monitoring](./quiz/08-governance-monitoring.json) (8 questions)

---

## Troubleshooting

- [Troubleshooting Index](./troubleshooting/README.md)
- [MissingSubscriptionRegistration](./troubleshooting/missing-subscription-registration.md) — resource provider not registered on subscription

---

## Resources

See the full curated resource list: **[resources/README.md](./resources/README.md)**

Quick links:
- [AZ-900 Certification Page](https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/)
- [Official Study Guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-900)
- [Free Practice Assessment](https://learn.microsoft.com/en-us/credentials/certifications/exams/az-900/practice/assessment?assessment-type=practice&assessmentId=23)
- [Microsoft Learn — All 3 Learning Paths](https://learn.microsoft.com/en-us/training/paths/microsoft-azure-fundamentals-describe-cloud-concepts/)
- [John Savill — AZ-900 YouTube Course](https://youtube.com/playlist?list=PLlVtbbG169nED0_vMEniWBQjSoxTsBYS3)
- [Azure Free Account](https://azure.microsoft.com/en-us/free/)
