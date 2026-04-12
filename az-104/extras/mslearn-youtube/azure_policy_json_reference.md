# Azure Policy Definitions — JSON Reference Guide

> **Purpose:** Understand how Azure Policy definitions work in JSON format, learn to read built-in policies, and create custom policy rules.

---

## How Policy Definitions Work

Every Azure Policy — built-in or custom — is defined as a JSON object. The JSON contains a **rule** (`policyRule`) that uses an `if/then` structure: if a condition is true about a resource, then apply an effect (deny, audit, modify, etc.).

The core logic is always:

```json
{
  "policyRule": {
    "if": {
      "condition about the resource"
    },
    "then": {
      "effect": "what to do about it"
    }
  }
}
```

---

## JSON Structure — The Key Properties

```json
{
  "properties": {
    "displayName": "Policy name shown in portal",
    "description": "What this policy does and why",
    "mode": "All",
    "metadata": {
      "version": "1.0.0",
      "category": "Category Name"
    },
    "parameters": {},
    "policyRule": {
      "if": {},
      "then": {}
    }
  }
}
```

| Property | Purpose |
|----------|---------|
| `displayName` | Name shown in the Azure portal |
| `description` | Explains the policy's purpose |
| `mode` | `All` = evaluates all resource types; `Indexed` = only types that support tags and location |
| `metadata.version` | Semantic version (e.g., 1.0.0) |
| `metadata.category` | Groups policies in the portal (e.g., "Compute", "Tags", "General") |
| `parameters` | Configurable inputs that make the policy reusable |
| `policyRule` | The actual if/then logic |

### Mode — All vs. Indexed

| Mode | Evaluates | Use When |
|------|----------|----------|
| `All` | All resource types including resource groups and subscriptions | Broad policies like "deny all resources" |
| `Indexed` | Only resources that support tags and location | Location-based or tag-based policies |

For the custom "deny all" policy you created, you used `"mode": "All"` because you wanted it to catch everything including resource groups.

---

## Effects — What Happens When the Rule Matches

| Effect | What It Does | Blocks Creation? | Modifies Resources? |
|--------|-------------|-----------------|-------------------|
| `deny` | Prevents the resource from being created or updated | Yes | No |
| `audit` | Flags as non-compliant but allows creation | No | No |
| `modify` | Automatically changes resource properties (e.g., add a tag) | No | Yes |
| `append` | Adds fields to a resource during creation/update | No | Yes |
| `deployIfNotExists` | Deploys a related resource if it doesn't exist (e.g., enable diagnostics) | No | Yes (creates new) |
| `auditIfNotExists` | Flags as non-compliant if a related resource doesn't exist | No | No |
| `disabled` | Policy is off — no evaluation | No | No |
| `denyAction` | Blocks specific actions (e.g., prevent deletion) | Depends | No |

For exam prep, the most important effects to know are `deny` (blocks), `audit` (reports only), and `modify` (auto-fixes).

---

## Conditions — The if Block

### Basic condition format:
```json
{
  "field": "property to check",
  "operator": "value to compare"
}
```

### Common operators:

| Operator | Meaning | Example |
|----------|---------|---------|
| `equals` | Exact match | `"field": "location", "equals": "westeurope"` |
| `notEquals` | Does not match | `"field": "location", "notEquals": "westus"` |
| `in` | Matches any value in a list | `"field": "location", "in": ["westeurope", "northeurope"]` |
| `notIn` | Does not match any in list | `"field": "type", "notIn": ["Microsoft.Compute/virtualMachines"]` |
| `contains` | String contains | `"field": "name", "contains": "prod"` |
| `like` | Pattern match with wildcards | `"field": "type", "like": "Microsoft.Compute/*"` |
| `exists` | Property exists or not | `"field": "tags.environment", "exists": "true"` |
| `containsKey` | Object contains a key | `"field": "tags", "containsKey": "department"` |

---

## Logical Operators — Combining Conditions

| Operator | JSON Syntax | Behavior |
|----------|-------------|----------|
| **allOf** | `"allOf": [{condition1}, {condition2}]` | AND — all conditions must be true |
| **anyOf** | `"anyOf": [{condition1}, {condition2}]` | OR — at least one must be true |
| **not** | `"not": {condition}` | Inverts the result |

These can be nested to create complex logic, just like the dynamic group rules you studied earlier.

---

## Example 1: Allowed Locations (Built-In)

This is the exact policy you assigned to the HR management group.

```json
{
  "properties": {
    "displayName": "Allowed locations",
    "description": "Restrict the locations where resources can be deployed.",
    "mode": "Indexed",
    "metadata": {
      "version": "1.0.0",
      "category": "Locations"
    },
    "parameters": {
      "allowedLocations": {
        "type": "array",
        "metadata": {
          "description": "The list of allowed locations",
          "strongType": "location",
          "displayName": "Allowed locations"
        },
        "defaultValue": ["westus2"]
      }
    },
    "policyRule": {
      "if": {
        "not": {
          "field": "location",
          "in": "[parameters('allowedLocations')]"
        }
      },
      "then": {
        "effect": "deny"
      }
    }
  }
}
```

### How to read this:
- **Parameters:** `allowedLocations` is an array that gets populated at assignment time (you picked `swedencentral`, `francecentral`, `belgiumcentral`)
- **Rule:** IF the resource's `location` is NOT in the allowed list → THEN deny
- `[parameters('allowedLocations')]` is a function reference that reads the parameter value at runtime
- `strongType: "location"` tells the portal to show a location picker dropdown during assignment

### Why your hr-vm1 in West US was flagged:
```
location = "westus"
allowedLocations = ["swedencentral", "francecentral", "belgiumcentral"]
"westus" NOT IN allowedLocations → true → effect: deny (for new) / non-compliant (for existing)
```

---

## Example 2: Deny All Resource Creation (Custom)

This is the custom policy you created for the HR management group scenario.

```json
{
  "properties": {
    "displayName": "Deny all resource creation",
    "description": "Blocks creation of any Azure resource. Used for
                     departments that should not deploy resources.",
    "mode": "All",
    "metadata": {
      "version": "1.0.0",
      "category": "General"
    },
    "parameters": {},
    "policyRule": {
      "if": {
        "field": "type",
        "like": "Microsoft.*"
      },
      "then": {
        "effect": "deny"
      }
    }
  }
}
```

### How to read this:
- **Mode:** `All` — evaluates every resource type (including resource groups themselves)
- **Rule:** IF the resource type matches `Microsoft.*` (any Azure resource) → THEN deny
- **No parameters** — this policy is absolute, no configuration needed
- The `like` operator with `Microsoft.*` matches every Azure resource provider

---

## Example 3: Allowed Resource Types (Built-In Pattern)

Restrict which types of resources can be created — useful for the "IT can only create VMs" scenario.

```json
{
  "properties": {
    "displayName": "Allowed resource types",
    "description": "Only allow specified resource types to be deployed.",
    "mode": "All",
    "parameters": {
      "listOfResourceTypesAllowed": {
        "type": "array",
        "metadata": {
          "description": "The list of resource types that can be deployed",
          "strongType": "resourceTypes",
          "displayName": "Allowed resource types"
        }
      }
    },
    "policyRule": {
      "if": {
        "not": {
          "field": "type",
          "in": "[parameters('listOfResourceTypesAllowed')]"
        }
      },
      "then": {
        "effect": "deny"
      }
    }
  }
}
```

### How to read this:
- Same pattern as Allowed Locations, but checks `type` instead of `location`
- At assignment, you'd select types like `Microsoft.Compute/virtualMachines`, `Microsoft.Compute/disks`, etc.
- Anything not in the allowed list gets denied

---

## Example 4: Require a Tag on Resources (Custom)

Ensure every resource has a `department` tag.

```json
{
  "properties": {
    "displayName": "Require department tag on resources",
    "description": "Denies creation of any resource that does not have
                     a 'department' tag.",
    "mode": "Indexed",
    "metadata": {
      "version": "1.0.0",
      "category": "Tags"
    },
    "parameters": {},
    "policyRule": {
      "if": {
        "field": "tags.department",
        "exists": "false"
      },
      "then": {
        "effect": "deny"
      }
    }
  }
}
```

### How to read this:
- **Mode:** `Indexed` — only evaluates resources that support tags
- **Rule:** IF the tag `department` does not exist on the resource → THEN deny
- `tags.department` uses dot notation to check for a specific tag key
- `exists: "false"` triggers when the tag is missing

---

## Example 5: Combining Conditions with allOf (AND)

Only allow VMs in European regions — combines a resource type check with a location check.

```json
{
  "properties": {
    "displayName": "VMs only in Europe",
    "description": "Deny VMs outside of European regions while allowing
                     other resource types anywhere.",
    "mode": "All",
    "metadata": {
      "version": "1.0.0",
      "category": "Compute"
    },
    "parameters": {},
    "policyRule": {
      "if": {
        "allOf": [
          {
            "field": "type",
            "equals": "Microsoft.Compute/virtualMachines"
          },
          {
            "not": {
              "field": "location",
              "in": [
                "westeurope",
                "northeurope",
                "francecentral",
                "germanywestcentral",
                "swedencentral",
                "uksouth",
                "ukwest"
              ]
            }
          }
        ]
      },
      "then": {
        "effect": "deny"
      }
    }
  }
}
```

### How to read this:
- `allOf` = AND — both conditions must be true
- Condition 1: the resource IS a virtual machine
- Condition 2: the location is NOT in the European regions list
- Combined: IF the resource is a VM AND its location is not in Europe → deny
- Non-VM resources are unaffected because condition 1 would be false

---

## Example 6: Combining Conditions with anyOf (OR)

Audit resources that are missing either a `department` tag or a `costCenter` tag.

```json
{
  "properties": {
    "displayName": "Audit missing governance tags",
    "description": "Flags resources missing department or costCenter tags.",
    "mode": "Indexed",
    "parameters": {},
    "policyRule": {
      "if": {
        "anyOf": [
          {
            "field": "tags.department",
            "exists": "false"
          },
          {
            "field": "tags.costCenter",
            "exists": "false"
          }
        ]
      },
      "then": {
        "effect": "audit"
      }
    }
  }
}
```

### How to read this:
- `anyOf` = OR — if either condition is true, the effect triggers
- A resource missing `department` gets flagged
- A resource missing `costCenter` gets flagged
- A resource missing both also gets flagged
- Only resources that have BOTH tags are compliant
- Effect is `audit` — resources are flagged but not blocked

---

## Example 7: Nested Logic (allOf + anyOf)

Deny storage accounts that are not in Europe AND don't use HTTPS.

```json
{
  "properties": {
    "displayName": "Secure storage in Europe only",
    "mode": "Indexed",
    "policyRule": {
      "if": {
        "allOf": [
          {
            "field": "type",
            "equals": "Microsoft.Storage/storageAccounts"
          },
          {
            "anyOf": [
              {
                "not": {
                  "field": "location",
                  "in": ["westeurope", "northeurope"]
                }
              },
              {
                "field": "Microsoft.Storage/storageAccounts/supportsHttpsTrafficOnly",
                "notEquals": "true"
              }
            ]
          }
        ]
      },
      "then": {
        "effect": "deny"
      }
    }
  }
}
```

### How to read this:
- Outer `allOf`: resource must be a storage account AND match the inner condition
- Inner `anyOf`: the storage account is outside Europe OR doesn't enforce HTTPS
- Result: storage accounts are denied if they're outside Europe OR if they don't use HTTPS
- Storage accounts in Europe with HTTPS enabled are the only ones allowed

---

## Example 8: Modify Effect — Auto-Add Tags

Automatically inherit a tag from the resource group if the resource is missing it.

```json
{
  "properties": {
    "displayName": "Inherit department tag from resource group",
    "mode": "Indexed",
    "parameters": {
      "tagName": {
        "type": "String",
        "metadata": {
          "displayName": "Tag name",
          "description": "Name of the tag to inherit"
        },
        "defaultValue": "department"
      }
    },
    "policyRule": {
      "if": {
        "allOf": [
          {
            "field": "[concat('tags[', parameters('tagName'), ']')]",
            "exists": "false"
          },
          {
            "value": "[resourceGroup().tags[parameters('tagName')]]",
            "notEquals": ""
          }
        ]
      },
      "then": {
        "effect": "modify",
        "details": {
          "roleDefinitionIds": [
            "/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c"
          ],
          "operations": [
            {
              "operation": "addOrReplace",
              "field": "[concat('tags[', parameters('tagName'), ']')]",
              "value": "[resourceGroup().tags[parameters('tagName')]]"
            }
          ]
        }
      }
    }
  }
}
```

### How to read this:
- **IF** the resource is missing the tag AND the resource group has that tag
- **THEN** modify the resource to add the tag, copying the value from the resource group
- `roleDefinitionIds` specifies the Contributor role — the managed identity needs this to modify resources
- `operations` defines what change to make: `addOrReplace` the tag value
- This is a **remediation** policy — it actively fixes non-compliance

---

## Quick Reference — Logical Operators Comparison

| Operator | JSON | Behavior | Equivalent |
|----------|------|----------|------------|
| AND | `"allOf": [...]` | All conditions must be true | `condition1 AND condition2` |
| OR | `"anyOf": [...]` | At least one must be true | `condition1 OR condition2` |
| NOT | `"not": {...}` | Inverts the result | `NOT condition` |

These work identically to the dynamic group rules you studied — `allOf` is AND, `anyOf` is OR, and they can be nested to any depth.

---

## Quick Reference — Common Field Values

| Field | What It Checks | Example Value |
|-------|---------------|---------------|
| `type` | Azure resource type | `Microsoft.Compute/virtualMachines` |
| `location` | Resource region | `westeurope` |
| `tags` | All tags on the resource | Object |
| `tags.tagName` | Specific tag value | `"production"` |
| `name` | Resource name | `"my-vm-01"` |
| `kind` | Resource kind/subtype | `"StorageV2"` |
| `sku.name` | SKU/pricing tier | `"Standard_B1s"` |

---

## Creating and Assigning a Custom Policy via CLI

### Step 1: Create the definition
```bash
az policy definition create \
  --name "deny-all-resources" \
  --display-name "Deny all resource creation" \
  --description "Blocks all resource creation in this scope" \
  --rules '{
    "if": {
      "field": "type",
      "like": "Microsoft.*"
    },
    "then": {
      "effect": "deny"
    }
  }' \
  --mode All \
  --management-group "HR"
```

### Step 2: Assign it
```bash
az policy assignment create \
  --name "hr-deny-all" \
  --display-name "HR - Deny all resources" \
  --policy "deny-all-resources" \
  --scope "/providers/Microsoft.Management/managementGroups/HR"
```

### Step 3: Check compliance
```bash
az policy state trigger-scan --subscription "Azure Subscription HR"
az policy state summarize --management-group "HR"
```
