# Azure CLI Setup

Get the Azure CLI installed, authenticated, and pointed at your subscription.

---

## 1. Install the Azure CLI

**macOS (Homebrew)**
```bash
brew install azure-cli
```

**Linux (Debian/Ubuntu)**
```bash
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

**Windows**
Download and run the [MSI installer](https://aka.ms/installazurecliwindows), or via winget:
```powershell
winget install Microsoft.AzureCLI
```

Verify the install:
```bash
az version
```

---

## 2. Authenticate

Interactive browser login (recommended):
```bash
az login
```

This opens a browser to complete authentication. On a headless machine, use device code flow:
```bash
az login --use-device-code
```

After login, the CLI lists your accessible subscriptions.

---

## 3. Select Your Subscription

List all subscriptions your account has access to:
```bash
az account list --output table
```

Set the active subscription:
```bash
az account set --subscription "<subscription-name-or-id>"
```

Confirm which subscription is active:
```bash
az account show --output table
```

---

## 4. Configure Defaults (Optional but useful)

Set a default location and resource group so you don't have to pass `--location` / `--resource-group` to every command:
```bash
az configure --defaults location=westeurope group=my-rg
```

Check current defaults:
```bash
az configure --list-defaults
```

---

## 5. Explore the CLI

The CLI follows a consistent pattern: `az <service> <action> [options]`

```bash
# List all top-level command groups
az --help

# Get help for a specific service
az vm --help
az storage account --help

# Interactive mode (tab-completion, inline docs)
az interactive
```

---

## 6. Create a Resource Group (First Real Command)

A resource group is a logical container for Azure resources. Most things you create will live inside one.

```bash
az group create \
  --name az900-tutorial-rg \
  --location westeurope
```

List your resource groups:
```bash
az group list --output table
```

Delete when you're done (avoids charges):
```bash
az group delete --name az900-tutorial-rg --yes
```

---

## 7. Useful CLI Tips

| Tip | Command |
|-----|---------|
| Switch output format | `--output table` / `--output json` / `--output yaml` |
| Query JSON output | `--query "name"` (uses JMESPath) |
| Run without confirmation prompts | `--yes` / `-y` |
| Upgrade CLI | `az upgrade` |
| Log out | `az logout` |

**JMESPath query example** — list only VM names in a resource group:
```bash
az vm list --resource-group my-rg --query "[].name" --output table
```

---

## Next Steps

- Browse the [AZ-900 exam topics](../README.md) and start experimenting with each service area.
- Work through the [Microsoft Learn AZ-900 learning path](https://learn.microsoft.com/en-us/training/paths/azure-fundamentals/) alongside hands-on CLI labs.
