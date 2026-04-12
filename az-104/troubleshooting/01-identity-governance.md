# Troubleshooting: Identity and Governance

Covers Entra ID sign-in issues, RBAC, Azure Policy, Conditional Access, SSPR, PIM, and hybrid identity problems.

---

## Sign-In and Authentication

### User Cannot Sign In

**Symptom:** User gets an error when trying to sign in to the Azure portal or Microsoft 365.

| Root Cause | Diagnostic Check | Fix |
|-----------|-----------------|-----|
| Account disabled | Entra ID > Users > check "Account enabled" toggle | Re-enable the account |
| Account locked out (failed password attempts) | Sign-in logs show "Account is locked" | Wait for auto-unlock or admin resets password |
| MFA not configured but required | Security Defaults or CA policy requires MFA | User must register MFA methods at aka.ms/mfasetup |
| Conditional Access blocking sign-in | Sign-in logs > CA column shows which policy blocked | Review CA policy — check conditions (location, device, risk) |
| Password expired | Sign-in logs show "Password expired" | Reset password or enable SSPR |
| Blocked by Identity Protection (user risk: High) | Identity Protection > Risky users | Admin dismisses risk or user does SSPR to self-remediate |
| Sign-in blocked by Named Location restriction | CA policy restricts to specific countries/IPs | Verify the user's IP — add to Named Location or adjust policy |
| Guest user not yet accepted invite | User objects shows "Invited" state | Resend invitation or have user check email |

**Key diagnostic tools:**
- **Entra ID > Sign-in logs** — most important first stop; shows exactly which CA policy blocked, which MFA method was used, risk level
- **Entra ID > Audit logs** — tracks changes to accounts and policies
- **"What If" tool** in Conditional Access — simulates which CA policies apply to a user/IP/app combination without actually triggering sign-in

---

### MFA Not Working

| Symptom | Cause | Fix |
|---------|-------|-----|
| User never receives SMS code | Phone number not registered, or carrier issue | Have user re-register in MFA portal; try Authenticator app instead |
| MFA prompt not appearing when expected | Security Defaults disabled + no CA policy configured | Enable Security Defaults OR create CA policy requiring MFA |
| MFA prompt appearing too frequently | No Conditional Access persistent session policy | Create CA session policy with "Sign-in frequency" setting |
| User locked out of MFA | All MFA methods lost (new phone) | Admin temporarily bypasses MFA from Entra ID > Users > Authentication methods, or use the one-time bypass |
| Security Defaults and CA policies conflict | Both enabled simultaneously | Security Defaults must be **disabled** before using CA policies — they are mutually exclusive |

---

### Self-Service Password Reset (SSPR) Not Working

| Symptom | Cause | Fix |
|---------|-------|-----|
| "SSPR is not enabled for your account" | SSPR scope set to None or Selected but user not in group | Set SSPR to All, or add user to the enabled group |
| User can reset in cloud but old password still works on-prem | Password writeback not configured | Enable password writeback in Entra Connect + requires P1 license |
| User cannot complete reset — no registered methods | User never registered auth methods for SSPR | Enable "Require users to register on sign-in" OR admin pre-populates phone/email |
| SSPR fails for synced (hybrid) user | Password writeback agent not running | Check Entra Connect service on the sync server; check writeback is enabled in Entra Connect wizard |
| Admin accounts cannot use SSPR | Admin accounts require 2 auth methods; SSPR scope may exclude admins | By design — admins always need 2 methods; Global Admins cannot use SSPR (use Microsoft support) |

> **Exam note:** SSPR writeback to on-prem requires Entra ID **P1** license AND Entra Connect with password writeback enabled. Without writeback, the cloud password changes but the on-prem AD password is unchanged.

---

## RBAC and Access Issues

### User Cannot Access a Resource Despite Having a Role

| Symptom | Cause | Fix |
|---------|-------|-----|
| Role was just assigned but access still denied | RBAC propagation delay (up to 5 minutes) | Wait and retry |
| User has Reader but cannot perform an action | Reader is read-only — they need Contributor or a specific role | Assign the correct role at the right scope |
| User has Contributor but cannot assign roles | Contributor cannot manage access — needs Owner or User Access Administrator | Assign Owner or User Access Administrator at the required scope |
| Role assigned at subscription but resource still denied | Resource is in a different subscription | Verify the subscription the resource is in; assign role in that subscription |
| Custom role changes not taking effect | Propagation delay after updating a custom role definition | Wait up to 5 minutes; custom role updates also propagate globally |
| Service principal or managed identity cannot access resource | Role not assigned to the service principal's object ID | Assign role to the managed identity/service principal, not the app registration display name |

**How to diagnose effective permissions:**
1. **Portal:** Resource > Access control (IAM) > "Check access" tab — enter any user/group/principal and see their effective permissions
2. **CLI:** `az role assignment list --assignee <upn>` — lists all assignments
3. **PowerShell:** `Get-AzRoleAssignment -SignInName <upn>` — lists all assignments

> **Exam note:** RBAC is **additive** — the effective permissions are the union of all role assignments across all scopes. There is no way to "deny" with RBAC alone (only Azure Blueprints and deny assignments can block). NotActions in a role definition do NOT create a deny — they just remove that action from the role's grant.

---

### Resource Lock Blocking an Operation

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Cannot delete resource, it is locked" | CanNotDelete lock on resource or parent resource group | Remove the lock first, then delete |
| Cannot start/stop a VM despite having Contributor | ReadOnly lock on the VM or resource group — ReadOnly blocks ALL writes including start/stop | Remove ReadOnly lock |
| Cannot add a subnet despite VNet Contributor role | ReadOnly lock on the VNet or resource group | Remove the lock |
| Azure Policy Modify effect fails | Resource has ReadOnly lock — Policy Modify effect cannot write | Remove lock, or exempt the resource from the policy |

> **Exam note:** Locks are **inherited** from parent scopes. A lock on a resource group applies to all resources within it. Only the Owner or User Access Administrator role can create/remove locks. A ReadOnly lock is more restrictive than CanNotDelete — it blocks all write and delete operations.

---

### Azure Policy Non-Compliance

| Symptom | Cause | Fix |
|---------|-------|-----|
| Resource created without required tag despite Require tag policy | Policy has Audit effect, not Deny | Change policy effect to Deny to block at creation time |
| Policy non-compliant but remediation task fails | Policy uses Modify or DeployIfNotExists effect but managed identity for policy assignment lacks permissions | Grant the policy assignment's managed identity the required role (e.g., Contributor) |
| Newly assigned policy shows existing resources as non-compliant | Policy only evaluates new resources by default | Run a remediation task for existing resources |
| Policy assignment not taking effect immediately | Policy propagation delay (up to 30 minutes) | Wait and trigger a compliance scan: `az policy state trigger-scan` |
| Resource exempt from policy incorrectly | Policy exemption expired or was on wrong scope | Check exemptions under Policy > Exemptions |

---

## Entra Connect / Hybrid Identity

### Users Not Syncing to Entra ID

| Symptom | Cause | Fix |
|---------|-------|-----|
| User exists in on-prem AD but not in Entra ID | OU containing user is excluded from sync scope | Open Entra Connect wizard > Configure filtering > include the OU |
| User synced but attributes are missing/wrong | Attribute not in sync scope or wrong value in AD | Check Entra Connect sync rules; verify attribute in AD DS |
| Sync errors in Entra Connect Health | Duplicate UPN or ProxyAddress attribute conflict | Fix the duplicate attribute in AD DS — two objects cannot share the same UPN or proxy address |
| Delta sync not running every 30 minutes | Entra Connect scheduler disabled or service stopped | Check service: `Get-ADSyncScheduler`; start sync manually: `Start-ADSyncSyncCycle -PolicyType Delta` |
| Password not syncing (PHS) | Password sync not enabled in Entra Connect | Run Entra Connect wizard > change sign-in method > enable password hash sync |
| Password changed on-prem but Entra ID still has old password | PHS syncs hashes; delay is normally < 2 minutes | Check sync service; may be a sync queue backlog |

### PTA Agent Not Validating Passwords

| Symptom | Cause | Fix |
|---------|-------|-----|
| Sign-in fails for all users simultaneously | All PTA agents are down or can't reach AD DS | Check PTA agent service on on-prem servers; verify network connectivity |
| Some users can sign in, others cannot | PTA agent installed on server without AD DS connectivity | Ensure all PTA agent servers can reach domain controllers |
| PTA agent shows "Inactive" in portal | Agent not running or connectivity to Azure lost | Restart the PTA agent service; check firewall for outbound TCP 80/443 |

> **Exam note:** PTA agents use **outbound** connections to Azure Service Bus — no inbound firewall rules needed on the agent servers. Deploy at least **3 PTA agents** for high availability.

---

## Privileged Identity Management (PIM)

| Symptom | Cause | Fix |
|---------|-------|-----|
| User cannot activate PIM role | User not added as "eligible" for that role | PIM admin must add user as eligible in PIM > Azure AD Roles or Azure Resources |
| Activation request stuck pending | Role requires approval and approver hasn't acted | Approver must approve in PIM > Pending Approvals; configure email notifications for approvers |
| Activation fails with MFA error | PIM is configured to require MFA on activation | User must complete MFA before or during activation |
| Activation succeeded but permissions not working | Propagation delay after PIM activates role | Wait a few minutes; RBAC changes from PIM can take up to 5 minutes to propagate |
| Access Review not completing | Reviewer hasn't taken action; review expired | Check review status; configure auto-apply results on expiry |

---

## B2B Guest Users

| Symptom | Cause | Fix |
|---------|-------|-----|
| Guest cannot access shared resource | Guest has no RBAC assignment on the resource | Assign a role to the guest user (or a group containing them) |
| Invitation email not received | Spam filter, or invitation sent to wrong address | Resend invite; check if domain is blocked in External Identities > Cross-tenant access settings |
| Guest redemption loop (keeps asking to accept) | Browser caching old session; guest is using wrong account | Clear browser cache; guest should accept with the specific email the invite was sent to |
| Guest blocked by Conditional Access | CA policy "All users" includes guests | Create a CA policy exclusion for guest users, or use a separate policy with appropriate controls |
| "You don't have access to this" despite RBAC | Usage location not set on guest prevents license assignment | Set usage location on the guest user object |

---

## Exam Quick Reference

| Scenario | First Check |
|----------|------------|
| User can't sign in | Entra ID Sign-in logs |
| RBAC not working | Check access blade on resource; verify scope |
| Policy not blocking | Check effect — must be Deny, not Audit |
| SSPR writeback not working | P1 license + Entra Connect password writeback enabled |
| Sync not working | Entra Connect Health dashboard |
| Guest can't access | RBAC assignment + invitation redemption status |
| PIM activation fails | Eligible assignment exists + MFA satisfied |
| Lock blocking operation | Check parent resource group for inherited locks |
