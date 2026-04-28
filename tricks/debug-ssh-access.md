# Debugging: Cannot SSH into a VM

Checklist for diagnosing and fixing SSH access to an Azure VM, including recovering when you're locked out.

---

## Variables

```bash
RG=rg-vnet-peering
VM=vm-hub
VNET=vnet-hub
SUBNET=subnet1
NSG=vm-hubNSG
USER=azureuser
YOUR_IP=1.2.3.4   # your local machine's public IP (used for IP Flow Verify)
```

---

## Step 1: Verify the VM is running

```bash
az vm show -g $RG -n $VM --query "powerState" -d -o tsv
# Expected: VM running
```

---

## Step 2: Check the NSG rules

An NSG blocks SSH if:
- It has no inbound allow rule for port 22, **or**
- It is not associated with the subnet or NIC at all (no NSG = no restriction, but verify this is actually the case)

```bash
# Which NSG is on the subnet?
az network vnet subnet show -g $RG --vnet-name $VNET -n $SUBNET --query networkSecurityGroup.id -o tsv

# Which NSG is on the NIC?
NIC_ID=$(az vm show -g $RG -n $VM --query "networkProfile.networkInterfaces[0].id" -o tsv)
az network nic show --ids $NIC_ID --query networkSecurityGroup.id -o tsv

# List inbound rules on the NSG
az network nsg rule list -g $RG --nsg-name $NSG \
  --query "[?direction=='Inbound']" -o table
```

If no allow rule for port 22 exists, add one:

```bash
az network nsg rule create \
  --nsg-name $NSG \
  --resource-group $RG \
  --name Allow-SSH \
  --priority 300 \
  --direction Inbound \
  --access Allow \
  --protocol Tcp \
  --destination-port-range 22
```

> **Note:** Evaluation order matters. Azure processes NSG rules by priority (lowest number first) and stops at the first match. A `DenyAllInbound` rule at priority 65500 is always last — your allow rule just needs a lower priority number.

---

## Step 3: Use IP Flow Verify to confirm whether NSG allows the traffic

IP Flow Verify tests whether a specific flow would be allowed or denied by the effective NSG rules, without needing to actually make the connection.

```bash
az network watcher test-ip-flow \
  --vm $VM \
  --direction Inbound \
  --protocol TCP \
  --local-port 22 \
  --remote-address $YOUR_IP \
  --remote-port '*' \
  --resource-group $RG
```

Returns `Allow` or `Deny` and names the NSG rule responsible.

> Network Watcher must be enabled in the region. It usually is by default but you can verify:
> ```bash
> az network watcher list -o table
> ```

---

## Step 4: Fix a missing or wrong SSH public key (without SSH access)

You're locked out — the VM is up, the NSG is open, but you can't authenticate. Use one of these recovery methods.

### Option A: VMAccess extension (easiest)

The VMAccess extension was designed for exactly this. It resets the authorized_keys file for the user without touching anything else.

```bash
az vm user update \
  --resource-group $RG \
  --name $VM \
  --username $USER \
  --ssh-key-value "$(cat ~/.ssh/id_rsa.pub)"
```

This overwrites `~/.ssh/authorized_keys` with your public key and fixes permissions. Takes ~30 seconds.

To reset to a specific key string:

```bash
az vm user update \
  --resource-group $RG \
  --name $VM \
  --username $USER \
  --ssh-key-value "ssh-rsa AAAAB3NzaC1yc2E... user@host"
```

---

### Option B: Run Command (inject key without replacing the file)

If you want to append rather than overwrite (e.g., you have multiple keys), use Run Command to execute a script on the VM directly — no SSH needed.

```bash
PUB_KEY=$(cat ~/.ssh/id_rsa.pub)

az vm run-command invoke \
  --resource-group $RG \
  --name $VM \
  --command-id RunShellScript \
  --scripts "
    mkdir -p /home/$USER/.ssh
    chmod 700 /home/$USER/.ssh
    echo '$PUB_KEY' >> /home/$USER/.ssh/authorized_keys
    chmod 600 /home/$USER/.ssh/authorized_keys
    chown -R $USER:$USER /home/$USER/.ssh
  "
```

Run Command runs as root on the VM, so it can write to any user's home directory.

> Run Command also lets you inspect the current authorized_keys:
> ```bash
> az vm run-command invoke -g $RG -n $VM \
>   --command-id RunShellScript \
>   --scripts "cat /home/$USER/.ssh/authorized_keys; stat /home/$USER/.ssh"
> ```

---

### Option C: Serial Console (last resort, no network required)

If the NSG rules or networking are completely broken, Serial Console bypasses all of that — it connects directly to the VM's serial port via the Azure portal.

1. Go to **VM → Help → Serial Console** in the portal
2. Log in with the VM's password (or use the password reset extension first if you don't know it)
3. Fix the authorized_keys file manually:

```bash
# Inside the serial console
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "ssh-rsa AAAAB3NzaC1yc2E... user@host" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Serial Console requires **Boot diagnostics** to be enabled on the VM (it is by default for most gallery images).

---

## Common permission mistakes that break SSH even with the right key

SSH is strict about file permissions. If the key is in place but auth still fails:

```bash
# Inspect permissions via Run Command
az vm run-command invoke -g $RG -n $VM \
  --command-id RunShellScript \
  --scripts "
    ls -la /home/$USER/
    ls -la /home/$USER/.ssh/
    stat /home/$USER/.ssh/authorized_keys 2>/dev/null || echo 'file missing'
  "
```

Required permissions:

| Path | Owner | Permissions |
|------|-------|-------------|
| `/home/$USER` | `$USER` | `755` (not group/world writable) |
| `/home/$USER/.ssh` | `$USER` | `700` |
| `/home/$USER/.ssh/authorized_keys` | `$USER` | `600` |

Fix all at once:

```bash
az vm run-command invoke -g $RG -n $VM \
  --command-id RunShellScript \
  --scripts "
    chown -R $USER:$USER /home/$USER/.ssh
    chmod 700 /home/$USER/.ssh
    chmod 600 /home/$USER/.ssh/authorized_keys
  "
```

---

## Quick checklist

```
[ ] VM is in "running" power state
[ ] NSG has inbound allow rule for TCP port 22
[ ] NSG is attached to subnet or NIC (not floating unattached)
[ ] IP Flow Verify returns Allow for your source IP → port 22
[ ] Public key is in ~/.ssh/authorized_keys
[ ] ~/.ssh is 700, authorized_keys is 600, both owned by the user
[ ] SSH daemon is running: sudo systemctl status sshd
```
