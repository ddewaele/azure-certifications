# Understand Data Protection and Governance Tasks for Microsoft 365 and Copilot (35-40%)

This is the **largest domain** on the AB-900 exam.

## Microsoft Purview

Microsoft Purview is the unified data governance, compliance, and risk management platform for Microsoft 365.

### Core Purview Capabilities

| Service | Description |
|---------|-------------|
| **Information Protection** | Classify and protect data using sensitivity labels (encryption, visual markings, access restrictions) |
| **Data Loss Prevention (DLP)** | Prevent accidental sharing of sensitive data via policies that detect and block sensitive content |
| **Insider Risk Management** | Detect and investigate risky user activities (data theft, policy violations, security violations) |
| **Communication Compliance** | Monitor communications for policy violations (harassment, regulatory compliance, conflicts of interest) |
| **Data Security Posture Management (DSPM) for AI** | Discover, monitor, and manage AI-related data security risks across Microsoft 365 and Copilot |
| **Data Lifecycle Management** | Manage data retention and deletion policies to meet regulatory and business requirements |

### Sensitivity Labels

Sensitivity labels classify and protect data:

| Label Action | Description |
|-------------|-------------|
| **Visual markings** | Headers, footers, watermarks on documents |
| **Encryption** | Restrict who can open and edit the document |
| **Access restrictions** | Control copy, print, forward, download |
| **Auto-labeling** | Automatically apply labels based on content patterns (e.g., credit card numbers) |

Labels can be applied to:
- Documents (Word, Excel, PowerPoint, PDF)
- Emails
- Meetings
- Sites and groups
- Schematised data assets

**Label priority:** Labels are ordered by priority. Higher-priority labels cannot be downgraded without justification.

### Data Classification

| Tool | Description |
|------|-------------|
| **Sensitive information types (SITs)** | Pattern-based detection (credit card numbers, SSN, passport numbers) |
| **Trainable classifiers** | AI-trained classifiers for content like resumes, source code, contracts |
| **Exact data match (EDM)** | Match against your own sensitive data (employee IDs, patient records) |
| **Content explorer** | Browse actual content that has been classified |
| **Activity explorer** | View labeling and protection activities across the organisation |

### Retention

Retention policies and labels control how long data is kept:

| Concept | Description |
|---------|-------------|
| **Retention policy** | Applied to locations (Exchange, SharePoint, Teams) — retain and/or delete content after a period |
| **Retention label** | Applied to individual items — more granular control than policies |
| **Retain** | Keep content for a specified period even if users delete it |
| **Delete** | Automatically remove content after a specified period |
| **Retain then delete** | Keep for X years, then automatically delete |

## Data Security Implications of Copilot

### How Copilot Accesses Data

- Copilot accesses **only the data the user already has permission to see**
- It uses the user's **existing Microsoft 365 permissions** (SharePoint, OneDrive, Exchange, Teams)
- Copilot does **not** bypass access controls or read data the user cannot access
- Responses are generated in real time and are **not stored** for training Microsoft's models

### Microsoft Graph and Copilot

- **Microsoft Graph** is the API that connects Microsoft 365 data (mail, files, calendar, people)
- Copilot uses Microsoft Graph to **find and retrieve relevant content** for the user
- The Graph respects all permissions, access controls, and compliance policies
- Copilot's quality depends on **well-organised, properly permissioned data**

### How Copilot Uses Permissions and Controls

| Layer | Protection |
|-------|-----------|
| **Microsoft 365 permissions** | Copilot only accesses data the user is authorised to see |
| **Microsoft Purview sensitivity labels** | Copilot respects encryption and access restrictions on labeled content |
| **Microsoft Purview DLP** | DLP policies apply to Copilot-generated content |
| **Microsoft Defender** | Threat detection applies to Copilot interactions |
| **Conditional Access** | Access to Copilot is governed by CA policies |

### Responsible AI Principles

Microsoft 365 Copilot follows responsible AI principles:
- **Fairness** — equitable treatment across users
- **Reliability and safety** — consistent, safe responses
- **Privacy and security** — data stays within the tenant boundary
- **Inclusiveness** — accessible to all users
- **Transparency** — users know when AI is generating content
- **Accountability** — Microsoft and admins are accountable for Copilot behaviour

## Identifying Data Protection and Governance Risks

### Compliance Manager

- Dashboard showing your organisation's **compliance posture**
- **Compliance score** — percentage-based measure of regulatory compliance
- **Improvement actions** — specific steps to improve compliance (e.g., enable MFA, configure DLP)
- **Assessments** — evaluate compliance against standards (GDPR, ISO 27001, NIST)

### Data Explorer

- **Content explorer** — browse content that has been classified with sensitivity labels or sensitive information types
- **Activity explorer** — view labeling, DLP, and protection activity across the organisation

### Insider Risk Management

Detects risky activities based on signals:
- Data theft by departing employees
- Intentional or accidental data leaks
- Security policy violations
- Sequence detection (suspicious activity patterns)

### DLP Alerts

- DLP policies generate **alerts** when sensitive content is detected in emails, documents, or chats
- Admins **investigate and respond** to alerts in the Purview compliance portal
- Actions: notify the user, block sharing, escalate to a reviewer

### Communication Compliance

- Monitors **messages** (Teams, Exchange, Viva Engage) for policy violations
- Detects: harassment, threats, regulatory violations, conflicts of interest
- Generates **policy match alerts** for review

### DSPM for AI

Data Security Posture Management for AI:
- **Discover** AI usage across the organisation (Copilot, third-party AI)
- **Monitor** data flow to and from AI services
- **Manage** policies to control AI data access
- **Report** on AI activity and data security posture

### Content Search and eDiscovery

- **Content search** — find files and emails across Exchange, SharePoint, and OneDrive
- **eDiscovery** — legal hold, search, export for litigation and compliance investigations

## Oversharing in SharePoint

Oversharing occurs when users have access to more data than they need — a critical risk because **Copilot surfaces everything the user can access**.

### Tools for Troubleshooting Oversharing

| Tool | Description |
|------|-------------|
| **Data access governance reports** | Show sharing activity, permissions, and external access across SharePoint sites |
| **Site access review** | Review who has access to specific sites and content |
| **Sharing audits** | Track sharing events in the unified audit log |
| **Permission reports** | Identify sites with broad access (Everyone, All Users) |

### SharePoint Advanced Management

| Feature | Description |
|---------|-------------|
| **Restricted site access** | Limit site access to members of a specific security group only |
| **Restricted access control for SharePoint sites** | Block access from unmanaged devices or external users |
| **Data access governance** | Reports and insights on sharing, permissions, and access patterns |
| **Site lifecycle management** | Identify and manage inactive sites |
| **Conditional access policy for sites** | Apply specific CA policies to individual SharePoint sites |

## Exam Tips

- This is the **largest domain** (35-40%) — expect the most questions here
- **Copilot respects existing permissions** — it does not bypass access controls
- **Microsoft Graph** is how Copilot finds relevant content using the user's permissions
- Know all **Purview services** and their purpose: Information Protection, DLP, Insider Risk, Communication Compliance, DSPM for AI, Data Lifecycle Management
- **Sensitivity labels** classify and protect data (encryption, visual markings, access restrictions)
- **Retention** = how long to keep data; **DLP** = prevent sharing sensitive data
- **Compliance Manager** gives a compliance score with improvement actions
- **DSPM for AI** is specifically for discovering and managing AI-related data security
- **Oversharing** is critical for Copilot because Copilot surfaces everything the user can access
- **SharePoint Advanced Management** features: restricted site access, data access governance reports
- Know the difference between **Content explorer** (browse classified content) and **Activity explorer** (view labeling activities)
