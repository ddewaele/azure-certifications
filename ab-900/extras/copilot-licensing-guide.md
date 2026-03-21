# Microsoft 365 Copilot Licensing Guide

## Licensing Requirements

### Base License + Copilot Add-on

Microsoft 365 Copilot requires a **qualifying base license** plus the **Copilot add-on**:

| Base License Tier | Qualifies for Copilot? | Typical Audience |
|-------------------|----------------------|------------------|
| Microsoft 365 E3 | Yes | Enterprise |
| Microsoft 365 E5 | Yes | Enterprise (advanced security/compliance) |
| Microsoft 365 Business Standard | Yes | SMB |
| Microsoft 365 Business Premium | Yes | SMB (with security) |
| Microsoft 365 F1 / F3 | No (frontline plans) | Frontline workers |
| Office 365 E1 | No | Legacy plan |
| Microsoft 365 E3 (no Teams) | No | Specific regions |

### Copilot Add-on Pricing

- **Per-user/month** — fixed monthly cost per assigned user
- Includes Copilot in all supported M365 apps (Word, Excel, PowerPoint, Outlook, Teams, OneNote, Loop, Business Chat)

### Pay-as-you-Go

- **Consumption-based billing** linked to an Azure subscription
- Available for:
  - **Copilot in SharePoint** — AI-powered search and content generation within SharePoint
  - **Agent usage** — custom and SharePoint agent interactions
- Does **not** require per-user Copilot licenses
- Billed based on actual usage (messages, tokens consumed)

## What Each License Gets You

### With Copilot Per-User License

| Feature | Included |
|---------|----------|
| Copilot in Word | Yes |
| Copilot in Excel | Yes |
| Copilot in PowerPoint | Yes |
| Copilot in Outlook | Yes |
| Copilot in Teams (meetings, chat) | Yes |
| Business Chat (microsoft365.com/chat) | Yes |
| Copilot Pages | Yes |
| Researcher | Yes |
| Analyst | Yes |
| Create agents | Yes (subject to admin policies) |
| Use published agents | Yes |

### With Pay-as-you-Go Only (No Per-User Copilot License)

| Feature | Included |
|---------|----------|
| Copilot in M365 apps | No |
| Copilot in SharePoint | Yes (metered) |
| Use published agents | Yes (metered) |
| Create agents (Copilot Studio) | Depends on Copilot Studio licensing |

## Admin Billing Tasks

### Assigning Licenses

1. **M365 admin center** > Billing > Licenses > Microsoft 365 Copilot
2. Assign to users or groups
3. Group-based licensing automatically assigns to all group members

### Configuring Pay-as-you-Go

1. **M365 admin center** > Settings > Copilot > Billing
2. Link an Azure subscription
3. Set budget alerts and spending limits
4. Monitor consumption in the billing dashboard

### Monitoring Costs

| Tool | What It Shows |
|------|-------------|
| M365 admin center billing | License counts, subscription status |
| Azure Cost Management | Pay-as-you-go consumption, spending trends |
| Copilot Analytics | Usage per user, which helps justify license spend |

## Common Licensing Questions

**Q: Can a user use Copilot with only an E3 license?**
A: No. E3 is the base license, but you also need the Copilot add-on assigned.

**Q: Can we use Copilot in SharePoint without per-user licenses?**
A: Yes, via pay-as-you-go billing linked to an Azure subscription.

**Q: Do agents require Copilot licenses for end users?**
A: Users can interact with published agents via pay-as-you-go without per-user Copilot licenses.

**Q: Can we assign Copilot to a security group?**
A: Yes, use group-based licensing in Entra ID or assign via the M365 admin center.
