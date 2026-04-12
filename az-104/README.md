# AZ-104 -- Microsoft Azure Administrator

Study guide and practice materials for the **Microsoft Certified: Azure Administrator Associate** certification.

## Exam Overview

| Detail | Value |
|--------|-------|
| Exam code | AZ-104 |
| Level | Associate |
| Duration | 100 minutes |
| Passing score | 700 / 1000 |
| Question types | Multiple choice, multiple select, drag-and-drop, case studies |
| Cost | ~$165 USD (varies by country) |
| Prerequisites | Familiarity with Azure services, PowerShell/CLI, networking, and virtualisation |
| Languages | English, Chinese (Simplified), Korean, Japanese, French, Spanish, German, Portuguese (Brazil), and others |

## Exam Domains

| # | Domain | Weight |
|---|--------|--------|
| 1 | Manage Azure identities and governance | 20-25% |
| 2 | Implement and manage storage | 15-20% |
| 3 | Deploy and manage Azure compute resources | 20-25% |
| 4 | Implement and manage virtual networking | 15-20% |
| 5 | Monitor and maintain Azure resources | 10-15% |

## Concepts

- [01 - Manage Azure Identities and Governance](./concepts/01-manage-azure-identities-governance.md) (20-25%)
- [02 - Implement and Manage Storage](./concepts/02-implement-manage-storage.md) (15-20%)
- [03 - Deploy and Manage Azure Compute Resources](./concepts/03-deploy-manage-compute.md) (20-25%)
- [04 - Implement and Manage Virtual Networking](./concepts/04-implement-manage-virtual-networking.md) (15-20%)
- [05 - Monitor and Maintain Azure Resources](./concepts/05-monitor-maintain-azure-resources.md) (10-15%)

## Quiz Bank

560 multiple-choice questions across 28 quiz files covering all AZ-104 exam domains.

Run all quizzes: `node cli/cli.js az-104/quiz` from the repo root — see [Quiz README](../quiz/README.md) for usage.

### Domain Foundations (Easy–Medium)

| File | Topic | Questions | Difficulty |
|------|-------|-----------|------------|
| [01](./quiz/01-identities-governance.json) | Identities and Governance | 20 | Easy |
| [02](./quiz/02-storage.json) | Storage | 20 | Easy |
| [03](./quiz/03-compute.json) | Compute Resources | 20 | Medium |
| [04](./quiz/04-networking.json) | Virtual Networking | 20 | Hard |
| [05](./quiz/05-mixed-review.json) | Mixed Review | 20 | Mixed |

### Entra ID Deep Dive

| File | Topic | Questions | Difficulty |
|------|-------|-----------|------------|
| [06](./quiz/06-entra-id-fundamentals.json) | Entra ID Fundamentals | 20 | Easy |
| [07](./quiz/07-entra-id-users-groups.json) | Users and Groups | 20 | Easy |
| [08](./quiz/08-entra-id-hybrid-identity.json) | Hybrid Identity | 20 | Medium |
| [09](./quiz/09-entra-domain-services.json) | Domain Services | 20 | Medium |
| [10](./quiz/10-entra-id-security.json) | Security (MFA, CA, PIM) | 20 | Medium |
| [11](./quiz/11-entra-id-easy-review.json) | Easy Review | 20 | Easy |
| [12](./quiz/12-entra-id-medium-rbac-governance.json) | RBAC and Governance | 20 | Medium |
| [13](./quiz/13-entra-id-medium-hybrid-auth.json) | Hybrid Authentication | 20 | Medium |
| [14](./quiz/14-entra-id-hard-advanced-scenarios.json) | Advanced Scenarios | 20 | Hard |
| [15](./quiz/15-entra-id-hard-troubleshooting.json) | Troubleshooting | 20 | Hard |

### Advanced Domain Topics

| File | Topic | Questions | Difficulty |
|------|-------|-----------|------------|
| [21](./quiz/21-storage-advanced.json) | Storage Advanced (WORM, SAS, lifecycle, CMK) | 20 | Medium–Hard |
| [22](./quiz/22-compute-advanced.json) | Compute Advanced (VMSS, App Service, ACI) | 20 | Medium–Hard |
| [23](./quiz/23-networking-advanced.json) | Networking Advanced (LB, App GW, DNS, Firewall) | 20 | Medium–Hard |
| [24](./quiz/24-monitoring-governance.json) | Monitoring and Governance (Monitor, Policy, Cost) | 20 | Medium |
| [25](./quiz/25-mixed-hard-scenarios.json) | Mixed Hard Scenarios (final exam prep) | 20 | Hard |

### Windows VM Focus

| File | Topic | Questions | Difficulty |
|------|-------|-----------|------------|
| [26](./quiz/26-windows-vm-fundamentals.json) | Windows VM Fundamentals (disks, images, extensions) | 20 | Medium |
| [27](./quiz/27-windows-vm-connectivity-security.json) | Windows VM Connectivity and Security (RDP, Bastion, JIT) | 20 | Medium–Hard |
| [28](./quiz/28-windows-vm-operations-advanced.json) | Windows VM Operations (backup, updates, VMSS, repair) | 20 | Hard |

### Troubleshooting Scenarios

| File | Topic | Questions | Difficulty |
|------|-------|-----------|------------|
| [16](./quiz/16-troubleshooting-identity-networking.json) | Identity + Networking troubleshooting | 20 | Mixed |
| [17](./quiz/17-troubleshooting-vms-storage.json) | VM + Storage troubleshooting | 20 | Mixed |
| [18](./quiz/18-troubleshooting-monitoring-backup.json) | Monitoring + Backup troubleshooting | 20 | Mixed |
| [19](./quiz/19-troubleshooting-scenarios-medium.json) | Scenario-based troubleshooting | 20 | Medium |
| [20](./quiz/20-troubleshooting-scenarios-hard.json) | Advanced scenario troubleshooting | 20 | Hard |

## Hands-on Labs

- [01 - Manage Entra ID Identities](./labs/01-manage-entra-id-identities.md) — Users, groups, RBAC, SSPR
- [02 - Manage Subscriptions and RBAC](./labs/02-manage-subscriptions-rbac.md) — Governance, locks, policy, tags, cost management
- [03 - Manage Storage Accounts](./labs/03-manage-storage-accounts.md) — Redundancy, SAS, lifecycle, AzCopy
- [04 - Virtual Machines](./labs/04-virtual-machines.md) — Deploy VMs, Availability Sets, disks, Bastion, extensions
- [05 - Virtual Networking](./labs/05-virtual-networking.md) — VNets, NSGs, peering, DNS, UDR
- [06 - Monitor and Backup](./labs/06-monitor-backup.md) — Log Analytics, alerts, VM backup, Site Recovery

## Troubleshooting Guide

Practical troubleshooting knowledge for the AZ-104 exam, based on Microsoft's official Azure troubleshooting documentation.

- [Troubleshooting README](./troubleshooting/README.md) — Index + most-tested quick reference scenarios
- [01 - Identity and Governance](./troubleshooting/01-identity-governance.md) — Sign-in failures, MFA, SSPR, RBAC, Azure Policy, Entra Connect, PIM, B2B
- [02 - Virtual Machines](./troubleshooting/02-virtual-machines.md) — RDP/SSH, boot failures, disk issues, extensions, performance
- [03 - Networking](./troubleshooting/03-networking.md) — NSGs, VNet peering, routing, DNS, VPN Gateway, Load Balancer, Application Gateway, Network Watcher
- [04 - Storage](./troubleshooting/04-storage.md) — Blob access, network rules, soft delete, Azure Files SMB, File Sync, SAS tokens
- [05 - Monitoring and Backup](./troubleshooting/05-monitoring-backup.md) — Azure Monitor alerts, Log Analytics agents, diagnostic settings, Azure Backup, Site Recovery

## Cheatsheets

Quick-reference command sheets for exam and real-world use.

- [Azure CLI Cheatsheet](./cheatsheet-azcli.md) — Identity, storage, compute, networking, monitoring, Site Recovery
- [PowerShell Cheatsheet](./cheatsheet-powershell.md) — Az module philosophy, verb-noun patterns, all domains covered
- [General Cheatsheet](./cheatsheet.md) — Tables for RBAC, storage, compute, networking, backup

## Additional Resources

- [Glossary of Key Terms](./glossary.md) — ~70 AZ-104 terms and definitions
- [Microsoft Learn Course Syllabus](./microsoft-learn-toc.md) — Full domain and topic breakdown

## Useful Links

| Resource | Link |
|----------|------|
| Exam study guide | https://aka.ms/AZ104-StudyGuide |
| Certification page | https://learn.microsoft.com/en-us/credentials/certifications/azure-administrator/ |
| Schedule exam | https://learn.microsoft.com/en-us/credentials/certifications/schedule-through-pearson-vue?examUid=exam.AZ-104 |
| Practice assessment | https://learn.microsoft.com/en-us/credentials/certifications/exams/az-104/practice/assessment?assessment-type=practice&assessmentId=21 |
| Exam sandbox | https://go.microsoft.com/fwlink/?linkid=2226877 |
| Azure documentation | https://learn.microsoft.com/en-us/azure/ |
| Microsoft Entra ID docs | https://learn.microsoft.com/en-us/entra/identity/ |
| Azure Storage docs | https://learn.microsoft.com/en-us/azure/storage/ |
| Azure Compute docs | https://learn.microsoft.com/en-us/azure/virtual-machines/ |
| Azure Networking docs | https://learn.microsoft.com/en-us/azure/virtual-network/ |
| Azure Monitor docs | https://learn.microsoft.com/en-us/azure/azure-monitor/ |
| Azure Backup docs | https://learn.microsoft.com/en-us/azure/backup/ |
