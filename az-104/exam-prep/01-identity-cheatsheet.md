# Domain 1 — Identity & Governance Cheatsheet (15–20%)

## Microsoft Entra ID (formerly Azure AD)

### Editions at a glance

| Edition | Includes | Use when |
|---------|----------|----------|
| **Free** | Up to 50K objects, basic SSO, MFA | Default with any Azure subscription |
| **P1** | Conditional Access, dynamic groups, SSPR with writeback, Entra Connect Health | Standard enterprise |
| **P2** | All P1 + PIM (Privileged Identity Management), Identity Protection, access reviews | Compliance / regulated |

**P2 ⊃ P1 ⊃ Free.** If they ask "minimum license needed for X":

| Feature | Minimum license |
|---------|-----------------|
| Conditional Access | P1 |
| Dynamic groups | P1 |
| SSPR with on-prem writeback | P1 |
| **PIM (just-in-time roles)** | **P2** |
| **Access reviews** | **P2** |
| **Identity Protection / risk-based CA** | **P2** |

### Built-in directory roles (Entra ID, NOT Azure RBAC)

| Role | Can do | Cannot do |
|------|--------|-----------|
| **Global Administrator** | Everything in Entra ID | — |
| **User Administrator** | Create/manage users, reset passwords | Cannot manage MFA settings, security questions, or SSPR config (those are Global Admin only) |
| **Privileged Role Administrator** | Assign other admin roles | — |
| **Authentication Administrator** | Reset passwords, manage auth methods for non-admin users | Cannot reset Global Admin passwords |
| **Helpdesk Administrator** | Reset passwords for non-admin users | Cannot reset admin passwords |

> **TRAP:** Entra ID directory roles ≠ Azure RBAC roles. "Global Administrator" has no Azure subscription rights by default — must elevate first (see below).

---

## Root management group elevation

**Default state:** No one has access to the root tenant scope `/`, not even Global Administrators.

**To gain access:**
1. Sign in as Global Admin
2. **Microsoft Entra ID → Properties → "Access management for Azure resources" → Yes**
3. This grants the user **User Access Administrator** at scope `/`
4. From there, assign **Owner** or any role to others

> **TRAP:** Owner role alone is NOT enough. The Entra ID toggle is the gate.

---

## Azure RBAC

### Scope hierarchy (top → bottom)

```
Management Group  →  Subscription  →  Resource Group  →  Resource
```

Permissions **inherit downward**. A role assigned at Subscription applies to every RG and resource inside it.

### Key built-in Azure roles

| Role | Can | Common trap |
|------|-----|-------------|
| **Owner** | Full access + assign roles | Excessive — exam usually wants something narrower |
| **Contributor** | Full access **except** assign roles | Cannot grant access to others |
| **Reader** | View only | |
| **User Access Administrator** | Manage user access only | Use for scenarios about delegating role assignment |
| **Virtual Machine Contributor** | Manage VMs but not VNet/storage | Common "least privilege" answer for VM admins |
| **Storage Blob Data Contributor** | Read/write blob data | Different from "Storage Account Contributor" — that's the control plane |
| **Network Contributor** | Manage networking but not VMs | |

### "Minimum required role" patterns

| Need | Minimum role |
|------|--------------|
| Restart a VM | Virtual Machine Contributor |
| Grant someone access to a resource | Owner OR User Access Administrator |
| Read blob data | Storage Blob Data Reader |
| Manage NSG rules | Network Contributor |
| Backup a VM | Backup Contributor |

### Custom roles

- Defined as JSON with `Actions`, `NotActions`, `DataActions`, `AssignableScopes`
- Max **5,000** custom roles per tenant
- **`NotActions`** subtracts from `Actions` — doesn't deny, just removes

---

## Conditional Access (P1+)

### Components

| Component | Examples |
|-----------|----------|
| **Assignments** (who/what) | Users/groups, apps, conditions (location, device, risk) |
| **Access controls** (then) | Block / Grant with MFA / Compliant device / Approved app |
| **Session controls** | App-enforced restrictions, sign-in frequency, persistent browser |

### Common policies (memorize these patterns)

| Goal | Policy shape |
|------|--------------|
| Block legacy auth | All users → all cloud apps → Client app: legacy → Block |
| Require MFA for admins | Admin roles → all apps → Grant + Require MFA |
| Block sign-in from countries | All users → all apps → Locations: block list → Block |
| Require compliant device for sensitive apps | All users → app → Grant + Require compliant device |

> **TRAP:** Conditional Access requires **Entra ID P1**. Free tier users only get "security defaults" (a single all-or-nothing MFA policy).

---

## SSPR (Self-Service Password Reset)

| Setting | Detail |
|---------|--------|
| Scope | None / Selected (group) / All |
| Methods | Email, mobile phone, office phone, security questions, mobile app code, mobile app notification |
| Number required to reset | 1 or 2 (hard gate) |

> **TRAPS:**
> - Scope is exclusive — if SSPR is scoped to Group1, users in Group2 get **nothing**, no fallback
> - "Number required: 2" means a user answering security questions alone is **never** enough — must use 2 different method types
> - **User Administrator cannot configure security questions** — Global Administrator only

### SSPR vs MFA

| Feature | Used for | Authentication methods overlap |
|---------|----------|-------------------------------|
| **SSPR** | Password reset | Email, phone (text/call), security questions, mobile app |
| **MFA** | Sign-in | Phone (text/call), mobile app, FIDO2, Windows Hello |

Most methods serve both — but **security questions** = SSPR only, **FIDO2/Windows Hello** = MFA only.

---

## Hybrid identity

| Method | When |
|--------|------|
| **Password Hash Sync (PHS)** | Default; cloud auth using a hash of the on-prem password |
| **Pass-through Authentication (PTA)** | Authenticate against on-prem AD in real time; lightweight agent |
| **Federation (AD FS)** | Existing AD FS investment; complex SSO needs |
| **Entra Connect Cloud Sync** | Lighter alternative to Entra Connect; multi-forest scenarios |

> **TRAP:** Pass-through Authentication needs the on-prem AD to be available — it's not a cloud-only fallback. Use PHS if you need disaster-resistance.

---

## Tags & Locks (governance)

### What supports tags and locks

| Resource | Tags | Locks |
|----------|------|-------|
| Management Group | Yes | **NO** |
| Subscription | Yes | Yes |
| Resource Group | Yes | Yes |
| Resource | Yes | Yes |

> **TRAP:** Management groups don't support locks. Subscriptions and below only.

### Lock types

| Lock | Effect |
|------|--------|
| **CanNotDelete** | All actions allowed except delete |
| **ReadOnly** | Only read actions; blocks delete + most updates |

Locks **inherit downward** like RBAC. Most restrictive lock wins.

### Tag inheritance

Tags do **NOT** inherit by default. Use **Azure Policy `inherit a tag from the resource group`** to propagate.

---

## Azure Policy

| Concept | Detail |
|---------|--------|
| **Definition** | The rule itself (JSON) |
| **Initiative** | Group of definitions — assigned as a unit |
| **Assignment** | Apply definition/initiative to a scope |
| **Effect** | Audit / Deny / Append / Modify / DeployIfNotExists / AuditIfNotExists |
| **Exemption** | Per-resource opt-out for a specific assignment |

### Common effect choices

| Goal | Effect |
|------|--------|
| Block creation of disallowed resources | **Deny** |
| Log non-compliance without blocking | **Audit** |
| Auto-add a tag | **Append** or **Modify** |
| Auto-deploy a missing resource (e.g., diagnostic setting) | **DeployIfNotExists** |

> **TRAP:** Audit shows non-compliance but doesn't prevent it. Deny is the only blocking effect.

### Policy vs RBAC

| Policy | RBAC |
|--------|------|
| What can be done to a resource | Who can do something to a resource |
| Defaults to allow | Defaults to deny |
| Doesn't grant access | Doesn't restrict actions |

---

## Subscriptions & cost

| Concept | Detail |
|---------|--------|
| **Cost Management** | View/forecast spend; create budgets with alert actions |
| **Budgets** | Trigger Action Group at thresholds (50%, 75%, 90%, 100%) |
| **Pricing calculator** | Pre-purchase estimate |
| **TCO calculator** | Compare on-prem vs Azure |
| **Azure Advisor** | Recommendations across cost, security, reliability, performance |

### Move resources between subscriptions

- **Resource Mover** — official cross-region/cross-subscription tool
- Some resources don't support move (e.g., classic resources, some ExpressRoute circuits, App Service certificates)
- Move within the same region is faster; cross-region migration uses Resource Mover

---

## Quick CLI patterns

```bash
# Assign a role at RG scope
az role assignment create --role "Contributor" --assignee user@tenant --resource-group RG1

# Create a custom role from JSON
az role definition create --role-definition role.json

# List role assignments at a scope
az role assignment list --scope /subscriptions/<sub>/resourceGroups/<rg>

# Apply a tag (replaces existing tags)
az group update --name RG1 --tags env=prod owner=alice

# Merge tags (additive)
az tag update --resource-id <id> --operation Merge --tags env=prod

# Create a CanNotDelete lock
az lock create --name no-del --resource-group RG1 --lock-type CanNotDelete

# Assign a policy
az policy assignment create --name require-tag --policy <id> --scope <scope>
```
