# AZ-104 Troubleshooting Guide

Practical troubleshooting knowledge for the AZ-104 exam, organized by Azure service domain.  
Based on the official Microsoft Azure troubleshooting documentation at https://learn.microsoft.com/en-us/troubleshoot/azure/

---

## Contents

| File | Topics Covered |
|------|---------------|
| [01-identity-governance.md](01-identity-governance.md) | Sign-in failures, MFA, SSPR, RBAC, Azure Policy, resource locks, Entra Connect, PIM, B2B guests |
| [02-virtual-machines.md](02-virtual-machines.md) | RDP/SSH connectivity, boot failures, disk issues, VM extensions, performance |
| [03-networking.md](03-networking.md) | NSGs, VNet peering, routing/UDR, DNS, VPN Gateway, Load Balancer, Application Gateway, Network Watcher |
| [04-storage.md](04-storage.md) | Blob access/auth, network rules, soft delete, Azure Files SMB, File Sync, SAS tokens |
| [05-monitoring-backup.md](05-monitoring-backup.md) | Azure Monitor alerts, Log Analytics agents, diagnostic settings, Azure Backup, Site Recovery |

## Quizzes

| File | Topic | Difficulty |
|------|-------|-----------|
| [../quiz/16-troubleshooting-identity-networking.json](../quiz/16-troubleshooting-identity-networking.json) | Identity + Networking troubleshooting | Mixed |
| [../quiz/17-troubleshooting-vms-storage.json](../quiz/17-troubleshooting-vms-storage.json) | VM + Storage troubleshooting | Mixed |
| [../quiz/18-troubleshooting-monitoring-backup.json](../quiz/18-troubleshooting-monitoring-backup.json) | Monitoring + Backup troubleshooting | Mixed |
| [../quiz/19-troubleshooting-scenarios-medium.json](../quiz/19-troubleshooting-scenarios-medium.json) | Scenario-based troubleshooting | Medium |
| [../quiz/20-troubleshooting-scenarios-hard.json](../quiz/20-troubleshooting-scenarios-hard.json) | Advanced scenario troubleshooting | Hard |

---

## Quick Reference: Most-Tested Troubleshooting Scenarios

### "Cannot connect to VM"
1. VM running? → Start it
2. Public IP assigned? → Assign one, or use Bastion
3. NSG allows RDP (3389) / SSH (22)? → Add inbound rule
4. Boot diagnostics shows error? → Fix OS issue
5. Still failing? → Reset RDP/SSH config via portal → Redeploy

### "Role assigned but still no access"
1. Wait 5 minutes (RBAC propagation delay)
2. Check scope — was it assigned in the right subscription/RG?
3. Check if it's a data plane role (Storage Blob Data Contributor) vs management plane (Contributor)
4. Check for resource locks

### "Storage account access denied"
1. Is network firewall enabled? Check selected networks rules
2. Is the SAS token expired?
3. Was the account key rotated after SAS was issued?
4. Is the RBAC role a data role (Storage Blob Data Reader) not just Contributor?

### "VNet peering not working"
1. Check peering state — must be Connected on BOTH sides
2. Check for overlapping address spaces
3. Check NSG rules between peered VNets
4. Hub-spoke? Check "Allow gateway transit" and "Use remote gateways" settings

### "Alert not firing"
1. Is the action group attached?
2. Is the threshold/aggregation correct?
3. Test the action group manually
4. Check if log alert KQL query returns results in the time window
