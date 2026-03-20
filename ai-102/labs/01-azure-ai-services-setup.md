# Lab 01: Azure AI Services Setup and Security

## Overview

Create and configure Azure AI Services resources, manage keys securely with Key Vault, and set up managed identity authentication.

### Learning Objectives

- Create multi-service and single-service AI resources
- Store and retrieve keys from Azure Key Vault
- Configure managed identity for secure service-to-service auth
- Monitor AI service usage with Azure Monitor

## Prerequisites

- Azure subscription
- Azure CLI installed
- Python 3.x

## Steps

### 1. Create a Resource Group and AI Services Resource

```bash
az group create --name rg-ai102-labs --location eastus

# Multi-service resource
az cognitiveservices account create \
  --name ai102-services \
  --resource-group rg-ai102-labs \
  --kind CognitiveServices \
  --sku S0 \
  --location eastus --yes

# Azure OpenAI resource
az cognitiveservices account create \
  --name ai102-openai \
  --resource-group rg-ai102-labs \
  --kind OpenAI \
  --sku S0 \
  --location eastus --yes
```

### 2. Store Keys in Azure Key Vault

```bash
# Create Key Vault
az keyvault create --name ai102-kv --resource-group rg-ai102-labs --location eastus

# Get the AI Services key
KEY=$(az cognitiveservices account keys list \
  --name ai102-services --resource-group rg-ai102-labs --query "key1" -o tsv)

# Store in Key Vault
az keyvault secret set --vault-name ai102-kv --name ai-services-key --value "$KEY"
```

### 3. Configure Managed Identity

```bash
# Create an App Service (example consumer)
az webapp create --name ai102-app --resource-group rg-ai102-labs \
  --plan ai102-plan --runtime "PYTHON:3.11"

# Enable system-assigned managed identity
az webapp identity assign --name ai102-app --resource-group rg-ai102-labs

# Get the principal ID
PRINCIPAL_ID=$(az webapp identity show --name ai102-app \
  --resource-group rg-ai102-labs --query principalId -o tsv)

# Assign Cognitive Services User role
az role assignment create \
  --assignee "$PRINCIPAL_ID" \
  --role "Cognitive Services User" \
  --scope $(az cognitiveservices account show --name ai102-services \
    --resource-group rg-ai102-labs --query id -o tsv)
```

### 4. Test Authentication with Managed Identity (Python)

```python
from azure.identity import DefaultAzureCredential
from azure.ai.textanalytics import TextAnalyticsClient

credential = DefaultAzureCredential()
client = TextAnalyticsClient(
    endpoint="https://ai102-services.cognitiveservices.azure.com/",
    credential=credential
)

result = client.detect_language(["Bonjour le monde"])
print(f"Detected: {result[0].primary_language.name}")
```

### 5. Enable Monitoring

```bash
# Enable diagnostic settings
az monitor diagnostic-settings create \
  --name ai102-diagnostics \
  --resource $(az cognitiveservices account show --name ai102-services \
    --resource-group rg-ai102-labs --query id -o tsv) \
  --logs '[{"category":"RequestResponse","enabled":true}]' \
  --metrics '[{"category":"AllMetrics","enabled":true}]' \
  --workspace $(az monitor log-analytics workspace create \
    --workspace-name ai102-logs --resource-group rg-ai102-labs --query id -o tsv)
```

## Summary

You created AI Services resources, stored keys in Key Vault, configured managed identity for passwordless auth, and enabled monitoring.

## Cleanup

```bash
az group delete --name rg-ai102-labs --yes --no-wait
```
