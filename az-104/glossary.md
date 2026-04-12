# AZ-104 Glossary of Key Terms

Alphabetical reference of key Azure Administrator concepts, services, and acronyms.

---

## A

**Access tier** — Classification for blob storage (Hot, Cool, Cold, Archive) that balances storage cost against access cost. Archive requires rehydration before data can be read.

**Action group** — A collection of notification and remediation actions (email, SMS, webhook, Runbook) triggered when an Azure Monitor alert fires.

**Alert processing rule** — An Azure Monitor rule that suppresses or modifies alert behavior, commonly used to silence alerts during planned maintenance windows.

**Alert rule** — A definition in Azure Monitor that monitors a signal (metric, log, activity), evaluates a condition, and triggers an action group when the threshold is met.

**ARM template** — Azure Resource Manager template; a JSON file that declaratively defines Azure resources for repeatable, consistent deployment.

**ASG (Application Security Group)** — A logical grouping of VMs within a VNet used as a source or destination in NSG rules instead of IP addresses.

**Availability Set** — A logical grouping of VMs across fault domains and update domains to protect against hardware failure and planned maintenance. Provides 99.95% SLA.

**Availability Zone** — Physically separate datacenter locations within a single Azure region. Deploying across zones provides 99.99% SLA and protection from datacenter failure.

**AzCopy** — Command-line utility for high-performance data transfer to and from Azure Storage.

**Azure Backup vault** — Container for newer backup data sources: Azure Blobs, Managed Disks, PostgreSQL, AKS.

**Azure Bastion** — A PaaS service providing browser-based RDP/SSH access to VMs without requiring a public IP on the VM. Requires `AzureBastionSubnet` (/26 minimum).

**Azure Container Apps (ACA)** — Serverless container hosting platform with built-in Dapr support and KEDA-based autoscaling, optimised for microservices.

**Azure Container Instances (ACI)** — Serverless container service for simple, short-lived containers; no cluster management required.

**Azure Container Registry (ACR)** — Private Docker registry in Azure for storing and managing container images.

**Azure DNS** — Microsoft's hosted DNS service supporting public and private DNS zones.

**Azure File Sync** — Extends Azure Files to on-premises Windows Servers with optional cloud tiering.

**Azure Files** — Fully managed SMB/NFS file shares in Azure; can be mounted on Windows, Linux, and macOS.

**Azure Monitor** — Comprehensive monitoring platform for Azure and on-premises resources; collects metrics, logs, and traces.

**Azure Policy** — Governance service that evaluates Azure resources against business rules; effects include Audit, Deny, DeployIfNotExists, and Modify.

**Azure Site Recovery (ASR)** — Disaster recovery service that replicates VMs and workloads to a secondary region for failover.

**Azure Update Manager** — Service for managing OS updates on Azure and Arc-enabled VMs; successor to Update Management in Azure Automation.

---

## B

**Backup policy** — Defines backup schedule (daily/weekly) and retention periods (daily, weekly, monthly, yearly) for an Azure Backup protected item.

**Bicep** — Azure-specific domain-specific language (DSL) for Infrastructure as Code; compiles to ARM templates.

**Blob** — Binary Large Object; unstructured data stored in Azure Blob Storage. Types: Block blob, Append blob, Page blob.

**Budget (Azure)** — A cost threshold set in Azure Cost Management that triggers notifications when spending approaches or exceeds the limit.

---

## C

**Cloud tiering** — Azure File Sync feature that replaces infrequently accessed files on a server endpoint with stubs, keeping only hot data local.

**CMK (Customer-Managed Key)** — Encryption key stored in Azure Key Vault and managed by the customer; used for storage account encryption.

**Connection Monitor** — Azure Network Watcher tool for continuous end-to-end connectivity testing between sources and destinations.

**Contributor** — Built-in Azure RBAC role that grants full resource management access but cannot assign roles or manage access.

**CNAME record** — DNS alias record that points a hostname to another hostname (e.g., www → myapp.azurewebsites.net).

**Custom RBAC role** — User-defined role created with specific Actions, NotActions, and DataActions for fine-grained access control.

---

## D

**Data Collection Rule (DCR)** — Azure Monitor configuration that defines what data to collect from a source, optional transformations, and destination.

**Deny assignment** — An Azure RBAC construct that explicitly blocks specific actions regardless of role assignments; created by Azure Blueprints.

**Diagnostic settings** — Per-resource configuration that routes platform logs and metrics to Log Analytics, Storage, Event Hub, or partner solutions.

**Dynamic group** — An Entra ID group with membership automatically managed by rules based on user or device attributes. Requires Entra ID P1.

---

## E

**Entra Connect** — Microsoft's hybrid identity synchronisation tool that syncs on-premises AD users and groups to Entra ID.

**Entra ID (Microsoft Entra ID)** — Microsoft's cloud-based identity and access management service (formerly Azure Active Directory).

**ExpressRoute** — Private, dedicated network connection from on-premises to Azure through a connectivity provider; not over the internet.

---

## F

**Failback** — The process of returning workloads to the original region after a failover and recovery.

**Failover** — In Azure Site Recovery, the process of switching from the primary (source) region to the secondary (target) region.

**Fault domain (FD)** — A group of VMs in an Availability Set that share the same physical rack, power source, and network switch.

**File recovery** — Azure Backup feature that mounts a recovery point as a drive to restore individual files without restoring the entire VM or disk.

---

## G

**GatewaySubnet** — Reserved subnet name for VPN Gateway and ExpressRoute Gateway deployments; must be at least /27.

**GRS (Geo-Redundant Storage)** — Storage redundancy option that replicates data 3 times locally and 3 times in a secondary (paired) region.

**GZRS (Geo-Zone-Redundant Storage)** — Storage redundancy combining ZRS in the primary region with LRS replication to a secondary region.

**Guest user** — External identity (from another organisation or personal account) invited to an Entra tenant via B2B collaboration.

---

## H

**Heartbeat** — Log Analytics table populated by agents installed on VMs; used to monitor agent health and connectivity.

**Hot tier** — Blob storage access tier for frequently accessed data; highest storage cost but lowest access cost.

---

## I

**Immutable storage** — Blob storage feature that enforces WORM (write once, read many) policies via time-based retention or legal holds.

**Initiative (policy set)** — A collection of Azure Policy definitions grouped together to achieve a common governance goal.

**Instant restore** — Azure Backup feature using VM snapshots for fast restore without waiting for vault data transfer (retained 1-5 days).

---

## J

**JIT (Just-In-Time) VM access** — Microsoft Defender for Cloud feature that locks down RDP/SSH ports and opens them on-demand for a limited time.

---

## K

**KEDA (Kubernetes Event-Driven Autoscaling)** — Autoscaling mechanism used by Azure Container Apps to scale containers based on event sources.

**KQL (Kusto Query Language)** — Query language used in Azure Monitor Log Analytics, Application Insights, and Azure Data Explorer.

---

## L

**Lifecycle management** — Blob storage feature that automatically moves or deletes blobs based on age and access patterns.

**Log Analytics workspace** — Central Azure repository for log data from resources, VMs, and on-premises; queried with KQL.

**LRS (Locally Redundant Storage)** — Storage redundancy option that maintains 3 copies of data within a single datacenter. Does not protect against datacenter failure.

---

## M

**Managed disk** — Azure-managed virtual hard disk; Microsoft handles storage account placement and availability set fault domain alignment.

**Managed identity** — Automatically managed service account for Azure resources; eliminates the need for credentials in code.

**Management group** — Azure governance container above subscriptions for applying policy and access control across multiple subscriptions.

**Metric explorer** — Azure Monitor portal tool for visualising and analysing platform and custom metrics.

---

## N

**Network Interface (NIC)** — Virtual network adapter attached to a VM; holds the private IP, DNS settings, and NSG association.

**NSG (Network Security Group)** — Azure firewall applied to subnets or NICs; contains inbound and outbound security rules with priority-based evaluation.

---

## O

**Object replication** — Asynchronous copying of block blobs from one storage account to another (same or different region).

**Owner** — Built-in Azure RBAC role that grants full access to all resources AND the ability to assign roles to others.

---

## P

**Page blob** — Blob type optimised for random read/write access in 512-byte pages; used for unmanaged VM disks.

**Peering (VNet)** — Low-latency, high-bandwidth private connection between two VNets on the Microsoft backbone; non-transitive.

**PHS (Password Hash Sync)** — Hybrid identity method where a hash of the on-premises password hash is synced to Entra ID.

**PIM (Privileged Identity Management)** — Entra ID P2 feature providing just-in-time privileged role activation with approval workflows and audit trails.

**Private DNS zone** — Azure DNS zone for name resolution within VNets; not exposed to the internet.

**Private endpoint** — A network interface with a private IP from your VNet connecting to a specific Azure PaaS resource via Private Link.

**PTA (Pass-Through Authentication)** — Hybrid identity method where authentication is validated against on-premises AD in real time (no password hash in cloud).

**Public IP** — Azure resource providing an internet-reachable IP; Basic (dynamic/static) or Standard (static, zone-redundant) SKU.

---

## R

**RA-GRS (Read-Access Geo-Redundant Storage)** — GRS with the addition of read access to the secondary region endpoint.

**RBAC (Role-Based Access Control)** — Azure's authorization system for controlling access to Azure resources via role assignments (security principal + role + scope).

**Reader** — Built-in Azure RBAC role that allows viewing all resources but making no changes.

**Recovery plan** — Azure Site Recovery ordered sequence of failover steps; can include Azure Automation scripts and manual steps.

**Recovery point** — A point-in-time snapshot of a replicated or backed-up VM created by ASR or Azure Backup.

**Recovery Services vault** — Azure resource used as the container for Azure Backup (VM, Files, SQL) and Azure Site Recovery replication.

**Rehydration** — Process of moving a blob out of Archive tier to Hot or Cool so it can be read; can take up to 15 hours (standard priority).

**Resource group** — Logical container in Azure that holds related resources sharing the same lifecycle, permissions, and tags.

**Resource lock** — Azure governance feature that prevents accidental modification or deletion: CanNotDelete or ReadOnly.

**RPO (Recovery Point Objective)** — Maximum acceptable data loss expressed as time (e.g., 1 hour RPO = recovery point can be up to 1 hour old).

**RTO (Recovery Time Objective)** — Maximum acceptable downtime (e.g., 4 hour RTO = service must be restored within 4 hours of a failure).

**Route table** — Azure resource containing user-defined routes (UDR) applied to a subnet to control traffic flow.

---

## S

**SAS (Shared Access Signature)** — A URI that grants delegated access to Azure Storage resources with specific permissions and time limits.

**Scale set (VMSS)** — Azure Virtual Machine Scale Sets; a group of identically configured VMs that can autoscale based on demand.

**Service endpoint** — Routes traffic from a VNet subnet directly to Azure PaaS services over the Microsoft backbone; the PaaS service still uses a public IP.

**Service tag** — A named group of IP address prefixes for a well-known Azure service (e.g., Storage, Sql, AppService); used in NSG rules.

**Soft delete** — Azure Storage feature that retains deleted blobs, containers, or file shares for a configurable period before permanent deletion.

**SSPR (Self-Service Password Reset)** — Entra ID feature allowing users to reset their own passwords using registered auth methods.

**Standard SKU (Load Balancer)** — Recommended Azure Load Balancer tier; zone-redundant, supports outbound rules, requires NSG, and has an SLA.

**Storage account** — Top-level Azure Storage namespace; contains blobs, files, queues, and tables with unified access keys and firewall rules.

**Stored access policy** — Server-side policy that can be attached to a storage container to allow revocation of SAS tokens.

**Subscription** — Azure billing and access boundary linked to a single Entra tenant; contains resource groups and resources.

---

## T

**Tag** — A name/value pair applied to Azure resources for organisation, cost allocation, and policy enforcement. Up to 50 tags per resource; does not auto-inherit from resource group.

**Tenant** — A dedicated and trusted instance of Entra ID representing an organisation.

**Test failover** — ASR operation that validates DR readiness by creating a copy of the replicated VM in an isolated network; non-disruptive to production.

---

## U

**UDR (User-Defined Route)** — Custom route in a route table that overrides Azure's default system routes; used to route traffic through NVAs or gateways.

**Update domain (UD)** — Group of VMs in an Availability Set that are rebooted together during planned maintenance; only one UD is restarted at a time.

**UPN (User Principal Name)** — The sign-in name for an Entra ID user, formatted as user@domain.com.

---

## V

**VM Insights** — Azure Monitor feature providing pre-built performance charts and dependency maps for VMs; requires Azure Monitor Agent.

**VNet (Virtual Network)** — Azure's isolated network environment; contains subnets and provides connectivity for Azure resources.

**VNet peering** — Private, high-bandwidth connection between two VNets; non-transitive (A-B and B-C does not imply A-C).

**VPN Gateway** — Azure gateway for site-to-site, point-to-site, and VNet-to-VNet encrypted VPN connections over the internet.

---

## W

**WAF (Web Application Firewall)** — Layer 7 firewall integrated with Application Gateway or Azure Front Door; protects against OWASP Top 10 web attacks.

**WORM (Write Once Read Many)** — Immutable storage policy for Azure Blob Storage preventing modification or deletion for a defined period.

---

## Z

**Zone-redundant** — Resources or services deployed across multiple Availability Zones for high availability and protection from datacenter failure.

**ZRS (Zone-Redundant Storage)** — Storage redundancy that replicates data synchronously across three Availability Zones in a single region.
