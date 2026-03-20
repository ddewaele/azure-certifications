# AI-900 Glossary of Key Terms

## A

**Accuracy** — The proportion of correct predictions out of all predictions made by a classification model. Calculated as (TP + TN) / Total.

**Activation function** — A mathematical function applied to the output of each neuron in a neural network that introduces non-linearity, enabling the network to learn complex patterns. Common examples: ReLU, sigmoid, softmax.

**AI agent** — An AI system that can autonomously plan multi-step tasks, use external tools (APIs, databases, code), and take actions to accomplish goals — extending beyond simple text generation.

**Anomaly detection** — A technique that identifies unusual patterns or outliers in data that do not conform to expected behaviour. Used in fraud detection, equipment monitoring, and security.

**Area Under the Curve (AUC)** — A classification metric that measures the probability that the model ranks a random positive example higher than a random negative one. Ranges from 0.5 (random) to 1.0 (perfect).

**Attention mechanism** — A component of the Transformer architecture that allows the model to weigh the importance of different parts of the input when processing each element. Enables the model to focus on relevant context.

**Automated ML (AutoML)** — An Azure Machine Learning capability that automatically tests multiple algorithms, preprocessing steps, and hyperparameters to find the best-performing model for a given dataset.

**Azure AI Foundry** — Microsoft's unified platform (formerly Azure AI Studio) for building, testing, and deploying generative AI applications. Includes a model catalog, prompt flow, evaluation tools, and a playground.

**Azure AI Language** — An Azure service providing NLP capabilities including sentiment analysis, key phrase extraction, named entity recognition, language detection, question answering, and conversational language understanding.

**Azure AI Speech** — An Azure service providing speech capabilities including speech-to-text, text-to-speech, speech translation, and speaker recognition.

**Azure AI Vision** — An Azure service providing computer vision capabilities including image analysis, OCR, object detection, image captioning, and spatial analysis.

**Azure Machine Learning** — A cloud platform for the full machine learning lifecycle including data preparation, model training (AutoML, designer, notebooks), model management, and deployment to endpoints.

**Azure OpenAI Service** — An Azure service providing enterprise-grade access to OpenAI models (GPT-4, DALL-E, Whisper) with Azure security, compliance, content filtering, and regional data residency.

## B

**Bias (model)** — Systematic prejudice in a model's predictions caused by imbalanced or non-representative training data. For example, a hiring model trained mostly on male resumes may unfairly disadvantage female applicants.

**Binary classification** — A classification task with exactly two possible outcomes (e.g., spam/not spam, positive/negative, approve/deny).

**Bounding box** — A rectangle drawn around a detected object in an image, defined by coordinates (x, y, width, height). Used in object detection to show where objects are located.

## C

**Classification** — A supervised machine learning technique that predicts a categorical label (class) for an input. Includes binary classification (two classes) and multi-class classification (three or more classes).

**Clustering** — An unsupervised machine learning technique that groups similar data points together without predefined labels. K-Means is the most common clustering algorithm.

**Computer vision** — A field of AI that enables computers to interpret and understand visual information from images and video, including tasks like classification, object detection, and OCR.

**Confusion matrix** — A table showing the counts of true positives, true negatives, false positives, and false negatives for a classification model. Used to calculate metrics like precision, recall, and accuracy.

**Content filtering** — Built-in safety mechanisms in Azure OpenAI that detect and block harmful content in both prompts (input) and completions (output), including hate speech, violence, and self-harm.

**Conversational language understanding (CLU)** — A feature of Azure AI Language that enables applications to understand user intent and extract entities from natural language conversations. Used for building chatbots and virtual assistants.

**Custom Vision** — A feature in Azure AI Vision that lets you train custom image classification and object detection models using your own labeled images.

## D

**Data labeling** — The process of annotating training data with the correct output values (labels). For example, tagging images as "cat" or "dog" for an image classification model.

**Deep learning** — A subset of machine learning that uses neural networks with multiple hidden layers to learn complex patterns from large amounts of data. Enables tasks like image recognition and language understanding.

**Document intelligence** — AI capabilities for extracting structured information from documents such as invoices, receipts, forms, and contracts. Azure AI Document Intelligence (formerly Form Recognizer) provides this capability.

## E

**Embeddings** — Dense vector representations of data (text, images) in a high-dimensional space where similar items are positioned close together. Used for semantic search, similarity matching, and as input to LLMs.

**Entity recognition** — See Named entity recognition (NER).

**Epoch** — One complete pass through the entire training dataset during model training. Models typically require many epochs to converge.

**Evaluation metrics** — Quantitative measures used to assess model performance. Regression: MAE, RMSE, R-squared. Classification: accuracy, precision, recall, F1, AUC.

## F

**F1 score** — The harmonic mean of precision and recall: F1 = 2 * (precision * recall) / (precision + recall). Useful when you need to balance both false positives and false negatives.

**Face detection** — The process of identifying the presence and location of human faces in an image. Returns bounding boxes and optionally facial landmarks and attributes.

**Fairness** — A responsible AI principle requiring that AI systems treat all people equitably, without bias or discrimination based on demographics or protected characteristics.

**Feature (ML)** — An input variable in a dataset used by a machine learning model to make predictions. For example, in house price prediction, features include square footage, number of bedrooms, and location.

**Few-shot learning** — A prompt engineering technique where a small number of input-output examples are provided in the prompt to demonstrate the desired behaviour before the actual task.

**Fine-tuning** — The process of further training a pre-trained model on a smaller, domain-specific dataset to specialise it for a particular task while retaining its general knowledge.

## G

**Generative AI** — AI models that create new content (text, images, code, audio) based on patterns learned from training data, rather than classifying or predicting from existing data.

**GPT (Generative Pre-trained Transformer)** — A family of large language models developed by OpenAI, based on the Transformer architecture. GPT models generate text by predicting the next token.

**Grounding** — The practice of connecting generative AI outputs to verifiable source data (documents, databases, search results) to reduce hallucinations and improve factual accuracy. RAG is a common grounding technique.

**Groundedness** — A quality metric for generative AI that measures how well the model's output is supported by provided source data, as opposed to fabricated content.

## H

**Hallucination** — When a generative AI model produces confident-sounding output that is factually incorrect or fabricated. A key responsible AI concern for generative AI systems.

**Hyperparameter** — A configuration setting specified before model training begins (e.g., learning rate, number of epochs, number of clusters K). Unlike model parameters, hyperparameters are not learned from data.

## I

**Image classification** — A computer vision task that assigns a category label to an entire image (e.g., "cat", "dog", "car"). Can be single-label or multi-label.

**Inclusiveness** — A responsible AI principle requiring that AI systems empower and engage everyone, regardless of physical ability, gender, ethnicity, or other characteristics.

**Inference** — The process of using a trained model to make predictions on new, unseen data. Also called scoring or prediction.

## K

**K-Means clustering** — An unsupervised learning algorithm that partitions data into K clusters by iteratively assigning points to their nearest centroid and updating centroid positions until convergence.

**Key phrase extraction** — An NLP feature that identifies the main topics and important terms in a body of text. Provided by Azure AI Language.

## L

**Label (ML)** — The target value that a supervised machine learning model learns to predict. For example, in spam detection, the label is "spam" or "not spam".

**Language model** — A statistical or neural model that understands the structure and patterns of human language. Modern language models are based on the Transformer architecture.

**Large language model (LLM)** — A deep learning model with billions of parameters, trained on massive text datasets, capable of understanding and generating human-like language. Examples: GPT-4, Llama, Mistral.

## M

**Machine learning** — A subset of AI where systems learn from data to make predictions or decisions without being explicitly programmed with rules.

**MAE (Mean Absolute Error)** — A regression metric that calculates the average of the absolute differences between predicted and actual values. Lower is better; 0 is perfect.

**Microsoft Foundry** — The new name for Azure AI Foundry / Azure AI Studio. Microsoft's unified platform for building AI applications.

**Model catalog** — A feature of Azure AI Foundry that provides access to hundreds of pre-built models from multiple sources (OpenAI, Meta, Mistral, Microsoft) for evaluation and deployment.

**Multi-class classification** — A classification task with three or more possible outcomes (e.g., classifying images as cat, dog, bird, or fish).

**Multimodal model** — A model that can process and generate multiple types of data (text, images, audio, video). GPT-4o is a multimodal model that handles both text and images.

## N

**Named entity recognition (NER)** — An NLP feature that identifies and classifies specific entities in text, such as people, organisations, locations, dates, and quantities. Provided by Azure AI Language.

**Natural language processing (NLP)** — A branch of AI that enables computers to understand, interpret, and generate human language in both text and speech form.

**Neural network** — A machine learning model inspired by the human brain, consisting of interconnected layers of neurons (nodes) that process information. Deep neural networks have many hidden layers.

## O

**Object detection** — A computer vision task that identifies and locates multiple objects within an image, returning class labels and bounding box coordinates for each detected object.

**OCR (Optical Character Recognition)** — Technology that extracts printed or handwritten text from images, scanned documents, and photographs. Provided by Azure AI Vision.

**Overfitting** — A condition where a model performs well on training data but poorly on new, unseen data because it has memorised noise and specific patterns in the training set rather than learning generalisable rules.

## P

**Precision** — A classification metric measuring the proportion of predicted positives that are actually positive: TP / (TP + FP). Important when the cost of false positives is high.

**Prediction** — The output of a trained model when given new input data. Also called inference or scoring.

**Prompt** — The input text provided to a generative AI model that guides its response. Includes the user's question or instruction and optionally a system message and examples.

**Prompt engineering** — The practice of designing and refining prompts to get desired results from generative AI models. Techniques include system messages, few-shot examples, and chain of thought.

**Prompt flow** — A feature in Azure AI Foundry that provides a visual tool for building, testing, and deploying LLM-based applications by connecting prompts, models, and tools into workflows.

## R

**R-squared (R2)** — A regression metric measuring the proportion of variance in the target variable explained by the model. Ranges from negative values (worse than average) through 0 (same as average) to 1.0 (perfect).

**Recall** — A classification metric measuring the proportion of actual positives that were correctly predicted: TP / (TP + FN). Important when the cost of false negatives is high.

**Regression** — A supervised machine learning technique that predicts continuous numeric values (e.g., price, temperature, sales).

**Reinforcement learning** — A machine learning approach where an agent learns to make decisions by taking actions in an environment and receiving rewards or penalties based on outcomes.

**Responsible AI** — Microsoft's framework of six principles (fairness, reliability and safety, privacy and security, inclusiveness, transparency, accountability) for building AI systems ethically and safely.

**RMSE (Root Mean Squared Error)** — A regression metric that calculates the square root of the average squared differences between predicted and actual values. Penalises larger errors more than MAE.

## S

**Sentiment analysis** — An NLP feature that evaluates text to determine its emotional tone: positive, negative, neutral, or mixed. Provided by Azure AI Language.

**Speech recognition** — The process of converting spoken audio into written text. Also called speech-to-text (STT). Provided by Azure AI Speech.

**Speech synthesis** — The process of converting written text into natural-sounding spoken audio. Also called text-to-speech (TTS). Provided by Azure AI Speech.

**Supervised learning** — A machine learning approach where the model is trained on labeled data (input features paired with known output labels). Includes regression and classification.

**System message** — A special prompt component in generative AI that defines the model's persona, behaviour, boundaries, and output format. Set by the developer, not visible to end users.

## T

**Temperature** — A parameter that controls the randomness of generative AI output. A value of 0.0 produces deterministic, focused responses; higher values (up to 2.0) produce more creative and varied output.

**Text analytics** — A set of NLP capabilities for analysing text, including sentiment analysis, key phrase extraction, named entity recognition, and language detection. Provided by Azure AI Language.

**Tokenisation** — The process of breaking input text into smaller units (tokens) — words, subwords, or characters — and mapping them to numerical IDs for processing by a language model.

**Top-p (nucleus sampling)** — A parameter that controls which tokens the model considers when generating output. The model considers only tokens within the cumulative probability p. Lower values = more focused output.

**Training data** — The dataset used to train a machine learning model. In supervised learning, this includes both features (inputs) and labels (outputs).

**Transformer** — A neural network architecture that uses self-attention mechanisms to process sequences in parallel. The foundation of modern large language models (GPT, BERT, Llama).

**Translation** — Converting text or speech from one language to another. Azure AI Translator provides text and document translation; Azure AI Speech provides speech translation.

## U

**Underfitting** — A condition where a model is too simple to capture the underlying patterns in data, resulting in poor performance on both training and validation datasets.

**Unsupervised learning** — A machine learning approach where the model finds patterns in data without labeled outputs. Clustering is the most common unsupervised learning technique.

## V

**Validation data** — A subset of data held back from training, used to evaluate model performance and tune hyperparameters. Helps detect overfitting by measuring how well the model generalises.

**Vision Studio** — A web-based interface for exploring and testing Azure AI Vision capabilities, including image analysis, OCR, face detection, and custom models.

## Z

**Zero-shot learning** — A prompt engineering technique where the model is asked to perform a task without any examples, relying entirely on its pre-trained knowledge to understand and complete the task.
