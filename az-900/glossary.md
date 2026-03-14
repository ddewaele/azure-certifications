# AZ-900 Glossary

Key terms and definitions to know for the Azure Fundamentals exam. Terms are grouped by topic area.

---

## Cloud Computing Concepts

**Cloud computing**
The delivery of computing services — including servers, storage, databases, networking, software, analytics, and intelligence — over the internet ("the cloud") to offer faster innovation, flexible resources, and economies of scale. You pay only for what you use.

**On-premises (on-prem)**
IT infrastructure that is physically located and managed within an organisation's own facilities (datacenter, server room). The organisation owns and maintains the hardware.

**Hybrid cloud**
A computing environment that combines an on-premises datacenter with a public cloud. Resources and applications can move between the two environments.

**Public cloud**
Cloud services offered by a third-party provider (such as Microsoft Azure) over the public internet, shared across multiple customers (tenants). The provider owns and manages all infrastructure.

**Private cloud**
Cloud infrastructure operated exclusively for a single organisation. It can be hosted on-premises or by a third party, but resources are not shared with others.

**Multi-cloud**
Using cloud services from more than one cloud provider simultaneously (e.g. Azure + AWS). Azure Arc supports multi-cloud management.

**Consumption-based model**
A pricing model where you pay only for the resources you use, rather than buying and maintaining infrastructure upfront. This is the OpEx model in cloud computing.

**CapEx (Capital Expenditure)**
Upfront spending on physical infrastructure (buying servers, building datacenters). The cost is spread over time via depreciation. On-premises deployments are typically CapEx-heavy.

**OpEx (Operational Expenditure)**
Ongoing day-to-day spending on services and products as you consume them. Cloud computing follows an OpEx model — you pay monthly/as-you-go with no large upfront investment.

**Shared responsibility model**
A framework defining which security and operational responsibilities belong to the cloud provider and which belong to the customer. As you move from IaaS → PaaS → SaaS, the provider takes on more responsibility and the customer takes on less. The customer always retains responsibility for their data, users, and access control.

---

## Service Models

**IaaS (Infrastructure as a Service)**
The cloud provider manages the physical hardware, networking, and virtualisation. The customer manages the operating system, middleware, runtime, data, and applications. Examples: Azure Virtual Machines, Azure Disk Storage. Most flexibility; most customer responsibility.

**PaaS (Platform as a Service)**
The cloud provider manages the infrastructure *and* the operating system, runtime, and middleware. The customer manages their applications and data. Examples: Azure App Service, Azure SQL Database, Azure Functions. Good for developers who want to focus on code, not infrastructure.

**SaaS (Software as a Service)**
The cloud provider manages everything — infrastructure, platform, and the application itself. The customer just uses the software. Examples: Microsoft 365, Dynamics 365. Least flexibility; least customer responsibility.

**Serverless computing**
A cloud execution model where the cloud provider dynamically allocates and manages the server infrastructure. The developer only writes and deploys code; they never provision or scale servers. Billed per execution. Example: Azure Functions.

---

## Reliability and Availability

**Availability**
The proportion of time a system is operational and accessible. Usually expressed as a percentage (e.g. 99.9%). Determined by a service's SLA.

**SLA (Service Level Agreement)**
A formal commitment by a cloud provider that defines the guaranteed uptime percentage for a service and the compensation (service credits) provided if that target is not met. Azure SLAs are per service. For example: Azure VMs with Premium SSD disks have a 99.9% SLA; paired VMs across Availability Zones have 99.99%.

**High availability (HA)**
Designing a system so it remains accessible even when individual components fail. Achieved by redundancy — deploying multiple instances of a service so that if one fails, another takes over. A highly available system minimises planned and unplanned downtime.

**SLA nines**
Common shorthand for uptime SLA levels:

| SLA | Max downtime per year | Max downtime per month |
|---|---|---|
| 99% | ~87.6 hours | ~7.2 hours |
| 99.9% | ~8.7 hours | ~43.8 minutes |
| 99.95% | ~4.4 hours | ~21.9 minutes |
| 99.99% | ~52.6 minutes | ~4.4 minutes |
| 99.999% | ~5.3 minutes | ~26 seconds |

**Reliability**
The ability of a system to recover from failures and continue to function correctly. In Azure, reliability is achieved through redundancy across regions and availability zones. A reliable system is both resilient and consistent.

**Resiliency / Fault tolerance**
The ability of a system to continue operating (or degrade gracefully) when one or more of its components fail, rather than failing completely. A fault-tolerant system detects failures and routes traffic away from the failed component. Example: deploying VMs across Availability Zones so a datacenter failure doesn't take down the whole application.

**Redundancy**
Having duplicate components (VMs, disks, network paths) so that if one fails, a backup takes over without service interruption. Redundancy is the mechanism that enables high availability, fault tolerance, and resiliency.

**Disaster recovery (DR)**
The process of restoring systems and data after a major failure or catastrophic event (natural disaster, ransomware, data corruption). Typically involves replication to a secondary region. Key metrics: RTO and RPO.

**RTO (Recovery Time Objective)**
The maximum acceptable time to restore a system after a failure. "How long can we be down?" Lower RTO = higher cost.

**RPO (Recovery Point Objective)**
The maximum acceptable amount of data loss measured in time. "How much data can we afford to lose?" If RPO is 1 hour, backups must be taken at least every hour.

**Business continuity**
The capability of an organisation to continue delivering services at acceptable levels following a disruptive event. Cloud DR capabilities are a key enabler of business continuity.

---

## Performance and Scaling

**Scalability**
The ability of a system to handle increased load by adding resources. Scalability describes the *capacity* to grow.

**Vertical scaling (Scale up/down)**
Increasing or decreasing the capacity of an individual resource — e.g. moving a VM from 4 vCPUs to 16 vCPUs, or increasing RAM. Has an upper limit (the largest available VM size).

**Horizontal scaling (Scale out/in)**
Adding or removing instances of a resource — e.g. adding more VM replicas behind a load balancer. Has no fixed upper limit; preferred pattern for cloud-native applications.

**Elasticity**
The ability to *automatically* scale resources up and down in response to demand, so you're never over-provisioned (paying for idle capacity) or under-provisioned (dropping requests). Elasticity is automatic scalability. Example: Azure VM Scale Sets with autoscale rules, Azure Functions scaling to zero.

**Agility**
The ability to rapidly provision and de-provision cloud resources to respond to changing business needs. In cloud computing, agility means you can spin up a test environment in minutes and tear it down just as fast — without the delays of procuring physical hardware.

**Performance**
The responsiveness and throughput of a system under a given load. Azure offers performance features such as Premium SSD disks, CDN caching, and proximity placement groups to reduce latency.

**Latency**
The delay between a request and a response, typically measured in milliseconds. Lower latency = faster response. Deploying resources closer to users (in the same Azure region) reduces latency. CDN and Azure Front Door reduce latency for globally distributed users.

**Throughput**
The amount of data or number of requests a system can process in a given time period. Usually measured in requests/second or MB/s.

---

## Cost and Economics

**Pay-as-you-go**
A billing model where you pay for resources based on actual usage with no upfront commitment. The most flexible but most expensive per-unit option.

**Reserved Instances (Azure Reservations)**
A commitment to use a specific resource type for 1 or 3 years in exchange for a discount of up to 72% compared to pay-as-you-go pricing.

**Spot VMs**
VMs that use Azure's spare capacity at up to 90% discount. Can be evicted with 30 seconds notice when Azure needs the capacity back. Suitable for interruptible, fault-tolerant workloads.

**Azure Hybrid Benefit**
A licensing benefit that lets customers reuse existing on-premises Windows Server and SQL Server licences in Azure, reducing software costs.

**TCO (Total Cost of Ownership)**
The full cost of running a system over its lifetime, including hardware, software, labour, facilities, and maintenance. The Azure TCO Calculator helps compare the total cost of on-premises vs. Azure.

**Economies of scale**
The cost advantages that result from large-scale operations. Cloud providers pass on savings from buying hardware at massive scale to their customers, resulting in lower per-unit costs than running your own infrastructure.

---

## Security and Compliance

**Zero Trust**
A security model based on the principle "never trust, always verify." Every user, device, and request is authenticated and authorised, regardless of whether it originates inside or outside the corporate network. Key principles: verify explicitly; use least privilege access; assume breach.

**Defense in depth**
A layered security strategy where multiple security controls are placed at different levels — physical, identity, perimeter, network, compute, application, data — so that if one layer is breached, others still protect the system.

**Least privilege**
The principle that users, applications, and systems should be granted only the minimum permissions they need to perform their function — nothing more.

**Authentication (AuthN)**
The process of verifying *who* a user or system is. "Prove you are who you say you are." Methods: password, MFA, certificate, biometric.

**Authorisation (AuthZ)**
The process of determining *what* an authenticated user or system is allowed to do. "You are who you say you are — but are you allowed to do this?"

**MFA (Multi-Factor Authentication)**
Requiring users to provide two or more verification factors to authenticate. Factors: something you know (password), something you have (phone/token), something you are (biometric). Significantly reduces the risk of credential compromise.

**SSO (Single Sign-On)**
A mechanism that allows a user to authenticate once and gain access to multiple applications without re-entering credentials. Microsoft Entra ID provides SSO across Azure and Microsoft 365 services.

**RBAC (Role-Based Access Control)**
A system for managing access to Azure resources by assigning roles to users, groups, or service principals at a specific scope (management group, subscription, resource group, or resource). Roles define a set of permitted actions. Azure RBAC follows the principle of least privilege.

**Conditional Access**
A Microsoft Entra ID feature that enforces access policies based on conditions: who the user is, what device they're using, their location, and the risk level of the sign-in. Can require MFA, block access, or require a compliant device.

**Governance**
The set of rules, policies, and processes used to control how an organisation's cloud resources are managed, who can use them, and how they must be configured. Azure governance tools include Azure Policy, resource locks, and management groups.

**Compliance**
Adhering to regulatory requirements, legal obligations, and industry standards (e.g. GDPR, ISO 27001, SOC 2, PCI DSS). Azure provides built-in compliance tooling and audit reports via the Service Trust Portal.

---

## Azure Infrastructure

**Region**
A geographic area containing one or more datacenters that are networked together with a low-latency network. Most Azure services require you to choose a region. Examples: West Europe, East US, Southeast Asia.

**Region pair**
Each Azure region is paired with another region in the same geography, at least 300 miles apart. Paired regions are used for geo-redundant storage replication and to sequence Azure platform updates to minimise simultaneous downtime.

**Geography**
A discrete market, typically containing two or more Azure regions, that preserves data residency and compliance requirements. Example: the Europe geography contains regions like West Europe and North Europe.

**Sovereign region**
An Azure region that is isolated from the main Azure cloud for compliance or regulatory reasons. Examples: Azure Government (US government), Azure China 21Vianet (operated by a local partner).

**Availability Zone**
Physically separate datacenters within an Azure region, each with independent power, cooling, and networking. Deploying across Availability Zones protects against datacenter-level failures. Not all regions have Availability Zones.

**Availability Set**
A legacy grouping of VMs within a single datacenter that spreads VMs across fault domains (separate physical racks) and update domains (separate maintenance groups) to protect against hardware failure and platform updates. Predates Availability Zones; use zones for new deployments.

**Resource Group**
A logical container for Azure resources that share the same lifecycle. Resources in a group can be deployed, updated, and deleted together. A resource group always belongs to one region (for metadata), but can contain resources from any region.

**Azure Resource Manager (ARM)**
The deployment and management service for Azure. All interactions with Azure (portal, CLI, PowerShell, REST API) go through ARM. Provides consistent authentication, RBAC enforcement, and a declarative deployment model.

**Management Group**
A container above the subscription level, used to apply governance (policies, RBAC) across multiple subscriptions. The root management group sits at the top of the hierarchy; all subscriptions roll up to it.

**Subscription**
An agreement with Microsoft to use Azure services, linked to a billing account. All Azure resources are deployed into a subscription. Used to manage billing, access control, and policy boundaries.

---

## Networking

**VNet (Virtual Network)**
An isolated, private network in Azure. VMs and other services communicate within a VNet without traffic leaving the Azure network. Analogous to a traditional on-premises network.

**Subnet**
A subdivision of a VNet used to segment resources, apply network security groups, and control routing. Resources in different subnets of the same VNet can communicate by default.

**NSG (Network Security Group)**
A set of inbound and outbound security rules that control network traffic to and from Azure resources. Rules are evaluated by priority; the first matching rule wins.

**VPN Gateway**
An Azure service that creates an encrypted connection (IPsec/IKE tunnel) between an Azure VNet and an on-premises network or another VNet over the public internet.

**ExpressRoute**
A private, dedicated network connection between an on-premises network and Azure that does *not* traverse the public internet. Provides more reliable, lower-latency connectivity than VPN Gateway at higher cost.

**DNS (Domain Name System)**
The system that translates human-readable domain names (e.g. `myapp.azure.com`) into IP addresses. Azure DNS hosts public and private DNS zones.

**Private endpoint**
A network interface that gives an Azure PaaS service (e.g. Azure Storage, Azure SQL) a private IP address inside your VNet, so traffic to that service stays on the Azure backbone and never traverses the public internet.

**Load balancer**
A service that distributes incoming traffic across multiple backend instances to increase availability and throughput. Azure Load Balancer operates at Layer 4 (TCP/UDP); Azure Application Gateway at Layer 7 (HTTP/HTTPS).

**CDN (Content Delivery Network)**
A distributed network of servers that caches content close to end users to reduce latency. Azure CDN caches static content (images, scripts, videos) at edge nodes worldwide.

---

## Storage

**Blob storage**
Azure's object storage service for unstructured data — files, images, videos, backups, logs. Accessed via HTTP/S. Three types: block blobs (general files), append blobs (log files), page blobs (VM disk files).

**Access tiers**
Blob storage pricing tiers based on access frequency:
- **Hot** — frequently accessed; higher storage cost, lower access cost
- **Cool** — infrequently accessed (≥30 days); lower storage cost, higher access cost
- **Cold** — rarely accessed (≥90 days)
- **Archive** — offline storage (≥180 days); lowest storage cost; data must be *rehydrated* (takes hours) before it can be read

**Storage redundancy**
How many copies of data Azure maintains and where:
- **LRS** (Locally Redundant Storage) — 3 copies in one datacenter
- **ZRS** (Zone-Redundant Storage) — 3 copies across 3 Availability Zones in one region
- **GRS** (Geo-Redundant Storage) — LRS + async copy to a paired region (6 copies total)
- **GZRS** (Geo-Zone-Redundant Storage) — ZRS + async copy to a paired region (highest durability)

**Rehydration**
The process of bringing an Archive-tier blob back to an accessible tier (Hot or Cool). Can take up to 15 hours. Required before the data can be read or downloaded.

---

## Identity

**Microsoft Entra ID (formerly Azure Active Directory)**
Azure's cloud-based identity and access management service. Manages users, groups, app registrations, and authentication for Azure resources and Microsoft 365. Not the same as Windows Server Active Directory.

**Tenant**
A dedicated instance of Microsoft Entra ID, representing a single organisation. Created automatically when an organisation signs up for Azure or Microsoft 365.

**Service principal**
An identity created for an application or automated service to authenticate to Azure resources (rather than using a user account). Used by pipelines, scripts, and apps.

**Managed identity**
An automatically managed service principal in Entra ID, assigned directly to an Azure resource (e.g. a VM or Function App). The resource can authenticate to other Azure services without storing credentials in code or configuration.

---

## Management and Governance

**Azure Policy**
A service that creates, assigns, and manages policies to enforce rules on Azure resources. Can audit non-compliant resources, prevent non-compliant deployments, or auto-remediate issues.

**Resource lock**
A protection setting applied to a subscription, resource group, or resource to prevent accidental deletion or modification. Two types: **ReadOnly** (no changes or deletes) and **CanNotDelete** (changes allowed, deletes blocked). Overrides owner-level RBAC permissions.

**Tag**
A name/value metadata label applied to Azure resources for organisation, cost allocation, and filtering. Up to 50 tags per resource. Not inherited by child resources by default.

**Azure Advisor**
A free personalised recommendation engine built into Azure. Analyses your deployments and provides actionable recommendations across five pillars: Cost, Security, Reliability, Operational Excellence, and Performance.

**Azure Monitor**
The unified monitoring platform for Azure. Collects metrics and logs from resources, supports alerting, and provides tools like Log Analytics (KQL queries over logs) and Application Insights (APM for web apps).

**Azure Service Health**
A suite of services tracking Azure platform health:
- **Azure Status** — global Azure outages (public page)
- **Service Health** — outages and maintenance affecting your subscriptions and regions
- **Resource Health** — health status of your specific resources

**Azure Arc**
A service that extends Azure management (RBAC, Policy, Monitor, Defender) to resources outside Azure — including on-premises servers, VMs in other clouds, and Kubernetes clusters.

**ARM template**
A JSON file that declaratively defines the Azure resources to deploy. Submitted to ARM, which creates or updates resources to match the desired state. Enables repeatable, version-controlled infrastructure deployments.

**Bicep**
A domain-specific language (DSL) for deploying Azure resources. Compiles to ARM JSON but has cleaner syntax, better tooling, and first-class support from Microsoft. The recommended alternative to writing ARM JSON by hand.

**Infrastructure as Code (IaC)**
The practice of managing and provisioning infrastructure through machine-readable configuration files (code) rather than manual processes or interactive tools. ARM templates and Bicep are Azure's native IaC options.

**Azure Cloud Shell**
A browser-based shell environment accessible from the Azure portal. Supports both Bash (with Azure CLI) and PowerShell. Files are persisted in an Azure storage account. No local installation required.

**Microsoft Purview**
A unified data governance platform for discovering, classifying, and managing data across on-premises, Azure, and multi-cloud environments. Also covers compliance, data cataloguing, and information protection.

**Service Trust Portal**
A Microsoft public portal providing audit reports, compliance documentation (ISO certificates, SOC reports, GDPR materials), and other trust-related information about Microsoft cloud services.

---

## Pricing and Support

**Azure Pricing Calculator**
A web tool for estimating the monthly cost of Azure services *before* deploying them. Configure services, regions, and tiers to see a cost estimate.

**TCO Calculator**
A web tool for estimating the cost savings of migrating on-premises workloads to Azure by comparing the total cost of on-premises infrastructure vs. the equivalent Azure services.

**Azure Cost Management + Billing**
A built-in Azure tool for analysing, monitoring, and optimising *existing* cloud spend. Features include cost analysis, budget alerts, and Advisor cost recommendations.

**Azure support plans**
Paid tiers of technical support from Microsoft:
- **Basic** — free with every subscription; no technical support
- **Developer** — ~$29/mo; email support, business hours only
- **Standard** — ~$100/mo; 24/7 phone and email; 1-hour Sev A response
- **Professional Direct** — ~$1,000/mo; proactive advisory; 1-hour Sev A response
- **Premier / Unified** — custom pricing; dedicated Technical Account Manager (TAM)
