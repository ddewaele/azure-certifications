# Lab 06 — Azure Container Instances

**Concepts covered:** Containers vs VMs, serverless containers, ACI billing model, persistent storage, container groups

**Estimated cost:** ~$0.01–0.05 (containers billed per second — delete promptly)

---

## Background

Azure Container Instances (ACI) is the fastest way to run a container in Azure with zero infrastructure management:

| | Virtual Machine | ACI |
|---|---|---|
| Startup time | Minutes | Seconds |
| OS management | You | None |
| Billing granularity | Per hour (allocated) | Per second (running) |
| Minimum cost | Pay even when idle (if not deallocated) | Pay only while running |
| Use case | Long-running, OS-level control | Short-lived, event-driven, simple apps |

---

## Setup

```bash
RESOURCE_GROUP="az900-lab06-rg"
LOCATION="westeurope"

az group create --name $RESOURCE_GROUP --location $LOCATION
```

---

## Step 1 — Run a Container in Seconds

```bash
az container create \
  --resource-group $RESOURCE_GROUP \
  --name lab06-nginx \
  --image nginx:latest \
  --ports 80 \
  --dns-name-label "az900-lab06-$(openssl rand -hex 4)" \
  --os-type Linux \
  --cpu 1 \
  --memory 1
```

or

```
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




# Check status
az container show \
  --resource-group $RESOURCE_GROUP \
  --name lab06-nginx \
  --query "{name:name, state:instanceView.state, fqdn:ipAddress.fqdn}" \
  --output table
```

Wait for state to be `Running`, then:

```bash
FQDN=$(az container show \
  --resource-group $RESOURCE_GROUP \
  --name lab06-nginx \
  --query ipAddress.fqdn \
  --output tsv)

echo "Container URL: http://$FQDN"
curl http://$FQDN
```

You get the nginx welcome page. No VM provisioned, no SSH, no OS patching needed.

---

## Step 2 — View Logs

```bash
az container logs \
  --resource-group $RESOURCE_GROUP \
  --name lab06-nginx
```

Attach for live streaming:
```bash
az container attach \
  --resource-group $RESOURCE_GROUP \
  --name lab06-nginx
```

Ctrl+C to detach without stopping the container.

---

## Step 3 — Run a Short-Lived Task Container

ACI shines for batch/task containers that run, do work, and exit. You're only billed for the duration.

```bash
az container create \
  --resource-group $RESOURCE_GROUP \
  --name lab06-task \
  --image alpine:latest \
  --command-line "sh -c 'echo Container started; sleep 5; echo Done — computing result: $((RANDOM % 100))'" \
  --restart-policy Never \
  --os-type Linux

# Watch it run and complete
az container show \
  --resource-group $RESOURCE_GROUP \
  --name lab06-task \
  --query "{name:name, state:instanceView.state, exitCode:instanceView.currentState.exitCode}" \
  --output table

# Get the output
az container logs --resource-group $RESOURCE_GROUP --name lab06-task
```

`--restart-policy Never` means the container runs once and stops. Billing stops when the container exits.

Restart policies:
| Policy | Behavior |
|---|---|
| `Always` (default) | Restart if container exits — for web servers |
| `OnFailure` | Restart only if exit code != 0 — for batch jobs |
| `Never` | Run once and done |

---

## Step 4 — Environment Variables and Secrets

```bash
az container create \
  --resource-group $RESOURCE_GROUP \
  --name lab06-env \
  --image alpine:latest \
  --command-line "sh -c 'echo App: $APP_NAME; echo Env: $APP_ENV; echo Secret length: ${#MY_SECRET}'" \
  --environment-variables APP_NAME=my-app APP_ENV=production \
  --secure-environment-variables MY_SECRET=supersecretvalue \
  --restart-policy Never

az container logs --resource-group $RESOURCE_GROUP --name lab06-env
```

`--secure-environment-variables` values are encrypted and not visible in Azure portal or CLI output.

---

## Step 5 — Persistent Storage with Azure Files

Containers are ephemeral — any data written inside is lost when the container restarts. Mount an Azure File Share for persistence.

```bash
# Create a storage account and file share
STORAGE_ACCOUNT="az900lab06$(openssl rand -hex 4)"

az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --sku Standard_LRS

az storage share create \
  --name lab06share \
  --account-name $STORAGE_ACCOUNT

# Get the storage key
STORAGE_KEY=$(az storage account keys list \
  --resource-group $RESOURCE_GROUP \
  --account-name $STORAGE_ACCOUNT \
  --query "[0].value" \
  --output tsv)

# Write something to the share from a container
az container create \
  --resource-group $RESOURCE_GROUP \
  --name lab06-writer \
  --image alpine:latest \
  --command-line "sh -c 'echo Hello from container > /mnt/data/output.txt; cat /mnt/data/output.txt'" \
  --azure-file-volume-account-name $STORAGE_ACCOUNT \
  --azure-file-volume-account-key $STORAGE_KEY \
  --azure-file-volume-share-name lab06share \
  --azure-file-volume-mount-path /mnt/data \
  --restart-policy Never

az container logs --resource-group $RESOURCE_GROUP --name lab06-writer

# Read it from a different container — data persisted!
az container create \
  --resource-group $RESOURCE_GROUP \
  --name lab06-reader \
  --image alpine:latest \
  --command-line "sh -c 'cat /mnt/data/output.txt'" \
  --azure-file-volume-account-name $STORAGE_ACCOUNT \
  --azure-file-volume-account-key $STORAGE_KEY \
  --azure-file-volume-share-name lab06share \
  --azure-file-volume-mount-path /mnt/data \
  --restart-policy Never

az container logs --resource-group $RESOURCE_GROUP --name lab06-reader
```

---

## Step 6 — Container Groups (Multi-Container)

ACI supports container groups — multiple containers that share a lifecycle, network, and storage. Similar to a Kubernetes Pod.

```bash
# Deploy a multi-container group using YAML
cat > container-group.yaml << 'EOF'
apiVersion: 2021-10-01
location: westeurope
name: lab06-group
type: Microsoft.ContainerInstance/containerGroups
properties:
  osType: Linux
  restartPolicy: Always
  ipAddress:
    type: Public
    ports:
      - protocol: TCP
        port: 80
      - protocol: TCP
        port: 8080
  containers:
    - name: nginx-front
      properties:
        image: nginx:latest
        ports:
          - port: 80
        resources:
          requests:
            cpu: 0.5
            memoryInGB: 0.5
    - name: sidecar
      properties:
        image: alpine:latest
        command:
          - sh
          - -c
          - "while true; do echo Sidecar running; sleep 30; done"
        resources:
          requests:
            cpu: 0.25
            memoryInGB: 0.25
EOF

az container create \
  --resource-group $RESOURCE_GROUP \
  --file container-group.yaml

az container show \
  --resource-group $RESOURCE_GROUP \
  --name lab06-group \
  --query "{name:name, state:instanceView.state, ip:ipAddress.ip}" \
  --output table
```

---

## Step 7 — Compare Billing: ACI vs VM

```bash
# A B1s VM costs ~$0.013/hour whether running or not (if allocated)
# ACI is billed per second: CPU + memory

# ACI pricing (approx):
#   $0.0000015/vCPU/second + $0.00000015/GB/second
# For 1 vCPU + 1GB for 1 hour:
# = 3600 * ($0.0000015 + $0.00000015) = ~$0.006/hour

# ACI is roughly 2x cheaper than a B1s VM per hour when running,
# and FREE when not running (no idle cost at all)
echo "ACI: billed per second, zero cost when stopped"
echo "VM: billed per hour when allocated, even when OS is idle"
```

---

## Cleanup

```bash
rm -f container-group.yaml
az group delete --name $RESOURCE_GROUP --yes --no-wait
```

---

## What You Learned

- ACI runs containers directly without provisioning VMs
- Startup takes seconds vs minutes for VMs
- Billed per second of execution — zero cost when not running
- Restart policies control how containers behave after exit
- Secure environment variables for secrets
- Azure File Shares provide persistent storage across container restarts
- Container groups allow multi-container deployments sharing network/storage (like K8s pods)
