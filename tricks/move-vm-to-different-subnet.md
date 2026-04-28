# Move a VM to a Different Subnet

In Azure, a VM's network attachment lives on its NIC, not the VM itself. Moving a VM to a different subnet means updating the NIC's IP configuration to point at the new subnet.

---

## Variables

```bash
RG=rg-vnet-peering
VM=vm-hub
VNET=vnet-hub
OLD_SUBNET=subnet1
NEW_SUBNET=subnet2
```

---

## Scenario 1: Same VNet, different subnet (most common)

No deallocation required. The change takes effect immediately but causes a brief network interruption as the NIC is re-attached.

**Step 1 — get the NIC name and current IP config:**

```bash
NIC_ID=$(az vm show -g $RG -n $VM --query "networkProfile.networkInterfaces[0].id" -o tsv)
NIC_NAME=$(basename $NIC_ID)

# Inspect the current IP configuration
az network nic ip-config list --nic-name $NIC_NAME -g $RG -o table
```

**Step 2 — update the subnet:**

```bash
az network nic ip-config update \
  --resource-group $RG \
  --nic-name $NIC_NAME \
  --name ipconfig1 \
  --subnet $NEW_SUBNET \
  --vnet-name $VNET
```

**Step 3 — verify:**

```bash
az network nic ip-config show \
  --resource-group $RG \
  --nic-name $NIC_NAME \
  --name ipconfig1 \
  --query "{subnet: subnet.id, privateIP: privateIPAddress, allocationMethod: privateIPAllocationMethod}" \
  -o json
```

---

## Static IP considerations

If the NIC uses a **static private IP**, that IP must fall within the new subnet's address range. If it doesn't, the update will fail.

```bash
# Check the current allocation method and IP
az network nic ip-config show \
  --resource-group $RG \
  --nic-name $NIC_NAME \
  --name ipconfig1 \
  --query "{ip: privateIPAddress, method: privateIPAllocationMethod}" \
  -o json
```

If it's static and the IP is outside the new subnet range, switch to dynamic first, move, then set a new static IP:

```bash
# Switch to dynamic
az network nic ip-config update \
  -g $RG --nic-name $NIC_NAME --name ipconfig1 \
  --private-ip-address-version IPv4 \
  --set privateIPAllocationMethod=Dynamic

# Move to new subnet
az network nic ip-config update \
  -g $RG --nic-name $NIC_NAME --name ipconfig1 \
  --subnet $NEW_SUBNET --vnet-name $VNET

# Assign a new static IP in the new subnet's range
az network nic ip-config update \
  -g $RG --nic-name $NIC_NAME --name ipconfig1 \
  --private-ip-address 10.2.0.10
```

---

## Scenario 2: Different VNet

NICs cannot be moved between VNets. The NIC is created in a VNet at provisioning time and stays there. To move a VM to a different VNet you have two options.

### Option A: Swap the NIC (VM keeps its disks and config)

Deallocate the VM, swap the NIC for a new one in the target VNet, restart.

```bash
NEW_VNET=vnet-spoke
NEW_SUBNET_ID=$(az network vnet subnet show -g $RG --vnet-name $NEW_VNET -n $NEW_SUBNET --query id -o tsv)

# Create a new NIC in the target VNet/subnet
az network nic create \
  --resource-group $RG \
  --name ${NIC_NAME}-new \
  --vnet-name $NEW_VNET \
  --subnet $NEW_SUBNET

NEW_NIC_ID=$(az network nic show -g $RG -n ${NIC_NAME}-new --query id -o tsv)

# Deallocate the VM
az vm deallocate -g $RG -n $VM

# Remove old NIC and attach new one
az vm nic remove -g $RG --vm-name $VM --nics $NIC_NAME
az vm nic add    -g $RG --vm-name $VM --nics ${NIC_NAME}-new --primary-nic ${NIC_NAME}-new

# Start the VM
az vm start -g $RG -n $VM
```

### Option B: Rebuild from disk snapshot (cleaner, no downtime risk)

Create a snapshot of the OS disk and deploy a new VM from it in the target VNet. The original VM stays running until you're ready to cut over.

```bash
NEW_VNET=vnet-spoke

# Get the OS disk name
DISK_NAME=$(az vm show -g $RG -n $VM --query "storageProfile.osDisk.name" -o tsv)

# Snapshot the OS disk (VM can be running)
az snapshot create \
  --resource-group $RG \
  --name snap-$VM \
  --source $DISK_NAME

# Create a new managed disk from the snapshot
SNAP_ID=$(az snapshot show -g $RG -n snap-$VM --query id -o tsv)
az disk create \
  --resource-group $RG \
  --name disk-$VM-new \
  --source $SNAP_ID

# Create a new VM from the disk in the target VNet
az vm create \
  --resource-group $RG \
  --name ${VM}-new \
  --attach-os-disk disk-$VM-new \
  --os-type Linux \
  --vnet-name $NEW_VNET \
  --subnet $NEW_SUBNET \
  --nsg ""
```

---

## Things to check after moving

The new subnet may have different security and routing rules. Verify these before assuming connectivity is the same:

```bash
# NSG on the new subnet
az network vnet subnet show -g $RG --vnet-name $VNET -n $NEW_SUBNET --query networkSecurityGroup

# UDR (route table) on the new subnet
az network vnet subnet show -g $RG --vnet-name $VNET -n $NEW_SUBNET --query routeTable

# Effective routes on the NIC after the move
az network nic show-effective-route-table --ids $NIC_ID -o table

# Effective NSG rules on the NIC after the move
az network nic list-effective-nsg --ids $NIC_ID -o table
```
