# Hybrid Azure Lab Setup — Full Recap

## Overview

This document recaps the full journey of building a hybrid Active Directory + Azure lab environment from scratch on an Apple Silicon Mac (M3). The goal is to replicate a real-world hybrid identity and Azure File Sync architecture — an on-premises domain controller, domain-joined clients, Entra Connect for identity sync, and Azure File Sync for file synchronization.

If you've never touched a Windows Server before, this guide walks you through every click and command.

---

## The Target Architecture

Based on Microsoft's Azure File Sync reference diagram, the target environment includes:

**On-premises (virtualized on Mac):**
- Domain Controller with DNS
- Azure AD Connect (Entra Connect) sync server
- Windows file servers with Azure File Sync agent
- Domain-joined client machines

**Azure side:**
- Entra ID tenant
- Azure File Shares
- Storage Sync Service

---

## Phase 1: Planning the Virtualization Approach

### Hardware Considerations

The lab runs entirely on an **Apple M3 Mac**, which is ARM-based. This introduces compatibility considerations since most Windows Server evaluation ISOs are x86/x64.

**Minimum host requirements:**
- 16 GB RAM (32 GB ideal for running 4-5 VMs simultaneously)
- SSD storage (multiple VMs on a spinning disk is impractical)
- Modern CPU with virtualization support

### Hypervisor Selection

| Option | Pros | Cons |
|--------|------|------|
| **Parallels** (chosen) | Best ARM performance on Mac, polished UX | Paid (~€100/year) |
| VMware Fusion | Free personal license | Slightly less polished on ARM |
| UTM | Free, open source | Slower, less mature |

**Decision:** Parallels was selected for best Apple Silicon performance.

### ARM Compatibility Notes

- **Windows Server 2025** has an ARM evaluation available — this is key for running on M3
- **AD DS, DNS, domain join** — all work fine on ARM
- **Entra Connect** — works on ARM Windows Server
- **Azure File Sync agent** — ARM support is still evolving; needs verification before installing

### ⚠️ Finding the Windows Server ARM ISO

This was one of the trickiest parts of the setup. Microsoft does not make the **Windows Server ARM ISO** easy to find. Unlike the x64 evaluation ISOs (which are prominently listed on the Evaluation Center), the ARM version is not directly linked or clearly advertised.

**What we ended up doing:** Found an older Windows Server ARM ISO on the **Internet Archive** (archive.org). This worked fine for our purposes — AD DS, DNS, and domain operations all functioned correctly on the older build.

**Tips if you're looking for it:**
- Search the Internet Archive for "Windows Server ARM64" or "Windows Server 2025 ARM"
- Microsoft Insider Preview channels sometimes have ARM builds, but availability varies
- The Windows 11 ARM ISO is much easier to find — Parallels can even download it automatically
- Don't confuse the x64 ISO with the ARM64 ISO — the x64 version will **not boot** on an M-series Mac

### Licensing — No Cost for Labbing

No licenses are needed. Microsoft provides free evaluation versions:

- **Windows Server Evaluation:** Free 180-day trial from Microsoft's Evaluation Center. Fully functional with no feature restrictions. Available for Server 2019, 2022, and 2025. No product key is needed during setup.
- **Windows 10/11 Enterprise Evaluation:** Free 90-day trial, also from the Evaluation Center.
- **Azure side:** Free-tier Entra ID + minimal storage costs (under €5/month).

**What happens when the eval expires?** The server starts shutting down every hour, but for a lab, 180 days is more than enough. You can rebuild the VM with a fresh eval ISO at any time — your Azure-side resources remain intact.

**Where to download:** Search for "Windows Server 2025 evaluation download" on Microsoft's website. You can choose between an ISO (for manual install) or a VHD (pre-built virtual disk that you attach to a new VM and boot — skips the installation process entirely).

---

## Phase 2: Domain Controller Setup (EC-HUB01)

### VM Configuration

| Setting | Value |
|---------|-------|
| VM Name | EC-HUB01 |
| OS | Windows Server 2025 Standard (ARM Eval) |
| RAM | 2 GB |
| Role | Domain Controller + DNS |
| IP Address | 10.211.55.5 |
| Domain | ecommit.lab |

### ⚠️ Issue: Network Adapter Not Working Out of the Box

After installing Windows Server from the ARM ISO, the **network adapter (NIC) did not work**. The VM had no network connectivity — no IP address, no internet, nothing. Device Manager showed the Ethernet adapter with a warning icon, indicating a driver problem.

**Cause:** The ARM version of Windows Server doesn't include drivers for Parallels' virtual network adapter by default. Without these drivers, the VM can't see or use the network card.

**Fix: Install Parallels Tools**

Parallels Tools is a package of drivers and utilities specifically designed for VMs running inside Parallels. It includes the network adapter driver, display driver, and other integration features. Here's how to install it:

1. With the Windows Server VM running, look at the **Parallels menu bar** at the top of your Mac screen
2. Click **Actions** → **Install Parallels Tools**
   - This mounts a virtual CD/DVD inside the VM containing the Parallels Tools installer
   - If it doesn't auto-mount, you may see a notification in the VM asking you to run the installer
3. Inside the VM, open **File Explorer** (the folder icon on the taskbar)
4. In the left sidebar, click **This PC** (or "My Computer")
5. You should see a CD/DVD drive labeled something like **"Parallels Tools"** — double-click it
6. Run the installer (usually `PTAgent.exe` or a setup executable)
7. Follow the installation wizard — accept defaults
8. The VM will ask you to **reboot** after installation

After rebooting, the network adapter should work immediately. You can verify by opening Command Prompt and running:

```
ipconfig
```

You should now see an Ethernet adapter with an IP address (e.g., `10.211.55.5`).

**Important:** Install Parallels Tools on **every Windows VM** you create in this lab — not just the DC. Each VM needs the drivers for its virtual network adapter to function.

### Step-by-Step: Installing Active Directory Domain Services (AD DS)

AD DS is what turns a regular Windows Server into a Domain Controller — the central authority that manages users, computers, and security policies for your network.

#### Opening Server Manager

When Windows Server boots for the first time, **Server Manager** opens automatically. This is the main dashboard for managing your server. If it doesn't open, you can find it by:

1. Click the **Start button** (Windows icon in the bottom-left corner of the taskbar, or bottom-center on Server 2025)
2. Type `Server Manager` and click on it

#### Adding the AD DS Role

1. In Server Manager, look at the top-right area and click **Manage** → **Add Roles and Features**
2. A wizard opens. Click **Next** on the "Before you begin" page
3. **Installation type:** Select "Role-based or feature-based installation" → click **Next**
4. **Server selection:** Your server (EC-HUB01) should be highlighted → click **Next**
5. **Server roles:** Scroll down and check the box next to **Active Directory Domain Services**
   - A popup appears asking to add required features — click **Add Features**
   - Click **Next**
6. **Features page:** Leave defaults → click **Next**
7. **AD DS page:** Read the info → click **Next**
8. **Confirmation:** Click **Install**
9. Wait for the installation to complete (a few minutes)

#### Promoting to a Domain Controller

Installing the role is only half the job. You now need to "promote" this server to be a Domain Controller:

1. After installation completes, you'll see a yellow warning triangle with a flag icon in the top menu bar of Server Manager. Click on it.
2. Click **"Promote this server to a domain controller"**
3. **Deployment configuration:**
   - Select **"Add a new forest"** (since this is the first domain controller in your lab)
   - **Root domain name:** Enter `ecommit.lab` (or whatever domain name you choose)
   - Click **Next**
4. **Domain Controller Options:**
   - **Forest functional level:** Leave as default (Windows Server 2016 or higher)
   - **Domain functional level:** Leave as default
   - Check **Domain Name System (DNS) server** — this installs DNS automatically
   - Check **Global Catalog (GC)**
   - **DSRM Password:** Enter a strong password and remember it. This is a recovery password used if Active Directory breaks — it's separate from the Administrator password.
   - Click **Next**
5. **DNS Options:** You may see a delegation warning — ignore it for a lab. Click **Next**
6. **Additional Options:** The NetBIOS name auto-fills (e.g., `ECOMMIT`). Leave it. Click **Next**
7. **Paths:** Leave the default paths for the AD database, log files, and SYSVOL. Click **Next**
8. **Review:** Look over your choices. Click **Next**
9. **Prerequisites Check:** Wait for it to run. Warnings are normal. As long as you see the green checkmark with "All prerequisite checks passed," click **Install**
10. The server will **automatically reboot** after promotion

#### After Reboot: The "Applying computer settings" Hang

After the promotion reboot, the server may hang on the **"Applying computer settings"** screen. This shows a spinning circle of dots on a black screen with that text.

**This is normal.** The server is processing Group Policy for the first time as a domain controller. On a VM running through ARM translation on an M3 Mac, this can take 10-15 minutes.

**What to do:** Wait at least 15 minutes. If it still hasn't progressed, force-reboot the VM from Parallels (click the Parallels menu → Actions → Reset). The second boot typically completes normally.

#### Verifying AD DS is Healthy

After the server boots, log in. The login screen now shows `ECOMMIT\Administrator` instead of just `Administrator` — this confirms you're logging into the domain.

Server Manager should show:
- **AD DS** in the left sidebar with a green status icon
- **DNS** in the left sidebar with a green status icon

To verify further, open PowerShell (right-click the Start button → **Windows Terminal (Admin)** or **PowerShell**) and run:

```powershell
# Shows your domain details (name, domain controllers, etc.)
Get-ADDomain

# Shows the forest details
Get-ADForest

# Runs a health check on the domain controller
dcdiag /s:localhost
```

You can also open **Active Directory Administrative Center** to see a graphical view:
1. In Server Manager, click **Tools** (top-right menu) → **Active Directory Administrative Center**
2. You should see your domain (`ecommit (local)`) in the left panel
3. Click **Domain Controllers** — you should see EC-HUB01 listed

---

## Phase 3: Windows 11 Client Setup (WINDOWS11BYOD)

### VM Configuration

| Setting | Value |
|---------|-------|
| VM Name | WINDOWS11BYOD |
| OS | Windows 11 (ARM) |
| RAM | 2 GB |
| IP Address | 10.211.55.3 (DHCP) |
| Local User | davydewaele |

### Creating the VM in Parallels

1. Open Parallels Desktop
2. Click **File → New** (or the + button)
3. Select the Windows 11 ARM ISO or let Parallels download it automatically
4. Follow the setup wizard — create a local account during Windows 11 setup
5. After installation, Windows 11 boots to the desktop

### Testing Network Connectivity

Before doing anything else, confirm the two VMs can talk to each other.

#### Opening Command Prompt

1. Click the **Start button** (Windows icon on the taskbar)
2. Type `cmd` and click on **Command Prompt** (the black icon with `C:\` on it)
3. A black window appears — this is the Command Prompt where you type commands

#### Running a Ping Test

In the Command Prompt, type:

```
ping 10.211.55.5
```

Press **Enter**. You should see four replies like:

```
Reply from 10.211.55.5: bytes=32 time<1ms TTL=128
Reply from 10.211.55.5: bytes=32 time<1ms TTL=128
Reply from 10.211.55.5: bytes=32 time<1ms TTL=128
Reply from 10.211.55.5: bytes=32 time<1ms TTL=128
```

This confirms the Windows 11 VM can reach the Domain Controller. Do the same from the DC back to the client (`ping 10.211.55.3`).

**If ping fails:** Both VMs need to be on the same Parallels virtual network. Check Parallels → VM settings → Hardware → Network → make sure both use "Shared Network" or the same custom network.

### Issue: Network Discovery Not Showing the Server

When opening **File Explorer** (the folder icon on the taskbar) → **Network** (in the left sidebar), the Windows 11 VM only showed the Mac host — not the domain controller.

**Cause:** Windows Server disables Network Discovery by default for security. The services responsible for announcing the server on the network are stopped.

#### Step-by-Step: Enabling Network Discovery on the Server (EC-HUB01)

**Part A: Enable Network Discovery in sharing settings**

1. On the Server, click the **Start button** and type `Control Panel` → open it
2. Click **Network and Sharing Center** (if you don't see it, change "View by" in the top-right corner to "Large icons")
3. In the left sidebar, click **Change advanced sharing settings**
4. Under your current network profile (usually "Domain"), find these settings and turn them on:
   - **Turn on network discovery**
   - **Turn on file and printer sharing**
5. Click **Save changes**

**Part B: Start the required services**

Network Discovery depends on several Windows services that are disabled by default on Server editions.

1. Press **Win + R** on the keyboard (hold the Windows key and press R). This opens the "Run" dialog box — a small window where you can type commands.
2. Type `services.msc` and press **Enter**. This opens the Services management console — a long list of all background services running on Windows.
3. For each of the following services, you need to start them and set them to start automatically:
   - **Function Discovery Resource Publication**
   - **Function Discovery Provider Host**
   - **SSDP Discovery**
   - **UPnP Device Host**

   For each one:
   - Scroll through the list to find the service name
   - **Double-click** the service to open its properties
   - Change **Startup type** from "Disabled" or "Manual" to **Automatic**
   - Click the **Start** button (if the service isn't already running)
   - Click **OK**

4. After starting all four services, go back to the Windows 11 VM and refresh the Network view in File Explorer. The server should now appear.

**Note:** For the purpose of this lab, Network Discovery was deprioritized since domain join (which doesn't require Network Discovery) was the actual next step.

---

## Phase 4: DNS Configuration (Critical Step)

### Why DNS Matters

Active Directory **depends entirely on DNS** to function. When a computer joins a domain, it asks DNS "where is the domain controller for ecommit.lab?" If DNS doesn't know, the domain join fails. This is the #1 cause of domain join problems.

### Issue: nslookup Fails for ecommit.lab

`nslookup` is a command-line tool that asks a DNS server to resolve a name. It's the go-to tool for diagnosing DNS problems.

```
C:\> nslookup ecommit.lab
Server:  prl-local-ns-server.shared
*** prl-local-ns-server.shared can't find ecommit.lab: Non-existent domain
```

This failed because the DNS server it queried (`prl-local-ns-server.shared`) is Parallels' built-in DNS — which knows nothing about our private `ecommit.lab` domain.

```
C:\> nslookup ecommit.lab 10.211.55.5
Server:  windows-server-2025.shared
Name:    ecommit.lab
Address: 10.211.55.5
```

When explicitly telling nslookup to use the DC (10.211.55.5), it works. So the DC's DNS is fine — the client is just asking the wrong server.

### Diagnosing with ipconfig /all

To see which DNS servers your machine is using, run `ipconfig /all` in Command Prompt. This shows detailed network adapter information.

The output revealed:

```
DNS Servers . . . : fe80::21c:42ff:fe00:18%11    ← Parallels IPv6 DNS (queried FIRST)
                    10.211.55.5                    ← DC DNS (queried second)
```

The Parallels IPv6 DNS was listed first, so Windows always asked it before trying the DC.

### Fix: Setting DNS Manually on the Windows 11 VM

Instead of letting Parallels assign DNS automatically, we set it manually to point to our DC.

#### Step-by-Step: Changing DNS Settings

1. Click the **Start button** → type `Settings` → open it
2. In the left sidebar, click **Network & internet**
3. Click **Ethernet** (your network connection)
4. Scroll down to find **DNS server assignment** → click **Edit**
5. Change the dropdown from "Automatic (DHCP)" to **Manual**
6. Toggle **IPv4** to **On**
7. Fill in:
   - **Preferred DNS:** `10.211.55.5` (your domain controller's IP)
   - **Alternate DNS:** `8.8.8.8` (Google's public DNS, for internet resolution)
   - Leave "DNS over HTTPS" as **Off** for both
8. Toggle **IPv6** to **Off**
9. Click **Save**

### Issue: IPv6 DNS Persisting Despite Being Disabled

Even after setting IPv4 DNS manually and toggling IPv6 off in Settings, the Parallels IPv6 DNS (`fe80::21c:42ff:fe00:18`) kept appearing when running `ipconfig /all`. The Windows 11 Settings app showed IPv6 DNS as "Off" but the setting wasn't taking effect.

**Lesson learned:** The modern Windows 11 Settings app doesn't always reliably apply network changes. The classic Control Panel is more dependable.

#### Step-by-Step: Disabling IPv6 via Control Panel

The Control Panel is the older (but more reliable) settings interface in Windows. Here's how to access it and disable IPv6 on the network adapter:

1. Click the **Start button** → type `Control Panel` → open it
2. If you see categories (like "Network and Internet"), change the top-right **"View by"** dropdown to **Large icons** — this shows all options in a flat list
3. Click **Network and Sharing Center**
4. In the left sidebar, click **Change adapter settings** — this opens a window showing all your network adapters
5. **Right-click** on **Ethernet** (your main network adapter) → click **Properties**
6. A window opens with a list of items with checkboxes. Find **Internet Protocol Version 6 (TCP/IPv6)**
7. **Uncheck** the box next to it
8. Click **OK**

**Alternative: PowerShell method (faster if you're comfortable with the command line):**

Open PowerShell as Administrator (right-click Start button → "Windows Terminal (Admin)") and run:

```powershell
Disable-NetAdapterBinding -Name "Ethernet" -ComponentID ms_tcpip6
```

#### Verifying the Fix

After disabling IPv6, flush the DNS cache and verify:

```
ipconfig /flushdns
```

This clears any cached DNS results so fresh lookups happen. Then check your configuration:

```
ipconfig /all
```

The DNS Servers line should now show only `10.211.55.5` (and `8.8.8.8` as alternate). No more IPv6 DNS entries.

Finally, test DNS resolution:

```
nslookup ecommit.lab
```

This time it should resolve using your DC without needing to specify the server:

```
Server:  windows-server-2025.shared
Address: 10.211.55.5

Name:    ecommit.lab
Address: 10.211.55.5
```

---

## Phase 5: Joining the Domain

### What "Joining a Domain" Means

When a computer joins a domain, it registers itself with the Domain Controller and becomes a managed member of the network. This means:
- Domain users can log into this computer
- The DC can push security policies (Group Policy) to it
- It appears in Active Directory as a computer object

### Step-by-Step: Joining WINDOWS11BYOD to ecommit.lab

1. On the Windows 11 VM, click the **Start button** → open **Settings**
2. In the left sidebar, click **System**
3. Scroll down and click **About**
4. Look for **"Domain or workgroup"** and click the link that says **"Rename this PC (advanced)"** or **"Domain or workgroup settings"**
5. A "System Properties" window opens. Under the "Computer Name" tab, click **Change...**
6. In the "Member of" section, select **Domain** (instead of Workgroup)
7. Type `ecommit.lab` in the domain field
8. Click **OK**

**Alternative: PowerShell method (one command):**

```powershell
Add-Computer -DomainName "ecommit.lab" -Credential (Get-Credential) -Restart
```

A credential box pops up — enter `ecommit.lab\Administrator` and the password. The machine reboots automatically.

#### Authentication Prompt

A credentials dialog appears:

- **User name:** `Administrator`
- **Password:** The password you set when you promoted the DC to a domain controller (during the AD DS promotion wizard)
- **Domain name:** `ECOMMIT.LAB` (may auto-fill)

Click **Next** or **OK**.

#### "Windows cannot find an account for your computer" Screen

After authenticating, you may see a screen that says *"Windows cannot find an account for your computer in the ECOMMIT.LAB domain."*

**This is not an error.** It means no computer account was pre-created (pre-staged) in Active Directory for this machine. Fill in:

- **Computer name:** `WINDOWS11BYOD` (or whatever you want to name this machine)
- **Computer domain:** `ECOMMIT.LAB`

Click **Next**. The Domain Administrator account has permission to create computer accounts automatically.

#### Enable Domain User Account Prompt

Next, you'll be asked: *"Do you want to enable a domain user account on this computer?"*

Select **"Add the following domain user account"** and leave it as:
- **User name:** `Administrator`
- **User domain:** `ECOMMIT.LAB`

Click **Next**.

#### Choose Account Type

You'll be asked what level of access to grant `ECOMMIT.LAB\Administrator`:

- **Standard account** — limited privileges, can use most software but can't make system-wide changes
- **Administrator** — full control over the machine, can install software and change any setting

Select **Administrator** — this is a lab environment, so you want full control.

Click **Next**.

#### Reboot

You'll be prompted to restart. Click **Restart Now**. The domain join isn't complete until the machine reboots.

### Verifying the Domain Join

#### On the Windows 11 VM (WINDOWS11BYOD):

1. After reboot, on the login screen, look for **"Other user"** in the bottom-left corner and click it
2. Enter:
   - **Username:** `ecommit.lab\Administrator`
   - **Password:** The DC administrator password
3. Press Enter
4. The first login as a domain user will show **"Preparing your desktop"** — this is normal, Windows is creating a local profile for this domain account

#### On the Domain Controller (EC-HUB01):

Verify the computer appeared in Active Directory:

1. Open **PowerShell** and run:

```powershell
Get-ADComputer -Filter * | Select Name
```

You should see `WINDOWS11BYOD` listed alongside `EC-HUB01`.

Or use the GUI:
1. In Server Manager, click **Tools** → **Active Directory Users and Computers**
2. Expand **ecommit.lab** → click **Computers**
3. You should see WINDOWS11BYOD listed as a computer object

---

## Phase 6: Creating Domain Users

### Why Create Domain Users?

Right now, the only account that can log into domain-joined machines is the built-in `Administrator` account. In a real environment, you'd never have users logging in as Administrator. You create individual user accounts so each person has their own identity, and you can control what they can access.

### Step-by-Step: Creating Users via PowerShell

On the Domain Controller (EC-HUB01), open **PowerShell** as Administrator:

1. Right-click the **Start button**
2. Click **Windows Terminal (Admin)** or **Windows PowerShell (Admin)**

First, create an Organizational Unit (OU) — this is like a folder in Active Directory for organizing users:

```powershell
New-ADOrganizationalUnit -Name "ECommit Users" -Path "DC=ecommit,DC=lab"
```

Then create user accounts:

```powershell
# Create a user named "Davy Dewaele"
New-ADUser -Name "Davy Dewaele" `
  -SamAccountName "davy" `
  -UserPrincipalName "davy@ecommit.lab" `
  -Path "OU=ECommit Users,DC=ecommit,DC=lab" `
  -AccountPassword (ConvertTo-SecureString "P@ssw0rd123!" -AsPlainText -Force) `
  -Enabled $true

# Create a test user
New-ADUser -Name "Test User" `
  -SamAccountName "testuser" `
  -UserPrincipalName "testuser@ecommit.lab" `
  -Path "OU=ECommit Users,DC=ecommit,DC=lab" `
  -AccountPassword (ConvertTo-SecureString "P@ssw0rd123!" -AsPlainText -Force) `
  -Enabled $true
```

**What each parameter means:**
- `-Name` — The display name (what appears in Active Directory)
- `-SamAccountName` — The short login name (used as `ecommit\davy`)
- `-UserPrincipalName` — The email-style login (used as `davy@ecommit.lab`)
- `-Path` — Which OU to create the user in
- `-AccountPassword` — Sets the initial password
- `-Enabled $true` — Activates the account immediately (by default, new accounts are disabled)

### Step-by-Step: Creating Users via GUI

If you prefer clicking through a graphical interface:

1. On the DC, open **Server Manager** → **Tools** → **Active Directory Users and Computers**
2. In the left panel, expand **ecommit.lab**
3. Right-click **ecommit.lab** → **New** → **Organizational Unit** → name it "ECommit Users" → click **OK**
4. Click on the new **ECommit Users** OU
5. Right-click in the right panel → **New** → **User**
6. Fill in the name fields (First name, Last name, User logon name) → click **Next**
7. Enter a password, uncheck "User must change password at next logon" (for lab convenience) → click **Next** → **Finish**

### Testing Domain Login with the New User

1. On WINDOWS11BYOD, **sign out** of the current session:
   - Click the **Start button** → click your profile icon (or name) at the bottom → click **Sign out**
2. On the lock screen, click **Other user** in the bottom-left corner
3. Enter:
   - **Username:** `ecommit.lab\davy`
   - **Password:** `P@ssw0rd123!`
4. Press **Enter**

You should see "Preparing your desktop" as Windows creates a new profile for this domain user. This confirms the on-premises identity is working.

---

## Current State

| Component | Status | Details |
|-----------|--------|---------|
| EC-HUB01 (DC) | ✅ Running | Windows Server 2025, AD DS + DNS, ecommit.lab domain |
| WINDOWS11BYOD (Client) | ✅ Domain-joined | Windows 11, joined to ecommit.lab |
| Network | ✅ Working | 10.211.55.0/24, ping + DNS resolution confirmed |
| Domain Users | ⏳ Next step | Need to create OU structure and user accounts |
| SYNC01 (Entra Connect) | ⏳ Not started | New VM needed for hybrid identity sync |
| File Server(s) | ⏳ Not started | New VM(s) needed for Azure File Sync |
| Azure Tenant | ⏳ Not connected | Entra ID + Storage Account + File Shares needed |

---

## Lessons Learned

1. **The Windows Server ARM ISO is hard to find.** Microsoft doesn't prominently list it. We sourced ours from the Internet Archive. Don't confuse x64 and ARM64 ISOs — x64 won't boot on Apple Silicon.

2. **Parallels Tools must be installed for networking to work.** The ARM version of Windows Server doesn't include Parallels' virtual NIC driver out of the box. Without Parallels Tools, the VM has no network adapter. Install it on every VM immediately after OS installation.

3. **DNS is everything in Active Directory.** If domain join fails, DNS misconfiguration is the first thing to check. The client must use the DC as its primary DNS server.

2. **Parallels injects its own DNS.** On Parallels VMs, the hypervisor's DNS resolver takes priority over manually configured DNS — especially via IPv6. Disabling IPv6 on the adapter is the cleanest fix for a lab.

3. **ARM compatibility is viable but requires awareness.** Windows Server 2025 ARM evaluation works for AD DS, DNS, and domain operations. Some agents (like Azure File Sync) may need verification.

4. **"Applying computer settings" hangs are normal after DC promotion.** Especially on VMs with ARM translation overhead. Give it 10-15 minutes before force-rebooting.

5. **Windows Settings app vs Control Panel.** The modern Windows 11 Settings app doesn't always reliably apply network changes (IPv6 DNS toggle). The classic Control Panel and PowerShell are more reliable for network adapter configuration.

6. **No licenses needed for labbing.** Microsoft's free evaluation ISOs (180 days for Server, 90 days for Windows 11) provide fully functional environments at zero cost.

7. **The "cannot find an account for your computer" message during domain join is not an error.** It just means no computer account was pre-staged. The Domain Administrator can create it on the fly.

---

## Glossary

| Term | What It Means |
|------|--------------|
| **AD DS** | Active Directory Domain Services — the role that makes a Windows Server into a Domain Controller |
| **Domain Controller (DC)** | The server that manages authentication and authorization for all users and computers in the domain |
| **DNS** | Domain Name System — translates names (like `ecommit.lab`) into IP addresses. AD cannot function without it. |
| **Domain** | A logical group of computers and users managed centrally by a Domain Controller (e.g., `ecommit.lab`) |
| **Forest** | The top-level container in Active Directory. A forest can contain one or more domains. |
| **OU (Organizational Unit)** | A folder-like container inside Active Directory used to organize users, computers, and groups |
| **Group Policy** | Rules and settings that the DC pushes to domain-joined computers (e.g., password policies, software restrictions) |
| **Domain Join** | The process of registering a computer as a member of a domain so it's managed by the DC |
| **DSRM** | Directory Services Restore Mode — a recovery mode for when Active Directory is broken. Uses a separate password set during DC promotion. |
| **Global Catalog** | A DC that holds a partial copy of all objects in the forest — used for cross-domain searches |
| **Entra ID** | Microsoft's cloud identity service (formerly Azure AD). Entra Connect syncs on-prem AD users to Entra ID. |
| **nslookup** | A command-line tool to test DNS resolution — tells you which DNS server is being used and whether it can resolve a name |
| **ipconfig** | A command-line tool to view your network adapter configuration (IP address, DNS servers, gateway, etc.) |
| **ipconfig /flushdns** | Clears the local DNS cache so that new lookups are made fresh instead of using stale cached results |
| **ipconfig /all** | Shows full details for every network adapter — IP address, subnet mask, gateway, DNS servers, DHCP lease, MAC address |
| **Server Manager** | The main dashboard on Windows Server for managing roles, features, and server settings |
| **Control Panel** | The classic settings interface in Windows — more reliable than the modern Settings app for advanced network configurations |
| **services.msc** | Opens the Services management console — shows all background services and lets you start, stop, or configure them |
| **PowerShell** | A command-line shell and scripting language built into Windows, more powerful than Command Prompt |
| **Command Prompt (cmd)** | The basic command-line interface in Windows — type commands and see text output. Opened by typing `cmd` in the Start menu. |
| **SMB** | Server Message Block — the protocol Windows uses for file sharing over a network |
| **DHCP** | Dynamic Host Configuration Protocol — automatically assigns IP addresses to devices on a network. Parallels runs its own DHCP server for VMs. |
| **IPv4** | Internet Protocol version 4 — the standard addressing system (e.g., 10.211.55.5). Used by most networks today. |
| **IPv6** | Internet Protocol version 6 — the newer addressing system with longer addresses (e.g., fe80::21c:42ff:fe00:18). Can cause DNS conflicts in lab environments. |
| **Network Adapter** | The virtual or physical hardware that connects a computer to a network. In a VM, Parallels creates a virtual adapter. |
| **Win + R** | A keyboard shortcut — hold the Windows key and press R — that opens the "Run" dialog box for quickly launching programs |
| **Right-click** | Press the right mouse button (or two-finger click on a Mac trackpad) to open a context menu with additional options |

---

## Next Steps

1. **Create domain users and OUs** on EC-HUB01
2. **Test domain login** on WINDOWS11BYOD with a regular user account
3. **Deploy SYNC01 VM** — domain-join it and install Entra Connect
4. **Configure Entra Connect** to sync on-prem identities to Azure Entra ID
5. **Deploy file server VM(s)** — create shares, install Azure File Sync agent
6. **Set up Azure resources** — Storage Account, File Shares, Storage Sync Service
7. **Test end-to-end sync** — files syncing between on-prem servers and Azure
