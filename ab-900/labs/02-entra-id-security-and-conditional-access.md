# Lab 02: Microsoft Entra ID Security and Conditional Access

## Overview

Explore Microsoft Entra ID security features including users, groups, Conditional Access policies, Identity Secure Score, sign-in logs, and audit logs.

### Learning Objectives

- Navigate Microsoft Entra admin center
- Review Identity Secure Score and improvement actions
- Create and test a Conditional Access policy
- Investigate sign-in and audit logs
- Explore Privileged Identity Management (PIM)

## Prerequisites

- Microsoft 365 tenant with Entra ID P1 or P2 (included in M365 E5)
- Global Administrator or Security Administrator role

## Steps

### 1. Navigate Microsoft Entra Admin Center

Navigate to https://entra.microsoft.com

**Explore:**
1. **Identity > Users** — view all users, sign-in activity, assigned roles
2. **Identity > Groups** — security groups, M365 groups, dynamic groups
3. **Identity > Applications > App registrations** — view registered applications
4. **Identity > Applications > Enterprise applications** — view third-party and custom apps with SSO

### 2. Review Identity Secure Score

1. Navigate to **Protection > Identity Secure Score**
2. Review your current score (percentage)
3. Click on **Improvement actions** to see recommendations:
   - Enable MFA for all users
   - Block legacy authentication
   - Enable sign-in risk policy
   - Configure password protection
4. Note the **impact** and **effort** for each action

### 3. Create a Conditional Access Policy

1. Navigate to **Protection > Conditional Access > Policies**
2. Click **+ New policy**
3. Configure:
   - **Name:** Require MFA for external access
   - **Users:** All users (or a test group)
   - **Cloud apps:** All cloud apps
   - **Conditions > Locations:** Exclude trusted office locations
   - **Grant:** Require multi-factor authentication
4. Set the policy to **Report-only** mode first (to test without enforcing)
5. Click **Create**

### 4. Test with the "What If" Tool

1. In Conditional Access, click **What If**
2. Configure a test scenario:
   - **User:** Select a test user
   - **Cloud app:** Microsoft 365
   - **Location:** An untrusted IP
3. Click **What If** to see which policies would apply
4. Review the results — your new policy should appear

### 5. Investigate Sign-In Logs

1. Navigate to **Monitoring > Sign-in logs**
2. Filter by:
   - **Date range:** Last 7 days
   - **Status:** Failure
3. Click on a failed sign-in to see:
   - Conditional Access policies applied
   - MFA prompted or not
   - Failure reason (wrong password, blocked by CA, etc.)
   - Location, device, and app details

### 6. Review Audit Logs

1. Navigate to **Monitoring > Audit logs**
2. Filter by:
   - **Activity type:** User management activities
3. View recent changes (user created, role assigned, password reset)

### 7. Explore PIM (if available with P2 license)

1. Navigate to **Identity Governance > Privileged Identity Management**
2. Review **My roles** — eligible and active roles
3. Review **Approve requests** — pending role activation requests
4. Explore **Azure AD roles** — see which roles are configured for PIM

## Summary

You explored Microsoft Entra ID security features including Identity Secure Score, created a Conditional Access policy in report-only mode, tested it with the "What If" tool, and investigated sign-in and audit logs.

## Key Takeaways

- **Identity Secure Score** gives a percentage-based security posture with actionable recommendations
- **Conditional Access** policies use if/then logic based on signals (user, location, device, risk)
- Always test CA policies in **Report-only** mode before enforcing
- **Sign-in logs** show every authentication attempt with applied policies and failure reasons
- **PIM** enables just-in-time privileged access instead of permanent admin roles
