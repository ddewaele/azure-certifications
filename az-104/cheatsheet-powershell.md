# AZ-104 PowerShell (Az Module) Cheatsheet

Complete Azure PowerShell command reference organized by AZ-104 exam domain.

> All commands assume you are logged in (`Connect-AzAccount`) and have set context (`Set-AzContext -SubscriptionId <id>`).
> Required module: `Az` — install with `Install-Module -Name Az -Scope CurrentUser`.

---

## PowerShell Concepts and Philosophy

Understanding how PowerShell is designed makes it much easier to guess or recall commands under exam pressure — rather than memorising every cmdlet, you can often reason your way to the right answer.

### The Verb-Noun Pattern

Every PowerShell cmdlet follows a strict `Verb-Noun` naming convention. The verb describes the action; the noun describes the Azure resource.

```
Get-AzVM          →  Get    (read/retrieve)  +  AzVM       (Azure Virtual Machine)
New-AzResourceGroup →  New    (create)         +  AzResourceGroup
Remove-AzStorageAccount → Remove (delete)      +  AzStorageAccount
Set-AzVirtualNetwork  →  Set    (replace/update) +  AzVirtualNetwork
```

**The approved verbs you need to know:**

| Verb | Meaning | Example |
|------|---------|---------|
| `Get` | Read / retrieve one or many | `Get-AzVM`, `Get-AzStorageAccount` |
| `New` | Create a new resource | `New-AzResourceGroup`, `New-AzVM` |
| `Remove` | Delete a resource | `Remove-AzVM`, `Remove-AzRoleAssignment` |
| `Set` | Replace/overwrite properties (full update) | `Set-AzVirtualNetwork`, `Set-AzWebApp` |
| `Update` | Partially update properties | `Update-AzVM`, `Update-AzStorageAccount` |
| `Add` | Append to a collection | `Add-AzVirtualNetworkSubnetConfig`, `Add-AzRouteConfig` |
| `Start` | Start a resource / operation | `Start-AzVM`, `Start-AzPolicyComplianceScan` |
| `Stop` | Stop a resource | `Stop-AzVM` |
| `Restart` | Restart a resource | `Restart-AzVM` |
| `Invoke` | Execute a command/action | `Invoke-AzVMRunCommand` |
| `Enable` / `Disable` | Toggle a feature | `Enable-AzRecoveryServicesBackupProtection` |
| `Move` | Relocate a resource | `Move-AzResource` |
| `Export` | Export to file/template | `Export-AzResourceGroup` |
| `Import` | Import from file | (less common in Az module) |
| `Switch` | Swap between states | `Switch-AzWebAppSlot` |
| `Connect` / `Disconnect` | Session management | `Connect-AzAccount` |
| `Register` / `Unregister` | Register providers/servers | `Register-AzResourceProvider` |

> **Exam tip:** If you can't remember a cmdlet, reason it out: `New-` for creates, `Remove-` for deletes, `Get-` for reads. Azure CLI uses `create`/`delete`/`list`/`show` — PowerShell uses `New-`/`Remove-`/`Get-`.

### The `Az` Prefix — Module Namespacing

Every Azure cmdlet has the `Az` prefix in the noun, which identifies it as part of the Az PowerShell module. This distinguishes Azure cmdlets from built-in PowerShell cmdlets:

```powershell
Get-VM          # Built-in Hyper-V cmdlet (local VMs)
Get-AzVM        # Az module — Azure VMs in the cloud
```

The noun after `Az` maps predictably to Azure service names:

| Noun prefix | Azure service |
|-------------|--------------|
| `AzVM` | Virtual Machines |
| `AzVmss` | VM Scale Sets |
| `AzStorageAccount` | Storage Accounts |
| `AzStorageBlob` | Blob Storage |
| `AzStorageShare` | Azure Files |
| `AzVirtualNetwork` | Virtual Networks |
| `AzNetworkSecurityGroup` | NSGs |
| `AzPublicIpAddress` | Public IPs |
| `AzRoleAssignment` | RBAC Assignments |
| `AzPolicyAssignment` | Azure Policy |
| `AzResourceGroup` | Resource Groups |
| `AzResource` | Generic resources |
| `AzWebApp` | App Service web apps |
| `AzAppServicePlan` | App Service plans |
| `AzRecoveryServicesVault` | Recovery Services (Backup/ASR) |

### The Pipeline Philosophy

PowerShell cmdlets output **objects**, not text. This means you can pipe the output of one cmdlet directly into another — no text parsing needed.

```powershell
# Get all VMs in a resource group and stop them all
Get-AzVM -ResourceGroupName "myRG" | Stop-AzVM -Force

# Get all non-compliant policy states and select just the resource IDs
Get-AzPolicyState | Where-Object { $_.ComplianceState -eq "NonCompliant" } | Select-Object ResourceId

# Get a storage account and immediately get its context
$ctx = (Get-AzStorageAccount -ResourceGroupName "myRG" -Name "mystorageacct").Context
```

This is fundamentally different from bash/Azure CLI where you parse text output. In PowerShell, you work with **structured objects** and their **properties**.

### Set vs Update — a Common Exam Trap

These two verbs behave differently and the exam tests whether you know the difference:

| Verb | Behaviour | Risk |
|------|-----------|------|
| `Set-` | **Replaces the entire resource config** — properties you omit may be reset to defaults | Use carefully; always retrieve first with `Get-` |
| `Update-` | **Partial update** — only the properties you specify are changed | Safer for targeted changes |

**The typical pattern for `Set-`:**
```powershell
# WRONG — could wipe other settings on the subnet
Set-AzVirtualNetworkSubnetConfig -Name "mySubnet" -AddressPrefix "10.0.1.0/24"

# CORRECT — retrieve first, modify, then push back
$vnet = Get-AzVirtualNetwork -ResourceGroupName "myRG" -Name "myVNet"
# ... modify $vnet object ...
$vnet | Set-AzVirtualNetwork    # push the full modified object back
```

This get-modify-set pattern appears throughout networking and compute cmdlets.

### The `-AsJob` Pattern for Long-Running Operations

Some operations (VM creation, VPN gateway deployment, policy scans) take minutes. PowerShell handles this with `-AsJob`:

```powershell
# Run in background, get a job object back immediately
New-AzVirtualNetworkGateway ... -AsJob

# Check background jobs
Get-Job
Get-Job | Receive-Job    # retrieve output when done
Wait-Job                 # block until job completes
```

This is the PowerShell equivalent of `--no-wait` in Azure CLI.

### Filtering and Shaping Output

```powershell
# Filter objects
Get-AzVM | Where-Object { $_.Location -eq "westeurope" }

# Select specific properties
Get-AzVM | Select-Object Name, Location, @{N="Size";E={$_.HardwareProfile.VmSize}}

# Sort results
Get-AzStorageAccount | Sort-Object StorageAccountName

# Format as table (for display — loses object type, don't pipe further)
Get-AzVM | Format-Table Name, Location

# Format as list (shows all properties)
Get-AzVM -Name "myVM" -ResourceGroupName "myRG" | Format-List
```

### Authentication and Context

```powershell
# Login (opens browser)
Connect-AzAccount

# Login with a specific tenant (multi-tenant scenarios)
Connect-AzAccount -TenantId "<tenant-id>"

# Login with a service principal (automation/scripts)
$cred = Get-Credential   # use app ID as username, secret as password
Connect-AzAccount -ServicePrincipal -Credential $cred -TenantId "<tenant-id>"

# List available subscriptions
Get-AzSubscription

# Switch subscription context
Set-AzContext -SubscriptionId "<subscription-id>"
Set-AzContext -SubscriptionName "My Subscription"

# Show current context
Get-AzContext
```

### Module Management

```powershell
# Install the Az module (one-time setup)
Install-Module -Name Az -Scope CurrentUser -Repository PSGallery

# Update to latest version
Update-Module -Name Az

# Check installed version
Get-InstalledModule -Name Az

# Import module in a script (usually auto-imported, but explicit is reliable)
Import-Module Az

# List all Az sub-modules installed
Get-Module -ListAvailable Az.*

# Discover cmdlets for a specific service
Get-Command -Module Az.Compute              # all Compute cmdlets
Get-Command -Module Az.Network -Verb Get    # all Get- cmdlets in Networking
Get-Command -Module Az.Storage -Noun *Blob* # all blob-related cmdlets
```

> **Exam tip:** The Az module replaced the older `AzureRM` module. If you see `Get-AzureRMVM` in an exam question that is the legacy module — modern answers use `Get-AzVM` (no `RM`).

---

## 1. Manage Azure Identities and Governance (20–25%)

### Entra ID Users

```powershell
# List all users
Get-AzADUser | Format-Table DisplayName, UserPrincipalName, Id

# Create a user
$password = ConvertTo-SecureString "TempP@ss123!" -AsPlainText -Force
New-AzADUser `
  -DisplayName "John Doe" `
  -UserPrincipalName "john@contoso.onmicrosoft.com" `
  -Password $password `
  -ForceChangePasswordNextLogin

# Get a specific user
Get-AzADUser -UserPrincipalName "john@contoso.onmicrosoft.com"

# Update a user property
Update-AzADUser -UserPrincipalName "john@contoso.onmicrosoft.com" `
  -DisplayName "John A. Doe"

# Delete a user
Remove-AzADUser -UserPrincipalName "john@contoso.onmicrosoft.com"
```

### Entra ID Groups

```powershell
# List all groups
Get-AzADGroup | Format-Table DisplayName, Id

# Create a security group
New-AzADGroup `
  -DisplayName "DevOps Team" `
  -MailNickname "devops-team"

# Add a member to a group
Add-AzADGroupMember `
  -TargetGroupDisplayName "DevOps Team" `
  -MemberObjectId <user-object-id>

# List group members
Get-AzADGroupMember -GroupDisplayName "DevOps Team" | Format-Table DisplayName, Id

# Remove a member from a group
Remove-AzADGroupMember `
  -GroupDisplayName "DevOps Team" `
  -MemberObjectId <user-object-id>

# Delete a group
Remove-AzADGroup -DisplayName "DevOps Team"
```

### RBAC Role Assignments

```powershell
# List all role assignments for a subscription
Get-AzRoleAssignment | Format-Table DisplayName, RoleDefinitionName, Scope

# List role assignments for a specific user
Get-AzRoleAssignment -SignInName "john@contoso.onmicrosoft.com"

# Assign a role at subscription scope
New-AzRoleAssignment `
  -SignInName "john@contoso.onmicrosoft.com" `
  -RoleDefinitionName "Contributor" `
  -Scope "/subscriptions/<subscription-id>"

# Assign a role at resource group scope
New-AzRoleAssignment `
  -SignInName "john@contoso.onmicrosoft.com" `
  -RoleDefinitionName "Reader" `
  -ResourceGroupName "myResourceGroup"

# Assign a role to a group
New-AzRoleAssignment `
  -ObjectId <group-object-id> `
  -RoleDefinitionName "Contributor" `
  -ResourceGroupName "myResourceGroup"

# Remove a role assignment
Remove-AzRoleAssignment `
  -SignInName "john@contoso.onmicrosoft.com" `
  -RoleDefinitionName "Contributor" `
  -ResourceGroupName "myResourceGroup"

# List all built-in role definitions
Get-AzRoleDefinition | Where-Object { $_.IsCustom -eq $false } | Format-Table Name, Description

# Show a specific role definition
Get-AzRoleDefinition -Name "Contributor"

# Create a custom role from JSON
New-AzRoleDefinition -InputFile "custom-role.json"

# Update a custom role
Set-AzRoleDefinition -InputFile "custom-role-updated.json"

# Delete a custom role
Remove-AzRoleDefinition -Name "My Custom Role"
```

### Subscriptions and Management Groups

```powershell
# List all subscriptions
Get-AzSubscription | Format-Table Name, Id, State

# Set the active subscription
Set-AzContext -SubscriptionId "<subscription-id>"

# Show current context
Get-AzContext

# List management groups
Get-AzManagementGroup

# Create a management group
New-AzManagementGroup -GroupId "Production" -DisplayName "Production"

# Move a subscription under a management group
New-AzManagementGroupSubscription `
  -GroupId "Production" `
  -SubscriptionId "<subscription-id>"

# Remove a management group
Remove-AzManagementGroup -GroupId "Production"
```

### Azure Policy

```powershell
# List all policy definitions
Get-AzPolicyDefinition | Format-Table DisplayName, PolicyType

# List built-in policy definitions
Get-AzPolicyDefinition -BuiltIn | Format-Table DisplayName

# Show a specific policy definition
Get-AzPolicyDefinition -Name "<policy-name>"

# Assign a policy to a resource group
$definition = Get-AzPolicyDefinition -Name "Require a tag on resources"
New-AzPolicyAssignment `
  -Name "require-tag-environment" `
  -PolicyDefinition $definition `
  -Scope "/subscriptions/<sub-id>/resourceGroups/myRG" `
  -PolicyParameterObject @{ tagName = "Environment" }

# Assign a policy to a subscription
$definition = Get-AzPolicyDefinition -Name "Allowed locations"
New-AzPolicyAssignment `
  -Name "allowed-locations" `
  -PolicyDefinition $definition `
  -Scope "/subscriptions/<sub-id>" `
  -PolicyParameterObject @{
    listOfAllowedLocations = @("westeurope", "northeurope")
  }

# List policy assignments
Get-AzPolicyAssignment | Format-Table Name, DisplayName, Scope

# Remove a policy assignment
Remove-AzPolicyAssignment -Name "require-tag-environment" `
  -Scope "/subscriptions/<sub-id>/resourceGroups/myRG"

# Get compliance state
Get-AzPolicyState -ResourceGroupName "myRG" |
  Where-Object { $_.ComplianceState -eq "NonCompliant" } |
  Format-Table ResourceId, PolicyDefinitionName

# Trigger a policy compliance evaluation
Start-AzPolicyComplianceScan -ResourceGroupName "myRG"
```

### Resource Locks

```powershell
# Create a CanNotDelete lock on a resource group
New-AzResourceLock `
  -LockName "protect-prod" `
  -LockLevel CanNotDelete `
  -ResourceGroupName "Production-RG"

# Create a ReadOnly lock on a resource
New-AzResourceLock `
  -LockName "readonly-lock" `
  -LockLevel ReadOnly `
  -ResourceGroupName "Production-RG" `
  -ResourceName "myStorageAccount" `
  -ResourceType "Microsoft.Storage/storageAccounts"

# List locks
Get-AzResourceLock -ResourceGroupName "Production-RG"

# Remove a lock
Remove-AzResourceLock `
  -LockName "protect-prod" `
  -ResourceGroupName "Production-RG"
```

### Tags

```powershell
# Get tags on a resource group
$rg = Get-AzResourceGroup -Name "myRG"
$rg.Tags

# Add/update tags on a resource group (merge)
$tags = (Get-AzResourceGroup -Name "myRG").Tags
$tags["Environment"] = "Production"
$tags["Department"] = "IT"
Set-AzResourceGroup -Name "myRG" -Tag $tags

# Add a tag to a resource
$resource = Get-AzResource -Name "myStorageAccount" -ResourceGroupName "myRG"
$resource.Tags["CostCenter"] = "12345"
Set-AzResource -ResourceId $resource.Id -Tag $resource.Tags -Force

# Remove a specific tag from a resource group
$tags = (Get-AzResourceGroup -Name "myRG").Tags
$tags.Remove("Department")
Set-AzResourceGroup -Name "myRG" -Tag $tags

# List all tag names in a subscription
Get-AzTag | Format-Table TagName, Count
```

---

## 2. Implement and Manage Storage (15–20%)

### Storage Accounts

```powershell
# Create a storage account
New-AzStorageAccount `
  -ResourceGroupName "myRG" `
  -Name "mystorageacct" `
  -Location "westeurope" `
  -SkuName "Standard_LRS" `
  -Kind "StorageV2" `
  -EnableHttpsTrafficOnly $true `
  -MinimumTlsVersion "TLS1_2"

# List storage accounts
Get-AzStorageAccount -ResourceGroupName "myRG" | Format-Table StorageAccountName, Location, Sku

# Get storage account properties
Get-AzStorageAccount -ResourceGroupName "myRG" -Name "mystorageacct"

# Get storage account context (for blob/file operations)
$ctx = (Get-AzStorageAccount -ResourceGroupName "myRG" -Name "mystorageacct").Context

# Get storage account keys
Get-AzStorageAccountKey -ResourceGroupName "myRG" -Name "mystorageacct"

# Regenerate a key
New-AzStorageAccountKey -ResourceGroupName "myRG" -Name "mystorageacct" -KeyName "key1"

# Generate a SAS token (account-level)
New-AzStorageAccountSASToken `
  -Context $ctx `
  -Service Blob,File,Queue,Table `
  -ResourceType Service,Container,Object `
  -Permission rwdlacup `
  -ExpiryTime (Get-Date).AddDays(30)

# Configure network rules (restrict to VNet)
Add-AzStorageAccountNetworkRule `
  -ResourceGroupName "myRG" `
  -Name "mystorageacct" `
  -VirtualNetworkResourceId "/subscriptions/<sub>/resourceGroups/myRG/providers/Microsoft.Network/virtualNetworks/myVNet/subnets/mySubnet"

# Set default action to Deny
Update-AzStorageAccountNetworkRuleSet `
  -ResourceGroupName "myRG" `
  -Name "mystorageacct" `
  -DefaultAction Deny

# Enable soft delete for blobs
Enable-AzStorageBlobDeleteRetentionPolicy `
  -ResourceGroupName "myRG" `
  -StorageAccountName "mystorageacct" `
  -RetentionDays 14

# Enable blob versioning
Update-AzStorageBlobServiceProperty `
  -ResourceGroupName "myRG" `
  -StorageAccountName "mystorageacct" `
  -IsVersioningEnabled $true
```

### Blob Storage

```powershell
$ctx = (Get-AzStorageAccount -ResourceGroupName "myRG" -Name "mystorageacct").Context

# Create a blob container
New-AzStorageContainer -Name "mycontainer" -Context $ctx -Permission Off

# Upload a file to blob
Set-AzStorageBlobContent `
  -Container "mycontainer" `
  -File "./myfile.txt" `
  -Blob "myfile.txt" `
  -Context $ctx

# Download a blob
Get-AzStorageBlobContent `
  -Container "mycontainer" `
  -Blob "myfile.txt" `
  -Destination "./downloaded.txt" `
  -Context $ctx

# List blobs in a container
Get-AzStorageBlob -Container "mycontainer" -Context $ctx | Format-Table Name, Length, LastModified

# Set blob access tier
$blob = Get-AzStorageBlob -Container "mycontainer" -Blob "myfile.txt" -Context $ctx
$blob.BlobClient.SetAccessTier("Cool")

# Copy blob between containers
Start-AzStorageBlobCopy `
  -SrcContainer "source-container" `
  -SrcBlob "myfile.txt" `
  -DestContainer "dest-container" `
  -DestBlob "myfile.txt" `
  -Context $ctx

# Delete a blob
Remove-AzStorageBlob -Container "mycontainer" -Blob "myfile.txt" -Context $ctx

# Generate a blob-level SAS
New-AzStorageBlobSASToken `
  -Container "mycontainer" `
  -Blob "myfile.txt" `
  -Permission r `
  -ExpiryTime (Get-Date).AddHours(24) `
  -Context $ctx
```

### File Shares

```powershell
$ctx = (Get-AzStorageAccount -ResourceGroupName "myRG" -Name "mystorageacct").Context

# Create a file share
New-AzStorageShare -Name "myshare" -Context $ctx -QuotaGiB 100

# Upload a file
Set-AzStorageFileContent `
  -ShareName "myshare" `
  -Source "./myfile.txt" `
  -Path "myfile.txt" `
  -Context $ctx

# List files in a share
Get-AzStorageFile -ShareName "myshare" -Context $ctx | Format-Table Name

# Create a snapshot
$share = Get-AzStorageShare -Name "myshare" -Context $ctx
$share.CloudFileShare.Snapshot()

# Delete a file share
Remove-AzStorageShare -Name "myshare" -Context $ctx -Force
```

### Large File Shares

```powershell
# Enable large file shares on an existing storage account (up to 100 TiB per share)
# Requires: StorageV2 or FileStorage kind, LRS or ZRS redundancy (NOT GRS/GZRS)
Set-AzStorageAccount `
  -ResourceGroupName "myRG" `
  -Name "mystorageacct" `
  -EnableLargeFileShare

# Create a storage account with large file shares enabled from the start
New-AzStorageAccount `
  -ResourceGroupName "myRG" `
  -Name "mystorageacct" `
  -Location "westeurope" `
  -SkuName "Standard_LRS" `
  -Kind "StorageV2" `
  -EnableLargeFileShare

# Create a file share up to 100 TiB (102400 GiB) after enabling large file shares
$ctx = (Get-AzStorageAccount -ResourceGroupName "myRG" -Name "mystorageacct").Context
New-AzStorageShare -Name "myshare" -Context $ctx -QuotaGiB 102400

# Verify large file share setting
(Get-AzStorageAccount -ResourceGroupName "myRG" -Name "mystorageacct").LargeFileSharesState
```

> **Exam note:** Once large file shares is enabled it **cannot be disabled**. Enabling it also prevents changing redundancy from LRS/ZRS to GRS/GZRS.

### Storage Redundancy

```powershell
# Change storage redundancy (LRS → GRS)
Set-AzStorageAccount `
  -ResourceGroupName "myRG" `
  -Name "mystorageacct" `
  -SkuName "Standard_GRS"

# Change to ZRS (zone-redundant — compatible with large file shares)
Set-AzStorageAccount `
  -ResourceGroupName "myRG" `
  -Name "mystorageacct" `
  -SkuName "Standard_ZRS"

# Change to GZRS (geo-zone-redundant — NOT compatible with large file shares)
Set-AzStorageAccount `
  -ResourceGroupName "myRG" `
  -Name "mystorageacct" `
  -SkuName "Standard_GZRS"

# Check current redundancy
(Get-AzStorageAccount -ResourceGroupName "myRG" -Name "mystorageacct").Sku.Name
```

### Azure File Sync

```powershell
# Register the Storage Sync resource provider (one-time per subscription)
Register-AzResourceProvider -ProviderNamespace Microsoft.StorageSync

# Create a Storage Sync Service
New-AzStorageSyncService `
  -ResourceGroupName "myRG" `
  -StorageSyncServiceName "myStorageSyncService" `
  -Location "westeurope"

# Create a Sync Group
New-AzStorageSyncGroup `
  -ParentObject (Get-AzStorageSyncService -ResourceGroupName "myRG" -Name "myStorageSyncService") `
  -Name "mySyncGroup"

# Create a Cloud Endpoint (links sync group to an Azure file share)
$syncService = Get-AzStorageSyncService -ResourceGroupName "myRG" -Name "myStorageSyncService"
$syncGroup = Get-AzStorageSyncGroup -ParentObject $syncService -Name "mySyncGroup"
New-AzStorageSyncCloudEndpoint `
  -ParentObject $syncGroup `
  -Name "myCloudEndpoint" `
  -StorageAccountResourceId "/subscriptions/<sub-id>/resourceGroups/myRG/providers/Microsoft.Storage/storageAccounts/mystorageacct" `
  -AzureFileShareName "myshare"

# List sync groups
Get-AzStorageSyncGroup -ParentObject $syncService | Format-Table Name
```

> **Exam note:** Server endpoints are registered by installing the Azure File Sync agent on a Windows Server and registering via portal/PowerShell. Each sync group has exactly **one** cloud endpoint and one or more server endpoints. Cloud tiering can free up local disk space by keeping only frequently accessed files on-premises.

### AzCopy (Companion Tool — run from terminal, not PowerShell cmdlets)

```powershell
# AzCopy is a standalone executable, not a PowerShell module.
# Run these in a PowerShell terminal after downloading azcopy.exe.

# Login to AzCopy (interactive — uses Azure AD)
azcopy login

# ── Upload ───────────────────────────────────────────────────────────────────

# Copy a single local file to blob
azcopy copy '.\myfile.txt' `
  'https://mystorageacct.blob.core.windows.net/mycontainer/myfile.txt'

# Upload an entire local folder to blob (recursive)
azcopy copy '.\local-folder' `
  'https://mystorageacct.blob.core.windows.net/mycontainer/' `
  --recursive

# Upload to Azure Files share (SAS required)
azcopy copy '.\myfile.txt' `
  'https://mystorageacct.file.core.windows.net/myshare/myfile.txt?<SAS>'

# ── Download ──────────────────────────────────────────────────────────────────

# Download a single blob to local machine
azcopy copy `
  'https://mystorageacct.blob.core.windows.net/mycontainer/myfile.txt' `
  '.\myfile.txt'

# Download an entire container
azcopy copy `
  'https://mystorageacct.blob.core.windows.net/mycontainer/*' `
  '.\local-folder\' `
  --recursive

# ── Sync (only transfers changed/new files) ───────────────────────────────────

# Sync local folder UP to blob
azcopy sync '.\local-folder' `
  'https://mystorageacct.blob.core.windows.net/mycontainer' `
  --recursive

# Sync blob DOWN to local
azcopy sync `
  'https://mystorageacct.blob.core.windows.net/mycontainer' `
  '.\local-folder' `
  --recursive

# Sync local to Azure Files
azcopy sync '.\local-folder' `
  'https://mystorageacct.file.core.windows.net/myshare/?<SAS>' `
  --recursive

# ── Copy between storage accounts (server-side) ───────────────────────────────

azcopy copy `
  'https://source.blob.core.windows.net/container/?<SAS-src>' `
  'https://dest.blob.core.windows.net/container/?<SAS-dest>' `
  --recursive

# Job management
azcopy jobs list
azcopy jobs show <job-id>
azcopy jobs resume <job-id>
```

> **Exam note — copy vs sync:** `copy` always transfers files regardless of whether destination already has them. `sync` compares source and destination and only transfers differences. Use `sync` for ongoing mirroring; use `copy` for one-time bulk transfers.

---

## 3. Deploy and Manage Azure Compute Resources (20–25%)

### Virtual Machines

```powershell
# Create a VM (Linux)
$cred = Get-Credential
New-AzVM `
  -ResourceGroupName "myRG" `
  -Name "myVM" `
  -Location "westeurope" `
  -Image "Ubuntu2204" `
  -Size "Standard_B2s" `
  -Credential $cred

# Create a Windows VM
$cred = Get-Credential
New-AzVM `
  -ResourceGroupName "myRG" `
  -Name "myWinVM" `
  -Location "westeurope" `
  -Image "Win2022Datacenter" `
  -Size "Standard_D2s_v3" `
  -Credential $cred

# List VMs
Get-AzVM -ResourceGroupName "myRG" | Format-Table Name, Location, VmSize

# Get VM details
Get-AzVM -ResourceGroupName "myRG" -Name "myVM" -Status

# Start / Stop / Restart / Deallocate
Start-AzVM -ResourceGroupName "myRG" -Name "myVM"
Stop-AzVM -ResourceGroupName "myRG" -Name "myVM" -Force        # OS shutdown (still billed)
Stop-AzVM -ResourceGroupName "myRG" -Name "myVM" -Force -StayProvisioned  # OS shutdown, stay allocated
Restart-AzVM -ResourceGroupName "myRG" -Name "myVM"

# Deallocate (stop billing for compute)
Stop-AzVM -ResourceGroupName "myRG" -Name "myVM" -Force        # Default behaviour deallocates

# Resize a VM
$vm = Get-AzVM -ResourceGroupName "myRG" -Name "myVM"
$vm.HardwareProfile.VmSize = "Standard_D4s_v3"
Update-AzVM -ResourceGroupName "myRG" -VM $vm

# List available VM sizes in a region
Get-AzVMSize -Location "westeurope" | Format-Table Name, NumberOfCores, MemoryInMB

# List available sizes for resize (current VM)
Get-AzVMSize -ResourceGroupName "myRG" -VMName "myVM"

# Run a command on a VM
Invoke-AzVMRunCommand `
  -ResourceGroupName "myRG" `
  -VMName "myVM" `
  -CommandId "RunShellScript" `
  -ScriptString "apt-get update && apt-get install -y nginx"

# Add a data disk
$vm = Get-AzVM -ResourceGroupName "myRG" -Name "myVM"
$vm = Add-AzVMDataDisk -VM $vm -Name "myDataDisk" -DiskSizeInGB 128 `
  -CreateOption Empty -Lun 0 -StorageAccountType Premium_LRS
Update-AzVM -ResourceGroupName "myRG" -VM $vm

# Enable boot diagnostics
$vm = Get-AzVM -ResourceGroupName "myRG" -Name "myVM"
Set-AzVMBootDiagnostic -VM $vm -Enable
Update-AzVM -ResourceGroupName "myRG" -VM $vm

# Delete a VM
Remove-AzVM -ResourceGroupName "myRG" -Name "myVM" -Force
```

### VM Scale Sets (VMSS)

```powershell
# Create a scale set
$cred = Get-Credential
New-AzVmss `
  -ResourceGroupName "myRG" `
  -VMScaleSetName "myScaleSet" `
  -Location "westeurope" `
  -Credential $cred `
  -InstanceCount 2 `
  -VirtualMachineScaleSet (
    New-AzVmssConfig -SkuCapacity 2 -SkuName "Standard_B2s" -UpgradePolicyMode "Automatic"
  )

# List scale set instances
Get-AzVmssVM -ResourceGroupName "myRG" -VMScaleSetName "myScaleSet" | Format-Table InstanceId, Name

# Scale to a specific capacity
Update-AzVmss `
  -ResourceGroupName "myRG" `
  -VMScaleSetName "myScaleSet" `
  -SkuCapacity 5

# Update all instances after configuration change
Update-AzVmssInstance `
  -ResourceGroupName "myRG" `
  -VMScaleSetName "myScaleSet" `
  -InstanceId "*"
```

### App Service

```powershell
# Create an App Service plan
New-AzAppServicePlan `
  -ResourceGroupName "myRG" `
  -Name "myPlan" `
  -Location "westeurope" `
  -Tier "Standard" `
  -WorkerSize "Small"

# Create a web app
New-AzWebApp `
  -ResourceGroupName "myRG" `
  -Name "myWebApp" `
  -AppServicePlan "myPlan" `
  -Location "westeurope"

# List web apps
Get-AzWebApp -ResourceGroupName "myRG" | Format-Table Name, State, DefaultHostName

# Configure app settings
Set-AzWebApp `
  -ResourceGroupName "myRG" `
  -Name "myWebApp" `
  -AppSettings @{ "DB_CONNECTION" = "Server=mydb;Database=app" }

# Create a deployment slot
New-AzWebAppSlot `
  -ResourceGroupName "myRG" `
  -Name "myWebApp" `
  -Slot "staging"

# Swap slots (staging → production)
Switch-AzWebAppSlot `
  -ResourceGroupName "myRG" `
  -Name "myWebApp" `
  -SourceSlotName "staging" `
  -DestinationSlotName "production"

# Scale up the plan
Set-AzAppServicePlan `
  -ResourceGroupName "myRG" `
  -Name "myPlan" `
  -Tier "PremiumV3" `
  -WorkerSize "Small"

# Enable managed identity (system-assigned)
Set-AzWebApp `
  -ResourceGroupName "myRG" `
  -Name "myWebApp" `
  -AssignIdentity $true
```

### VM Snapshots and Managed Disk Images

```powershell
# Create a snapshot of an OS disk (VM can be running or deallocated)
$diskId = (Get-AzVM -ResourceGroupName "myRG" -Name "myVM").StorageProfile.OsDisk.ManagedDisk.Id
$snapshotConfig = New-AzSnapshotConfig `
  -SourceUri $diskId `
  -Location "westeurope" `
  -CreateOption Copy
New-AzSnapshot `
  -ResourceGroupName "myRG" `
  -SnapshotName "myVMSnapshot" `
  -Snapshot $snapshotConfig

# List snapshots
Get-AzSnapshot -ResourceGroupName "myRG" | Format-Table Name, DiskSizeGB, TimeCreated

# Create a managed disk from a snapshot (for restore)
$snapshot = Get-AzSnapshot -ResourceGroupName "myRG" -SnapshotName "myVMSnapshot"
$diskConfig = New-AzDiskConfig `
  -Location "westeurope" `
  -CreateOption Copy `
  -SourceResourceId $snapshot.Id `
  -SkuName "Premium_LRS"
New-AzDisk -ResourceGroupName "myRG" -DiskName "myRestoredDisk" -Disk $diskConfig

# Resize a managed disk (VM must be deallocated first)
Stop-AzVM -ResourceGroupName "myRG" -Name "myVM" -Force
$disk = Get-AzDisk -ResourceGroupName "myRG" -DiskName "myDataDisk"
$disk.DiskSizeGB = 256
Update-AzDisk -ResourceGroupName "myRG" -DiskName "myDataDisk" -Disk $disk

# Generalize a VM before capturing (run on Linux: sudo waagent -deprovision+user -force)
Set-AzVM -ResourceGroupName "myRG" -Name "myVM" -Generalized

# Create a managed image from a generalized VM
$vm = Get-AzVM -ResourceGroupName "myRG" -Name "myVM"
$imageConfig = New-AzImageConfig -Location "westeurope" -SourceVirtualMachineId $vm.Id
New-AzImage -ResourceGroupName "myRG" -ImageName "myVMImage" -Image $imageConfig

# Create a VM from a captured image
$image = Get-AzImage -ResourceGroupName "myRG" -ImageName "myVMImage"
$cred = Get-Credential
New-AzVM `
  -ResourceGroupName "myRG" `
  -Name "newVM" `
  -Location "westeurope" `
  -Image $image.Id `
  -Credential $cred
```

### Custom Script Extension

```powershell
# Install Custom Script Extension on a Linux VM
Set-AzVMExtension `
  -ResourceGroupName "myRG" `
  -VMName "myVM" `
  -Name "CustomScript" `
  -Publisher "Microsoft.Azure.Extensions" `
  -ExtensionType "CustomScript" `
  -TypeHandlerVersion "2.1" `
  -Settings @{
    fileUris = @("https://mystorageacct.blob.core.windows.net/scripts/install.sh")
    commandToExecute = "bash install.sh"
  }

# Install Custom Script Extension on a Windows VM
Set-AzVMExtension `
  -ResourceGroupName "myRG" `
  -VMName "myWinVM" `
  -Name "CustomScriptExtension" `
  -Publisher "Microsoft.Compute" `
  -ExtensionType "CustomScriptExtension" `
  -TypeHandlerVersion "1.10" `
  -Settings @{
    fileUris = @("https://mystorageacct.blob.core.windows.net/scripts/setup.ps1")
    commandToExecute = "powershell -ExecutionPolicy Unrestricted -File setup.ps1"
  }

# List VM extensions
Get-AzVMExtension -ResourceGroupName "myRG" -VMName "myVM" | Format-Table Name, Publisher, TypeHandlerVersion

# Remove a VM extension
Remove-AzVMExtension -ResourceGroupName "myRG" -VMName "myVM" -Name "CustomScript" -Force
```

### Azure Bastion

```powershell
# Step 1: Create the AzureBastionSubnet (must be named exactly 'AzureBastionSubnet', /27 or larger)
$vnet = Get-AzVirtualNetwork -ResourceGroupName "myRG" -Name "myVNet"
Add-AzVirtualNetworkSubnetConfig `
  -Name "AzureBastionSubnet" `
  -AddressPrefix "10.0.254.0/27" `
  -VirtualNetwork $vnet
$vnet | Set-AzVirtualNetwork

# Step 2: Create a Standard SKU public IP for Bastion
$bastionPip = New-AzPublicIpAddress `
  -ResourceGroupName "myRG" `
  -Name "myBastionIP" `
  -Location "westeurope" `
  -Sku "Standard" `
  -AllocationMethod "Static"

# Step 3: Create the Bastion host
$vnet = Get-AzVirtualNetwork -ResourceGroupName "myRG" -Name "myVNet"
New-AzBastion `
  -ResourceGroupName "myRG" `
  -Name "myBastionHost" `
  -PublicIpAddress $bastionPip `
  -VirtualNetwork $vnet `
  -Sku "Standard"
```

> **Exam note:** Bastion lets you connect to VMs via browser (RDP/SSH) without exposing a public IP on the VM. The VM's NSG does not need inbound RDP/SSH rules from the internet — only from the Bastion subnet.

### Azure Container Instances (ACI)

```powershell
# Create a container instance
New-AzContainerGroup `
  -ResourceGroupName "myRG" `
  -Name "myContainer" `
  -Image "mcr.microsoft.com/azuredocs/aci-helloworld" `
  -OsType Linux `
  -Port @(80) `
  -DnsNameLabel "myapp-demo" `
  -Location "westeurope"

# Get container details
Get-AzContainerGroup -ResourceGroupName "myRG" -Name "myContainer"

# Get container logs
Get-AzContainerInstanceLog -ResourceGroupName "myRG" -ContainerGroupName "myContainer"

# Delete a container
Remove-AzContainerGroup -ResourceGroupName "myRG" -Name "myContainer"
```

---

## 4. Implement and Manage Virtual Networking (15–20%)

### Virtual Networks and Subnets

```powershell
# Create a virtual network with a subnet
$subnet = New-AzVirtualNetworkSubnetConfig `
  -Name "default" `
  -AddressPrefix "10.0.1.0/24"

New-AzVirtualNetwork `
  -ResourceGroupName "myRG" `
  -Name "myVNet" `
  -Location "westeurope" `
  -AddressPrefix "10.0.0.0/16" `
  -Subnet $subnet

# Add a subnet to an existing VNet
$vnet = Get-AzVirtualNetwork -ResourceGroupName "myRG" -Name "myVNet"
Add-AzVirtualNetworkSubnetConfig `
  -Name "BackendSubnet" `
  -AddressPrefix "10.0.2.0/24" `
  -VirtualNetwork $vnet
$vnet | Set-AzVirtualNetwork

# List subnets
(Get-AzVirtualNetwork -ResourceGroupName "myRG" -Name "myVNet").Subnets |
  Format-Table Name, AddressPrefix

# Associate an NSG with a subnet
$vnet = Get-AzVirtualNetwork -ResourceGroupName "myRG" -Name "myVNet"
$nsg = Get-AzNetworkSecurityGroup -ResourceGroupName "myRG" -Name "myNSG"
Set-AzVirtualNetworkSubnetConfig `
  -Name "BackendSubnet" `
  -VirtualNetwork $vnet `
  -AddressPrefix "10.0.2.0/24" `
  -NetworkSecurityGroup $nsg
$vnet | Set-AzVirtualNetwork
```

### Network Security Groups (NSGs)

```powershell
# Create an NSG
$nsg = New-AzNetworkSecurityGroup `
  -ResourceGroupName "myRG" `
  -Name "myNSG" `
  -Location "westeurope"

# Add an inbound rule (allow HTTP)
$nsg | Add-AzNetworkSecurityRuleConfig `
  -Name "AllowHTTP" `
  -Priority 100 `
  -Direction Inbound `
  -Access Allow `
  -Protocol Tcp `
  -SourceAddressPrefix "*" `
  -SourcePortRange "*" `
  -DestinationAddressPrefix "*" `
  -DestinationPortRange 80
$nsg | Set-AzNetworkSecurityGroup

# Add an inbound rule (deny all)
$nsg | Add-AzNetworkSecurityRuleConfig `
  -Name "DenyAll" `
  -Priority 4096 `
  -Direction Inbound `
  -Access Deny `
  -Protocol "*" `
  -SourceAddressPrefix "*" `
  -SourcePortRange "*" `
  -DestinationAddressPrefix "*" `
  -DestinationPortRange "*"
$nsg | Set-AzNetworkSecurityGroup

# List NSG rules
(Get-AzNetworkSecurityGroup -ResourceGroupName "myRG" -Name "myNSG").SecurityRules |
  Format-Table Name, Priority, Direction, Access, Protocol, DestinationPortRange
```

### Public IP Addresses

```powershell
# Create a public IP
New-AzPublicIpAddress `
  -ResourceGroupName "myRG" `
  -Name "myPublicIP" `
  -Location "westeurope" `
  -Sku "Standard" `
  -AllocationMethod "Static"

# List public IPs
Get-AzPublicIpAddress -ResourceGroupName "myRG" | Format-Table Name, IpAddress, Sku
```

### VNet Peering

```powershell
# Get both VNets
$vnet1 = Get-AzVirtualNetwork -ResourceGroupName "myRG" -Name "VNet1"
$vnet2 = Get-AzVirtualNetwork -ResourceGroupName "myRG" -Name "VNet2"

# Create peering from VNet1 to VNet2
Add-AzVirtualNetworkPeering `
  -Name "VNet1-to-VNet2" `
  -VirtualNetwork $vnet1 `
  -RemoteVirtualNetworkId $vnet2.Id

# Create the reverse peering (VNet2 to VNet1)
Add-AzVirtualNetworkPeering `
  -Name "VNet2-to-VNet1" `
  -VirtualNetwork $vnet2 `
  -RemoteVirtualNetworkId $vnet1.Id

# List peerings
Get-AzVirtualNetworkPeering `
  -ResourceGroupName "myRG" `
  -VirtualNetworkName "VNet1" |
  Format-Table Name, PeeringState, AllowVirtualNetworkAccess

# Enable gateway transit on hub peering
$peering = Get-AzVirtualNetworkPeering `
  -ResourceGroupName "myRG" `
  -VirtualNetworkName "HubVNet" `
  -Name "Hub-to-Spoke"
$peering.AllowGatewayTransit = $true
Set-AzVirtualNetworkPeering -VirtualNetworkPeering $peering
```

### Azure DNS

```powershell
# Create a DNS zone
New-AzDnsZone -ResourceGroupName "myRG" -Name "contoso.com"

# Add an A record
New-AzDnsRecordSet `
  -ResourceGroupName "myRG" `
  -ZoneName "contoso.com" `
  -Name "www" `
  -RecordType A `
  -Ttl 3600 `
  -DnsRecords (New-AzDnsRecordConfig -IPv4Address "1.2.3.4")

# Add a CNAME record
New-AzDnsRecordSet `
  -ResourceGroupName "myRG" `
  -ZoneName "contoso.com" `
  -Name "blog" `
  -RecordType CNAME `
  -Ttl 3600 `
  -DnsRecords (New-AzDnsRecordConfig -Cname "blog.contoso.azurewebsites.net")

# List DNS records
Get-AzDnsRecordSet -ResourceGroupName "myRG" -ZoneName "contoso.com"

# Create a private DNS zone
New-AzPrivateDnsZone -ResourceGroupName "myRG" -Name "private.contoso.com"

# Link private DNS zone to VNet
$vnet = Get-AzVirtualNetwork -ResourceGroupName "myRG" -Name "myVNet"
New-AzPrivateDnsVirtualNetworkLink `
  -ResourceGroupName "myRG" `
  -ZoneName "private.contoso.com" `
  -Name "myVNetLink" `
  -VirtualNetworkId $vnet.Id `
  -EnableRegistration
```

### Load Balancer

```powershell
# Create a public IP for the LB
$pip = New-AzPublicIpAddress `
  -ResourceGroupName "myRG" `
  -Name "myLBPublicIP" `
  -Location "westeurope" `
  -Sku "Standard" `
  -AllocationMethod "Static"

# Create frontend IP config
$frontend = New-AzLoadBalancerFrontendIpConfig -Name "myFrontend" -PublicIpAddress $pip

# Create backend pool
$backendPool = New-AzLoadBalancerBackendAddressPoolConfig -Name "myBackendPool"

# Create health probe
$probe = New-AzLoadBalancerProbeConfig `
  -Name "myHealthProbe" `
  -Protocol Tcp `
  -Port 80 `
  -IntervalInSeconds 15 `
  -ProbeCount 2

# Create LB rule
$rule = New-AzLoadBalancerRuleConfig `
  -Name "myLBRule" `
  -FrontendIpConfiguration $frontend `
  -BackendAddressPool $backendPool `
  -Probe $probe `
  -Protocol Tcp `
  -FrontendPort 80 `
  -BackendPort 80

# Create the load balancer
New-AzLoadBalancer `
  -ResourceGroupName "myRG" `
  -Name "myLoadBalancer" `
  -Location "westeurope" `
  -Sku "Standard" `
  -FrontendIpConfiguration $frontend `
  -BackendAddressPool $backendPool `
  -Probe $probe `
  -LoadBalancingRule $rule
```

### VPN Gateway

```powershell
# Create a VPN gateway (takes 30–45 mins)
$gwSubnet = Get-AzVirtualNetworkSubnetConfig -Name "GatewaySubnet" `
  -VirtualNetwork (Get-AzVirtualNetwork -ResourceGroupName "myRG" -Name "myVNet")
$gwPip = New-AzPublicIpAddress -Name "myGatewayIP" -ResourceGroupName "myRG" `
  -Location "westeurope" -AllocationMethod Static -Sku Standard
$gwIpConfig = New-AzVirtualNetworkGatewayIpConfig -Name "gwIpConfig" `
  -SubnetId $gwSubnet.Id -PublicIpAddressId $gwPip.Id

New-AzVirtualNetworkGateway `
  -ResourceGroupName "myRG" `
  -Name "myVpnGateway" `
  -Location "westeurope" `
  -GatewayType Vpn `
  -VpnType RouteBased `
  -GatewaySku VpnGw1 `
  -IpConfigurations $gwIpConfig `
  -AsJob  # Run in background
```

### User-Defined Routes (Route Tables)

```powershell
# Create a route table
New-AzRouteTable `
  -ResourceGroupName "myRG" `
  -Name "myRouteTable" `
  -Location "westeurope" `
  -DisableBgpRoutePropagation

# Add a route — force all internet traffic through a Network Virtual Appliance (NVA)
$routeTable = Get-AzRouteTable -ResourceGroupName "myRG" -Name "myRouteTable"
Add-AzRouteConfig `
  -RouteTable $routeTable `
  -Name "route-to-nva" `
  -AddressPrefix "0.0.0.0/0" `
  -NextHopType VirtualAppliance `
  -NextHopIpAddress "10.0.1.4"
Set-AzRouteTable -RouteTable $routeTable

# Route on-premises traffic through VNet Gateway
Add-AzRouteConfig `
  -RouteTable $routeTable `
  -Name "route-to-onprem" `
  -AddressPrefix "192.168.0.0/16" `
  -NextHopType VirtualNetworkGateway
Set-AzRouteTable -RouteTable $routeTable

# Associate route table with a subnet
$vnet = Get-AzVirtualNetwork -ResourceGroupName "myRG" -Name "myVNet"
$routeTable = Get-AzRouteTable -ResourceGroupName "myRG" -Name "myRouteTable"
Set-AzVirtualNetworkSubnetConfig `
  -Name "mySubnet" `
  -VirtualNetwork $vnet `
  -AddressPrefix "10.0.1.0/24" `
  -RouteTable $routeTable
$vnet | Set-AzVirtualNetwork

# List routes in a route table
Get-AzRouteConfig -RouteTable (Get-AzRouteTable -ResourceGroupName "myRG" -Name "myRouteTable") |
  Format-Table Name, AddressPrefix, NextHopType, NextHopIpAddress
```

> **Exam note — next-hop types:** `VirtualAppliance` (NVA, specify IP), `VirtualNetworkGateway` (on-prem via VPN/ExpressRoute), `VnetLocal` (stay in VNet), `Internet`, `None` (drop traffic).

### Service Endpoints

```powershell
# Enable a service endpoint on a subnet
$vnet = Get-AzVirtualNetwork -ResourceGroupName "myRG" -Name "myVNet"
Set-AzVirtualNetworkSubnetConfig `
  -Name "mySubnet" `
  -VirtualNetwork $vnet `
  -AddressPrefix "10.0.1.0/24" `
  -ServiceEndpoint "Microsoft.Storage"
$vnet | Set-AzVirtualNetwork

# Enable multiple service endpoints
Set-AzVirtualNetworkSubnetConfig `
  -Name "mySubnet" `
  -VirtualNetwork $vnet `
  -AddressPrefix "10.0.1.0/24" `
  -ServiceEndpoint "Microsoft.Storage", "Microsoft.KeyVault", "Microsoft.Sql"
$vnet | Set-AzVirtualNetwork

# Restrict a storage account to a specific subnet (used together with service endpoint)
$vnet = Get-AzVirtualNetwork -ResourceGroupName "myRG" -Name "myVNet"
$subnet = Get-AzVirtualNetworkSubnetConfig -Name "mySubnet" -VirtualNetwork $vnet
Add-AzStorageAccountNetworkRule `
  -ResourceGroupName "myRG" `
  -Name "mystorageacct" `
  -VirtualNetworkResourceId $subnet.Id
Update-AzStorageAccountNetworkRuleSet `
  -ResourceGroupName "myRG" `
  -Name "mystorageacct" `
  -DefaultAction Deny
```

> **Exam note — service endpoint vs private endpoint:** Service endpoints keep traffic on the Microsoft backbone but the storage account still has a public IP. Private endpoints give the resource a private IP in your VNet — traffic never leaves the VNet and the public endpoint can be disabled.

### Private Endpoints

```powershell
# Step 1: Disable private endpoint network policies on the subnet
$vnet = Get-AzVirtualNetwork -ResourceGroupName "myRG" -Name "myVNet"
($vnet | Select-Object -ExpandProperty Subnets | Where-Object Name -eq "mySubnet").PrivateEndpointNetworkPolicies = "Disabled"
$vnet | Set-AzVirtualNetwork

# Step 2: Create the private endpoint (group-id: blob | file | queue | table | sqlServer | etc.)
$storageAccount = Get-AzStorageAccount -ResourceGroupName "myRG" -Name "mystorageacct"
$vnet = Get-AzVirtualNetwork -ResourceGroupName "myRG" -Name "myVNet"
$subnet = $vnet | Select-Object -ExpandProperty Subnets | Where-Object Name -eq "mySubnet"

$privateEndpointConnection = New-AzPrivateLinkServiceConnection `
  -Name "myStorageConnection" `
  -PrivateLinkServiceId $storageAccount.Id `
  -GroupId "blob"

New-AzPrivateEndpoint `
  -ResourceGroupName "myRG" `
  -Name "myPrivateEndpoint" `
  -Location "westeurope" `
  -Subnet $subnet `
  -PrivateLinkServiceConnection $privateEndpointConnection

# Step 3: Create a private DNS zone for name resolution
New-AzPrivateDnsZone `
  -ResourceGroupName "myRG" `
  -Name "privatelink.blob.core.windows.net"

# Step 4: Link the private DNS zone to the VNet
$vnet = Get-AzVirtualNetwork -ResourceGroupName "myRG" -Name "myVNet"
New-AzPrivateDnsVirtualNetworkLink `
  -ResourceGroupName "myRG" `
  -ZoneName "privatelink.blob.core.windows.net" `
  -Name "myDNSLink" `
  -VirtualNetworkId $vnet.Id

# Step 5: Create a DNS zone group (auto-registers A record)
$zone = Get-AzPrivateDnsZone -ResourceGroupName "myRG" -Name "privatelink.blob.core.windows.net"
$zoneConfig = New-AzPrivateDnsZoneConfig `
  -Name "blob" `
  -PrivateDnsZoneId $zone.ResourceId
New-AzPrivateDnsZoneGroup `
  -ResourceGroupName "myRG" `
  -PrivateEndpointName "myPrivateEndpoint" `
  -Name "myZoneGroup" `
  -PrivateDnsZoneConfig $zoneConfig

# List private endpoints
Get-AzPrivateEndpoint -ResourceGroupName "myRG" | Format-Table Name, Location, ProvisioningState
```

### Network Watcher

```powershell
# Enable Network Watcher in a region
Set-AzNetworkWatcher `
  -Name "NetworkWatcher_westeurope" `
  -ResourceGroupName "NetworkWatcherRG" `
  -Location "westeurope"

# Get the Network Watcher object
$nw = Get-AzNetworkWatcher -Name "NetworkWatcher_westeurope" -ResourceGroupName "NetworkWatcherRG"

# Test VM-to-VM or VM-to-endpoint connectivity
$vm = Get-AzVM -ResourceGroupName "myRG" -Name "myVM"
Test-AzNetworkWatcherConnectivity `
  -NetworkWatcher $nw `
  -SourceId $vm.Id `
  -DestinationAddress "10.0.2.4" `
  -DestinationPort 443

# Test connectivity to an internet endpoint
Test-AzNetworkWatcherConnectivity `
  -NetworkWatcher $nw `
  -SourceId $vm.Id `
  -DestinationAddress "www.microsoft.com" `
  -DestinationPort 443

# Check effective NSG rules on a VM's NIC
$nic = (Get-AzNetworkInterface | Where-Object { $_.VirtualMachine.Id -like "*myVM*" })[0]
Get-AzEffectiveNetworkSecurityGroup `
  -NetworkInterfaceName $nic.Name `
  -ResourceGroupName "myRG"

# Check effective routes (next-hop) on a VM's NIC
Get-AzEffectiveRouteTable `
  -NetworkInterfaceName $nic.Name `
  -ResourceGroupName "myRG" | Format-Table Name, State, NextHopType, NextHopIpAddress

# Enable NSG flow logs
$nsg = Get-AzNetworkSecurityGroup -ResourceGroupName "myRG" -Name "myNSG"
$sa = Get-AzStorageAccount -ResourceGroupName "myRG" -Name "mystorageacct"
Set-AzNetworkWatcherFlowLog `
  -NetworkWatcher $nw `
  -Name "myFlowLog" `
  -TargetResourceId $nsg.Id `
  -StorageId $sa.Id `
  -Enabled $true `
  -RetentionPolicyEnabled $true `
  -RetentionPolicyDays 30
```

### NAT Gateway

```powershell
# Step 1: Create a public IP for the NAT Gateway
$natPip = New-AzPublicIpAddress `
  -ResourceGroupName "myRG" `
  -Name "myNATGatewayIP" `
  -Location "westeurope" `
  -Sku "Standard" `
  -AllocationMethod "Static"

# Step 2: Create the NAT Gateway
$natGateway = New-AzNatGateway `
  -ResourceGroupName "myRG" `
  -Name "myNATGateway" `
  -Location "westeurope" `
  -Sku "Standard" `
  -PublicIpAddress $natPip `
  -IdleTimeoutInMinutes 10

# Step 3: Associate the NAT Gateway with a subnet
$vnet = Get-AzVirtualNetwork -ResourceGroupName "myRG" -Name "myVNet"
Set-AzVirtualNetworkSubnetConfig `
  -Name "mySubnet" `
  -VirtualNetwork $vnet `
  -AddressPrefix "10.0.1.0/24" `
  -NatGateway $natGateway
$vnet | Set-AzVirtualNetwork

# Show NAT Gateway details
Get-AzNatGateway -ResourceGroupName "myRG" -Name "myNATGateway" |
  Format-List Name, Location, ProvisioningState, IdleTimeoutInMinutes
```

> **Exam note:** NAT Gateway provides outbound-only internet connectivity for resources in a subnet. It gives a stable, predictable public IP for outbound connections and handles SNAT port exhaustion at scale. All resources in the subnet share the NAT Gateway's public IP(s) for outbound traffic.

---

## 5. Monitor and Maintain Azure Resources (10–15%)

### Azure Monitor

```powershell
# Get CPU metrics for a VM
Get-AzMetric `
  -ResourceId "/subscriptions/<sub-id>/resourceGroups/myRG/providers/Microsoft.Compute/virtualMachines/myVM" `
  -MetricName "Percentage CPU" `
  -TimeGrain 01:00:00 `
  -StartTime (Get-Date).AddHours(-6)

# Create an action group
$emailReceiver = New-AzActionGroupEmailReceiverObject `
  -Name "ops-email" `
  -EmailAddress "ops@contoso.com"
New-AzActionGroup `
  -ResourceGroupName "myRG" `
  -Name "OpsTeam" `
  -ShortName "ops" `
  -EmailReceiver $emailReceiver `
  -Location "Global"

# Create a metric alert
$condition = New-AzMetricAlertRuleV2Criteria `
  -MetricName "Percentage CPU" `
  -Operator GreaterThan `
  -Threshold 80 `
  -TimeAggregation Average
Add-AzMetricAlertRuleV2 `
  -ResourceGroupName "myRG" `
  -Name "High CPU Alert" `
  -TargetResourceId "/subscriptions/<sub-id>/resourceGroups/myRG/providers/Microsoft.Compute/virtualMachines/myVM" `
  -Condition $condition `
  -WindowSize 00:05:00 `
  -Frequency 00:01:00 `
  -ActionGroupId "<action-group-resource-id>" `
  -Severity 2
```

### Log Analytics

```powershell
# Create a Log Analytics workspace
New-AzOperationalInsightsWorkspace `
  -ResourceGroupName "myRG" `
  -Name "myWorkspace" `
  -Location "westeurope" `
  -Sku "PerGB2018"

# Query logs (KQL)
Invoke-AzOperationalInsightsQuery `
  -WorkspaceId "<workspace-id>" `
  -Query "Heartbeat | summarize count() by Computer"

# Enable diagnostic settings on a resource
$workspace = Get-AzOperationalInsightsWorkspace -ResourceGroupName "myRG" -Name "myWorkspace"
Set-AzDiagnosticSetting `
  -ResourceId "/subscriptions/<sub-id>/resourceGroups/myRG/providers/Microsoft.Storage/storageAccounts/mystorageacct" `
  -WorkspaceId $workspace.ResourceId `
  -Name "send-to-law" `
  -Enabled $true `
  -Category "StorageRead"
```

### Azure Backup

```powershell
# Create a Recovery Services vault
New-AzRecoveryServicesVault `
  -ResourceGroupName "myRG" `
  -Name "myVault" `
  -Location "westeurope"

# Set vault context
$vault = Get-AzRecoveryServicesVault -ResourceGroupName "myRG" -Name "myVault"
Set-AzRecoveryServicesVaultContext -Vault $vault

# Get backup policy
$policy = Get-AzRecoveryServicesBackupProtectionPolicy -Name "DefaultPolicy" -VaultId $vault.ID

# Enable backup for a VM
Enable-AzRecoveryServicesBackupProtection `
  -ResourceGroupName "myRG" `
  -Name "myVM" `
  -Policy $policy `
  -VaultId $vault.ID

# Trigger an on-demand backup
$container = Get-AzRecoveryServicesBackupContainer -ContainerType AzureVM -VaultId $vault.ID
$item = Get-AzRecoveryServicesBackupItem -Container $container -WorkloadType AzureVM -VaultId $vault.ID
Backup-AzRecoveryServicesBackupItem -Item $item -VaultId $vault.ID

# List recovery points
$item = Get-AzRecoveryServicesBackupItem -Container $container -WorkloadType AzureVM -VaultId $vault.ID
Get-AzRecoveryServicesBackupRecoveryPoint -Item $item -VaultId $vault.ID
```

### Azure Site Recovery

```powershell
# Site Recovery uses a Recovery Services vault (same vault type as Backup)
$vault = New-AzRecoveryServicesVault `
  -ResourceGroupName "myRG" `
  -Name "mySiteRecoveryVault" `
  -Location "westeurope"

# Set vault context
Set-AzRecoveryServicesVaultContext -Vault $vault

# List replicated/protected items in a vault
Get-AzRecoveryServicesAsrReplicationProtectedItem `
  -ProtectionContainer (
    Get-AzRecoveryServicesAsrProtectionContainer -Fabric (
      Get-AzRecoveryServicesAsrFabric
    )
  )

# Note: Full ASR setup (fabric, policy, protected items, failover)
# is complex and typically done via portal for initial configuration.
```

> **Exam concepts for ASR:**
> - **RPO** (Recovery Point Objective): max acceptable data loss (how old can the recovery point be)
> - **RTO** (Recovery Time Objective): max acceptable downtime
> - **Replication policy**: sets RPO threshold and recovery point retention
> - **Test failover**: non-disruptive validation — runs in an isolated VNet, production is unaffected
> - **Planned failover**: graceful failover, no data loss (used when primary is about to go down)
> - **Unplanned failover**: emergency failover when primary is already down, possible data loss

### Resource Management

```powershell
# List all resources in a resource group
Get-AzResource -ResourceGroupName "myRG" | Format-Table Name, ResourceType, Location

# Move resources between resource groups
Move-AzResource `
  -DestinationResourceGroupName "newRG" `
  -ResourceId "/subscriptions/<sub-id>/resourceGroups/myRG/providers/Microsoft.Compute/virtualMachines/myVM"

# Export a resource group template (ARM)
Export-AzResourceGroup -ResourceGroupName "myRG" -Path "./template.json"

# Deploy an ARM template
New-AzResourceGroupDeployment `
  -ResourceGroupName "myRG" `
  -TemplateFile "./template.json" `
  -TemplateParameterFile "./parameters.json"

# What-if deployment (preview changes)
New-AzResourceGroupDeployment `
  -ResourceGroupName "myRG" `
  -TemplateFile "./template.json" `
  -WhatIf

# Delete a resource group
Remove-AzResourceGroup -Name "myRG" -Force -AsJob
```

---

## Quick Reference: Common Patterns

```powershell
# Output formatting
| Format-Table                    # Columns
| Format-List                     # All properties
| Select-Object Name, Location    # Pick columns
| Where-Object { $_.Location -eq "westeurope" }  # Filter
| Sort-Object Name                # Sort

# Get a resource ID
(Get-AzVM -ResourceGroupName "myRG" -Name "myVM").Id

# Run long operations in background
Start-AzVM -ResourceGroupName "myRG" -Name "myVM" -AsJob
Get-Job | Receive-Job  # Check results later

# Suppress confirmation prompts
Remove-AzVM -ResourceGroupName "myRG" -Name "myVM" -Force

# Connect with a specific tenant
Connect-AzAccount -TenantId "<tenant-id>"

# List all available Az module commands for a service
Get-Command -Module Az.Compute -Verb Get
```
