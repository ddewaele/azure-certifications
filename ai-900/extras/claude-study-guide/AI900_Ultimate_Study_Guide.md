# AI-900: Microsoft Azure AI Fundamentals
# ✦ Ultimate Study Guide ✦

> **Exam retiring June 30, 2026 — earn your cert before then!**
> Updated to reflect the May 2025 skills revision.

---

## Table of Contents

1. [Exam Overview & Fast Facts](#1-exam-overview--fast-facts)
2. [Domain Breakdown & Weightings](#2-domain-breakdown--weightings)
3. [Domain 1 — AI Workloads & Responsible AI (15–20%)](#3-domain-1--ai-workloads--responsible-ai-1520)
4. [Domain 2 — Machine Learning on Azure (15–20%)](#4-domain-2--machine-learning-on-azure-1520)
5. [Domain 3 — Computer Vision on Azure (15–20%)](#5-domain-3--computer-vision-on-azure-1520)
6. [Domain 4 — NLP Workloads on Azure (15–20%)](#6-domain-4--nlp-workloads-on-azure-1520)
7. [Domain 5 — Generative AI on Azure (20–25%)](#7-domain-5--generative-ai-on-azure-2025)
8. [Cheat Sheet — One Page Summary](#8-cheat-sheet--one-page-summary)
9. [Glossary A–Z](#9-glossary-az)
10. [Tips & Tricks to Pass the Exam](#10-tips--tricks-to-pass-the-exam)
11. [Recommended Study Plan](#11-recommended-study-plan)
12. [References & Resources](#12-references--resources)

---

## 1. Exam Overview & Fast Facts

| Item | Detail |
|---|---|
| **Exam code** | AI-900 |
| **Full name** | Microsoft Azure AI Fundamentals |
| **Certification earned** | Microsoft Certified: Azure AI Fundamentals |
| **Price** | ~$99 USD (varies by country; student discounts available) |
| **Number of questions** | 40–60 |
| **Duration** | Approx. 45–60 minutes |
| **Passing score** | 700 / 1,000 |
| **Question types** | Multiple choice, scenario-based, drag-and-drop matching |
| **Delivery** | Online proctored (at home) or Pearson VUE test center |
| **Languages** | 13 languages including English, French, German, Spanish, Arabic, Chinese |
| **Retake policy** | 24 hours after first fail; varies for subsequent retakes |
| **Exam retirement** | June 30, 2026 |
| **ACE credit eligible** | Yes — may earn college credit |
| **Prerequisites** | None — no coding or cloud experience required |
| **Next certifications** | AI-102 (Azure AI Engineer Associate), DP-100 (Azure Data Scientist Associate) |

> ⚠️ **Register with your personal Microsoft account (MSA)** — not your work/school account. Records tied to organizational accounts may be lost if you leave the organization.

---

## 2. Domain Breakdown & Weightings

The exam is divided into **five domains** as of May 2, 2025:

```
┌────────────────────────────────────────────────────────────┬──────────┐
│ Domain                                                     │ Weight   │
├────────────────────────────────────────────────────────────┼──────────┤
│ 1. AI Workloads and Considerations                         │ 15–20%  │
│ 2. Fundamental Principles of Machine Learning on Azure     │ 15–20%  │
│ 3. Computer Vision Workloads on Azure                      │ 15–20%  │
│ 4. Natural Language Processing Workloads on Azure          │ 15–20%  │
│ 5. Generative AI Workloads on Azure  ← HIGHEST WEIGHT     │ 20–25%  │
└────────────────────────────────────────────────────────────┴──────────┘
```

> 💡 **Key insight:** Generative AI is now the highest-weighted domain (20–25%) following the May 2025 revision. Azure OpenAI, GPT, Microsoft Copilot, and responsible AI for generative AI are heavily tested. Prioritize this domain.

---

## 3. Domain 1 — AI Workloads & Responsible AI (15–20%)

### 3.1 What Is Artificial Intelligence?

Artificial intelligence is **software that imitates human capabilities** — predicting outcomes, recognizing patterns, interpreting visuals, communicating in language, and gathering information from multiple sources.

**Key distinction:** AI is not traditional rule-based software. It learns from data.

### 3.2 Common AI Workload Types

| Workload | What It Does | Azure Service |
|---|---|---|
| **Machine Learning** | Train models to predict/classify from data | Azure Machine Learning |
| **Computer Vision** | Interpret images and video | Azure AI Vision, Face |
| **Natural Language Processing** | Understand and generate text/speech | Azure AI Language, Speech, Translator |
| **Document Processing** | Extract structured data from forms | Azure AI Document Intelligence |
| **Generative AI** | Create new content (text, images, code) | Azure OpenAI, Azure AI Foundry |
| **Conversational AI** | Chatbots and virtual agents | Azure AI Foundry Agent Service |
| **Knowledge Mining** | Index and search unstructured data | Azure AI Search |

**Real-world example — Auto-insurance claim AI:**
- NLP → understands the customer's verbal/written claim
- Computer Vision → assesses vehicle damage from photos
- Machine Learning → predicts repair costs
- Information Extraction → detects potential fraud patterns

### 3.3 Microsoft's Six Responsible AI Principles

> These are **frequently tested** — know all six with a real-world example for each.

| Principle | Core Idea | Classic Example |
|---|---|---|
| **Fairness** | AI must not discriminate | Loan approval systems must not disadvantage applicants based on gender, ethnicity, or other protected attributes |
| **Reliability & Safety** | Systems must perform as intended | Autonomous vehicles and healthcare diagnostic apps require rigorous testing before deployment |
| **Privacy & Security** | Data must be protected | Models trained on sensitive personal data must have built-in Azure security and compliance controls |
| **Inclusiveness** | AI should benefit everyone | Accessibility tools helping people with visual or hearing impairments interact with technology |
| **Transparency** | Users should understand what AI does | A customer support chatbot must disclose it is an AI, its capabilities, and its limitations |
| **Accountability** | Humans remain responsible | Developers and organizations must follow governance frameworks; AI decisions must be auditable |

**Memory trick:** **FRIPT-A** — Fairness, Reliability, Inclusiveness, Privacy, Transparency, Accountability

---

## 4. Domain 2 — Machine Learning on Azure (15–20%)

### 4.1 Core ML Concepts

| Term | Definition |
|---|---|
| **Feature (X)** | A measurable input attribute used to train or run the model |
| **Label (Y)** | The output value the model is trained to predict |
| **Training** | Fitting an algorithm to labeled data to create a model |
| **Validation** | Evaluating model performance on held-back data |
| **Inferencing** | Using a trained model to predict on new, unseen data |
| **Overfitting** | Model performs well on training data but poorly on new data |
| **Underfitting** | Model is too simple to capture the patterns in the data |

The model learns a function: **f(x) = ŷ** (predicted y)

**Typical data split:** 70% training / 30% validation (or 80/20)

---

### 4.2 Types of Machine Learning

#### Supervised Learning — training data has both features AND labels

| Type | Predicts | Algorithm | Example |
|---|---|---|---|
| **Regression** | A numeric value | Linear Regression | House price, ice cream sales, fuel efficiency |
| **Binary Classification** | One of two classes (yes/no) | Logistic Regression | Spam vs. not spam; diabetes risk |
| **Multiclass Classification** | One of 3+ classes | Logistic Regression, Neural Networks | Penguin species; movie genre |

#### Unsupervised Learning — training data has NO labels

| Type | Does What | Algorithm | Example |
|---|---|---|---|
| **Clustering** | Groups similar data points | K-Means | Customer segmentation; grouping products by behavior |

#### Reinforcement Learning *(AI-900 level: awareness only)*
An agent learns by trial and error through rewards and penalties — used in game AI and robotics.

---

### 4.3 Model Evaluation Metrics

#### Regression Metrics

| Metric | Formula Concept | Insight |
|---|---|---|
| **MAE** (Mean Absolute Error) | Average of \|predicted − actual\| | Easy to interpret; in original units |
| **MSE** (Mean Squared Error) | Average of (predicted − actual)² | Penalizes large errors heavily |
| **RMSE** (Root Mean Squared Error) | √MSE | In original units; best for communicating error magnitude |
| **R²** (R-squared) | % variance explained by model | 0 = useless; 1 = perfect fit |

#### Classification Metrics

| Metric | What It Measures | "When is this most important?" |
|---|---|---|
| **Accuracy** | % of all predictions correct | Balanced datasets |
| **Precision** | Of all predicted positives, how many were truly positive | When false positives are costly (e.g., spam filter flagging real email) |
| **Recall** | Of all actual positives, how many did the model find | When false negatives are costly (e.g., missing a cancer diagnosis) |
| **F1 Score** | Harmonic mean of precision & recall | When you need a single balanced metric |

> **Confusion matrix aid:**
> - True Positive (TP): predicted positive, actually positive ✅
> - True Negative (TN): predicted negative, actually negative ✅
> - False Positive (FP): predicted positive, actually negative ❌ (Type I error)
> - False Negative (FN): predicted negative, actually positive ❌ (Type II error)

#### Clustering Metrics (Unsupervised)

| Metric | Range | Meaning |
|---|---|---|
| **Silhouette Score** | −1 to +1 | Closer to +1 = well-separated, compact clusters |

---

### 4.4 Deep Learning & Neural Networks

**Architecture:**

```
Input Layer  →  Hidden Layer(s)  →  Output Layer
  (Features)     (Learn patterns)     (Prediction)
```

- Each **neuron** takes inputs, applies **weights**, sums them, then passes through an **activation function**
- **Loss** = difference between predicted output and actual label
- Training minimizes loss using **gradient descent** (iteratively adjusting weights)
- Networks with many hidden layers = "deep" learning

**Transformer Architecture** (basis of all modern LLMs):
1. **Tokenization** — text → token IDs
2. **Embeddings** — token IDs → semantic vectors
3. **Encoder** — creates contextual representations via attention
4. **Decoder** — generates output one token at a time

---

### 4.5 Azure Machine Learning

**Azure Machine Learning Studio** is the browser-based portal for the full ML lifecycle:

| Capability | Description |
|---|---|
| **Notebooks** | Write and run Python/R code |
| **Pipelines** | Automated, reusable ML workflows |
| **AutoML** | Automatically selects best algorithm for your data and goal |
| **Designer** | Visual drag-and-drop ML workflow builder |
| **Model Registry** | Version and manage trained models |
| **Endpoints** | Deploy models as web services for inferencing |
| **Responsible AI Dashboard** | Visualize fairness, explainability, error analysis |

**AutoML supports:** Regression, Classification, Time-series Forecasting, Computer Vision, NLP

---

## 5. Domain 3 — Computer Vision on Azure (15–20%)

### 5.1 How Computers See Images

Every image = a grid of **pixels**.
- Grayscale: pixel values 0 (black) → 255 (white)
- Color: three channels — Red, Green, Blue (RGB), each 0–255

**Convolutional Neural Networks (CNNs)** process images by:
1. Applying learnable **filters** to detect patterns (edges, textures, shapes)
2. Passing detected features through layers of increasing abstraction
3. Outputting a prediction with a confidence/probability score

---

### 5.2 Computer Vision Solution Types

| Solution Type | What It Does | Example |
|---|---|---|
| **Image Classification** | Assigns a label to the whole image | "Is this a cat or a dog?" |
| **Object Detection** | Locates AND classifies multiple objects with bounding boxes | "There's a car at coordinates (x,y,w,h) with 92% confidence" |
| **Semantic Segmentation** | Labels every pixel by class | Self-driving car identifying road, pedestrians, signs |
| **Optical Character Recognition (OCR)** | Extracts printed/handwritten text from images | Digitizing invoices, reading license plates |
| **Facial Detection** | Locates faces in an image, returns bounding boxes | Security cameras, photo organization |
| **Facial Analysis** | Detects attributes (blur, exposure, glasses, mask) | Quality control for ID photo capture |
| **Facial Recognition** | Identifies WHO a face belongs to | **Restricted — requires Microsoft limited access approval** |

---

### 5.3 Azure AI Vision Service

**Image Analysis 4.0** capabilities:

| Feature | What It Returns |
|---|---|
| Smart-cropped thumbnails | Most visually important crop of an image |
| Image captions | Natural language description of the full image |
| Dense captions | Multiple descriptions for different regions |
| Object detection | Object names, confidence, bounding box coordinates |
| Tag extraction | Visual tags with confidence scores |
| Adult/sensitive content detection | Boolean flag + confidence |
| Brand detection | Identifies well-known logos and brands |
| People detection | Counts and locates people |
| **OCR (Read API)** | Printed and handwritten text, 70+ languages, with bounding box locations |

> ⚠️ **Only four Azure regions currently support Image Analysis 4.0.** Always create resources in a supported region.

---

### 5.4 Azure AI Face Service

Available to **all users** (no license required):
- Face detection (bounding box location)
- Face landmarks (pupils, nose tip, mouth corners)
- Attribute analysis: blur, noise, exposure, glasses, mask

**Requires Microsoft Limited Access approval:**
- Facial recognition (verifying identity)
- Face comparison (is this the same person?)
- Liveness detection (is this a real person, not a photo?)

---

### 5.5 OCR Deep Dive

| Feature | Details |
|---|---|
| Supported content | Printed text, handwritten text, mixed content |
| Languages | 70+ including Arabic, Chinese, Japanese, Russian |
| Output | Text content + bounding box coordinates per word/line |
| Modes | **Synchronous** (small images) / **Asynchronous Read** (large, multi-page documents) |
| Use cases | Digitizing receipts, reading forms, extracting whiteboard notes, processing business cards |

---

## 6. Domain 4 — NLP Workloads on Azure (15–20%)

### 6.1 NLP Task Reference

| NLP Task | What It Does | Azure Service |
|---|---|---|
| **Key Phrase Extraction** | Identifies the most important concepts in text | Azure AI Language |
| **Named Entity Recognition (NER)** | Detects and classifies entities (Person, Location, Date, Organization, Event) | Azure AI Language |
| **Sentiment Analysis** | Rates text as Positive, Negative, Neutral, Mixed (per sentence or document) | Azure AI Language |
| **Opinion Mining** | Links sentiment to specific aspects ("The food was great but service was slow") | Azure AI Language |
| **Language Detection** | Identifies the language of input text with confidence score | Azure AI Language |
| **Text Classification** | Assigns custom categories to text | Azure AI Language (custom) |
| **Summarization** | Produces extractive or abstractive summaries | Azure AI Language |
| **Translation** | Converts text between 100+ languages with auto-detection | Azure AI Translator |
| **Speech-to-Text (STT)** | Converts audio to text in real time or from files | Azure AI Speech |
| **Text-to-Speech (TTS)** | Converts text to natural-sounding audio | Azure AI Speech |
| **Speech Translation** | Translates spoken words across languages simultaneously | Azure AI Speech |

---

### 6.2 NLP Techniques: Evolution

```
Statistical Era                     →    Deep Learning Era
─────────────────────────────────────────────────────────────
Naïve Bayes (word probability)            Word Embeddings (semantic vectors)
TF-IDF (word importance scoring)          Transformers + Attention Mechanism
Bag-of-Words                              BERT, GPT architectures
No context understanding                  Rich contextual understanding
```

**Key insight:** Modern NLP doesn't just count words — it understands **meaning and context** through transformer embeddings.

---

### 6.3 Speech Processing

#### Speech-to-Text (Speech Recognition)
```
Audio capture → Phoneme identification → Map to text tokens → Predict word sequence
```

#### Text-to-Speech (Speech Synthesis)
```
Text input → Tokenization → Map to phonemes → Generate audio (pitch/tone/timbre adjusted)
```

---

### 6.4 Azure AI Language Playground Capabilities

Accessible directly in Azure AI Foundry portal:

| Capability | Input | Output |
|---|---|---|
| Sentiment analysis | "The hotel was noisy but the food was amazing." | Sentence-level + document-level sentiment scores |
| Entity recognition | "Noah Lyles won gold at the Paris 2024 Olympics." | Person: Noah Lyles; Location: Paris; Event: Olympics; Date: 2024 |
| Key phrase extraction | Any text | List of important phrases with confidence scores |
| Language detection | Any text | Language name + ISO code + confidence score |
| Health NER | Clinical notes | Medications, dosages, conditions, procedures |
| Summarization | Long document | Extractive summary (key sentences) or abstractive summary (rewritten) |
| PII detection | Customer data | Flags sensitive data: SSNs, phone numbers, emails |

---

### 6.5 Azure AI Translator

- Translates text across **100+ languages**
- **Auto-detects** source language
- Supports **batch document translation** (upload files)
- Supports **custom translation models** for domain-specific terminology (legal, medical, etc.)
- Available in the Translator Playground in Azure AI Foundry

---

### 6.6 Azure AI Speech

| Feature | Description |
|---|---|
| Real-time transcription | Live microphone → text |
| Fast transcription | Upload audio file → text in seconds |
| Batch transcription | Process many audio files in parallel |
| Speech translation | Spoken input → translated text/audio output |
| Pronunciation assessment | Score speaking accuracy; ideal for language learning apps |
| Neural TTS voices | 400+ voices across 140+ languages and locales |
| Custom Neural Voice | Train a voice model on your own recordings |
| TTS Avatars | Animated 2D/3D virtual presenters with synchronized lip movement |
| Video translation | Translate full video content across languages |

---

## 7. Domain 5 — Generative AI on Azure (20–25%)

> ⚡ **Highest-weighted domain. Expect scenario questions about Azure OpenAI, GPT, Copilot, and responsible generative AI.**

### 7.1 What Is Generative AI?

Generative AI **creates new, original content** in response to natural language prompts. Unlike discriminative AI (which classifies or predicts), generative AI produces:

| Output Type | Examples |
|---|---|
| **Text** | Summaries, emails, code, stories, translations |
| **Images** | DALL-E generated artwork, product mockups |
| **Code** | Python scripts, SQL queries, HTML |
| **Audio** | AI-generated voices and music |
| **Video** | AI-synthesized video content |

At the heart of generative AI are **Large Language Models (LLMs)** — transformer-based models trained on vast text corpora to predict the next token in a sequence.

---

### 7.2 How LLMs Work — The Transformer Pipeline

```
Input prompt
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 1: TOKENIZATION                                        │
│   "Hello world" → [15496, 995]                              │
│   Tokens = words, subwords, punctuation, emojis             │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2: EMBEDDING                                           │
│   Each token → multidimensional vector                      │
│   Similar meanings → similar vector directions              │
│   "dog" ≈ "puppy" ≠ "skateboard"                           │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3: ENCODER (attention layers)                          │
│   Builds contextual representations                         │
│   "bark" in "bark of a tree" ≠ "bark" as in dog sound      │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 4: DECODER (generates output)                          │
│   Predicts next token → repeat → builds full response       │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
Output response (one token at a time)
```

---

### 7.3 LLMs vs. SLMs

| | Large Language Models (LLMs) | Small Language Models (SLMs) |
|---|---|---|
| **Example** | GPT-4, GPT-4o | Phi-3, Mistral-7B |
| **Parameters** | Billions (100B+) | Millions to low billions |
| **Training data** | Vast, diverse internet-scale text | Curated, domain-specific datasets |
| **Capabilities** | General purpose — almost any topic | Faster, specialized, lower cost |
| **Compute** | Requires GPU clusters | Can run on edge devices/laptops |
| **Customization** | Harder to fine-tune | Easier to fine-tune for specific use cases |

---

### 7.4 Prompt Engineering

The design of inputs to maximize the quality of LLM outputs.

| Technique | Description | Example |
|---|---|---|
| **Clear goal** | Be explicit about what you want | "Write a 3-bullet executive summary of this report for a non-technical audience" |
| **Role / persona** | Tell the model who it should act as | "You are a senior data analyst. Interpret this CSV..." |
| **Grounding** | Provide source data or context | "Based on the following product specs: [text], answer..." |
| **Format constraint** | Specify output format | "Respond in JSON with keys: name, date, amount" |
| **Few-shot examples** | Show input-output examples | "Example: Input: 'Great!' → Output: Positive. Now classify: 'Terrible experience'" |
| **Chain of thought** | Ask the model to reason step by step | "Think step by step before giving your final answer" |
| **Iteration** | Refine based on previous outputs | Follow up: "Now make it shorter and more formal" |

**System message** = background instructions sent with every prompt that set the model's persona, rules, and grounding data.

---

### 7.5 AI Agents

Agents are AI applications that **take actions autonomously** on behalf of users.

```
User instruction → Language Model (understands intent) → Tool call → Action → Response
```

**Types of tools agents use:**
- **Knowledge tools** — access to data sources, documents, web search
- **Action tools** — APIs (calendar, email, CRM, payment, database write)

**Multi-agent orchestration** — multiple specialized agents coordinated by an orchestrator to complete complex workflows.

**Example — Expense Agent:**
> "Submit my taxi receipt for last Tuesday."
> Agent: reads receipt → extracts amount and date → validates policy → submits to expense system → sends confirmation

---

### 7.6 Responsible Generative AI

| Risk | Mitigation |
|---|---|
| **Hallucination** (generating false but plausible facts) | Grounding in verified data sources (RAG — Retrieval Augmented Generation) |
| **Harmful content** (violence, hate speech) | Content filters and Azure AI Content Safety |
| **Bias** | Diverse training data; red-teaming; human review |
| **Copyright infringement** | Clear usage policies; filtering of copyrighted content |
| **Prompt injection** (user manipulates system prompt) | Input validation; security layers |
| **Privacy violation** | Data anonymization; access controls |
| **Impersonation** | Disclosing AI identity; watermarking |

**4 stages of responsible generative AI deployment:**
1. **Identify** — catalog potential harms
2. **Measure** — evaluate harm likelihood and severity
3. **Mitigate** — apply technical and process controls
4. **Operate** — monitor in production; human oversight

---

### 7.7 Azure AI Foundry

Azure AI Foundry (previously branded as Azure AI Studio) is Microsoft's unified AI development platform.

**Key components:**

| Component | Description |
|---|---|
| **Model Catalog** | 11,000+ models from OpenAI, Microsoft, Meta, Mistral, and others. Compare by quality, cost, latency. |
| **Chat Playground** | Test deployed models with prompts, system messages, and parameters |
| **Agent Service** | Build and deploy AI agents with knowledge and action tools |
| **AI Services Hub** | Language, Speech, Vision, Document Intelligence — all integrated |
| **Prompt Flow** | Visual tool for building, testing, and deploying LLM-powered workflows |
| **Content Safety** | Detect and filter harmful content in inputs and outputs |
| **Evaluation Tools** | Measure model performance on custom test sets |

**Chat Playground parameters:**

| Parameter | Low Value | High Value |
|---|---|---|
| **Temperature** | Deterministic, consistent | Creative, varied, random |
| **Top-P** | Focuses on top likely tokens | Considers wider range of tokens |
| **Frequency Penalty** | May repeat phrases | Avoids repeating exact text |
| **Presence Penalty** | Stays on topic | Introduces new topics |
| **Max Tokens** | Short responses | Longer responses |

---

### 7.8 Azure OpenAI Service

Azure's enterprise-grade deployment of OpenAI models with:
- Azure security and compliance (RBAC, private endpoints, no data used for retraining by default)
- **Models available:** GPT-4, GPT-4o, GPT-4o mini, o1, o3, DALL-E 3, Whisper, text-embedding models
- **Azure OpenAI vs. OpenAI directly:** Azure adds enterprise SLAs, data residency, private networking

---

## 8. Cheat Sheet — One Page Summary

```
╔══════════════════════════════════════════════════════════════════════════╗
║              AI-900 CHEAT SHEET — KEEP THIS HANDY                       ║
╠══════════════════════════════════════════════════════════════════════════╣
║ RESPONSIBLE AI PRINCIPLES (FRIPT-A)                                     ║
║  Fairness · Reliability & Safety · Inclusiveness ·                      ║
║  Privacy & Security · Transparency · Accountability                     ║
╠══════════════════════════════════════════════════════════════════════════╣
║ ML TYPES                                                                 ║
║  Supervised (labeled data):                                              ║
║    → Regression = numeric output (house price, sales)                   ║
║    → Classification = category (spam, species, genre)                   ║
║  Unsupervised (no labels):                                               ║
║    → Clustering = grouping (customer segments)                          ║
╠══════════════════════════════════════════════════════════════════════════╣
║ EVALUATION METRICS                                                       ║
║  Regression:  MAE · MSE · RMSE · R²                                     ║
║  Classification:  Accuracy · Precision · Recall · F1                    ║
║  Clustering:  Silhouette Score (−1 to +1, higher = better)              ║
╠══════════════════════════════════════════════════════════════════════════╣
║ AZURE AI SERVICES → USE CASE MAP                                        ║
║  Azure Machine Learning  → Train/deploy/manage ML models                ║
║  Azure AI Foundry        → AI platform: models, agents, playgrounds     ║
║  Azure OpenAI            → Enterprise GPT/DALL-E/Whisper                ║
║  Azure AI Language       → NLP: sentiment, NER, key phrases, summarize  ║
║  Azure AI Translator     → Text translation, 100+ languages             ║
║  Azure AI Speech         → STT, TTS, neural voices, avatars             ║
║  Azure AI Vision         → Images: captions, tags, objects, OCR         ║
║  Azure AI Face           → Face detection; recognition = limited access ║
║  Azure AI Doc Intelligence → Forms/invoices: field-value pair extract   ║
║  Azure AI Content Under. → Multimodal: doc+audio+image+video schemas    ║
║  Azure AI Search         → Knowledge mining: index + AI skill enrich    ║
╠══════════════════════════════════════════════════════════════════════════╣
║ GENERATIVE AI KEY TERMS                                                  ║
║  LLM = Large Language Model (trained on vast text; billions of params)  ║
║  Token = smallest text unit (word/subword/emoji); has numeric ID        ║
║  Embedding = semantic vector for a token                                ║
║  Attention = mechanism weighing token influence in context              ║
║  Hallucination = confident but false AI output                          ║
║  RAG = Retrieval Augmented Generation (grounding in real data)          ║
║  Prompt Engineering = crafting inputs to optimize LLM output           ║
║  Agent = AI that takes autonomous actions via tools                     ║
╠══════════════════════════════════════════════════════════════════════════╣
║ COMPUTER VISION                                                          ║
║  CNN = Convolutional Neural Network → learns image patterns via filters ║
║  OCR = Optical Character Recognition → text from images (70+ languages) ║
║  Object Detection = locates + classifies objects with bounding boxes    ║
║  Facial Recognition → REQUIRES MICROSOFT LIMITED ACCESS LICENSE         ║
╠══════════════════════════════════════════════════════════════════════════╣
║ EXAM QUICK FACTS                                                         ║
║  Score to pass: 700/1000  |  Questions: 40-60  |  Time: ~60 min        ║
║  Highest domain weight: Generative AI (20-25%)                         ║
║  Register with personal MSA account (not work account!)                 ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

## 9. Glossary A–Z

| Term | Definition |
|---|---|
| **Accuracy** | Classification metric: proportion of all predictions that are correct |
| **Agent** | An AI system that combines a language model with tools to perform tasks autonomously |
| **Attention Mechanism** | Neural network component that assigns importance weights to tokens based on context |
| **AutoML** | Automated Machine Learning — automatically selects and tunes the best algorithm for a dataset |
| **Azure AI Content Understanding** | Azure service for schema-driven multimodal content analysis (documents, audio, images, video) |
| **Azure AI Document Intelligence** | Azure service specializing in extracting structured field-value pairs from forms and documents |
| **Azure AI Face** | Azure service for face detection, attribute analysis, and (with restricted access) facial recognition |
| **Azure AI Foundry** | Microsoft's unified AI development platform (model catalog, agent service, playgrounds) |
| **Azure AI Language** | Azure NLP service: sentiment analysis, NER, key phrase extraction, summarization, PII detection |
| **Azure AI Search** | Azure service for knowledge mining: indexing, AI skill enrichment, searchable knowledge stores |
| **Azure AI Speech** | Azure service: STT, TTS, neural voices, speech translation, TTS avatars, pronunciation assessment |
| **Azure AI Translator** | Azure service for text translation across 100+ languages with auto-detection and batch processing |
| **Azure AI Vision** | Azure computer vision service: image analysis, captions, tags, object detection, OCR, face detection |
| **Azure Machine Learning** | Azure cloud service managing the full ML lifecycle (training, evaluation, deployment, monitoring) |
| **Azure OpenAI Service** | Enterprise-grade deployment of OpenAI models (GPT-4, DALL-E, Whisper) on Azure infrastructure |
| **Binary Classification** | Supervised ML that predicts one of exactly two classes (e.g., spam or not spam) |
| **Bounding Box** | Coordinate set (x, y, width, height) indicating where an object or text is located in an image |
| **ChatGPT** | OpenAI's public conversational interface built on GPT models |
| **Classification** | Supervised ML task that predicts which category an input belongs to |
| **Clustering** | Unsupervised ML technique that groups similar data points without predefined labels |
| **CNN (Convolutional Neural Network)** | Deep learning architecture optimized for image processing using learnable spatial filters |
| **Confidence Score** | A 0–1 value indicating how certain a model is about a prediction |
| **DALL-E** | OpenAI's image generation model; generates images from text descriptions |
| **Deep Learning** | ML using multi-layer artificial neural networks to learn complex patterns |
| **Decoder** | Transformer component that generates output tokens sequentially |
| **Document Intelligence** | AI capability that extracts semantic meaning from forms and documents as structured field-value pairs |
| **Embedding** | A multidimensional numeric vector representing a token's semantic meaning |
| **Encoder** | Transformer component that creates contextual representations of input tokens using attention |
| **Entity Recognition (NER)** | NLP task that identifies and classifies named entities (Person, Location, Date, Organization) |
| **F1 Score** | Classification metric: harmonic mean of precision and recall; useful when both matter equally |
| **Facial Recognition** | Computer vision capability that identifies who a face belongs to; restricted access in Azure |
| **False Negative (FN)** | Model predicted negative, but the actual answer was positive (missed positive) |
| **False Positive (FP)** | Model predicted positive, but the actual answer was negative (false alarm) |
| **Feature** | A measurable input attribute (X) used by a model; e.g., temperature in an ice cream sales model |
| **Fine-Tuning** | Further training a pre-trained model on a smaller domain-specific dataset |
| **Foundation Model** | A large pre-trained model adaptable for many specialized tasks via fine-tuning or prompting |
| **Generative AI** | AI that creates new original content (text, image, code, audio) from natural language prompts |
| **GPT (Generative Pre-trained Transformer)** | OpenAI's family of LLMs underlying ChatGPT and Azure OpenAI Service |
| **Gradient Descent** | Optimization algorithm that iteratively adjusts model weights to minimize the loss function |
| **Grounding** | Providing a language model with specific, verified data to reduce hallucinations |
| **Hallucination** | When an AI model confidently generates information that is factually incorrect |
| **Indexer (Azure AI Search)** | The engine that ingests data, applies AI skills, and builds/updates a search index |
| **Index (Azure AI Search)** | A searchable data structure storing extracted fields, tags, and metadata |
| **Inferencing** | Using a trained model to generate predictions on new data |
| **K-Means** | Unsupervised clustering algorithm that groups data into k clusters |
| **Knowledge Mining** | The process of extracting, enriching, and surfacing information from unstructured data at scale |
| **Knowledge Store** | Azure AI Search feature that persists enriched assets (tables, images, JSON) to Azure Storage |
| **Label** | The output value (Y) a supervised ML model is trained to predict |
| **Linear Regression** | Supervised ML algorithm that finds the best-fit line to predict numeric values |
| **LLM (Large Language Model)** | A transformer-based model trained on massive text data with billions of parameters |
| **Logistic Regression** | Supervised ML algorithm for classification (despite the name, it predicts categories not numbers) |
| **Loss** | The difference between a model's predicted output and the actual label; minimized during training |
| **MAE (Mean Absolute Error)** | Average of absolute differences between predicted and actual values |
| **Machine Learning** | A subset of AI in which software learns to make predictions by training on data |
| **Microsoft Copilot** | Microsoft's AI assistant product powered by Azure OpenAI, integrated across Microsoft 365 |
| **MSE (Mean Squared Error)** | Average of squared differences between predicted and actual values |
| **Multiclass Classification** | Supervised ML that predicts one of three or more classes |
| **Multimodal Model** | A model that processes multiple data types simultaneously (e.g., text + images) |
| **Neural Network** | A computational model of interconnected nodes (neurons) organized in layers |
| **NLP (Natural Language Processing)** | AI branch focused on understanding and generating human language |
| **Object Detection** | Computer vision task that locates and classifies multiple objects in an image with bounding boxes |
| **OCR (Optical Character Recognition)** | Technology that converts printed or handwritten text in images to machine-readable text |
| **Opinion Mining** | NLP task that identifies sentiment toward specific aspects of a subject |
| **Orchestration** | Coordinating multiple AI components (models, APIs, data sources) to work together |
| **Overfitting** | A model performs well on training data but poorly on new, unseen data |
| **Phoneme** | A basic unit of sound used in speech processing to convert between audio and text |
| **Pixel** | The smallest unit of a digital image |
| **Precision** | Of all positive predictions made, how many were actually correct |
| **Prompt** | Natural language input given to a generative AI model |
| **Prompt Engineering** | The practice of designing effective prompts to maximize LLM output quality |
| **RAG (Retrieval-Augmented Generation)** | Technique that grounds LLM responses by retrieving relevant documents before generation |
| **Recall** | Of all actual positive cases, how many did the model correctly identify |
| **Regression** | Supervised ML task that predicts a continuous numeric value |
| **Responsible AI** | A framework for building AI that is fair, reliable, private, inclusive, transparent, and accountable |
| **R-squared (R²)** | Regression metric showing proportion of variance in the data explained by the model (0–1) |
| **RMSE (Root Mean Squared Error)** | Square root of MSE; prediction error in the same units as the original values |
| **Schema-Driven Analysis** | Azure AI Content Understanding feature where you define extraction fields; model finds values |
| **Semantic Meaning** | The intended interpretation of words/phrases in context, beyond literal definitions |
| **Sentiment Analysis** | NLP task that rates text as Positive, Negative, Neutral, or Mixed |
| **Silhouette Score** | Clustering quality metric ranging from −1 to +1; higher = better-separated clusters |
| **SLM (Small Language Model)** | A smaller, domain-focused language model; lower compute, easier to customize |
| **Speech Recognition** | Converting spoken audio to text (speech-to-text) |
| **Speech Synthesis** | Converting text to spoken audio (text-to-speech) |
| **Stop Words** | Common, low-meaning words (e.g., "a," "the") removed during NLP pre-processing |
| **Supervised Learning** | ML with labeled training data — the model learns to predict labels from features |
| **System Message** | A background instruction given to an LLM that sets its persona, rules, and context |
| **TF-IDF** | Term Frequency–Inverse Document Frequency; a statistical measure of word importance |
| **Token** | The smallest text unit a language model processes; may be a word, subword, punctuation, or emoji |
| **Tokenization** | The process of converting text into tokens and assigning each a numeric ID |
| **Training** | The process of fitting an ML algorithm to labeled data to create a predictive model |
| **Transformer** | Neural network architecture underpinning modern LLMs; uses self-attention mechanisms |
| **TTS Avatar** | An animated virtual presenter that delivers content with a synchronized neural voice |
| **Underfitting** | A model is too simple to capture the patterns in data, leading to poor performance |
| **Unsupervised Learning** | ML with unlabeled data; the model finds patterns and structure without guidance |
| **Validation Data** | A held-out portion of data used to evaluate model performance during training |
| **Weight** | A learnable parameter in a neural network; adjusted during training to minimize loss |

---

## 10. Tips & Tricks to Pass the Exam

### 🎯 Study Strategy

**1. Start with the official Microsoft Learn learning path.**
It maps directly to every exam objective and is completely free. Go to:
`https://learn.microsoft.com/en-us/training/courses/ai-900t00`
Work through all modules in order. Do not skip sections.

**2. Prioritize by domain weight.**
- Spend the most time on **Generative AI (20–25%)** — new content added May 2025
- All other four domains are roughly equal (15–20% each)
- Don't neglect Responsible AI — it appears across ALL domains in scenario questions

**3. Take the free official practice assessment.**
Microsoft provides a free official practice test at:
`https://learn.microsoft.com/en-us/credentials/certifications/exams/ai-900/practice/assessment?assessment-type=practice&assessmentId=26`
Use it early to find your weakest areas, then again close to exam day.

**4. Do the hands-on labs on Microsoft Learn.**
Hands-on experience significantly reinforces conceptual memory. Labs are free through the Microsoft Learn sandbox. Prioritize:
- Azure Machine Learning AutoML demo
- Language Playground (sentiment, NER)
- Speech Playground (STT, TTS)
- Vision Playground (image analysis, OCR)
- Azure AI Foundry Chat Playground (GPT-4, system messages)

---

### 📝 Exam-Taking Tactics

**5. Read every scenario question twice.**
Scenario questions present a business problem and ask you to identify the correct Azure service or approach. The key is the **business need**, not the technology buzzword. Ask yourself: "What is the core capability required here?"

**6. Use elimination aggressively.**
Most questions have at least one obviously wrong answer. Rule it out first. For Azure-specific questions: eliminate any option that isn't an Azure service if the question is clearly about Azure.

**7. Know the service-to-task mapping cold.**
The most commonly tested pattern is: "A company wants to do X. Which Azure service should they use?" Memorize the cheat sheet table in Section 8.

**8. Watch for trick phrasing:**
- "Which service is MOST appropriate" = there may be multiple valid options; pick the best fit
- "Which of the following is NOT a feature of..." = read all options carefully
- "A developer wants to..." vs "A data scientist wants to..." — context shapes the answer

**9. Don't overthink generative AI questions.**
For AI-900, you need to understand concepts, not implementation details. If asked about prompts, think about clear goal + context + format + iteration. If asked about responsible AI for generative AI, think hallucination, content filtering, grounding, transparency.

**10. Flag difficult questions and return to them.**
You can flag questions in the Pearson VUE interface. If you're stuck, move on and come back. Don't spend more than 90 seconds on any single question on your first pass.

---

### ⚠️ Common Mistakes to Avoid

**11. Confusing Supervised vs. Unsupervised.**
The single biggest source of errors. Remember:
- Supervised = you provide labels (answers during training)
- Unsupervised = no labels; the model discovers patterns on its own (clustering)
- "Regression" and "Classification" are always supervised

**12. Confusing Regression and Classification.**
- Regression → outputs a **number** (price, temperature, sales)
- Classification → outputs a **category** (yes/no, type A/B/C)
- Logistic Regression is a **classification** algorithm despite the word "regression" in its name

**13. Confusing Precision and Recall.**
Use this mental cue:
- **Precision** = "When I say YES, am I right?" (correctness of positive predictions)
- **Recall** = "Did I catch all the YESes?" (coverage of all actual positives)
- Spam filter: high precision = your flagged spam really is spam; high recall = you caught almost all spam

**14. Don't confuse Face Detection with Facial Recognition.**
- **Face detection** (available to all): "Is there a face here? Where?"
- **Facial recognition** (restricted access): "Whose face is this?"
This distinction is tested directly.

**15. Know which generative AI features are responsible AI concerns.**
Hallucination, bias, copyright, prompt injection, and impersonation are all listed as risks. Mitigations: content filters, grounding/RAG, human oversight, transparency disclosures.

**16. Remember the exam is conceptual, not hands-on.**
You will NOT be asked to write Python code, deploy an Azure resource, or configure a service. You ARE expected to know what services exist, what they do, and which is right for a given scenario.

---

### 🗓️ Recommended Exam Day Checklist

- [ ] Stable internet connection (if online proctored)
- [ ] Government-issued photo ID ready
- [ ] Quiet, private room; clear desk; no phones nearby
- [ ] Registered with personal MSA account (not work account)
- [ ] Exam confirmation email saved
- [ ] Microsoft Exam sandbox reviewed (`https://aka.ms/examdemo`)
- [ ] 45–60 minutes reserved with no interruptions
- [ ] Comfortable — take a deep breath. You've prepared for this!

---

### 💰 Cost & Vouchers

- Standard price: **~$99 USD** (varies by region)
- **Student discount**: ~50% off via Microsoft Imagine or school program
- **Coursera specialization** completion may provide a 50% discount voucher
- **Microsoft employee / partner vouchers**: may cover 100% of cost
- **Retake policy**: 24 hours after first failure; fees apply per attempt

---

## 11. Recommended Study Plan

### Option A: 1-Week Intensive (if you have AI/cloud background)

| Day | Focus |
|---|---|
| Day 1 | Domains 1 & 2 — AI Concepts, Responsible AI, Machine Learning |
| Day 2 | Domain 3 — Computer Vision; explore Vision Playground |
| Day 3 | Domain 4 — NLP; explore Language & Speech Playgrounds |
| Day 4 | Domain 5 — Generative AI, Azure OpenAI, Agents, Azure AI Foundry |
| Day 5 | Full review; Microsoft official practice assessment (first attempt) |
| Day 6 | Identify weak areas; targeted review; second practice assessment |
| Day 7 | Light review of cheat sheet + glossary; rest before exam |

---

### Option B: 2-Week Thorough (recommended for beginners)

| Week 1 | Week 2 |
|---|---|
| Day 1–2: AI Concepts & Responsible AI | Day 8: Domain 5 — Generative AI part 1 (LLMs, transformers, prompts) |
| Day 3–4: Machine Learning (types, metrics, AutoML) | Day 9: Domain 5 — Generative AI part 2 (agents, Azure OpenAI, Copilot) |
| Day 5: Computer Vision concepts | Day 10: First practice assessment — identify gaps |
| Day 6: Azure AI Vision, OCR, Face service | Day 11: Targeted weak area review |
| Day 7: NLP concepts + Azure AI Language | Day 12: Azure AI Foundry hands-on demo |
| — | Day 13: Full cheat sheet + glossary review; second practice assessment |
| — | Day 14: Light review; exam day |

---

## 12. References & Resources

### Official Microsoft Resources

| Resource | URL |
|---|---|
| AI-900 Exam Page | https://learn.microsoft.com/en-us/credentials/certifications/exams/ai-900/ |
| AI-900 Certification Page | https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-fundamentals/ |
| Official AI-900 Study Guide (May 2025) | https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ai-900 |
| Free Microsoft Learn Learning Path | https://learn.microsoft.com/en-us/training/courses/ai-900t00 |
| Free Official Practice Assessment | https://learn.microsoft.com/en-us/credentials/certifications/exams/ai-900/practice/assessment?assessment-type=practice&assessmentId=26 |
| Exam Sandbox (try the UI) | https://aka.ms/examdemo |
| Azure AI Foundry Portal | https://ai.azure.com |
| Azure Machine Learning Documentation | https://learn.microsoft.com/en-us/azure/machine-learning/ |
| Azure AI Vision Documentation | https://learn.microsoft.com/en-us/azure/cognitive-services/computer-vision/ |
| Azure AI Language Documentation | https://learn.microsoft.com/en-us/azure/cognitive-services/language-service/ |
| Azure AI Speech Documentation | https://learn.microsoft.com/en-us/azure/cognitive-services/speech-service/ |
| Azure OpenAI Service Documentation | https://learn.microsoft.com/en-us/azure/ai-services/openai/ |
| Responsible AI Principles (Microsoft) | https://www.microsoft.com/en-us/ai/responsible-ai |
| The AI Show (Microsoft video series) | https://learn.microsoft.com/en-us/shows/ai-show/ |
| Microsoft Tech Community — AI Hub | https://techcommunity.microsoft.com/t5/artificial-intelligence-and/ct-p/AI |

### Community & Third-Party Resources

| Resource | URL | Notes |
|---|---|---|
| How I Passed AI-900 (2025) — Medium | https://medium.com/@abonia/how-i-passed-the-microsoft-azure-ai-900-exam-2025-update-d8f138d53b29 | Personal walkthrough with 2025 generative AI emphasis |
| PassITExams AI-900 Study Guide 2026 | https://passitexams.com/study-guide/ai-900/ | Independent guide with domain breakdowns |
| Whizlabs AI-900 Preparation Blog | https://www.whizlabs.com/blog/azure-ai-900-exam-preparation/ | Includes study timeline and resource list |
| Coursera — Microsoft Azure AI Fundamentals Specialization | https://www.coursera.org/specializations/microsoft-azure-ai-900-ai-fundamentals | 5-course series; may include 50% exam discount voucher |
| CertEmpire AI-900 Info Page | https://certempire.com/exam-info/ai-900/ | Covers pricing, domains, study schedule |

### Source Transcript

This study guide was built on top of the AI-900 course taught by **Alexandra Zakharova**, Senior Technical Trainer, Microsoft Data & AI. The original course is published on the Microsoft Learn YouTube channel and accessible via:
`https://learn.microsoft.com/en-us/training/courses/ai-900t00`

---

*Study guide version: March 2026 | Based on exam objectives effective May 2, 2025*
*Exam retires June 30, 2026 — earn your certification before this date.*
