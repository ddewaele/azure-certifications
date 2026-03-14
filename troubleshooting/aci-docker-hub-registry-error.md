# Error: RegistryErrorResponse (Docker Hub rate limit)

## Symptom

```
(RegistryErrorResponse) An error response is received from the docker registry 'index.docker.io'. Please retry later.
Code: RegistryErrorResponse
Message: An error response is received from the docker registry 'index.docker.io'. Please retry later.
```

Occurs when running `az container create` with a public Docker Hub image such as `nginx:latest`.

## Why This Happens

Docker Hub enforces **pull rate limits** on anonymous requests:

- **Anonymous pulls** — 100 pulls per 6 hours, per source IP
- **Authenticated free accounts** — 200 pulls per 6 hours

Azure Container Instances pulls images from a **shared pool of outbound IPs**. Many ACI deployments across all Azure customers share those IPs, so the pull quota is exhausted quickly. Your container creation hits the rate limit even though you personally haven't pulled anything.

This is not an Azure bug — it is Docker Hub's rate limiting policy applied to Azure's shared egress addresses.

## Fixes

### Option 1 — Use an MCR-hosted image (quickest)

Microsoft mirrors common Docker Hub images on the Microsoft Container Registry (MCR), which has no pull rate limits for Azure resources. Swap the image name:

```bash
# Instead of:
--image nginx:latest

# Use the MCR mirror:
--image mcr.microsoft.com/mirror/docker/library/nginx:latest
```

Other useful MCR mirrors:
```bash
mcr.microsoft.com/mirror/docker/library/alpine:latest
mcr.microsoft.com/mirror/docker/library/ubuntu:22.04
mcr.microsoft.com/mirror/docker/library/python:3.11-slim
mcr.microsoft.com/mirror/docker/library/node:20-alpine
```

Full example:
```bash
az container create \
  --resource-group $RESOURCE_GROUP \
  --name lab06-nginx \
  --image mcr.microsoft.com/mirror/docker/library/nginx:latest \
  --ports 80 \
  --dns-name-label "az900-lab06-$(openssl rand -hex 4)" \
  --os-type Linux \
  --cpu 1 \
  --memory 1
```

---

### Option 2 — Authenticate with a Docker Hub account

A free Docker Hub account gets 200 authenticated pulls per 6 hours from its own account IP — bypassing the shared IP problem. Pass your credentials to ACI at container creation time.

```bash
az container create \
  --resource-group $RESOURCE_GROUP \
  --name lab06-nginx \
  --image nginx:latest \
  --ports 80 \
  --dns-name-label "az900-lab06-$(openssl rand -hex 4)" \
  --os-type Linux \
  --cpu 1 \
  --memory 1 \
  --registry-login-server index.docker.io \
  --registry-username <your-docker-hub-username> \
  --registry-password <your-docker-hub-access-token>
```

> Use a Docker Hub **access token** (not your password): log into hub.docker.com → Account Settings → Security → New Access Token.

---

### Option 3 — Push the image to Azure Container Registry (ACR)

Pull the image locally and push it to your own ACR instance. ACI can then pull from ACR without any rate limits, and the transfer stays within the Azure network.

```bash
# 1. Create an ACR (if you don't have one)
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name myregistry \
  --sku Basic

# 2. Import the Docker Hub image directly into ACR (no local docker needed)
az acr import \
  --name myregistry \
  --source docker.io/library/nginx:latest \
  --image nginx:latest

# 3. Get the ACR login server
ACR_SERVER=$(az acr show --name myregistry --query loginServer --output tsv)

# 4. Enable admin credentials on the ACR
az acr update --name myregistry --admin-enabled true
ACR_PASS=$(az acr credential show --name myregistry --query passwords[0].value --output tsv)

# 5. Create the container using your ACR image
az container create \
  --resource-group $RESOURCE_GROUP \
  --name lab06-nginx \
  --image $ACR_SERVER/nginx:latest \
  --ports 80 \
  --dns-name-label "az900-lab06-$(openssl rand -hex 4)" \
  --os-type Linux \
  --cpu 1 \
  --memory 1 \
  --registry-login-server $ACR_SERVER \
  --registry-username myregistry \
  --registry-password $ACR_PASS
```

> `az acr import` does the Docker Hub pull server-side from within Azure's network, which is more reliable than pulling from your laptop and re-pushing.

---

## Which Option to Use?

| Situation | Best option |
|---|---|
| Just want it to work quickly for a lab | Option 1 — MCR mirror |
| Need a specific Docker Hub image with no MCR mirror | Option 2 — Docker Hub credentials |
| Production workload / want full control over images | Option 3 — ACR |

## Notes

- The MCR mirror (`mcr.microsoft.com/mirror/docker/library/`) only covers official Docker Hub library images (nginx, alpine, ubuntu, python, node, etc.). Third-party images (e.g. `bitnami/nginx`) are not mirrored and require option 2 or 3.
- Rate limit errors can also occur intermittently even for authenticated users if Docker Hub itself is experiencing issues. If option 2 fails, wait a few minutes and retry.
- ACR (option 3) is the recommended approach for any real workload — it gives you control over image versions, scanning (Defender for Containers), and geo-replication.
