# Lab 08 — Storage Integrations

**Concepts covered:** Connecting storage to App Service, Functions (blob + queue triggers), and Container Instances; managed identity vs connection strings

**Estimated cost:** ~$0.05 (delete promptly)

---

## Setup

```bash
RESOURCE_GROUP="az900-lab08-rg"
LOCATION="westeurope"
STORAGE_ACCOUNT="az900lab08$(openssl rand -hex 4)"
FUNCTION_APP="az900-func08-$(openssl rand -hex 4)"
APP_NAME="az900-app08-$(openssl rand -hex 4)"

az group create --name $RESOURCE_GROUP --location $LOCATION

az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --sku Standard_LRS \
  --kind StorageV2

# Get the connection string — used by App Service and Functions
STORAGE_CONN_STR=$(az storage account show-connection-string \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --output tsv)

export AZURE_STORAGE_ACCOUNT=$STORAGE_ACCOUNT
export AZURE_STORAGE_KEY=$(az storage account keys list \
  --resource-group $RESOURCE_GROUP \
  --account-name $STORAGE_ACCOUNT \
  --query "[0].value" \
  --output tsv)

# Create a blob container and a queue we'll use across integrations
az storage container create --name uploads
az storage container create --name processed
az storage queue create --name jobs
```

---

## Part A — App Service + Blob Storage

A common pattern: App Service stores user uploads in Blob Storage, keeping the app stateless (no files on the server).

### A1 — Inject the Storage Connection String as an App Setting

```bash
# Create an App Service Plan + Web App
az appservice plan create \
  --name lab08-plan \
  --resource-group $RESOURCE_GROUP \
  --sku B1 \
  --is-linux

az webapp create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --plan lab08-plan \
  --runtime "NODE:20-lts"

# Pass the connection string as an app setting — available as env var in the app
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    AZURE_STORAGE_CONNECTION_STRING="$STORAGE_CONN_STR" \
    BLOB_CONTAINER_NAME=uploads

# Verify — note: values are masked in output for security
az webapp config appsettings list \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --output table
```

### A2 — Deploy an App That Reads/Writes Blobs

```bash
mkdir lab08-app && cd lab08-app
npm init -y --silent
npm install @azure/storage-blob

cat > app.js << 'EOF'
const { BlobServiceClient } = require("@azure/storage-blob");
const http = require("http");

const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
const container = process.env.BLOB_CONTAINER_NAME || "uploads";

const server = http.createServer(async (req, res) => {
  const client = BlobServiceClient.fromConnectionString(connStr);
  const containerClient = client.getContainerClient(container);

  if (req.method === "GET" && req.url === "/list") {
    const blobs = [];
    for await (const blob of containerClient.listBlobsFlat()) {
      blobs.push({ name: blob.name, size: blob.properties.contentLength });
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(blobs, null, 2));

  } else if (req.method === "POST" && req.url === "/upload") {
    const blobName = `upload-${Date.now()}.txt`;
    const blockBlob = containerClient.getBlockBlobClient(blobName);
    const content = `Uploaded at ${new Date().toISOString()} from App Service`;
    await blockBlob.upload(content, content.length);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ uploaded: blobName }));

  } else {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<h2>Storage Integration Demo</h2><p>GET /list | POST /upload</p>");
  }
});

server.listen(process.env.PORT || 3000, () => console.log("Running"));
EOF

zip -r app.zip . --exclude "*.zip"
az webapp deploy \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --src-path app.zip \
  --type zip

cd ..

APP_URL="https://$APP_NAME.azurewebsites.net"
echo "App URL: $APP_URL"

# Wait ~30s for deployment, then test
sleep 30
curl "$APP_URL/list"
curl -X POST "$APP_URL/upload"
curl "$APP_URL/list"   # should now show the uploaded blob
```

---

## Part B — Azure Functions + Blob Trigger

A blob trigger function runs automatically when a file is uploaded to a container.

```bash
# Create the Function App
az functionapp create \
  --name $FUNCTION_APP \
  --resource-group $RESOURCE_GROUP \
  --storage-account $STORAGE_ACCOUNT \
  --consumption-plan-location $LOCATION \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4 \
  --os-type Linux

# Tell the function app where storage is
az functionapp config appsettings set \
  --name $FUNCTION_APP \
  --resource-group $RESOURCE_GROUP \
  --settings STORAGE_CONNECTION="$STORAGE_CONN_STR"
```

Create the function project locally:

```bash
mkdir lab08-functions && cd lab08-functions
func init . --worker-runtime node --language javascript

# Create a blob trigger function
func new --name BlobProcessor --template "Azure Blob Storage trigger" --authlevel anonymous 2>/dev/null || \
  func new --name BlobProcessor --template "Blob trigger"
```

Edit `BlobProcessor/function.json` to watch the `uploads` container:

```bash
cat > BlobProcessor/function.json << 'EOF'
{
  "bindings": [
    {
      "name": "myBlob",
      "type": "blobTrigger",
      "direction": "in",
      "path": "uploads/{name}",
      "connection": "STORAGE_CONNECTION"
    },
    {
      "name": "outputBlob",
      "type": "blob",
      "direction": "out",
      "path": "processed/{name}",
      "connection": "STORAGE_CONNECTION"
    }
  ]
}
EOF
```

Edit `BlobProcessor/index.js`:

```bash
cat > BlobProcessor/index.js << 'EOF'
module.exports = async function (context, myBlob) {
  context.log(`Blob trigger fired: ${context.bindingData.name}`);
  context.log(`Blob size: ${myBlob.length} bytes`);

  // Transform the content and write to the 'processed' container
  const processed = {
    originalName: context.bindingData.name,
    processedAt: new Date().toISOString(),
    sizeBytes: myBlob.length,
    content: myBlob.toString("utf8").toUpperCase()
  };

  // Output binding: automatically writes to processed/{name}
  context.bindings.outputBlob = JSON.stringify(processed, null, 2);
  context.log("Written to processed container");
};
EOF
```

Deploy and test:

```bash
func azure functionapp publish $FUNCTION_APP

# Upload a blob to the 'uploads' container — this triggers the function
echo "hello azure functions blob trigger" | \
  az storage blob upload \
    --container-name uploads \
    --name trigger-test.txt \
    --data @- \
    --overwrite

# Wait a few seconds, then check the processed container
sleep 10
az storage blob list \
  --account-name $STORAGE_ACCOUNT \
  --account-key $AZURE_STORAGE_KEY \
  --container-name processed \
  --output table

# Download and inspect the processed output
az storage blob download \
  --account-name $STORAGE_ACCOUNT \
  --account-key $AZURE_STORAGE_KEY \
  --container-name processed \
  --name trigger-test.txt \
  --file /dev/stdout 2>/dev/null

cd ..
```

---

## Part C — Azure Functions + Queue Trigger

A queue trigger function runs when a message arrives on a queue — the classic async worker pattern.

```bash
cd lab08-functions

func new --name QueueWorker --template "Azure Queue Storage trigger" 2>/dev/null || \
  func new --name QueueWorker --template "Queue trigger"

cat > QueueWorker/function.json << 'EOF'
{
  "bindings": [
    {
      "name": "myQueueItem",
      "type": "queueTrigger",
      "direction": "in",
      "queueName": "jobs",
      "connection": "STORAGE_CONNECTION"
    }
  ]
}
EOF

cat > QueueWorker/index.js << 'EOF'
module.exports = async function (context, myQueueItem) {
  context.log("Queue message received:", myQueueItem);

  // Simulate processing
  const job = typeof myQueueItem === "string"
    ? JSON.parse(myQueueItem)
    : myQueueItem;

  context.log(`Processing job: ${job.jobId} — action: ${job.action}`);
  context.log(`Result: completed at ${new Date().toISOString()}`);
};
EOF

func azure functionapp publish $FUNCTION_APP

# Put a message on the queue — function fires automatically
az storage message put \
  --account-name $STORAGE_ACCOUNT \
  --account-key $AZURE_STORAGE_KEY \
  --queue-name jobs \
  --content '{"jobId": "42", "action": "resize-image", "file": "photo.jpg"}'

# Stream logs to see the function fire
az webapp log tail --name $FUNCTION_APP --resource-group $RESOURCE_GROUP &
sleep 15
kill %1  # stop log streaming

cd ..
```

---

## Part D — Container Instances + Azure Files

ACI containers are stateless — data written inside is lost on restart. Mount an Azure File Share for persistence.

```bash
# Create a file share
az storage share create \
  --name containerdata \
  --account-name $STORAGE_ACCOUNT \
  --quota 10

# Run a container that writes to the share
az container create \
  --resource-group $RESOURCE_GROUP \
  --name lab08-writer \
  --image alpine:latest \
  --command-line "sh -c 'echo {\"written_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\", \"hostname\": \"$(hostname)\"} > /data/record.json && cat /data/record.json'" \
  --azure-file-volume-account-name $STORAGE_ACCOUNT \
  --azure-file-volume-account-key $AZURE_STORAGE_KEY \
  --azure-file-volume-share-name containerdata \
  --azure-file-volume-mount-path /data \
  --restart-policy Never

# Wait for it to finish
az container show \
  --resource-group $RESOURCE_GROUP \
  --name lab08-writer \
  --query instanceView.currentState.state \
  --output tsv

az container logs --resource-group $RESOURCE_GROUP --name lab08-writer

# Run a second container — reads the file written by the first
az container create \
  --resource-group $RESOURCE_GROUP \
  --name lab08-reader \
  --image alpine:latest \
  --command-line "sh -c 'echo \"Reading persisted data:\"; cat /data/record.json'" \
  --azure-file-volume-account-name $STORAGE_ACCOUNT \
  --azure-file-volume-account-key $AZURE_STORAGE_KEY \
  --azure-file-volume-share-name containerdata \
  --azure-file-volume-mount-path /data \
  --restart-policy Never

az container logs --resource-group $RESOURCE_GROUP --name lab08-reader
```

### D2 — Container + Blob Storage via SDK

For reading/writing blobs from inside a container, pass the connection string as an environment variable:

```bash
az container create \
  --resource-group $RESOURCE_GROUP \
  --name lab08-blob-client \
  --image mcr.microsoft.com/azure-cli:latest \
  --command-line "sh -c 'az storage blob list --account-name $STORAGE_ACCOUNT --account-key $AZURE_STORAGE_KEY --container-name uploads --output table'" \
  --restart-policy Never

az container logs --resource-group $RESOURCE_GROUP --name lab08-blob-client
```

---

## Part E — Managed Identity (The Better Alternative to Connection Strings)

Hardcoding storage keys in app settings is functional but not ideal. Managed identities let your services authenticate to storage without any credentials.

```bash
# Assign a system-managed identity to the Function App
az functionapp identity assign \
  --name $FUNCTION_APP \
  --resource-group $RESOURCE_GROUP

# Get the principal ID of the function app's identity
PRINCIPAL_ID=$(az functionapp identity show \
  --name $FUNCTION_APP \
  --resource-group $RESOURCE_GROUP \
  --query principalId \
  --output tsv)

# Get the storage account resource ID
STORAGE_ID=$(az storage account show \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --query id \
  --output tsv)

# Grant the function app's identity the "Storage Blob Data Contributor" role
az role assignment create \
  --assignee $PRINCIPAL_ID \
  --role "Storage Blob Data Contributor" \
  --scope $STORAGE_ID

echo "Managed identity configured — no keys needed in app settings"
```

With managed identity, the app uses its Azure identity to access storage — no connection string, no key rotation.

---

## Cleanup

```bash
rm -rf lab08-app lab08-functions
az group delete --name $RESOURCE_GROUP --yes --no-wait
```

---

## Integration Patterns Summary

| Pattern | How storage is connected | Credential approach |
|---|---|---|
| App Service → Blob | SDK + env var | Connection string in App Settings |
| Functions → Blob trigger | Binding in function.json | Connection string in App Settings |
| Functions → Queue trigger | Binding in function.json | Connection string in App Settings |
| ACI → Azure Files | Volume mount | Account key passed at create time |
| ACI → Blob | SDK inside container | Connection string as env var |
| Any service → Storage | Managed Identity | No credentials — Azure handles it |

**Key principle:** prefer managed identity over connection strings in production. No credentials to rotate, no risk of key leakage.
