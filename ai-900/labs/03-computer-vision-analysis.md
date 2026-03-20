# Lab 03: Computer Vision Analysis

## Overview

In this lab you will use Azure AI Vision to analyse images, generate captions and tags, detect objects, extract text with OCR, and explore face detection.

### Learning Objectives

- Analyse an image using Azure AI Vision (captions, tags, objects)
- Extract text from an image using OCR
- Detect faces using Azure AI Face
- Use Vision Studio for interactive exploration

## Prerequisites

- An active Azure subscription
- An Azure AI Services or Azure AI Vision resource
- curl or Python 3.x installed

## Steps

### 1. Create an Azure AI Vision Resource

```bash
az cognitiveservices account create \
  --name ai900-vision \
  --resource-group rg-ai900-labs \
  --kind ComputerVision \
  --sku S1 \
  --location eastus \
  --yes
```

Retrieve the endpoint and key:

```bash
ENDPOINT=$(az cognitiveservices account show \
  --name ai900-vision --resource-group rg-ai900-labs \
  --query "properties.endpoint" -o tsv)

KEY=$(az cognitiveservices account keys list \
  --name ai900-vision --resource-group rg-ai900-labs \
  --query "key1" -o tsv)
```

### 2. Analyse an Image (Captions and Tags)

```bash
curl -X POST "${ENDPOINT}/computervision/imageanalysis:analyze?api-version=2024-02-01&features=caption,tags" \
  -H "Ocp-Apim-Subscription-Key: ${KEY}" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://learn.microsoft.com/en-us/azure/ai-services/computer-vision/media/quickstarts/presentation.png"}'
```

Review the response:
- **caption** — a human-readable description of the image
- **tags** — a list of relevant keywords with confidence scores

### 3. Extract Text with OCR (Read API)

```python
import requests, time

endpoint = "<your-endpoint>"
key = "<your-key>"
image_url = "https://learn.microsoft.com/en-us/azure/ai-services/computer-vision/media/quickstarts/presentation.png"

# Submit the read request
read_url = f"{endpoint}/computervision/imageanalysis:analyze?api-version=2024-02-01&features=read"
headers = {"Ocp-Apim-Subscription-Key": key, "Content-Type": "application/json"}
body = {"url": image_url}

response = requests.post(read_url, headers=headers, json=body)
result = response.json()

# Print extracted text
if "readResult" in result:
    for block in result["readResult"]["blocks"]:
        for line in block["lines"]:
            print(line["text"])
```

### 4. Explore Vision Studio

1. Navigate to https://portal.vision.cognitive.azure.com
2. Sign in and select your Azure AI Vision resource
3. Try these features interactively:
   - **Add captions to images** — upload or select sample images
   - **Add dense captions to images** — detailed descriptions for multiple regions
   - **Extract text from images** — upload a document or photo with text
   - **Detect common objects** — see bounding boxes around detected objects
4. Compare the results with the API responses from earlier

### 5. Face Detection

Face detection requires the Azure AI Face service:

```bash
az cognitiveservices account create \
  --name ai900-face \
  --resource-group rg-ai900-labs \
  --kind Face \
  --sku S0 \
  --location eastus \
  --yes
```

Test face detection:

```bash
FACE_ENDPOINT=$(az cognitiveservices account show \
  --name ai900-face --resource-group rg-ai900-labs \
  --query "properties.endpoint" -o tsv)

FACE_KEY=$(az cognitiveservices account keys list \
  --name ai900-face --resource-group rg-ai900-labs \
  --query "key1" -o tsv)

curl -X POST "${FACE_ENDPOINT}/face/v1.0/detect?returnFaceAttributes=age,headPose,glasses" \
  -H "Ocp-Apim-Subscription-Key: ${FACE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://upload.wikimedia.org/wikipedia/commons/3/3a/Cat03.jpg"}'
```

The response includes bounding boxes for any detected faces and requested attributes.

## Summary

You used Azure AI Vision to generate image captions, extract tags, read text via OCR, and detect faces. Vision Studio provided an interactive way to explore these capabilities without writing code.

## Cleanup

```bash
az group delete --name rg-ai900-labs --yes --no-wait
```
