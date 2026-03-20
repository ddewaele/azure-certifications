# Lab 02: Automated Machine Learning

## Overview

In this lab you will use Automated ML in Azure Machine Learning Studio to train a regression model that predicts bicycle rental demand, review the best model's metrics, and deploy it as an endpoint.

### Learning Objectives

- Create an Azure Machine Learning workspace
- Use Automated ML to train a regression model
- Review model metrics (RMSE, R-squared, MAE)
- Deploy the model as a managed online endpoint

## Prerequisites

- An active Azure subscription
- Access to Azure Machine Learning Studio (https://ml.azure.com)

## Steps

### 1. Create an Azure Machine Learning Workspace

```bash
az group create --name rg-ai900-ml --location eastus

az ml workspace create \
  --name ai900-ml-workspace \
  --resource-group rg-ai900-ml \
  --location eastus
```

Or create via the Azure portal: search for "Azure Machine Learning" and follow the creation wizard.

### 2. Open Azure Machine Learning Studio

1. Navigate to https://ml.azure.com
2. Select your workspace **ai900-ml-workspace**
3. You will see the Studio home page with options for Notebooks, Automated ML, Designer, and more

### 3. Create an Automated ML Job

1. In the left menu, select **Automated ML**
2. Click **+ New Automated ML job**
3. Configure the job:
   - **Job name:** bike-rental-automl
   - **Experiment name:** bike-rental-experiment

4. **Select task type:** Regression

5. **Create a dataset:**
   - Name: bike-rentals
   - Source: Web URL
   - URL: `https://aka.ms/bike-rentals`
   - Format: CSV with headers
   - Target column: **rentals** (this is the label)

6. **Configure training settings:**
   - Primary metric: **Normalized root mean squared error**
   - Allowed models: Select a few (e.g., RandomForest, LightGBM, XGBoost)
   - Max trials: 5
   - Max concurrent trials: 2
   - Timeout: 15 minutes

7. **Compute:** Use a serverless compute or create a compute cluster (Standard_DS3_v2, 1-2 nodes)

8. Click **Submit** to start the training

### 4. Review the Best Model

Once the job completes (10-20 minutes):

1. Open the completed job
2. Review the **Best model summary** — note the algorithm name
3. Click on the best model to see its details
4. Review the **Metrics** tab:
   - **RMSE (Root Mean Squared Error)** — lower is better
   - **R-squared (R2)** — closer to 1.0 is better
   - **MAE (Mean Absolute Error)** — lower is better
5. Review the **Explanations** tab to see which features had the most impact

### 5. Deploy the Model

1. From the best model page, click **Deploy > Real-time endpoint**
2. Configure:
   - Name: bike-rental-endpoint
   - Compute type: Managed
   - Instance type: Standard_DS2_v2
   - Instance count: 1
3. Click **Deploy** (this takes a few minutes)

### 6. Test the Endpoint

Once deployed, test with a sample input:

1. Go to **Endpoints** in the left menu
2. Select your endpoint
3. Click the **Test** tab
4. Enter sample JSON:

```json
{
  "input_data": {
    "columns": ["day", "mnth", "year", "season", "holiday", "weekday",
                 "workingday", "weathersit", "temp", "atemp", "hum", "windspeed"],
    "data": [[1, 1, 2023, 1, 0, 1, 1, 2, 0.3, 0.3, 0.5, 0.2]]
  }
}
```

5. Review the predicted rental count

## Summary

You used Automated ML to automatically discover the best regression model for predicting bicycle rentals. Azure ML tried multiple algorithms and hyperparameter configurations, then ranked them by RMSE. You deployed the best model as a REST endpoint.

## Key Takeaways

- **Automated ML** removes the need to manually select and tune algorithms
- **Regression metrics** (RMSE, R2, MAE) help you evaluate how well the model predicts numeric values
- Models can be deployed as **managed online endpoints** for real-time inference

## Cleanup

1. Delete the endpoint (to stop charges): Endpoints > Select > Delete
2. Delete the resource group:

```bash
az group delete --name rg-ai900-ml --yes --no-wait
```
