# Implement Natural Language Processing Solutions (15-20%)

## Analyzing and Translating Text

### Azure AI Language — Text Analytics

| Feature | Description |
|---------|-------------|
| **Key phrase extraction** | Extract main topics from text |
| **Named entity recognition (NER)** | Identify people, places, organisations, dates, etc. |
| **Sentiment analysis** | Determine positive/negative/neutral/mixed tone |
| **Opinion mining** | Aspect-level sentiment (e.g., "food: positive, service: negative") |
| **Language detection** | Identify the language of input text |
| **PII detection** | Detect and optionally redact personally identifiable information |
| **Entity linking** | Disambiguate entities by linking to Wikipedia |
| **Text summarisation** | Extractive or abstractive summary |

### Text Analytics SDK

```python
from azure.ai.textanalytics import TextAnalyticsClient
from azure.core.credentials import AzureKeyCredential

client = TextAnalyticsClient("<endpoint>", AzureKeyCredential("<key>"))

# Sentiment analysis
results = client.analyze_sentiment(["The food was great but the service was slow."])
for result in results:
    print(f"Sentiment: {result.sentiment}")
    for sentence in result.sentences:
        print(f"  '{sentence.text}' -> {sentence.sentiment}")

# Key phrases
results = client.extract_key_phrases(["Azure AI Language provides text analytics."])
for result in results:
    print(f"Key phrases: {result.key_phrases}")

# NER
results = client.recognize_entities(["Microsoft was founded in 1975 by Bill Gates."])
for result in results:
    for entity in result.entities:
        print(f"  {entity.text} ({entity.category})")

# PII detection
results = client.recognize_pii_entities(["My SSN is 123-45-6789 and email is user@example.com"])
for result in results:
    print(f"Redacted: {result.redacted_text}")
```

### Azure Translator

| Feature | Description |
|---------|-------------|
| **Text translation** | Translate text across 100+ languages |
| **Document translation** | Translate whole documents preserving formatting |
| **Custom Translator** | Train custom models with domain-specific terminology |
| **Transliteration** | Convert between scripts (e.g., Japanese kanji to Latin) |
| **Dictionary lookup** | Get alternative translations for a word |

```python
import requests

endpoint = "https://api.cognitive.microsofttranslator.com"
path = "/translate?api-version=3.0&from=en&to=fr&to=de"
headers = {
    "Ocp-Apim-Subscription-Key": "<key>",
    "Ocp-Apim-Subscription-Region": "<region>",
    "Content-Type": "application/json"
}
body = [{"text": "Hello world"}]

response = requests.post(endpoint + path, headers=headers, json=body)
translations = response.json()
# Returns: [{"translations": [{"text": "Bonjour le monde", "to": "fr"}, ...]}]
```

### Custom Translator

Train custom translation models:
1. Create a workspace and project
2. Upload parallel training documents (source + target language pairs)
3. Train the model
4. Publish and use a custom category ID in translation requests

## Processing and Translating Speech

### Azure AI Speech

| Feature | Description |
|---------|-------------|
| **Speech-to-text** | Real-time and batch transcription |
| **Text-to-speech** | Neural and custom voices |
| **Speech translation** | Real-time speech-to-speech / speech-to-text translation |
| **Speaker recognition** | Verify or identify speakers by voice |
| **Intent recognition** | Recognize user intent from speech |
| **Keyword recognition** | Detect wake words (e.g., "Hey Cortana") |
| **Custom speech** | Train models for domain-specific vocabulary |
| **Custom neural voice** | Create branded synthetic voices |

### Speech SDK

```python
import azure.cognitiveservices.speech as speechsdk

config = speechsdk.SpeechConfig(subscription="<key>", region="<region>")

# Speech-to-text
config.speech_recognition_language = "en-US"
recognizer = speechsdk.SpeechRecognizer(speech_config=config)
result = recognizer.recognize_once()
print(f"Recognized: {result.text}")

# Text-to-speech
config.speech_synthesis_voice_name = "en-US-JennyNeural"
synthesizer = speechsdk.SpeechSynthesizer(speech_config=config)
synthesizer.speak_text("Hello from Azure AI Speech")
```

### SSML (Speech Synthesis Markup Language)

SSML provides fine-grained control over speech synthesis:

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
  <voice name="en-US-JennyNeural">
    <prosody rate="slow" pitch="+5%">
      Welcome to Azure AI.
    </prosody>
    <break time="500ms"/>
    <emphasis level="strong">This is important.</emphasis>
  </voice>
</speak>
```

Key SSML elements:
- `<prosody>` — control rate, pitch, volume
- `<break>` — insert pauses
- `<emphasis>` — stress importance
- `<say-as>` — interpret text (date, number, telephone)
- `<phoneme>` — custom pronunciation

### Speech Translation

```python
translation_config = speechsdk.translation.SpeechTranslationConfig(
    subscription="<key>", region="<region>"
)
translation_config.speech_recognition_language = "en-US"
translation_config.add_target_language("fr")
translation_config.add_target_language("de")

recognizer = speechsdk.translation.TranslationRecognizer(
    translation_config=translation_config
)
result = recognizer.recognize_once()
for lang, text in result.translations.items():
    print(f"{lang}: {text}")
```

## Custom Language Models

### Conversational Language Understanding (CLU)

CLU replaces LUIS for intent and entity recognition:

| Component | Description |
|-----------|-------------|
| **Intents** | What the user wants to do (e.g., "BookFlight", "GetWeather") |
| **Entities** | Key information to extract (e.g., "destination", "date") |
| **Utterances** | Example phrases mapped to intents and entities |

Workflow:
1. Create a CLU project in Language Studio
2. Define intents and entities
3. Add utterances (labeled examples) for each intent
4. Train the model
5. Evaluate (precision, recall, F1 per intent/entity)
6. Deploy to a slot (e.g., "production")
7. Query via REST API or SDK

### Custom Question Answering

Build FAQ-style knowledge bases:

1. Create a question answering project
2. Add sources (URLs, PDFs, Word docs, or manual QA pairs)
3. Add alternate phrasings for questions
4. Add multi-turn conversations (follow-up prompts)
5. Add chit-chat (personality for small talk)
6. Train, test, and publish the knowledge base
7. Create a multi-language project if needed
8. Export for backup or migration

### Custom Text Classification

Train models to classify text into your own categories:
- **Single-label** — one category per document
- **Multi-label** — multiple categories per document

### Custom NER

Train models to extract domain-specific entities from text.

## Exam Tips

- Know the **Text Analytics SDK** methods: `analyze_sentiment`, `extract_key_phrases`, `recognize_entities`, `recognize_pii_entities`
- **PII detection** can redact sensitive information in the response (`redacted_text`)
- **SSML** controls speech synthesis: `<prosody>`, `<break>`, `<emphasis>`, `<say-as>`
- **CLU** (Conversational Language Understanding) has three components: intents, entities, utterances
- Custom question answering supports **multi-turn conversations**, **alternate phrasings**, and **chit-chat**
- **Custom Translator** needs parallel documents (source + target language pairs)
- Azure Translator REST API requires `Ocp-Apim-Subscription-Region` header (unlike most AI services)
- **Speech translation** can translate to multiple target languages simultaneously
- Know the difference between **extractive** (selects key sentences) and **abstractive** (generates new text) summarisation
