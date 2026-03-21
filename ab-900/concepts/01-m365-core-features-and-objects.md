# Identify the Core Features and Objects of Microsoft 365 Services (30-35%)

This is the **second-largest domain** on the AB-900 exam.

## Core Objects of Microsoft 365 Services

### Licensing

| Concept | Description |
|---------|-------------|
| **User licenses** | Assigned per user to grant access to M365 apps (e.g., Microsoft 365 E3, E5, Business Premium) |
| **Group-based licensing** | Assign licenses to a group; members automatically receive the license |
| **Copilot license** | Requires a qualifying M365 base license (E3/E5/Business Premium) plus a Microsoft 365 Copilot add-on |
| **Pay-as-you-go** | Consumption-based billing for Copilot in SharePoint and agent usage |

License types affect which features users can access:
- **E3** — core productivity, security, and compliance features
- **E5** — adds advanced security (Defender XDR), compliance (Purview), analytics, and phone system
- **Business Basic/Standard/Premium** — SMB tiers with varying feature sets
- **Copilot add-on** — required on top of base license for Copilot features

### Microsoft 365 Admin Center

The central portal for managing the M365 tenant:

| Area | What You Configure |
|------|-------------------|
| **Domain names** | Add and verify custom domains (e.g., contoso.com) |
| **Org settings** | Organisation profile, release preferences, security defaults |
| **Users** | Create, edit, delete users; assign licenses and roles |
| **Groups** | Microsoft 365 groups, security groups, distribution groups |
| **Billing** | Subscriptions, licenses, payment methods |
| **Health** | Service health, message centre for updates |

### Exchange Online Admin Center

| Object | Description |
|--------|-------------|
| **Mailboxes** | User mailboxes, shared mailboxes, resource mailboxes (rooms, equipment) |
| **Distribution lists** | Email groups for sending to multiple recipients |
| **Mail flow rules** | Transport rules for routing, filtering, and modifying messages |
| **Connectors** | Routes mail between M365 and on-premises or third-party systems |

### SharePoint Admin Center

| Object | Description |
|--------|-------------|
| **Sites** | Team sites (collaboration) and communication sites (broadcasting) |
| **Libraries** | Document storage within sites (files, versioning, metadata) |
| **Folders** | Organise documents within libraries |
| **Site permissions** | Owner, Member, Visitor roles; sharing settings |
| **Hub sites** | Connect related sites under a common navigation and search |

**SharePoint roles and permissions:**

| Role | Permissions |
|------|------------|
| **Site Owner** | Full control — manage settings, permissions, content |
| **Site Member** | Edit — add, edit, delete content |
| **Site Visitor** | Read — view content only |

### Teams Admin Center

| Object | Description |
|--------|-------------|
| **Teams** | Collaboration workspaces with channels, chat, meetings |
| **Channels** | Standard (visible to all members), Private (restricted), Shared (cross-team) |
| **Policies** | Messaging policies, meeting policies, app permission policies |
| **Apps** | Manage which apps are available in Teams |

## Microsoft 365 Security Principles

### Zero Trust

Zero Trust is a security model that assumes no user or device is trusted by default.

**Three core principles:**

| Principle | Description |
|-----------|-------------|
| **Verify explicitly** | Always authenticate and authorise based on all available data points (identity, location, device, service) |
| **Use least privilege access** | Limit access to only what is needed, using JIT/JEA and risk-based policies |
| **Assume breach** | Minimise blast radius, segment access, verify end-to-end encryption, use analytics for detection |

### Authentication and Authorisation

| Concept | Description |
|---------|-------------|
| **Authentication** | Verifying identity — "Who are you?" (passwords, MFA, biometrics) |
| **Authorisation** | Verifying permissions — "What can you access?" (roles, policies) |
| **MFA** | Requires two or more verification methods (something you know + have + are) |
| **Passwordless** | Authentication without passwords: Windows Hello, FIDO2 keys, Microsoft Authenticator |

### Threat Protection

| Service | Description |
|---------|-------------|
| **Microsoft Defender XDR** | Unified threat detection and response across identities, endpoints, email, apps, and data |
| **Defender for Office 365** | Protects against phishing, malware, and BEC in email and collaboration tools |
| **Defender for Endpoint** | Endpoint detection and response (EDR) for devices |
| **Defender for Identity** | Detects identity-based threats (compromised accounts, lateral movement) |
| **Defender for Cloud Apps** | CASB — discovers and controls shadow IT and cloud app usage |

## Core Security Features

### Microsoft Entra ID

| Feature | Description |
|---------|-------------|
| **Users and groups** | Manage identities and group memberships |
| **Conditional Access** | Policy-based access control: if [condition], then [grant/block] |
| **SSO (Single Sign-On)** | One set of credentials to access all connected apps |
| **Identity Secure Score** | Percentage-based score measuring identity security posture with recommendations |
| **PIM (Privileged Identity Management)** | Just-in-time privileged access — activate roles only when needed, with approval and time limits |
| **App registrations** | Register applications to use Entra ID for authentication |
| **Enterprise apps** | Manage third-party and custom apps connected to Entra ID |

### Conditional Access Policies

Conditional Access enforces access decisions based on signals:

| Signal | Examples |
|--------|---------|
| **User / group** | Specific users or group memberships |
| **Location** | Named locations, IP ranges, countries |
| **Device** | Compliance status, OS, device type |
| **Application** | Which app is being accessed |
| **Risk level** | Sign-in risk, user risk (from Identity Protection) |

**Actions:** Grant access (with MFA, compliant device), Block access, Require session controls.

### Troubleshooting Sign-In Issues

| Tool | Use Case |
|------|----------|
| **Sign-in logs** | View all sign-in attempts, results, and applied policies |
| **Conditional Access "What If"** | Simulate policies to see which would apply to a given scenario |
| **Audit logs** | Track admin and user activity changes |
| **Risky sign-ins report** | Identify potentially compromised sign-in attempts |

### Audit Logs

- **Sign-in logs** — every authentication attempt (success/failure, CA policy applied, MFA prompted)
- **Audit logs** — directory changes (user created, role assigned, password reset)
- **Unified audit log** — cross-service activity (Exchange, SharePoint, Teams, Entra)

## Exam Tips

- Know the **three Zero Trust principles**: verify explicitly, least privilege, assume breach
- Understand **license types** and that Copilot requires a qualifying base license + add-on
- Know what you configure in each **admin center** (M365, Exchange, SharePoint, Teams)
- **Conditional Access** = if/then policies based on signals (user, location, device, risk)
- **SSO** = one login for all apps; **MFA** = multiple verification factors
- **PIM** provides just-in-time privileged access, not permanent admin roles
- **Identity Secure Score** measures your security posture and gives recommendations
- SharePoint roles: **Owner** (full control), **Member** (edit), **Visitor** (read)
- Know the difference between **authentication** (who are you?) and **authorisation** (what can you access?)
- **Microsoft Defender XDR** is the unified threat detection platform across all M365 services
