# AI-900: Microsoft Azure AI Fundamentals
## Exam-Ready Study Notes

> **Exam:** AI-900 | **Passing Score:** 700 / 1,000 | **Questions:** 40–60 | **Format:** Multiple choice & scenario-based
> You must be able to **identify and describe** core concepts — no implementation required.

---

## 1. Key Definitions

| Term | Definition |
|---|---|
| **Artificial Intelligence (AI)** | Software that imitates human capabilities (predict, recognize, see, communicate) |
| **Machine Learning** | Teaching software to make predictions using data; the model learns a function f(x) = ŷ |
| **Feature** | A measurable input attribute (X) used to train or run a model |
| **Label** | The output value (Y) the model is trained to predict |
| **Training** | The process of fitting an algorithm to data to create a model |
| **Inferencing** | Using a trained model to make predictions on new data |
| **Supervised Learning** | ML with labeled training data (features + labels) |
| **Unsupervised Learning** | ML with unlabeled data; finds patterns such as clusters |
| **Regression** | Supervised learning that predicts a numeric value |
| **Classification** | Supervised learning that predicts a category |
| **Clustering** | Unsupervised learning that groups similar data points |
| **Deep Learning** | ML using artificial neural networks with multiple layers |
| **Loss** | Difference between predicted output and actual label; minimized during training |
| **Gradient Descent** | Algorithm used to adjust weights iteratively to minimize loss |
| **Generative AI** | AI that creates new content (text, images, code) from natural language prompts |
| **LLM (Large Language Model)** | Model trained on massive text data; learns language patterns to predict next tokens |
| **SLM (Small Language Model)** | Smaller, domain-focused model; faster, more customizable, runs on local devices |
| **Transformer** | Neural network architecture underpinning modern LLMs; uses attention mechanisms |
| **Token** | A small unit of text (word, subword, punctuation, emoji); assigned a numeric ID |
| **Embedding** | A multidimensional numeric vector representing a token's meaning |
| **Attention** | Mechanism that assigns weights to tokens based on their influence in context |
| **Prompt Engineering** | The art of designing prompts to get the most effective results from a language model |
| **AI Agent** | An AI system that performs tasks autonomously using instructions and tools |
| **Orchestration** | Managing multiple AI components (models, APIs, databases) to work together |
| **NLP** | Natural Language Processing — AI branch focused on understanding human language |
| **Speech Synthesis (TTS)** | Converting text to audible speech |
| **Speech Recognition (STT)** | Converting spoken audio to text |
| **Phoneme** | A basic unit of sound used in speech processing |
| **Stop Words** | Common words (e.g., "a," "the") removed during NLP pre-processing |
| **TF-IDF** | Term Frequency–Inverse Document Frequency; identifies important words across documents |
| **Computer Vision** | AI that interprets and understands visual information from images or video |
| **Pixel** | The smallest unit of a digital image |
| **CNN (Convolutional Neural Network)** | Deep learning architecture optimized for image processing |
| **Multimodal Model** | A model that combines vision and language understanding |
| **Foundation Model** | A pre-trained general model adaptable for specialized tasks |
| **OCR** | Optical Character Recognition — converts printed/handwritten image text to digital text |
| **Document Intelligence** | AI that processes text and attaches semantic meaning; extracts field-value pairs |
| **Semantic Meaning** | The intended interpretation of words/phrases beyond literal definitions |
| **Field-Value Pair** | Structured output of document intelligence (e.g., merchant_name: "Contoso") |
| **Confidence Score** | A 0–1 score indicating how certain the model is about an extracted value |
| **Bounding Box** | Coordinates indicating where an element is located on a document or image |
| **Azure AI Search** | Cloud service that indexes and enriches data for knowledge mining |
| **Index (Search)** | Searchable data structure storing extracted fields, tags, and scores |
| **Indexer** | Engine that builds and updates the search index |
| **Knowledge Store** | Persistent storage of enriched assets (tables, images, JSON) in Azure Storage |
| **Schema-Driven Analysis** | Defining fields you want extracted; used by Azure AI Content Understanding |
| **AutoML** | Automated Machine Learning — automatically selects and optimizes algorithms |

---

## 2. Responsible AI — Six Principles (Memorize These)

| Principle | Key Idea | Example |
|---|---|---|
| **Fairness** | Treat everyone equally; eliminate bias | Loan approval must not discriminate by gender/ethnicity |
| **Reliability & Safety** | Perform as intended; test thoroughly | Autonomous vehicles; healthcare recommendation apps |
| **Privacy & Security** | Protect data at all times | Built-in Azure security and compliance features |
| **Inclusiveness** | Empower everyone | Accessibility tools for people with visual/hearing impairments |
| **Transparency** | Users understand how AI works | Chatbot users know they're talking to AI |
| **Accountability** | People are responsible, not machines | Developers follow governance frameworks |

---

## 3. ML Algorithm Comparison

| Algorithm | Type | Predicts |
|---|---|---|
| Linear Regression | Supervised — Regression | Numeric value (e.g., house price) |
| Logistic Regression | Supervised — Classification | Category (e.g., spam / not spam) |
| K-Means | Unsupervised — Clustering | Group membership |
| Neural Network | Supervised or Unsupervised | Complex patterns (images, language) |

---

## 4. Evaluation Metrics Quick Reference

### Regression
- **MAE** — average error in original units
- **RMSE** — penalizes large errors; in original units
- **R²** — 0 to 1; higher = better fit

### Classification
- **Accuracy** = correct predictions / total predictions
- **Precision** = true positives / (true positives + false positives) → "When I say yes, am I right?"
- **Recall** = true positives / (true positives + false negatives) → "Did I catch all the yes cases?"
- **F1** = harmonic mean of precision and recall

### Clustering
- **Silhouette Score** (−1 to 1): closer to 1 = well-separated clusters

---

## 5. Transformer Architecture Flow

```
Input text
    ↓
Tokenization (text → token IDs)
    ↓
Embeddings (token IDs → multidimensional vectors)
    ↓
Encoder (attention layers → contextual representations)
    ↓
Decoder (attention → predicts next token, one at a time)
    ↓
Output text / response
```

---

## 6. Azure AI Services Summary

| Service | Key Capabilities |
|---|---|
| **Azure Machine Learning** | Full ML lifecycle; AutoML; Studio; responsible AI tools |
| **Azure AI Foundry** | AI development platform; model catalog (11,000+ models); agent service; playgrounds |
| **Azure OpenAI** | GPT and DALL-E models for generative AI via Azure |
| **Azure AI Language** | Sentiment analysis, entity recognition, key phrase extraction, summarization, translation |
| **Azure AI Translator** | Text translation; auto-detect language; batch document translation |
| **Azure AI Speech** | STT, TTS, speech translation, neural voices, avatars, pronunciation assessment |
| **Azure AI Vision** | Image analysis, object detection, captions, tags, OCR, face detection, smart cropping |
| **Azure AI Face** | Face landmarks, blur/exposure/glasses detection; facial recognition (limited access) |
| **Azure AI Document Intelligence** | Pre-built models (receipts, invoices); custom models; field-value pair extraction |
| **Azure AI Content Understanding** | Schema-driven multimodal analysis (text, audio, image, video) |
| **Azure AI Search** | Indexing, AI skill enrichment, knowledge store, knowledge mining |

---

## 7. Azure AI Foundry Chat Playground Parameters

| Parameter | Effect |
|---|---|
| Temperature | Creativity/randomness (0 = conservative, 1 = highly varied) |
| Top-P | Similar to temperature; different algorithm |
| Frequency Penalty | Reduces repetition of exact text |
| Presence Penalty | Increases introduction of new topics |

---

## 8. Computer Vision Architecture Comparison

| Architecture | Use Case |
|---|---|
| **CNN** | Image classification, object detection; learns spatial patterns via filters |
| **Multimodal Model** | Combines image + language; generates captions, tags, descriptions |
| **Foundation Model** | Pre-trained general model; fine-tune for specific tasks |

---

## 9. Document Intelligence vs. Content Understanding

| Feature | Azure AI Document Intelligence | Azure AI Content Understanding |
|---|---|---|
| Primary use | Forms and structured documents | Multimodal content (text, audio, image, video) |
| Model types | Pre-built + custom | Schema-driven analyzers |
| Output | Field-value pairs with confidence scores | Schema-based structured data |
| Strength | Rich library of document-type models | Flexibility across content modalities |

---

## 10. Azure AI Search — Index vs. Indexer

| | Index | Indexer |
|---|---|---|
| **What it is** | The searchable data structure (the catalog) | The engine that builds/updates the index |
| **Stores** | Fields, values, tags, sentiment scores | Workflow: ingest → crack → enrich → persist |
| **Who queries it** | End users and applications | Runs on schedule or on demand |

---

## Check Yourself — 12 Practice Questions

**Q1.** Which Responsible AI principle focuses on ensuring AI doesn't discriminate based on gender or ethnicity?
- A) Reliability  B) **Fairness**  C) Transparency  D) Inclusiveness

**Q2.** A model is trained to predict the price of a house using square footage and number of bedrooms. What type of machine learning is this?
- A) Clustering  B) Binary classification  C) **Regression**  D) Unsupervised learning

**Q3.** What is "inferencing"?
- A) Cleaning and preparing training data  B) Splitting data into training and validation sets  C) **Using a trained model to make predictions on new data**  D) Evaluating model performance with metrics

**Q4.** Which evaluation metric penalizes large prediction errors more than small ones?
- A) MAE  B) **MSE / RMSE**  C) R²  D) F1 Score

**Q5.** In a spam detection model, which metric answers the question "Of all the emails I flagged as spam, how many actually were spam?"
- A) Recall  B) Accuracy  C) **Precision**  D) F1 Score

**Q6.** A retailer wants to segment customers into groups without predefined categories. Which type of ML should they use?
- A) Regression  B) Classification  C) **Clustering (Unsupervised)**  D) Deep learning

**Q7.** What is an embedding in the context of language models?
- A) A tokenized chunk of text  B) The system message sent to the model  C) **A multidimensional numeric vector representing a token's meaning**  D) The output probability distribution

**Q8.** Which Azure AI Foundry chat playground parameter would you lower to make a model give more predictable, consistent responses?
- A) Presence penalty  B) **Temperature**  C) Max tokens  D) System message length

**Q9.** Azure AI Face's advanced facial recognition capability (identifying who someone is) is:
- A) Available to all Azure subscribers  B) Built into Azure AI Vision Image Analysis  C) **Under Microsoft's limited access policy and requires a special license**  D) Not available in Azure at all

**Q10.** What is the primary difference between an Index and an Indexer in Azure AI Search?
- A) The index processes documents; the indexer stores results  B) **The index is the searchable data structure; the indexer is the engine that builds it**  C) The index supports only text; the indexer supports all media types  D) They are the same component with different names

**Q11.** Which TWO Azure AI services are used for extracting structured data from documents? *(select two)*
- A) Azure AI Speech  B) **Azure AI Document Intelligence**  C) Azure AI Vision (OCR)  D) Azure AI Search — this one indexes; doesn't directly extract document fields
- **Correct: B and C** (Document Intelligence for semantic extraction; Vision/OCR for text extraction from images)

**Q12.** In Azure AI Content Understanding, what is "schema-driven analysis"?
- A) Using a pre-built model trained on thousands of invoice types  B) Splitting audio into segments before transcription  C) **Defining the fields you want extracted, even when document labels differ or are absent**  D) Applying OCR to images before indexing

---

### Answer Key

| Q | Answer | Q | Answer |
|---|---|---|---|
| 1 | B | 7 | C |
| 2 | C | 8 | B |
| 3 | C | 9 | C |
| 4 | B | 10 | B |
| 5 | C | 11 | B & C |
| 6 | C | 12 | C |
