# Lab 04: Deploy and Configure Virtual Machines

## Overview

Deploy a Windows and Linux virtual machine, configure availability options, attach a managed data disk, connect securely using Azure Bastion, and explore VM extensions. This lab covers the core VM administration tasks in AZ-104 Domain 3.

### Learning Objectives

- Deploy a Linux VM using Azure CLI
- Deploy a Windows VM using the Azure portal
- Configure an Availability Set
- Attach and initialise a managed data disk
- Deploy Azure Bastion and connect without a public IP
- Apply a VM extension (Custom Script)

## Prerequisites

- Azure subscription with Contributor role
- Azure CLI installed or use Azure Cloud Shell
- SSH key pair (or generate during the lab)

---

## Steps

### 1. Create the Foundation

```bash
# Variables
RG="rg-vm-lab"
LOCATION="eastus"

# Create resource group
az group create --name $RG --location $LOCATION

# Create a VNet and subnet for VMs
az network vnet create \
  --name vnet-lab \
  --resource-group $RG \
  --address-prefix 10.0.0.0/16 \
  --subnet-name subnet-vms \
  --subnet-prefix 10.0.1.0/24

# Create an Availability Set (2 fault domains, 2 update domains)
az vm availability-set create \
  --name avset-lab \
  --resource-group $RG \
  --platform-fault-domain-count 2 \
  --platform-update-domain-count 2
```

---

### 2. Deploy a Linux VM

```bash
# Generate SSH key if needed
ssh-keygen -t rsa -b 4096 -f ~/.ssh/az104_lab -N ""

# Deploy Ubuntu VM in the Availability Set (no public IP)
az vm create \
  --name vm-linux01 \
  --resource-group $RG \
  --image Ubuntu2204 \
  --size Standard_B2s \
  --admin-username azureuser \
  --ssh-key-values ~/.ssh/az104_lab.pub \
  --vnet-name vnet-lab \
  --subnet subnet-vms \
  --availability-set avset-lab \
  --public-ip-address "" \
  --nsg "" \
  --os-disk-size-gb 30 \
  --storage-sku Premium_LRS

# Deploy a second VM in the same Availability Set
az vm create \
  --name vm-linux02 \
  --resource-group $RG \
  --image Ubuntu2204 \
  --size Standard_B2s \
  --admin-username azureuser \
  --ssh-key-values ~/.ssh/az104_lab.pub \
  --vnet-name vnet-lab \
  --subnet subnet-vms \
  --availability-set avset-lab \
  --public-ip-address "" \
  --nsg "" \
  --storage-sku Premium_LRS

echo "VMs deployed"
```

**Explore:**
- Navigate to `avset-lab` in the portal → view **Fault domain** and **Update domain** assignments
- The two VMs should be in different fault domains

---

### 3. Attach and Initialise a Data Disk

#### Attach Disk (CLI)

```bash
# Create and attach a 64 GB Premium SSD data disk to vm-linux01
az vm disk attach \
  --vm-name vm-linux01 \
  --resource-group $RG \
  --name disk-data-01 \
  --size-gb 64 \
  --sku Premium_LRS \
  --new
```

#### Initialise the Disk (via Bastion — see step 5, or use run-command)

```bash
# Use VM run-command to initialise the disk without SSH access
az vm run-command invoke \
  --name vm-linux01 \
  --resource-group $RG \
  --command-id RunShellScript \
  --scripts "
    DISK=\$(lsblk -o NAME,TYPE -n | awk '\$2==\"disk\" && \$1!=\"sda\" {print \$1}' | head -1)
    echo 'Found disk: '\$DISK
    sudo parted /dev/\$DISK --script mklabel gpt mkpart primary ext4 0% 100%
    sudo mkfs.ext4 /dev/\${DISK}1
    sudo mkdir -p /data
    sudo mount /dev/\${DISK}1 /data
    echo '/dev/'\${DISK}'1 /data ext4 defaults,nofail 0 2' | sudo tee -a /etc/fstab
    df -h /data
  "
```

**Explore:**
- Navigate to `vm-linux01` → **Disks** blade in the portal
- Verify `disk-data-01` appears as a data disk attached to the VM
- Note the LUN (logical unit number) assigned to the disk

---

### 4. Deploy Windows VM (Portal)

1. Navigate to **Virtual machines** → **Create** → **Azure virtual machine**
2. Configure **Basics**:
   - **Resource group**: rg-vm-lab
   - **VM name**: vm-win01
   - **Region**: East US
   - **Availability options**: No infrastructure redundancy (for this standalone Windows VM)
   - **Image**: Windows Server 2022 Datacenter
   - **Size**: Standard_B2ms
   - **Username**: azureuser
   - **Password**: set a strong password
   - **Public inbound ports**: None (we will use Bastion)
3. Configure **Disks**:
   - **OS disk type**: Standard SSD
4. Configure **Networking**:
   - **Virtual network**: vnet-lab
   - **Subnet**: subnet-vms
   - **Public IP**: None
5. Click **Review + create** → **Create**

---

### 5. Deploy Azure Bastion and Connect to VMs

#### Create Bastion Subnet (required before Bastion deployment)

```bash
# Add the AzureBastionSubnet to the VNet (/26 minimum)
az network vnet subnet create \
  --name AzureBastionSubnet \
  --resource-group $RG \
  --vnet-name vnet-lab \
  --address-prefix 10.0.255.0/26

# Create a Standard public IP for Bastion
az network public-ip create \
  --name pip-bastion \
  --resource-group $RG \
  --sku Standard \
  --allocation-method Static

# Deploy Azure Bastion (Basic SKU, ~5-10 minutes to provision)
az network bastion create \
  --name bastion-lab \
  --resource-group $RG \
  --vnet-name vnet-lab \
  --public-ip-address pip-bastion \
  --sku Basic
```

#### Connect to Linux VM via Bastion (Portal)

1. Navigate to `vm-linux01` → **Connect** → **Bastion**
2. Enter:
   - **Authentication type**: SSH Private Key from Local File
   - **Username**: azureuser
   - **SSH private key**: upload `~/.ssh/az104_lab`
3. Click **Connect** — a browser-based SSH terminal opens

**Explore:**
- From the SSH session: `df -h /data` — should show the attached data disk mounted
- `lsblk` — view block device layout
- `sudo apt update` — verify internet connectivity via Azure NAT gateway

#### Connect to Windows VM via Bastion (Portal)

1. Navigate to `vm-win01` → **Connect** → **Bastion**
2. Enter username and password
3. Click **Connect** — a browser-based RDP session opens

---

### 6. Apply a VM Extension

```bash
# Apply the Custom Script Extension to vm-linux01
# This installs nginx and starts the web server
az vm extension set \
  --vm-name vm-linux01 \
  --resource-group $RG \
  --name customScript \
  --publisher Microsoft.Azure.Extensions \
  --settings '{"commandToExecute": "apt-get update && apt-get install -y nginx && systemctl start nginx && systemctl enable nginx"}'

# Check extension status
az vm extension list \
  --vm-name vm-linux01 \
  --resource-group $RG \
  --output table
```

**Explore:**
- Navigate to `vm-linux01` → **Extensions + applications** in the portal
- Verify `customScript` shows as "Provisioning succeeded"

---

### 7. Resize a VM

```bash
# Check available sizes in the region
az vm list-vm-resize-options \
  --name vm-linux01 \
  --resource-group $RG \
  --output table | head -20

# Resize the VM (requires deallocating first for some size families)
az vm resize \
  --name vm-linux01 \
  --resource-group $RG \
  --size Standard_B2ms
```

**Note:** Resizing within the same VM family usually does not require deallocation. Changing VM family (e.g., B-series to D-series) requires a stop/deallocate.

---

## Cleanup

```bash
az group delete --name $RG --yes --no-wait
echo "Resource group deletion initiated (includes VMs, disks, Bastion, VNet)"
```

---

## Key Takeaways

| Topic | Key Point |
|-------|-----------|
| Availability Sets | VMs spread across fault domains (FD) and update domains (UD); same datacenter |
| Managed disks | Azure handles placement; attach/detach without storage account management |
| Azure Bastion | Requires `AzureBastionSubnet` (/26+); no public IP on VMs; Standard public IP required |
| VM extensions | Run scripts, configure DSC, install agents post-deployment |
| VM sizing | Premium SSD required for 99.95% SLA in Availability Sets |
| Resize | Same-family resize may not require deallocation; cross-family usually does |

## References

- [Azure Virtual Machines documentation](https://learn.microsoft.com/en-us/azure/virtual-machines/)
- [Availability sets](https://learn.microsoft.com/en-us/azure/virtual-machines/availability-set-overview)
- [Managed disks](https://learn.microsoft.com/en-us/azure/virtual-machines/managed-disks-overview)
- [Azure Bastion](https://learn.microsoft.com/en-us/azure/bastion/bastion-overview)
- [VM extensions](https://learn.microsoft.com/en-us/azure/virtual-machines/extensions/overview)
