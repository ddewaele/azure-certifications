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
| What is cloud computing? | | |
| Shared responsibility model | | |
| Cloud service types: IaaS, PaaS, SaaS | | |
| Cloud deployment models: public, private, hybrid | | |
| CapEx vs OpEx | | |
| Benefits: high availability, scalability, elasticity, agility, geo-distribution, disaster recovery | | |

### 2. Azure Architecture and Services (35–40%)

#### Core Architecture
| Topic | Notes | Lab |
|-------|-------|-----|
| Azure regions and region pairs | | |
| Availability zones | | |
| Azure datacenters | | |
| Azure resources and resource groups | | |
| Subscriptions | | |
| Management groups | | |
| Azure Resource Manager (ARM) | | |

#### Compute
| Topic | Notes | Lab |
|-------|-------|-----|
| Virtual Machines (VMs) | | |
| VM Scale Sets | | |
| Azure App Service | | |
| Azure Container Instances (ACI) | | |
| Azure Kubernetes Service (AKS) | | |
| Azure Functions | | |
| Azure Virtual Desktop | | |

#### Networking
| Topic | Notes | Lab |
|-------|-------|-----|
| Azure Virtual Network (VNet) | | |
| VNet peering | | |
| Azure VPN Gateway | | |
| Azure ExpressRoute | | |
| Azure DNS | | |
| Azure Load Balancer | | |
| Azure Application Gateway | | |
| Azure Content Delivery Network (CDN) | | |

#### Storage
| Topic | Notes | Lab |
|-------|-------|-----|
| Azure Blob Storage | | |
| Azure File Storage | | |
| Azure Queue Storage | | |
| Azure Table Storage | | |
| Azure Disk Storage | | |
| Storage redundancy options (LRS, ZRS, GRS, GZRS) | | |
| Storage tiers (Hot, Cool, Cold, Archive) | | |

#### Identity, Access, and Security
| Topic | Notes | Lab |
|-------|-------|-----|
| Microsoft Entra ID (Azure AD) | | |
| Authentication vs Authorization | | |
| Azure RBAC (Role-Based Access Control) | | |
| Zero Trust model | | |
| Defense-in-depth | | |
| Microsoft Defender for Cloud | | |

### 3. Azure Management and Governance (30–35%)

#### Cost Management
| Topic | Notes | Lab |
|-------|-------|-----|
| Factors affecting cost | | |
| Azure Pricing Calculator | | |
| Total Cost of Ownership (TCO) Calculator | | |
| Azure Cost Management + Billing | | |
| Tags for cost allocation | | |

#### Governance
| Topic | Notes | Lab |
|-------|-------|-----|
| Azure Blueprints | | |
| Azure Policy | | |
| Resource locks | | |
| Microsoft Purview | | |

#### Monitoring and Management Tools
| Topic | Notes | Lab |
|-------|-------|-----|
| Azure Portal | | |
| Azure CLI | | |
| Azure PowerShell | | |
| Azure Cloud Shell | | |
| Azure Arc | | |
| Azure Resource Manager (ARM) templates | | |
| Bicep | | |
| Azure Monitor | | |
| Azure Service Health | | |
| Azure Advisor | | |

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
- [07 - Cost Management](./guides/concepts/07-cost-management.md) — Pricing, TCO, budgets, reserved instances, tags
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

65 multiple-choice questions covering all AZ-900 exam domains, in structured JSON format.

- [Quiz README + how to run](./quiz/README.md)
- [01 - Cloud Concepts](./quiz/01-cloud-concepts.json) (10 questions)
- [02 - Azure Architecture](./quiz/02-azure-architecture.json) (8 questions)
- [03 - Compute](./quiz/03-compute.json) (8 questions)
- [04 - Networking](./quiz/04-networking.json) (8 questions)
- [05 - Storage](./quiz/05-storage.json) (8 questions)
- [06 - Identity and Security](./quiz/06-identity-security.json) (8 questions)
- [07 - Cost Management](./quiz/07-cost-management.json) (7 questions)
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
