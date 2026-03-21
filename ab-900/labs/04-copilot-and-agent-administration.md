# Lab 04: Microsoft 365 Copilot and Agent Administration

## Overview

Assign Copilot licenses, configure Copilot settings, monitor usage, create a SharePoint agent, and explore agent management.

### Learning Objectives

- Assign Microsoft 365 Copilot licenses to users
- Configure Copilot feature settings (web search, app-level toggles)
- Monitor Copilot usage and adoption
- Create a SharePoint agent
- Review agent approval and monitoring

## Prerequisites

- Microsoft 365 tenant with Copilot licenses (trial or paid)
- Global Administrator role
- A SharePoint site with some content

## Steps

### 1. Assign Copilot Licenses

1. Go to **Microsoft 365 admin center** (https://admin.microsoft.com)
2. Navigate to **Billing > Licenses**
3. Select **Microsoft 365 Copilot**
4. Click **Assign licenses**
5. Search for and select users
6. Click **Assign**

**Verify:** The assigned users should see the Copilot icon in their M365 apps (Word, Excel, Teams, etc.)

### 2. Configure Copilot Settings

1. In the M365 admin center, go to **Settings > Copilot**
2. Review and configure:
   - **Web search** — enable/disable Copilot's ability to search the web
   - **Plugins and connectors** — allow/block third-party integrations
   - **Copilot in specific apps** — enable/disable per app (Word, Excel, Teams, etc.)
3. If using pay-as-you-go, link an Azure subscription under billing settings

### 3. Monitor Copilot Usage

1. In the M365 admin center, go to **Reports > Usage**
2. Look for **Copilot** in the usage reports:
   - Active users over time
   - Actions per user
   - Most-used features by app
3. If available, open **Copilot Analytics** for deeper metrics:
   - Adoption trends
   - Feature-level usage
   - User engagement patterns

### 4. Use Copilot Across M365 Apps

Test Copilot in several apps (as a licensed user):

**Word:**
1. Open a new document
2. Click the Copilot icon or type "/" to start
3. Try: "Draft a project proposal for migrating email to Microsoft 365"

**Teams:**
1. After a meeting with transcription enabled, open the meeting recap
2. Ask Copilot: "Summarise the key decisions and action items"

**Outlook:**
1. Open a long email thread
2. Click "Summarise" to get a Copilot-generated summary
3. Click "Draft a reply" to have Copilot suggest a response

**Business Chat:**
1. Go to https://microsoft365.com/chat
2. Ask: "What are my upcoming meetings this week and any related documents?"
3. Note how Copilot pulls data across calendar, email, and files

### 5. Create a SharePoint Agent

1. Navigate to a SharePoint site with content (e.g., an HR policy site)
2. Click on the **Copilot** icon (or go to site settings > Copilot)
3. Click **Create agent**
4. Configure:
   - **Name:** HR Policy Assistant
   - **Description:** Answers questions about HR policies
   - **Knowledge source:** Select the current SharePoint site's document library
   - **Instructions:** "Answer questions about HR policies based on the documents in this site. Be concise and cite the source document."
5. **Test** the agent by asking questions about the site's content
6. **Publish** the agent (may require admin approval)

### 6. Review Agent Management

**In M365 admin center:**
1. Go to **Settings > Copilot** > **Agents** tab
2. View published agents and their usage statistics

**In Power Platform admin center** (https://admin.powerplatform.microsoft.com):
1. Navigate to **Environments** > select your environment
2. View **Copilot Studio agents**
3. Review:
   - Agent status (published, draft, pending approval)
   - Usage metrics (conversations, users)
   - Error logs (if any)

### 7. Manage Prompts

1. In any Copilot-enabled app, generate a useful response
2. **Save** the prompt as a favourite
3. **Share** it with your team
4. Navigate to your saved prompts and review/delete as needed

## Summary

You assigned Copilot licenses, configured Copilot settings, monitored usage, tested Copilot across M365 apps, created a SharePoint agent, and explored agent management in both admin centers.

## Key Takeaways

- Copilot licenses are assigned in **M365 admin center > Billing > Licenses**
- Admins can **enable/disable** web search and per-app Copilot features
- **Copilot Analytics** and **Usage reports** track adoption and engagement
- **SharePoint agents** are grounded in specific site content — ideal for departmental knowledge
- Agent management spans both the **M365 admin center** (usage) and **Power Platform admin center** (operations)
