# Lab 01 — VM Lifecycle

**Concepts covered:** IaaS, VM states and billing, deallocated vs stopped, vertical scaling (resize), disk snapshots, SSH access

**Estimated cost:** ~$0.05–0.20 (delete everything at the end)

---

## Setup

```bash
RESOURCE_GROUP="az900-lab01-rg"
LOCATION="westeurope"
VM_NAME="lab01-vm"

az group create --name $RESOURCE_GROUP --location $LOCATION
```

---

## Prerequisites — Register Resource Providers

On a new subscription, Azure resource providers may not be registered yet. Run this once before starting the labs to avoid `MissingSubscriptionRegistration` errors:

```bash
for ns in Microsoft.Network Microsoft.Compute Microsoft.Storage; do
  az provider register --namespace $ns
done
```

Check they're registered (takes ~1 min):
```bash
az provider show --namespace Microsoft.Network --query registrationState -o tsv
az provider show --namespace Microsoft.Compute --query registrationState -o tsv
```

Both should output `Registered`. See [troubleshooting guide](../../troubleshooting/missing-subscription-registration.md) if you get this error mid-lab.

---

## Step 1 — Create a VM

Create a small Ubuntu VM using a burstable B-series SKU (cheap for learning):

```bash
az vm create \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME \
  --image Ubuntu2204 \
  --size Standard_B1s \
  --admin-username azureuser \
  --generate-ssh-keys \
  --output table
```

`--generate-ssh-keys` creates `~/.ssh/id_rsa` and `~/.ssh/id_rsa.pub` if they don't already exist and uploads the public key to the VM.

Note the `publicIpAddress` in the output.

---

## Step 2 — SSH into the VM

```bash
PUBLIC_IP=$(az vm show \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME \
  --show-details \
  --query publicIps \
  --output tsv)

ssh azureuser@$PUBLIC_IP
```

Once inside, explore the machine:
```bash
uname -a
df -h
free -m
exit
```

This is IaaS — you have full OS access. Notice you're responsible for everything running inside.

---

## Step 3 — VM States and Billing

This is one of the most important billing concepts for the exam.

### OS-level stop (still billed!)
```bash
# Stop the OS (equivalent to shutting down the OS from inside)
az vm stop --resource-group $RESOURCE_GROUP --name $VM_NAME

# Check the power state
az vm get-instance-view \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME \
  --query "instanceView.statuses[1]" \
  --output table
```

State will be: **PowerState/stopped** — the VM is off but Azure still holds the hardware for you. **You are still being charged for compute.**

### Deallocate (stops billing)
```bash
# Deallocate — release the hardware
az vm deallocate --resource-group $RESOURCE_GROUP --name $VM_NAME

# Check the power state again
az vm get-instance-view \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME \
  --query instanceView.statuses[1] \
  --output table
```

State will be: **PowerState/deallocated** — hardware released. **No compute charges.**

> **Key takeaway:** Always use `deallocate` instead of `stop` unless you specifically need to keep the hardware allocated. The portal "Stop" button deallocates by default.

### Start the VM again
```bash
az vm start --resource-group $RESOURCE_GROUP --name $VM_NAME
```

---

## Step 4 — Resize the VM (Vertical Scaling)

Vertical scaling = changing the VM size (more CPU/memory). Requires a deallocated VM.

```bash
# See available sizes in this region
az vm list-vm-resize-options \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME \
  --output table

# Deallocate first
az vm deallocate --resource-group $RESOURCE_GROUP --name $VM_NAME

# Resize to B2s (2 vCPUs, 4 GB RAM)
az vm resize \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME \
  --size Standard_B2s

# Start the resized VM
az vm start --resource-group $RESOURCE_GROUP --name $VM_NAME

# Verify the new size
az vm show \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME \
  --query hardwareProfile.vmSize \
  --output tsv
```

---

## Step 5 — Disk Snapshot

Snapshots capture the state of a managed disk at a point in time. Used for backups and creating images.

```bash
# Get the OS disk ID
DISK_ID=$(az vm show \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME \
  --query storageProfile.osDisk.managedDisk.id \
  --output tsv)

# Create a snapshot
az snapshot create \
  --resource-group $RESOURCE_GROUP \
  --name lab01-snapshot \
  --source $DISK_ID

# List snapshots
az snapshot list --resource-group $RESOURCE_GROUP --output table
```

---

## Step 6 — View VM Metadata and Monitoring

```bash
# Show full VM details
az vm show --resource-group $RESOURCE_GROUP --name $VM_NAME

# List running VMs in the resource group
az vm list \
  --resource-group $RESOURCE_GROUP \
  --show-details \
  --output table

# View available metrics
az monitor metrics list-definitions \
  --resource $(az vm show -g $RESOURCE_GROUP -n $VM_NAME --query id -o tsv) \
  --query "[].name.value" \
  --output table
```

---

## Step 7 — Open a Port (NSG Rule)

By default, SSH (port 22) is open but other ports are blocked. Open port 80:

```bash
az vm open-port \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME \
  --port 80

# View the NSG rules
NSG_NAME=$(az network nsg list \
  --resource-group $RESOURCE_GROUP \
  --query "[0].name" --output tsv)

az network nsg rule list \
  --resource-group $RESOURCE_GROUP \
  --nsg-name $NSG_NAME \
  --output table
```

---

## Cleanup

```bash
az group delete --name $RESOURCE_GROUP --yes --no-wait
```

This deletes the VM, disks, networking, snapshot, and resource group in one command.

---

## What You Learned

- How to create a VM and connect via SSH (IaaS — full OS access)
- The difference between `stop` and `deallocate` and why it matters for billing
- How to vertically scale a VM (resize)
- How to take a disk snapshot for backup/restore
- How NSGs control network access to your VM
