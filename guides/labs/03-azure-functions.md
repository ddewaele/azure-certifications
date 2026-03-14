# Lab 03 — Azure Functions

**Concepts covered:** Serverless, event-driven compute, consumption-based pricing, HTTP triggers, the Functions runtime

**Estimated cost:** ~$0 (consumption plan — first 1M executions/month are free)

---

## Prerequisites

Install the Azure Functions Core Tools for local development and deployment:

```bash
# macOS
brew tap azure/functions
brew install azure-functions-core-tools@4

# Verify
func --version
```

Also install Node.js 20+ if you don't have it:
```bash
node --version  # should be 20+
```

---

## Setup

```bash
RESOURCE_GROUP="az900-lab03-rg"
LOCATION="westeurope"
STORAGE_ACCOUNT="az900lab03$(openssl rand -hex 4)"  # must be globally unique, no hyphens
FUNCTION_APP="az900-func-$(openssl rand -hex 4)"

az group create --name $RESOURCE_GROUP --location $LOCATION

# Functions requires a storage account
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --sku Standard_LRS \
  --location $LOCATION
```

---

## Step 1 — Create a Function App in Azure

```bash
az functionapp create \
  --name $FUNCTION_APP \
  --resource-group $RESOURCE_GROUP \
  --storage-account $STORAGE_ACCOUNT \
  --consumption-plan-location $LOCATION \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4 \
  --os-type Linux

# Confirm it's running
az functionapp show \
  --name $FUNCTION_APP \
  --resource-group $RESOURCE_GROUP \
  --query "{name:name, state:state, url:defaultHostName}" \
  --output table
```

---

## Step 2 — Create a Function Locally

```bash
# Initialize a new Functions project
func init lab03-functions --worker-runtime node --language javascript
cd lab03-functions

# Create an HTTP-triggered function
func new --name HttpHello --template "HTTP trigger" --authlevel anonymous
```

Look at what was created:
```bash
ls HttpHello/
# function.json  index.js
```

Open `HttpHello/index.js` — it's a simple function that reads a `name` query param and returns a greeting. Note how the function signature receives `context` and `req` — no HTTP server boilerplate.

Optionally edit it to make it more interesting:
```bash
cat > HttpHello/index.js << 'EOF'
module.exports = async function (context, req) {
  const name = req.query.name || (req.body && req.body.name) || 'World';

  context.res = {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: {
      message: `Hello, ${name}!`,
      timestamp: new Date().toISOString(),
      executionId: context.invocationId
    }
  };
};
EOF
```

---

## Step 3 — Run Locally

```bash
func start
```

In another terminal:
```bash
curl "http://localhost:7071/api/HttpHello?name=Azure"
curl -X POST http://localhost:7071/api/HttpHello \
  -H "Content-Type: application/json" \
  -d '{"name": "AZ-900"}'
```

Stop the local server with Ctrl+C.

---

## Step 4 — Deploy to Azure

```bash
func azure functionapp publish $FUNCTION_APP
```

The CLI packages your code and deploys it to Azure. Once deployed, test the live endpoint:

```bash
# Get the function URL
FUNCTION_URL=$(az functionapp function show \
  --resource-group $RESOURCE_GROUP \
  --name $FUNCTION_APP \
  --function-name HttpHello \
  --query invokeUrlTemplate \
  --output tsv 2>/dev/null || \
  echo "https://$FUNCTION_APP.azurewebsites.net/api/HttpHello")

curl "$FUNCTION_URL?name=Azure"
```

Or find the URL in the portal: Function App → Functions → HttpHello → Get Function URL.

---

## Step 5 — Observe the Consumption Model

This is the key serverless concept:

```bash
# There is NO dedicated compute plan listed
az appservice plan list \
  --resource-group $RESOURCE_GROUP \
  --output table
# Output: empty or shows a Dynamic (Y1) plan — this is the consumption plan
```

The consumption plan:
- **Scales from zero** — no instances running when there are no requests
- **Scales automatically** — Azure adds instances as load increases
- **Billed per execution** — you pay for execution count and execution duration, not idle time
- First **1 million executions/month** are free

Compare this to a VM: a VM charges 24/7 whether code is running or not.

---

## Step 6 — Add a Timer Trigger Function

HTTP triggers run on demand. Timer triggers run on a schedule (like cron).

```bash
func new --name TimerLog --template "Timer trigger"
```

Edit `TimerLog/index.js`:
```bash
cat > TimerLog/index.js << 'EOF'
module.exports = async function (context, myTimer) {
  const now = new Date().toISOString();
  context.log(`Timer function ran at: ${now}`);
  context.log(`Is past due: ${myTimer.isPastDue}`);
};
EOF
```

Edit `TimerLog/function.json` to run every minute:
```bash
cat > TimerLog/function.json << 'EOF'
{
  "bindings": [
    {
      "name": "myTimer",
      "type": "timerTrigger",
      "direction": "in",
      "schedule": "0 */1 * * * *"
    }
  ]
}
EOF
```

Deploy again:
```bash
func azure functionapp publish $FUNCTION_APP
```

```bash
# Stream live logs from both functions
az webapp log tail \
  --name $FUNCTION_APP \
  --resource-group $RESOURCE_GROUP
```

You should see the timer function log every minute.

---

## Step 7 — Application Settings (Function Config)

Functions use App Settings for secrets and config — same as App Service:

```bash
az functionapp config appsettings set \
  --name $FUNCTION_APP \
  --resource-group $RESOURCE_GROUP \
  --settings MY_API_KEY=super-secret-value

az functionapp config appsettings list \
  --name $FUNCTION_APP \
  --resource-group $RESOURCE_GROUP \
  --output table
```

Access in code via `process.env.MY_API_KEY`.

---

## Serverless Concepts to Remember

| Concept | Detail |
|---|---|
| Cold start | First invocation after idle period takes longer (container startup) |
| Scale to zero | No instances when idle — reduces cost, introduces cold start |
| Stateless | Each invocation is independent — don't store state in-memory |
| Triggers | HTTP, Timer, Queue, Blob, Event Hub, Cosmos DB, etc. |
| Bindings | Declarative connections to other services (no SDK boilerplate) |
| Durable Functions | Extension for stateful orchestrations (not in AZ-900 scope) |

---

## Cleanup

```bash
cd ..
rm -rf lab03-functions
az group delete --name $RESOURCE_GROUP --yes --no-wait
```

---

## What You Learned

- Serverless means the platform manages all infrastructure — you write functions, not servers
- HTTP triggers for API-style workloads
- Timer triggers for scheduled jobs
- Consumption plan: billed per execution, scales to zero, first 1M free
- Cold starts as the trade-off for scale-to-zero
