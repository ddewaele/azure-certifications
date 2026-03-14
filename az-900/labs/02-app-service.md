# Lab 02 — App Service

**Concepts covered:** PaaS, App Service Plans, deployment, deployment slots, scaling, the IaaS vs PaaS contrast

**Estimated cost:** $0 (uses Free tier)

---

## Setup

```bash
RESOURCE_GROUP="az900-lab02-rg"
LOCATION="westeurope"
PLAN_NAME="lab02-plan"
APP_NAME="az900-lab02-$(openssl rand -hex 4)"  # must be globally unique

az group create --name $RESOURCE_GROUP --location $LOCATION
```

---

## Step 1 — Create an App Service Plan

The App Service Plan defines the region, OS, pricing tier, and how many VMs (scale-out capacity) back your apps.

```bash
az appservice plan create \
  --name $PLAN_NAME \
  --resource-group $RESOURCE_GROUP \
  --sku FREE \
  --is-linux

az appservice plan show \
  --name $PLAN_NAME \
  --resource-group $RESOURCE_GROUP \
  --output table
```

Note: multiple web apps can share a single plan — they share the underlying compute.

---

## Step 2 — Create a Web App

```bash
az webapp create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --plan $PLAN_NAME \
  --runtime "NODE:20-lts"

# Get the URL
az webapp show \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query defaultHostName \
  --output tsv
```

Visit `https://<your-app-name>.azurewebsites.net` — you'll see the default Azure App Service welcome page.

**Observe:** you didn't provision a VM, install Node.js, configure a web server, or deal with networking. That's PaaS.

---

## Step 3 — Deploy a Simple App

Create a minimal Node.js app locally and deploy it via zip deploy:

```bash
# Create app files
mkdir lab02-app && cd lab02-app

cat > app.js << 'EOF'
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(`
    <h1>Hello from Azure App Service!</h1>
    <p>Running on PaaS — no OS management required.</p>
    <p>Time: ${new Date().toISOString()}</p>
  `);
});

server.listen(process.env.PORT || 3000, () => {
  console.log('Server running');
});
EOF

cat > package.json << 'EOF'
{
  "name": "lab02-app",
  "version": "1.0.0",
  "scripts": {
    "start": "node app.js"
  }
}
EOF

# Zip it up
zip -r app.zip .

# Deploy via zip push
az webapp deploy \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --src-path app.zip \
  --type zip

cd ..
```

Wait ~30 seconds then visit your app URL. You should see the HTML response.

---

## Step 4 — View Logs

```bash
# Stream live logs
az webapp log tail \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP
```

Press Ctrl+C to stop streaming.

```bash
# Enable and download historical logs
az webapp log config \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --application-logging filesystem \
  --level information
```

---

## Step 5 — App Settings (Environment Variables)

In PaaS, you don't SSH in to edit config files. Instead, you set environment variables through App Settings:

```bash
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings APP_ENV=production MY_SECRET=abc123

az webapp config appsettings list \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --output table
```

These are injected as environment variables at runtime (`process.env.APP_ENV`, etc.).

---

## Step 6 — Scale Up (Vertical) and Scale Out (Horizontal)

The Free tier doesn't support scaling, so let's upgrade the plan first.

```bash
# Scale UP — upgrade the plan tier (vertical: more powerful machine)
az appservice plan update \
  --name $PLAN_NAME \
  --resource-group $RESOURCE_GROUP \
  --sku B1

# Scale OUT — add more instances (horizontal: more machines)
az appservice plan update \
  --name $PLAN_NAME \
  --resource-group $RESOURCE_GROUP \
  --number-of-workers 2

# Check current state
az appservice plan show \
  --name $PLAN_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "{sku:sku.name, workers:maximumElasticWorkerCount}" \
  --output table
```

Scale back to B1/1 worker to save cost:
```bash
az appservice plan update \
  --name $PLAN_NAME \
  --resource-group $RESOURCE_GROUP \
  --number-of-workers 1
```

---

## Step 7 — Deployment Slots (Standard tier and above)

Deployment slots let you deploy to a staging environment, test it, then **swap** it into production with zero downtime. Requires at minimum Standard tier.

```bash
# Upgrade to Standard to use slots
az appservice plan update \
  --name $PLAN_NAME \
  --resource-group $RESOURCE_GROUP \
  --sku S1

# Create a staging slot
az webapp deployment slot create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --slot staging

# The staging URL is:
echo "Staging URL: https://$APP_NAME-staging.azurewebsites.net"

# Deploy something to staging (in a real workflow this would be your new release)
# Then swap staging → production
az webapp deployment slot swap \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --slot staging \
  --target-slot production
```

---

## Compare: VM vs App Service

| | Virtual Machine (Lab 01) | App Service (Lab 02) |
|---|---|---|
| OS management | You | Azure |
| Runtime install | You | Azure |
| Web server config | You | Azure |
| SSH access | Yes | No (by default) |
| Deploy method | Copy files, systemd | zip, git, container |
| Scaling | Manual VM provisioning | Slider / autoscale |
| Billing | Per VM hour | Per plan tier |

---

## Cleanup

```bash
cd .. && rm -rf lab02-app
az group delete --name $RESOURCE_GROUP --yes --no-wait
```

---

## What You Learned

- App Service Plans as the unit of compute capacity for PaaS
- Deploying a web app without managing any infrastructure
- App Settings as the PaaS equivalent of environment config files
- Vertical vs horizontal scaling on App Service
- Deployment slots for zero-downtime releases
