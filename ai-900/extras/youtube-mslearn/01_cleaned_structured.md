# AI-900: Microsoft Azure AI Fundamentals
## Cleaned & Structured Transcript

---

## Course Introduction (Part 1)

Imagine walking into a world where machines can see, hear, speak, and even create — where businesses predict trends before they happen, and chatbots deliver human-like conversations. Artificial intelligence is no longer science fiction. It is shaping the way we live and work every single day.

This course is **AI-900: Microsoft Azure AI Fundamentals** — designed to give you a foundation to understand AI concepts and explore Microsoft Azure AI services. By the end, you will know how to tackle real-world scenarios with confidence.

**Instructor:** Alexandra Zakharova, Senior Microsoft Technical Trainer specializing in Azure AI Services and cloud solutions. Connect on LinkedIn via `aka.ms/alexandra`.

### Course Structure — Six Sessions

1. **Introduction to AI Concepts** — what AI is, the different workloads, and real-world applications
2. **Machine Learning Concepts** — training, evaluating, and deploying models; supervised vs. unsupervised learning
3. **Generative AI and Agents** — large language models (LLMs), Azure AI Foundry, intelligent agents
4. **Natural Language Processing (NLP)** — text analytics, language translation, speech services
5. **Computer Vision** — image analysis, object detection, visual insights
6. **AI-Powered Information Extraction** — document intelligence, Azure AI Content Understanding, knowledge mining

### Hands-On Labs

Labs are available for free on **Microsoft Learn**. No implementation is required for the AI-900 exam — you must be able to **identify and describe** core concepts.

**Exam requirement:** Minimum score of **700 out of 1,000** points.

> Tip: Free learning path on Microsoft Learn at `aka.ms/learn`.

---

## Session 1 — Introduction to AI Concepts

### What Is Artificial Intelligence?

Artificial intelligence is **software that imitates human capabilities**, including:

- Predicting outcomes
- Recognizing patterns
- Noticing anomalies
- Using vision to interpret the world
- Communicating through language
- Gathering information from multiple sources

### AI Workloads

AI solutions often combine multiple workloads. Example — an auto-insurance claims AI:

| Workload | Role in Example |
|---|---|
| Natural Language Processing | Understands the customer's request |
| Computer Vision | Assesses damage from a photo |
| Machine Learning | Predicts repair costs |
| Information Extraction | Detects fraud |

### Responsible AI — Six Principles

1. **Fairness** — AI should treat everyone equally. A loan approval system must not favor or disadvantage anyone based on gender, ethnicity, or other personal factors.
2. **Reliability and Safety** — AI systems must perform as intended. Rigorous testing and monitoring are essential before deployment.
3. **Privacy and Security** — Data must be protected at all times. Azure services include built-in security and compliance features.
4. **Inclusiveness** — AI should empower everyone, including people with visual or hearing impairments.
5. **Transparency** — Users should understand how AI works and its limitations.
6. **Accountability** — People, not machines, are responsible for AI systems.

### Microsoft Azure Overview

**Structure:**
- **Subscription** — access path to Azure resources; billing is tied to this
- **Resource Groups** — logical containers for related resources
- **Resources** — actual services (e.g., Azure Machine Learning workspaces, storage accounts)

### Azure AI Foundry

Azure AI Foundry is the overall AI development platform on Azure.

| Service | Purpose |
|---|---|
| Azure Machine Learning | Foundation for predictive capabilities |
| Azure AI Foundry + Azure OpenAI | Generative AI and AI agents |
| Azure AI Language | Text analysis, classification, question answering |
| Azure AI Speech | Text-to-speech and speech-to-text |
| Azure AI Vision | Image analysis, face detection, OCR |
| Azure AI Document Intelligence | Extracting data from documents |
| Azure AI Content Understanding | Analyzing rich media (audio, video, images) |
| Azure AI Search | Making information discoverable |

---

## Session 2 — Machine Learning Concepts

### What Is Machine Learning?

Machine learning teaches software to make predictions. A model is a function: **f(x) = ŷ**

- **Features (X)** — measurable input attributes
- **Labels (Y)** — values to predict (output)
- **Training** — creating the model function
- **Inferencing** — using a trained model to make predictions

### Types of Machine Learning

#### Supervised Learning

Training data includes both features and labels.

| Type | Description | Examples |
|---|---|---|
| **Regression** | Predicts numeric values | Ice cream sales; house prices; fuel efficiency |
| **Binary Classification** | Predicts yes/no | Diabetes risk; loan default |
| **Multiclass Classification** | Predicts one of several categories | Penguin species; movie genre |

#### Unsupervised Learning

Uses data without labels. Most common technique: **clustering**.

- Customer segmentation (frequent buyers, seasonal shoppers, high-value customers)
- Grouping flowers by size and petal count
- Organizing news articles by topic without predefined categories

### Training a Machine Learning Model

1. **Split the data** — 70% training, 30% validation (typical)
2. **Apply an algorithm** — fit training data to find patterns
3. **Generate predictions** — run model against validation data
4. **Evaluate** — compare predicted vs. actual values using metrics
5. **Repeat and refine** — adjust parameters and algorithms

### Evaluation Metrics

#### Regression

| Metric | Description |
|---|---|
| **MAE** | Average difference between predicted and actual values |
| **MSE** | Squares differences; penalizes large errors more |
| **RMSE** | Square root of MSE; same units as predictions |
| **R²** | How much variation the model explains; higher is better |

#### Classification

| Metric | Description |
|---|---|
| **Accuracy** | Proportion of correct predictions overall |
| **Precision** | Of all positive predictions, how many were actually correct |
| **Recall** | Of all actual positives, how many did the model identify |
| **F1 Score** | Balanced combination of precision and recall |

#### Clustering (Unsupervised)

| Metric | Description |
|---|---|
| **Silhouette Score** | −1 to 1; how well-separated clusters are |
| **Cluster center distance** | How far apart clusters are |
| **Intra-cluster compactness** | How tightly data points group around centers |

### Common Algorithms

| Task | Algorithm |
|---|---|
| Numeric prediction | Linear Regression |
| Classification | Logistic Regression |
| Clustering | K-Means Clustering |

### Deep Learning

Uses **artificial neural networks** — layers of interconnected nodes mimicking the brain.

**Architecture:**
- **Input layer** — receives features
- **Hidden layers** — transform data; apply weights and activation functions
- **Output layer** — produces predictions

**Loss** = difference between predicted output and actual label. Training minimizes loss iteratively using **gradient descent**.

### Azure Machine Learning

Cloud-based service managing the full ML lifecycle: data preparation → training → evaluation → deployment → monitoring.

**Azure Machine Learning Studio** — browser-based portal with notebooks, pipelines, visual tools, and AutoML.

### AutoML (Automated Machine Learning)

1. Connect data
2. Define prediction goal (regression, classification, forecasting, CV, NLP)
3. AutoML tests multiple algorithms, selects the best, and optimizes for accuracy
4. Deploy directly from the Studio

---

## Session 3 — Generative AI and Agents

### What Is Generative AI?

Generative AI **creates new content** in response to natural language prompts, unlike traditional AI which predicts or classifies.

At its heart are **Large Language Models (LLMs)** trained on massive text datasets.

| Content Type | Example Prompt |
|---|---|
| Natural language | "Write a cover letter for my resume" |
| Image generation | "Create an image of an elephant eating a burger" |
| Code generation | "Show me how to code tic-tac-toe in Python" |

### Transformer Architecture

1. **Tokenization** — text broken into tokens (words, subwords, punctuation, emojis); each token gets a numeric ID
2. **Embeddings** — tokens mapped to multidimensional vectors capturing meaning
3. **Encoder** — reads input; uses attention layers to create contextual representations
4. **Decoder** — predicts the next token sequentially to build output

**Attention mechanism** — assigns weights to tokens based on influence in a sentence.

**Training:** model compares predicted tokens to actual tokens → calculates loss → adjusts weights via gradient descent.

### Prompt Engineering Best Practices

1. Start with a clear goal
2. Provide grounding information (link to real data)
3. Add context (audience, tone)
4. Set expectations for format and scope
5. Iterate based on previous responses

**System message** — sets rules for the model; sent behind the scenes with every prompt.

### AI Agents

Agents perform tasks **autonomously** by combining:
- **Instructions** (natural language commands)
- **Tools** (APIs: calendar, payment, CRM, etc.)

**Orchestration** — manages multiple AI components (models, databases, APIs, workflows) working together.

### Azure AI Foundry

| Component | Description |
|---|---|
| **Model Catalog** | 11,000+ models; compare by quality, cost, latency |
| **Chat Playground** | Test models; configure temperature, top-P, penalties |
| **Agent Service** | Create agents with knowledge and action tools |
| **AI Services** | Language, Vision, Speech, Document Intelligence |

**Chat Playground parameters:**
- **Temperature / Top-P** — control creativity and randomness
- **Frequency Penalty** — reduces repetition
- **Presence Penalty** — increases introduction of new topics

---

## Session 4 — Natural Language Processing

### What Is NLP?

NLP is a branch of AI focused on understanding and interpreting human language — written and spoken.

**Pre-processing:** removing stop words, tokenization.

### NLP Tasks

| Task | Description |
|---|---|
| Text Analysis | Extract key phrases; identify entities |
| Sentiment Analysis | Measure positive/negative tone |
| Machine Translation | Translate text or speech in real time |
| Summarization | Condense text into key points |
| Conversational AI | Chatbots and virtual assistants |

### NLP Techniques

| Approach | Technique | Description |
|---|---|---|
| Statistical | Naïve Bayes | Calculates probabilities for text classification (e.g., spam) |
| Statistical | TF-IDF | Identifies important words by frequency across documents |
| Semantic | Embeddings | Vector representations capturing meaning and context |
| Semantic | Transformer + Attention | Contextual understanding; state of the art for NLP |

### Speech Capabilities

- **Speech Synthesis (TTS):** tokenize text → map to phonemes → generate audio
- **Speech Recognition (STT):** capture audio → identify phonemes → map to text tokens → predict word sequence

### Azure AI Language

Capabilities in the Language Playground:
- Language detection, sentiment analysis, key phrase extraction
- Named entity recognition (persons, locations, events, dates)
- Health information extraction (medications, dosages)
- Extractive and abstractive summarization
- Text classification

### Azure AI Translator

- Supports many languages; auto-detects source language
- Batch document translation available

### Azure AI Speech

| Feature | Description |
|---|---|
| Real-time transcription | Live speech-to-text |
| Fast transcription | File upload; results in under a second |
| Speech translation | Simultaneous spoken language translation |
| Pronunciation assessment | Improve pronunciation skills |
| Neural voices (TTS) | 100+ voices; multiple languages and styles |
| TTS Avatars | Animated avatars with selected voices |

---

## Session 5 — Computer Vision

### What Is Computer Vision?

Teaching machines to interpret and understand visual information.

**Image basics:**
- Every image = pixels
- Grayscale: 0 (black) to 255 (white)
- Color: three channels — Red, Green, Blue (RGB)

### CNNs (Convolutional Neural Networks)

The primary architecture for vision tasks.

1. Feed thousands of training images
2. Apply filters to find patterns (curves, colors, textures)
3. Filters start random; adjust during training to detect useful features
4. New image → predicted label with probability score

### Multimodal Models

Combine **language and vision** — understand image content and associated text.

- Language encoder + Image encoder
- Serve as foundation models adaptable for specialized tasks
- Use cases: image classification, object detection, caption generation, auto-tagging

### Azure AI Vision — Image Analysis 4.0

| Feature | Description |
|---|---|
| Object detection | Identify and locate objects |
| Image captions | Natural language description |
| Dense captions | Descriptions for multiple parts of an image |
| Tag extraction | Visual tags with confidence scores |
| Smart cropping | Focus on the most important area |
| OCR (Read) | Extract printed and handwritten text (70+ languages) |
| Face detection | Locate faces; return landmarks and coordinates |

> **Note:** Only four Azure regions currently support Image Analysis 4.0.

### Azure AI Face Service

- Blur, exposure, glasses detection
- Face landmarks (pupils, nose tip, mouth corners)
- Face mask detection
- **Facial recognition** (identity) requires a special license under Microsoft's limited access policy

### OCR

- 70+ languages supported
- Two modes: quick extraction (small images) and asynchronous (large documents)
- Returns bounding box locations of detected text

---

## Session 6 — AI-Powered Information Extraction

### Information Extraction Process

1. Identify and digitize source content
2. Extract data using ML techniques
3. Transform into structured formats (JSON, tables)
4. Store in databases, data lakes, or analytics platforms

### Core Techniques

| Technique | Description |
|---|---|
| Computer Vision | Detects objects, people, and text in images |
| OCR | Converts printed/handwritten text to digital |
| Document Intelligence | Processes text and attaches semantic meaning |

### Document Intelligence — Field-Value Pairs

**Semantic meaning** — the intended interpretation of words/phrases in context.

Document intelligence extracts **field-value pairs** with **confidence scores** (0–1):
- Field name: `merchant_name` → Value: "Contoso Coffee" → Confidence: 0.98
- Every element mapped to its document position via bounding boxes

### Azure AI Document Intelligence

| Model Type | Description |
|---|---|
| Pre-built models | Ready-to-use for receipts, invoices, tax forms, mortgage applications |
| Custom models | Trained on your labeled documents for unique needs |

**Custom model workflow:** label documents with OCR → train on patterns → deploy.

### Azure AI Content Understanding

Schema-driven analysis across multiple content formats:

| Content | Schema Example | Output |
|---|---|---|
| Invoice document | vendor_name, invoice_number, line_items | Structured data |
| Audio voicemail | caller_name, summary, action, contact | Transcription + extracted fields |
| Conference image | in_person, remote, total_participants | Attendance breakdown |

### Azure AI Search (Knowledge Mining)

| Concept | Description |
|---|---|
| **Index** | Searchable data structure with fields, values, tags, sentiment scores |
| **Indexer** | Engine that builds/updates the index; ingests, cracks, enriches, persists data |

**Indexer workflow:**
1. Ingest from source (PDFs, databases, etc.)
2. Crack documents → extract text and images
3. Apply AI skills (Vision, Language, Document Intelligence)
4. Store enriched data in the index

**Knowledge Store** — persists extracted assets (tables, images, JSON) to Azure Storage for analytics and integration.

---

## Exam Summary

| Item | Detail |
|---|---|
| Exam | AI-900: Microsoft Azure AI Fundamentals |
| Questions | 40–60 |
| Format | Multiple choice and scenario-based |
| Passing score | 700 out of 1,000 |
| Key topics | AI workloads, ML principles, computer vision, NLP, responsible AI |

**You do NOT need to implement — you need to identify and describe core concepts.**

Resources: `aka.ms/learn` — free learning paths, hands-on labs, practice tests.
