# Azure RBAC Roles — JSON Reference Guide

> **Purpose:** Understand how Azure role definitions work in JSON format, learn to read built-in roles, and create custom roles.

---

## How Role Definitions Work

Every Azure role — built-in or custom — is defined as a JSON object. The JSON describes what the role can do (`actions`), what it can't do (`notActions`), and where it applies (`assignableScopes`).

The formula for effective permissions is:

```
Effective permissions = actions - notActions
```

If `actions` is `["*"]` (everything) and `notActions` includes `Microsoft.Authorization/*/Write`, the role can do everything *except* write authorization settings.

---

## JSON Structure — The Six Key Properties

```json
{
  "Name": "Role name",
  "Id": "unique-guid-here",
  "IsCustom": false,
  "Description": "What this role does",
  "Actions": [],
  "NotActions": [],
  "DataActions": [],
  "NotDataActions": [],
  "AssignableScopes": []
}
```

| Property | Purpose |
|----------|---------|
| `Name` | Human-readable role name |
| `Id` | Unique GUID — auto-generated for custom roles |
| `IsCustom` | `false` for built-in, `true` for custom |
| `Description` | Explains the role's purpose |
| `Actions` | Control plane operations the role CAN perform |
| `NotActions` | Control plane operations SUBTRACTED from Actions |
| `DataActions` | Data plane operations the role CAN perform (e.g., read blob data) |
| `NotDataActions` | Data plane operations SUBTRACTED from DataActions |
| `AssignableScopes` | Where this role can be assigned (`/` = everywhere) |

### Control Plane vs. Data Plane

- **Control plane** (`actions` / `notActions`): Managing Azure resources — create VMs, configure networks, assign roles. These are operations on the resource *itself*.
- **Data plane** (`dataActions` / `notDataActions`): Accessing data *inside* a resource — reading blob storage contents, querying a database, sending messages to a queue.

A Reader role can view a storage account (control plane) but cannot read the blobs inside it (data plane) unless also granted a data role like `Storage Blob Data Reader`.

---

## Built-In Role 1: Owner

```json
{
  "Name": "Owner",
  "Id": "8e3af657-a8ff-443c-a75c-2fe8c4bcb635",
  "IsCustom": false,
  "Description": "Grants full access to manage all resources, including the
                   ability to assign roles in Azure RBAC.",
  "Actions": [
    "*"
  ],
  "NotActions": [],
  "DataActions": [],
  "NotDataActions": [],
  "AssignableScopes": [
    "/"
  ]
}
```

### How to read this:
- `Actions: ["*"]` — can do **everything**
- `NotActions: []` — nothing is excluded
- `AssignableScopes: ["/"]` — can be assigned at any scope (root and below)

### Effective permissions:
```
Everything - Nothing = Everything
```

Owner is the most powerful role. The only role with unrestricted permissions including role assignment.

---

## Built-In Role 2: Contributor

```json
{
  "Name": "Contributor",
  "Id": "b24988ac-6180-42a0-ab88-20f7382dd24c",
  "IsCustom": false,
  "Description": "Grants full access to manage all resources, but does not
                   allow you to assign roles in Azure RBAC, manage assignments
                   in Azure Blueprints, or share image galleries.",
  "Actions": [
    "*"
  ],
  "NotActions": [
    "Microsoft.Authorization/*/Delete",
    "Microsoft.Authorization/*/Write",
    "Microsoft.Authorization/elevateAccess/Action",
    "Microsoft.Blueprint/blueprintAssignments/write",
    "Microsoft.Blueprint/blueprintAssignments/delete",
    "Microsoft.Compute/galleries/share/action",
    "Microsoft.Purview/consents/write",
    "Microsoft.Purview/consents/delete"
  ],
  "DataActions": [],
  "NotDataActions": [],
  "AssignableScopes": [
    "/"
  ]
}
```

### How to read this:
- `Actions: ["*"]` — starts with **everything**
- `NotActions` carves out authorization operations — cannot write, delete, or elevate permissions
- The `Microsoft.Authorization/*/Write` exclusion is what prevents Contributor from assigning roles

### Effective permissions:
```
Everything - (Authorization write/delete/elevate + Blueprint + Gallery share + Purview) = Everything except access management
```

### The critical difference from Owner:
The `NotActions` section is the **only** thing separating Contributor from Owner. Those `Microsoft.Authorization/*` exclusions are what make a Contributor unable to assign roles to others.

---

## Built-In Role 3: Reader

```json
{
  "Name": "Reader",
  "Id": "acdd72a7-3385-48ef-bd42-f606fba81ae7",
  "IsCustom": false,
  "Description": "View all resources, but does not allow you to make
                   any changes.",
  "Actions": [
    "*/read"
  ],
  "NotActions": [],
  "DataActions": [],
  "NotDataActions": [],
  "AssignableScopes": [
    "/"
  ]
}
```

### How to read this:
- `Actions: ["*/read"]` — can only perform **read** operations across all resource providers
- `NotActions: []` — nothing additional is excluded (the action itself is already narrow)
- The `*/read` wildcard means: any resource provider, any resource type, but only the read operation

### Effective permissions:
```
Read everything - Nothing = Read everything
```

Reader is the most restrictive general role. Notice how elegant the definition is — instead of listing hundreds of individual read permissions, `*/read` covers them all.

---

## Built-In Role 4: User Access Administrator

```json
{
  "Name": "User Access Administrator",
  "Id": "18d7d88d-d35e-4fb5-a5c3-7773c20a72d9",
  "IsCustom": false,
  "Description": "Lets you manage user access to Azure resources.",
  "Actions": [
    "*/read",
    "Microsoft.Authorization/*",
    "Microsoft.Support/*"
  ],
  "NotActions": [],
  "DataActions": [],
  "NotDataActions": [],
  "AssignableScopes": [
    "/"
  ]
}
```

### How to read this:
- `*/read` — can read all resources
- `Microsoft.Authorization/*` — full control over authorization (role assignments, role definitions, etc.)
- `Microsoft.Support/*` — can manage support tickets
- No wildcard `*` for general resource operations — cannot create, modify, or delete resources

### Effective permissions:
```
Read everything + Full authorization control + Support tickets
```

This role is unique: it can control **who** has access but cannot manage resources directly. It's the role a Global Administrator gets when they enable "Access management for Azure resources" in Entra ID.

---

## Built-In Role 5: Virtual Machine Contributor (Granular Example)

```json
{
  "Name": "Virtual Machine Contributor",
  "Id": "9980e02c-c2be-4d73-94e8-173b1dc7cf3c",
  "IsCustom": false,
  "Description": "Lets you manage virtual machines, but not access to them,
                   and not the virtual network or storage account they're
                   connected to.",
  "Actions": [
    "Microsoft.Authorization/*/read",
    "Microsoft.Compute/availabilitySets/*",
    "Microsoft.Compute/locations/*",
    "Microsoft.Compute/virtualMachines/*",
    "Microsoft.Compute/virtualMachineScaleSets/*",
    "Microsoft.Compute/disks/write",
    "Microsoft.Compute/disks/read",
    "Microsoft.Compute/disks/delete",
    "Microsoft.Network/networkInterfaces/*",
    "Microsoft.ResourceHealth/availabilityStatuses/read",
    "Microsoft.Resources/deployments/*",
    "Microsoft.Resources/subscriptions/resourceGroups/read",
    "Microsoft.Storage/storageAccounts/listKeys/action",
    "Microsoft.Storage/storageAccounts/read"
  ],
  "NotActions": [],
  "DataActions": [],
  "NotDataActions": [],
  "AssignableScopes": [
    "/"
  ]
}
```

### How to read this:
- Instead of `*` (everything), this role lists **specific** resource provider actions
- `Microsoft.Compute/virtualMachines/*` — full control over VMs
- `Microsoft.Network/networkInterfaces/*` — can manage NICs (VMs need these)
- `Microsoft.Storage/storageAccounts/read` — can read storage (but not full control)
- No `Microsoft.Network/virtualNetworks/*` — cannot manage VNets

This is why assigning VM Contributor at the subscription level is safe: even though the scope is wide, the permissions are narrow to VM-related operations only.

---

## Wildcards and Action Format

### Action string format:
```
{ResourceProvider}/{ResourceType}/{Operation}
```

### Examples:
| Action String | Meaning |
|--------------|---------|
| `*` | Everything — all providers, all types, all operations |
| `*/read` | Read on everything |
| `Microsoft.Compute/*` | All operations on all Compute resources |
| `Microsoft.Compute/virtualMachines/*` | All operations on VMs only |
| `Microsoft.Compute/virtualMachines/start/action` | Only the start operation on VMs |
| `Microsoft.Authorization/*/Write` | Write operations on all Authorization resources |

### Wildcard rules:
- `*` matches everything at that level
- Can be used in the middle: `Microsoft.Compute/*/read` = read all Compute resource types
- Can be used at the end: `Microsoft.Network/*` = all operations on all Network resources

---

## Creating a Custom Role — Example

**Scenario:** You need a role that can monitor VMs (read) and restart them, but nothing else.

```json
{
  "Name": "VM Monitor and Restart Operator",
  "IsCustom": true,
  "Description": "Can view all resources, read VM details, and restart VMs.
                   Cannot create, delete, or modify VMs or other resources.",
  "Actions": [
    "*/read",
    "Microsoft.Compute/virtualMachines/start/action",
    "Microsoft.Compute/virtualMachines/restart/action",
    "Microsoft.Compute/virtualMachines/powerOff/action",
    "Microsoft.ResourceHealth/availabilityStatuses/read",
    "Microsoft.Insights/alertRules/*",
    "Microsoft.Insights/diagnosticSettings/read",
    "Microsoft.Support/*"
  ],
  "NotActions": [],
  "DataActions": [],
  "NotDataActions": [],
  "AssignableScopes": [
    "/subscriptions/your-subscription-id-here"
  ]
}
```

### Breakdown:
- `*/read` — can view everything (monitoring needs visibility)
- `Microsoft.Compute/virtualMachines/start/action` — can start VMs
- `Microsoft.Compute/virtualMachines/restart/action` — can restart VMs
- `Microsoft.Compute/virtualMachines/powerOff/action` — can stop VMs
- `Microsoft.Insights/alertRules/*` — can manage alert rules (monitoring)
- `Microsoft.Support/*` — can create support tickets if something is wrong
- `AssignableScopes` — limited to a specific subscription (not globally available)
- No `Microsoft.Compute/virtualMachines/write` or `delete` — cannot modify or destroy VMs

### How to create this via CLI:
```bash
az role definition create --role-definition vm-monitor-restart.json
```

### How to assign it:
```bash
az role assignment create \
  --assignee user@contoso.com \
  --role "VM Monitor and Restart Operator" \
  --scope /subscriptions/your-subscription-id
```

---

## Important: NotActions Is NOT a Deny

`NotActions` is often misunderstood. It is **not** a deny rule. It simply subtracts permissions from the `Actions` wildcard.

If a user has **two roles** — one that excludes an action in `NotActions` and another that explicitly grants that same action — the user **can** perform the action. The grant from the second role wins.

```
Role A: Actions ["*"], NotActions ["Microsoft.Authorization/*/Write"]
Role B: Actions ["Microsoft.Authorization/roleAssignments/write"]

Effective: User CAN write role assignments (Role B explicitly grants it)
```

This is why roles are **additive**. The only way to truly block an action regardless of role assignments is through **deny assignments** (rare, system-managed) or **Azure Policy** (resource-level governance).

---

## Quick Reference — Comparing All Four General Roles

```
Owner:       Actions ["*"]          NotActions []
Contributor: Actions ["*"]          NotActions [Authorization/*/Write, Delete, elevate...]
Reader:      Actions ["*/read"]     NotActions []
UAA:         Actions ["*/read",     NotActions []
              "Authorization/*",
              "Support/*"]
```

The pattern: Owner has everything. Contributor starts with everything then carves out authorization. Reader restricts to read-only from the start. User Access Administrator starts with read-only then adds back authorization and support.
