# Describe Features of Natural Language Processing (NLP) Workloads on Azure (15-20%)

## What is Natural Language Processing?

Natural Language Processing (NLP) is a branch of AI that enables computers to understand, interpret, and generate human language — both text and speech. NLP bridges the gap between human communication and machine understanding.

## NLP Features and Use Cases

### Key Phrase Extraction

Identifies the **main topics and important terms** in a body of text.

- Input: "The Azure AI Language service provides powerful text analytics capabilities for developers."
- Output: `["Azure AI Language service", "text analytics capabilities", "developers"]`

**Use cases:** Summarising document topics, indexing content for search, identifying trending topics in social media.

### Named Entity Recognition (NER)

Identifies and classifies **specific entities** mentioned in text.

| Entity Type | Example |
|-------------|---------|
| Person | "Satya Nadella" |
| Organisation | "Microsoft" |
| Location | "Seattle, Washington" |
| Date/Time | "March 15, 2025" |
| Quantity | "15 million" |
| Email | "user@example.com" |
| URL | "https://azure.microsoft.com" |

**Use cases:** Information extraction from documents, building knowledge graphs, compliance monitoring, automated metadata tagging.

### Sentiment Analysis

Determines the **emotional tone** of text.

| Sentiment | Description | Example |
|-----------|-------------|---------|
| Positive | Expresses satisfaction or approval | "The product is excellent and fast!" |
| Negative | Expresses dissatisfaction or criticism | "Terrible service, very disappointing." |
| Neutral | Factual or objective | "The meeting is at 3 PM." |
| Mixed | Contains both positive and negative elements | "The food was great but the service was slow." |

**Opinion mining** is an advanced feature that identifies specific aspects and the sentiment associated with each (e.g., "food" = positive, "service" = negative).

**Use cases:** Customer feedback analysis, brand monitoring, social media analytics, product review analysis.

### Language Modeling

Language models understand the structure and meaning of language, enabling:
- Text completion and generation
- Question answering
- Summarisation
- Intent recognition

Modern language models are based on the **Transformer architecture** and are pre-trained on massive datasets.

### Speech Recognition and Synthesis

| Feature | Direction | Description |
|---------|-----------|-------------|
| **Speech-to-text** (recognition) | Audio to text | Converts spoken audio into written text |
| **Text-to-speech** (synthesis) | Text to audio | Converts written text into natural-sounding speech |
| **Speech translation** | Audio to translated audio/text | Converts speech in one language to text or speech in another |

**Speech-to-text capabilities:**
- Real-time transcription
- Batch transcription of audio files
- Custom speech models for domain-specific vocabulary
- Speaker diarisation (identify who said what)

**Text-to-speech capabilities:**
- Neural voices that sound natural
- Custom voice models
- SSML (Speech Synthesis Markup Language) for fine-grained control over pronunciation, pitch, and rate

### Translation

| Type | Description |
|------|-------------|
| **Text translation** | Translate written text between 100+ languages |
| **Document translation** | Translate entire documents while preserving formatting |
| **Custom translator** | Train custom translation models with domain-specific terminology |
| **Speech translation** | Real-time spoken language translation |

## Azure Services for NLP

### Azure AI Language

Azure AI Language provides pre-built and customisable NLP capabilities.

| Feature | Description |
|---------|-------------|
| **Sentiment analysis** | Analyse text for positive/negative/neutral/mixed sentiment |
| **Key phrase extraction** | Extract main topics from text |
| **Named entity recognition** | Identify people, places, organisations, dates, etc. |
| **Entity linking** | Link entities to Wikipedia entries for disambiguation |
| **Language detection** | Identify the language of input text |
| **PII detection** | Detect personally identifiable information |
| **Text summarisation** | Generate extractive or abstractive summaries |
| **Question answering** | Build FAQ-style question answering from documents |
| **Conversational language understanding (CLU)** | Understand user intents and extract entities from conversations |
| **Custom text classification** | Train custom models to classify text into your categories |
| **Custom NER** | Train custom models to extract domain-specific entities |

### Azure AI Speech

Azure AI Speech provides speech-related capabilities.

| Feature | Description |
|---------|-------------|
| **Speech-to-text** | Real-time and batch audio transcription |
| **Text-to-speech** | Generate natural-sounding speech from text |
| **Speech translation** | Real-time speech-to-speech or speech-to-text translation |
| **Speaker recognition** | Identify or verify speakers by their voice |
| **Pronunciation assessment** | Evaluate pronunciation accuracy for language learning |
| **Custom speech** | Train models for domain-specific vocabulary or accented speech |
| **Custom neural voice** | Create a unique voice for your brand |

### Azure AI Translator

Azure AI Translator provides text and document translation.

| Feature | Description |
|---------|-------------|
| **Text translation** | Translate text in real time across 100+ languages |
| **Document translation** | Translate whole documents preserving formatting |
| **Custom translator** | Train custom models with domain-specific terminology |
| **Transliteration** | Convert text between scripts (e.g., Latin to Cyrillic) |

### Comparison of Azure NLP Services

| Task | Service |
|------|---------|
| Sentiment analysis | Azure AI Language |
| Key phrase extraction | Azure AI Language |
| Named entity recognition | Azure AI Language |
| Language detection | Azure AI Language |
| Question answering | Azure AI Language |
| Speech-to-text | Azure AI Speech |
| Text-to-speech | Azure AI Speech |
| Speech translation | Azure AI Speech |
| Text translation | Azure AI Translator |
| Document translation | Azure AI Translator |

## Exam Tips

- **Sentiment analysis** returns positive, negative, neutral, or mixed — know all four categories
- **Key phrase extraction** identifies topics; **NER** identifies specific named entities with categories
- **Azure AI Language** is the service for text analytics (sentiment, key phrases, NER, language detection)
- **Azure AI Speech** handles audio: speech-to-text, text-to-speech, speech translation, speaker recognition
- **Azure AI Translator** handles text/document translation — separate from Speech translation
- Know the difference between **speech-to-text** (transcription) and **speech translation** (cross-language)
- **Conversational language understanding (CLU)** is for building intent-based conversational apps (chatbots)
- **Question answering** in Azure AI Language builds FAQ bots from documents — no code required
