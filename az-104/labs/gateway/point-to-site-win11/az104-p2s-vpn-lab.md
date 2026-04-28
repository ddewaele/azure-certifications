# Lab: Azure Point-to-Site VPN with IKEv2 (Basic SKU)

## Overview

This lab walks through setting up a Point-to-Site (P2S) VPN connection from an on-premises Windows 11 machine to an Azure Virtual Network using IKEv2 with certificate authentication on the Basic VPN Gateway SKU.

**What you'll build:** A single Windows 11 machine connects to your Azure VNet over an encrypted IKEv2 tunnel. Once connected, the machine gets a private IP from a pool you define and can reach resources on the Azure VNet — including VMs and private endpoints — without exposing any traffic to the public internet.

**Estimated time:** 1–2 hours (including ~30–45 minutes of gateway deployment wait time)

**Cost:** Basic SKU gateway runs approximately $0.04/hour (~$26/month). For a focused lab session, deploy, test, and delete — a 4-hour session costs roughly $0.16.

---

## Prerequisites

- An Azure subscription
- A Windows 11 machine (on-premises or home lab)
- PowerShell with the Az module installed (for Azure Cloud Shell commands)
- Administrative access on the Windows 11 machine (for certificate and VPN operations)

---

## Architecture

```
┌──────────────────────┐         IKEv2 Tunnel         ┌──────────────────────────┐
│  Windows 11 Client   │◄──────────────────────────────►│  Azure VPN Gateway       │
│  (on-premises)       │   Port UDP 500/4500           │  (Basic SKU)             │
│                      │                                │  vnet-gateway-1          │
│  Gets IP from:       │                                │                          │
│  172.16.0.0/24       │                                │  VNet: 10.0.0.0/16       │
│                      │                                │  ├── GatewaySubnet       │
│  Cert: Client cert   │                                │  │   10.0.255.0/27       │
│  signed by Root CA   │                                │  └── WorkloadSubnet      │
│                      │                                │      10.0.1.0/24         │
└──────────────────────┘                                │      └── vm-internal     │
                                                        │          10.0.1.4        │
                                                        └──────────────────────────┘
```

---

## Phase 1 — Azure Side: Deploy Infrastructure

All commands in this phase are run in **Azure Cloud Shell (PowerShell)**.

### Step 1 — Create Resource Group

```powershell
New-AzResourceGroup -Name "rg-hybrid-connectivity" -Location "westeurope"
```

### Step 2 — Create VNet with GatewaySubnet

The GatewaySubnet name is **mandatory** — Azure requires this exact name for VPN gateway deployment. A /27 (32 addresses) is the recommended minimum size.

```powershell
$vnet = New-AzVirtualNetwork `
    -Name "vnet-hybrid" `
    -ResourceGroupName "rg-hybrid-connectivity" `
    -Location "westeurope" `
    -AddressPrefix "10.0.0.0/16"

# Workload subnet for VMs, private endpoints, etc.
Add-AzVirtualNetworkSubnetConfig `
    -Name "subnet1" `
    -VirtualNetwork $vnet `
    -AddressPrefix "10.0.1.0/24"

# Gateway subnet — name MUST be exactly "GatewaySubnet"
Add-AzVirtualNetworkSubnetConfig `
    -Name "GatewaySubnet" `
    -VirtualNetwork $vnet `
    -AddressPrefix "10.0.255.0/27"

$vnet | Set-AzVirtualNetwork
```

### Step 3 — Create Public IP for the Gateway

The Basic SKU requires a **Dynamic** allocation public IP with **Basic** SKU:

```powershell
$gwpip = New-AzPublicIpAddress `
    -Name "vnet-gw-pip" `
    -ResourceGroupName "rg-hybrid-connectivity" `
    -Location "westeurope" `
    -AllocationMethod Dynamic `
    -Sku Basic
```

> **Note:** Because it's Dynamic, the actual IP address isn't assigned until the gateway is deployed and running.

### Step 4 — Deploy the Basic VPN Gateway

This takes **30–45 minutes**. Start it and move to Phase 2 while it deploys.

```powershell
$vnet = Get-AzVirtualNetwork -Name "vnet-hybrid" -ResourceGroupName "rg-hybrid-connectivity"
$subnet = Get-AzVirtualNetworkSubnetConfig -Name "GatewaySubnet" -VirtualNetwork $vnet

$gwipconfig = New-AzVirtualNetworkGatewayIpConfig `
    -Name "gwipconfig1" `
    -SubnetId $subnet.Id `
    -PublicIpAddressId $gwpip.Id

New-AzVirtualNetworkGateway `
    -Name "vnet-gateway-1" `
    -ResourceGroupName "rg-hybrid-connectivity" `
    -Location "westeurope" `
    -IpConfigurations $gwipconfig `
    -GatewayType "Vpn" `
    -VpnType "RouteBased" `
    -GatewaySku "Basic"
```

Key parameters:
- **GatewayType** `Vpn` — not ExpressRoute
- **VpnType** `RouteBased` — required for P2S; policy-based doesn't support P2S
- **GatewaySku** `Basic` — cheapest option; supports IKEv2 for P2S (as of November 2025)

---

## Phase 2 — On-Premises: Generate Certificates

Run these commands on your **Windows 11 machine** in an elevated PowerShell session while the gateway deploys.

### Understanding the Certificate Chain

Azure P2S uses a trust model with two certificates:
- **Root certificate** — a self-signed CA cert. You upload its public key to Azure so the gateway knows which client certs to trust.
- **Client certificate** — signed by the root cert. Installed on each machine that needs to connect. The private key stays on the client; it proves identity during the IKEv2 handshake.

### Step 5 — Generate the Root Certificate

```powershell
$rootCert = New-SelfSignedCertificate `
    -Type Custom `
    -KeySpec Signature `
    -Subject "CN=LabVPNRootCA" `
    -KeyExportPolicy Exportable `
    -HashAlgorithm sha256 `
    -KeyLength 2048 `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -KeyUsageProperty Sign `
    -KeyUsage CertSign
```

> **About `Cert:\CurrentUser\My`:** This looks like a filesystem path but it's actually a PowerShell drive. PowerShell exposes the Windows certificate store as a navigable drive under `Cert:\`. `CurrentUser\My` maps to the "Personal > Certificates" folder you see in `certmgr.msc`. You can `cd Cert:\CurrentUser\My` and `dir` just like a folder.

### Step 6 — Generate the Client Certificate

```powershell
$clientCert = New-SelfSignedCertificate `
    -Type Custom `
    -DnsName "LabVPNClient" `
    -KeySpec Signature `
    -Subject "CN=LabVPNClientCert" `
    -KeyExportPolicy Exportable `
    -HashAlgorithm sha256 `
    -KeyLength 2048 `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -Signer $rootCert `
    -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.2")
```

Key parameters:
- **`-Signer $rootCert`** — makes this cert a child of the root cert (the chain)
- **`1.3.6.1.5.5.7.3.2`** — the OID for "Client Authentication" EKU, marking this cert as valid for VPN client auth

### Step 7 — Export the Root Certificate's Public Key (Base64)

Azure needs only the public key — no private key leaves your machine:

```powershell
$rootCertBase64 = [Convert]::ToBase64String($rootCert.RawData)
$rootCertBase64 | Set-Clipboard
$rootCertBase64 | Out-File -FilePath "C:\Certs\rootcert-base64.txt"
```

> **Important:** The Base64 string must be a single continuous line with NO `-----BEGIN CERTIFICATE-----` headers, NO line breaks, and NO whitespace. Azure will silently reject malformed data.

### Step 8 — Install Certificates in the Local Machine Store

IKEv2 with `MachineCertificate` authentication looks for certificates in `Cert:\LocalMachine\My`, not `Cert:\CurrentUser\My`. Export and reimport:

```powershell
# Export the client cert with private key and full chain
Export-PfxCertificate `
    -Cert $clientCert `
    -FilePath "C:\Certs\LabVPNClientCert.pfx" `
    -Password (ConvertTo-SecureString -String "YourPassword123!" -Force -AsPlainText) `
    -ChainOption BuildChain

# Import into Local Machine Personal store (requires admin)
Import-PfxCertificate `
    -FilePath "C:\Certs\LabVPNClientCert.pfx" `
    -CertStoreLocation "Cert:\LocalMachine\My" `
    -Password (ConvertTo-SecureString -String "YourPassword123!" -Force -AsPlainText)
```

The `-ChainOption BuildChain` includes the root cert in the `.pfx`, so the root cert ends up in `Cert:\LocalMachine\Root` (Trusted Root Certification Authorities) automatically.

### Step 9 — Verify the Certificate Setup

```powershell
# Client cert in Local Machine Personal store
Get-ChildItem Cert:\LocalMachine\My | Where-Object { $_.Subject -match "LabVPN" } |
    Format-List Subject, Issuer, Thumbprint, HasPrivateKey

# Root cert in Trusted Root store
Get-ChildItem Cert:\LocalMachine\Root | Where-Object { $_.Subject -match "LabVPN" } |
    Format-List Subject, Thumbprint

# Verify the chain: Client Issuer should match Root Subject
# HasPrivateKey should be True for the client cert
```

---

## Phase 3 — Azure Side: Configure P2S

### Step 10 — Configure Point-to-Site via the Portal

Once the gateway has finished deploying:

1. Navigate to your VPN Gateway in the Azure portal
2. Go to **Settings > Point-to-site configuration**
3. Fill in:
   - **Address pool:** `172.16.0.0/24` (must not overlap with your on-prem network or Azure VNet)
   - **Tunnel type:** `IKEv2` (only option on Basic SKU)
   - **Authentication type:** `Azure certificate`
   - **Root certificates — Name:** `LabVPNRootCA`
   - **Root certificates — Public certificate data:** paste the Base64 string from Step 7
4. Click **Save** and **wait for the save to complete** (2–5 minutes — watch for the success notification)
5. Once saved, click **Download VPN client** at the top

> **Note:** The Basic SKU now supports portal configuration for P2S (as of the November 2025 IKEv2 update). Previously it was PowerShell/CLI only.

### Alternatively — Configure via PowerShell (Cloud Shell)

```powershell
$gateway = Get-AzVirtualNetworkGateway `
    -Name "vnet-gateway-1" `
    -ResourceGroupName "rg-hybrid-connectivity"

$p2sRootCert = New-AzVpnClientRootCertificate `
    -Name "LabVPNRootCA" `
    -PublicCertData $rootCertBase64

Set-AzVirtualNetworkGateway `
    -VirtualNetworkGateway $gateway `
    -VpnClientAddressPool "172.16.0.0/24" `
    -VpnClientRootCertificates $p2sRootCert `
    -VpnClientProtocol "IKEv2"
```

---

## Phase 4 — Connect from Windows 11

### Step 11 — Use the Microsoft Setup Script (Recommended)

Extract the downloaded VPN client `.zip` file. Inside the `WindowsPowershell` folder there's a `VpnProfileSetup.ps1` script. Run it:

```powershell
powershell -ExecutionPolicy Bypass -File "C:\path\to\WindowsPowershell\VpnProfileSetup.ps1"
```

This script creates a VPN connection with all the correct settings. Connect from **Settings > Network & internet > VPN**.

### Step 12 — Install the VPN Server Root Certificate

Inside the extracted `.zip`, look in the `Generic` folder for `VpnServerRoot.cer_0` (or similar). This is the Azure gateway's TLS certificate root CA. Install it:

```powershell
Import-Certificate `
    -FilePath "C:\path\to\Generic\VpnServerRoot.cer_0" `
    -CertStoreLocation "Cert:\LocalMachine\Root"
```

This tells your Windows machine to trust the certificate the Azure VPN gateway presents during the IKEv2 handshake.

### Step 13 — Connect and Verify

Connect from the Windows Settings VPN page, then verify:

```powershell
# Check you got an IP from the P2S pool
ipconfig | Select-String -Pattern "172.16"

# Check routes to Azure VNet
Get-NetRoute | Where-Object { $_.DestinationPrefix -match "10.0" }

# Test connectivity to a VM on the Azure VNet
Test-NetConnection -ComputerName 10.0.1.4 -Port 22
```

> **Note:** ICMP (ping) is blocked by default in Azure NSGs. Use `Test-NetConnection` with a specific port (SSH 22, RDP 3389) instead of ping to verify connectivity.

---

## Phase 5 — Test with a Workload

Deploy a small VM into the workload subnet to prove the tunnel works:

```powershell
# In Cloud Shell — deploy a small Linux VM
# Make sure the NSG allows inbound SSH from 172.16.0.0/24 (P2S pool)
```

From your connected Windows 11 machine:

```powershell
# SSH to the VM's private IP through the VPN tunnel
ssh user@10.0.1.4
```

For Azure Files testing, create a private endpoint for a storage account in the workload subnet, then mount the file share over the VPN — the SMB traffic flows through the tunnel to the private IP, never touching port 445 on the public internet.

---

## Cleanup

To stop costs, delete the gateway (the most expensive resource):

```powershell
# Delete just the gateway and its public IP
Remove-AzVirtualNetworkGateway -Name "vnet-gateway-1" -ResourceGroupName "rg-hybrid-connectivity" -Force
Remove-AzPublicIpAddress -Name "vnet-gw-pip" -ResourceGroupName "rg-hybrid-connectivity" -Force

# Or delete everything
Remove-AzResourceGroup -Name "rg-hybrid-connectivity" -Force
```

The certificates on your Windows 11 machine persist — they'll be there when you redeploy the gateway next time. Just re-upload the root cert Base64 and reconfigure P2S.

---

## Troubleshooting: Issues We Encountered

### Issue 1: "IKE authentication credentials are unacceptable" (Error 13801)

**Symptom:** VPN connection fails immediately with this error.

**Root cause:** We connected to the gateway using its **public IP address** (`20.103.209.44`), but the gateway's server certificate contains a **DNS hostname** (`azuregateway-xxxx.vpn.azure.com`). During the IKEv2 handshake, the client validates the server's certificate — the name on the cert didn't match what we connected to, so the client rejected it.

**This is the same principle as HTTPS:** if you browse to a website by IP address, your browser warns you the certificate doesn't match.

**Fix:** Always use the gateway's DNS name from the downloaded VPN client profile, not the raw public IP. The Microsoft setup script (`VpnProfileSetup.ps1`) uses the correct DNS name automatically.

### Issue 2: "IKE failed to find valid machine certificate"

**Symptom:** Connection fails after switching authentication method to `MachineCertificate`.

**Root cause:** The `MachineCertificate` authentication method looks for certificates in `Cert:\LocalMachine\My` (the machine-level Personal store), but we initially generated the certificates in `Cert:\CurrentUser\My` (the user-level Personal store).

**Fix:** Export the client certificate as a `.pfx` with `-ChainOption BuildChain` and import it into `Cert:\LocalMachine\My`. See Step 8.

### Issue 3: Authentication method defaulted to EAP

**Symptom:** Connection fails with credential errors even though certificates are correct.

**Root cause:** When creating a VPN connection through the Windows Settings GUI and selecting "Certificate" as the sign-in type, Windows sets the authentication method to `Eap` instead of `MachineCertificate`. The Azure Basic SKU with certificate auth expects `MachineCertificate` for IKEv2.

**How we found it:**
```powershell
Get-VpnConnection -Name "Azure Lab VPN" | Format-List AuthenticationMethod
# Showed: {Eap}  ← wrong, should be {MachineCertificate}
```

**Fix:** Use the Microsoft-provided `VpnProfileSetup.ps1` script, or create the connection via PowerShell with `-AuthenticationMethod MachineCertificate` explicitly.

### Issue 4: No routes to Azure VNet after connecting

**Symptom:** VPN shows "Connected" but `ping 10.0.1.4` times out. `Get-NetRoute` shows no routes for `10.0.0.0/16`.

**Root cause:** We created the VPN connection with `-SplitTunneling` but never added any routes. With split tunneling, Windows only sends traffic through the VPN for explicitly defined prefixes — no routes means no VPN traffic.

**Fix:** The Microsoft setup script adds routes automatically. If configuring manually, add routes to the connection:

```powershell
Add-VpnConnectionRoute -ConnectionName "vnet-hybrid" -DestinationPrefix "10.0.0.0/16"
Add-VpnConnectionRoute -ConnectionName "vnet-hybrid" -DestinationPrefix "172.16.0.0/24"
```

Or add them in the Azure portal under Point-to-site configuration > **Additional routes to advertise**.

### Issue 5: P2S configuration not saving in the portal

**Symptom:** Navigating away from the P2S configuration page shows "Your unsaved edits will be discarded."

**Root cause:** The Save button was clicked but the operation hadn't completed. The gateway update takes 2–5 minutes.

**Fix:** Click Save and wait for the success notification in the top-right bell icon before navigating away or attempting to connect.

### Issue 6: Get-VpnConnection can't find the connection

**Symptom:** `Get-VpnConnection -Name "Azure Lab VPN"` returns "VPN connection was not found."

**Root cause:** The VPN was created under the user profile (`davy`), but PowerShell was running elevated (as Administrator), which operates in a different context.

**Fix:** Run `Get-VpnConnection` from a non-elevated PowerShell window, or use `-AllUserConnection` when creating the VPN to make it visible to all contexts.

### Issue 7: PowerShell execution policy blocking scripts

**Symptom:** Running `VpnProfileSetup.ps1` fails with "running scripts is disabled on this system."

**Fix:** Bypass the execution policy for that specific script:

```powershell
powershell -ExecutionPolicy Bypass -File "path\to\VpnProfileSetup.ps1"
```

---

## Key Takeaways for the AZ-104 Exam

1. **Basic SKU limitations:** No OpenVPN support, no RADIUS authentication, no IPv6, no Entra ID authentication for P2S. Supports IKEv2 only (as of November 2025). Previously only supported SSTP, which is being retired (March 2026 for new configurations, March 2027 for existing).

2. **VpnGw1 is the minimum for OpenVPN/Entra ID:** If you need OpenVPN tunnel type (required for Entra ID authentication), Azure VPN Client, or cross-platform support (macOS, Linux, Android), you need at least VpnGw1 (~$139/month).

3. **Gateway deployment time:** VPN gateways take 30–45 minutes to deploy. Plan accordingly in exam scenarios and labs.

4. **GatewaySubnet naming:** The subnet for VPN gateways must be named exactly `GatewaySubnet`. Any other name is rejected.

5. **Certificate chain matters:** Azure trusts client certs signed by uploaded root certs. The root cert's public key goes to Azure; the client cert (with private key) stays on the client machine.

6. **IKEv2 uses machine certificates:** The `MachineCertificate` auth method looks in `Cert:\LocalMachine\My`, not `Cert:\CurrentUser\My`. This is a common pitfall.

7. **Split tunneling requires explicit routes:** With split tunneling enabled, only traffic matching configured route prefixes goes through the tunnel. Without routes, the tunnel is connected but useless.

8. **Use the gateway DNS name, not the IP:** IKEv2 validates the server certificate against the hostname you connect to. The gateway's cert contains its DNS name (`azuregateway-xxxx.vpn.azure.com`), not its IP address.

9. **SSTP is being retired:** Microsoft is retiring SSTP effective March 2026 (no new configurations) and March 2027 (existing connections stop working). IKEv2 and OpenVPN are the replacement protocols.

10. **The VPN client configuration package is essential:** Download it from the portal — it contains the correct gateway DNS name, server root certificates, route definitions, and platform-specific setup scripts that handle the configuration correctly.

---

## Cost Summary

| Resource | Cost | Notes |
|----------|------|-------|
| VPN Gateway (Basic) | ~$0.04/hr (~$26/month) | Billed even when no clients connected |
| VPN Gateway (VpnGw1) | ~$0.19/hr (~$139/month) | Required for OpenVPN/Entra ID |
| S2S/P2S tunnels | Included | First 10 S2S and 128 P2S included on all SKUs |
| Data transfer | Standard rates | Negligible for lab traffic |
| VNet, subnets, NSGs | Free | No charge for the network infrastructure itself |

**Lab cost strategy:** Deploy, test, delete. A 4-hour lab session on Basic SKU costs ~$0.16. A full weekend costs ~$2.
