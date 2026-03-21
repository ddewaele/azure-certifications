# Perform Basic Administrative Tasks for Copilot and Agents (25-30%)

## Features and Capabilities of Copilot and Agents

### Microsoft 365 Copilot

Microsoft 365 Copilot is an AI assistant integrated into Microsoft 365 apps that helps users with productivity tasks.

| App | Copilot Capabilities |
|-----|---------------------|
| **Word** | Draft, rewrite, summarise, transform documents |
| **Excel** | Analyse data, create formulas, generate charts, identify trends |
| **PowerPoint** | Create presentations from prompts or documents, design slides |
| **Outlook** | Summarise email threads, draft replies, prioritise inbox |
| **Teams** | Summarise meetings, list action items, catch up on missed conversations |
| **OneNote** | Summarise notes, generate plans, rewrite content |
| **Loop** | Collaborative content creation with AI assistance |

### Built-in Copilot Features

| Feature | Description |
|---------|-------------|
| **Researcher** | Searches the web and internal data to find information and generate summaries for research tasks |
| **Analyst** | Works with data in Excel and other sources to provide insights, trends, and analysis |
| **Copilot Pages** | Collaborative AI-generated content that can be shared and edited in a persistent canvas |
| **Copilot in Business Chat** | Cross-app chat interface that can access data from all M365 apps via Microsoft Graph |

### Agents

| Agent Type | Description |
|-----------|-------------|
| **Built-in agents** | Pre-built agents in M365 (e.g., meeting recap, email summary) |
| **Custom agents** | Admin/user-created agents for specific tasks using Copilot Studio or declarative agents |
| **SharePoint agents** | Agents grounded in specific SharePoint site content |

### Copilot vs Agents

| Aspect | Microsoft 365 Copilot | Agents |
|--------|----------------------|--------|
| **Scope** | General-purpose assistant across M365 apps | Task-specific or domain-specific |
| **Data access** | All data the user can access via Graph | Can be scoped to specific data sources |
| **Customisation** | Limited to prompt/system message | Fully customisable with tools, knowledge, and actions |
| **Creation** | Pre-built by Microsoft | Created by admins, developers, or power users |

### Licensing Models

| Model | Description |
|-------|-------------|
| **Monthly per-user license** | Microsoft 365 Copilot add-on license (per user/month) |
| **Pay-as-you-go** | Consumption-based billing for Copilot in SharePoint and agent usage (Azure metered billing) |

Key licensing facts:
- Copilot requires a **qualifying base license** (M365 E3, E5, Business Standard, Business Premium, etc.)
- **Pay-as-you-go** is available for SharePoint Copilot scenarios without per-user Copilot licenses
- Agents can use either licensed Copilot or pay-as-you-go billing

### Copilot Feature Management

Admins can enable/disable specific Copilot features:

| Setting | Description |
|---------|-------------|
| **Web content** | Allow Copilot to search the web for additional context |
| **Copilot in specific apps** | Enable/disable Copilot in Word, Excel, PowerPoint, Outlook, Teams individually |
| **Plugins/connectors** | Allow or block third-party plugins |
| **Data access** | Configure which data sources Copilot can access |

## Basic Administrative Tasks for Copilot

### Assigning Copilot Licenses

1. Go to **Microsoft 365 admin center** > **Billing** > **Licenses**
2. Select the **Microsoft 365 Copilot** license
3. Assign to individual users or groups
4. Users must also have a qualifying base license (E3/E5/Business Premium)

Or via PowerShell:
```powershell
Set-MgUserLicense -UserId "user@contoso.com" -AddLicenses @{SkuId = "<copilot-sku-id>"} -RemoveLicenses @()
```

### Managing Pay-as-you-Go Billing

- Configure in **Microsoft 365 admin center** > **Settings** > **Copilot**
- Link an Azure subscription for metered billing
- Set spending limits and budget alerts
- Monitor consumption in the billing dashboard

### Monitoring Copilot Usage and Adoption

| Tool | What It Shows |
|------|-------------|
| **Copilot Analytics** | Usage metrics, adoption trends, active users, feature usage |
| **Microsoft 365 admin center usage reports** | Overall M365 usage including Copilot |
| **Viva Insights** | Productivity impact of Copilot (time saved, meetings summarised) |
| **Microsoft Graph API** | Programmatic access to Copilot usage data |

Key metrics to track:
- Number of active Copilot users
- Copilot actions per user per day/week
- Most-used Copilot features (by app)
- Adoption rate over time

### Managing Prompts

Users and admins can manage prompts:

| Action | Description |
|--------|-------------|
| **Save** | Save frequently used prompts as favourites |
| **Share** | Share prompts with team members or the organisation |
| **Schedule** | Schedule prompts to run at specific times (e.g., daily summary) |
| **Delete** | Remove saved or shared prompts |

## Basic Administrative Tasks for Agents

### Configuring User Access to Agents

- Control which users can **create** agents (via Copilot Studio access policies)
- Control which users can **use** published agents (via M365 app policies or Teams app policies)
- Configure agent availability in the **Microsoft 365 admin center** or **Power Platform admin center**

### Creating an Agent

Agents can be created in several ways:

| Method | Audience | Description |
|--------|----------|-------------|
| **Copilot Studio** | Power users, admins | Full-featured agent builder with topics, actions, knowledge, and authentication |
| **SharePoint** | Site owners | Create agents grounded in specific site content |
| **Declarative agents** | Developers | Code-first approach using manifest and plugin definitions |
| **Teams** | Admins | Deploy agents as Teams apps |

### Agent Approval Process

- Agents created by users may require **admin approval** before publishing
- Approval workflows are configured in the **Power Platform admin center**
- Admins review the agent's: data sources, capabilities, permissions, and scope
- Approved agents become available in the organisation's agent catalog

### Monitoring Agents

| Area | Where to Monitor |
|------|-----------------|
| **Usage** | Microsoft 365 admin center — agent usage reports |
| **Operational insights** | Power Platform admin center — agent performance, errors, conversation logs |
| **Agent lifecycle** | Power Platform admin center — creation, updates, publishing, deprecation |
| **Billing** | M365 admin center — pay-as-you-go consumption for agent usage |

## Exam Tips

- Know the difference between **Copilot** (general-purpose assistant) and **agents** (task-specific)
- **Copilot requires a qualifying base license** (E3/E5/Business Premium) plus the Copilot add-on
- **Pay-as-you-go** is consumption-based billing linked to an Azure subscription
- **Researcher** finds information; **Analyst** analyses data — know the use cases
- Admins can **enable/disable** Copilot features per app and control web search access
- **Copilot Analytics** tracks usage and adoption; **Viva Insights** measures productivity impact
- Agents created by users may require **admin approval** before being published
- Monitor agents in both the **M365 admin center** (usage) and **Power Platform admin center** (operational insights)
- **SharePoint agents** are grounded in specific site content — useful for department-specific knowledge
- Know how to **assign licenses** (admin center > Billing > Licenses or PowerShell)
- Prompts can be **saved, shared, scheduled, and deleted**
