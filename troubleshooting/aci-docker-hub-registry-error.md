# Error: RegistryErrorResponse / InaccessibleImage (Docker Hub rate limit)

## Symptoms

```
(RegistryErrorResponse) An error response is received from the docker registry 'index.docker.io'. Please retry later.
Code: RegistryErrorResponse
Message: An error response is received from the docker registry 'index.docker.io'. Please retry later.
```

```
(InaccessibleImage) The image 'mcr.microsoft.com/mirror/docker/library/nginx:latest' in container group 'lab06-nginx' is not accessible.
Code: InaccessibleImage
Message: The image '...' in container group '...' is not accessible. Please check the image and registry credential.
```

Occurs when running `az container create` with a public Docker Hub image such as `nginx:latest`, or when using an MCR image path that does not exist.

## Why This Happens

Docker Hub enforces **pull rate limits** on anonymous requests:

- **Anonymous pulls** — 100 pulls per 6 hours, per source IP
- **Authenticated free accounts** — 200 pulls per 6 hours

Azure Container Instances pulls images from a **shared pool of outbound IPs**. Many ACI deployments across all Azure customers share those IPs, so the pull quota is exhausted quickly. Your container creation hits the rate limit even though you personally haven't pulled anything.

The `InaccessibleImage` error occurs when the image path itself is wrong — for example, `mcr.microsoft.com/mirror/docker/library/nginx` does **not** exist on MCR despite being widely referenced online.

## Fixes

### Option 1 — Use Microsoft's ACI demo image (quickest for labs)

Microsoft publishes a purpose-built demo image on MCR that runs a small HTTP server on port 80 and is designed specifically for ACI labs. It has no rate limits.

```bash
az container create \
  --resource-group $RESOURCE_GROUP \
  --name lab06-nginx \
  --image mcr.microsoft.com/azuredocs/aci-helloworld:latest \
  --ports 80 \
  --dns-name-label "az900-lab06-$(openssl rand -hex 4)" \
  --os-type Linux \
  --cpu 1 \
  --memory 1
```

This is not nginx, but it demonstrates the same ACI concepts (container creation, public IP, DNS label, port mapping). Use this when the goal is to learn ACI, not to run nginx specifically.

---

### Option 2 — Import into Azure Container Registry (ACR) and pull from there

`az acr import` fetches the image server-side from within Azure's network and stores it in your own ACR. ACI then pulls from ACR with no rate limits and no Docker Hub dependency.

```bash
# 1. Create an ACR (if you don't have one)
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name myregistry \
  --sku Basic

# 2. Import nginx from Docker Hub into ACR
#    --username and --password are required — acr import also uses Azure's shared IPs
#    and will hit the same Docker Hub rate limit if you omit credentials
az acr import \
  --name myregistry \
  --source docker.io/library/nginx:latest \
  --image nginx:latest \
  --username <your-docker-hub-username> \
  --password <your-docker-hub-access-token>

# 3. Get the ACR login server and credentials
ACR_SERVER=$(az acr show --name myregistry --query loginServer --output tsv)
az acr update --name myregistry --admin-enabled true
ACR_PASS=$(az acr credential show --name myregistry --query passwords[0].value --output tsv)

# 4. Create the container from your ACR image
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

> `az acr import` is server-side — Azure fetches the image directly from Docker Hub without going through your machine. This is also more reliable than a local `docker pull` + `docker push`.

---

### Option 3 — Authenticate with a Docker Hub account

Pass your Docker Hub credentials directly to ACI. Authenticated pulls are tied to your account rather than the shared ACI IP pool, so you get your own rate limit (200 pulls/6h on a free account).

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

> Use a Docker Hub **access token**, not your password: hub.docker.com → Account Settings → Security → New Access Token.

---

## Which Option to Use?

| Situation | Best option |
|---|---|
| Lab / learning ACI concepts, any web container will do | Option 1 — `aci-helloworld` |
| Need actual nginx (or any specific image) reliably | Option 2 — ACR import |
| Have a Docker Hub account and need a quick fix | Option 3 — Docker Hub credentials |
| Production workload | Option 2 — ACR (gives you versioning, scanning, geo-replication) |

## What Does NOT Work

| Path | Status |
|---|---|
| `mcr.microsoft.com/mirror/docker/library/nginx:latest` | ❌ Does not exist on MCR |
| `mcr.microsoft.com/azurelinux/base/nginx:1.28` | ⚠️ Exists, but is a base build image — does not start nginx automatically |
| `nginx:latest` without credentials from ACI | ❌ Rate limited on shared ACI IPs |
| `az acr import --source docker.io/...` without credentials | ❌ Also rate limited — ACR import uses the same shared Azure IPs |

## Notes

- Rate limit errors can be intermittent — if you hit them occasionally, retrying after a few minutes sometimes works, but it is not a reliable workaround.
- ACR (option 2) is the right approach for any real workload. It removes the Docker Hub dependency entirely.
