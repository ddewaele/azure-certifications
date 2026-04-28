# Quick HTTP Identity Server

Spin up a tiny web server on an Azure VM that responds with its hostname, internal IP, and external IP. Useful when testing:

- Load balancer distribution (see which backend VM is responding)
- VNet peering and routing (confirm you're hitting the right VM)
- Hub-spoke transit via an NVA
- Application Gateway backend health

No dependencies beyond what ships on Ubuntu — just Python 3.

---

## Variables

```bash
RG=rg-network-lab
VM=vm-spoke
NSG=vm-spokeNSG
STORAGE_ACCOUNT=mystorageacct
LB_IP=1.2.3.4       # load balancer or VM public IP (for testing)
```

---

## Option 1: Python one-liner (quickest)

Run directly on the VM. Serves on port 80 (or change to any port).

```bash
sudo python3 -c "
import http.server, socket, os

PORT = 80
HOSTNAME = socket.gethostname()
INTERNAL_IP = socket.gethostbyname(HOSTNAME)

class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        body = f'''<html><body style=\"font-family:monospace;font-size:1.2em;padding:2em\">
<h2>&#128204; {HOSTNAME}</h2>
<p><b>Internal IP:</b> {INTERNAL_IP}</p>
</body></html>'''.encode()
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.send_header('Content-Length', len(body))
        self.end_headers()
        self.wfile.write(body)
    def log_message(self, fmt, *args):
        print(f'[{self.client_address[0]}] {fmt % args}')

print(f'Serving on port {PORT} — hostname: {HOSTNAME}, internal IP: {INTERNAL_IP}')
http.server.HTTPServer(('', PORT), Handler).serve_forever()
"
```

Use port 8080 to avoid needing `sudo`:

```bash
python3 -c "..." # same script, change PORT = 8080
```

---

## Option 2: Script with external IP from Azure IMDS

The Azure Instance Metadata Service (IMDS) at `169.254.169.254` is available from inside every Azure VM. Use it to get the VM's public IP without an outbound curl to the internet.

Save this as `/tmp/idserver.py` and run it:

```bash
cat << 'EOF' > /tmp/idserver.py
import http.server
import socket
import urllib.request
import json

PORT = 80
HOSTNAME = socket.gethostname()
INTERNAL_IP = socket.gethostbyname(HOSTNAME)

def get_metadata():
    """Fetch VM identity from Azure Instance Metadata Service."""
    try:
        req = urllib.request.Request(
            "http://169.254.169.254/metadata/instance?api-version=2021-02-01&format=json",
            headers={"Metadata": "true"}
        )
        with urllib.request.urlopen(req, timeout=2) as resp:
            data = json.loads(resp.read())
        net = data["network"]["interface"][0]["ipv4"]["ipAddress"][0]
        return {
            "public_ip":  net.get("publicIpAddress", "none / no public IP"),
            "private_ip": net.get("privateIpAddress", INTERNAL_IP),
            "vm_name":    data["compute"].get("name", HOSTNAME),
            "location":   data["compute"].get("location", "unknown"),
            "vm_size":    data["compute"].get("vmSize", "unknown"),
        }
    except Exception as e:
        return {
            "public_ip":  "unavailable",
            "private_ip": INTERNAL_IP,
            "vm_name":    HOSTNAME,
            "location":   "unknown",
            "vm_size":    "unknown",
        }

META = get_metadata()

class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        body = f"""<html>
<head><title>{META['vm_name']}</title></head>
<body style="font-family:monospace;font-size:1.1em;padding:2em;background:#f5f5f5">
  <h2>&#128204; {META['vm_name']}</h2>
  <table cellpadding="6">
    <tr><td><b>Private IP</b></td><td>{META['private_ip']}</td></tr>
    <tr><td><b>Public IP</b></td><td>{META['public_ip']}</td></tr>
    <tr><td><b>Location</b></td><td>{META['location']}</td></tr>
    <tr><td><b>VM size</b></td><td>{META['vm_size']}</td></tr>
  </table>
</body></html>""".encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/html")
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        print(f"[{self.client_address[0]}] {fmt % args}")

print(f"Serving on :{PORT}  vm={META['vm_name']}  private={META['private_ip']}  public={META['public_ip']}")
http.server.HTTPServer(("", PORT), Handler).serve_forever()
EOF

sudo python3 /tmp/idserver.py
```

---

## Option 3: Deploy via Custom Script Extension (no SSH needed)

Deploy the server to a VM without connecting to it first — useful when the VM has no public IP.

```bash
# Inline script passed to the extension
SCRIPT=$(cat << 'SCRIPT'
cat << 'PY' > /tmp/idserver.py
import http.server, socket, urllib.request, json
PORT = 80
HOSTNAME = socket.gethostname()
INTERNAL_IP = socket.gethostbyname(HOSTNAME)
def get_meta():
    try:
        req = urllib.request.Request(
            "http://169.254.169.254/metadata/instance?api-version=2021-02-01&format=json",
            headers={"Metadata":"true"})
        data = json.loads(urllib.request.urlopen(req,timeout=2).read())
        n = data["network"]["interface"][0]["ipv4"]["ipAddress"][0]
        return n.get("privateIpAddress", INTERNAL_IP), n.get("publicIpAddress","none"), data["compute"].get("name",HOSTNAME)
    except:
        return INTERNAL_IP, "unavailable", HOSTNAME
PRIV, PUB, NAME = get_meta()
class H(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        b = f"<h2>{NAME}</h2><p>Private: {PRIV}</p><p>Public: {PUB}</p>".encode()
        self.send_response(200); self.send_header("Content-Type","text/html"); self.send_header("Content-Length",len(b)); self.end_headers(); self.wfile.write(b)
    def log_message(self,*a): pass
http.server.HTTPServer(("",PORT),H).serve_forever()
PY
nohup python3 /tmp/idserver.py > /var/log/idserver.log 2>&1 &
SCRIPT
)

az vm extension set \
  --publisher Microsoft.Azure.Extensions \
  --name CustomScript \
  --version 2.1 \
  --vm-name $VM \
  --resource-group $RG \
  --settings "{\"commandToExecute\": \"$(echo "$SCRIPT" | base64 -w0 | xargs -I{} echo 'echo {} | base64 -d | bash')\"}"
```

Or the simpler approach — put the script in Blob Storage and reference it:

```bash
# Upload script to storage
az storage blob upload \
  --account-name $STORAGE_ACCOUNT \
  --container-name scripts \
  --name idserver.py \
  --file /tmp/idserver.py

# Deploy via CSE
az vm extension set \
  --publisher Microsoft.Azure.Extensions \
  --name CustomScript \
  --version 2.1 \
  --vm-name $VM \
  --resource-group $RG \
  --settings "{\"fileUris\":[\"https://$STORAGE_ACCOUNT.blob.core.windows.net/scripts/idserver.py\"],\"commandToExecute\":\"sudo python3 idserver.py\"}"
```

---

## Option 4: Run in background with nohup

All options above block the terminal. To run in the background and disconnect:

```bash
# Background with nohup (survives SSH disconnect)
nohup sudo python3 /tmp/idserver.py > /var/log/idserver.log 2>&1 &
echo "PID: $!"

# Tail the access log
tail -f /var/log/idserver.log

# Stop it
sudo kill $(sudo lsof -ti :80)
```

---

## Option 5: Persist with systemd (survives reboots)

`nohup` only survives SSH disconnects — it won't restart after a VM reboot. For that, create a systemd service.

**Step 1 — write the script to a stable path:**

```bash
sudo cp /tmp/idserver.py /opt/idserver.py
```

**Step 2 — create the service unit:**

```bash
sudo tee /etc/systemd/system/idserver.service << 'EOF'
[Unit]
Description=HTTP Identity Server
After=network.target

[Service]
ExecStart=/usr/bin/python3 /opt/idserver.py
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
```

> If you're using port 80 and running as a non-root user, either change `PORT` to 8080 or add `User=root` under `[Service]`.

**Step 3 — enable and start:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable idserver   # start on boot
sudo systemctl start idserver    # start now

# Check status
sudo systemctl status idserver

# Tail logs (systemd captures stdout automatically)
sudo journalctl -u idserver -f
```

**Manage it:**

```bash
sudo systemctl stop idserver
sudo systemctl restart idserver
sudo systemctl disable idserver   # remove from boot
```

---

## Testing from another VM or your machine

```bash
# From another VM in the same VNet
curl http://10.1.1.4

# From your local machine (if the VM has a public IP or LB frontend)
curl http://$LB_IP

# Hit all backend VMs behind a load balancer repeatedly — watch the hostname change
for i in $(seq 1 10); do curl -s http://$LB_IP | grep -o 'vm-[a-z0-9-]*'; done

# Loop with delay to watch LB distribution
watch -n1 "curl -s http://$LB_IP | grep -oP '(?<=📍 ).*(?=</h2>)'"
```

---

## Quick NSG note

If the VM has no NSG or a restrictive one, open the port first:

```bash
# Open port 80 inbound (or whichever port you're using)
az network nsg rule create \
  --nsg-name $NSG \
  --resource-group $RG \
  --name Allow-HTTP \
  --priority 200 \
  --direction Inbound \
  --access Allow \
  --protocol Tcp \
  --destination-port-range 80
```
