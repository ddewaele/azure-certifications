# Lab 04: NLP with Azure AI Language, Speech, and Translator

## Overview

Implement text analytics, build a conversational language understanding model, create a question answering knowledge base, and work with speech services.

### Learning Objectives

- Perform sentiment analysis, NER, key phrase extraction, and PII detection
- Build a CLU model with intents, entities, and utterances
- Create a question answering knowledge base
- Implement speech-to-text and text-to-speech with SSML

## Prerequisites

- Azure subscription
- Python 3.x with `azure-ai-textanalytics` and `azure-cognitiveservices-speech`

## Steps

### 1. Text Analytics

```python
from azure.ai.textanalytics import TextAnalyticsClient
from azure.core.credentials import AzureKeyCredential

client = TextAnalyticsClient("<endpoint>", AzureKeyCredential("<key>"))

# Sentiment with opinion mining
docs = ["The room was clean and spacious, but the wifi was terrible."]
results = client.analyze_sentiment(docs, show_opinion_mining=True)
for result in results:
    print(f"Overall: {result.sentiment}")
    for sentence in result.sentences:
        for opinion in sentence.mined_opinions:
            print(f"  {opinion.target.text}: {opinion.target.sentiment}")
            for assessment in opinion.assessments:
                print(f"    - {assessment.text}: {assessment.sentiment}")

# PII detection
results = client.recognize_pii_entities(
    ["My phone is 555-123-4567 and my email is john@example.com"]
)
for result in results:
    print(f"Redacted: {result.redacted_text}")
    for entity in result.entities:
        print(f"  {entity.text} ({entity.category})")
```

### 2. Build a CLU Model (Language Studio)

1. Go to **Language Studio** (https://language.cognitive.azure.com)
2. Create a **Conversational language understanding** project
3. Define intents: `BookFlight`, `GetWeather`, `Cancel`
4. Define entities: `destination`, `date`, `origin`
5. Add utterances:
   - "Book a flight to Paris" -> `BookFlight` (destination: Paris)
   - "What's the weather in London?" -> `GetWeather` (destination: London)
   - "Cancel my reservation" -> `Cancel`
6. Train the model
7. Evaluate: check precision/recall per intent
8. Deploy to a slot

### 3. Question Answering Knowledge Base

1. In Language Studio, create a **Custom question answering** project
2. Add a source URL (e.g., your company FAQ page)
3. Review and edit generated QA pairs
4. Add alternate phrasings for key questions
5. Enable **chit-chat** (select a personality)
6. Add **multi-turn** follow-up prompts
7. Train and test
8. Deploy and test via REST API

### 4. Speech-to-Text and Text-to-Speech with SSML

```python
import azure.cognitiveservices.speech as speechsdk

config = speechsdk.SpeechConfig(subscription="<key>", region="eastus")

# Speech-to-text from microphone
config.speech_recognition_language = "en-US"
recognizer = speechsdk.SpeechRecognizer(speech_config=config)
print("Speak...")
result = recognizer.recognize_once()
print(f"Recognized: {result.text}")

# Text-to-speech with SSML
ssml = """
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
  <voice name="en-US-JennyNeural">
    <prosody rate="medium" pitch="+2%">
      Welcome to the AI 102 lab.
    </prosody>
    <break time="500ms"/>
    <emphasis level="strong">Let's explore speech services.</emphasis>
  </voice>
</speak>
"""
synthesizer = speechsdk.SpeechSynthesizer(speech_config=config)
synthesizer.speak_ssml(ssml)
```

## Summary

You performed text analytics with opinion mining and PII detection, built a CLU model and question answering KB in Language Studio, and used speech services with SSML for fine-grained synthesis control.

## Cleanup

```bash
az group delete --name rg-ai102-labs --yes --no-wait
```
