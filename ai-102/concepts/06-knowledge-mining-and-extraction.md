# Implement Knowledge Mining and Information Extraction Solutions (15-20%)

## Azure AI Search

### Core Components

| Component | Description |
|-----------|-------------|
| **Index** | The searchable data structure (like a database table) |
| **Indexer** | Automated process that pulls data from a data source into an index |
| **Data source** | Where data comes from (Blob Storage, SQL, Cosmos DB, etc.) |
| **Skillset** | A pipeline of AI enrichment skills applied during indexing |
| **Knowledge store** | Persistent storage for enrichments (tables, blobs, files) |

### Architecture Flow

```
Data source → Indexer → [Skillset (AI enrichment)] → Index
                                     ↓
                              Knowledge store
```

### Creating an Index

An index defines the schema of searchable fields:

```json
{
  "name": "my-index",
  "fields": [
    {"name": "id", "type": "Edm.String", "key": true},
    {"name": "content", "type": "Edm.String", "searchable": true, "analyzer": "en.microsoft"},
    {"name": "title", "type": "Edm.String", "searchable": true, "filterable": true},
    {"name": "category", "type": "Edm.String", "filterable": true, "facetable": true},
    {"name": "embedding", "type": "Collection(Edm.Single)", "searchable": true,
     "vectorSearchProfile": "my-profile"},
    {"name": "metadata", "type": "Edm.String", "retrievable": true}
  ]
}
```

### Field Attributes

| Attribute | Description |
|-----------|-------------|
| **searchable** | Full-text searchable (analyzed) |
| **filterable** | Can be used in $filter expressions |
| **sortable** | Can be used for $orderby |
| **facetable** | Can be used for faceted navigation (counts per category) |
| **retrievable** | Returned in search results |
| **key** | Unique identifier for documents |

### Skillsets (AI Enrichment)

Built-in cognitive skills:

| Skill | Description |
|-------|-------------|
| **Language detection** | Detect the language of text |
| **Key phrase extraction** | Extract key phrases |
| **Entity recognition** | Identify named entities |
| **Sentiment analysis** | Determine sentiment |
| **Image analysis** | Extract tags, captions from images |
| **OCR** | Extract text from images |
| **Text split** | Split large text into pages/sentences |
| **Text merge** | Merge OCR text with original content |
| **Shaper** | Reshape data for knowledge store projections |
| **Embedding** | Generate vector embeddings |

### Custom Skills

Create your own skills as Azure Functions or web APIs:

```json
{
  "@odata.type": "#Microsoft.Skills.Custom.WebApiSkill",
  "name": "my-custom-skill",
  "uri": "https://my-function.azurewebsites.net/api/enrich",
  "httpMethod": "POST",
  "batchSize": 10,
  "inputs": [
    {"name": "text", "source": "/document/content"}
  ],
  "outputs": [
    {"name": "category", "targetName": "customCategory"}
  ]
}
```

Custom skills must:
- Accept POST requests with a JSON array of records
- Return a JSON array of records with matching `recordId` values
- Process within 230 seconds (timeout)

### Query Syntax

```
# Simple query
search=azure machine learning

# Full Lucene syntax
search=title:azure AND category:AI

# Filters
$filter=category eq 'AI' and rating gt 4

# Sorting
$orderby=date desc

# Facets
facet=category,count:10

# Wildcards
search=az*re

# Fuzzy matching
search=azyre~1
```

### Knowledge Store

Project enriched data to persistent storage:

| Projection Type | Storage | Use Case |
|----------------|---------|----------|
| **Table** | Azure Table Storage | Structured data for analytics, Power BI |
| **Object** | Azure Blob Storage (JSON) | Complex nested data |
| **File** | Azure Blob Storage (images) | Extracted images from documents |

### Semantic and Vector Search

| Search Type | Description |
|-------------|-------------|
| **Full-text** | Traditional keyword matching with BM25 ranking |
| **Semantic** | AI-powered re-ranking for intent-aware results |
| **Vector** | Similarity search using embeddings (cosine similarity) |
| **Hybrid** | Combines keyword + vector search for best results |

Vector search setup:
1. Generate embeddings using Azure OpenAI `text-embedding-ada-002`
2. Store vectors in a `Collection(Edm.Single)` field
3. Configure a vector search profile and algorithm (HNSW or exhaustive KNN)
4. Query with a vector representation of the user's question

## Azure Document Intelligence

### Prebuilt Models

| Model | Extracts |
|-------|----------|
| **Invoice** | Vendor, dates, amounts, line items |
| **Receipt** | Merchant, date, items, totals, tax |
| **ID document** | Name, DOB, address, ID number |
| **Business card** | Name, title, company, phone, email |
| **W-2 (US tax)** | Employer, employee, wages, taxes |
| **Health insurance card** | Member ID, group number, plan |

### Custom Models

| Model Type | Description |
|-----------|-------------|
| **Custom template** | Fixed-layout documents (forms with consistent structure) |
| **Custom neural** | Variable-layout documents (flexible structure) |
| **Composed model** | Combines multiple custom models — routes to the correct one automatically |

### Custom Model Training

1. Create a Document Intelligence resource
2. Upload labeled training documents (minimum 5)
3. Label the fields you want to extract
4. Train the model
5. Test with sample documents
6. Publish for production use

### Composed Models

Combine multiple custom models into one endpoint:
- Automatic model selection — the composed model determines which sub-model to use
- Useful when processing different document types through a single pipeline

## Azure Content Understanding

Azure Content Understanding (preview) processes multiple content types:

| Capability | Description |
|-----------|-------------|
| **OCR pipeline** | Extract text from images and documents |
| **Document summarisation** | Generate summaries of document content |
| **Document classification** | Classify documents into categories |
| **Entity extraction** | Extract entities, tables, and images from documents |
| **Video/audio processing** | Transcribe and analyse video/audio content |

### Content Understanding vs Document Intelligence

| Feature | Content Understanding | Document Intelligence |
|---------|----------------------|----------------------|
| Content types | Documents, images, video, audio | Documents and images |
| Focus | General content processing | Structured field extraction |
| Models | AI-powered analysis | Prebuilt + custom models |
| Best for | Multi-modal content pipelines | Form/invoice data extraction |

## Exam Tips

- Know the **AI Search pipeline**: data source > indexer > skillset > index (+ knowledge store)
- **Skillsets** enrich data during indexing — know the built-in skills (OCR, NER, key phrases, etc.)
- **Custom skills** are Azure Functions that accept/return JSON with `recordId`
- **Knowledge store projections**: tables (Table Storage), objects (Blob JSON), files (Blob images)
- Know **query syntax**: `$filter`, `$orderby`, `facet`, wildcards (`*`), fuzzy (`~`)
- **Vector search** requires embeddings + `Collection(Edm.Single)` field + HNSW algorithm
- **Hybrid search** = keyword + vector for best relevance
- **Semantic search** is an AI re-ranker that sits on top of keyword or hybrid results
- **Document Intelligence prebuilt models**: invoice, receipt, ID document, business card
- **Composed models** combine multiple custom models and auto-route documents
- **Custom template models** for fixed layouts; **custom neural models** for variable layouts
- Field attributes: know when to set `searchable`, `filterable`, `sortable`, `facetable`
