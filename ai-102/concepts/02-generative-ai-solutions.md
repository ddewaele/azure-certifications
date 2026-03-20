# Implement Generative AI Solutions (15-20%)

## Building Generative AI Solutions with Microsoft Foundry

### Microsoft Foundry Architecture

| Component | Description |
|-----------|-------------|
| **Hub** | Top-level resource that provides shared infrastructure (compute, storage, networking) |
| **Project** | Workspace within a hub for organizing AI work (models, data, flows) |
| **Model catalog** | Browse, evaluate, and deploy models from OpenAI, Meta, Mistral, Microsoft |
| **Prompt flow** | Visual tool for building LLM application workflows |
| **Evaluation** | Built-in tools to assess model quality, safety, and groundedness |

### Hub and Project Hierarchy

```
Hub (shared resources)
├── Project A (chatbot app)
│   ├── Model deployments
│   ├── Prompt flows
│   └── Evaluation runs
├── Project B (document analysis)
│   ├── Model deployments
│   └── Custom data connections
└── Shared connections (Azure OpenAI, AI Search, Storage)
```

### Deploying Generative AI Models

| Deployment Type | Description | Billing |
|----------------|-------------|---------|
| **Serverless API** | Pay-per-token, no reserved compute | Per token |
| **Managed compute** | Dedicated VM instances | Per hour |
| **Provisioned throughput** | Reserved token capacity (PTU) | Per PTU-hour |

### Prompt Flow

Prompt flow enables building LLM apps as directed acyclic graphs (DAGs):

- **Nodes:** LLM calls, Python code, tools, prompt templates
- **Connections:** Link nodes in a flow
- **Variants:** A/B test different prompts or parameters
- **Evaluation flows:** Measure quality metrics automatically

Flow types:
- **Standard flow** — general-purpose LLM orchestration
- **Chat flow** — conversation-oriented with chat history
- **Evaluation flow** — assess quality of other flows

### RAG (Retrieval-Augmented Generation)

RAG grounds model responses in your own data to reduce hallucinations:

1. **Index your data** — upload documents to Azure AI Search (vector + keyword index)
2. **Retrieve relevant chunks** — query the index with the user's question
3. **Augment the prompt** — inject retrieved context into the system message
4. **Generate a response** — the model answers using the provided context

```
User question → Search index → Retrieve top-K chunks →
  Inject into prompt → LLM generates grounded response
```

**Key components for RAG:**
- **Azure AI Search** — vector store and retrieval engine
- **Embeddings model** — convert text to vectors (e.g., `text-embedding-ada-002`)
- **Chunking strategy** — split documents into manageable pieces (typically 500-1000 tokens)
- **Azure Blob Storage** — store source documents

### Model Evaluation

| Metric | Description |
|--------|-------------|
| **Groundedness** | Are responses supported by provided context? |
| **Relevance** | Are responses relevant to the question? |
| **Coherence** | Are responses logically consistent and well-structured? |
| **Fluency** | Are responses grammatically correct and natural? |
| **Similarity** | How close are responses to reference answers? |
| **F1 / BLEU / ROUGE** | Token-level overlap metrics for text generation |

### Microsoft Foundry SDK Integration

```python
from azure.ai.projects import AIProjectClient
from azure.identity import DefaultAzureCredential

project = AIProjectClient(
    credential=DefaultAzureCredential(),
    endpoint="https://<hub>.api.azureml.ms",
    project_name="my-project"
)
```

### Prompt Templates

Use Jinja2-style templates for reusable, parameterised prompts:

```
system:
You are a helpful assistant that answers questions about {{topic}}.
Use only the following context to answer:
{{context}}

user:
{{question}}
```

## Azure OpenAI in Foundry Models

### Key Models

| Model | Capabilities |
|-------|-------------|
| **GPT-4o** | Text + image input, text output. Fastest GPT-4 variant |
| **GPT-4** | Advanced reasoning, coding, analysis |
| **GPT-3.5 Turbo** | Fast, cost-effective text generation |
| **DALL-E 3** | Image generation from text prompts |
| **Whisper** | Speech-to-text transcription |
| **text-embedding-ada-002 / text-embedding-3-small** | Text to vector embeddings |

### Chat Completions API

```python
from openai import AzureOpenAI

client = AzureOpenAI(
    api_key="<key>",
    api_version="2024-02-01",
    azure_endpoint="https://<resource>.openai.azure.com"
)

response = client.chat.completions.create(
    model="gpt-4o",  # deployment name
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Explain Azure AI Search."}
    ],
    temperature=0.7,
    max_tokens=500
)
```

### DALL-E Image Generation

```python
response = client.images.generate(
    model="dall-e-3",
    prompt="A futuristic Azure data center in the clouds",
    size="1024x1024",
    quality="standard",
    n=1
)
image_url = response.data[0].url
```

### Multimodal Models (GPT-4o Vision)

```python
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "What's in this image?"},
            {"type": "image_url", "image_url": {"url": "https://example.com/photo.jpg"}}
        ]
    }]
)
```

## Optimizing and Operationalizing Generative AI

### Parameter Tuning

| Parameter | Effect | Range |
|-----------|--------|-------|
| **temperature** | Randomness of output | 0.0 (deterministic) to 2.0 (creative) |
| **top_p** | Nucleus sampling threshold | 0.0 to 1.0 |
| **max_tokens** | Maximum response length | 1 to model's limit |
| **frequency_penalty** | Reduce repetition of used tokens | -2.0 to 2.0 |
| **presence_penalty** | Encourage new topics | -2.0 to 2.0 |
| **stop** | Sequences that halt generation | Array of strings |

### Model Monitoring

- **Token usage** — track consumption per deployment
- **Latency** — measure time-to-first-token and total response time
- **Error rates** — monitor 429 (rate limit) and 500 (server error) responses
- **Content filter triggers** — track blocked requests
- **Azure Monitor diagnostics** — enable logging for all API calls

### Prompt Engineering Techniques

| Technique | Description |
|-----------|-------------|
| **System message** | Define persona, constraints, output format |
| **Few-shot** | Provide examples in the prompt |
| **Chain of thought** | "Think step by step" |
| **ReAct** | Reason + Act (reasoning interleaved with tool calls) |
| **Self-consistency** | Generate multiple responses and pick the most common |
| **Meta-prompting** | Ask the model to improve its own prompt |

### Fine-tuning

Fine-tune a base model on custom data:
1. Prepare training data in JSONL format (conversations)
2. Upload to Azure OpenAI
3. Create a fine-tuning job specifying the base model and hyperparameters
4. Deploy the fine-tuned model

Use cases: domain-specific tone, consistent formatting, specialised knowledge.

### Container and Edge Deployment

- Deploy models to **Azure Container Instances** or **AKS** for custom infrastructure
- Use **ONNX Runtime** for optimised inference on edge devices
- Azure OpenAI does not support container deployment (cloud-only)

## Exam Tips

- Know the **Hub > Project** hierarchy and what is shared vs project-specific
- Understand the **RAG pattern** end-to-end: indexing, retrieval, augmentation, generation
- Know all **evaluation metrics** (groundedness, relevance, coherence, fluency)
- **Prompt flow** has three types: standard, chat, evaluation
- Know the difference between **serverless**, **managed compute**, and **provisioned throughput** deployments
- **DALL-E** for images, **Whisper** for speech-to-text, **GPT-4o** for multimodal (text + images)
- **temperature** controls randomness; **top_p** controls token pool; don't tune both simultaneously
- Fine-tuning requires JSONL training data and creates a new model deployment
- **Embeddings** are vectors used for semantic search in RAG solutions
