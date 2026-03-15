# Azure Cloud Adoption Framework (CAF)

The Cloud Adoption Framework is Microsoft's structured guidance for organisations moving to Azure. For AZ-900 you need to understand what it is, what the stages are, and how tools like the Well-Architected Framework and landing zones fit in.

---

## What Is the Cloud Adoption Framework?

The **Azure Cloud Adoption Framework (CAF)** is a collection of documentation, best practices, tools, and guidance published by Microsoft to help organisations adopt Azure in a structured, repeatable way.

It answers the question: *"We've decided to move to Azure — now what do we actually do, and in what order?"*

The CAF is not a single product or service — it is a **methodology** that spans the entire journey from initial business strategy through to ongoing operations in the cloud.

**Key point for the exam:** The CAF is the recommended approach for organisations planning and executing a cloud migration or adoption. It is not a technical tool you deploy; it is a framework of guidance you follow.

---

## The CAF Lifecycle

The framework is organised into six phases that typically flow left to right, though in practice organisations often revisit earlier phases as they scale.

```
Strategy → Plan → Ready → Adopt → Govern → Manage
                              ↑
                       (Migrate | Innovate)
```

### 1. Strategy

Define *why* you are moving to cloud and what you want to achieve.

- Identify business motivations (cost reduction, agility, scaling for growth, exiting a datacenter)
- Define expected business outcomes (reduced operational costs, faster time to market)
- Build the business case — use the TCO Calculator to quantify financial benefits
- Identify the first project (a "quick win" to prove value and build organisational confidence)

**Exam link:** This is where CapEx → OpEx justification happens. The TCO Calculator is a CAF Strategy tool.

---

### 2. Plan

Translate the strategy into an actionable adoption plan.

- **Digital estate assessment** — inventory all on-premises workloads (servers, databases, apps) and decide what to do with each one
- **Rationalisation (the 5 Rs)** — for each workload, choose one of:

| Option | Name | Description |
|---|---|---|
| **Rehost** | Lift and shift | Move the workload to Azure VMs with no code changes. Fastest migration path. Tool: Azure Migrate |
| **Refactor** | Move and improve | Minor code changes to use PaaS services (e.g. move a web app to App Service) |
| **Rearchitect** | Redesign | Significant changes to the application architecture (e.g. break a monolith into microservices) |
| **Rebuild** | Build cloud-native | Discard the existing app and build a new one using cloud-native technologies |
| **Replace** | Drop and shop | Replace the application with a SaaS product (e.g. move on-premises email to Microsoft 365) |

- **Skills readiness plan** — identify training gaps in your team
- **Cloud adoption plan** — a prioritised backlog of workloads to migrate

---

### 3. Ready

Prepare the Azure environment before migrating anything.

- Create the **Azure landing zone** — a pre-configured, governance-ready Azure environment (subscriptions, management groups, policies, networking, identity) that workloads will land into
- Set up **management groups and subscriptions** for separation of environments (dev, staging, production)
- Configure **Azure Policy** baselines and RBAC
- Set up **hub-and-spoke networking**, connectivity to on-premises (VPN or ExpressRoute), and DNS
- Establish monitoring, alerting, and cost management from day one

**Landing zone** is a key CAF concept: rather than letting teams create ad-hoc subscriptions and resources, a landing zone is a standardised, governed foundation that every workload adopts.

---

### 4. Adopt

The actual cloud adoption work, split into two tracks that often run in parallel:

#### Migrate
Move existing on-premises workloads to Azure as-is or with minor changes.

1. **Assess** — use Azure Migrate to assess readiness, dependencies, and estimated costs
2. **Deploy** — provision the Azure environment (VMs, networking, storage)
3. **Release** — cut over traffic, decommission on-premises infrastructure

Tools: Azure Migrate, Azure Database Migration Service, Azure Site Recovery (for replication and DR)

#### Innovate
Build new cloud-native capabilities or modernise existing workloads.

- Build new apps using PaaS, containers, serverless
- Add AI/ML capabilities using Azure Cognitive Services or Azure Machine Learning
- Modernise data platforms with Azure Synapse Analytics or Azure Data Factory
- Deliver digital experiences faster by removing infrastructure management overhead

---

### 5. Govern

Establish and enforce guardrails to keep the cloud environment compliant, secure, and cost-controlled as it grows.

The CAF governance model is built around five disciplines:

| Discipline | What it controls |
|---|---|
| **Cost Management** | Budgets, tags, reserved instances, cost alerts |
| **Security Baseline** | Identity, network security, encryption standards |
| **Resource Consistency** | Naming conventions, tagging policies, resource locks |
| **Identity Baseline** | Entra ID, RBAC, conditional access, MFA enforcement |
| **Deployment Acceleration** | ARM templates, Bicep, infrastructure as code standards |

Azure tools used: Azure Policy, management groups, resource locks, Azure Cost Management, Microsoft Defender for Cloud.

---

### 6. Manage

Ongoing operations — keeping workloads healthy, performant, and continuously improving after migration.

- Define a **management baseline**: minimum monitoring, backup, and recovery capabilities for all workloads
- Use Azure Monitor, Log Analytics, and Azure Alerts for observability
- Use Azure Backup and Azure Site Recovery for business continuity
- Continuously review and optimise using Azure Advisor recommendations
- Classify workloads by criticality and apply appropriate SLAs

---

## Azure Well-Architected Framework

The **Well-Architected Framework (WAF)** is a complementary framework that provides guidance for designing and evaluating individual workloads. Where the CAF is about the *organisational journey*, the WAF is about *how to build well*.

The WAF is built around five pillars:

| Pillar | Description |
|---|---|
| **Reliability** | Design for failure; use redundancy, AZs, and disaster recovery |
| **Security** | Protect data and systems; apply zero trust, least privilege, encryption |
| **Cost Optimisation** | Eliminate waste; right-size resources, use reserved instances, autoscale |
| **Operational Excellence** | Automate deployments; use IaC, monitoring, and runbooks |
| **Performance Efficiency** | Match resource capacity to demand; use caching, CDN, and autoscaling |

**Exam tip:** The Well-Architected Framework pillars map closely to Azure Advisor's recommendation categories (Reliability, Security, Cost, Operational Excellence, Performance).

Microsoft provides a **Well-Architected Review** — a free assessment tool at [aka.ms/azure-waf](https://learn.microsoft.com/en-us/assessments/azure-architecture-review/) — that scores your workload against the five pillars and gives prioritised recommendations.

---

## CAF vs Well-Architected Framework

| | Cloud Adoption Framework | Well-Architected Framework |
|---|---|---|
| **Scope** | Organisation-wide cloud journey | Individual workload design |
| **Audience** | Leadership, architects, cloud teams | Architects, developers, engineers |
| **Focus** | Migration strategy, governance, operations | Architecture quality and best practices |
| **When to use** | Planning and executing cloud adoption | Designing or reviewing a specific workload |

---

## Key CAF Concepts for AZ-900

**Landing zone**
A pre-configured Azure environment with governance, networking, identity, and monitoring already in place. Workloads are deployed into a landing zone rather than ad-hoc subscriptions. Ensures consistency and compliance from the start.

**Digital estate**
The complete inventory of on-premises IT assets — servers, databases, applications, data — that an organisation wants to evaluate for cloud migration. Assessed during the Plan phase using Azure Migrate.

**The 5 Rs of rationalisation**
Rehost, Refactor, Rearchitect, Rebuild, Replace — the five options for what to do with each workload during migration planning. Rehost (lift and shift) is the fastest; Rebuild is the most work but most cloud-native.

**Cloud economics**
The financial shift from CapEx (buying servers) to OpEx (paying for consumption). The CAF Strategy phase builds the business case using TCO analysis, expected cost savings, and business outcomes.

---

## Exam Tips

- The CAF is about the **organisational** journey to cloud — strategy, planning, governance, and operations
- The Well-Architected Framework is about **individual workload** quality
- **Rehost (lift and shift)** using Azure Migrate is the fastest migration path in the CAF Adopt/Migrate track
- **Landing zones** are the CAF answer for "how do we set up Azure consistently for multiple teams or workloads"
- Azure Advisor recommendations align directly with the Well-Architected Framework pillars
- The CAF is free guidance — it is not a paid Azure service

---

## Official Resources

- [Azure Cloud Adoption Framework](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/)
- [Azure Well-Architected Framework](https://learn.microsoft.com/en-us/azure/well-architected/)
- [Well-Architected Review assessment](https://learn.microsoft.com/en-us/assessments/azure-architecture-review/)
- [Azure landing zones](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/landing-zone/)
