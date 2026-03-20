# Implement Computer Vision Solutions (10-15%)

## Analyzing Images

### Azure AI Vision — Image Analysis 4.0

| Feature | Description |
|---------|-------------|
| **Caption** | Generate a human-readable sentence describing the image |
| **Dense captions** | Generate captions for multiple regions in the image |
| **Tags** | Return relevant keywords with confidence scores |
| **Object detection** | Locate objects with bounding boxes |
| **Smart crop** | Suggest crop regions based on areas of interest |
| **People detection** | Detect people and return bounding boxes |
| **Background removal** | Separate foreground from background |
| **Read (OCR)** | Extract printed and handwritten text |

### Image Analysis API

```python
from azure.ai.vision.imageanalysis import ImageAnalysisClient
from azure.core.credentials import AzureKeyCredential

client = ImageAnalysisClient(
    endpoint="<endpoint>",
    credential=AzureKeyCredential("<key>")
)

result = client.analyze_from_url(
    image_url="https://example.com/photo.jpg",
    visual_features=["CAPTION", "TAGS", "OBJECTS", "READ"]
)

print(f"Caption: {result.caption.text} (confidence: {result.caption.confidence})")
for tag in result.tags.list:
    print(f"Tag: {tag.name} ({tag.confidence:.2f})")
for obj in result.objects.list:
    print(f"Object: {obj.tags[0].name} at [{obj.bounding_box}]")
```

### OCR / Text Extraction

The **Read** feature extracts text from images and documents:

- Supports printed and handwritten text
- Returns text organized as pages > lines > words
- Each word includes bounding polygon and confidence score
- Supports 164+ languages

```python
result = client.analyze_from_url(
    image_url="https://example.com/document.png",
    visual_features=["READ"]
)

for block in result.read.blocks:
    for line in block.lines:
        print(line.text)
```

## Custom Vision Models

### Image Classification vs Object Detection

| Type | Output | Use Case |
|------|--------|----------|
| **Image classification** | Label for the whole image | "This is a cat" |
| **Object detection** | Labels + bounding boxes for each object | "Cat at [x,y,w,h], dog at [x,y,w,h]" |

### Training Custom Models

1. **Label images** — upload images and annotate them (tags for classification, regions for detection)
2. **Train** — Azure trains the model using transfer learning
3. **Evaluate** — review precision, recall, mAP (mean average precision)
4. **Publish** — make the model available via a prediction endpoint
5. **Consume** — call the prediction API from your application

### Custom Model Evaluation Metrics

| Metric | Description |
|--------|-------------|
| **Precision** | Of predicted positives, how many are correct? |
| **Recall** | Of actual positives, how many are detected? |
| **mAP** | Mean Average Precision — overall detection quality |
| **AP per tag** | Average Precision for each individual class |

### Code-First Custom Models

Use the Azure AI Vision SDK for custom model training:

```python
# Upload training images, create dataset, train model
# Then use the custom model for prediction
result = client.analyze_from_url(
    image_url="https://example.com/test.jpg",
    visual_features=["CUSTOM_MODEL"],
    model_name="my-custom-model"
)
```

## Video Analysis

### Azure AI Video Indexer

Extracts rich insights from video content:

| Insight | Description |
|---------|-------------|
| **Face detection** | Detect and identify faces across video |
| **OCR** | Extract text appearing in video frames |
| **Transcript** | Speech-to-text transcription |
| **Keywords** | Key topics discussed |
| **Sentiment** | Emotional tone of speech |
| **Scenes / shots** | Automatic segmentation |
| **Labels** | Visual object labels per frame |
| **Named entities** | People, places, brands mentioned |
| **Topics** | High-level topic modelling |

### Spatial Analysis

Azure AI Vision Spatial Analysis detects **presence and movement of people** in video:

- **Person counting** — count people entering/exiting a zone
- **Social distancing** — detect distance between people
- **Zone dwell time** — measure how long people stay in an area
- **Line crossing** — detect when people cross a virtual line

Runs on **Azure Stack Edge** or compatible edge hardware with GPU.

## Exam Tips

- Know which **visual features** to include in an Image Analysis request (CAPTION, TAGS, OBJECTS, READ, etc.)
- **OCR (Read)** returns pages > lines > words with bounding polygons
- **Custom image classification** labels the whole image; **custom object detection** draws bounding boxes
- Custom model evaluation: **precision**, **recall**, **mAP**
- **Video Indexer** extracts comprehensive insights from video (faces, transcript, keywords, sentiment)
- **Spatial Analysis** requires edge hardware (GPU) and is specifically for people detection/movement
- Know how to configure the Image Analysis SDK to select specific features
- Dense captions generate descriptions for multiple regions, not just one caption for the whole image
