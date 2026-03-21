# Deep Dive: How Microsoft 365 Copilot Accesses Data

## The Data Flow

When a user asks Copilot a question, this is what happens behind the scenes:

```
User prompt
  → Copilot service (Azure OpenAI)
  → Microsoft Graph (using user's identity and permissions)
  → Retrieves relevant content from M365 (mail, files, calendar, chats)
  → LLM generates response using retrieved context
  → Response returned to user
```

## Key Principles

### 1. Copilot = User's Permissions

Copilot **never** sees data the user cannot see. It uses the Microsoft Graph API with the user's own OAuth token, so all access controls apply:

- SharePoint site permissions (Owner/Member/Visitor)
- OneDrive sharing settings
- Exchange mailbox access
- Teams channel membership
- Sensitivity label encryption

### 2. Microsoft Graph is the Gateway

Microsoft Graph is the unified API for M365 data. Copilot calls Graph to:

- Search for relevant documents (SharePoint, OneDrive)
- Read email threads (Exchange)
- Access calendar events
- Retrieve Teams messages and meeting transcripts
- Look up people and org chart

Graph returns only data the user is authorised to access.

### 3. No Data Leaves the Tenant Boundary

- Prompts and responses are processed within the **Microsoft 365 trust boundary**
- Your data is **not used to train** Microsoft's foundation models
- Data residency commitments apply — data stays in your geo
- Enterprise data protection applies (encryption in transit and at rest)

## Why Oversharing Matters

Before Copilot, oversharing was a quiet problem — users technically had access to files they never found or opened. With Copilot, that changes:

| Before Copilot | With Copilot |
|---------------|-------------|
| User has access to HR site but never visits it | User asks "What is the parental leave policy?" and Copilot surfaces HR documents |
| User has access to executive SharePoint but doesn't know | User asks about company strategy and Copilot pulls from executive site |
| Shared links with "Anyone in the org" go unused | Copilot finds and uses these documents in responses |

### How to Fix Oversharing Before Deploying Copilot

1. **Audit SharePoint permissions** — run data access governance reports
2. **Remove "Everyone" and "Everyone except external users" permissions** where not needed
3. **Use restricted site access** (SharePoint Advanced Management) for sensitive sites
4. **Review sharing links** — convert "Anyone in org" links to specific people/groups
5. **Apply sensitivity labels** to protect sensitive documents with encryption
6. **Enable DLP policies** to prevent sensitive content from being shared inappropriately

## The Permission Inheritance Chain

```
Tenant (Global settings)
  └── Site collection (SharePoint site)
       └── Library (document library)
            └── Folder (optional)
                 └── Document (file-level permissions if broken inheritance)
```

Copilot respects permissions at **every level** of this chain.

## Practical Checks Before Copilot Deployment

| Check | How |
|-------|-----|
| Sites with broad access | Data access governance report > filter for "Everyone" permissions |
| External sharing | SharePoint admin center > Sharing settings per site |
| Sensitivity labels applied | Purview > Data classification > Content explorer |
| DLP policies active | Purview > DLP > Policies |
| Inactive sites | SharePoint Advanced Management > Site lifecycle |
| Guest access | Entra ID > External identities > Cross-tenant access |
