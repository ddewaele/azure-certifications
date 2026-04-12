# Dynamic Group Membership Rules — Microsoft Entra ID

> **Context:** This document covers the rule syntax used when creating dynamic membership groups in Microsoft Entra ID. Dynamic groups automatically add and remove members based on user (or device) properties — no manual assignment needed.
>
> **Prerequisites:** Dynamic groups require at least a Microsoft Entra ID Premium P1 license.

---

## How Dynamic Rules Work

When you create a security group or Microsoft 365 group with membership type set to "Dynamic User" (or "Dynamic Device" for security groups only), you define a rule. Entra ID continuously evaluates this rule against all users in your tenant. Anyone who matches is automatically added; anyone who stops matching is automatically removed.

You cannot manually add or remove members from a dynamic group — the rule is the sole authority.

---

## Rule Syntax

Every rule follows this basic pattern:

```
user.property -operator "value"
```

For example:

```
user.department -eq "IT"
```

This reads as: "if the user's department property equals IT, add them to the group."

---

## Operators

### Comparison Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `-eq` | Equals | `user.department -eq "IT"` |
| `-ne` | Not equals | `user.companyName -ne "Fabricam"` |
| `-startsWith` | Starts with | `user.jobTitle -startsWith "Senior"` |
| `-contains` | Contains | `user.jobTitle -contains "Architect"` |
| `-notContains` | Does not contain | `user.jobTitle -notContains "Intern"` |
| `-in` | Matches any value in a list | `user.department -in ["IT", "HR", "Finance"]` |
| `-notIn` | Does not match any value in a list | `user.department -notIn ["Temp", "Contractor"]` |
| `-match` | Regex match | `user.mailNickName -match "^admin_.*"` |
| `-notMatch` | Regex does not match | `user.mailNickName -notMatch "^test_.*"` |

### Notes on Operators
- String comparisons are **case-insensitive** — `"IT"` matches `"it"`, `"It"`, etc.
- The `-in` operator is cleaner than chaining multiple OR conditions for the same property.
- The `-match` and `-notMatch` operators use .NET-style regular expressions.

---

## Logical Operators: AND, OR, NOT

### AND — Both Conditions Must Be True

```
user.department -eq "IT" and user.companyName -eq "Contoso"
```

The user must be in IT **and** work for Contoso. If either condition is false, they don't qualify.

**Use AND when:** you want to narrow a group by combining multiple requirements.

### OR — Either Condition Qualifies

```
user.department -eq "IT" or user.city -eq "London"
```

The user qualifies if they're in IT, **or** if they live in London — regardless of the other condition. Either side being true is enough.

**Use OR when:** you want to create alternative, independent paths to membership.

### NOT — Negate a Condition

```
not (user.department -eq "Marketing")
```

Matches every user whose department is anything other than Marketing (including users with no department set).

**Use NOT when:** you want to exclude a specific group of users.

---

## Operator Precedence — The Critical Rule

When AND and OR appear in the same rule **without parentheses**, AND is evaluated first (higher precedence), just like multiplication before addition in math.

### Example Without Parentheses

```
user.department -eq "IT" and user.companyName -eq "Contoso" or user.city -eq "London"
```

This is evaluated as:

```
(user.department -eq "IT" and user.companyName -eq "Contoso") or user.city -eq "London"
```

**Result:** Two independent paths to membership:
1. User is in IT **and** at Contoso, **OR**
2. User is in London (regardless of department or company)

### The Dangerous Misreading

You might think the rule above means "must be in IT, and either from Contoso or in London." It does **not**. If you want that logic, you need explicit parentheses:

```
user.department -eq "IT" and (user.companyName -eq "Contoso" or user.city -eq "London")
```

**Best practice:** Always use parentheses when mixing AND and OR. Never rely on implicit precedence — make your intent explicit.

---

## Examples — Simple to Complex

### 1. Single Condition

**Goal:** All users in the IT department.

```
user.department -eq "IT"
```

| User | Department | Match? |
|------|-----------|--------|
| Alice | IT | Yes |
| Bob | IT | Yes |
| Carol | HR | No |
| Dan | Finance | No |

---

### 2. AND — Narrow by Two Properties

**Goal:** IT department users, but only from Contoso (exclude contractors from other companies).

```
user.department -eq "IT" and user.companyName -eq "Contoso"
```

| User | Department | Company | Match? |
|------|-----------|---------|--------|
| Alice | IT | Contoso | Yes |
| Bob | IT | Fabricam | No |
| Carol | HR | Contoso | No |
| Dan | Finance | Fabricam | No |

---

### 3. OR — Alternative Paths

**Goal:** Anyone in IT, or anyone based in London (regardless of department).

```
user.department -eq "IT" or user.city -eq "London"
```

| User | Department | City | Match? |
|------|-----------|------|--------|
| Alice | IT | Dubai | Yes |
| Bob | IT | Brussels | Yes |
| Carol | HR | Dubai | No |
| Dan | Finance | London | Yes |

---

### 4. NOT EQUALS — Exclude a Value

**Goal:** Everyone except users from Fabricam.

```
user.companyName -ne "Fabricam"
```

| User | Company | Match? |
|------|---------|--------|
| Alice | Contoso | Yes |
| Bob | Fabricam | No |
| Carol | Contoso | Yes |
| Dan | Fabricam | No |

---

### 5. STARTS WITH — Partial Match

**Goal:** Users whose job title starts with "Senior."

```
user.jobTitle -startsWith "Senior"
```

| User | Job Title | Match? |
|------|----------|--------|
| Alice | Senior Engineer | Yes |
| Bob | IT Administrator | No |
| Carol | Senior Analyst | Yes |
| Dan | Junior Developer | No |

---

### 6. IN — Match Against a List

**Goal:** Users in IT, HR, or Finance departments.

```
user.department -in ["IT", "HR", "Finance"]
```

This is functionally equivalent to:

```
user.department -eq "IT" or user.department -eq "HR" or user.department -eq "Finance"
```

But cleaner, especially as the list grows.

| User | Department | Match? |
|------|-----------|--------|
| Alice | IT | Yes |
| Bob | HR | Yes |
| Carol | Marketing | No |
| Dan | Finance | Yes |

---

### 7. AND + OR Combined — Two Paths

**Goal:** IT staff from Contoso, or anyone in London.

```
(user.department -eq "IT" and user.companyName -eq "Contoso") or user.city -eq "London"
```

| User | Department | Company | City | Match? | Why |
|------|-----------|---------|------|--------|-----|
| Alice | IT | Contoso | Dubai | Yes | AND path: IT + Contoso |
| Bob | IT | Fabricam | Brussels | No | IT but not Contoso; not London |
| Carol | HR | Contoso | Dubai | No | Not IT; not London |
| Eve | Marketing | Fabricam | London | Yes | OR path: London |

---

### 8. Complex Real-World Rule

**Goal:** Senior engineers or architects at Contoso, excluding anyone in the Brussels office.

```
(user.jobTitle -startsWith "Senior" or user.jobTitle -contains "Architect")
  and user.companyName -eq "Contoso"
  and user.city -ne "Brussels"
```

| User | Job Title | Company | City | Match? | Why |
|------|----------|---------|------|--------|-----|
| Alice | Senior Engineer | Contoso | Dubai | Yes | Senior + Contoso + not Brussels |
| Bob | Senior Developer | Contoso | Brussels | No | Senior + Contoso but in Brussels |
| Carol | Solutions Architect | Contoso | London | Yes | Architect + Contoso + not Brussels |
| Dan | Junior Developer | Contoso | Dubai | No | Title doesn't match |
| Eve | Senior Analyst | Fabricam | London | No | Not Contoso |

---

## Commonly Used Properties

| Property | Description | Example Use |
|----------|------------|-------------|
| `user.department` | Department name | Group by team |
| `user.companyName` | Company name | Separate subsidiaries or partners |
| `user.city` | Office city | Location-based access |
| `user.country` | Country code | Regional licensing or compliance |
| `user.jobTitle` | Job title | Role-based groups |
| `user.usageLocation` | License usage location | License assignment groups |
| `user.accountEnabled` | Account enabled/disabled | Exclude disabled accounts |
| `user.userType` | Member or Guest | Separate internal from external users |
| `user.mail` | Email address | Domain-based matching |
| `user.onPremisesSecurityIdentifier` | On-prem SID | Target synced hybrid users |

---

## Best Practices

1. **Always use parentheses** when combining AND and OR — never rely on implicit precedence.
2. **Keep rules as simple as possible** — Microsoft recommends caution with multiple OR branches, as each one creates an entirely independent qualification path.
3. **Complete user properties thoroughly** at account creation — dynamic rules can only match on properties that actually have values. A blank department field means the user will never match a department-based rule.
4. **Use `-in` instead of chaining ORs** when checking the same property against multiple values.
5. **Test rules before saving** — use the "Validate Rules" feature in the Azure portal to check specific users against your rule before applying it.
6. **Remember that dynamic groups take time to evaluate** — membership changes are not instant. After creating or modifying a rule, allow time for Entra to process all users.
7. **You cannot manually override** a dynamic group — if a user doesn't match the rule, you cannot force them in. Adjust the rule or the user's properties instead.

---

## Quick Reference — Operator Precedence

```
Highest priority → NOT
                  → AND
Lowest priority  → OR
```

When in doubt, add parentheses. Explicit grouping always wins over memorizing precedence.
