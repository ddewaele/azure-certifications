# AI-102 Glossary of Key Terms

## A

**Agent** — An AI system that can autonomously plan, reason, use tools (code interpreter, function calling, search), and take actions to accomplish goals beyond simple text generation.

**Azure AI Foundry (Microsoft Foundry)** — Unified platform for building generative AI applications. Includes model catalog, prompt flow, evaluation tools, playground, and project management via Hubs and Projects.

**Azure AI Language** — Service for NLP: sentiment analysis, NER, key phrase extraction, PII detection, CLU, question answering, summarisation, and custom text classification.

**Azure AI Search** — Cloud search service supporting full-text, vector, semantic, and hybrid search with AI enrichment via skillsets, indexers, and knowledge stores.

**Azure AI Speech** — Service for speech-to-text, text-to-speech, speech translation, speaker recognition, and custom speech/voice models.

**Azure AI Vision** — Service for image analysis (captions, tags, objects, OCR, spatial analysis) and custom image classification/object detection models.

**Azure Content Understanding** — Service for processing documents, images, video, and audio — extracting text, entities, tables, and generating summaries.

**Azure Document Intelligence** — Service for extracting structured data from documents using prebuilt models (invoice, receipt, ID) and custom/composed models.

**Azure OpenAI Service** — Enterprise-grade access to OpenAI models (GPT-4, DALL-E, Whisper, embeddings) with Azure security, compliance, and content filtering.

## B

**Blocklist** — A custom list of banned terms/phrases in Azure OpenAI content filters that blocks specific strings from appearing in inputs or outputs.

**Bounding box** — Rectangle coordinates (x, y, width, height) locating a detected object in an image, returned by object detection models.

## C

**Chunking** — Splitting documents into smaller segments (typically 500-1000 tokens) for embedding and indexing in a RAG solution.

**CLU (Conversational Language Understanding)** — Azure AI Language feature for building intent recognition models with intents, entities, and utterances. Successor to LUIS.

**Code Interpreter** — Agent tool that executes Python code in a sandboxed environment for calculations, data analysis, and chart generation.

**Composed model** — A Document Intelligence model that combines multiple custom models and automatically routes documents to the correct sub-model.

**Content filter** — Azure OpenAI safety feature that scans inputs and outputs for harmful content (hate, violence, sexual, self-harm) with configurable severity thresholds.

**Custom skill** — A developer-built Azure Function or web API integrated into an AI Search skillset as a WebApiSkill for custom enrichment logic.

## D

**Dense captions** — Azure AI Vision feature generating detailed descriptions for multiple regions within a single image, not just one caption for the whole image.

## E

**Embedding** — A dense vector representation of text (or images) where semantically similar items are close together in vector space. Used for vector search and RAG.

**Evaluation flow** — A prompt flow type specifically for assessing the quality of other flows, measuring groundedness, relevance, coherence, and fluency.

## F

**Facetable** — An Azure AI Search field attribute enabling faceted navigation (showing counts per category value).

**Filterable** — An Azure AI Search field attribute enabling $filter expressions for narrowing search results.

**Fine-tuning** — Further training a pre-trained model on domain-specific JSONL data to specialise its behaviour while retaining general knowledge.

**Function calling** — Agent capability where the model requests execution of developer-defined functions to interact with external systems (databases, APIs).

## G

**Groundedness** — A generative AI quality metric measuring how well model responses are supported by provided source data. Low groundedness indicates hallucination.

**Groundedness detection** — Azure OpenAI safety feature that detects when model outputs contain information not supported by the provided context.

## H

**Hub** — Top-level resource in Microsoft Foundry providing shared infrastructure (compute, storage, connections) for multiple Projects.

**Hybrid search** — Combining keyword (BM25) and vector search for optimal relevance. Recommended approach for RAG solutions.

**HNSW** — Hierarchical Navigable Small World — an approximate nearest neighbor algorithm used for vector search in Azure AI Search.

## I

**Indexer** — An Azure AI Search component that automatically pulls data from a data source, applies a skillset, and populates an index on a schedule.

## K

**Knowledge store** — Persistent storage for AI Search enrichments, supporting three projection types: tables (Table Storage), objects (Blob JSON), and files (Blob images).

## M

**Managed identity** — Azure feature providing automatic credential management for service-to-service authentication without storing secrets. Preferred over API keys in production.

**Model catalog** — A feature of Microsoft Foundry providing access to hundreds of models from OpenAI, Meta, Mistral, Microsoft, and others for evaluation and deployment.

## O

**Opinion mining** — Advanced sentiment analysis feature identifying aspect-level sentiment (e.g., "food: positive, service: negative") rather than just overall document sentiment.

## P

**PII detection** — Azure AI Language feature that identifies personally identifiable information (SSN, email, phone) and returns a redacted version of the text.

**Project** — A workspace within a Microsoft Foundry Hub for organizing AI work (models, flows, evaluations, data connections).

**Prompt flow** — Visual tool in Microsoft Foundry for building LLM application workflows as DAGs. Types: standard, chat, evaluation.

**Prompt shield** — Azure OpenAI safety feature that detects jailbreak and prompt injection attempts in user input.

**Provisioned throughput (PTU)** — Reserved Azure OpenAI capacity measured in Provisioned Throughput Units, guaranteeing consistent performance.

## R

**RAG (Retrieval-Augmented Generation)** — Pattern that grounds LLM responses by retrieving relevant documents from a search index and injecting them into the prompt as context.

## S

**Searchable** — An Azure AI Search field attribute enabling full-text search with text analysis (tokenisation, stemming).

**Semantic ranker** — AI-powered re-ranking in Azure AI Search that promotes results matching the semantic intent of the query.

**Skillset** — A pipeline of AI enrichment skills (built-in or custom) applied by an Azure AI Search indexer during document processing.

**Spatial Analysis** — Azure AI Vision feature for detecting presence and movement of people in video streams, running on edge hardware with GPU.

**SSML (Speech Synthesis Markup Language)** — XML-based markup for controlling text-to-speech output: prosody (rate, pitch, volume), breaks, emphasis, and pronunciation.

## T

**Thread** — A conversation session in the Agent Service that maintains message history across multiple runs.

## V

**Vector search** — Similarity search using embeddings (float arrays) to find semantically related content, even when different words are used.

**Video Indexer** — Azure service extracting comprehensive insights from video: transcripts, faces, keywords, sentiment, topics, scenes, and named entities.

## W

**WebApiSkill** — An Azure AI Search custom skill type that calls an external HTTP endpoint (Azure Function) during indexing for custom enrichment.
