# Zero Trust and Microsoft Entra ID Cheat Sheet

## Zero Trust Principles

| Principle | Meaning | M365 Implementation |
|-----------|---------|---------------------|
| **Verify explicitly** | Never trust, always verify every request | MFA, Conditional Access, risk-based policies |
| **Least privilege** | Give minimum access needed | PIM, just-in-time access, scoped roles |
| **Assume breach** | Limit blast radius, detect threats | Defender XDR, segmentation, encryption |

## Conditional Access Decision Flow

```
Sign-in request received
  │
  ├── Evaluate signals:
  │     • Who? (user, group, role)
  │     • Where? (location, IP, named location)
  │     • What? (which app)
  │     • How? (device compliance, OS, browser)
  │     • Risk? (sign-in risk, user risk)
  │
  ├── Match against policies
  │
  └── Apply controls:
        • Grant: Allow (with MFA, compliant device, etc.)
        • Block: Deny access
        • Session: App-enforced restrictions, sign-in frequency
```

## Common Conditional Access Scenarios

| Scenario | Condition | Control |
|----------|-----------|---------|
| Require MFA for external access | Location: not trusted | Grant: require MFA |
| Block legacy authentication | Client app: legacy | Block |
| Require compliant devices | Device: not compliant | Grant: require compliant device |
| Restrict access for guests | User type: guest | Grant: require MFA + ToU |
| High-risk sign-in | Risk level: high | Block (or require MFA + password change) |

## Microsoft Entra ID Roles (Key Ones)

| Role | Permissions |
|------|------------|
| **Global Administrator** | Full access to all admin features (use sparingly) |
| **User Administrator** | Create/manage users and groups, reset passwords |
| **Security Administrator** | Manage security features, CA policies, Defender |
| **Compliance Administrator** | Manage Purview compliance features |
| **Exchange Administrator** | Manage Exchange Online settings |
| **SharePoint Administrator** | Manage SharePoint Online settings |
| **Teams Administrator** | Manage Teams settings |

## Authentication Methods Comparison

| Method | Type | Security Level |
|--------|------|---------------|
| **Password only** | Something you know | Low (phishable) |
| **Password + MFA** | Know + have/are | Medium |
| **Microsoft Authenticator (passwordless)** | Have + are (biometric) | High |
| **FIDO2 security key** | Have (physical key) | Very high (phishing-resistant) |
| **Windows Hello for Business** | Are (biometric) + have (device) | Very high (phishing-resistant) |
| **Certificate-based auth** | Have (certificate) | High |

## PIM (Privileged Identity Management) Flow

```
1. Admin is ELIGIBLE for a role (not active)
2. Admin REQUESTS activation
3. Approval required? → Approver reviews and approves
4. Admin activates role for LIMITED TIME (e.g., 4 hours)
5. Role EXPIRES automatically after time limit
6. All activations are LOGGED for audit
```

Benefits:
- No permanent admin privileges
- Approval workflow for sensitive roles
- Time-limited access
- Full audit trail
- Alerts on role activations

## Identity Secure Score — Top Improvement Actions

| Action | Impact |
|--------|--------|
| Enable MFA for all users | High |
| Block legacy authentication | High |
| Enable password protection (banned passwords) | Medium |
| Configure sign-in risk policy | Medium |
| Enable self-service password reset (SSPR) | Medium |
| Require MFA for admin roles | High |
| Review and remove stale guest accounts | Medium |
