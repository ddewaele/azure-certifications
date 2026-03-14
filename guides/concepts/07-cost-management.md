# Cost Management and Pricing

Understanding how Azure charges you and how to control costs is a core AZ-900 topic.

---

## What Affects Your Azure Bill

### 1. Resource Type
Every resource has its own pricing model. VMs charge per hour of compute. Storage charges per GB stored. Functions charge per execution.

### 2. Consumption
Most resources are billed on usage: vCPU hours, GB transferred, requests processed, etc.

### 3. Region
The same resource in different regions can have different prices. Generally:
- US regions are cheapest
- European regions slightly higher
- Emerging market regions vary

### 4. Billing Zone (Bandwidth)
Data egress (outbound transfer) is charged and depends on the "zone" of the destination. Data transfer *into* Azure is free; transfer *out* costs money.

| Zone | Example regions |
|---|---|
| Zone 1 | West Europe, East US, Australia East |
| Zone 2 | Japan East, Southeast Asia |
| Zone 3 | Brazil South |
| DE Zone 1 | Germany regions |

### 5. Reserved vs On-Demand
- **On-demand (Pay-as-you-go)**: highest per-unit price, no commitment
- **Reserved Instances**: commit to 1 or 3 years, save up to 72%
- **Spot Instances**: use spare Azure capacity at up to 90% discount — can be evicted with 30s notice
- **Azure Hybrid Benefit**: bring your own Windows Server or SQL Server licenses to Azure

### 6. Azure Marketplace
Third-party software from the Azure Marketplace may include a software license cost on top of Azure infrastructure costs.

---

## Pricing Calculator

Use the [Azure Pricing Calculator](https://azure.microsoft.com/en-us/pricing/calculator/) to estimate costs before you deploy.

- Select services, configure options, see estimated monthly cost
- Export estimates as reports
- Compare regions and commitment models side by side

**Key exam tip:** The Pricing Calculator estimates costs for *new* resources. It does not analyze your existing deployments.

---

## Total Cost of Ownership (TCO) Calculator

The [TCO Calculator](https://azure.microsoft.com/en-us/pricing/tco/calculator/) helps you estimate the savings from migrating on-premises workloads to Azure.

- You input your current on-premises infrastructure (servers, storage, networking, labor)
- It calculates the estimated Azure equivalent cost
- Shows comparison over 1, 3, and 5 years
- Accounts for hardware, software licenses, electricity, datacenter space, IT labor

**Key exam tip:** TCO is for comparing *cloud vs on-premises*. Pricing Calculator is for estimating *Azure costs*.

---

## Azure Cost Management + Billing

The Azure Cost Management tool is built into the portal for analyzing and controlling your spending.

Features:
- **Cost analysis** — view spending by resource, service, tag, resource group, or time period
- **Budgets** — set spending thresholds and get alerts when you approach or exceed them
- **Recommendations** — Advisor surfaces underutilized resources you could right-size or shut down
- **Exports** — export cost data to a storage account for custom analysis

```bash
# View usage summary
az consumption usage list --billing-period-name "202502" --output table

# View budgets
az consumption budget list --output table
```

---

## Tags

Tags are name/value pairs attached to resources for organization and cost tracking.

```bash
# Tag a resource group
az group update \
  --name my-rg \
  --set tags.Environment=Dev tags.CostCenter=Engineering

# List all resource groups with a specific tag
az group list \
  --tag Environment=Dev \
  --output table
```

- Up to 50 tags per resource
- Tags are **not inherited** by default — a tag on a resource group doesn't automatically apply to resources inside it (but Azure Policy can enforce this)
- Use tags to split billing by team, project, environment, or department

---

## Cost-Saving Strategies

| Strategy | Savings potential | Notes |
|---|---|---|
| Deallocate VMs when not in use | High | Stop paying for compute overnight/weekends |
| Right-size resources | Medium | Use Advisor recommendations |
| Reserved Instances | Up to 72% | Commit to 1 or 3 years |
| Spot VMs | Up to 90% | Only for interruptible workloads |
| Azure Hybrid Benefit | Up to 40% | Requires existing Windows/SQL licenses |
| Dev/Test pricing | Medium | Cheaper rates for non-production subscriptions |
| Auto-shutdown schedules | Medium | Built into VM settings |
| Delete unused resources | High | Clean up test environments |
| Use free tiers | Variable | Many services have free tier allowances |

---

## Azure Support Plans

Every Azure subscription includes a **Basic** support plan at no cost. Paid plans add faster response times, technical support channels, and advisory services.

| Plan | Cost | Who it's for | Sev A response | Tech support channels |
|---|---|---|---|---|
| **Basic** | Free | All subscriptions | No SLA | Docs, community forums, Azure Advisor |
| **Developer** | ~$29/mo | Trial / non-production | 8 business hours | Email (business hours) |
| **Standard** | ~$100/mo | Production workloads | 1 hour | 24/7 email + phone |
| **Professional Direct** | ~$1,000/mo | Business-critical | 1 hour + proactive | 24/7 + advisory services |
| **Premier / Unified** | Custom | Enterprise-wide | 15 minutes | Dedicated Technical Account Manager |

**Severity levels** define how critical an issue is:
- **Severity A (Critical)** — complete business impact, production system down
- **Severity B (High)** — significant impact, system degraded but still running
- **Severity C (Moderate)** — minimal business impact, workaround available

### What's included in Basic (free)
- Azure Advisor recommendations
- Azure Service Health and status alerts
- Azure documentation and community forums
- Billing and subscription management support (unlimited, 24/7)

### Key distinctions for the exam

**Developer** is the cheapest *paid* plan. It does **not** include 24/7 support — business hours only.

**Standard** is the entry point for 24/7 technical support and is the minimum recommended for production workloads.

**Professional Direct** adds proactive guidance: onboarding reviews, monthly service reviews, and access to a pool of ProDirect delivery managers.

**Premier/Unified** is enterprise-grade: a dedicated Technical Account Manager (TAM), on-site support options, and custom support scope across all Microsoft products (not just Azure).

> **Exam tip:** The question often asks which plan is the *minimum* to get a feature. Memorise: 24/7 support starts at **Standard**; proactive advisory starts at **Professional Direct**; a dedicated TAM requires **Premier/Unified**.

---

## Azure Free Account

New Azure accounts include:
- **12 months free** of popular services (limited quantities): VMs, storage, databases
- **$200 credit** for the first 30 days to try any service
- **Always free** services: 55+ services with permanent free tiers (e.g., Functions — 1M executions/month, App Service — 10 apps on Free tier)

---

## Key Concepts Summary

| Tool/Concept | Purpose |
|---|---|
| Pricing Calculator | Estimate costs before deploying |
| TCO Calculator | Compare cloud vs on-premises costs |
| Cost Management | Analyze and control existing spend |
| Budgets | Alert when spend exceeds a threshold |
| Tags | Organize resources for cost allocation |
| Reserved Instances | Commit to 1–3 years for big discounts |
| Spot VMs | Use spare capacity cheaply (interruptible) |
| Azure Hybrid Benefit | Reuse existing Microsoft licenses |
