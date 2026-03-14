# Identity, Access, and Security

Identity is the new perimeter. Understanding Azure's identity and security model is essential for both AZ-900 and real-world usage.

---

## Microsoft Entra ID (formerly Azure Active Directory)

Microsoft Entra ID is Azure's cloud-based identity and access management service.

- **Not** the same as Windows Server Active Directory (though they can be integrated)
- Used for authentication and authorization across Azure, Microsoft 365, and third-party apps
- Every Azure subscription is associated with one Entra ID tenant

### Key Concepts

| Concept | Description |
|---|---|
| **Tenant** | A dedicated instance of Entra ID for your organization |
| **User** | An identity (person or service) in the directory |
| **Group** | A collection of users for easier permission management |
| **Service Principal** | An application identity (non-human) |
| **Managed Identity** | Auto-managed service principal for Azure resources (no credentials to handle) |

```bash
# Show current signed-in user
az ad signed-in-user show

# List users in the tenant
az ad user list --output table

# List groups
az ad group list --output table
```

### Authentication Methods
- Username + password
- Multi-Factor Authentication (MFA)
- Passwordless (Windows Hello, FIDO2 security key, Microsoft Authenticator)
- Single Sign-On (SSO) — sign in once, access multiple apps

### Entra ID vs On-Premises AD

| | Entra ID | On-Premises AD |
|---|---|---|
| Protocol | REST/HTTPS, OAuth, OIDC, SAML | Kerberos, LDAP, NTLM |
| Communication | HTTP/S | Domain services |
| Structure | Flat (no OUs by default) | Hierarchical (OUs, GPOs) |
| Use case | Cloud apps, SaaS, Azure | Domain-joined machines, on-premises |

**Microsoft Entra Domain Services** can provide traditional AD capabilities (domain join, group policy) without managing domain controllers.

---

## Authentication vs Authorization

| | Authentication (AuthN) | Authorization (AuthZ) |
|---|---|---|
| Question | Who are you? | What are you allowed to do? |
| Proves | Identity | Permissions |
| Azure service | Entra ID | Azure RBAC |

---

## Azure Role-Based Access Control (RBAC)

RBAC controls what authenticated users can do with Azure resources.

### How It Works
An RBAC **role assignment** = Role + Principal + Scope

- **Role** — a set of permissions (e.g., "Contributor", "Reader")
- **Principal** — who gets the role (user, group, service principal, managed identity)
- **Scope** — where the role applies (management group, subscription, resource group, or resource)

Permissions are **additive** — if you have multiple role assignments, you have the union of all permissions.

### Built-in Roles

| Role | Permissions |
|---|---|
| **Owner** | Full access including the ability to delegate access |
| **Contributor** | Create and manage all resources, cannot grant access |
| **Reader** | View resources, cannot make changes |
| **User Access Administrator** | Manage user access only |

Many service-specific roles also exist: `Virtual Machine Contributor`, `Storage Blob Data Reader`, etc.

```bash
# List role assignments for a resource group
az role assignment list --resource-group my-rg --output table

# Assign a role
az role assignment create \
  --assignee user@example.com \
  --role "Contributor" \
  --scope /subscriptions/<sub-id>/resourceGroups/my-rg

# List available role definitions
az role definition list --output table
```

### Principle of Least Privilege
Always grant the minimum permissions needed. Prefer assigning roles to groups over individuals, and scope assignments as narrowly as possible.

---

## Zero Trust Model

Zero Trust is a security model based on: **"Never trust, always verify."**

Traditional model: trust everything inside the corporate network.
Zero Trust: assume breach, verify explicitly, limit blast radius.

Three principles:
1. **Verify explicitly** — always authenticate and authorize based on all available signals (identity, location, device, service, data classification)
2. **Use least privilege access** — limit user access with just-in-time, just-enough access
3. **Assume breach** — minimize blast radius, segment access, encrypt everything, monitor everything

---

## Defense in Depth

Defense in depth is a layered security strategy — if one layer is breached, others continue to protect.

```
Layer 1: Physical security (datacenters — Azure's responsibility)
Layer 2: Identity & access (Entra ID, MFA, RBAC)
Layer 3: Perimeter (DDoS protection, Azure Firewall)
Layer 4: Network (NSGs, VNet segmentation)
Layer 5: Compute (OS patching, endpoint protection)
Layer 6: Application (secure coding, no credentials in code)
Layer 7: Data (encryption at rest and in transit)
```

Each layer has its own controls. Even if an attacker gets past one layer, they face the next.

---

## Microsoft Defender for Cloud

Defender for Cloud is a unified security management and threat protection tool.

- **Security posture management**: continuously assesses your resources and shows a Secure Score
- **Workload protection**: detects and responds to threats across VMs, containers, databases, storage, etc.
- **Regulatory compliance**: tracks compliance against standards (CIS, PCI DSS, ISO 27001, etc.)

Two modes:
- **Free** — security posture assessment only
- **Defender plans** — paid per resource type, adds threat detection and advanced protections

```bash
# Check Defender for Cloud status
az security auto-provisioning-setting list --output table

# View security assessments
az security assessment list --output table
```

---

## Conditional Access

Conditional Access policies define rules for when and how users can access resources:

- "If user is signing in from outside the corporate network, require MFA"
- "If device is not compliant, block access"
- "If user is accessing sensitive data, require approved app"

Requires Entra ID P1 or P2 (not included in free tier).

---

## Key Concepts Summary

| Concept | One-liner |
|---|---|
| Entra ID | Cloud identity provider for Azure |
| Authentication | Proving who you are |
| Authorization | Deciding what you can do |
| RBAC | Permission system based on roles at a scope |
| Zero Trust | Never trust, always verify |
| Defense in depth | Multiple security layers |
| Defender for Cloud | Security posture + threat detection |
| Managed Identity | Service identity with no credentials to manage |
| MFA | Require a second factor beyond password |
