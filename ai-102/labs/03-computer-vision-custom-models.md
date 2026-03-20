# Lab 03: Computer Vision and Custom Models

## Overview

Use Azure AI Vision for image analysis and OCR, then train a custom image classification model.

### Learning Objectives

- Analyse images using Azure AI Vision (captions, tags, objects, OCR)
- Train a custom image classification model
- Evaluate and consume the custom model

## Prerequisites

- Azure subscription
- Python 3.x with `azure-ai-vision-imageanalysis` package

## Steps

### 1. Create Resources

```bash
az group create --name rg-ai102-vision --location eastus

az cognitiveservices account create \
  --name ai102-vision \
  --resource-group rg-ai102-vision \
  --kind ComputerVision --sku S1 --location eastus --yes
```

### 2. Analyse an Image

```python
from azure.ai.vision.imageanalysis import ImageAnalysisClient
from azure.core.credentials import AzureKeyCredential

client = ImageAnalysisClient(
    endpoint="<endpoint>",
    credential=AzureKeyCredential("<key>")
)

result = client.analyze_from_url(
    image_url="https://learn.microsoft.com/en-us/azure/ai-services/computer-vision/media/quickstarts/presentation.png",
    visual_features=["CAPTION", "DENSE_CAPTIONS", "TAGS", "OBJECTS", "READ"]
)

# Caption
print(f"Caption: {result.caption.text} ({result.caption.confidence:.2f})")

# Dense captions
for caption in result.dense_captions.list:
    print(f"  Region: {caption.text} ({caption.confidence:.2f})")

# Tags
for tag in result.tags.list:
    print(f"  Tag: {tag.name} ({tag.confidence:.2f})")

# Objects
for obj in result.objects.list:
    print(f"  Object: {obj.tags[0].name} at {obj.bounding_box}")

# OCR
if result.read:
    for block in result.read.blocks:
        for line in block.lines:
            print(f"  Text: {line.text}")
```

### 3. Train a Custom Image Classification Model

1. Go to **Vision Studio** (https://portal.vision.cognitive.azure.com)
2. Select **Custom models** > **Create a new project**
3. Connect to an Azure Blob Storage account with training images
4. **Label images** — assign category tags to each image
5. **Train** the model (select classification type: single-label or multi-label)
6. **Evaluate** — review precision, recall, and AP per tag
7. **Publish** the model

### 4. Use the Custom Model

```python
result = client.analyze_from_url(
    image_url="https://example.com/test-image.jpg",
    visual_features=["CUSTOM_MODEL"],
    model_name="my-custom-classifier"
)

for tag in result.custom_model.tags:
    print(f"Predicted: {tag.name} ({tag.confidence:.2f})")
```

## Summary

You used Azure AI Vision for image analysis (captioning, tagging, object detection, OCR) and trained a custom image classification model via Vision Studio.

## Cleanup

```bash
az group delete --name rg-ai102-vision --yes --no-wait
```
