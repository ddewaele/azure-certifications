# Lab 05: Generative AI Playground

## Overview

In this lab you will deploy a GPT model using Azure OpenAI, explore the Chat Playground, experiment with prompt engineering techniques, and explore the Azure AI Foundry model catalog.

### Learning Objectives

- Deploy a GPT model in Azure OpenAI
- Use the Chat Playground (system message, temperature, top-p)
- Apply prompt engineering techniques (few-shot, chain of thought)
- Explore the Azure AI Foundry portal and model catalog

## Prerequisites

- An active Azure subscription with access to Azure OpenAI (requires approval)
- Access to Azure AI Foundry (https://ai.azure.com)

## Steps

### 1. Create an Azure OpenAI Resource

```bash
az group create --name rg-ai900-genai --location eastus

az cognitiveservices account create \
  --name ai900-openai \
  --resource-group rg-ai900-genai \
  --kind OpenAI \
  --sku S0 \
  --location eastus \
  --yes
```

> **Note:** Azure OpenAI requires a separate access request. If not yet approved, apply at https://aka.ms/oaiapply.

### 2. Deploy a GPT Model

```bash
az cognitiveservices account deployment create \
  --name ai900-openai \
  --resource-group rg-ai900-genai \
  --deployment-name gpt-4o-mini \
  --model-name gpt-4o-mini \
  --model-version "2024-07-18" \
  --model-format OpenAI \
  --sku-capacity 10 \
  --sku-name Standard
```

Or deploy via the Azure AI Foundry portal:
1. Go to https://ai.azure.com
2. Navigate to your project
3. Go to **Model catalog** > search for "gpt-4o-mini" > **Deploy**

### 3. Explore the Chat Playground

1. In Azure AI Foundry, go to **Playgrounds > Chat**
2. Select your deployed **gpt-4o-mini** model

#### Set a System Message

In the system message field, enter:

```
You are a helpful assistant that explains Azure AI services in simple terms.
Keep responses concise (2-3 sentences). If asked about topics outside Azure AI,
politely decline and redirect to Azure AI topics.
```

#### Test the System Message

Try these prompts:
- "What is Azure AI Vision?"
- "Explain the difference between Azure AI Language and Azure AI Speech."
- "What is the capital of France?" (should be redirected)

#### Adjust Parameters

Experiment with the following parameters:

| Test | Temperature | Top-p | Expected Behaviour |
|------|------------|-------|-------------------|
| Test 1 | 0.0 | 1.0 | Deterministic, consistent responses |
| Test 2 | 0.7 | 0.9 | Balanced creativity |
| Test 3 | 1.5 | 1.0 | Highly creative, potentially less focused |

Ask the same question with each setting and compare the outputs.

### 4. Prompt Engineering Techniques

#### Zero-shot Prompting

Simply ask a question with no examples:

```
Classify the following review as Positive, Negative, or Neutral:
"The Azure portal is intuitive but loading times could be improved."
```

#### Few-shot Prompting

Provide examples before the question:

```
Classify each review:

Review: "Absolutely love the new dashboard!" -> Positive
Review: "Terrible support experience, waited 3 hours." -> Negative
Review: "The update was released on Tuesday." -> Neutral

Review: "The API documentation is clear and the SDKs are well-designed." -> ?
```

#### Chain of Thought

Ask the model to reason step by step:

```
A company has 500 employees. They want to deploy an AI chatbot. The chatbot
will handle approximately 200 queries per hour during business hours (8 hours).
Each query costs $0.002 to process.

Calculate the daily cost step by step.
```

### 5. Explore the Model Catalog

1. In Azure AI Foundry, go to **Model catalog**
2. Browse available models:
   - Filter by **Provider**: OpenAI, Meta, Mistral, Microsoft
   - Filter by **Task**: Chat completion, text generation, embeddings, image generation
3. Compare models:
   - Click on a model to see its description, capabilities, and benchmarks
   - Note the differences between model families (GPT-4o vs Llama 3.1 vs Mistral Large)
4. Review model cards for responsible AI information

### 6. Test the API with Python

```python
from openai import AzureOpenAI

client = AzureOpenAI(
    api_key="<your-key>",
    api_version="2024-02-01",
    azure_endpoint="<your-endpoint>"
)

response = client.chat.completions.create(
    model="gpt-4o-mini",  # deployment name
    messages=[
        {"role": "system", "content": "You are a helpful Azure AI tutor."},
        {"role": "user", "content": "What are the three types of machine learning?"}
    ],
    temperature=0.3,
    max_tokens=200
)

print(response.choices[0].message.content)
```

### 7. Observe Content Filtering

Azure OpenAI includes built-in content filters. Test by asking:
- A normal question (should respond normally)
- A question about harmful topics (should be filtered and blocked)

Review the content filter settings in your Azure OpenAI resource under **Content filters**.

## Summary

You deployed a GPT model in Azure OpenAI, experimented with the Chat Playground to understand system messages, temperature, and top-p parameters. You applied prompt engineering techniques (zero-shot, few-shot, chain of thought) and explored the Azure AI Foundry model catalog. You also observed Azure OpenAI's built-in content filtering.

## Key Takeaways

- **System messages** define the chatbot's persona and boundaries
- **Temperature** controls randomness: low = deterministic, high = creative
- **Few-shot prompting** improves accuracy by providing examples
- **Azure AI Foundry model catalog** provides access to OpenAI and open-source models
- **Content filtering** is built into Azure OpenAI by default

## Cleanup

```bash
az group delete --name rg-ai900-genai --yes --no-wait
```
