# Lab 05: Knowledge Mining with Azure AI Search and Document Intelligence

## Overview

Build an AI Search index with skillset enrichment, implement a custom skill, create knowledge store projections, and extract data from documents using Document Intelligence.

### Learning Objectives

- Create an AI Search index with a skillset (OCR, NER, key phrase extraction)
- Implement a custom Web API skill
- Configure knowledge store projections
- Use Document Intelligence prebuilt and composed models

## Prerequisites

- Azure subscription
- Python 3.x with `azure-search-documents` and `azure-ai-formrecognizer`

## Steps

### 1. Create Resources

```bash
az group create --name rg-ai102-search --location eastus

az search service create --name ai102-search \
  --resource-group rg-ai102-search --sku basic --location eastus

az cognitiveservices account create --name ai102-docintell \
  --resource-group rg-ai102-search --kind FormRecognizer --sku S0 \
  --location eastus --yes

az storage account create --name ai102searchdata \
  --resource-group rg-ai102-search --sku Standard_LRS
```

### 2. Create an Index with Skillset

Using the REST API or Azure portal:

1. **Data source** — connect to Azure Blob Storage containing PDF documents
2. **Skillset** — define AI enrichment:
   - `OcrSkill` — extract text from images
   - `MergeSkill` — combine OCR text with content
   - `EntityRecognitionSkill` — extract named entities
   - `KeyPhraseExtractionSkill` — extract key phrases
   - `ShaperSkill` — shape data for knowledge store
3. **Index** — define fields: id, content, entities, keyPhrases, metadata
4. **Indexer** — schedule to run on the data source

### 3. Query the Index

```python
from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential

client = SearchClient(
    endpoint="https://ai102-search.search.windows.net",
    index_name="enriched-docs",
    credential=AzureKeyCredential("<key>")
)

# Full-text search with filter
results = client.search(
    search_text="machine learning",
    filter="metadata_storage_path eq 'path/to/doc'",
    select=["content", "entities", "keyPhrases"],
    top=5
)

for result in results:
    print(f"Score: {result['@search.score']}")
    print(f"Key phrases: {result.get('keyPhrases', [])}")
    print(f"Entities: {result.get('entities', [])}")
```

### 4. Document Intelligence — Prebuilt Invoice Model

```python
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential

client = DocumentAnalysisClient(
    endpoint="<doc-intelligence-endpoint>",
    credential=AzureKeyCredential("<key>")
)

with open("invoice.pdf", "rb") as f:
    poller = client.begin_analyze_document("prebuilt-invoice", f)

result = poller.result()
for doc in result.documents:
    print(f"Vendor: {doc.fields.get('VendorName', {}).value}")
    print(f"Invoice date: {doc.fields.get('InvoiceDate', {}).value}")
    print(f"Total: {doc.fields.get('InvoiceTotal', {}).value}")
    for item in doc.fields.get("Items", {}).value or []:
        desc = item.value.get("Description", {}).value
        amount = item.value.get("Amount", {}).value
        print(f"  Line item: {desc} = {amount}")
```

### 5. Train a Custom Document Intelligence Model

1. Go to **Document Intelligence Studio** (https://formrecognizer.appliedai.azure.com)
2. Create a **Custom extraction model** project
3. Upload 5+ labeled training documents
4. Label fields (e.g., "vendor", "date", "total")
5. Train the model
6. Test with new documents
7. Optionally, create a **composed model** combining invoice + receipt models

## Summary

You created an AI-enriched search index with built-in cognitive skills, queried it with full-text search, extracted invoice data with Document Intelligence prebuilt models, and learned to train custom extraction models.

## Cleanup

```bash
az group delete --name rg-ai102-search --yes --no-wait
```
