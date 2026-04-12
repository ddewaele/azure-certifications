# AZ-104 Exam Summary: Ways to Interact with Azure Blob Storage

## Core idea
For AZ-104, think of Azure Blob Storage access in **two categories**:

1. **Management plane**
   - Create the storage account
   - Configure networking, RBAC, keys, SAS, lifecycle rules, soft delete, replication, firewall, private endpoints
   - Usually done with **Azure portal**, **Azure CLI**, **PowerShell**, **ARM/Bicep**, or **REST management APIs**

2. **Data plane**
   - Upload blobs
   - Download blobs
   - List containers and blobs
   - Delete blobs
   - Read metadata / properties
   - Usually done with **Portal**, **CLI**, **PowerShell**, **AzCopy**, **Storage Explorer**, **SDKs**, **REST APIs**, **SFTP**, and in some cases **NFS**

---

## 1. Azure portal
### Typical use
- Best for **manual administration**
- View storage accounts, containers, and blobs
- Upload and download small files
- Configure access control, networking, lifecycle management, soft delete, versioning, and replication
- View **access keys** and **connection string**

### Exam takeaway
- **Portal is easiest for ad hoc/manual work**
- Not ideal for repetitive or large-scale transfers

---

## 2. Azure CLI
### Typical use
- Best for **automation**, scripting, and repeatable admin tasks
- Can manage both storage account settings and blob data
- Common auth methods:
  - `--auth-mode login` (Microsoft Entra ID)
  - `--sas-token`
  - `--account-key`

### Common commands
```bash
az login

az storage blob list \
  --account-name mystorage \
  --container-name mycontainer \
  --auth-mode login \
  --output table
```

```bash
az storage blob download \
  --account-name mystorage \
  --container-name mycontainer \
  --name file.txt \
  --file ./file.txt \
  --auth-mode login
```

### Exam takeaway
- **CLI is the standard scripting option**
- Good for admins and CI/CD

---

## 3. PowerShell
### Typical use
- Common in **Windows-heavy** admin environments
- Useful for automation and scripting with Azure modules
- Can manage storage accounts and blob data

### Exam takeaway
- **PowerShell is the Windows/admin scripting equivalent of Azure CLI**
- Expect exam questions comparing Portal vs CLI vs PowerShell

---

## 4. Linux VM
### Typical ways to interact
From a Linux VM, you would commonly use:
- **Azure CLI**
- **AzCopy**
- **SDKs / custom applications**
- **REST APIs** with tools like `curl`
- **SFTP** (if enabled on Blob Storage)
- **NFS 3.0** mount (supported Blob scenarios)

### Most common real-world patterns
- Small admin task: Azure CLI
- Large transfer: AzCopy
- Application access: SDK / API
- File-transfer workflow: SFTP
- Mounted filesystem-like workflow: NFS

### Exam takeaway
- Linux VMs often interact through **CLI, AzCopy, SDKs, SFTP, or NFS**

---

## 5. Windows VM
### Typical ways to interact
From a Windows VM, you would commonly use:
- **Azure portal**
- **Azure CLI**
- **PowerShell**
- **AzCopy**
- **Storage Explorer**
- **SDKs / applications**
- **REST APIs**
- **SFTP** (if enabled)

### Most common real-world patterns
- GUI browsing: Storage Explorer or Portal
- Scripted admin work: PowerShell or CLI
- Large transfer: AzCopy

### Exam takeaway
- Windows VMs give you both **GUI-based** and **scripted** options

---

## 6. Other options

### AzCopy
#### What it is
A command-line tool specialized for moving data to and from Azure Storage.

#### Best for
- Large uploads/downloads
- Bulk copy operations
- Sync operations
- Copying between storage accounts

#### Exam takeaway
- **AzCopy is the preferred bulk-transfer tool**
- More efficient than portal for large data movement

Example:
```bash
azcopy copy ./data "https://mystorage.blob.core.windows.net/mycontainer?<SAS>" --recursive
```

---

### Azure Storage Explorer
#### What it is
A standalone GUI tool for Windows, macOS, and Linux.

#### Best for
- Browsing blob containers
- Uploading/downloading files interactively
- Inspecting metadata and structure
- Easier than raw CLI for manual work

#### Exam takeaway
- **Storage Explorer = GUI desktop tool for Azure Storage**

---

### SFTP for Blob Storage
#### What it is
Blob Storage can support **SFTP** when enabled.

#### Best for
- Traditional file transfer workflows
- External systems/users that expect SFTP

#### Exam takeaway
- Blob Storage is **object storage**, but it can also expose **SFTP** access in supported configurations

---

### NFS 3.0 support
#### What it is
Blob Storage can support **NFS 3.0** in supported scenarios.

#### Best for
- Linux-style mounted access
- Data processing / analytics / HPC style workloads

#### Exam takeaway
- Some Blob Storage scenarios allow a container to be accessed like a mounted filesystem using **NFS 3.0**

---

## 7. APIs

### REST API
#### What it is
The native HTTP API for Azure Blob Storage.

#### Best for
- Custom integrations
- Direct programmatic access
- Service-to-service communication

#### Exam takeaway
- **Blob Storage exposes a REST API** for containers and blobs

---

### SDKs / client libraries
#### Examples
- .NET
- Python
- Java
- JavaScript / TypeScript
- Go

#### Best for
- Application development
- Easier auth, retries, uploads, pagination, and streaming compared to raw REST

#### Exam takeaway
- For application code, **SDKs are typically preferred over raw REST**

---

## 8. Authentication methods you should know
Across Portal, CLI, PowerShell, AzCopy, SDKs, and APIs, the main auth methods are:

- **Microsoft Entra ID**
- **Managed Identity**
- **SAS token**
- **Storage account key**
- **Connection string**

### Exam rule of thumb
- Prefer **identity-based access** where possible
- Use **SAS** for delegated access
- Use **account keys** less often, because they are broader and less secure

---

## 9. Most typical real-world usage patterns

### Administrator
- Portal for setup and troubleshooting
- CLI or PowerShell for repeatable tasks
- Storage Explorer for manual browsing

### Engineer / migration / bulk transfer
- AzCopy

### Application developer
- SDKs or REST APIs
- Managed Identity or Microsoft Entra auth where possible

### Legacy or external system integration
- SFTP

### Linux data-processing workload
- NFS, SDKs, AzCopy, or REST depending on the use case

---

## 10. AZ-104 exam cheat sheet

### If the question asks...
**"How can you manually browse and upload blobs?"**
- Azure portal
- Azure Storage Explorer

**"How can you automate blob operations?"**
- Azure CLI
- PowerShell
- SDKs
- REST APIs

**"How do you perform large-scale data transfer?"**
- **AzCopy**

**"How can applications interact with Blob Storage?"**
- SDKs
- REST APIs

**"How can Linux-style or file-transfer protocols be used?"**
- NFS 3.0
- SFTP

**"What auth methods are common?"**
- Entra ID
- Managed Identity
- SAS
- Account key
- Connection string

---

## 11. One-line summary to memorize
**Portal for manual work, CLI/PowerShell for scripting, AzCopy for bulk transfer, Storage Explorer for GUI browsing, SDK/REST for applications, SFTP/NFS for protocol-specific access.**
