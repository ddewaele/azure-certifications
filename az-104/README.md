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

100 multiple-choice questions covering all AZ-104 exam domains.

- [Quiz README + how to run](../quiz/README.md) -- `node cli/cli.js az-104/quiz` from the repo root
- [01 - Identities and Governance](./quiz/01-identities-governance.json) (20 questions — Easy)
- [02 - Storage](./quiz/02-storage.json) (20 questions — Easy)
- [03 - Compute Resources](./quiz/03-compute.json) (20 questions — Medium)
- [04 - Virtual Networking](./quiz/04-networking.json) (20 questions — Hard)
- [05 - Mixed Review](./quiz/05-mixed-review.json) (20 questions — Mixed)

## Hands-on Labs

- [01 - Manage Entra ID Identities](./labs/01-manage-entra-id-identities.md) — Users, groups, RBAC, SSPR
- [02 - Manage Subscriptions and RBAC](./labs/02-manage-subscriptions-rbac.md) — Governance, locks, policy, tags, cost management
- [03 - Manage Storage Accounts](./labs/03-manage-storage-accounts.md) — Redundancy, SAS, lifecycle, AzCopy
- [04 - Virtual Machines](./labs/04-virtual-machines.md) — Deploy VMs, Availability Sets, disks, Bastion, extensions
- [05 - Virtual Networking](./labs/05-virtual-networking.md) — VNets, NSGs, peering, DNS, UDR
- [06 - Monitor and Backup](./labs/06-monitor-backup.md) — Log Analytics, alerts, VM backup, Site Recovery

## Additional Resources

- [Glossary of Key Terms](./glossary.md) — ~70 AZ-104 terms and definitions
- [Quick Reference Cheatsheet](./cheatsheet.md) — Tables for RBAC, storage, compute, networking, backup
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
