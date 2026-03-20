# Describe Fundamental Principles of Machine Learning on Azure (15-20%)

## What is Machine Learning?

Machine learning (ML) is a subset of AI where computer systems learn from data to make predictions or decisions without being explicitly programmed. Instead of writing rules, you provide data and the algorithm discovers patterns.

### Types of Machine Learning

| Type | Description | Requires Labels? | Example |
|------|-------------|-------------------|---------|
| **Supervised learning** | Learn from labeled data | Yes | Regression, classification |
| **Unsupervised learning** | Find patterns in unlabeled data | No | Clustering |
| **Reinforcement learning** | Learn through rewards/penalties | No (uses feedback) | Game playing, robotics |

## Regression

Regression predicts **continuous numeric values**.

### Common Scenarios

- Predict house prices based on features (size, location, bedrooms)
- Forecast sales revenue for next quarter
- Estimate the temperature tomorrow
- Predict the time to complete a delivery

### Evaluation Metrics

| Metric | Description | Ideal Value |
|--------|-------------|-------------|
| **Mean Absolute Error (MAE)** | Average of absolute differences between predicted and actual values | 0 |
| **Root Mean Squared Error (RMSE)** | Square root of average squared differences (penalises large errors more) | 0 |
| **R-squared (R²)** | Proportion of variance explained by the model | 1.0 |

- **R² = 1.0** means the model perfectly explains all variance
- **R² = 0.0** means the model explains no more variance than a simple average
- **R² < 0** means the model is worse than predicting the average

## Classification

Classification predicts **categorical labels** (discrete classes).

### Binary Classification

Predicts one of **two** possible outcomes.

- Email: spam or not spam
- Loan application: approve or deny
- Medical test: positive or negative

### Multi-class Classification

Predicts one of **three or more** categories.

- Image recognition: cat, dog, bird, fish
- Document classification: invoice, receipt, contract, letter
- Product category: electronics, clothing, food

### Evaluation Metrics

| Metric | Description | Formula |
|--------|-------------|---------|
| **Accuracy** | Proportion of correct predictions | (TP + TN) / Total |
| **Precision** | Of predicted positives, how many were actually positive? | TP / (TP + FP) |
| **Recall** | Of actual positives, how many were correctly predicted? | TP / (TP + FN) |
| **F1 Score** | Harmonic mean of precision and recall | 2 * (P * R) / (P + R) |
| **AUC** | Area Under the ROC Curve — probability that the model ranks a random positive higher than a random negative | 0.5 (random) to 1.0 (perfect) |

### Confusion Matrix

A confusion matrix shows the counts of true positives (TP), true negatives (TN), false positives (FP), and false negatives (FN):

|  | Predicted Positive | Predicted Negative |
|--|--------------------|--------------------|
| **Actual Positive** | True Positive (TP) | False Negative (FN) |
| **Actual Negative** | False Positive (FP) | True Negative (TN) |

## Clustering

Clustering is an **unsupervised** learning technique that groups similar data points together without predefined labels.

### K-Means Clustering

The most common clustering algorithm:
1. Choose K (the number of clusters)
2. Randomly place K cluster centroids
3. Assign each data point to its nearest centroid
4. Recalculate centroids based on assigned points
5. Repeat steps 3-4 until centroids stabilise

### Common Scenarios

- Customer segmentation (group customers by purchasing behaviour)
- Anomaly detection (identify data points far from any cluster)
- Document grouping (group similar articles or documents)

## Deep Learning

Deep learning uses **neural networks** with multiple layers to learn complex patterns from data.

### Neural Networks

A neural network consists of:
- **Input layer** — receives the features
- **Hidden layers** — learn intermediate representations (more layers = "deeper")
- **Output layer** — produces the prediction

Each connection has a **weight** that is adjusted during training. Neurons apply an **activation function** to introduce non-linearity.

### Types of Neural Networks

| Type | Best For | How It Works |
|------|----------|-------------|
| **CNN (Convolutional Neural Network)** | Images, spatial data | Uses convolutional filters to detect features like edges, shapes, textures |
| **RNN (Recurrent Neural Network)** | Sequential data, time series | Processes sequences by passing hidden state forward through time steps |
| **Transformer** | Language, sequences | Uses self-attention to process entire sequences in parallel |

### The Transformer Architecture

The Transformer is the architecture behind modern LLMs (GPT, BERT, etc.):

- **Self-attention mechanism** — allows the model to weigh the importance of different parts of the input when processing each element
- **Parallel processing** — unlike RNNs, Transformers process all tokens simultaneously
- **Pre-training on massive datasets** — trained on internet-scale text data
- **Transfer learning** — pre-trained models can be fine-tuned for specific tasks

## Features and Labels

| Term | Definition | Example (House Price Prediction) |
|------|-----------|----------------------------------|
| **Feature** | An input variable used for prediction | Square footage, number of bedrooms, location |
| **Label** | The target value the model learns to predict | Sale price |

- **Supervised learning** requires both features and labels in training data
- **Unsupervised learning** (clustering) uses only features — no labels

## Training, Validation, and Test Data

| Dataset | Purpose | When Used |
|---------|---------|-----------|
| **Training set** | Fit the model (learn patterns) | During training |
| **Validation set** | Tune hyperparameters and detect overfitting | During training/evaluation |
| **Test set** | Final evaluation of model performance | After training is complete |

### Overfitting vs Underfitting

| Problem | Symptom | Cause |
|---------|---------|-------|
| **Overfitting** | High training accuracy, low validation accuracy | Model memorises training data noise |
| **Underfitting** | Low accuracy on both training and validation | Model is too simple to capture patterns |

## Azure Machine Learning

Azure Machine Learning is a cloud platform for the complete ML lifecycle.

### Key Capabilities

| Capability | Description |
|-----------|-------------|
| **Automated ML (AutoML)** | Automatically tries multiple algorithms and hyperparameters to find the best model |
| **Designer** | Drag-and-drop visual interface for building training pipelines |
| **Notebooks** | Jupyter notebooks for code-first data science |
| **Compute instances** | Cloud VMs for development and experimentation |
| **Compute clusters** | Scalable compute for training jobs |
| **Model registry** | Store, version, and manage trained models |
| **Managed endpoints** | Deploy models as REST APIs (real-time or batch) |
| **Responsible AI dashboard** | Evaluate models for fairness, interpretability, and error analysis |

### Automated ML

AutoML automates the process of finding the best model:
1. You provide a dataset and specify the target column (label)
2. AutoML tries multiple algorithms (e.g., Random Forest, XGBoost, neural networks)
3. It applies different preprocessing steps and hyperparameter combinations
4. It evaluates each model and ranks them by your chosen metric
5. You review the best model and deploy it

### Model Deployment

After training, models can be deployed to:
- **Managed online endpoints** — real-time inference via REST API
- **Batch endpoints** — process large datasets in bulk
- **Edge devices** — deploy to IoT devices using Azure IoT Edge

## Exam Tips

- Know the **three main ML types**: regression (numeric), classification (categorical), clustering (grouping)
- **Regression metrics**: MAE, RMSE, R² — remember R² = 1.0 is perfect
- **Classification metrics**: accuracy, precision, recall, F1, AUC — know what each measures
- **Features** = input variables, **labels** = target values
- **Overfitting** = great on training data, poor on validation; **underfitting** = poor on both
- **Transformers** use self-attention and are the foundation of GPT and other LLMs
- **Automated ML** is the key Azure ML feature for the exam — it finds the best model automatically
- The **validation set** is used to evaluate generalisation, not for training
