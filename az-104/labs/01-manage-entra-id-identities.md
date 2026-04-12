# Lab 01: Manage Microsoft Entra ID Identities

## Overview

Create and manage users, groups, and external identities in Microsoft Entra ID. Assign RBAC roles and configure Self-Service Password Reset (SSPR). These tasks form the foundation of identity management for the AZ-104 exam.

### Learning Objectives

- Create cloud user accounts and configure required properties
- Create security groups with assigned and dynamic membership
- Invite a guest (B2B) user
- Assign built-in Azure RBAC roles at different scopes
- Configure Self-Service Password Reset (SSPR)
- Review sign-in and audit logs

## Prerequisites

- Azure subscription with Owner or User Access Administrator role
- Microsoft Entra ID P1 or P2 license (for SSPR and dynamic groups)
- Azure CLI installed (or use Azure Cloud Shell)

---

## Steps

### 1. Create Users

#### Portal

1. Navigate to https://portal.azure.com → **Microsoft Entra ID** → **Users** → **New user** → **Create new user**
2. Fill in:
   - **User principal name**: `alex.test@<yourdomain>.onmicrosoft.com`
   - **Display name**: Alex Test
   - **Password**: Auto-generate or set manually
3. Under **Properties**, set:
   - **Usage location**: United States (required for license assignment)
   - **Job title**: Test Engineer
   - **Department**: Engineering
4. Click **Create**
5. Repeat for a second user: `billing.test@<yourdomain>.onmicrosoft.com`, Department: Finance

#### Azure CLI

```bash
# Create a user
az ad user create \
  --display-name "Alex Test" \
  --user-principal-name "alex.test@<yourdomain>.onmicrosoft.com" \
  --password "TempPass@123!" \
  --force-change-password-next-sign-in true

# List users
az ad user list --output table
```

**Explore:**
- View the user's **Assigned roles**, **Licenses**, and **Sign-in logs** from the user blade
- Notice that no license is assigned yet

---

### 2. Create Groups

#### Assigned Security Group (Portal)

1. Navigate to **Entra ID** → **Groups** → **New group**
2. Configure:
   - **Group type**: Security
   - **Group name**: `sg-engineering`
   - **Membership type**: Assigned
3. Under **Members**, add Alex Test
4. Click **Create**

#### Dynamic Security Group (Portal, requires P1)

1. Navigate to **Groups** → **New group**
2. Configure:
   - **Group type**: Security
   - **Group name**: `sg-finance-dynamic`
   - **Membership type**: Dynamic User
3. Click **Add dynamic query** and set:
   - Property: `department` | Operator: `Equals` | Value: `Finance`
4. Click **Save** then **Create**

#### Azure CLI

```bash
# Create a security group
az ad group create \
  --display-name "sg-engineering" \
  --mail-nickname "sg-engineering"

# Add a member
az ad group member add \
  --group "sg-engineering" \
  --member-id $(az ad user show --id alex.test@<yourdomain>.onmicrosoft.com --query id -o tsv)
```

**Try:**
- Wait a few minutes; the billing user should auto-populate into `sg-finance-dynamic`
- Check membership under **Groups** → select `sg-finance-dynamic` → **Members**

---

### 3. Invite a Guest (B2B) User

#### Portal

1. Navigate to **Entra ID** → **Users** → **Invite external user**
2. Fill in:
   - **Email**: any personal email (Gmail, Outlook, etc.)
   - **Display name**: External Guest
   - **Message**: "You are invited to our Azure test tenant"
3. Click **Invite**
4. Check the invited email for the acceptance link

**Explore:**
- Invited guest appears with **User type**: Guest in the Users list
- Guest account shows `#EXT#` in the UPN until invitation is accepted

---

### 4. Assign RBAC Roles

#### Assign Reader Role at Subscription Scope (Portal)

1. Navigate to **Subscriptions** → select your subscription
2. Click **Access control (IAM)** → **Add** → **Add role assignment**
3. Select role: **Reader**
4. Click **Next** → **Select members** → search for Alex Test → **Select**
5. Click **Review + assign**

#### Assign Contributor Role at Resource Group Scope (CLI)

```bash
# Create a resource group for testing
az group create --name rg-lab01 --location eastus

# Assign Contributor to the engineering group on the resource group
az role assignment create \
  --role "Contributor" \
  --assignee-object-id $(az ad group show --group sg-engineering --query id -o tsv) \
  --scope $(az group show --name rg-lab01 --query id -o tsv)

# Verify role assignments
az role assignment list --resource-group rg-lab01 --output table
```

**Explore:**
- Navigate to `rg-lab01` → **Access control (IAM)** → **Role assignments** tab
- Use **Check access** to verify Alex Test's effective permissions

---

### 5. Configure SSPR (Self-Service Password Reset)

1. Navigate to **Entra ID** → **Password reset**
2. Under **Properties**:
   - Set **Self service password reset enabled** to **Selected**
   - Add group `sg-engineering` to the selected group
3. Under **Authentication methods**:
   - Set methods required: **1**
   - Enable: **Email** and **Mobile phone**
4. Under **Registration**:
   - **Require users to register when signing in**: Yes
5. Click **Save**

**Explore:**
- Have a test user navigate to https://aka.ms/sspr to test the reset experience
- View **Audit logs** under Password Reset to see registration and reset events

---

### 6. Review Logs

#### Portal

1. Navigate to **Entra ID** → **Monitoring** → **Sign-in logs**
   - View recent sign-ins, status, and applied Conditional Access policies
2. Navigate to **Audit logs**
   - Filter by **Date**: last 1 hour
   - Find the user creation, group creation, and role assignment events

#### Azure CLI

```bash
# View recent audit logs (requires Graph permission)
az monitor activity-log list \
  --start-time $(date -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --output table
```

---

## Cleanup

```bash
# Remove role assignment
az role assignment delete \
  --role "Contributor" \
  --assignee-object-id $(az ad group show --group sg-engineering --query id -o tsv) \
  --scope $(az group show --name rg-lab01 --query id -o tsv)

# Delete resource group
az group delete --name rg-lab01 --yes --no-wait

# Delete test users
az ad user delete --id alex.test@<yourdomain>.onmicrosoft.com
az ad user delete --id billing.test@<yourdomain>.onmicrosoft.com

# Delete groups
az ad group delete --group sg-engineering
```

---

## Key Takeaways

| Task | Key Point |
|------|-----------|
| Create users | Must set Usage location before assigning licenses |
| Dynamic groups | Require Entra ID P1; membership driven by attribute rules |
| Guest (B2B) users | Use their own home tenant credentials; appear as Guest type |
| RBAC assignment | Role + principal + scope; inheritance flows downward |
| SSPR | Requires Entra ID P1 for on-premises writeback |
| Audit logs | All identity changes logged; queryable in Entra ID portal |

## References

- [Manage users in Entra ID](https://learn.microsoft.com/en-us/entra/fundamentals/add-users)
- [Dynamic group membership](https://learn.microsoft.com/en-us/entra/identity/users/groups-dynamic-membership)
- [Azure RBAC](https://learn.microsoft.com/en-us/azure/role-based-access-control/overview)
- [SSPR](https://learn.microsoft.com/en-us/entra/identity/authentication/concept-sspr-howitworks)
- [B2B collaboration](https://learn.microsoft.com/en-us/entra/external-id/what-is-b2b)
