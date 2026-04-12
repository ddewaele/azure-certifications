# AZ-104 Microsoft Learn Course Syllabus

Exam **AZ-104: Microsoft Azure Administrator** certifies you as **Microsoft Certified: Azure Administrator Associate**.

---

## Exam Domains and Weights

| # | Domain | Weight |
|---|--------|--------|
| 1 | Manage Azure identities and governance | 20-25% |
| 2 | Implement and manage storage | 15-20% |
| 3 | Deploy and manage Azure compute resources | 20-25% |
| 4 | Implement and manage virtual networking | 15-20% |
| 5 | Monitor and maintain Azure resources | 10-15% |

---

## Domain 1: Manage Azure Identities and Governance (20-25%)

### Manage Microsoft Entra Users and Groups

| Topic | Key Areas |
|-------|-----------|
| Users | Create users, manage properties, bulk operations |
| Groups | Security groups, M365 groups, dynamic membership |
| Licenses | Assign and manage licenses in Entra ID |
| External users | Guest accounts, B2B collaboration |
| SSPR | Self-service password reset configuration |

### Manage Access to Azure Resources

| Topic | Key Areas |
|-------|-----------|
| Built-in roles | Owner, Contributor, Reader, User Access Administrator |
| Role assignment | Assign at management group, subscription, resource group, resource scope |
| Access interpretation | Effective permissions, deny assignments |

### Manage Azure Subscriptions and Governance

| Topic | Key Areas |
|-------|-----------|
| Azure Policy | Definitions, assignments, initiatives, compliance |
| Resource locks | CanNotDelete, ReadOnly |
| Tags | Apply, manage, policy enforcement |
| Resource groups | Create, manage, move resources |
| Subscriptions | Management, limits, transfer |
| Cost management | Budgets, alerts, Azure Advisor |
| Management groups | Hierarchy, policy inheritance |

---

## Domain 2: Implement and Manage Storage (15-20%)

### Configure Access to Storage

| Topic | Key Areas |
|-------|-----------|
| Firewalls and VNets | Restrict storage access by network |
| SAS tokens | Account SAS, service SAS, user delegation SAS |
| Stored access policies | Server-side SAS management |
| Access keys | Regenerate, rotate, manage |
| Identity-based access | Azure AD auth for Azure Files |

### Configure and Manage Storage Accounts

| Topic | Key Areas |
|-------|-----------|
| Storage account types | Standard GPv2, Premium Block Blobs, Premium File Shares, Premium Page Blobs |
| Redundancy | LRS, ZRS, GRS, GZRS, RA-GRS, RA-GZRS |
| Object replication | Async blob replication across accounts |
| Encryption | Microsoft-managed keys, customer-managed keys |
| Storage Explorer / AzCopy | Data management tools |

### Configure Azure Files and Azure Blob Storage

| Topic | Key Areas |
|-------|-----------|
| Azure Files | File shares, quotas, snapshots, soft delete |
| Blob containers | Access levels (private, blob, container) |
| Storage tiers | Hot, Cool, Cold, Archive |
| Lifecycle management | Rules to move/delete blobs by age |
| Blob versioning | Keep previous versions of blobs |
| Soft delete | Recover accidentally deleted blobs/containers |

---

## Domain 3: Deploy and Manage Azure Compute Resources (20-25%)

### ARM Templates and Bicep

| Topic | Key Areas |
|-------|-----------|
| ARM templates | JSON structure, parameters, variables, resources, outputs |
| Bicep files | Declarative IaC, compile to ARM |
| Deploy templates | Azure CLI, PowerShell, portal |
| Export templates | Export from existing resources |

### Create and Configure Virtual Machines

| Topic | Key Areas |
|-------|-----------|
| VM creation | Size, OS, disks, NIC, NSG |
| Encryption at host | Encrypt temp disk and cache |
| Move VMs | Resource group, subscription, region |
| VM sizes | General purpose, compute, memory, storage optimised |
| Disks | OS disk, data disks, managed vs unmanaged |
| Availability | Availability sets, availability zones |
| Scale sets | VMSS, autoscale, orchestration modes |

### Containers in Azure

| Topic | Key Areas |
|-------|-----------|
| Azure Container Registry | Private registry, geo-replication, tasks |
| Azure Container Instances | Serverless containers, restart policies |
| Azure Container Apps | Microservices, Dapr, KEDA scaling |
| Sizing and scaling | CPU/memory limits, min/max replicas |

### Azure App Service

| Topic | Key Areas |
|-------|-----------|
| App Service plan | SKU tiers (Free, Basic, Standard, Premium, Isolated) |
| Scaling | Manual, autoscale, scale out |
| Web Apps | Create, configure, deploy |
| TLS/certificates | Custom domain SSL, managed certificates |
| Custom DNS | Map existing domain names |
| Backup | App backup to storage account |
| Networking | VNet integration, private endpoints, access restrictions |
| Deployment slots | Staging, swap, traffic splitting |

---

## Domain 4: Implement and Manage Virtual Networking (15-20%)

### Configure and Manage Virtual Networks

| Topic | Key Areas |
|-------|-----------|
| VNets and subnets | Address space, subnet planning |
| VNet peering | Local and global peering, transit |
| Public IP addresses | Static vs dynamic, Basic vs Standard SKU |
| User-defined routes | Route tables, next hop types |
| Troubleshooting | Effective routes, IP flow verify, connection troubleshoot |

### Configure Secure Access to Virtual Networks

| Topic | Key Areas |
|-------|-----------|
| NSG | Inbound/outbound rules, priority, default rules |
| ASG | Group VMs logically for NSG rules |
| Azure Bastion | Browser-based SSH/RDP without public IP |
| Service endpoints | Private routing to PaaS services |
| Private endpoints | Private IP for PaaS via Private Link |

### Configure Name Resolution and Load Balancing

| Topic | Key Areas |
|-------|-----------|
| Azure DNS | Public zones, private zones, record types |
| Load Balancer | Basic vs Standard SKU, internal vs public, rules |
| Application Gateway | Layer 7 LB, WAF, URL routing |
| Troubleshooting | Probe health, backend pool, listener config |

---

## Domain 5: Monitor and Maintain Azure Resources (10-15%)

### Monitor Resources in Azure

| Topic | Key Areas |
|-------|-----------|
| Azure Monitor metrics | Platform metrics, custom metrics, metric explorer |
| Log settings | Diagnostic settings, workspace routing |
| Log Analytics | KQL queries, tables (AzureActivity, Heartbeat) |
| Alerts | Alert rules, action groups, alert processing rules |
| Monitor Insights | VM Insights, Storage Insights, Network Insights |
| Network Watcher | Connection monitor, packet capture, topology |

### Implement Backup and Recovery

| Topic | Key Areas |
|-------|-----------|
| Recovery Services vault | VM backup, Azure Files, SQL in VM |
| Azure Backup vault | Managed disks, Blobs, AKS |
| Backup policies | Schedule, retention, tiering |
| Backup/restore operations | On-demand backup, restore to new VM |
| Azure Site Recovery | DR, replication, failover |
| Failover to secondary | Test failover, planned failover, failback |
| Backup reports | Azure Monitor Workbooks for backup |

---

## Study Resources

| Resource | Link |
|----------|------|
| Exam study guide | https://aka.ms/AZ104-StudyGuide |
| Certification page | https://learn.microsoft.com/en-us/credentials/certifications/azure-administrator/ |
| Azure documentation | https://learn.microsoft.com/en-us/azure/ |
| Microsoft Entra ID docs | https://learn.microsoft.com/en-us/entra/identity/ |
| Azure Storage docs | https://learn.microsoft.com/en-us/azure/storage/ |
| Azure Compute docs | https://learn.microsoft.com/en-us/azure/virtual-machines/ |
| Azure Networking docs | https://learn.microsoft.com/en-us/azure/virtual-network/ |
| Azure Monitor docs | https://learn.microsoft.com/en-us/azure/azure-monitor/ |
| Azure Backup docs | https://learn.microsoft.com/en-us/azure/backup/ |
| Practice assessment | https://learn.microsoft.com/en-us/credentials/certifications/exams/az-104/practice/assessment?assessment-type=practice&assessmentId=21 |
