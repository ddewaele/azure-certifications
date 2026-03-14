# AZ-900 Exam Overview

This guide covers everything you need to know about the exam itself before diving into the content.

---

## What is AZ-900?

**Microsoft Azure Fundamentals (AZ-900)** is a foundational certification exam that validates your understanding of cloud concepts and core Azure services. It is intended for:

- People new to cloud or Azure
- Non-technical roles (sales, finance, management) who work with Azure
- Technical professionals who want a formal baseline before pursuing associate-level certs (AZ-104, AZ-204, etc.)

It is **not** a hard technical exam. There are no hands-on tasks, no CLI questions, and no code to write. The questions test conceptual understanding, ability to choose the right service for a scenario, and awareness of Azure's management and governance tools.

---

## Exam at a Glance

| | |
|---|---|
| **Exam code** | AZ-900 |
| **Duration** | 45–65 minutes |
| **Number of questions** | ~40–60 questions |
| **Question types** | Multiple choice, multiple select, drag-and-drop, scenario-based |
| **Passing score** | 700 out of 1000 (approximately 70%) |
| **Cost** | USD $165 (varies by country) |
| **Language** | Available in 14+ languages |
| **Delivery** | Online proctored or at a test centre |
| **Retake policy** | Wait 24 hours after a fail; after a second fail, wait 14 days |
| **Validity** | Does not expire (foundational certs are evergreen) |

---

## Exam Domains and Weights

The exam is divided into three domains. Microsoft publishes the percentage weight of each, which tells you where to focus your study time.

| Domain | Weight |
|--------|--------|
| 1. Describe cloud concepts | 25–30% |
| 2. Describe Azure architecture and services | 35–40% |
| 3. Describe Azure management and governance | 30–35% |

Domain 2 is the largest and most detailed — it covers compute, networking, storage, and identity. Domain 3 is heavier than many people expect, especially the governance and monitoring sections.

---

## Domain 1 — Describe Cloud Concepts (25–30%)

### What to expect
Conceptual, definition-heavy questions. You need to know *what things are called* and *why* cloud has advantages over on-premises. A lot of these questions are about picking the right term for a scenario.

### Subtopics

**1.1 Describe cloud computing**
- What cloud computing is and what makes it different from on-premises
- The **shared responsibility model** — know exactly what the customer is responsible for vs. the cloud provider across IaaS, PaaS, and SaaS
- **Cloud deployment models**: public, private, hybrid — and when each is appropriate
- The **consumption-based model** (OpEx) vs. capital expenditure (CapEx)

**1.2 Describe the benefits of cloud services**
- **High availability** — designing for uptime using SLAs
- **Scalability** — adding more resources to handle load (vertical = scale up; horizontal = scale out)
- **Elasticity** — automatically scaling resources to match demand
- **Reliability** — distributing workloads so a single failure doesn't bring down the service
- **Predictability** — consistent performance and cost forecasting
- **Security and governance** — tools to enforce compliance and protect data
- **Manageability** — Azure portal, CLI, APIs, templates for controlling resources

**1.3 Describe cloud service types**
- **IaaS** (Infrastructure as a Service) — you manage the OS and up; Azure manages the hardware. Example: Azure VMs
- **PaaS** (Platform as a Service) — you manage the application and data; Azure manages the runtime and infrastructure. Example: App Service, Azure SQL
- **SaaS** (Software as a Service) — you just use the software; Azure manages everything. Example: Microsoft 365
- Know appropriate use cases for each and what the shared responsibility split looks like for each model

### Exam tips
- Shared responsibility is tested heavily — memorise which layer the customer owns in each model
- The distinction between scalability and elasticity trips people up: scalability is the *ability* to scale; elasticity is *automatic* scaling to match demand
- CapEx vs OpEx: on-premises is mostly CapEx (buy hardware upfront); cloud is mostly OpEx (pay as you consume)

---

## Domain 2 — Describe Azure Architecture and Services (35–40%)

This is the largest domain. It has four sub-areas.

### 2.1 Core architectural components

**What to learn:**
- **Geographies, regions, and region pairs** — a geography contains multiple regions; region pairs are used for disaster recovery (replicated data stays within the same geography)
- **Sovereign regions** — Azure Government (US), Azure China 21Vianet — isolated from the public cloud, for compliance reasons
- **Availability zones** — physically separate datacenters within a region (each with independent power/cooling/networking). Protect against datacenter-level failures. Not all regions have AZs
- **Availability sets** — a legacy HA mechanism using fault domains and update domains within a single datacenter (older pattern; AZs are preferred for new deployments)
- **Azure resources, resource groups, subscriptions, and management groups** — understand the hierarchy: Management Group → Subscription → Resource Group → Resource
- **Azure Resource Manager (ARM)** — the deployment and management layer for everything in Azure; all Azure portals, CLI, and APIs go through ARM

**Exam tips:**
- Know the difference between availability *zones* (separate datacenters in a region) and availability *sets* (racks within one datacenter)
- Region pairs: understand that they are used for geo-redundant replication and that Azure prioritises one region in a pair during outages
- The management group / subscription / resource group hierarchy is commonly tested

### 2.2 Azure compute and networking services

**Compute — what to learn:**
- **Azure Virtual Machines** — IaaS compute; you pick the OS, size, disk; billed per second when running
- **VM Scale Sets (VMSS)** — group of identical VMs that scale in/out automatically based on load
- **Availability Sets** — spread VMs across fault domains and update domains for HA within a datacenter
- **Azure Virtual Desktop** — cloud-hosted Windows desktop/app environment for remote workers
- **Azure App Service** — PaaS for hosting web apps, APIs, and mobile backends without managing VMs
- **Azure Container Instances (ACI)** — run containers on-demand without any cluster; best for simple/short-lived containers
- **Azure Kubernetes Service (AKS)** — managed Kubernetes for orchestrating containers at scale
- **Azure Functions** — serverless event-driven compute; consumption plan bills per execution
- Know the key distinction: **containers vs VMs** (containers share the host OS kernel; VMs have their own OS)

**Networking — what to learn:**
- **Azure Virtual Network (VNet)** — private network in Azure; resources communicate via VNets
- **Subnets** — subdivide a VNet for organisation and security
- **VNet peering** — connect two VNets so resources can communicate privately
- **Azure VPN Gateway** — encrypted tunnel between Azure and on-premises over the public internet (Site-to-Site, Point-to-Site)
- **Azure ExpressRoute** — private dedicated connection between on-premises and Azure (does not go over the public internet; higher reliability and lower latency than VPN)
- **Azure DNS** — host DNS zones in Azure; also supports private DNS zones for name resolution within VNets
- **Azure Load Balancer** — distributes TCP/UDP traffic across VMs at Layer 4 (transport layer)
- **Azure Application Gateway** — HTTP/HTTPS load balancer at Layer 7; can do path-based routing and SSL termination; includes WAF option
- **Azure Content Delivery Network (CDN)** — caches content at edge locations globally for low-latency delivery
- **Public vs private endpoints** — a private endpoint gives an Azure PaaS service a private IP inside your VNet so traffic never leaves Azure's network

**Exam tips:**
- ExpressRoute vs VPN Gateway: ExpressRoute is private and does not traverse the internet; VPN Gateway uses the internet with encryption. ExpressRoute is more reliable and expensive
- ACI vs AKS: ACI is for simple single-container tasks; AKS is for full orchestration of many containers
- App Service vs Functions: App Service runs continuously (always-on); Functions are event-driven and can scale to zero

### 2.3 Azure storage services

**What to learn:**
- **Azure Blob Storage** — unstructured object storage (files, images, videos, backups). Three tiers:
  - *Block blobs* — general purpose files
  - *Append blobs* — log files
  - *Page blobs* — VHD disk files
- **Azure Files** — managed file shares accessible via SMB or NFS; mountable on Windows, Linux, and macOS
- **Azure Queue Storage** — message queue for decoupling application components
- **Azure Table Storage** — NoSQL key-value store for structured, non-relational data
- **Azure Disk Storage** — managed disks attached to VMs (Standard HDD, Standard SSD, Premium SSD, Ultra Disk)
- **Storage account types**: Standard general-purpose v2 (most common), Premium block blobs, Premium file shares
- **Access tiers** (Blob only):
  - *Hot* — frequently accessed; highest storage cost, lowest access cost
  - *Cool* — infrequently accessed (stored 30+ days); lower storage, higher access cost
  - *Cold* — rarely accessed (stored 90+ days)
  - *Archive* — offline storage (stored 180+ days); cheapest storage, most expensive/slowest to retrieve (rehydration takes hours)
- **Redundancy options**:
  - *LRS* (Locally Redundant Storage) — 3 copies in one datacenter
  - *ZRS* (Zone-Redundant Storage) — 3 copies across 3 availability zones in one region
  - *GRS* (Geo-Redundant Storage) — LRS + async replication to a paired region (6 copies total)
  - *GZRS* (Geo-Zone-Redundant Storage) — ZRS + async replication to a paired region (highest durability)
- **Migration tools**: Azure Migrate (assess and migrate servers/databases), Azure Data Box (physical device for offline bulk data transfer)
- **File movement tools**: AzCopy (CLI tool), Azure Storage Explorer (GUI), Azure File Sync (sync on-premises file servers with Azure Files)

**Exam tips:**
- Archive tier data is *offline* — it must be *rehydrated* before access, which can take up to 15 hours
- GRS replicates to a paired region but the secondary is read-only by default (use RA-GRS for read access)
- Data Box is the answer when moving large volumes of data where network transfer would take too long or be too expensive

### 2.4 Azure identity, access, and security

**What to learn:**
- **Microsoft Entra ID** (formerly Azure Active Directory) — Azure's cloud-based identity provider; manages users, groups, and app registrations. Not the same as Windows Server Active Directory
- **Microsoft Entra Domain Services** — managed Active Directory Domain Services in the cloud without running domain controllers
- **Authentication vs Authorization** — authentication = who are you; authorization = what are you allowed to do
- **Authentication methods**: username/password, MFA, Single Sign-On (SSO), passwordless (Windows Hello, FIDO2, Microsoft Authenticator app)
- **External identities** — B2B (invite guest users from other organisations), B2C (customer identity management for apps)
- **Conditional Access** — policy-based control: grant/block access based on user, location, device compliance, risk level
- **Azure RBAC** — role-based access control; grant permissions at the management group, subscription, resource group, or resource scope. Principle of least privilege
- **Zero Trust** — never trust, always verify; assume breach; verify explicitly; use least-privilege access
- **Defense in depth** — layered security model: physical → identity → perimeter → network → compute → application → data
- **Microsoft Defender for Cloud** — security posture management and threat protection across Azure, hybrid, and multi-cloud environments; gives a Secure Score

**Exam tips:**
- Entra ID is not a replacement for on-premises AD — it is an identity platform for cloud and modern apps. Use Entra Domain Services if you need traditional domain join in the cloud
- RBAC denies by default — you must explicitly grant access; a deny assignment overrides a role assignment
- Conditional Access requires at least Microsoft Entra ID P1 (not included in the free tier)

---

## Domain 3 — Describe Azure Management and Governance (30–35%)

### 3.1 Cost management

**What to learn:**
- **Factors that affect cost**: resource type, consumption, region, bandwidth (egress), reservation vs on-demand
- **Azure Pricing Calculator** — estimate costs *before* deploying; configure services and see monthly cost projections
- **Total Cost of Ownership (TCO) Calculator** — compare on-premises cost vs Azure; used to build a business case for migration
- **Azure Cost Management + Billing** — analyse and control *existing* Azure spend; set budgets and alerts; view cost by tag/resource group
- **Tags** — name/value metadata pairs for cost allocation and resource organisation (up to 50 per resource; not inherited by default)
- **Azure support plans**: Basic (free), Developer (~$29/mo), Standard (~$100/mo), Professional Direct (~$1,000/mo), Premier/Unified (custom). Standard is minimum for 24/7 support; see [Cost Management guide](./07-cost-management.md)

**Exam tips:**
- Pricing Calculator ≠ TCO Calculator: Pricing = estimate Azure costs; TCO = compare Azure vs on-premises
- Cost Management analyses *existing* spend; Pricing Calculator estimates *future* spend

### 3.2 Governance and compliance

**What to learn:**
- **Azure Policy** — define rules that resources must comply with (e.g., "all VMs must use Premium SSD", "resources must have a CostCenter tag"). Can audit, deny, or auto-remediate
- **Policy initiatives** — group multiple policies into a single assignment; useful for regulatory frameworks (e.g., ISO 27001, PCI DSS)
- **Resource locks** — prevent accidental deletion or modification. Two types:
  - *CanNotDelete* — resources can be modified but not deleted
  - *ReadOnly* — resources cannot be modified or deleted (stronger; applies to all users including owners)
- **Microsoft Purview** — unified data governance platform; discover, classify, and manage data across on-premises, Azure, and multi-cloud. Also handles compliance, data cataloguing, and information protection
- **Service Trust Portal** — Microsoft's public portal for audit reports, compliance documentation, and trust-related information (ISO certs, SOC reports, GDPR materials)

**Exam tips:**
- ReadOnly lock overrides Owner permissions — even resource owners cannot modify a locked resource
- Azure Policy vs RBAC: Policy controls *what can be done* to resources; RBAC controls *who can do it*
- Azure Blueprints (being deprecated in favour of Template Specs + Policy) — was used to package policies, RBAC, and ARM templates into a repeatable environment definition

### 3.3 Managing and deploying Azure resources

**What to learn:**
- **Azure Portal** — web-based GUI; good for one-off tasks and exploration, but not suitable for repeatable deployments
- **Azure Cloud Shell** — browser-based shell built into the portal; supports both Bash (with Azure CLI) and PowerShell; no local install needed; persists files in an Azure storage account
- **Azure CLI** — cross-platform command-line tool (`az` commands); scriptable and automatable
- **Azure PowerShell** — PowerShell module for Azure; preferred in Windows-heavy environments
- **Azure Arc** — extend Azure management to resources *outside* of Azure (on-premises servers, other clouds, Kubernetes clusters); manage them as if they were Azure resources
- **Infrastructure as Code (IaC)** — declare your infrastructure in files rather than clicking through a portal; enables repeatability, version control, and automation
- **ARM templates** — JSON-based IaC for Azure; declarative; native to Azure; verbose but powerful
- **Bicep** — domain-specific language that compiles to ARM JSON; cleaner syntax, better tooling, Microsoft's recommended approach over raw ARM JSON

**Exam tips:**
- ARM templates and Bicep are *declarative* (describe the desired state); scripts (CLI, PowerShell) are *imperative* (describe the steps)
- Azure Arc is the answer whenever a question mentions managing non-Azure or on-premises resources through the Azure portal or policy

### 3.4 Monitoring tools

**What to learn:**
- **Azure Advisor** — free, personalised recommendation engine covering: Cost, Security, Reliability, Operational Excellence, and Performance
- **Azure Service Health** — three components:
  - *Azure Status* — global Azure platform outages (public page)
  - *Service Health* — outages and maintenance events that affect *your* subscriptions and regions
  - *Resource Health* — health of *your specific resources* (e.g., is this VM currently healthy?)
- **Azure Monitor** — centralised platform for collecting, analysing, and acting on telemetry from Azure and on-premises resources. Key sub-services:
  - *Metrics* — numeric time-series data (CPU%, requests/sec)
  - *Logs / Log Analytics* — query logs with KQL (Kusto Query Language)
  - *Alerts* — trigger notifications or actions when a threshold is crossed
  - *Application Insights* — APM (Application Performance Monitoring) for web apps; tracks requests, failures, dependencies, and user behaviour

**Exam tips:**
- Advisor vs Monitor: Advisor gives *recommendations* (what you *should* do); Monitor gives *visibility* (what is *happening*)
- Service Health vs Resource Health: Service Health = platform-wide events affecting your subscriptions; Resource Health = health of one specific resource
- Application Insights is part of Azure Monitor — it sends data into the same Log Analytics workspace

---

## Study Strategy

The exam is about recognising the right service/concept for a given scenario. You do not need to memorise CLI syntax or pricing numbers. Focus on:

1. **Know the terminology precisely** — many wrong answers are plausible but use slightly wrong terms
2. **Understand the shared responsibility model** — it underpins many questions across all domains
3. **Memorise the service comparison pairs**: VPN Gateway vs ExpressRoute, ACI vs AKS, Pricing Calculator vs TCO Calculator, ARM vs Bicep, Policy vs RBAC, etc.
4. **Domain 2 is 35–40%** — spend proportionally more time on compute, networking, storage, and identity
5. **Domain 3 governance tools are commonly underestimated** — Purview, Policy, locks, Advisor, and Service Health all appear regularly

### Recommended study path

1. [Microsoft Learn — AZ-900 learning paths](https://learn.microsoft.com/en-us/training/paths/microsoft-azure-fundamentals-describe-cloud-concepts/) (free, ~10 hours)
2. Read through the concept guides in this repo
3. Do the hands-on labs (reinforces the services mentally even if the exam doesn't test CLI)
4. Run the quiz bank (`cd quiz && node cli.js`)
5. Take the [free Microsoft practice assessment](https://learn.microsoft.com/en-us/credentials/certifications/exams/az-900/practice/assessment?assessment-type=practice&assessmentId=23) — it uses real exam-style questions

---

## Official Resources

- [AZ-900 Exam page](https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/)
- [Official study guide (skills measured)](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-900)
- [Free practice assessment](https://learn.microsoft.com/en-us/credentials/certifications/exams/az-900/practice/assessment?assessment-type=practice&assessmentId=23)
