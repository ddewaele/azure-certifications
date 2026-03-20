# Describe Features of Generative AI Workloads on Azure (20-25%)

This is the **highest-weighted domain** on the AI-900 exam.

## What is Generative AI?

Generative AI refers to AI models that can create new content — text, images, code, audio, and video — based on patterns learned from training data. Unlike traditional AI that classifies or predicts, generative AI produces novel output.

### Generative AI vs Traditional AI

| Aspect | Traditional AI | Generative AI |
|--------|---------------|---------------|
| **Output** | Classification, prediction, detection | New content (text, images, code) |
| **Approach** | Trained for specific tasks | General-purpose models adapted via prompts |
| **Examples** | Spam filter, object detection | ChatGPT, DALL-E, GitHub Copilot |
| **Training** | Task-specific labeled data | Massive unlabeled datasets |

## Large Language Models (LLMs)

Large language models are deep learning models built on the **Transformer architecture**, trained on massive amounts of text data.

### How LLMs Work

1. **Tokenisation** — input text is broken into tokens (words, subwords, or characters) and mapped to numerical IDs
2. **Embeddings** — tokens are converted to dense vector representations that capture semantic meaning (similar words have similar vectors)
3. **Self-attention** — the model weighs the importance of each token relative to every other token in the sequence
4. **Prediction** — the model predicts the most probable next token(s) based on the input context
5. **Generation** — tokens are generated one at a time, each informed by all previously generated tokens

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Token** | The basic unit of text processing (word, subword, or character) |
| **Embedding** | A numerical vector representation of a token that captures semantic meaning |
| **Context window** | The maximum number of tokens the model can process at once |
| **Parameters** | The internal weights of the model (billions in modern LLMs) |
| **Pre-training** | Initial training on massive datasets to learn language patterns |
| **Fine-tuning** | Additional training on domain-specific data to specialise the model |

## Common Generative AI Scenarios

| Scenario | Description | Example |
|----------|-------------|---------|
| **Text generation** | Generate written content | Write marketing copy, emails, reports |
| **Code generation** | Write and debug code | GitHub Copilot, code completion |
| **Image generation** | Create images from text descriptions | DALL-E ("a cat wearing a space suit") |
| **Summarisation** | Condense long content into key points | Summarise a 50-page report |
| **Chatbots** | Conversational assistants | Customer support, internal helpdesks |
| **Translation** | Translate between languages | Real-time multilingual chat |
| **Data extraction** | Extract structured data from unstructured text | Parse invoices, contracts |

## AI Agents

AI agents extend LLMs beyond simple text generation by adding the ability to **plan**, **use tools**, and **take actions**.

### What Makes an Agent Different from a Chatbot?

| Capability | Basic Chatbot | AI Agent |
|-----------|---------------|----------|
| Text responses | Yes | Yes |
| Multi-step planning | No | Yes |
| Tool use (APIs, databases, code execution) | No | Yes |
| Autonomous action | No | Yes |
| Memory across interactions | Limited | Yes |

An agent can:
- Break complex tasks into subtasks
- Call external APIs to retrieve information
- Execute code to perform calculations
- Make decisions about which tools to use
- Iterate until the goal is achieved

## Prompt Engineering

Prompt engineering is the practice of crafting effective prompts to guide generative AI model responses.

### System Message

The system message defines the model's **persona, behaviour, and boundaries**:
```
You are a helpful travel assistant. Only answer travel-related questions.
Respond in a friendly, concise tone. If asked about non-travel topics,
politely decline.
```

### Key Parameters

| Parameter | Description | Effect |
|-----------|-------------|--------|
| **Temperature** | Controls randomness (0.0 to 2.0) | 0.0 = deterministic, focused; 1.0+ = creative, varied |
| **Top-p** | Nucleus sampling — considers tokens within cumulative probability p | Lower = more focused; higher = more diverse |
| **Max tokens** | Maximum length of the response | Controls output length |
| **Frequency penalty** | Reduces repetition of tokens already used | Higher = less repetition |

### Prompting Techniques

| Technique | Description | Example |
|-----------|-------------|---------|
| **Zero-shot** | Ask the model to perform a task with no examples | "Classify this review as positive or negative: ..." |
| **Few-shot** | Provide examples of desired input/output | "Review: Great! -> Positive. Review: Awful! -> Negative. Review: Nice quality -> ?" |
| **Chain of thought** | Ask the model to reason step by step | "Solve this problem step by step: ..." |
| **Retrieval-Augmented Generation (RAG)** | Provide relevant context from external sources | Inject search results into the prompt before asking a question |

## Responsible AI for Generative AI

### Key Concerns

| Concern | Description | Mitigation |
|---------|-------------|------------|
| **Hallucination** | Model generates plausible but factually incorrect content | Grounding, RAG, human review |
| **Bias** | Model reflects biases in training data | Balanced training data, bias testing |
| **Harmful content** | Model generates offensive, violent, or illegal content | Content filtering, system messages |
| **Copyright** | Generated content may resemble copyrighted material | Attribution, legal review |
| **Misinformation** | Model could be used to generate fake news | Content provenance, watermarking |

### Grounding

Grounding connects model output to **verifiable source data** to reduce hallucinations:
- Provide factual context in the prompt (RAG)
- Reference specific documents or databases
- Ask the model to cite sources
- Verify outputs against known facts

### Content Filtering

Azure OpenAI includes built-in content filters that:
- Block harmful input prompts (jailbreak attempts, hate speech)
- Filter harmful output (violence, self-harm, sexual content)
- Detect protected material (copyrighted text)
- Can be configured per deployment

## Azure Services for Generative AI

### Azure AI Foundry (formerly Azure AI Studio)

Azure AI Foundry is the **unified platform** for building generative AI applications.

| Feature | Description |
|---------|-------------|
| **Portal** | Web-based interface for building, testing, and deploying AI apps |
| **Projects** | Organise work into projects with shared resources |
| **Model catalog** | Browse and deploy hundreds of models (OpenAI, Meta Llama, Mistral, etc.) |
| **Prompt flow** | Visual tool for building LLM-based applications as workflows |
| **Evaluation** | Test and benchmark model performance with custom metrics |
| **Content safety** | Configure content filters and safety policies |
| **Playground** | Interactive chat interface for testing models |

### Azure OpenAI Service

Azure OpenAI provides **enterprise-grade access** to OpenAI models.

| Model Family | Capabilities |
|-------------|-------------|
| **GPT-4 / GPT-4o** | Advanced text generation, reasoning, code, multimodal (text + images) |
| **GPT-3.5 Turbo** | Fast, cost-effective text generation |
| **DALL-E** | Image generation from text descriptions |
| **Whisper** | Speech-to-text transcription |
| **Embeddings** | Convert text to vector representations for search and similarity |

**Key Azure OpenAI advantages over public OpenAI:**
- Enterprise security and compliance (SOC 2, HIPAA, etc.)
- Regional data residency — data stays in your chosen Azure region
- Built-in content filtering
- Private networking (VNet integration)
- Azure RBAC and managed identity support

### Azure AI Foundry Model Catalog

The model catalog provides access to models beyond OpenAI:

| Source | Example Models |
|--------|---------------|
| OpenAI | GPT-4o, GPT-4, DALL-E 3, Whisper |
| Meta | Llama 3.1, Llama 3.2 |
| Mistral | Mistral Large, Mixtral |
| Microsoft | Phi-3, Florence |
| Others | Cohere, AI21, Stability AI |

Models can be:
- **Deployed as managed endpoints** — pay-per-token serverless inference
- **Deployed to managed compute** — dedicated compute for consistent performance
- **Compared using benchmarks** — evaluate models on standard tasks before choosing

## Exam Tips

- This is the **highest-weighted domain** (20-25%) — expect the most questions here
- Know the difference between **generative AI** (creates content) and **traditional AI** (classifies/predicts)
- **Tokenisation** = text to tokens; **embeddings** = tokens to vectors; **attention** = weigh token importance
- **Temperature** controls randomness: 0 = deterministic, higher = more creative
- **System message** defines persona and boundaries — the most important prompt engineering tool
- **Few-shot** = provide examples; **zero-shot** = no examples; **chain of thought** = step-by-step reasoning
- **Hallucination** = confident but false output; **grounding** = connecting output to facts to reduce hallucinations
- **Azure OpenAI** provides GPT-4, DALL-E, Whisper with enterprise security and content filtering
- **Azure AI Foundry** is the portal for building gen AI apps — includes model catalog, prompt flow, and playground
- Know that the **model catalog** includes both OpenAI and open-source models (Llama, Mistral, Phi)
- **RAG** (Retrieval-Augmented Generation) reduces hallucinations by injecting relevant context into prompts
- **AI agents** extend LLMs with planning, tool use, and autonomous action capabilities
