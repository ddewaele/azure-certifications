# Lab 02: Generative AI and RAG with Azure OpenAI + AI Search

## Overview

Deploy GPT and embedding models, create a vector search index, and implement a RAG (Retrieval-Augmented Generation) pattern that grounds responses in your own documents.

### Learning Objectives

- Deploy GPT-4o and embedding models in Azure OpenAI
- Create a vector search index in Azure AI Search
- Implement end-to-end RAG: index documents, retrieve context, generate grounded responses
- Evaluate response quality

## Prerequisites

- Azure subscription with Azure OpenAI access
- Azure CLI, Python 3.x
- `pip install openai azure-search-documents azure-identity`

## Steps

### 1. Create Resources

```bash
az group create --name rg-ai102-rag --location eastus

# Azure OpenAI
az cognitiveservices account create --name ai102-openai \
  --resource-group rg-ai102-rag --kind OpenAI --sku S0 --location eastus --yes

# Azure AI Search
az search service create --name ai102-search \
  --resource-group rg-ai102-rag --sku basic --location eastus

# Storage for documents
az storage account create --name ai102docstorage \
  --resource-group rg-ai102-rag --sku Standard_LRS --location eastus
```

### 2. Deploy Models

```bash
# Deploy GPT-4o
az cognitiveservices account deployment create \
  --name ai102-openai --resource-group rg-ai102-rag \
  --deployment-name gpt-4o --model-name gpt-4o \
  --model-version "2024-08-06" --model-format OpenAI \
  --sku-capacity 10 --sku-name Standard

# Deploy embedding model
az cognitiveservices account deployment create \
  --name ai102-openai --resource-group rg-ai102-rag \
  --deployment-name text-embedding-3-small --model-name text-embedding-3-small \
  --model-version "1" --model-format OpenAI \
  --sku-capacity 10 --sku-name Standard
```

### 3. Generate Embeddings and Index Documents

```python
from openai import AzureOpenAI
from azure.search.documents import SearchClient
from azure.search.documents.indexes import SearchIndexClient
from azure.search.documents.indexes.models import (
    SearchIndex, SimpleField, SearchableField,
    VectorSearch, HnswAlgorithmConfiguration, VectorSearchProfile,
    SearchField, SearchFieldDataType
)
from azure.core.credentials import AzureKeyCredential

# Setup clients
openai_client = AzureOpenAI(
    api_key="<openai-key>", api_version="2024-02-01",
    azure_endpoint="https://ai102-openai.openai.azure.com"
)

index_client = SearchIndexClient(
    endpoint="https://ai102-search.search.windows.net",
    credential=AzureKeyCredential("<search-key>")
)

# Create index with vector field
index = SearchIndex(
    name="docs-index",
    fields=[
        SimpleField(name="id", type=SearchFieldDataType.String, key=True),
        SearchableField(name="content", type=SearchFieldDataType.String),
        SearchableField(name="title", type=SearchFieldDataType.String),
        SearchField(name="embedding", type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
                    searchable=True, vector_search_dimensions=1536,
                    vector_search_profile_name="my-profile"),
    ],
    vector_search=VectorSearch(
        algorithms=[HnswAlgorithmConfiguration(name="my-hnsw")],
        profiles=[VectorSearchProfile(name="my-profile", algorithm_configuration_name="my-hnsw")]
    )
)
index_client.create_or_update_index(index)

# Index sample documents
documents = [
    {"title": "Azure AI Search", "content": "Azure AI Search provides full-text, vector, and hybrid search..."},
    {"title": "Azure OpenAI", "content": "Azure OpenAI provides access to GPT-4 and embedding models..."},
]

search_client = SearchClient(
    endpoint="https://ai102-search.search.windows.net",
    index_name="docs-index", credential=AzureKeyCredential("<search-key>")
)

for i, doc in enumerate(documents):
    embedding = openai_client.embeddings.create(
        model="text-embedding-3-small", input=doc["content"]
    ).data[0].embedding
    doc["id"] = str(i)
    doc["embedding"] = embedding

search_client.upload_documents(documents)
```

### 4. Implement RAG Query

```python
from azure.search.documents.models import VectorizedQuery

def rag_query(question):
    # Step 1: Generate embedding for the question
    q_embedding = openai_client.embeddings.create(
        model="text-embedding-3-small", input=question
    ).data[0].embedding

    # Step 2: Hybrid search (keyword + vector)
    results = search_client.search(
        search_text=question,
        vector_queries=[VectorizedQuery(vector=q_embedding, k_nearest_neighbors=3, fields="embedding")],
        top=3
    )

    # Step 3: Build context from results
    context = "\n\n".join([r["content"] for r in results])

    # Step 4: Generate grounded response
    response = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": f"Answer using only this context:\n\n{context}\n\nIf the answer is not in the context, say 'I don't know'."},
            {"role": "user", "content": question}
        ],
        temperature=0.3
    )
    return response.choices[0].message.content

print(rag_query("What search capabilities does Azure AI Search provide?"))
```

## Summary

You deployed GPT-4o and embedding models, created a vector search index, indexed documents with embeddings, and implemented a complete RAG pipeline with hybrid search.

## Cleanup

```bash
az group delete --name rg-ai102-rag --yes --no-wait
```
