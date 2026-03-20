# Plan and Manage an Azure AI Solution (20-25%)

This is the **highest-weighted domain** on the AI-102 exam.

## Selecting the Appropriate Microsoft Foundry Services

### Service Selection by Workload

| Workload | Primary Service | Key Capabilities |
|----------|----------------|------------------|
| **Generative AI** | Azure OpenAI Service / AI Foundry | GPT-4, DALL-E, Whisper, embeddings, prompt flow |
| **Computer vision** | Azure AI Vision | Image analysis, OCR, spatial analysis, custom models |
| **NLP** | Azure AI Language | Sentiment, NER, key phrases, CLU, question answering |
| **Speech** | Azure AI Speech | STT, TTS, translation, speaker recognition, custom speech |
| **Information extraction** | Azure Document Intelligence | Prebuilt models (invoice, receipt, ID), custom models, composed models |
| **Knowledge mining** | Azure AI Search | Full-text search, vector search, semantic ranking, AI enrichment |

### Multi-Service vs Single-Service Resources

| Resource Type | Description | Use Case |
|---------------|-------------|----------|
| **Multi-service (AI Services)** | Single endpoint and key for multiple services | Simplify management, single billing |
| **Single-service** | Dedicated resource for one service | Separate billing, isolated access control |

- Multi-service uses `kind: CognitiveServices`
- Single-service uses specific kinds: `TextAnalytics`, `ComputerVision`, `SpeechServices`, etc.
- Azure OpenAI is always a separate resource (`kind: OpenAI`)

## Planning, Creating, and Deploying AI Services

### Resource Creation

```bash
# Multi-service resource
az cognitiveservices account create \
  --name my-ai-services \
  --resource-group my-rg \
  --kind CognitiveServices \
  --sku S0 \
  --location eastus

# Azure OpenAI resource
az cognitiveservices account create \
  --name my-openai \
  --resource-group my-rg \
  --kind OpenAI \
  --sku S0 \
  --location eastus
```

### Model Deployment Options

| Option | Description | Best For |
|--------|-------------|----------|
| **Serverless (pay-per-token)** | No dedicated compute, billed per request | Low/variable traffic |
| **Provisioned throughput** | Reserved capacity with guaranteed performance | Consistent high throughput |
| **Global deployment** | Routes to optimal region automatically | Multi-region availability |
| **Data zone deployment** | Data stays within a geographic boundary | Compliance requirements |

### SDKs and APIs

| Language | SDK Package |
|----------|-------------|
| Python | `azure-ai-textanalytics`, `azure-cognitiveservices-speech`, `azure-ai-vision`, `openai` |
| C# | `Azure.AI.TextAnalytics`, `Microsoft.CognitiveServices.Speech`, `Azure.AI.Vision`, `Azure.AI.OpenAI` |
| REST | All services expose REST APIs with `Ocp-Apim-Subscription-Key` header |

### Endpoints

Every AI service has a **default endpoint** in the format:
```
https://<resource-name>.cognitiveservices.azure.com/
```

Azure OpenAI endpoints:
```
https://<resource-name>.openai.azure.com/
```

### CI/CD Integration

- Use ARM templates, Bicep, or Terraform for infrastructure as code
- Deploy models via Azure CLI or REST API in pipelines
- Version and track models in the AI Foundry model registry
- Use deployment slots for blue-green deployments

### Container Deployment

Azure AI services can run in Docker containers for:
- **Offline scenarios** — no internet required after pulling the container
- **Data sovereignty** — data never leaves your environment
- **Low latency** — co-locate with your application

Available containers: Language, Speech, Vision, Document Intelligence.

Containers still require periodic billing calls to Azure (connected or disconnected billing).

## Managing, Monitoring, and Securing AI Services

### Monitoring

| Tool | What It Monitors |
|------|-----------------|
| **Azure Monitor** | Metrics (latency, errors, requests), diagnostic logs |
| **Azure Monitor alerts** | Notifications on threshold breaches |
| **Application Insights** | End-to-end tracing, dependency tracking |
| **Cost Management** | Spending trends, budgets, forecasts |

Key metrics to monitor:
- Total requests, successful requests, failed requests
- Latency (average, P95, P99)
- Token consumption (for OpenAI)
- Rate limiting (HTTP 429 responses)

### Cost Management

| Strategy | Description |
|----------|-------------|
| **Pricing tier selection** | Free (F0) for development, Standard (S0) for production |
| **Commitment tiers** | Pre-purchase tokens/calls at a discount for OpenAI |
| **Budgets and alerts** | Set spending limits with Azure Cost Management |
| **Resource consolidation** | Use multi-service resources to simplify billing |

### Key Management

- Every resource has two keys (key1, key2) for **zero-downtime rotation**
- Rotation process: update apps to use key2, regenerate key1, update apps to use key1, regenerate key2
- Store keys in **Azure Key Vault** — never in code or config files
- Use **managed identity** to access Key Vault without storing secrets

### Authentication

| Method | Description | Best For |
|--------|-------------|----------|
| **API key** | Pass `Ocp-Apim-Subscription-Key` header | Quick development, testing |
| **Microsoft Entra ID (AAD) token** | OAuth 2.0 bearer token | Production, RBAC, audit |
| **Managed identity** | Automatic token management for Azure resources | Service-to-service auth |

**Best practice:** Use managed identity in production. Assign the `Cognitive Services User` role for inference, `Cognitive Services Contributor` for management.

## Implementing AI Solutions Responsibly

### Content Moderation

- **Azure AI Content Safety** — detect harmful text and images (hate, violence, self-harm, sexual)
- Severity levels: 0 (safe) to 6 (severe)
- Can be called as a standalone API or integrated into Azure OpenAI

### Content Filters and Blocklists

Azure OpenAI content filters:
- **Input filters** — scan prompts before they reach the model
- **Output filters** — scan completions before they reach the user
- **Categories:** hate, sexual, violence, self-harm
- **Configurable severity thresholds** per category
- **Blocklists** — custom lists of banned terms/phrases

### Prompt Shields and Harm Detection

- **Prompt shields** — detect jailbreak and prompt injection attempts
- **Groundedness detection** — detect hallucinated content not supported by source data
- **Protected material detection** — detect copyrighted text in outputs

### Responsible AI Governance

- Document AI use cases and risk assessments
- Define roles and responsibilities for AI oversight
- Implement human-in-the-loop for high-stakes decisions
- Regular auditing of model outputs for bias and accuracy
- Transparency notes for each AI service (published by Microsoft)

## Exam Tips

- This is the **largest domain** (20-25%) — expect the most questions here
- Know when to use **multi-service vs single-service** resources
- Understand **key rotation** with two keys for zero-downtime
- **Managed identity + Entra ID** is always preferred over API keys in production
- Know the **container deployment** model — containers still need billing connectivity
- **Content filters** in Azure OpenAI are configured per deployment, not per resource
- **Prompt shields** protect against jailbreak; **blocklists** block specific terms
- Know the difference between `Cognitive Services User` (inference) and `Cognitive Services Contributor` (management) roles
- Azure Monitor + Application Insights for monitoring; Cost Management for billing
