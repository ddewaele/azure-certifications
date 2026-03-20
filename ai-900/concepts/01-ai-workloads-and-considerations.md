# Describe Artificial Intelligence Workloads and Considerations (15-20%)

## What is Artificial Intelligence?

Artificial Intelligence (AI) is the simulation of human intelligence by computer systems. AI enables machines to perform tasks that typically require human cognition such as visual perception, speech recognition, decision-making, and language understanding.

### Types of AI

| Type | Description | Example |
|------|-------------|---------|
| **Narrow AI (Weak AI)** | Designed for a specific task | Image classification, spam detection |
| **General AI (Strong AI)** | Hypothetical AI with human-level reasoning across all domains | Does not exist yet |

All current Azure AI services are narrow AI — designed to excel at specific, well-defined tasks.

## Common AI Workloads

### Computer Vision

Computer vision enables machines to interpret and understand visual information from images and video.

- **Image classification** — categorise an entire image (e.g., "cat" or "dog")
- **Object detection** — locate and identify multiple objects within an image with bounding boxes
- **Optical character recognition (OCR)** — extract printed or handwritten text from images
- **Facial detection and analysis** — detect faces and analyse attributes (age, emotion, glasses)

### Natural Language Processing (NLP)

NLP enables machines to understand, interpret, and generate human language.

- **Sentiment analysis** — determine if text is positive, negative, neutral, or mixed
- **Key phrase extraction** — identify the main topics in a body of text
- **Named entity recognition (NER)** — find and classify entities (people, places, dates)
- **Language detection** — identify the language of a text
- **Translation** — convert text or speech between languages
- **Speech recognition and synthesis** — convert speech to text and text to speech

### Document Processing / Information Extraction

Extract structured data from unstructured documents.

- Invoice processing — extract vendor, date, amounts from invoices
- Receipt scanning — extract items, totals, tax from receipts
- ID document processing — extract name, date of birth, ID number
- Custom document models — train models for domain-specific documents

### Generative AI

Create new content based on learned patterns from training data.

- **Text generation** — write articles, emails, code
- **Image generation** — create images from text descriptions (DALL-E)
- **Code generation** — write and debug code (GitHub Copilot)
- **Summarisation** — condense long documents into key points
- **Chatbots and assistants** — conversational AI for customer support

## Responsible AI Principles

Microsoft defines six principles for building AI systems responsibly:

### 1. Fairness

AI systems should treat all people equitably. Models trained on biased data may produce unfair outcomes that discriminate against certain groups.

- Test models across different demographic groups
- Use balanced, representative training data
- Monitor for disparate impact

### 2. Reliability and Safety

AI systems should perform consistently and safely under expected and unexpected conditions.

- Test extensively before deployment
- Plan for edge cases and failure modes
- Implement fallback mechanisms
- Critical systems (medical, autonomous vehicles) require the highest standards

### 3. Privacy and Security

AI systems should protect personal data and resist security threats.

- Comply with data protection regulations (GDPR, etc.)
- Use encryption and access controls
- Minimise data collection to what is necessary
- Ensure training data is collected with proper consent

### 4. Inclusiveness

AI systems should empower and engage everyone, regardless of physical ability, gender, ethnicity, or other characteristics.

- Design for accessibility (screen readers, alternative input methods)
- Avoid excluding users through biased assumptions
- Consider diverse user needs from the start

### 5. Transparency

AI systems should be understandable so users can comprehend how and why decisions are made.

- Document how models work and their limitations
- Provide explanations for AI-driven decisions
- Be clear when users are interacting with AI
- Disclose training data sources and methods

### 6. Accountability

People should be accountable for AI systems and their outcomes.

- Establish clear governance and oversight
- Define roles and responsibilities for AI decisions
- Enable human review and override of AI decisions
- Maintain audit trails

### Summary Table

| Principle | Key Question |
|-----------|-------------|
| Fairness | Does the system treat all users equitably? |
| Reliability & Safety | Does it work correctly and safely? |
| Privacy & Security | Is personal data protected? |
| Inclusiveness | Can everyone use it? |
| Transparency | Can users understand how it works? |
| Accountability | Who is responsible for its outcomes? |

## Exam Tips

- Know all **six responsible AI principles** by name and be able to match each to a scenario
- **Fairness** is about equitable treatment and avoiding bias — not about equal outcomes
- **Transparency** is about understanding how AI makes decisions — not about open-sourcing code
- **Reliability and safety** is the principle most relevant to life-critical systems (medical, automotive)
- Be able to identify which AI workload type matches a given scenario (computer vision vs NLP vs generative AI vs document processing)
- Responsible AI is not just a set of guidelines — Microsoft embeds it into Azure AI services through content filters, fairness dashboards, and transparency notes
