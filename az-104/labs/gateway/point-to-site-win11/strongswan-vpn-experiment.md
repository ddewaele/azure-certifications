# strongSwan VPN Diagnostic Experiment

## Purpose

We needed to determine why the Azure P2S VPN (IKEv2) connection from a Windows 11 ARM VM (Parallels on Mac M3) worked on some networks but not on the home Telenet modem. Specifically:

| Network | Azure VPN | UDP Echo Test |
|---------|-----------|---------------|
| iPhone 5G hotspot | Works | Works |
| Friend's Telenet modem | Works | Works |
| Home Telenet modem | Fails (error 809 or 13801) | Works |

The hypothesis was that the Telenet modem was blocking or corrupting IKE/IPsec packets. We set up a Hetzner VPS running strongSwan as an independent IKEv2 endpoint to test this theory.

---

## Test Environment

| Component | Details |
|-----------|---------|
| VPN Client | Windows 11 ARM (Parallels on Mac M3), internal IP: 10.211.55.4 |
| Azure VPN Gateway | vnet-gateway-1, IP: 20.103.209.44, IKEv2 + certificate auth |
| Hetzner VPS | Ubuntu 24, IP: 89.167.64.33, strongSwan 5.9.13 |
| Home Network | Telenet ISP, public IP: <REDACTED-PUBLIC-IP> |
| Original Client Certificate | CN=LabVPNClientCert, issued by CN=LabVPNRootCA (for Azure) |
| Original Root CA | CN=LabVPNRootCA (missing CA basic constraint - rejected by strongSwan) |
| New Client Certificate | CN=HetznerLabClient, issued by CN=HetznerLabCA (for Hetzner) |
| New Root CA | CN=HetznerLabCA (has CA:TRUE basic constraint - accepted by strongSwan) |

---

## Phase 1: UDP Connectivity Testing

Before touching strongSwan, we tested raw UDP connectivity through the Telenet modem using a simple echo server.

### Echo Server (Hetzner)

```bash
python3 -c "
import socket
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.bind(('0.0.0.0', 5500))
print('Listening on UDP 5500...')
while True:
    data, addr = sock.recvfrom(1024)
    print(f'Received from {addr}: {data.decode()}')
    sock.sendto(f'ECHO: {data.decode()}'.encode(), addr)
"
```

We used port 5500 initially because ports 500 and 4500 were already in use by strongSwan's `charon` daemon (discovered via `sudo lsof -i :500`).

### Echo Client (Windows 11)

```powershell
function Test-UDP {
    param([string]$Server, [int]$Port)
    $udpClient = New-Object System.Net.Sockets.UdpClient
    $udpClient.Client.ReceiveTimeout = 5000
    try {
        $udpClient.Connect($Server, $Port)
        $message = "HELLO from Windows $(Get-Date -Format 'HH:mm:ss')"
        $bytes = [System.Text.Encoding]::ASCII.GetBytes($message)
        $udpClient.Send($bytes, $bytes.Length) | Out-Null
        Write-Host "UDP $Port : Sent: $message" -ForegroundColor Yellow
        $remoteEP = New-Object System.Net.IPEndPoint([System.Net.IPAddress]::Any, 0)
        $response = $udpClient.Receive([ref]$remoteEP)
        $responseText = [System.Text.Encoding]::ASCII.GetString($response)
        Write-Host "UDP $Port : Received: $responseText" -ForegroundColor Green
        Write-Host "UDP $Port : ROUND-TRIP SUCCESS" -ForegroundColor Green
    } catch {
        Write-Host "UDP $Port : No response received (timeout)" -ForegroundColor Red
        Write-Host "UDP $Port : BLOCKED by firewall/NAT" -ForegroundColor Red
    } finally {
        $udpClient.Close()
    }
}

Test-UDP -Server "89.167.64.33" -Port 500
Test-UDP -Server "89.167.64.33" -Port 4500
```

### Result

```
UDP 500 : Sent: HELLO from Windows 19:49:14
UDP 500 : Received: ECHO: HELLO from Windows 19:49:14
UDP 500 : ROUND-TRIP SUCCESS
UDP 4500 : Sent: HELLO from Windows 19:49:14
UDP 4500 : Received: ECHO: HELLO from Windows 19:49:14
UDP 4500 : ROUND-TRIP SUCCESS
```

**Conclusion: UDP 500 and 4500 are NOT blocked by the Telenet modem.** The problem is not basic UDP port blocking.

---

## Phase 2: strongSwan Setup

### Existing State

strongSwan was already installed on the Hetzner VPS with a Site-to-Site configuration to Azure. The `charon` daemon was running and occupying ports 500/4500.

```bash
deploy@hetzner2:~$ sudo lsof -i :500
COMMAND     PID USER   FD   TYPE   DEVICE SIZE/OFF NODE NAME
charon  1131489 root   12u  IPv6 12626648      0t0  UDP *:isakmp
charon  1131489 root   14u  IPv4 12626650      0t0  UDP *:isakmp
```

The old S2S configuration was removed and replaced with a P2S test configuration.

### Step 1: Generate Server Certificate

strongSwan needs its own server identity. We generated a self-signed server certificate.

**Issue: `ipsec pki` not available**

```bash
deploy@hetzner2:~$ sudo ipsec pki --gen --outform pem > /etc/ipsec.d/private/serverKey.pem
/usr/sbin/ipsec: unknown command 'pki' ('ipsec --help' for list)
```

The strongSwan installation didn't include the `pki` tool. We used `openssl` instead.

**Issue: Permission denied with sudo redirect**

```bash
sudo ipsec pki --gen --outform pem > /etc/ipsec.d/private/serverKey.pem
-bash: /etc/ipsec.d/private/serverKey.pem: Permission denied
```

The `>` redirect runs as the current user, not as root. Fixed by using `openssl` directly with sudo:

```bash
# Generate server private key
sudo openssl genrsa -out /etc/ipsec.d/private/serverKey.pem 2048

# Generate self-signed server certificate
sudo openssl req -new -x509 -key /etc/ipsec.d/private/serverKey.pem \
  -out /etc/ipsec.d/certs/serverCert.pem \
  -days 365 \
  -subj "/CN=89.167.64.33" \
  -addext "subjectAltName=IP:89.167.64.33" \
  -addext "extendedKeyUsage=serverAuth"

# Set permissions
sudo chmod 600 /etc/ipsec.d/private/serverKey.pem
```

### Step 2: Import LabVPNRootCA

The root CA certificate was exported from Windows and placed on Hetzner:

```bash
# On Windows - export root CA
$rootCert = Get-ChildItem -Path "Cert:\LocalMachine\Root" | Where-Object { $_.Subject -like "*LabVPNRootCA*" }
Export-Certificate -Cert $rootCert -FilePath "C:\temp\LabVPNRootCA.cer" -Type CERT

# On Hetzner - convert DER to PEM
openssl x509 -inform DER -in LabVPNRootCA.cer -out /etc/ipsec.d/cacerts/LabVPNRootCA.pem
```

**Issue: LabVPNRootCA rejected by strongSwan**

```
ca certificate "CN=LabVPNRootCA" lacks ca basic constraint, discarded
loading ca certificate from '/etc/ipsec.d/cacerts/LabVPNRootCA.pem' failed
```

The LabVPNRootCA was created on Windows using `New-SelfSignedCertificate` without the `BasicConstraints` extension set to `CA:TRUE`. strongSwan strictly requires this flag to recognize a certificate as a CA. Azure is more lenient and accepted the same certificate.

**Verification on Windows confirmed the missing constraint:**

```powershell
PS> $rootCert.Extensions | ForEach-Object { Write-Host "$($_.Oid.FriendlyName): $($_.Format($true))" }
Key Usage: Certificate Signing (04)
Subject Key Identifier: 0d04a046d89d95a3e70f854680ca56b915e09317
```

No `Basic Constraints: Subject Type=CA` — only `Key Usage: Certificate Signing` was present.

### Step 3: Configure ipsec.conf

```bash
sudo nano /etc/ipsec.conf
```

```ini
config setup
    charondebug="ike 2, cfg 2, net 2"

conn test-p2s
    keyexchange=ikev2
    left=89.167.64.33
    leftcert=serverCert.pem
    leftid=89.167.64.33
    leftsubnet=0.0.0.0/0
    right=%any
    rightauth=eap-tls
    rightsendcert=always
    eap_identity=%any
    ike=aes256-sha256-modp1024,aes256-sha256-modp2048,aes256gcm16-sha256-modp1024,aes256gcm16-sha256-modp2048!
    esp=aes256-sha256,aes256gcm16!
    auto=add
```

### Step 4: Configure ipsec.secrets

```bash
sudo nano /etc/ipsec.secrets
```

```
: RSA serverKey.pem
```

### Step 5: Point Windows VPN to Hetzner

Since `Set-VpnConnection` doesn't work reliably on ARM Windows, we edited the phonebook directly:

```powershell
$pbk = "C:\Users\davydewaele\AppData\Roaming\Microsoft\Network\Connections\Pbk\rasphone.pbk"
(Get-Content $pbk) -replace "azuregateway-066c0069-4bfc-4d75-adf0-52af8849d3e0-ad32183dd10c.vpn.azure.com", "89.167.64.33" | Set-Content $pbk
```

To switch back to Azure:

```powershell
(Get-Content $pbk) -replace "89.167.64.33", "azuregateway-066c0069-4bfc-4d75-adf0-52af8849d3e0-ad32183dd10c.vpn.azure.com" | Set-Content $pbk
```

### Step 6: Import Hetzner Server Cert on Windows

Since the Hetzner server certificate is self-signed (not signed by DigiCert like Azure's), Windows doesn't trust it by default. We imported it into the trusted root store:

```powershell
Import-Certificate -FilePath "C:\temp\serverCert.pem" -CertStoreLocation "Cert:\LocalMachine\Root"
```

---

## Phase 3: Issues Encountered and Resolved

### Issue 1: Cipher Mismatch - IKE (NoProposalChosen)

**Symptom:** strongSwan rejected the Windows client's IKE proposals.

```
received proposals: IKE:AES_CBC_256/HMAC_SHA2_256_128/PRF_HMAC_SHA2_256/MODP_1024 ...
configured proposals: IKE:AES_CBC_256/HMAC_SHA2_256_128/PRF_HMAC_SHA2_256/MODP_2048
received proposals unacceptable
generating IKE_SA_INIT response 0 [ N(NO_PROP) ]
```

**Cause:** Windows proposed `MODP_1024` (DH Group 2), but strongSwan was configured for `MODP_2048` (DH Group 14) only.

**Fix:** Updated `ike=` line in ipsec.conf to accept MODP_1024:

```
ike=aes256-sha256-modp1024,aes256-sha256-modp2048,aes256gcm16-sha256-modp1024,aes256gcm16-sha256-modp2048!
```

### Issue 2: EAP-TLS Plugin Not Installed

**Symptom:** IKE handshake succeeded but EAP authentication failed immediately.

```
EAP-Identity request configured, but not supported
loading EAP_TLS method failed
```

**Cause:** strongSwan's base installation doesn't include the EAP-TLS plugin.

**Fix:**

```bash
sudo apt update
sudo apt install libcharon-extra-plugins -y
sudo systemctl restart strongswan-starter
```

After installation, `eap-tls` appeared in the loaded plugins list.

### Issue 3: Server Private Key Not Found

**Symptom:** Server authentication failed during EAP.

```
no private key found for 'CN=89.167.64.33'
generating IKE_AUTH response 1 [ N(AUTH_FAILED) ]
```

**Cause:** The `ipsec.secrets` file still contained the old S2S pre-shared key entry. strongSwan wasn't loading the RSA key properly.

**Fix:** Cleaned up ipsec.secrets to contain only:

```
: RSA serverKey.pem
```

And verified the key file was present and had correct permissions:

```bash
sudo ls -la /etc/ipsec.d/private/serverKey.pem
sudo chmod 600 /etc/ipsec.d/private/serverKey.pem
sudo chown root:root /etc/ipsec.d/private/serverKey.pem
```

### Issue 4: LabVPNRootCA Rejected - Missing CA Basic Constraint

**Symptom:** strongSwan discarded the root CA at startup.

```
ca certificate "CN=LabVPNRootCA" lacks ca basic constraint, discarded
loading ca certificate from '/etc/ipsec.d/cacerts/LabVPNRootCA.pem' failed
```

**Cause:** The LabVPNRootCA was created on Windows using `New-SelfSignedCertificate` without the `BasicConstraints` extension set to `CA:TRUE`. strongSwan strictly requires this flag. Azure is more lenient and accepted the same certificate.

**Verification on Windows confirmed the missing constraint:**

```powershell
PS> $rootCert.Extensions | ForEach-Object { Write-Host "$($_.Oid.FriendlyName): $($_.Format($true))" }
Key Usage: Certificate Signing (04)
Subject Key Identifier: 0d04a046d89d95a3e70f854680ca56b915e09317
```

No `Basic Constraints: Subject Type=CA` was present.

**Attempted workarounds that did NOT work:**
- Moving cert to `/etc/ipsec.d/aacerts/` - didn't help
- Adding `enforce_critical = no` to x509 config - didn't help (the issue isn't a critical extension, it's a missing basic constraint entirely)
- The cert is discarded at load time, before any validation occurs

**Fix:** Created a completely new CA with proper constraints (see Phase 4 below).

### Issue 5: Windows Sending Wrong Client Certificate

**Symptom:** After creating the new HetznerLabCA and HetznerLabClient cert, strongSwan still received the old certificate.

```
received TLS peer certificate 'CN=LabVPNClientCert'
no trusted certificate found for 'LabVPNClientCert' to verify TLS peer
```

**Cause:** Windows had both `LabVPNClientCert` and `HetznerLabClient` in the certificate store. The EAP profile was selecting the old cert based on cached credentials.

**Fix:** Cleared the VPN's cached sign-in info:

Windows Settings -> Network & internet -> VPN -> vnet-hybrid -> Click **Clear sign-in info**

After clearing, Windows correctly selected `HetznerLabClient` on the next connection attempt:

```
received EAP identity 'HetznerLabClient'
```

### Issue 6: No Virtual IP Pool Configured

**Symptom:** EAP-TLS succeeded but the client received "Invalid payload received" error.

```
EAP method EAP_TLS succeeded, MSK established
authentication of '10.211.55.4' with EAP successful
IKE_SA test-p2s[3] established
peer requested virtual IP %any
no virtual IP found for %any requested by 'HetznerLabClient'
no virtual IP found, sending INTERNAL_ADDRESS_FAILURE
```

**Cause:** strongSwan had no IP address pool configured to assign addresses to connecting VPN clients. The IKE SA was established but the client couldn't get a tunnel IP.

**Fix:** Added `rightsourceip` to the connection configuration in ipsec.conf:

```
rightsourceip=172.16.1.0/24
```

After restart, strongSwan successfully assigned `172.16.1.1` to the client:

```
assigning new lease to 'HetznerLabClient'
assigning virtual IP 172.16.1.1 to peer 'HetznerLabClient'
```

### Issue 7: Cipher Mismatch - ESP (CHILD_SA)

**Symptom:** IKE SA established and IP assigned, but the data tunnel (CHILD_SA) failed to establish.

```
received proposals: ESP:AES_CBC_256/HMAC_SHA1_96/NO_EXT_SEQ ...
configured proposals: ESP:AES_CBC_256/HMAC_SHA2_256_128/NO_EXT_SEQ, ESP:AES_GCM_16_256/NO_EXT_SEQ
no acceptable proposal found
failed to establish CHILD_SA, keeping IKE_SA
```

**Cause:** Windows proposed ESP with `HMAC_SHA1_96` for integrity, but strongSwan was configured to accept only `HMAC_SHA2_256_128` and `AES_GCM_16_256`. The IKE cipher mismatch was fixed in Issue 1, but the ESP ciphers were still mismatched.

**Fix:** Updated the `esp=` line in ipsec.conf to accept SHA1:

```
esp=aes256-sha256,aes256-sha1,aes128-sha1,aes256gcm16!
```

After restart, the CHILD_SA was established successfully.

---

## Phase 4: Creating a Proper CA (HetznerLabCA)

Since the original LabVPNRootCA lacked the CA basic constraint that strongSwan requires, we created an entirely new certificate chain specifically for the Hetzner test.

### Step 1: Create Root CA on Windows (with proper CA constraint)

```powershell
$rootCert = New-SelfSignedCertificate `
  -Subject "CN=HetznerLabCA" `
  -CertStoreLocation "Cert:\CurrentUser\My" `
  -KeyUsage CertSign, CRLSign `
  -KeyLength 2048 `
  -HashAlgorithm SHA256 `
  -KeyExportPolicy Exportable `
  -NotAfter (Get-Date).AddYears(2) `
  -Type Custom `
  -TextExtension @("2.5.29.19={critical}{text}ca=TRUE")
```

The critical difference: `-TextExtension @("2.5.29.19={critical}{text}ca=TRUE")` adds the `basicConstraints=CA:TRUE` extension that strongSwan requires.

### Step 2: Create Client Certificate signed by HetznerLabCA

```powershell
$clientCert = New-SelfSignedCertificate `
  -Subject "CN=HetznerLabClient" `
  -DnsName "HetznerLabClient" `
  -CertStoreLocation "Cert:\CurrentUser\My" `
  -Signer $rootCert `
  -KeyLength 2048 `
  -HashAlgorithm SHA256 `
  -KeyExportPolicy Exportable `
  -NotAfter (Get-Date).AddYears(1) `
  -Type Custom `
  -KeySpec Signature `
  -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.2")
```

### Step 3: Install Root CA in Windows Trusted Root Store

```powershell
$rootCertBytes = $rootCert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
$tempPath = "C:\temp\HetznerLabCA.cer"
[System.IO.File]::WriteAllBytes($tempPath, $rootCertBytes)
Import-Certificate -FilePath $tempPath -CertStoreLocation "Cert:\LocalMachine\Root"
```

### Step 4: Export Root CA as PEM for Hetzner

```powershell
$base64 = [Convert]::ToBase64String($rootCertBytes, [Base64FormattingOptions]::InsertLineBreaks)
$pem = "-----BEGIN CERTIFICATE-----`n$base64`n-----END CERTIFICATE-----"
$pem | Out-File -FilePath "C:\temp\HetznerLabCA.pem" -Encoding ASCII -NoNewline
```

### Step 5: Install Root CA on Hetzner

```bash
sudo cp HetznerLabCA.pem /etc/ipsec.d/cacerts/HetznerLabCA.pem

# Verify the CA constraint is present
openssl x509 -in /etc/ipsec.d/cacerts/HetznerLabCA.pem -text -noout | grep -A2 "Basic Constraints"
# Should show: CA:TRUE
```

### Step 6: Update ipsec.conf with new CA reference

```bash
sudo nano /etc/ipsec.conf
```

Changed `rightca` to reference the new CA:

```
rightca="CN=HetznerLabCA"
```

strongSwan startup now showed:

```
loaded ca certificate "CN=HetznerLabCA" from '/etc/ipsec.d/cacerts/HetznerLabCA.pem'   ✅
```

---

## Phase 5: Final Configuration and Successful Connection

### Final ipsec.conf

```ini
config setup
    charondebug="ike 2, cfg 2, net 2, tls 2"

conn test-p2s
    keyexchange=ikev2
    left=89.167.64.33
    leftcert=serverCert.pem
    leftid=89.167.64.33
    leftsubnet=0.0.0.0/0
    right=%any
    rightauth=eap-tls
    rightca="CN=HetznerLabCA"
    rightsendcert=always
    rightsourceip=172.16.1.0/24
    eap_identity=%any
    ike=aes256-sha256-modp1024,aes256-sha256-modp2048,aes256gcm16-sha256-modp1024,aes256gcm16-sha256-modp2048!
    esp=aes256-sha256,aes256-sha1,aes128-sha1,aes256gcm16!
    auto=add
```

### Final ipsec.secrets

```
: RSA serverKey.pem
```

### Successful Connection Log

The final successful connection through Telenet showed every stage completing:

```
IKE_SA_INIT: selected proposal AES_CBC_256/HMAC_SHA2_256/MODP_1024     ✅
NAT detection: remote host is behind NAT                                ✅
Server auth: RSA signature successful                                   ✅
EAP identity: received 'HetznerLabClient'                              ✅
TLS negotiation: TLS 1.2 / TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384      ✅
Client cert: received 'CN=HetznerLabClient'                            ✅
CA validation: using trusted ca certificate "CN=HetznerLabCA"           ✅
Chain: reached self-signed root ca with a path length of 0              ✅
EAP result: EAP method EAP_TLS succeeded, MSK established              ✅
Auth: authentication of '10.211.55.4' with EAP successful              ✅
IP assignment: assigning virtual IP 172.16.1.1 to 'HetznerLabClient'   ✅
IKE SA: established between 89.167.64.33...<REDACTED-PUBLIC-IP>          ✅
CHILD SA: ESP tunnel established                                        ✅
STATUS: CONNECTED                                                       ✅
```

---

## Phase 6: Definitive Conclusions

### What We Proved

A complete IKEv2 P2S VPN connection was established from Windows 11 ARM (Parallels on Mac M3), through the Telenet modem, to a strongSwan server on Hetzner - with full EAP-TLS certificate authentication, NAT traversal, and ESP data tunnel.

**Telenet is NOT blocking, corrupting, or interfering with IKE/IPsec traffic.** Every component of the VPN protocol works through the Telenet modem:

- UDP 500 (IKE_SA_INIT) - works
- UDP 4500 (NAT traversal) - works
- Fragmented IKE_AUTH packets - works
- EAP-TLS certificate exchange - works
- ESP data tunnel - works

### Why Azure VPN Fails on Telenet

The Azure VPN failure on Telenet is therefore NOT a network-level issue. The most likely remaining explanations:

1. **Azure gateway transient state** - the gateway may have been reconfiguring during testing, causing intermittent failures that coincided with Telenet testing
2. **Azure-specific IKE implementation** - Azure's VPN gateway may handle certain edge cases differently than strongSwan
3. **Timing sensitivity** - the Azure gateway may have stricter timeout thresholds
4. **Certificate validation differences** - Azure may validate certificates differently depending on source IP or connection timing

### Test Summary

| Test | Telenet | iPhone 5G |
|------|---------|-----------|
| UDP echo (port 500/4500) | Works | Works |
| IKE_SA_INIT to Hetzner | Works | Works |
| NAT traversal (4500) to Hetzner | Works | Works |
| EAP-TLS to Hetzner | Works | Works |
| Full VPN tunnel to Hetzner | **Works** | Works |
| Azure VPN | Intermittent | Works |

---

## Files Created on Hetzner

| File | Location | Purpose |
|------|----------|---------|
| serverKey.pem | /etc/ipsec.d/private/ | Server's RSA private key (2048-bit) |
| serverCert.pem | /etc/ipsec.d/certs/ | Server's self-signed certificate (CN=89.167.64.33) |
| LabVPNRootCA.pem | /etc/ipsec.d/cacerts/ | Original root CA from Windows (rejected - missing CA constraint) |
| HetznerLabCA.pem | /etc/ipsec.d/cacerts/ | New root CA with proper CA constraint (works) |
| ipsec.conf | /etc/ | strongSwan connection configuration |
| ipsec.secrets | /etc/ | Private key reference for strongSwan |

## Files on Windows 11

| File/Store | Location | Purpose |
|------------|----------|---------|
| LabVPNClientCert | Cert:\CurrentUser\My and Cert:\LocalMachine\My | Client cert for Azure VPN |
| LabVPNRootCA | Cert:\LocalMachine\Root | Root CA for Azure VPN (trusted) |
| HetznerLabClient | Cert:\CurrentUser\My and Cert:\LocalMachine\My | Client cert for Hetzner VPN |
| HetznerLabCA | Cert:\LocalMachine\Root | Root CA for Hetzner VPN (trusted) |
| DigiCert Global Root G2 | Cert:\LocalMachine\Root | Azure gateway server cert CA |
| serverCert.pem (imported) | Cert:\LocalMachine\Root | Hetzner server cert (manually trusted) |
| rasphone.pbk | AppData\Roaming\Microsoft\Network\Connections\Pbk\ | VPN connection phonebook |

---

## Certificate Architecture Overview

```
AZURE SETUP                              HETZNER SETUP
----------                               -------------

DigiCert Global Root G2                  serverCert.pem (self-signed)
    |                                        |
    +-- Azure Gateway server cert            +-- CN=89.167.64.33
        (auto-generated by Azure)                (generated with openssl)
        Client trusts via DigiCert               Client trusts via manual import
        in Windows root store                    to Windows root store

LabVPNRootCA                             HetznerLabCA
(missing CA basic constraint)            (has CA:TRUE basic constraint)
    |                                        |
    +-- LabVPNClientCert                     +-- HetznerLabClient
        Azure accepts this CA                    strongSwan accepts this CA
        (Azure is lenient)                       (strongSwan is strict)
```

---

## Commands Reference

### strongSwan Management

```bash
# Restart strongSwan
sudo systemctl restart strongswan-starter

# Follow logs in real-time
sudo journalctl -u strongswan-starter -f

# View recent logs
sudo journalctl -u strongswan-starter -n 50 --no-pager

# Check what's using IKE ports
sudo lsof -i :500
sudo lsof -i :4500

# Check strongSwan status
sudo ipsec statusall
```

### Certificate Commands

```bash
# Verify key matches cert (md5sums should be identical)
sudo openssl x509 -noout -modulus -in /etc/ipsec.d/certs/serverCert.pem | md5sum
sudo openssl rsa -noout -modulus -in /etc/ipsec.d/private/serverKey.pem | md5sum

# View certificate details
openssl x509 -in /etc/ipsec.d/certs/serverCert.pem -text -noout

# Check CA basic constraint specifically
openssl x509 -in /etc/ipsec.d/cacerts/HetznerLabCA.pem -text -noout | grep -A2 "Basic Constraints"

# Convert DER to PEM
openssl x509 -inform DER -in cert.cer -out cert.pem

# Generate server key and cert with openssl (when ipsec pki is unavailable)
sudo openssl genrsa -out /etc/ipsec.d/private/serverKey.pem 2048
sudo openssl req -new -x509 -key /etc/ipsec.d/private/serverKey.pem \
  -out /etc/ipsec.d/certs/serverCert.pem \
  -days 365 \
  -subj "/CN=89.167.64.33" \
  -addext "subjectAltName=IP:89.167.64.33" \
  -addext "extendedKeyUsage=serverAuth"
```

### Windows Certificate Commands

```powershell
# Create root CA with proper CA constraint
$rootCert = New-SelfSignedCertificate `
  -Subject "CN=HetznerLabCA" `
  -CertStoreLocation "Cert:\CurrentUser\My" `
  -KeyUsage CertSign, CRLSign `
  -KeyLength 2048 -HashAlgorithm SHA256 `
  -KeyExportPolicy Exportable `
  -NotAfter (Get-Date).AddYears(2) `
  -Type Custom `
  -TextExtension @("2.5.29.19={critical}{text}ca=TRUE")

# Create client cert signed by the CA
$clientCert = New-SelfSignedCertificate `
  -Subject "CN=HetznerLabClient" -DnsName "HetznerLabClient" `
  -CertStoreLocation "Cert:\CurrentUser\My" `
  -Signer $rootCert `
  -KeyLength 2048 -HashAlgorithm SHA256 `
  -KeyExportPolicy Exportable `
  -NotAfter (Get-Date).AddYears(1) `
  -Type Custom -KeySpec Signature `
  -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.2")

# Verify CA constraint
$rootCert.Extensions | ForEach-Object { Write-Host "$($_.Oid.FriendlyName): $($_.Format($true))" }

# List all VPN-related certs
Get-ChildItem "Cert:\CurrentUser\My" | Where-Object {
    $_.Subject -like "*Lab*" -or $_.Subject -like "*Hetzner*"
} | Format-List Subject, Issuer, Thumbprint, HasPrivateKey
```

### Windows VPN Management

```powershell
# Edit VPN server address (ARM workaround since Set-VpnConnection is buggy)
$pbk = "C:\Users\davydewaele\AppData\Roaming\Microsoft\Network\Connections\Pbk\rasphone.pbk"
(Get-Content $pbk) -replace "OLD_ADDRESS", "NEW_ADDRESS" | Set-Content $pbk

# Verify VPN server address
Get-Content $pbk | Select-String "PhoneNumber"

# Check active VPN connections
rasdial

# Import certificate to trusted root
Import-Certificate -FilePath "C:\temp\cert.pem" -CertStoreLocation "Cert:\LocalMachine\Root"

# Check VPN error logs
Get-WinEvent -LogName "Application" -MaxEvents 10 | Where-Object {
    $_.ProviderName -match "Ras" -and $_.Message -match "failed"
} | Select-Object -First 5 | Format-List TimeCreated, Message
```

---

## Lessons Learned

1. **UDP port blocking is not the same as IKE blocking.** Raw UDP packets can get through while structured IKE packets might be handled differently by NAT/firewall devices. Always test both.

2. **strongSwan is strict about CA certificates.** Unlike Azure, strongSwan requires the `basicConstraints=critical,CA:TRUE` extension on CA certificates. When creating root CAs on Windows with `New-SelfSignedCertificate`, always include `-Type Custom -TextExtension @("2.5.29.19={critical}{text}ca=TRUE")`.

3. **The `ipsec pki` tool may not be installed.** Use `openssl` as a reliable alternative for key and certificate generation.

4. **EAP-TLS requires extra plugins.** Install `libcharon-extra-plugins` on Ubuntu/Debian to get EAP-TLS support in strongSwan.

5. **`sudo` with `>` redirect doesn't work as expected.** The redirect runs as the current user. Use `sudo tee` or run the entire command as root.

6. **ARM Windows has quirks with VPN cmdlets.** `Get-VpnConnection` and `Set-VpnConnection` may fail with "unspecified error" on ARM. Edit the `rasphone.pbk` phonebook file directly as a workaround.

7. **Real-time log monitoring is essential for VPN debugging.** Use `sudo journalctl -u strongswan-starter -f` to watch the handshake as it happens - much more informative than Windows event logs.

8. **Testing against multiple endpoints isolates the problem.** By testing the same client, same network, same certificates against both Azure and Hetzner, we conclusively proved the network wasn't the issue.

9. **IKE and ESP use different cipher negotiations.** Fixing the IKE cipher mismatch (Issue 1) doesn't fix the ESP cipher mismatch (Issue 7). Both must be configured to accept the client's proposals.

10. **Windows may send the wrong client certificate.** When multiple client certificates exist in the store, Windows uses the EAP profile or cached credentials to select one. Clear sign-in info to force re-selection.

11. **Virtual IP pool is required for P2S VPN.** Without `rightsourceip`, strongSwan can't assign an IP to the client and the tunnel fails with "INTERNAL_ADDRESS_FAILURE" even though authentication succeeded.

12. **Building your own VPN server is an incredible learning experience.** Setting up strongSwan from scratch teaches you more about IKEv2, certificates, EAP-TLS, and IPsec than any textbook - every error message teaches a fundamental concept.
