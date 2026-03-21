# Describe Features of Computer Vision Workloads on Azure (15-20%)

## What is Computer Vision?

Computer vision is a field of AI that enables computers to interpret and understand visual information from images and video. It uses deep learning models (typically CNNs and Transformers) to extract meaning from pixel data.

## Common Computer Vision Solutions

### Image Classification

Image classification assigns a **single label** (or multiple labels) to an **entire image**.

| Type | Description | Example |
|------|-------------|---------|
| **Single-label** | One category per image | "This is a dog" |
| **Multi-label** | Multiple categories per image | "Contains: dog, grass, ball" |

**How it works:**
1. A model (typically CNN or Vision Transformer) is trained on labeled images
2. The model learns visual features (edges, textures, shapes, patterns)
3. Given a new image, it predicts the most likely category

**Use cases:** Product categorisation, medical imaging diagnosis, quality inspection, content moderation.

### Object Detection

Object detection identifies **multiple objects** within an image and locates each one with a **bounding box**.

- Returns: class label + bounding box coordinates (x, y, width, height) + confidence score
- Can detect multiple instances of the same class in one image
- More granular than image classification (knows where objects are, not just what the image contains)

**Use cases:** Autonomous vehicles, retail shelf analysis, security surveillance, manufacturing defect detection.

### Semantic Segmentation

Semantic segmentation classifies **every pixel** in an image into a category, producing a color-coded mask that shows which areas belong to which class.

| Aspect | Image Classification | Object Detection | Semantic Segmentation |
|--------|---------------------|-----------------|----------------------|
| **Output** | Label for whole image | Labels + bounding boxes | Per-pixel class labels |
| **Granularity** | Image-level | Object-level (rectangles) | Pixel-level (exact shape) |
| **Example** | "Street scene" | "Car at [x,y,w,h]" | Every pixel labeled as road, car, pedestrian, sky, etc. |

**Use cases:** Autonomous driving (road vs sidewalk vs obstacle), medical imaging (tumour boundaries), satellite imagery (land use mapping), industrial inspection.

Unlike object detection which draws rectangular bounding boxes, semantic segmentation produces a precise pixel-level mask showing the exact shape and boundary of each region.

### Optical Character Recognition (OCR)

OCR extracts **printed or handwritten text** from images, scanned documents, and photos.

- Supports multiple languages and scripts
- Can handle various fonts, sizes, and orientations
- Works on structured documents (forms, invoices) and unstructured images (street signs, handwritten notes)

**Use cases:** Document digitisation, license plate recognition, receipt scanning, accessibility tools for visually impaired users.

### Facial Detection and Analysis

| Capability | Description |
|-----------|-------------|
| **Face detection** | Locates faces in an image and returns bounding box coordinates |
| **Facial attribute analysis** | Estimates attributes: age, emotion, glasses, head pose, facial hair |
| **Face verification (1:1)** | Compares two faces to determine if they are the same person |
| **Face identification (1:many)** | Determines which person in a group matches a given face |

**Responsible AI considerations for facial recognition:**
- Accuracy can vary across demographic groups (skin tone, age, gender)
- Must obtain consent for biometric data collection
- Should include human oversight for high-stakes decisions
- Microsoft restricts access to facial recognition capabilities that can be used for identification

## Azure Services for Computer Vision

### Azure AI Vision

Azure AI Vision (formerly Computer Vision) provides pre-built models for image analysis.

| Feature | Description |
|---------|-------------|
| **Image Analysis** | Generate captions, tags, detect objects, identify brands, categorise images |
| **OCR / Read** | Extract printed and handwritten text from images and documents |
| **Spatial Analysis** | Analyse people movement in video streams (counting, dwell time, social distancing) |
| **Custom Image Classification** | Train custom models with your own labeled images |
| **Custom Object Detection** | Train custom models to detect domain-specific objects |
| **Image generation** | Generate images using multimodal models |

**Key capabilities of Image Analysis 4.0:**
- Dense captions — generate detailed descriptions for multiple regions in an image
- Smart cropping — intelligently crop images based on areas of interest
- Background removal — separate foreground subjects from backgrounds
- Multimodal embeddings — create vector representations for images and text (enables image search)

### Azure AI Face

Azure AI Face is a dedicated service for face-related tasks.

| Feature | Description |
|---------|-------------|
| **Face detection** | Detect faces and return bounding boxes, landmarks, and attributes |
| **Face verification** | 1:1 matching — confirm two faces are the same person |
| **Face identification** | 1:many matching — identify a person from a group |
| **Face grouping** | Group similar faces together |
| **Liveness detection** | Determine if the face is a live person (not a photo or video) |

**Access restrictions:** Microsoft requires an application and approval process for face identification and verification capabilities due to responsible AI considerations.

### Comparison: Azure AI Vision vs Azure AI Face

| Feature | Azure AI Vision | Azure AI Face |
|---------|----------------|---------------|
| Image captioning | Yes | No |
| Object detection | Yes | No |
| OCR | Yes | No |
| Face detection | Basic | Advanced |
| Face verification/identification | No | Yes |
| Facial attributes | Limited | Detailed |
| Liveness detection | No | Yes |

## Exam Tips

- **Image classification** = label for the whole image; **object detection** = labels + bounding boxes for individual objects
- **OCR** extracts text from images — know that Azure AI Vision provides this capability
- **Face verification** (1:1) compares two faces; **face identification** (1:many) searches a group
- Azure AI Vision is the general-purpose vision service; Azure AI Face is specifically for face tasks
- Know that **facial recognition has responsible AI concerns** — bias across demographics, consent requirements, restricted access
- **Spatial analysis** in Azure AI Vision works with video, not still images
- Azure AI Face requires an **approval process** for identification/verification features
