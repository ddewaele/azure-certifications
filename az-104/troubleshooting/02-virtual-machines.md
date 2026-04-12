# Troubleshooting: Virtual Machines

Covers Windows VM RDP issues, Linux VM SSH issues, boot failures, disk problems, extensions, and performance.

---

## Cannot Connect — Windows VM (RDP)

RDP uses **TCP port 3389**. Any of these layers can block it:

```
Your machine → Internet → Azure NSG → Azure VM NIC NSG → Windows Firewall → RDP Service
```

### Diagnostic Checklist (in order)

1. **Check VM status** — portal > VM > Overview: must show "Running" not "Stopped (deallocated)"
2. **Verify public IP** — if no public IP is assigned, the Connect button is greyed out
3. **Check NSG rules** — must have Inbound Allow TCP 3389 from your source IP (or * for testing)
4. **Check effective NSG rules** — portal > VM > Networking > "Effective security rules" — shows combined NIC + subnet NSGs
5. **Review boot diagnostics** — portal > VM > Boot diagnostics — screenshot shows the current console state
6. **Check Resource Health** — portal > VM > Resource health — shows Azure platform issues
7. **Reset RDP configuration** — portal > VM > Reset password > "Reset configuration only" — fixes disabled Remote Desktop, corrupt RDP listener
8. **Reset password** — if credentials are wrong or forgotten
9. **Restart the VM** — fixes transient OS issues
10. **Redeploy the VM** — moves VM to a new Azure host; fixes underlying platform/network issues (ephemeral disk data is lost, dynamic IP may change)

### Common RDP Error Messages

| Error Message | Most Likely Cause | Fix |
|--------------|-------------------|-----|
| "Remote Desktop can't connect" | NSG blocking port 3389, or RDP service stopped | Check NSG; reset RDP config via portal |
| "An authentication error has occurred" | NLA (Network Level Authentication) mismatch, or expired credentials | Reset password via portal; disable NLA if needed |
| "Your credentials did not work" | Wrong password or account locked | Reset password via portal |
| "Remote session disconnected — no license servers" | RD Licensing not configured (Terminal Services) | Reconfigure or remove RD Licensing role |
| Connect button greyed out | VM has no public IP and no VPN/ExpressRoute | Assign a public IP or use Azure Bastion |
| "This computer can't connect to the remote computer" | RDP service not running, or firewall blocking | Reset RDP configuration; check Windows Firewall inside VM |

### Sign-in with Entra ID Credentials (Azure AD Login)

When a Windows VM has the **AADLoginForWindows** extension installed, users sign in with Entra ID credentials. Common errors:

| Error | Cause | Fix |
|-------|-------|-----|
| "No Azure roles assigned" | User lacks VM Administrator Login or VM User Login role on the VM | Assign one of the VM login roles to the user |
| "Unauthorized client" | Device not Entra ID joined or registered | Ensure client machine is Entra joined / registered |
| "MFA sign-in method required" | CA policy requires MFA for VM login | User must complete MFA challenge |

---

## Cannot Connect — Linux VM (SSH)

SSH uses **TCP port 22**. Troubleshoot layer by layer:

```
Your machine → Internet → Azure NSG → VM NIC NSG → Linux Firewall (iptables/firewalld) → SSH Daemon (sshd)
```

### Diagnostic Checklist (in order)

1. **Verify VM is running** — portal shows "Running"
2. **Check NSG rules** — Inbound Allow TCP 22 must exist
3. **Test with another protocol** — can you reach the VM on port 80 (if web server is installed)? Helps isolate if it's network or SSH-specific
4. **SSH key permissions** — if using key-based auth, check local permissions:
   - `chmod 700 ~/.ssh`
   - `chmod 600 ~/.ssh/id_rsa`
   - `chmod 644 ~/.ssh/id_rsa.pub`
5. **Reset SSH configuration** — portal > VM > Reset password > "Reset SSH configuration" — restarts sshd with default settings
6. **Reset password** — reset the local admin password via the VMAccess extension
7. **Check serial console** — portal > VM > Serial console — see OS-level output without needing SSH
8. **Redeploy the VM** — last resort platform fix

### Common SSH Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| `Connection refused` | sshd not running, or NSG blocking port 22 | Check NSG; reset SSH config from portal |
| `Connection timed out` | NSG blocking, or wrong IP/hostname | Verify NSG allows TCP 22; check public IP |
| `Permission denied (publickey)` | Wrong private key, or wrong username | Verify key matches the authorized_keys on VM; check username (e.g. "azureuser" not "root") |
| `WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED` | VM was redeployed and host key changed | Remove old entry from ~/.ssh/known_hosts |
| `ssh_exchange_identification: read: Connection reset by peer` | sshd crashed or misconfigured | Reset SSH configuration via portal |

### Linux-Specific Boot / SSH Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| VM boots but SSH unreachable after kernel update | New kernel broke Hyper-V drivers | Boot to older kernel via serial console; use `grub` rescue |
| fstab error causes boot failure | Bad fstab entry (wrong UUID, missing `nofail` for non-critical disks) | Attach disk to a repair VM; fix fstab; re-attach |
| SELinux misconfiguration blocking SSH | SELinux policy change | Use serial console to set `SELINUX=permissive` temporarily in /etc/selinux/config |

---

## VM Not Booting

### Windows Boot Issues

| Boot Error | Cause | Fix |
|-----------|-------|-----|
| `Check Disk` / CHKDSK loop | File system corruption | Usually resolves itself; if not, attach disk to repair VM |
| BitLocker boot error | BitLocker key not available | Provide BitLocker recovery key, or suspend BitLocker before resizing/moving |
| Blue Screen of Death (BSOD) | Driver issue, corrupted system files | Check boot diagnostics screenshot; may need serial console access |
| "Boot configuration update failed" | Windows Update corrupted BCD | Repair BCD via offline tools or serial console |
| VM stuck at "Please wait..." | Windows Update installing | Wait; check boot diagnostics for progress |

### Linux Boot Issues

| Boot Error | Cause | Fix |
|-----------|-------|-----|
| GRUB rescue prompt | Missing/corrupted GRUB config | Attach OS disk to repair VM; reinstall GRUB |
| Kernel panic | Bad kernel module, missing initrd | Boot to older kernel; use serial console |
| fstab error — drops to emergency shell | Invalid /etc/fstab entry | Edit fstab via serial console (`journalctl -xb` to see error); add `nofail` to non-critical mount entries |
| UEFI boot failure | Firmware/EFI bootloader issue | Azure Linux VM UEFI troubleshooter |

**Using boot diagnostics (both Windows and Linux):**
- Enable: portal > VM > Boot diagnostics > Enable with managed storage account
- View: portal > VM > Boot diagnostics > Screenshot and serial log
- Serial console: portal > VM > Serial console — live interactive access independent of networking

---

## Disk and Storage Issues

### Managed Disk Problems

| Issue | Cause | Fix |
|-------|-------|-----|
| Cannot resize a managed disk | VM must be stopped (deallocated) to resize OS or data disk | Deallocate VM first, then resize |
| Cannot change disk SKU (LRS → ZRS) | Disk type changes require detach/reattach or snapshot+recreate | Create snapshot → new disk from snapshot with target SKU → swap |
| "Disk is already attached to a VM" when trying to attach | Disk was not properly detached from previous VM | Detach from old VM first, or use Force detach in portal |
| Disk IOPS throttling | VM size IOPS cap reached | Upgrade VM size, or upgrade disk to Premium SSD / Ultra Disk |
| Temporary disk (D: on Windows, /dev/sdb on Linux) data lost | Temp disk is ephemeral — data does NOT survive deallocate/redeploy | Never store persistent data on the temporary disk |

> **Exam note:** The **temporary disk** is local to the physical host. It is lost on **deallocation** (but NOT on restart). It is not included in VM backups. On Windows it is typically D:, on Linux /dev/sdb mounted at /mnt.

### Disk Encryption

| Issue | Cause | Fix |
|-------|-------|-----|
| Azure Disk Encryption (ADE) fails | VM size doesn't support ADE, or Key Vault not in same region | Check VM size compatibility; Key Vault must be in the same region |
| VM unresponsive after enabling ADE | Encryption in progress — do not force-stop | Wait for encryption to complete (can take hours for large disks) |
| Cannot extend encrypted volume | Must decrypt, extend, re-encrypt | Or use SSE with CMK which handles extension transparently |

---

## VM Extensions

Extensions run inside the VM as a privileged process. They require the VM agent to be running.

### Extension Failures

| Issue | Cause | Fix |
|-------|-------|-----|
| Extension stuck in "Transitioning" state | VM agent not running, or extension handler crashed | Check VM agent status: portal > VM > Extensions + applications > verify agent status |
| Custom Script Extension fails | Script error, wrong fileUri, or storage account not accessible | Check extension logs: Windows: `C:\WindowsAzure\Logs\Plugins\Microsoft.Compute.CustomScriptExtension`, Linux: `/var/log/azure/custom-script` |
| Extension times out | Script takes too long (CSE timeout is 90 minutes) | Refactor script to be faster; use `--no-wait` and check later |
| "Provisioning failed" on extension | Storage account for script is behind a firewall | Add the VM's subnet to the storage account network rules |
| Windows VM agent shows "Not Ready" | Agent corrupted or service stopped | Reinstall VM agent: `msiexec.exe /i WindowsAzureVmAgent.msi` |

**How to check extension logs:**
- **Windows CSE:** `C:\WindowsAzure\Logs\Plugins\Microsoft.Compute.CustomScriptExtension\<version>\`
- **Linux CSE:** `/var/log/azure/custom-script/handler.log`
- **Via CLI:** `az vm extension show --resource-group myRG --vm-name myVM --name CustomScript`

---

## VM Performance Issues

### High CPU

**Symptoms:** VM unresponsive, slow, RDP/SSH works but apps are sluggish

| Cause | How to Identify | Fix |
|-------|----------------|-----|
| Runaway process inside the VM | Task Manager (Windows) / `top` or `htop` (Linux) | Kill or fix the process |
| VM size too small for workload | Metrics > CPU% consistently > 80% | Resize VM to larger SKU |
| CPU credits exhausted (burstable B-series) | Metrics > CPU Credits Remaining reaching 0 | Switch from B-series to non-burstable D/E series |
| Azure host issue | CPU high but no process inside VM is responsible | Run PerfInsights; use Resource Health to check platform |

**Diagnostic tools:**
- Portal: **Performance diagnostics** extension (PerfInsights) — captures detailed CPU, memory, disk, network snapshots
- **Azure Monitor Metrics** — VM > Metrics > Percentage CPU
- **az vm run-command** — run diagnostic commands inside VM without SSH/RDP

### High Memory / Disk

| Issue | Cause | Fix |
|-------|-------|-----|
| Disk IOPS throttling | Disk throughput limit reached | Check Metrics > Disk Read/Write IOPS; upgrade disk tier |
| OS disk full | Application logs filling disk | Clean up logs; expand disk; add data disk for overflow |
| Memory pressure | Application memory leak or undersized VM | Increase VM size; check for memory leaks in application |

---

## Quick Reference: VM Troubleshooting Decision Tree

```
Can't connect to Windows VM (RDP)?
  ├─ VM Running? No → Start VM
  ├─ Public IP assigned? No → Assign IP or use Bastion
  ├─ NSG allows TCP 3389? No → Add inbound NSG rule
  ├─ Boot diagnostics show error? → Fix boot issue
  └─ Try: Reset RDP config → Reset password → Restart → Redeploy

Can't connect to Linux VM (SSH)?
  ├─ VM Running? No → Start VM
  ├─ NSG allows TCP 22? No → Add inbound NSG rule
  ├─ Key permissions correct? No → chmod 600 ~/.ssh/id_rsa
  ├─ Serial console shows error? → Fix OS-level issue
  └─ Try: Reset SSH config → Reset password → Redeploy

VM not booting?
  ├─ Check boot diagnostics screenshot in portal
  ├─ Use serial console for interactive access
  └─ Windows: BitLocker/CHKDSK | Linux: fstab/GRUB/kernel panic
```
