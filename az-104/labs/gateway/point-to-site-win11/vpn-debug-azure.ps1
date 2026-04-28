# ============================================================
# P2S VPN Debug Script - Azure Side
# Run this in Azure Cloud Shell (PowerShell)
# ============================================================

param(
    [string]$GatewayName = "vnet-gateway-1",
    [string]$ResourceGroup = "rg-hybrid-connectivity"
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  P2S VPN Azure-Side Diagnostics" -ForegroundColor Cyan
Write-Host "  Run in Azure Cloud Shell" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# --- 1. Gateway Status ---
Write-Host "=== 1. GATEWAY STATUS ===" -ForegroundColor Green
try {
    $gw = Get-AzVirtualNetworkGateway -Name $GatewayName -ResourceGroupName $ResourceGroup -ErrorAction Stop
    Write-Host "  Name               : $($gw.Name)"
    Write-Host "  Provisioning State : $($gw.ProvisioningState)"
    Write-Host "  Gateway Type       : $($gw.GatewayType)"
    Write-Host "  VPN Type           : $($gw.VpnType)"
    Write-Host "  SKU                : $($gw.Sku.Name) / $($gw.Sku.Tier)"
    Write-Host "  Active-Active      : $($gw.ActiveActive)"
    Write-Host "  Enable BGP         : $($gw.EnableBgp)"
    Write-Host "  Location           : $($gw.Location)"

    # Public IP
    if ($gw.IpConfigurations) {
        foreach ($ipConfig in $gw.IpConfigurations) {
            if ($ipConfig.PublicIpAddress) {
                $pipId = $ipConfig.PublicIpAddress.Id
                $pipName = $pipId.Split("/")[-1]
                $pipRg = $pipId.Split("/")[4]
                try {
                    $pip = Get-AzPublicIpAddress -Name $pipName -ResourceGroupName $pipRg -ErrorAction Stop
                    Write-Host "  Public IP          : $($pip.IpAddress)" -ForegroundColor Green
                    Write-Host "  Public IP Alloc.   : $($pip.PublicIpAllocationMethod)"
                } catch {
                    Write-Host "  Public IP          : Could not retrieve" -ForegroundColor Yellow
                }
            }
        }
    }

    # Gateway state check
    if ($gw.ProvisioningState -eq "Succeeded") {
        Write-Host "  Gateway Health     : RUNNING" -ForegroundColor Green
    } else {
        Write-Host "  Gateway Health     : $($gw.ProvisioningState)" -ForegroundColor Red
    }
} catch {
    Write-Host "  ERROR: Could not find gateway '$GatewayName' in '$ResourceGroup'" -ForegroundColor Red
    Write-Host "  Exception: $_" -ForegroundColor Red
    exit
}
Write-Host ""

# --- 2. P2S Configuration ---
Write-Host "=== 2. POINT-TO-SITE CONFIGURATION ===" -ForegroundColor Green
$p2s = $gw.VpnClientConfiguration
if ($p2s) {
    Write-Host "  Address Pool       : $($p2s.VpnClientAddressPool.AddressPrefixes -join ', ')"
    Write-Host "  Protocols          : $($p2s.VpnClientProtocols -join ', ')"
    Write-Host "  Auth Types         : $($p2s.VpnAuthenticationTypes -join ', ')"

    # Check protocols
    $protocols = $p2s.VpnClientProtocols
    if ($protocols -contains "SSTP") {
        Write-Host "  SSTP (TCP 443)     : ENABLED" -ForegroundColor Green
    } else {
        Write-Host "  SSTP (TCP 443)     : NOT ENABLED" -ForegroundColor Yellow
        Write-Host "    -> Clients must use IKEv2 (UDP 500/4500)" -ForegroundColor Yellow
        Write-Host "    -> If UDP is blocked, VPN will fail with error 809" -ForegroundColor Yellow
    }
    if ($protocols -contains "IkeV2") {
        Write-Host "  IKEv2 (UDP 500)    : ENABLED" -ForegroundColor Green
    } else {
        Write-Host "  IKEv2 (UDP 500)    : NOT ENABLED" -ForegroundColor Yellow
    }
    if ($protocols -contains "OpenVPN") {
        Write-Host "  OpenVPN (TCP 443)  : ENABLED" -ForegroundColor Green
    } else {
        Write-Host "  OpenVPN            : NOT ENABLED" -ForegroundColor Yellow
    }
} else {
    Write-Host "  P2S is NOT configured on this gateway!" -ForegroundColor Red
}
Write-Host ""

# --- 3. Root Certificates ---
Write-Host "=== 3. ROOT CERTIFICATES (trusted client CAs) ===" -ForegroundColor Green
$rootCerts = $p2s.VpnClientRootCertificates
if ($rootCerts -and $rootCerts.Count -gt 0) {
    foreach ($rc in $rootCerts) {
        Write-Host "  Certificate Name   : $($rc.Name)"

        # Decode and show details
        try {
            $certBytes = [Convert]::FromBase64String($rc.PublicCertData)
            $cert = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new($certBytes)
            Write-Host "  Subject            : $($cert.Subject)"
            Write-Host "  Thumbprint         : $($cert.Thumbprint)" -ForegroundColor Yellow
            Write-Host "  Valid From         : $($cert.NotBefore)"
            Write-Host "  Valid To           : $($cert.NotAfter)"
            Write-Host "  Serial Number      : $($cert.SerialNumber)"

            # Check if expired
            if ($cert.NotAfter -lt (Get-Date)) {
                Write-Host "  STATUS             : EXPIRED!" -ForegroundColor Red
            } elseif ($cert.NotBefore -gt (Get-Date)) {
                Write-Host "  STATUS             : NOT YET VALID!" -ForegroundColor Red
            } else {
                Write-Host "  STATUS             : VALID" -ForegroundColor Green
            }
        } catch {
            Write-Host "  Could not decode certificate" -ForegroundColor Yellow
        }
        Write-Host ""
    }
} else {
    Write-Host "  NO root certificates configured!" -ForegroundColor Red
    Write-Host "  No client can authenticate!" -ForegroundColor Red
}

# --- 4. Revoked Certificates ---
Write-Host "=== 4. REVOKED CERTIFICATES ===" -ForegroundColor Green
$revokedCerts = $p2s.VpnClientRevokedCertificates
if ($revokedCerts -and $revokedCerts.Count -gt 0) {
    foreach ($rev in $revokedCerts) {
        Write-Host "  Revoked: $($rev.Name) - Thumbprint: $($rev.Thumbprint)" -ForegroundColor Red
    }
} else {
    Write-Host "  No certificates revoked (good)" -ForegroundColor Green
}
Write-Host ""

# --- 5. IPsec/IKE Policy ---
Write-Host "=== 5. IPSEC/IKE POLICY ===" -ForegroundColor Green
$ipsecPolicy = $gw.VpnClientConfiguration.VpnClientIpsecPolicies
if ($ipsecPolicy -and $ipsecPolicy.Count -gt 0) {
    foreach ($pol in $ipsecPolicy) {
        Write-Host "  IKE Encryption     : $($pol.IkeEncryption)"
        Write-Host "  IKE Integrity      : $($pol.IkeIntegrity)"
        Write-Host "  DH Group           : $($pol.DhGroup)"
        Write-Host "  IPsec Encryption   : $($pol.IpsecEncryption)"
        Write-Host "  IPsec Integrity    : $($pol.IpsecIntegrity)"
        Write-Host "  PFS Group          : $($pol.PfsGroup)"
        Write-Host "  SA Lifetime (sec)  : $($pol.SaLifeTimeSeconds)"
        Write-Host "  SA Data Size (KB)  : $($pol.SaDataSizeKilobytes)"
    }
} else {
    Write-Host "  Using DEFAULT policy" -ForegroundColor Yellow
    Write-Host "  Default IKE Phase 1:"
    Write-Host "    Encryption: AES256, GCMAES256"
    Write-Host "    Integrity : SHA256, SHA384"
    Write-Host "    DH Group  : DHGroup2, DHGroup14, DHGroup24, ECP256, ECP384"
    Write-Host "  Default IKE Phase 2 (IPsec):"
    Write-Host "    Encryption: GCMAES256, AES256"
    Write-Host "    Integrity : GCMAES256, SHA256"
    Write-Host "    PFS Group : PFS2048, PFS24, ECP256, ECP384"
    Write-Host ""
    Write-Host "  Note: macOS may propose post-quantum algorithms (MLKEM768)" -ForegroundColor Yellow
    Write-Host "  that Azure doesn't support, causing NoProposalChosen errors." -ForegroundColor Yellow
}
Write-Host ""

# --- 6. VNet Configuration ---
Write-Host "=== 6. VNET CONFIGURATION ===" -ForegroundColor Green
if ($gw.IpConfigurations) {
    $subnetId = $gw.IpConfigurations[0].Subnet.Id
    $vnetName = $subnetId.Split("/")[8]
    $vnetRg = $subnetId.Split("/")[4]
    try {
        $vnet = Get-AzVirtualNetwork -Name $vnetName -ResourceGroupName $vnetRg -ErrorAction Stop
        Write-Host "  VNet Name          : $($vnet.Name)"
        Write-Host "  VNet Address Space : $($vnet.AddressSpace.AddressPrefixes -join ', ')"
        Write-Host "  Subnets:"
        foreach ($subnet in $vnet.Subnets) {
            Write-Host "    - $($subnet.Name): $($subnet.AddressPrefix -join ', ')"
        }
    } catch {
        Write-Host "  Could not retrieve VNet details" -ForegroundColor Yellow
    }
}
Write-Host ""

# --- 7. Connected Clients ---
Write-Host "=== 7. CONNECTED P2S CLIENTS ===" -ForegroundColor Green
try {
    $sessions = Get-AzVirtualNetworkGatewayVpnClientConnectionHealth -ResourceGroupName $ResourceGroup -VirtualNetworkGatewayName $GatewayName -ErrorAction Stop
    if ($sessions -and $sessions.Count -gt 0) {
        Write-Host "  Active connections : $($sessions.Count)" -ForegroundColor Green
        foreach ($s in $sessions) {
            Write-Host "    IP: $($s.VpnClientAddress) | Protocol: $($s.VpnConnectionProtocol) | Duration: $($s.VpnConnectionDuration) | Bytes In/Out: $($s.IngressBytesTransferred)/$($s.EgressBytesTransferred)"
        }
    } else {
        Write-Host "  No active P2S connections" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  Could not retrieve connection health (may require a moment)" -ForegroundColor Yellow
}
Write-Host ""

# --- 8. Summary & Recommendations ---
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  SUMMARY & RECOMMENDATIONS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

$issues = @()
$recommendations = @()

if ($gw.ProvisioningState -ne "Succeeded") {
    $issues += "Gateway is not in Succeeded state: $($gw.ProvisioningState)"
}
if (-not ($protocols -contains "SSTP")) {
    $issues += "SSTP not enabled - clients behind NAT may fail with error 809"
    $recommendations += "Add SSTP: Set-AzVirtualNetworkGateway -VirtualNetworkGateway `$gw -VpnClientProtocol @('SSTP','IkeV2') -VpnClientAddressPool '172.16.0.0/24'"
}
if ($gw.Sku.Name -eq "Basic") {
    $issues += "Basic SKU - limited protocol and cipher support"
    $recommendations += "Upgrade to VpnGw1 or higher for full IKEv2/OpenVPN support"
}
if (-not $rootCerts -or $rootCerts.Count -eq 0) {
    $issues += "No root certificates - no client can authenticate"
}
if (-not $ipsecPolicy -or $ipsecPolicy.Count -eq 0) {
    $recommendations += "Consider setting a custom IKE policy if macOS clients get NoProposalChosen errors"
}

if ($issues.Count -eq 0) {
    Write-Host "  No critical issues found on the Azure side." -ForegroundColor Green
} else {
    Write-Host "  Issues:" -ForegroundColor Red
    foreach ($issue in $issues) {
        Write-Host "    - $issue" -ForegroundColor Red
    }
}

if ($recommendations.Count -gt 0) {
    Write-Host ""
    Write-Host "  Recommendations:" -ForegroundColor Yellow
    foreach ($rec in $recommendations) {
        Write-Host "    - $rec" -ForegroundColor Yellow
    }
}
Write-Host ""

# --- Quick Fix Commands ---
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  QUICK FIX COMMANDS (copy/paste if needed)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  # Add SSTP support (fixes error 809 / UDP blocking):" -ForegroundColor Yellow
Write-Host "  Set-AzVirtualNetworkGateway -VirtualNetworkGateway `$gw -VpnClientProtocol @('SSTP','IkeV2') -VpnClientAddressPool '172.16.0.0/24'"
Write-Host ""
Write-Host "  # Set custom IKE policy (fixes NoProposalChosen on macOS):" -ForegroundColor Yellow
Write-Host '  $ipsecPolicy = New-AzIpsecPolicy -IkeEncryption AES256 -IkeIntegrity SHA256 -DhGroup DHGroup14 -IpsecEncryption GCMAES256 -IpsecIntegrity GCMAES256 -PfsGroup PFS2048 -SALifeTimeSeconds 3600 -SADataSizeKilobytes 102400000'
Write-Host '  Set-AzVirtualNetworkGateway -VirtualNetworkGateway $gw -VpnClientIpsecPolicy $ipsecPolicy'
Write-Host ""
Write-Host "  # Reset the gateway (if all else fails):" -ForegroundColor Yellow
Write-Host "  Reset-AzVirtualNetworkGateway -VirtualNetworkGateway `$gw"
Write-Host ""
Write-Host "  # Download new VPN client config after changes:" -ForegroundColor Yellow
Write-Host "  `$profile = New-AzVpnClientConfiguration -ResourceGroupName '$ResourceGroup' -Name '$GatewayName' -AuthenticationMethod 'EapTls'"
Write-Host "  Write-Host `$profile.VpnProfileSASUrl"
Write-Host ""
