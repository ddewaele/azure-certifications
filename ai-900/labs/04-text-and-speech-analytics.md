# Lab 04: Text and Speech Analytics

## Overview

In this lab you will use Azure AI Language for text analytics (sentiment analysis, key phrase extraction, NER) and Azure AI Speech for speech-to-text and text-to-speech.

### Learning Objectives

- Analyse text using Azure AI Language (sentiment, key phrases, entities)
- Transcribe audio with speech-to-text
- Generate spoken audio with text-to-speech
- Use Language Studio and Speech Studio for interactive testing

## Prerequisites

- An active Azure subscription
- An Azure AI Services or separate Language/Speech resources
- Python 3.x with the `azure-ai-textanalytics` and `azure-cognitiveservices-speech` packages

## Steps

### 1. Create Resources

If you do not already have an AI Services resource:

```bash
az group create --name rg-ai900-labs --location eastus

az cognitiveservices account create \
  --name ai900-language \
  --resource-group rg-ai900-labs \
  --kind TextAnalytics \
  --sku S \
  --location eastus \
  --yes

az cognitiveservices account create \
  --name ai900-speech \
  --resource-group rg-ai900-labs \
  --kind SpeechServices \
  --sku S0 \
  --location eastus \
  --yes
```

### 2. Sentiment Analysis

```python
from azure.ai.textanalytics import TextAnalyticsClient
from azure.core.credentials import AzureKeyCredential

endpoint = "<your-language-endpoint>"
key = "<your-language-key>"

client = TextAnalyticsClient(endpoint, AzureKeyCredential(key))

documents = [
    "The hotel was wonderful and the staff were incredibly friendly!",
    "The flight was delayed by 4 hours and the food was terrible.",
    "The meeting is scheduled for 3 PM tomorrow.",
    "The product quality is great but the delivery was slow."
]

results = client.analyze_sentiment(documents)

for i, result in enumerate(results):
    print(f"Document {i+1}: {result.sentiment}")
    print(f"  Positive: {result.confidence_scores.positive:.2f}")
    print(f"  Neutral:  {result.confidence_scores.neutral:.2f}")
    print(f"  Negative: {result.confidence_scores.negative:.2f}")
    print()
```

### 3. Key Phrase Extraction

```python
results = client.extract_key_phrases(documents)

for i, result in enumerate(results):
    print(f"Document {i+1} key phrases: {', '.join(result.key_phrases)}")
```

### 4. Named Entity Recognition

```python
documents_ner = [
    "Microsoft was founded by Bill Gates and Paul Allen in Albuquerque on April 4, 1975.",
    "The Eiffel Tower in Paris attracts over 7 million visitors annually."
]

results = client.recognize_entities(documents_ner)

for i, result in enumerate(results):
    print(f"\nDocument {i+1}:")
    for entity in result.entities:
        print(f"  {entity.text} ({entity.category}, confidence: {entity.confidence_score:.2f})")
```

**Expected output:**
```
Document 1:
  Microsoft (Organization, confidence: 1.00)
  Bill Gates (Person, confidence: 1.00)
  Paul Allen (Person, confidence: 1.00)
  Albuquerque (Location, confidence: 1.00)
  April 4, 1975 (DateTime, confidence: 0.80)
```

### 5. Explore Language Studio

1. Navigate to https://language.cognitive.azure.com
2. Select your Language resource
3. Try these features interactively:
   - **Analyse sentiment and mine opinions**
   - **Extract key phrases**
   - **Recognize named entities**
   - **Detect language**
4. Paste your own text and observe the results

### 6. Speech-to-Text

Install the Speech SDK:

```bash
pip install azure-cognitiveservices-speech
```

Transcribe from microphone (requires a microphone):

```python
import azure.cognitiveservices.speech as speechsdk

speech_key = "<your-speech-key>"
speech_region = "eastus"

speech_config = speechsdk.SpeechConfig(subscription=speech_key, region=speech_region)
speech_config.speech_recognition_language = "en-US"

audio_config = speechsdk.audio.AudioConfig(use_default_microphone=True)
recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)

print("Speak into your microphone...")
result = recognizer.recognize_once_async().get()

if result.reason == speechsdk.ResultReason.RecognizedSpeech:
    print(f"Recognized: {result.text}")
elif result.reason == speechsdk.ResultReason.NoMatch:
    print("No speech could be recognized.")
```

### 7. Text-to-Speech

```python
import azure.cognitiveservices.speech as speechsdk

speech_key = "<your-speech-key>"
speech_region = "eastus"

speech_config = speechsdk.SpeechConfig(subscription=speech_key, region=speech_region)
speech_config.speech_synthesis_voice_name = "en-US-JennyNeural"

synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config)

text = "Welcome to the Azure AI Fundamentals lab. Today we are exploring speech services."
result = synthesizer.speak_text_async(text).get()

if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
    print("Speech synthesized successfully.")
```

### 8. Explore Speech Studio

1. Navigate to https://speech.microsoft.com
2. Select your Speech resource
3. Try:
   - **Real-time speech-to-text** — speak and see transcription
   - **Text-to-speech** — type text and hear different voices
   - **Pronunciation assessment** — test pronunciation accuracy

## Summary

You used Azure AI Language for sentiment analysis, key phrase extraction, and entity recognition. You also used Azure AI Speech for speech-to-text transcription and text-to-speech synthesis. Both Language Studio and Speech Studio provide interactive ways to explore these capabilities.

## Cleanup

```bash
az group delete --name rg-ai900-labs --yes --no-wait
```
