# Manage Azure Identities and Governance (20-25%)

This is one of the **two largest domains** on the AZ-104 exam, tied with Deploy and Manage Compute Resources.

---

## Microsoft Entra ID Overview

Microsoft Entra ID (formerly Azure Active Directory) is the cloud-based identity and access management service for Azure and Microsoft 365.

| Concept | Description |
|---------|-------------|
| **Tenant** | A dedicated instance of Entra ID representing an organisation |
| **Directory** | Container for users, groups, and app registrations |
| **Domain** | The DNS domain name associated with the tenant (e.g., contoso.onmicrosoft.com) |
| **Subscription** | Linked to a single Entra tenant; trust relationship for identity |

### Entra ID is PaaS, not IaaS

Entra ID is a **Platform as a Service** offering — Microsoft manages the infrastructure. This means:
- No domain controllers to deploy or patch
- No AD replication to configure
- Less control over implementation, but zero operational overhead

> Deploying AD DS on an Azure VM is **not** the same as using Entra ID. An AD DS VM gives you a traditional domain controller in the cloud; Entra ID is a cloud-native identity service.

### Entra ID Tenants

- Each tenant is an **isolated** directory instance (Entra ID is multi-tenant by design)
- A tenant typically represents one organisation; created automatically when signing up for Azure, M365, or Intune
- Default domain: `<prefix>.onmicrosoft.com` — custom domains can be added
- **One subscription → one tenant** (trust relationship), but one tenant can back **multiple subscriptions**
- You can create multiple tenants within one subscription (e.g., for testing)

### Entra ID Schema vs AD DS Schema

| Concept | AD DS | Entra ID |
|---------|-------|----------|
| Structure | Hierarchical (X.500) | Flat |
| Computer objects | Yes (domain-join) | Device objects only (modern join) |
| OUs | Yes (for GPO scoping) | No OUs |
| Group Policy (GPOs) | Yes | No (use Intune/Conditional Access) |
| Query protocol | LDAP | REST API (HTTP/HTTPS) |
| Authentication protocol | Kerberos | SAML, WS-Federation, OpenID Connect |
| Authorization | Kerberos tickets | OAuth 2.0 |
| Schema extensibility | Complex | Easily extensible and reversible |

**No OUs** means you can't scope GPOs the traditional way — use group membership and Conditional Access policies instead.

**Application objects**: Entra ID uses two classes — `Application` (the definition, registered once) and `ServicePrincipal` (the instance in each tenant). This allows one app registration to be used across multiple tenants.

### Entra ID as a Directory for Cloud Apps

- Each cloud service (M365, Intune, Dynamics 365) can share **one** Entra tenant instead of maintaining separate directories
- Supports SSO across Microsoft services and third-party providers (Google, Facebook, Yahoo)
- Azure App Service: enable Entra authentication directly from the **Authentication/Authorization** blade — restrict a web app to users in a specific tenant

### Entra ID License Tiers

| Feature | Free | P1 | P2 |
|---------|------|----|----|
| Basic user/group management | Yes | Yes | Yes |
| SSO (up to 10 apps) | Yes | Yes | Yes |
| SSO (unlimited apps) | No | Yes | Yes |
| Conditional Access (device/group/location) | No | Yes | Yes |
| Self-service password reset | No | Yes | Yes |
| SSPR with on-premises writeback | No | Yes | Yes |
| MFA (full, including on-prem VPN/RADIUS) | Limited | Yes | Yes |
| Self-service group management | No | Yes | Yes |
| Advanced security reports (ML-based anomalies) | No | Yes | Yes |
| Microsoft Identity Manager (MIM) licensing | No | Yes | Yes |
| Cloud App Discovery | No | Yes | Yes |
| Entra Connect Health | No | Yes | Yes |
| Enterprise SLA 99.9% | No | Yes | Yes |
| Identity Protection (user/sign-in risk policies) | No | No | Yes |
| Privileged Identity Management (PIM) | No | No | Yes |

**P1 key additions**: Conditional Access, SSPR with writeback, full MFA, self-service group management, Cloud App Discovery.
**P2 adds**: Identity Protection (risk-based policies) and PIM (just-in-time privileged access).

> Plans change — always verify current capabilities at Microsoft's website.

### Microsoft Entra Domain Services (Entra DS)

Entra DS provides **managed domain services** (Kerberos auth, NTLM, LDAP, Group Policy, domain join) without needing to deploy or manage domain controllers.

**Use case**: Lift-and-shift legacy apps that rely on Kerberos/NTLM/LDAP but you don't want to maintain AD DS VMs in Azure.

| Aspect | Description |
|--------|-------------|
| **What it provides** | Domain join, Group Policy, Kerberos/NTLM auth, LDAP |
| **Compatible with** | On-premises AD DS (sync via Entra Connect) |
| **Cloud-only option** | Yes — works without any on-premises AD DS |
| **Licensing** | Requires Entra ID P1 or P2 |
| **Billing** | Per hour, based on directory size |

**Limitations to know for the exam:**

- Only base computer AD object is supported (no schema extensions)
- OU structure is **flat** — nested OUs not supported
- Built-in GPOs only; no WMI filters or security-group filtering on GPOs
- Cannot extend the schema

**Benefits over running AD DS on Azure VMs:**
- No need to manage/patch domain controllers
- No AD replication to configure
- No Domain Admins or Enterprise Admins groups needed

---

## Manage Microsoft Entra Users and Groups

### User Types

| Type | Description | Notes |
|------|-------------|-------|
| **Cloud identity** | Created directly in Entra ID | No on-premises dependency |
| **Synchronized identity** | Synced from on-premises AD via Entra Connect | Password hash or pass-through auth |
| **Guest user** | External identity (B2B) invited to the tenant | Uses their own org credentials |

### Create and Manage Users

Key user properties:
- **UPN (User Principal Name)** — sign-in name (user@contoso.com)
- **Display name** — shown in directory and apps
- **Usage location** — required for license assignment
- **Job info** — title, department, manager (optional but useful for dynamic groups)

Bulk user operations via CSV upload or PowerShell/Azure CLI.

### Groups

| Group Type | Use Case | Membership |
|------------|----------|------------|
| **Security group** | Control access to resources and apps | Assigned or dynamic |
| **Microsoft 365 group** | Collaboration (Teams, SharePoint, Outlook) | Assigned only |
| **Mail-enabled security** | Email + resource access | Assigned only |
| **Distribution group** | Email only, no access control | Assigned only |

### Dynamic Membership Rules

Dynamic groups automatically add/remove members based on user attributes:

```
(user.department -eq "Finance") -and (user.accountEnabled -eq true)
```

Requires Entra ID P1 or higher.

### Manage Licenses

- Licenses must be assigned to users or groups
- User must have a **Usage location** set before license assignment
- **Group-based licensing** (P1) — assign license to group; members automatically receive it
- License conflicts (e.g., incompatible plan combinations) surfaced in the portal

### External Users (B2B)

| Concept | Description |
|---------|-------------|
| **Guest user** | Invited external identity; uses their home tenant credentials |
| **B2B collaboration** | Share resources with external users without managing their passwords |
| **Invitation redemption** | Guest receives email invite; must accept before accessing resources |
| **External Identities policies** | Control who can invite guests, what domains are allowed |

### Self-Service Password Reset (SSPR)

| Setting | Options |
|---------|---------|
| **Scope** | None, Selected (group), All |
| **Auth methods** | Email, mobile phone, office phone, security questions, authenticator app |
| **Number of methods required** | 1 or 2 |
| **Registration** | Required at next sign-in, or admin-triggered |
| **On-premises writeback** | Requires Entra ID P1 + Entra Connect |

---

## Device Management

Entra ID supports three distinct device states, each targeting a different ownership and trust model.

### Device Join Types

| Join Type | Ownership | OS Support | On-prem AD Required | Key Use Case |
|-----------|-----------|------------|--------------------|-----------| 
| **Entra ID Registered** | Personal (BYOD) | Windows, iOS, Android, macOS | No | Employee uses personal phone/laptop to access corporate apps |
| **Entra ID Joined** | Company-owned | Windows 10/11 only | No | Cloud-first org, new Windows devices, no on-prem AD |
| **Hybrid Entra ID Joined** | Company-owned | Windows 10/11, Server 2008 R2+ | Yes | Organisation has on-prem AD and wants cloud benefits too |

### Device State in Detail

**Entra ID Registered (BYOD)**
- The device is personally owned — the user registers it to get access to corporate resources
- A device identity is created in Entra ID, but the device is **not domain-joined**
- The org can push apps and policies via MDM (Intune) but the user retains full device control
- Supports Conditional Access "approved client app" and "app protection policy" controls
- No Group Policy; management is done through Intune MAM (app-level) or MDM (device-level)

**Entra ID Joined**
- The device is joined **only** to Entra ID — replaces the traditional on-prem domain join
- A local account is created for the user during join, tied to their Entra ID credentials
- Supports SSO to cloud apps (M365, Azure) and on-prem apps via Kerberos ticket from Entra ID
- Managed with Intune (MDM) — Group Policy does **not** apply
- No dependency on on-prem AD at sign-in time
- Typical for: cloud-only orgs, new device deployments, kiosk/shared devices

**Hybrid Entra ID Joined**
- The device is joined to **both** on-prem AD DS **and** Entra ID simultaneously
- On-prem AD is still the primary identity authority; the Entra ID join is layered on top
- Entra Connect syncs computer objects from AD DS to Entra ID to establish the Entra ID device identity
- Supports **both** Group Policy (on-prem) and Intune (cloud) management
- SSO works for both on-prem and cloud resources
- Typical for: organisations mid-migration to cloud with existing on-prem AD infrastructure

### Side-by-Side Comparison

| Capability | Registered | Entra Joined | Hybrid Entra Joined |
|-----------|-----------|-------------|---------------------|
| Domain joined to on-prem AD | No | No | Yes |
| Group Policy support | No | No | Yes |
| Intune MDM support | Optional | Yes | Optional |
| SSO to cloud apps | Yes | Yes | Yes |
| SSO to on-prem apps | No | Limited (Kerberos via Entra ID) | Yes (full Kerberos) |
| Conditional Access "compliant device" | Yes (if enrolled) | Yes | Yes |
| Works without on-prem AD | Yes | Yes | No |
| Supports down-level Windows (7/8.1) | No | No | Yes |

### Mobile Device Management (MDM) vs Mobile Application Management (MAM)

| Approach | Manages | Use Case |
|----------|---------|---------|
| **MDM (full device)** | Entire device — apps, settings, wipe | Company-owned devices |
| **MAM (app-level)** | Only managed apps — data separation | BYOD — user keeps control of device |
| **MAM without enrollment** | App policies, no device enrollment | BYOD where IT only protects company data inside apps |

With **MAM without MDM enrollment**, IT can enforce policies like "require PIN to open Outlook", "block copy-paste from Outlook to personal apps", or "remote wipe only corporate data" — without managing the personal device at all.

### Licensing for Device Management

| Feature | License Required |
|---------|----------------|
| Device registration (any join type) | Free (Entra ID Free) |
| Conditional Access on device state/compliance | Entra ID P1 |
| Intune MDM/MAM | Microsoft Intune (standalone) or Microsoft 365 E3/E5 |
| Windows Autopilot (zero-touch provisioning) | Intune license |
| Microsoft Defender for Endpoint integration | Microsoft 365 E5 or Defender add-on |

### Conditional Access and Devices

Conditional Access can enforce device requirements as **grant controls**:

| Control | Meaning |
|---------|---------|
| **Require compliant device** | Device must be enrolled in Intune and meet compliance policy |
| **Require Hybrid Entra ID joined** | Device must be domain-joined on-prem AND synced to Entra ID |
| **Require approved client app** | App must be on Microsoft's approved list (e.g. Outlook, not random mail app) |
| **Require app protection policy** | App must have Intune MAM policy applied |

> **Exam note:** "Require compliant device" is enforced by **Intune**. A device can be Entra ID joined but still non-compliant (e.g. missing disk encryption, outdated OS). Compliance policy is defined in Intune, not in Entra ID.

---

## Manage Access to Azure Resources

### Azure RBAC (Role-Based Access Control)

RBAC controls who can do what to which resources. It is separate from Entra ID roles (which control the directory itself).

**RBAC assignment components:**

| Component | Description |
|-----------|-------------|
| **Security principal** | Who: user, group, service principal, managed identity |
| **Role definition** | What: a collection of permissions (actions, notActions, dataActions) |
| **Scope** | Where: management group, subscription, resource group, or resource |

### Built-in Azure Roles

| Role | Description |
|------|-------------|
| **Owner** | Full access to all resources including the ability to assign roles |
| **Contributor** | Create and manage all resources but cannot assign roles or manage access |
| **Reader** | View all resources but make no changes |
| **User Access Administrator** | Manage user access to Azure resources (not resource management) |

### Role Assignment Scopes (Hierarchy)

```
Management Group
  └── Subscription
        └── Resource Group
              └── Resource
```

Roles assigned at a higher scope are **inherited** by all child scopes. A role assigned at the subscription level grants access to all resource groups and resources within it.

### Interpret Access Assignments

| Concept | Description |
|---------|-------------|
| **Effective permissions** | Union of all role assignments across all scopes |
| **Deny assignments** | Explicitly block actions; created by Azure Blueprints, take precedence over role assignments |
| **Access control (IAM)** | The portal blade used to view and manage role assignments |
| **Check access** | Portal tool to view effective permissions for a user/group/SP |

### Custom RBAC Roles

- Defined in JSON with `Actions`, `NotActions`, `DataActions`, `NotDataActions`
- Assigned at subscription or management group scope
- Cannot exceed permissions of the role creator

---

## Manage Azure Subscriptions and Governance

### Management Group Hierarchy

| Level | Description |
|-------|-------------|
| **Root management group** | Top of hierarchy; all subscriptions roll up to this |
| **Management groups** | Containers for subscriptions; can be nested (up to 6 levels) |
| **Subscriptions** | Billing and access boundary; linked to one Entra tenant |
| **Resource groups** | Logical container for resources within a subscription |

**Governance policies applied at management group level inherit down to all child subscriptions.**

### Azure Policy

| Concept | Description |
|---------|-------------|
| **Policy definition** | A rule describing what conditions to evaluate and what effect to apply |
| **Initiative (policy set)** | A collection of policy definitions grouped for a common goal |
| **Policy assignment** | Applying a definition or initiative to a scope |
| **Compliance state** | Compliant, Non-compliant, Exempt, Conflicting |

### Policy Effects (in order of strength)

| Effect | Description |
|--------|-------------|
| **Disabled** | Policy is turned off |
| **Audit** | Logs non-compliant resources; does not block |
| **Append** | Adds fields to a resource during creation |
| **Modify** | Adds, updates, or removes properties |
| **AuditIfNotExists** | Audits if a related resource does not exist |
| **DeployIfNotExists** | Deploys a related resource if it does not exist |
| **Deny** | Blocks resource creation/update if non-compliant |

### Resource Locks

| Lock Type | Effect |
|-----------|--------|
| **CanNotDelete** | Authorised users can read and modify but cannot delete the resource |
| **ReadOnly** | Authorised users can read but cannot modify or delete (like Reader role) |

- Locks are inherited by child resources
- Locks apply regardless of RBAC permissions
- Must remove the lock before the operation can proceed

### Tags

| Concept | Description |
|---------|-------------|
| **Tag** | Name/value pair applied to resources (e.g., Environment=Production) |
| **Inheritance** | Tags on resource groups do NOT auto-inherit to resources (use Policy to enforce) |
| **Limits** | Up to 50 tags per resource |
| **Policy enforcement** | Use `Require a tag` or `Inherit a tag` policies |
| **Cost allocation** | Tags are used in cost analysis and chargeback reports |

### Resource Groups

| Concept | Description |
|---------|-------------|
| **Logical container** | Resources in a group share the same lifecycle |
| **Region** | Resource group has a region (metadata location), resources can be elsewhere |
| **Move resources** | Resources can be moved between resource groups (some restrictions apply) |
| **Delete group** | Deleting a resource group deletes all resources in it |

### Subscriptions

| Concept | Description |
|---------|-------------|
| **Subscription types** | Free, Pay-As-You-Go, Enterprise Agreement, CSP |
| **Subscription limits** | Default limits (quotas) can be increased via support request |
| **Transfer subscription** | Change billing owner; resources remain, RBAC remains |
| **Move subscription** | Move between management groups |

### Cost Management

| Tool | Description |
|------|-------------|
| **Cost analysis** | Visualise spend by resource, service, tag, resource group |
| **Budgets** | Set spending thresholds with alert notifications |
| **Cost alerts** | Budget alerts, credit alerts, department spending quota alerts |
| **Azure Advisor** | Recommendations for cost optimisation (idle VMs, reserved instances) |
| **Reservations** | 1 or 3-year commitments for significant discounts (up to 72%) |

### Hybrid Identity

Hybrid identity is the bridge between your on-premises Active Directory world and Entra ID. The goal is that a user has **one identity** that works for both on-prem resources (file servers, legacy apps) and cloud resources (M365, Azure portal, SaaS apps).

#### The Big Picture: What Connects to What

```
On-Premises                              Cloud (Entra ID)
──────────────────────────────           ─────────────────────────
  Active Directory Domain Services  ──►  Entra ID Tenant
  (Source of Truth)                       (Replica of user identities)
        │
        │  Entra Connect (sync engine)
        │  installed on a member server
        │
        ├── Users ──────────────────────► Cloud users (synced)
        ├── Groups ─────────────────────► Cloud groups (synced)
        ├── Password hashes ────────────► Cloud password hashes (PHS only)
        └── Computer objects ───────────► Device objects (Hybrid Entra Join)
```

#### Components and Where They Live

| Component | Location | Role |
|-----------|----------|------|
| **AD DS** (Active Directory Domain Services) | On-premises | Source of truth for all identities |
| **Entra Connect** (sync engine) | On-premises (member server, NOT a DC) | Reads from AD DS, writes to Entra ID |
| **PTA Agent** | On-premises (1+ servers) | Validates passwords against AD DS at sign-in time |
| **ADFS Server** | On-premises | Issues SAML tokens; handles all auth for federated domains |
| **WAP** (Web Application Proxy) | On-premises DMZ | Reverse proxy for ADFS — exposes ADFS to the internet |
| **Entra ID Tenant** | Cloud | Target directory; holds the synced identity copies |
| **Entra Connect Health** | Cloud (portal) | Monitors sync health, agent status, alerts |

> **Best practice:** Install Entra Connect on a dedicated member server — not on a domain controller, and not on the ADFS server.

#### Sync Methods Compared

**1. Password Hash Sync (PHS)** — simplest, most resilient

```
User changes password in AD DS
    │
    ▼
AD DS stores NT hash of password
    │
    ▼
Entra Connect reads NT hash from AD DS
    │
    ▼
Entra Connect hashes the NT hash again (PBKDF2 + salt)
    │
    ▼
Double-hash synced to Entra ID
    │
    ▼  (at sign-in time)
Entra ID compares submitted credential against stored hash
→ Authentication happens entirely in the CLOUD
→ No on-prem connectivity needed at sign-in time
```

- On-prem AD going down = users **can still sign in** to cloud
- Enables **leaked credential detection** in Identity Protection (Microsoft can compare hashes against known breach databases)
- Passwords are **never** stored in plaintext in the cloud — only a salted hash of a hash

**2. Pass-Through Authentication (PTA)** — no hash in cloud

```
User enters credentials at Entra ID sign-in page
    │
    ▼
Entra ID encrypts the credentials
    │
    ▼
Encrypted credential sent to PTA Agent queue (cloud-to-on-prem via outbound connection)
    │
    ▼
PTA Agent (on-prem) decrypts and validates against AD DS via Windows API
    │
    ▼
Result (success/fail) returned to Entra ID
→ Authentication decision made ON-PREMISES
→ Password never stored or checked in cloud
```

- On-prem AD going down = users **cannot sign in** (no fallback)
- Required when policy prohibits storing any credential material in the cloud
- PTA agent uses **outbound** connection to Azure — no inbound firewall rules needed
- Deploy multiple PTA agents for high availability

**3. Federation with ADFS** — most complex, most control

```
User navigates to a Microsoft 365 / Azure app
    │
    ▼
Entra ID detects federated domain, redirects to on-prem ADFS
    │
    ▼
ADFS authenticates the user (Kerberos, smart card, third-party MFA, etc.)
    │
    ▼
ADFS issues a SAML token with claims
    │
    ▼
Token sent back to Entra ID (via WAP for external users)
    │
    ▼
Entra ID validates token signature, grants access
→ Entra ID trusts ADFS completely — it never sees the password
```

- WAP (Web Application Proxy) sits in the DMZ to handle external users
- On-prem ADFS going down = **all cloud sign-ins fail** — highest operational risk
- Use when: smart card / certificate auth required, third-party MFA required, complex custom claim rules needed

#### PHS vs PTA vs ADFS at a Glance

| | PHS | PTA | ADFS |
|--|-----|-----|------|
| Password stored in cloud | Hash of hash (yes) | No | No |
| Auth happens | Cloud | On-premises | On-premises (ADFS) |
| Survives on-prem outage | Yes | No | No |
| Requires extra on-prem servers | No (Entra Connect only) | PTA Agent(s) | ADFS + WAP |
| Smart card / cert auth | No | No | Yes |
| Identity Protection support | Full | Partial | Limited |
| Complexity | Low | Medium | High |

#### What Gets Synced (and What Doesn't)

| Object | Synced? | Notes |
|--------|---------|-------|
| Users | Yes | UPN, display name, attributes |
| Security groups | Yes | Members synced too |
| Distribution groups | Yes | |
| Password hashes | PHS only | Not synced with PTA or ADFS |
| Computer objects | Only for Hybrid Entra Join | Enables device identity in Entra ID |
| OUs | No | Flat Entra ID has no OU concept |
| Group Policy Objects | No | Use Intune policies in the cloud |
| Kerberos tickets / TGTs | No | Kerberos stays on-prem |

#### Filtering — Control What Gets Synced

By default, Entra Connect syncs all users from all domains and OUs. You can filter:

| Filter Type | Description | Example |
|-------------|-------------|---------|
| **OU filtering** | Include or exclude specific OUs | Exclude the "Service Accounts" OU |
| **Group-based filtering** | Sync only members of a specific group | Pilot rollout to 100 users first |
| **Attribute-based filtering** | Filter on any AD attribute | Sync only where `extensionAttribute1 = SyncToCloud` |
| **Domain filtering** | Include/exclude specific AD domains | Multi-domain forest, only sync contoso.com |

#### Writeback — Cloud Changes Back to On-Prem

Some features need to push changes **from Entra ID back to AD DS**:

| Writeback Feature | What It Does | Requires |
|-------------------|-------------|---------|
| **Password writeback** | SSPR-changed password is written back to AD DS | Entra ID P1 + Entra Connect |
| **Group writeback** | Microsoft 365 groups written back as distribution groups | Entra ID P1 + Entra Connect |
| **Device writeback** | Cloud device objects written back to AD DS | Required for ADFS device-based Conditional Access |

Without password writeback, a user who resets via SSPR can sign in to cloud apps with the new password, but their **old password still works on-prem** until the next normal sync.

#### Sync Cycle

| Cycle Type | Frequency | Triggers |
|-----------|-----------|---------|
| **Delta sync** | Every 30 minutes | Only changed objects |
| **Full sync** | On demand / after config change | All objects re-evaluated |

Force a delta sync manually:
```powershell
Start-ADSyncSyncCycle -PolicyType Delta
```

#### Entra Connect vs Entra Connect Cloud Sync

| | Entra Connect | Entra Connect Cloud Sync |
|--|--------------|--------------------------|
| Installation | Full application on a Windows Server | Lightweight provisioning agent |
| Config location | On-premises (wizard/PowerShell) | Azure portal (cloud) |
| Multi-forest support | Yes (complex config) | Yes (simpler, native) |
| Password writeback | Yes | Yes (GA since 2023) |
| Staging mode (HA) | Yes (active/passive) | Multiple agents = HA by default |
| Feature parity | Full | Not yet full (no ADFS integration) |
| Best for | Complex, existing deployments | New deployments, disconnected forests |

---

## Exam Tips

- **RBAC vs Entra ID roles**: RBAC controls Azure resources; Entra ID roles control the directory (users, groups, apps). They are separate.
- **Owner** can assign roles; **Contributor** cannot — this is a common exam distinction.
- Role assignments are **additive** — effective permissions are the union of all assignments across all scopes.
- **Deny assignments** take precedence over role assignments and are created by Azure Blueprints.
- **Resource locks** are not the same as RBAC — locks block operations regardless of role. ReadOnly lock is stricter than CanNotDelete.
- **Tags do not inherit** from resource group to resource automatically — use Azure Policy with `Inherit a tag` effect to enforce inheritance.
- **Azure Policy Audit** effect logs non-compliance without blocking; **Deny** blocks the operation.
- **Management groups** can be nested up to 6 levels deep (not counting root or subscription level).
- **SSPR** requires Entra ID P1 for on-premises writeback.
- Dynamic groups require **Entra ID P1** — know the attribute-based rule syntax.
- **Device join types**: Registered = BYOD personal device; Entra Joined = company-owned cloud-only; Hybrid Entra Joined = company-owned with on-prem AD.
- **Hybrid Entra Joined** requires Entra Connect to sync computer objects — without it the device identity never appears in Entra ID.
- **PHS** (Password Hash Sync) is the only method that survives an on-prem AD outage — users can still sign in to cloud apps.
- **PTA** (Pass-Through Auth) validates passwords on-prem — if AD goes down, cloud sign-in fails too.
- **ADFS** is the most complex but the only option for smart card / certificate-based auth.
- **Entra Connect** should be installed on a **member server**, not on a domain controller.
- **Password writeback** requires P1 — without it, an SSPR reset works in the cloud but the old password still works on-prem until the next sync.
- **MAM without enrollment** = IT protects only the corporate app data on a personal device without managing the whole device.
- **"Require compliant device"** in Conditional Access is enforced by Intune — a device can be joined to Entra ID but still marked non-compliant.

---

## References

- [Microsoft Entra ID documentation](https://learn.microsoft.com/en-us/entra/identity/)
- [Azure RBAC documentation](https://learn.microsoft.com/en-us/azure/role-based-access-control/)
- [Azure Policy documentation](https://learn.microsoft.com/en-us/azure/governance/policy/)
- [Resource locks](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/lock-resources)
- [Management groups](https://learn.microsoft.com/en-us/azure/governance/management-groups/)
- [Azure Cost Management](https://learn.microsoft.com/en-us/azure/cost-management-billing/)
- [Entra Connect](https://learn.microsoft.com/en-us/entra/identity/hybrid/connect/whatis-azure-ad-connect)
- [Understand Microsoft Entra ID (MS Learn module)](https://learn.microsoft.com/en-us/training/modules/understand-azure-active-directory)
- [Microsoft Entra Domain Services](https://learn.microsoft.com/en-us/entra/identity/domain-services/overview)
- [Device identity and join types](https://learn.microsoft.com/en-us/entra/identity/devices/overview)
- [Hybrid Entra ID join](https://learn.microsoft.com/en-us/entra/identity/devices/hybrid-join-plan)
- [Entra Connect: choose auth method](https://learn.microsoft.com/en-us/entra/identity/hybrid/connect/choose-ad-authn)
- [Password hash sync](https://learn.microsoft.com/en-us/entra/identity/hybrid/connect/how-to-connect-password-hash-synchronization)
- [Pass-through authentication](https://learn.microsoft.com/en-us/entra/identity/hybrid/connect/how-to-connect-pta)
- [Entra Connect Cloud Sync](https://learn.microsoft.com/en-us/entra/identity/hybrid/cloud-sync/what-is-cloud-sync)
- [Intune MAM without enrollment](https://learn.microsoft.com/en-us/mem/intune/apps/mam-faq)
