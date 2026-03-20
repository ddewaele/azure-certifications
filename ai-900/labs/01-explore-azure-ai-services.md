# Lab 01: Explore Azure AI Services

## Overview

In this lab you will create an Azure AI Services multi-service resource, explore its keys and endpoint, and make a simple API call to the Language service for language detection.

### Learning Objectives

- Create an Azure AI Services resource
- Locate the endpoint and API keys
- Call the Language API to detect the language of a text sample

## Prerequisites

- An active Azure subscription (free tier works)
- Azure CLI installed, or access to Azure Cloud Shell
- curl or Python 3.x installed locally

## Steps

### 1. Create a Resource Group

```bash
az group create --name rg-ai900-labs --location eastus
```

### 2. Create an Azure AI Services Multi-Service Resource

```bash
az cognitiveservices account create \
  --name ai900-ai-services \
  --resource-group rg-ai900-labs \
  --kind CognitiveServices \
  --sku S0 \
  --location eastus \
  --yes
```

The multi-service resource provides a single endpoint and key for multiple AI services (Language, Vision, Speech, etc.).

### 3. Retrieve the Endpoint and Key

```bash
# Get the endpoint
az cognitiveservices account show \
  --name ai900-ai-services \
  --resource-group rg-ai900-labs \
  --query "properties.endpoint" -o tsv

# Get the primary key
az cognitiveservices account keys list \
  --name ai900-ai-services \
  --resource-group rg-ai900-labs \
  --query "key1" -o tsv
```

Save these values — you will use them in the next step.

### 4. Detect the Language of a Text Sample

Using curl:

```bash
ENDPOINT="<your-endpoint>"
KEY="<your-key>"

curl -X POST "${ENDPOINT}/language/:analyze-text?api-version=2023-04-01" \
  -H "Ocp-Apim-Subscription-Key: ${KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "LanguageDetection",
    "parameters": { "modelVersion": "latest" },
    "analysisInput": {
      "documents": [
        { "id": "1", "text": "Bonjour tout le monde" },
        { "id": "2", "text": "Hallo Welt" },
        { "id": "3", "text": "Hello world" }
      ]
    }
  }'
```

Or using Python:

```python
import requests, json

endpoint = "<your-endpoint>"
key = "<your-key>"

url = f"{endpoint}/language/:analyze-text?api-version=2023-04-01"
headers = {"Ocp-Apim-Subscription-Key": key, "Content-Type": "application/json"}
body = {
    "kind": "LanguageDetection",
    "parameters": {"modelVersion": "latest"},
    "analysisInput": {
        "documents": [
            {"id": "1", "text": "Bonjour tout le monde"},
            {"id": "2", "text": "Hallo Welt"},
            {"id": "3", "text": "Hello world"},
        ]
    },
}

response = requests.post(url, headers=headers, json=body)
results = response.json()

for doc in results["results"]["documents"]:
    print(f"Document {doc['id']}: {doc['detectedLanguage']['name']} "
          f"(confidence: {doc['detectedLanguage']['confidenceScore']})")
```

**Expected output:**
```
Document 1: French (confidence: 1.0)
Document 2: German (confidence: 1.0)
Document 3: English (confidence: 1.0)
```

### 5. Explore in the Azure Portal

1. Navigate to the Azure portal (https://portal.azure.com)
2. Open your **ai900-ai-services** resource
3. Explore the **Keys and Endpoint** blade
4. Note the **Pricing tier** (S0) and the **Location**
5. Browse **Resource Management > Networking** to see access options

## Summary

You created an Azure AI Services multi-service resource, retrieved its endpoint and key, and successfully called the Language Detection API. This single resource provides access to multiple Azure AI capabilities.

## Cleanup

```bash
az group delete --name rg-ai900-labs --yes --no-wait
```
