# ============================================================
# P2S VPN Debug Script - Windows Client Side
# Run this on WINDOWS11BYOD as Administrator
# ============================================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  P2S VPN Client Diagnostics" -ForegroundColor Cyan
Write-Host "  Run as Administrator on the VPN client" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# --- 1. VPN Connection Configuration ---
Write-Host "=== 1. VPN CONNECTION CONFIG ===" -ForegroundColor Green
$vpn = Get-VpnConnection -Name "vnet-hybrid" -ErrorAction SilentlyContinue
if ($vpn) {
    Write-Host "  Connection Name    : $($vpn.Name)"
    Write-Host "  Server Address     : $($vpn.ServerAddress)"
    Write-Host "  Tunnel Type        : $($vpn.TunnelType)"
    Write-Host "  Auth Method        : $($vpn.AuthenticationMethod)"
    Write-Host "  Connection Status  : $($vpn.ConnectionStatus)"
    Write-Host "  Split Tunneling    : $($vpn.SplitTunneling)"
    Write-Host "  Encryption Level   : $($vpn.EncryptionLevel)"
    if ($vpn.MachineCertificateIssuerFilter) {
        Write-Host "  Cert Issuer Filter : $($vpn.MachineCertificateIssuerFilter.Subject)" -ForegroundColor Yellow
    } else {
        Write-Host "  Cert Issuer Filter : (none)" -ForegroundColor Yellow
    }
    Write-Host "  Routes             : $($vpn.Routes.Count) route(s)"
    foreach ($route in $vpn.Routes) {
        Write-Host "    - $($route.DestinationPrefix)"
    }
} else {
    Write-Host "  ERROR: VPN connection 'vnet-hybrid' not found!" -ForegroundColor Red
}
Write-Host ""

# --- 2. Certificate Checks ---
Write-Host "=== 2. CERTIFICATE CHECKS ===" -ForegroundColor Green

Write-Host "  --- Current User Store (for EAP) ---"
$userCerts = Get-ChildItem -Path "Cert:\CurrentUser\My" | Where-Object { $_.Subject -like "*LabVPN*" }
if ($userCerts) {
    foreach ($c in $userCerts) {
        Write-Host "  Subject      : $($c.Subject)"
        Write-Host "  Issuer       : $($c.Issuer)"
        Write-Host "  Thumbprint   : $($c.Thumbprint)"
        Write-Host "  Valid From   : $($c.NotBefore)"
        Write-Host "  Valid To     : $($c.NotAfter)"
        Write-Host "  Has Key      : $($c.HasPrivateKey)"
        $eku = $c.Extensions | Where-Object { $_.Oid.FriendlyName -eq "Enhanced Key Usage" }
        if ($eku) {
            Write-Host "  EKU          : $($eku.Format($false))"
        }
        Write-Host ""
    }
} else {
    Write-Host "  WARNING: No LabVPN certificates in CurrentUser\My!" -ForegroundColor Red
}

Write-Host "  --- Local Machine Store (for MachineCertAuth) ---"
$machineCerts = Get-ChildItem -Path "Cert:\LocalMachine\My" | Where-Object { $_.Subject -like "*LabVPN*" }
if ($machineCerts) {
    foreach ($c in $machineCerts) {
        Write-Host "  Subject      : $($c.Subject)"
        Write-Host "  Issuer       : $($c.Issuer)"
        Write-Host "  Thumbprint   : $($c.Thumbprint)"
        Write-Host "  Valid From   : $($c.NotBefore)"
        Write-Host "  Valid To     : $($c.NotAfter)"
        Write-Host "  Has Key      : $($c.HasPrivateKey)"
        Write-Host ""
    }
} else {
    Write-Host "  WARNING: No LabVPN certificates in LocalMachine\My!" -ForegroundColor Red
    Write-Host "  MachineCertAuth will NOT work without this!" -ForegroundColor Red
}

Write-Host "  --- Trusted Root CAs ---"
$rootCA = Get-ChildItem -Path "Cert:\LocalMachine\Root" | Where-Object { $_.Subject -like "*LabVPNRootCA*" }
if ($rootCA) {
    Write-Host "  LabVPNRootCA : FOUND" -ForegroundColor Green
    Write-Host "  Thumbprint   : $($rootCA.Thumbprint)"
    Write-Host "  Valid To     : $($rootCA.NotAfter)"
} else {
    Write-Host "  LabVPNRootCA : MISSING!" -ForegroundColor Red
}

$digicert = Get-ChildItem -Path "Cert:\LocalMachine\Root" | Where-Object { $_.Subject -like "*DigiCert Global Root G2*" }
if ($digicert) {
    Write-Host "  DigiCert G2  : FOUND" -ForegroundColor Green
    Write-Host "  Thumbprint   : $($digicert.Thumbprint)"
} else {
    Write-Host "  DigiCert G2  : MISSING!" -ForegroundColor Red
}
Write-Host ""

# --- 3. Certificate Chain Validation ---
Write-Host "=== 3. CERTIFICATE CHAIN VALIDATION ===" -ForegroundColor Green
$clientCert = Get-ChildItem -Path "Cert:\CurrentUser\My" | Where-Object { $_.Subject -like "*LabVPNClientCert*" } | Select-Object -First 1
if ($clientCert) {
    $chain = New-Object System.Security.Cryptography.X509Certificates.X509Chain
    $chain.ChainPolicy.RevocationMode = [System.Security.Cryptography.X509Certificates.X509RevocationMode]::NoCheck
    $result = $chain.Build($clientCert)
    Write-Host "  Chain Valid (no revocation check) : $result"
    if (-not $result) {
        foreach ($status in $chain.ChainStatus) {
            Write-Host "  Chain Error  : $($status.Status) - $($status.StatusInformation)" -ForegroundColor Red
        }
    }
    Write-Host "  Chain Path:"
    foreach ($element in $chain.ChainElements) {
        Write-Host "    $($element.Certificate.Subject) -> Issued by: $($element.Certificate.Issuer)"
    }

    # Now test WITH revocation check (this is what EAP does)
    $chain2 = New-Object System.Security.Cryptography.X509Certificates.X509Chain
    $result2 = $chain2.Build($clientCert)
    Write-Host ""
    Write-Host "  Chain Valid (with revocation check): $result2"
    if (-not $result2) {
        foreach ($status in $chain2.ChainStatus) {
            Write-Host "  Chain Error  : $($status.Status) - $($status.StatusInformation)" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "  ERROR: LabVPNClientCert not found in CurrentUser store!" -ForegroundColor Red
}
Write-Host ""

# --- 4. Network Connectivity ---
Write-Host "=== 4. NETWORK CONNECTIVITY ===" -ForegroundColor Green
$gateway = "azuregateway-066c0069-4bfc-4d75-adf0-52af8849d3e0-ad32183dd10c.vpn.azure.com"
$gatewayIP = "20.103.209.44"

Write-Host "  Gateway FQDN : $gateway"
Write-Host "  Gateway IP   : $gatewayIP"
Write-Host ""

# DNS resolution
Write-Host "  --- DNS Resolution ---"
try {
    $dns = Resolve-DnsName $gateway -ErrorAction Stop
    Write-Host "  DNS resolves to : $($dns.IPAddress)" -ForegroundColor Green
} catch {
    Write-Host "  DNS resolution FAILED!" -ForegroundColor Red
}

# ICMP Ping
Write-Host "  --- ICMP Ping ---"
$ping = Test-Connection -ComputerName $gatewayIP -Count 2 -Quiet
if ($ping) {
    Write-Host "  Ping           : SUCCESS" -ForegroundColor Green
} else {
    Write-Host "  Ping           : FAILED (may be blocked, not critical)" -ForegroundColor Yellow
}

# TCP 443 (SSTP)
Write-Host "  --- TCP Port 443 (SSTP/HTTPS) ---"
$tcp443 = Test-NetConnection -ComputerName $gatewayIP -Port 443 -WarningAction SilentlyContinue
if ($tcp443.TcpTestSucceeded) {
    Write-Host "  TCP 443        : OPEN" -ForegroundColor Green
} else {
    Write-Host "  TCP 443        : CLOSED (SSTP won't work, IKEv2-only gateway?)" -ForegroundColor Yellow
}

# TCP 500 (note: IKEv2 uses UDP, not TCP - this is just indicative)
Write-Host "  --- TCP Port 500 (indicative only, IKEv2 uses UDP) ---"
$tcp500 = Test-NetConnection -ComputerName $gatewayIP -Port 500 -WarningAction SilentlyContinue
if ($tcp500.TcpTestSucceeded) {
    Write-Host "  TCP 500        : OPEN" -ForegroundColor Green
} else {
    Write-Host "  TCP 500        : CLOSED (expected for IKEv2, uses UDP)" -ForegroundColor Yellow
}
Write-Host ""

# --- 5. Registry Settings ---
Write-Host "=== 5. VPN REGISTRY SETTINGS ===" -ForegroundColor Green
$rasmanPath = "HKLM:\SYSTEM\CurrentControlSet\Services\RasMan\Parameters"
try {
    $noCRL = Get-ItemProperty -Path $rasmanPath -Name "NoCertRevocationCheck" -ErrorAction SilentlyContinue
    if ($noCRL) {
        Write-Host "  NoCertRevocationCheck : $($noCRL.NoCertRevocationCheck) (1=disabled)"
    } else {
        Write-Host "  NoCertRevocationCheck : Not set (default: CRL check enabled)" -ForegroundColor Yellow
    }

    $noEKU = Get-ItemProperty -Path $rasmanPath -Name "DisableIKENameEkuCheck" -ErrorAction SilentlyContinue
    if ($noEKU) {
        Write-Host "  DisableIKENameEkuCheck: $($noEKU.DisableIKENameEkuCheck) (1=disabled)"
    } else {
        Write-Host "  DisableIKENameEkuCheck: Not set (default: EKU check enabled)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  Could not read registry settings" -ForegroundColor Yellow
}
Write-Host ""

# --- 6. Services ---
Write-Host "=== 6. REQUIRED SERVICES ===" -ForegroundColor Green
$services = @("RasMan", "SCardSvr", "IKEEXT", "PolicyAgent")
foreach ($svc in $services) {
    $s = Get-Service -Name $svc -ErrorAction SilentlyContinue
    if ($s) {
        $color = if ($s.Status -eq "Running") { "Green" } else { "Red" }
        Write-Host "  $($svc.PadRight(15)) : $($s.Status) ($($s.StartType))" -ForegroundColor $color
    } else {
        Write-Host "  $($svc.PadRight(15)) : NOT FOUND" -ForegroundColor Red
    }
}
Write-Host ""

# --- 7. Recent VPN Errors ---
Write-Host "=== 7. RECENT VPN ERRORS (last 10) ===" -ForegroundColor Green
try {
    $events = Get-WinEvent -LogName "Application" -MaxEvents 100 -ErrorAction SilentlyContinue | Where-Object {
        $_.ProviderName -match "Ras" -and $_.Message -match "failed|error|attention"
    } | Select-Object -First 10
    if ($events) {
        foreach ($evt in $events) {
            # Extract error code if present
            if ($evt.Message -match "error code returned on failure is (\d+)") {
                $errorCode = $matches[1]
                $errorDesc = switch ($errorCode) {
                    "809"   { "Remote server not responding (UDP 500/4500 blocked)" }
                    "13801" { "IKE auth credentials unacceptable (cert issue)" }
                    "13806" { "No matching cert found" }
                    "13868" { "IKE negotiation failed (cipher mismatch)" }
                    "800"   { "VPN tunnel failed to establish" }
                    "789"   { "L2TP connection failed" }
                    default { "Unknown error" }
                }
                Write-Host "  [$($evt.TimeCreated)] Error $errorCode - $errorDesc" -ForegroundColor Red
            } else {
                Write-Host "  [$($evt.TimeCreated)] $($evt.Message.Substring(0, [Math]::Min(100, $evt.Message.Length)))..." -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "  No recent VPN errors found" -ForegroundColor Green
    }
} catch {
    Write-Host "  Could not read event logs" -ForegroundColor Yellow
}
Write-Host ""

# --- 8. Summary ---
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  SUMMARY" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

$issues = @()
if (-not $vpn) { $issues += "VPN connection not configured" }
if (-not $userCerts -and -not $machineCerts) { $issues += "No client certificates found" }
if (-not $rootCA) { $issues += "LabVPNRootCA not in trusted root store" }
if (-not $digicert) { $issues += "DigiCert Global Root G2 not in trusted root store" }
if ($vpn -and $vpn.AuthenticationMethod -eq "MachineCertificate" -and -not $machineCerts) {
    $issues += "MachineCertAuth selected but no cert in LocalMachine store"
}
if (-not $result2) { $issues += "Certificate chain validation failed WITH revocation check (EAP may fail)" }
if (-not $tcp443.TcpTestSucceeded) { $issues += "TCP 443 closed - SSTP not available on gateway" }

if ($issues.Count -eq 0) {
    Write-Host "  No obvious issues found." -ForegroundColor Green
    Write-Host "  If VPN still fails, try switching tunnel type to SSTP." -ForegroundColor Yellow
} else {
    Write-Host "  Issues found:" -ForegroundColor Red
    foreach ($issue in $issues) {
        Write-Host "    - $issue" -ForegroundColor Red
    }
}
Write-Host ""
Write-Host "  Tip: If error 809, UDP 500/4500 is blocked - switch to SSTP" -ForegroundColor Yellow
Write-Host "  Tip: If error 13801, certificate mismatch - check chain" -ForegroundColor Yellow
Write-Host "  Tip: If error 13868, cipher mismatch - set custom IKE policy" -ForegroundColor Yellow
Write-Host ""
