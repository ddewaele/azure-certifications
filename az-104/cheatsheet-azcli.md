# AZ-104 Azure CLI (az) Cheatsheet

Complete `az` CLI command reference organized by AZ-104 exam domain.

> All commands assume you are logged in (`az login`) and have set a default subscription (`az account set --subscription <id>`).

---

## 1. Manage Azure Identities and Governance (20–25%)

### Entra ID Users

```bash
# List all users
az ad user list --output table

# Create a user
az ad user create \
  --display-name "John Doe" \
  --user-principal-name john@contoso.onmicrosoft.com \
  --password "TempP@ss123!" \
  --force-change-password-next-sign-in true

# Get a specific user
az ad user show --id john@contoso.onmicrosoft.com

# Update a user property
az ad user update --id john@contoso.onmicrosoft.com \
  --display-name "John A. Doe"

# Delete a user
az ad user delete --id john@contoso.onmicrosoft.com

# List deleted users (recycle bin)
az ad deleted-user list --output table

# Restore a deleted user
az ad deleted-user restore --id <object-id>

# Bulk invite guest users (B2B)
az ad user create --user-type Guest \
  --display-name "External User" \
  --mail "external@fabrikam.com"
```

### Entra ID Groups

```bash
# List all groups
az ad group list --output table

# Create a security group
az ad group create \
  --display-name "DevOps Team" \
  --mail-nickname "devops-team"

# Add a member to a group
az ad group member add \
  --group "DevOps Team" \
  --member-id <user-object-id>

# List group members
az ad group member list --group "DevOps Team" --output table

# Remove a member from a group
az ad group member remove \
  --group "DevOps Team" \
  --member-id <user-object-id>

# Check if a user is a member of a group
az ad group member check \
  --group "DevOps Team" \
  --member-id <user-object-id>

# Delete a group
az ad group delete --group "DevOps Team"
```

### RBAC Role Assignments

```bash
# List all role assignments for a subscription
az role assignment list --output table

# List role assignments for a specific user
az role assignment list --assignee john@contoso.onmicrosoft.com --output table

# Assign a role to a user at subscription scope
az role assignment create \
  --assignee john@contoso.onmicrosoft.com \
  --role "Contributor" \
  --scope /subscriptions/<subscription-id>

# Assign a role at resource group scope
az role assignment create \
  --assignee john@contoso.onmicrosoft.com \
  --role "Reader" \
  --resource-group myResourceGroup

# Assign a role to a group
az role assignment create \
  --assignee-object-id <group-object-id> \
  --assignee-principal-type Group \
  --role "Contributor" \
  --resource-group myResourceGroup

# Remove a role assignment
az role assignment delete \
  --assignee john@contoso.onmicrosoft.com \
  --role "Contributor" \
  --resource-group myResourceGroup

# List all built-in role definitions
az role definition list --output table

# Show details of a specific role
az role definition list --name "Contributor" --output json

# Create a custom role from JSON
az role definition create --role-definition @custom-role.json

# Update a custom role
az role definition update --role-definition @custom-role-updated.json

# Delete a custom role
az role definition delete --name "My Custom Role"
```

### Subscriptions and Management Groups

```bash
# List all subscriptions
az account list --output table

# Set the active subscription
az account set --subscription "My Subscription"

# Show current subscription
az account show --output table

# List management groups
az account management-group list --output table

# Create a management group
az account management-group create --name "Production"

# Move a subscription under a management group
az account management-group subscription add \
  --name "Production" \
  --subscription <subscription-id>

# Delete a management group
az account management-group delete --name "Production"
```

### Azure Policy

```bash
# List all policy definitions
az policy definition list --output table

# List built-in policy definitions (filtered)
az policy definition list --query "[?policyType=='BuiltIn']" --output table

# Show a specific policy definition
az policy definition show --name <policy-name>

# Assign a policy to a resource group
az policy assignment create \
  --name "require-tag-environment" \
  --policy "Require a tag on resources" \
  --scope /subscriptions/<sub-id>/resourceGroups/myRG \
  --params '{"tagName": {"value": "Environment"}}'

# Assign a policy to a subscription
az policy assignment create \
  --name "allowed-locations" \
  --policy "Allowed locations" \
  --scope /subscriptions/<sub-id> \
  --params '{"listOfAllowedLocations": {"value": ["westeurope", "northeurope"]}}'

# List policy assignments
az policy assignment list --output table

# Delete a policy assignment
az policy assignment delete --name "require-tag-environment"

# Check compliance state
az policy state list \
  --resource-group myRG \
  --query "[?complianceState=='NonCompliant']" \
  --output table

# Create a policy initiative (policy set)
az policy set-definition create \
  --name "my-initiative" \
  --definitions @initiative-definitions.json

# Trigger a policy compliance scan
az policy state trigger-scan --resource-group myRG
```

### Resource Locks

```bash
# Create a CanNotDelete lock on a resource group
az lock create \
  --name "protect-prod" \
  --resource-group Production-RG \
  --lock-type CanNotDelete

# Create a ReadOnly lock on a resource
az lock create \
  --name "readonly-lock" \
  --resource-group Production-RG \
  --resource-name myStorageAccount \
  --resource-type Microsoft.Storage/storageAccounts \
  --lock-type ReadOnly

# List locks
az lock list --resource-group Production-RG --output table

# Delete a lock
az lock delete --name "protect-prod" --resource-group Production-RG
```

### Tags

```bash
# Add a tag to a resource group
az tag update \
  --resource-id /subscriptions/<sub-id>/resourceGroups/myRG \
  --operation Merge \
  --tags Environment=Production Department=IT

# Add a tag to a resource
az tag update \
  --resource-id /subscriptions/<sub-id>/resourceGroups/myRG/providers/Microsoft.Storage/storageAccounts/mystorageacct \
  --operation Merge \
  --tags CostCenter=12345

# List tags on a resource group
az tag list --resource-id /subscriptions/<sub-id>/resourceGroups/myRG

# Remove a specific tag
az tag update \
  --resource-id /subscriptions/<sub-id>/resourceGroups/myRG \
  --operation Delete \
  --tags Department

# List all tag names in a subscription
az tag list --output table
```

---

## 2. Implement and Manage Storage (15–20%)

### Storage Accounts

```bash
# Create a storage account
az storage account create \
  --name mystorageacct \
  --resource-group myRG \
  --location westeurope \
  --sku Standard_LRS \
  --kind StorageV2 \
  --https-only true \
  --min-tls-version TLS1_2

# List storage accounts
az storage account list --output table

# Show storage account properties
az storage account show --name mystorageacct --resource-group myRG

# Update storage account (enable blob versioning)
az storage account blob-service-properties update \
  --account-name mystorageacct \
  --resource-group myRG \
  --enable-versioning true

# Get storage account keys
az storage account keys list \
  --account-name mystorageacct \
  --resource-group myRG \
  --output table

# Regenerate a storage account key
az storage account keys renew \
  --account-name mystorageacct \
  --resource-group myRG \
  --key key1

# Generate a SAS token (account-level)
az storage account generate-sas \
  --account-name mystorageacct \
  --permissions rwdlacup \
  --resource-types sco \
  --services bfqt \
  --expiry 2026-12-31T23:59Z

# Configure network rules (restrict to VNet)
az storage account network-rule add \
  --account-name mystorageacct \
  --resource-group myRG \
  --vnet-name myVNet \
  --subnet mySubnet

# Set default network action to Deny
az storage account update \
  --name mystorageacct \
  --resource-group myRG \
  --default-action Deny

# Enable soft delete for blobs
az storage blob service-properties delete-policy update \
  --account-name mystorageacct \
  --enable true \
  --days-retained 14

# Configure lifecycle management
az storage account management-policy create \
  --account-name mystorageacct \
  --resource-group myRG \
  --policy @lifecycle-policy.json
```

### Blob Storage

```bash
# Create a blob container
az storage container create \
  --name mycontainer \
  --account-name mystorageacct \
  --public-access off

# Upload a file to blob storage
az storage blob upload \
  --account-name mystorageacct \
  --container-name mycontainer \
  --file ./myfile.txt \
  --name myfile.txt

# Upload a directory (recursive)
az storage blob upload-batch \
  --account-name mystorageacct \
  --destination mycontainer \
  --source ./local-folder

# Download a blob
az storage blob download \
  --account-name mystorageacct \
  --container-name mycontainer \
  --name myfile.txt \
  --file ./downloaded.txt

# List blobs in a container
az storage blob list \
  --account-name mystorageacct \
  --container-name mycontainer \
  --output table

# Set blob access tier
az storage blob set-tier \
  --account-name mystorageacct \
  --container-name mycontainer \
  --name myfile.txt \
  --tier Cool

# Copy blob between containers
az storage blob copy start \
  --account-name mystorageacct \
  --destination-container dest-container \
  --destination-blob myfile.txt \
  --source-uri "https://source.blob.core.windows.net/src/myfile.txt"

# Delete a blob
az storage blob delete \
  --account-name mystorageacct \
  --container-name mycontainer \
  --name myfile.txt

# Generate a blob-level SAS
az storage blob generate-sas \
  --account-name mystorageacct \
  --container-name mycontainer \
  --name myfile.txt \
  --permissions r \
  --expiry 2026-12-31T23:59Z
```

### File Shares

```bash
# Create a file share
az storage share create \
  --name myshare \
  --account-name mystorageacct \
  --quota 100

# Upload a file
az storage file upload \
  --share-name myshare \
  --account-name mystorageacct \
  --source ./myfile.txt

# List files in a share
az storage file list \
  --share-name myshare \
  --account-name mystorageacct \
  --output table

# Create a snapshot of a file share
az storage share snapshot \
  --name myshare \
  --account-name mystorageacct

# Delete a file share
az storage share delete \
  --name myshare \
  --account-name mystorageacct
```

### Large File Shares

```bash
# Enable large file shares on an existing storage account (up to 100 TiB per share)
# Requires: StorageV2 or FileStorage kind, LRS or ZRS redundancy (NOT GRS/GZRS)
az storage account update \
  --name mystorageacct \
  --resource-group myRG \
  --enable-large-file-share

# Create a storage account with large file shares enabled from the start
az storage account create \
  --name mystorageacct \
  --resource-group myRG \
  --location westeurope \
  --sku Standard_LRS \
  --kind StorageV2 \
  --enable-large-file-share

# Create a file share up to 100 TiB (102400 GiB) after enabling large file shares
az storage share create \
  --name myshare \
  --account-name mystorageacct \
  --quota 102400

# Verify large file share setting
az storage account show \
  --name mystorageacct \
  --resource-group myRG \
  --query "largeFileSharesState"
```

> **Exam note:** Once large file shares is enabled it **cannot be disabled**. Enabling it also prevents changing redundancy from LRS/ZRS to GRS/GZRS.

### Storage Redundancy

```bash
# Change storage redundancy (LRS → GRS)
az storage account update \
  --name mystorageacct \
  --resource-group myRG \
  --sku Standard_GRS

# Change to ZRS (zone-redundant — LRS/ZRS compatible with large file shares)
az storage account update \
  --name mystorageacct \
  --resource-group myRG \
  --sku Standard_ZRS

# Change to GZRS (geo-zone-redundant — NOT compatible with large file shares)
az storage account update \
  --name mystorageacct \
  --resource-group myRG \
  --sku Standard_GZRS

# Check current redundancy
az storage account show \
  --name mystorageacct \
  --resource-group myRG \
  --query "sku.name"
```

### Azure File Sync

```bash
# Register the Storage Sync resource provider (one-time per subscription)
az provider register --namespace Microsoft.StorageSync

# Create a Storage Sync Service
az storagesync create \
  --resource-group myRG \
  --name myStorageSyncService \
  --location westeurope

# Create a Sync Group
az storagesync sync-group create \
  --resource-group myRG \
  --storage-sync-service myStorageSyncService \
  --name mySyncGroup

# Create a Cloud Endpoint (links the sync group to an Azure file share)
az storagesync sync-group cloud-endpoint create \
  --resource-group myRG \
  --storage-sync-service myStorageSyncService \
  --sync-group-name mySyncGroup \
  --name myCloudEndpoint \
  --storage-account-resource-id /subscriptions/<sub-id>/resourceGroups/myRG/providers/Microsoft.Storage/storageAccounts/mystorageacct \
  --azure-file-share-name myshare

# List sync groups
az storagesync sync-group list \
  --resource-group myRG \
  --storage-sync-service myStorageSyncService
```

> **Exam note:** Server endpoints are registered by installing the Azure File Sync agent on a Windows Server and registering via portal/PowerShell. Each sync group has exactly **one** cloud endpoint and one or more server endpoints. Cloud tiering can free up local disk space by keeping only frequently accessed files on-premises.

### AzCopy (Companion Tool)

```bash
# Login to AzCopy (interactive — uses Azure AD)
azcopy login

# Login with SAS token (no interactive login needed)
# Append SAS token directly to the URL

# ── Upload ──────────────────────────────────────────────────────────────────

# Copy a single local file to blob
azcopy copy './myfile.txt' \
  'https://mystorageacct.blob.core.windows.net/mycontainer/myfile.txt'

# Upload an entire local folder to blob (recursive)
azcopy copy './local-folder' \
  'https://mystorageacct.blob.core.windows.net/mycontainer/' \
  --recursive

# Upload to Azure Files share
azcopy copy './myfile.txt' \
  'https://mystorageacct.file.core.windows.net/myshare/myfile.txt?<SAS>'

# ── Download ─────────────────────────────────────────────────────────────────

# Download a single blob to local machine
azcopy copy \
  'https://mystorageacct.blob.core.windows.net/mycontainer/myfile.txt' \
  './myfile.txt'

# Download an entire container to local folder
azcopy copy \
  'https://mystorageacct.blob.core.windows.net/mycontainer/*' \
  './local-folder/' \
  --recursive

# ── Sync (only transfers changed/new files) ──────────────────────────────────

# Sync local folder UP to blob (upload new/changed, optionally delete removed)
azcopy sync './local-folder' \
  'https://mystorageacct.blob.core.windows.net/mycontainer' \
  --recursive

# Sync blob DOWN to local (download new/changed files)
azcopy sync \
  'https://mystorageacct.blob.core.windows.net/mycontainer' \
  './local-folder' \
  --recursive

# Sync local to Azure Files
azcopy sync './local-folder' \
  'https://mystorageacct.file.core.windows.net/myshare/?<SAS>' \
  --recursive

# ── Copy between storage accounts (server-side, no local transfer) ───────────

azcopy copy \
  'https://source.blob.core.windows.net/container/?<SAS-src>' \
  'https://dest.blob.core.windows.net/container/?<SAS-dest>' \
  --recursive

# ── Job management ────────────────────────────────────────────────────────────

azcopy jobs list
azcopy jobs show <job-id>
azcopy jobs resume <job-id>
```

> **Exam note — copy vs sync:** `copy` always transfers files regardless of whether destination already has them. `sync` compares source and destination and only transfers differences. Use `sync` for ongoing mirroring; use `copy` for one-time bulk transfers.

---

## 3. Deploy and Manage Azure Compute Resources (20–25%)

### Virtual Machines

```bash
# Create a VM
az vm create \
  --resource-group myRG \
  --name myVM \
  --image Ubuntu2204 \
  --size Standard_B2s \
  --admin-username azureuser \
  --generate-ssh-keys \
  --location westeurope

# Create a Windows VM
az vm create \
  --resource-group myRG \
  --name myWinVM \
  --image Win2022Datacenter \
  --size Standard_D2s_v3 \
  --admin-username azureuser \
  --admin-password "P@ssw0rd1234!"

# List VMs
az vm list --resource-group myRG --output table

# Show VM details
az vm show --resource-group myRG --name myVM --output json

# Start / Stop / Restart / Deallocate
az vm start --resource-group myRG --name myVM
az vm stop --resource-group myRG --name myVM
az vm restart --resource-group myRG --name myVM
az vm deallocate --resource-group myRG --name myVM

# Resize a VM
az vm resize --resource-group myRG --name myVM --size Standard_D4s_v3

# List available VM sizes in a region
az vm list-sizes --location westeurope --output table

# List available VM sizes for resize (current VM)
az vm list-vm-resize-options \
  --resource-group myRG --name myVM --output table

# Open a port on the NSG
az vm open-port --resource-group myRG --name myVM --port 80

# Run a command on a VM
az vm run-command invoke \
  --resource-group myRG \
  --name myVM \
  --command-id RunShellScript \
  --scripts "apt-get update && apt-get install -y nginx"

# Add a data disk
az vm disk attach \
  --resource-group myRG \
  --vm-name myVM \
  --name myDataDisk \
  --size-gb 128 \
  --sku Premium_LRS \
  --new

# Enable boot diagnostics
az vm boot-diagnostics enable \
  --resource-group myRG \
  --name myVM

# Delete a VM
az vm delete --resource-group myRG --name myVM --yes
```

### VM Scale Sets (VMSS)

```bash
# Create a scale set
az vmss create \
  --resource-group myRG \
  --name myScaleSet \
  --image Ubuntu2204 \
  --upgrade-policy-mode Automatic \
  --admin-username azureuser \
  --generate-ssh-keys \
  --instance-count 2 \
  --vm-sku Standard_B2s

# List scale set instances
az vmss list-instances \
  --resource-group myRG \
  --name myScaleSet \
  --output table

# Scale out (increase instance count)
az vmss scale \
  --resource-group myRG \
  --name myScaleSet \
  --new-capacity 5

# Update the scale set image
az vmss update \
  --resource-group myRG \
  --name myScaleSet \
  --set virtualMachineProfile.storageProfile.imageReference.version=latest

# Create autoscale settings
az monitor autoscale create \
  --resource-group myRG \
  --resource myScaleSet \
  --resource-type Microsoft.Compute/virtualMachineScaleSets \
  --min-count 2 \
  --max-count 10 \
  --count 2

# Add a CPU-based autoscale rule
az monitor autoscale rule create \
  --resource-group myRG \
  --autoscale-name myScaleSet \
  --condition "Percentage CPU > 75 avg 5m" \
  --scale out 2
```

### App Service

```bash
# Create an App Service plan
az appservice plan create \
  --name myPlan \
  --resource-group myRG \
  --sku S1 \
  --location westeurope

# Create a web app
az webapp create \
  --name myWebApp \
  --resource-group myRG \
  --plan myPlan \
  --runtime "DOTNET:8.0"

# List web apps
az webapp list --resource-group myRG --output table

# Deploy from a ZIP file
az webapp deploy \
  --resource-group myRG \
  --name myWebApp \
  --src-path ./app.zip

# Configure app settings (environment variables)
az webapp config appsettings set \
  --resource-group myRG \
  --name myWebApp \
  --settings DB_CONNECTION="Server=mydb;Database=app"

# Enable deployment slots
az webapp deployment slot create \
  --name myWebApp \
  --resource-group myRG \
  --slot staging

# Swap slots (staging → production)
az webapp deployment slot swap \
  --name myWebApp \
  --resource-group myRG \
  --slot staging \
  --target-slot production

# Scale up the App Service plan
az appservice plan update \
  --name myPlan \
  --resource-group myRG \
  --sku P1V3

# Scale out (add instances)
az appservice plan update \
  --name myPlan \
  --resource-group myRG \
  --number-of-workers 3

# Enable managed identity (system-assigned)
az webapp identity assign \
  --resource-group myRG \
  --name myWebApp

# Configure custom domain
az webapp config hostname add \
  --webapp-name myWebApp \
  --resource-group myRG \
  --hostname www.contoso.com
```

### VM Snapshots and Managed Disk Images

```bash
# Create a snapshot of an OS disk (VM can be running or deallocated)
az snapshot create \
  --resource-group myRG \
  --name myVMSnapshot \
  --source /subscriptions/<sub-id>/resourceGroups/myRG/providers/Microsoft.Compute/disks/myVM_OsDisk_1 \
  --location westeurope

# List snapshots
az snapshot list --resource-group myRG --output table

# Create a managed disk from a snapshot (for restore)
az disk create \
  --resource-group myRG \
  --name myRestoredDisk \
  --source myVMSnapshot \
  --sku Premium_LRS

# Resize a managed disk (VM must be deallocated first)
az vm deallocate --resource-group myRG --name myVM
az disk update \
  --resource-group myRG \
  --name myDataDisk \
  --size-gb 256

# Generalize a Linux VM before capturing (run on the VM first: sudo waagent -deprovision+user -force)
az vm generalize --resource-group myRG --name myVM

# Create a managed image from a generalized VM
az image create \
  --resource-group myRG \
  --name myVMImage \
  --source myVM \
  --os-type Linux

# Create a new VM from the captured image
az vm create \
  --resource-group myRG \
  --name newVM \
  --image myVMImage \
  --admin-username azureuser \
  --generate-ssh-keys
```

### Custom Script Extension

```bash
# Install Custom Script Extension on a Linux VM
az vm extension set \
  --resource-group myRG \
  --vm-name myVM \
  --name CustomScript \
  --publisher Microsoft.Azure.Extensions \
  --version 2.1 \
  --settings '{
    "fileUris": ["https://mystorageacct.blob.core.windows.net/scripts/install.sh"],
    "commandToExecute": "bash install.sh"
  }'

# Install Custom Script Extension on a Windows VM
az vm extension set \
  --resource-group myRG \
  --vm-name myWinVM \
  --name CustomScriptExtension \
  --publisher Microsoft.Compute \
  --version 1.10 \
  --settings '{
    "fileUris": ["https://mystorageacct.blob.core.windows.net/scripts/setup.ps1"],
    "commandToExecute": "powershell -ExecutionPolicy Unrestricted -File setup.ps1"
  }'

# List VM extensions
az vm extension list \
  --resource-group myRG \
  --vm-name myVM \
  --output table

# Remove a VM extension
az vm extension delete \
  --resource-group myRG \
  --vm-name myVM \
  --name CustomScript
```

### Azure Bastion

```bash
# Step 1: Create the AzureBastionSubnet (must be named exactly 'AzureBastionSubnet', /27 or larger)
az network vnet subnet create \
  --resource-group myRG \
  --vnet-name myVNet \
  --name AzureBastionSubnet \
  --address-prefixes 10.0.254.0/27

# Step 2: Create a Standard SKU public IP for Bastion
az network public-ip create \
  --resource-group myRG \
  --name myBastionIP \
  --sku Standard \
  --allocation-method Static \
  --location westeurope

# Step 3: Create the Bastion host
az network bastion create \
  --resource-group myRG \
  --name myBastionHost \
  --vnet-name myVNet \
  --public-ip-address myBastionIP \
  --location westeurope

# Connect to a Linux VM via Bastion (native client — requires Bastion Standard SKU)
az network bastion ssh \
  --resource-group myRG \
  --name myBastionHost \
  --target-resource-id /subscriptions/<sub-id>/resourceGroups/myRG/providers/Microsoft.Compute/virtualMachines/myVM \
  --auth-type ssh-key \
  --username azureuser \
  --ssh-key ~/.ssh/id_rsa
```

> **Exam note:** Bastion lets you connect to VMs via browser (RDP/SSH) without exposing a public IP on the VM. The VM's NSG does not need inbound RDP/SSH rules from the internet — only from the Bastion subnet.

### Azure Container Instances (ACI)

```bash
# Create a container instance
az container create \
  --resource-group myRG \
  --name myContainer \
  --image mcr.microsoft.com/azuredocs/aci-helloworld \
  --ports 80 \
  --dns-name-label myapp-demo \
  --location westeurope

# Show container details
az container show --resource-group myRG --name myContainer --output table

# View container logs
az container logs --resource-group myRG --name myContainer

# Delete a container
az container delete --resource-group myRG --name myContainer --yes
```

---

## 4. Implement and Manage Virtual Networking (15–20%)

### Virtual Networks and Subnets

```bash
# Create a virtual network
az network vnet create \
  --resource-group myRG \
  --name myVNet \
  --address-prefixes 10.0.0.0/16 \
  --subnet-name default \
  --subnet-prefixes 10.0.1.0/24 \
  --location westeurope

# Add a subnet
az network vnet subnet create \
  --resource-group myRG \
  --vnet-name myVNet \
  --name BackendSubnet \
  --address-prefixes 10.0.2.0/24

# List subnets
az network vnet subnet list \
  --resource-group myRG \
  --vnet-name myVNet \
  --output table

# Update a subnet (associate an NSG)
az network vnet subnet update \
  --resource-group myRG \
  --vnet-name myVNet \
  --name BackendSubnet \
  --network-security-group myNSG

# Delete a subnet
az network vnet subnet delete \
  --resource-group myRG \
  --vnet-name myVNet \
  --name BackendSubnet
```

### Network Security Groups (NSGs)

```bash
# Create an NSG
az network nsg create \
  --resource-group myRG \
  --name myNSG

# Add an inbound rule (allow HTTP)
az network nsg rule create \
  --resource-group myRG \
  --nsg-name myNSG \
  --name AllowHTTP \
  --priority 100 \
  --direction Inbound \
  --access Allow \
  --protocol Tcp \
  --destination-port-ranges 80

# Add an inbound rule (deny all)
az network nsg rule create \
  --resource-group myRG \
  --nsg-name myNSG \
  --name DenyAll \
  --priority 4096 \
  --direction Inbound \
  --access Deny \
  --protocol '*' \
  --destination-port-ranges '*'

# List NSG rules
az network nsg rule list \
  --resource-group myRG \
  --nsg-name myNSG \
  --output table

# Associate NSG with a subnet
az network vnet subnet update \
  --resource-group myRG \
  --vnet-name myVNet \
  --name default \
  --network-security-group myNSG

# Associate NSG with a NIC
az network nic update \
  --resource-group myRG \
  --name myNIC \
  --network-security-group myNSG
```

### Public IP Addresses

```bash
# Create a public IP
az network public-ip create \
  --resource-group myRG \
  --name myPublicIP \
  --sku Standard \
  --allocation-method Static

# List public IPs
az network public-ip list --resource-group myRG --output table

# Show a public IP
az network public-ip show --resource-group myRG --name myPublicIP
```

### VNet Peering

```bash
# Create peering from VNet1 to VNet2
az network vnet peering create \
  --resource-group myRG \
  --name VNet1-to-VNet2 \
  --vnet-name VNet1 \
  --remote-vnet VNet2 \
  --allow-vnet-access

# Create the reverse peering (VNet2 to VNet1)
az network vnet peering create \
  --resource-group myRG \
  --name VNet2-to-VNet1 \
  --vnet-name VNet2 \
  --remote-vnet VNet1 \
  --allow-vnet-access

# List peerings
az network vnet peering list \
  --resource-group myRG \
  --vnet-name VNet1 \
  --output table

# Enable gateway transit on hub VNet peering
az network vnet peering update \
  --resource-group myRG \
  --vnet-name HubVNet \
  --name Hub-to-Spoke \
  --set allowGatewayTransit=true
```

### Azure DNS

```bash
# Create a DNS zone
az network dns zone create \
  --resource-group myRG \
  --name contoso.com

# Add an A record
az network dns record-set a add-record \
  --resource-group myRG \
  --zone-name contoso.com \
  --record-set-name www \
  --ipv4-address 1.2.3.4

# Add a CNAME record
az network dns record-set cname set-record \
  --resource-group myRG \
  --zone-name contoso.com \
  --record-set-name blog \
  --cname blog.contoso.azurewebsites.net

# List DNS records
az network dns record-set list \
  --resource-group myRG \
  --zone-name contoso.com \
  --output table

# Create a private DNS zone
az network private-dns zone create \
  --resource-group myRG \
  --name private.contoso.com

# Link private DNS zone to VNet
az network private-dns link vnet create \
  --resource-group myRG \
  --zone-name private.contoso.com \
  --name myVNetLink \
  --virtual-network myVNet \
  --registration-enabled true
```

### Load Balancer

```bash
# Create a public load balancer
az network lb create \
  --resource-group myRG \
  --name myLoadBalancer \
  --sku Standard \
  --public-ip-address myPublicIP \
  --frontend-ip-name myFrontend \
  --backend-pool-name myBackendPool

# Create a health probe
az network lb probe create \
  --resource-group myRG \
  --lb-name myLoadBalancer \
  --name myHealthProbe \
  --protocol Tcp \
  --port 80

# Create a load balancing rule
az network lb rule create \
  --resource-group myRG \
  --lb-name myLoadBalancer \
  --name myLBRule \
  --protocol Tcp \
  --frontend-port 80 \
  --backend-port 80 \
  --frontend-ip-name myFrontend \
  --backend-pool-name myBackendPool \
  --probe-name myHealthProbe
```

### Application Gateway

```bash
# Create an Application Gateway (basic)
az network application-gateway create \
  --resource-group myRG \
  --name myAppGateway \
  --sku Standard_v2 \
  --capacity 2 \
  --vnet-name myVNet \
  --subnet AGSubnet \
  --public-ip-address myAGPublicIP \
  --frontend-port 80 \
  --http-settings-port 80 \
  --http-settings-protocol Http
```

### VPN Gateway

```bash
# Create a VPN gateway (takes 30–45 mins)
az network vnet-gateway create \
  --resource-group myRG \
  --name myVpnGateway \
  --vnet myVNet \
  --gateway-type Vpn \
  --vpn-type RouteBased \
  --sku VpnGw1 \
  --public-ip-address myGatewayIP \
  --no-wait
```

### User-Defined Routes (Route Tables)

```bash
# Create a route table
az network route-table create \
  --resource-group myRG \
  --name myRouteTable \
  --location westeurope \
  --disable-bgp-route-propagation false

# Add a route — force all internet traffic through a Network Virtual Appliance (NVA)
az network route-table route create \
  --resource-group myRG \
  --route-table-name myRouteTable \
  --name route-to-nva \
  --address-prefix 0.0.0.0/0 \
  --next-hop-type VirtualAppliance \
  --next-hop-ip-address 10.0.1.4

# Route traffic to a specific VNet range through VNet Gateway (for on-premises)
az network route-table route create \
  --resource-group myRG \
  --route-table-name myRouteTable \
  --name route-to-onprem \
  --address-prefix 192.168.0.0/16 \
  --next-hop-type VirtualNetworkGateway

# Associate route table with a subnet
az network vnet subnet update \
  --resource-group myRG \
  --vnet-name myVNet \
  --name mySubnet \
  --route-table myRouteTable

# List routes in a route table
az network route-table route list \
  --resource-group myRG \
  --route-table-name myRouteTable \
  --output table

# Remove route table association from subnet
az network vnet subnet update \
  --resource-group myRG \
  --vnet-name myVNet \
  --name mySubnet \
  --route-table ""
```

> **Exam note — next-hop types:** `VirtualAppliance` (NVA, specify IP), `VirtualNetworkGateway` (on-prem via VPN/ExpressRoute), `VnetLocal` (stay in VNet), `Internet`, `None` (drop traffic).

### Service Endpoints

```bash
# Enable a service endpoint on a subnet (traffic stays on Microsoft backbone)
az network vnet subnet update \
  --resource-group myRG \
  --vnet-name myVNet \
  --name mySubnet \
  --service-endpoints Microsoft.Storage

# Enable multiple service endpoints at once
az network vnet subnet update \
  --resource-group myRG \
  --vnet-name myVNet \
  --name mySubnet \
  --service-endpoints Microsoft.Storage Microsoft.KeyVault Microsoft.Sql

# Restrict a storage account to a specific subnet (used together with service endpoint)
az storage account network-rule add \
  --account-name mystorageacct \
  --resource-group myRG \
  --vnet-name myVNet \
  --subnet mySubnet
az storage account update \
  --name mystorageacct \
  --resource-group myRG \
  --default-action Deny
```

> **Exam note — service endpoint vs private endpoint:** Service endpoints keep traffic on the Microsoft backbone but the storage account still has a public IP. Private endpoints give the resource a private IP in your VNet — traffic never leaves the VNet and the public endpoint can be disabled.

### Private Endpoints

```bash
# Step 1: Disable private endpoint network policies on the subnet
az network vnet subnet update \
  --resource-group myRG \
  --vnet-name myVNet \
  --name mySubnet \
  --disable-private-endpoint-network-policies true

# Step 2: Create the private endpoint (group-id: blob | file | queue | table | sqlServer | etc.)
az network private-endpoint create \
  --resource-group myRG \
  --name myPrivateEndpoint \
  --vnet-name myVNet \
  --subnet mySubnet \
  --private-connection-resource-id /subscriptions/<sub-id>/resourceGroups/myRG/providers/Microsoft.Storage/storageAccounts/mystorageacct \
  --group-id blob \
  --connection-name myStorageConnection \
  --location westeurope

# Step 3: Create a private DNS zone for name resolution
az network private-dns zone create \
  --resource-group myRG \
  --name "privatelink.blob.core.windows.net"

# Step 4: Link the private DNS zone to the VNet
az network private-dns link vnet create \
  --resource-group myRG \
  --zone-name "privatelink.blob.core.windows.net" \
  --name myDNSLink \
  --virtual-network myVNet \
  --registration-enabled false

# Step 5: Create DNS zone group (auto-registers A record when endpoint is created)
az network private-endpoint dns-zone-group create \
  --resource-group myRG \
  --endpoint-name myPrivateEndpoint \
  --name myZoneGroup \
  --private-dns-zone "privatelink.blob.core.windows.net" \
  --zone-name blob

# List private endpoints
az network private-endpoint list --resource-group myRG --output table
```

### Network Watcher

```bash
# Enable Network Watcher in a region (auto-enabled in most cases)
az network watcher configure \
  --resource-group NetworkWatcherRG \
  --locations westeurope \
  --enabled true

# Test VM-to-VM or VM-to-endpoint connectivity
az network watcher test-connectivity \
  --resource-group myRG \
  --source-resource myVM \
  --dest-address 10.0.2.4 \
  --dest-port 443

# Test connectivity to an internet endpoint
az network watcher test-connectivity \
  --resource-group myRG \
  --source-resource myVM \
  --dest-address "www.microsoft.com" \
  --dest-port 443

# Check effective NSG rules on a VM's NIC
az network watcher show-security-group-view \
  --resource-group myRG \
  --vm myVM

# Check effective routes on a VM's NIC
az network watcher show-next-hop \
  --resource-group myRG \
  --vm myVM \
  --source-ip 10.0.1.4 \
  --dest-ip 10.0.2.4

# Enable NSG flow logs (captures allowed/denied traffic)
az network watcher flow-log create \
  --resource-group myRG \
  --name myFlowLog \
  --nsg myNSG \
  --storage-account mystorageacct \
  --enabled true \
  --retention 30

# Troubleshoot a VPN gateway connection
az network watcher troubleshooting start \
  --resource-group myRG \
  --resource-type vnetGateway \
  --resource myVpnGateway \
  --storage-account mystorageacct \
  --storage-path https://mystorageacct.blob.core.windows.net/networkwatcher
```

### NAT Gateway

```bash
# Step 1: Create a public IP for the NAT Gateway
az network public-ip create \
  --resource-group myRG \
  --name myNATGatewayIP \
  --sku Standard \
  --allocation-method Static \
  --location westeurope

# Step 2: Create the NAT Gateway
az network nat gateway create \
  --resource-group myRG \
  --name myNATGateway \
  --public-ip-addresses myNATGatewayIP \
  --idle-timeout 10 \
  --location westeurope

# Step 3: Associate the NAT Gateway with a subnet
az network vnet subnet update \
  --resource-group myRG \
  --vnet-name myVNet \
  --name mySubnet \
  --nat-gateway myNATGateway

# Show NAT gateway details
az network nat gateway show \
  --resource-group myRG \
  --name myNATGateway
```

> **Exam note:** NAT Gateway provides outbound-only internet connectivity for resources in a subnet. It gives a stable, predictable public IP for outbound connections and handles SNAT port exhaustion at scale. All resources in the subnet share the NAT Gateway's public IP(s) for outbound traffic.

---

## 5. Monitor and Maintain Azure Resources (10–15%)

### Azure Monitor

```bash
# List metrics for a VM
az monitor metrics list \
  --resource /subscriptions/<sub-id>/resourceGroups/myRG/providers/Microsoft.Compute/virtualMachines/myVM \
  --metric "Percentage CPU" \
  --interval PT1H

# Create a metric alert
az monitor metrics alert create \
  --resource-group myRG \
  --name "High CPU Alert" \
  --scopes /subscriptions/<sub-id>/resourceGroups/myRG/providers/Microsoft.Compute/virtualMachines/myVM \
  --condition "avg Percentage CPU > 80" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action <action-group-id>

# Create an action group
az monitor action-group create \
  --resource-group myRG \
  --name "OpsTeam" \
  --short-name "ops" \
  --action email ops-email ops@contoso.com
```

### Log Analytics

```bash
# Create a Log Analytics workspace
az monitor log-analytics workspace create \
  --resource-group myRG \
  --workspace-name myWorkspace \
  --location westeurope

# Query logs (KQL)
az monitor log-analytics query \
  --workspace <workspace-id> \
  --analytics-query "Heartbeat | summarize count() by Computer" \
  --output table

# Enable diagnostic settings on a resource
az monitor diagnostic-settings create \
  --name "send-to-law" \
  --resource /subscriptions/<sub-id>/resourceGroups/myRG/providers/Microsoft.Storage/storageAccounts/mystorageacct \
  --workspace <workspace-id> \
  --logs '[{"category":"StorageRead","enabled":true}]'
```

### Azure Backup

```bash
# Create a Recovery Services vault
az backup vault create \
  --resource-group myRG \
  --name myVault \
  --location westeurope

# Enable backup for a VM
az backup protection enable-for-vm \
  --resource-group myRG \
  --vault-name myVault \
  --vm myVM \
  --policy-name DefaultPolicy

# Trigger an on-demand backup
az backup protection backup-now \
  --resource-group myRG \
  --vault-name myVault \
  --container-name myVM \
  --item-name myVM

# List backup items
az backup item list \
  --resource-group myRG \
  --vault-name myVault \
  --output table

# List recovery points
az backup recoverypoint list \
  --resource-group myRG \
  --vault-name myVault \
  --container-name myVM \
  --item-name myVM \
  --output table
```

### Azure Site Recovery

```bash
# Site Recovery uses a Recovery Services vault (same vault type as Backup)
az backup vault create \
  --resource-group myRG \
  --name mySiteRecoveryVault \
  --location westeurope

# Most ASR configuration (replication fabric, policy, protectable items)
# is done via the portal or ARM templates. Key CLI commands:

# List replicated items in a vault
az resource list \
  --resource-group myRG \
  --resource-type "Microsoft.RecoveryServices/vaults" \
  --output table

# Trigger a test failover (via REST — not directly supported in az CLI)
# Use portal or PowerShell for full failover/failback workflows
```

> **Exam concepts for ASR:**
> - **RPO** (Recovery Point Objective): max acceptable data loss (how old can the recovery point be)
> - **RTO** (Recovery Time Objective): max acceptable downtime
> - **Replication policy**: sets RPO threshold and recovery point retention
> - **Test failover**: non-disruptive validation — runs in an isolated VNet, production is unaffected
> - **Planned failover**: graceful failover, no data loss (used when primary is about to go down)
> - **Unplanned failover**: emergency failover when primary is already down, possible data loss

### Resource Management

```bash
# List all resources in a resource group
az resource list --resource-group myRG --output table

# Move resources between resource groups
az resource move \
  --destination-group newRG \
  --ids /subscriptions/<sub-id>/resourceGroups/myRG/providers/Microsoft.Compute/virtualMachines/myVM

# Export a resource group template (ARM)
az group export --name myRG > template.json

# Deploy an ARM template
az deployment group create \
  --resource-group myRG \
  --template-file template.json \
  --parameters @parameters.json

# What-if deployment (preview changes)
az deployment group what-if \
  --resource-group myRG \
  --template-file template.json

# Delete a resource group (and everything in it)
az group delete --name myRG --yes --no-wait
```

---

## Quick Reference: Common Patterns

```bash
# Output formats
--output table    # Human-readable table
--output json     # Full JSON (default)
--output tsv      # Tab-separated (for scripting)
--output yaml     # YAML format

# Query/filter with JMESPath
az vm list --query "[?location=='westeurope'].{Name:name, Size:hardwareProfile.vmSize}" --output table

# Get resource IDs
az vm show --resource-group myRG --name myVM --query id --output tsv

# Use --no-wait for long-running operations
az vm create ... --no-wait

# Use --debug for troubleshooting
az vm create ... --debug
```
