# Lab 03: Microsoft Purview Data Protection and Governance

## Overview

Explore Microsoft Purview features including sensitivity labels, DLP policies, Compliance Manager, data classification, and retention policies.

### Learning Objectives

- Create and publish sensitivity labels
- Configure a DLP policy to detect credit card numbers
- Review Compliance Manager score and improvement actions
- Explore content explorer and activity explorer
- Configure a retention policy

## Prerequisites

- Microsoft 365 tenant with E5 or E5 Compliance add-on
- Compliance Administrator role

## Steps

### 1. Navigate to Microsoft Purview

Navigate to https://compliance.microsoft.com (or https://purview.microsoft.com)

### 2. Create a Sensitivity Label

1. Go to **Information protection > Labels**
2. Click **+ Create a label**
3. Configure:
   - **Name:** Confidential - Internal
   - **Description:** For internal use only
   - **Scope:** Files, emails
4. **Encryption:** Enable encryption — restrict access to users in the organisation
5. **Content marking:** Add a header ("CONFIDENTIAL - INTERNAL") and a watermark
6. Click **Next** through remaining steps and **Create**

**Publish the label:**
1. Go to **Information protection > Label policies**
2. Click **+ Publish labels**
3. Select your "Confidential - Internal" label
4. Publish to all users
5. Set a default label if desired (e.g., "General")

### 3. Create a DLP Policy

1. Go to **Data loss prevention > Policies**
2. Click **+ Create policy**
3. Select template: **Financial > Credit Card Number**
4. Configure locations: Exchange, SharePoint, OneDrive, Teams
5. Set the action: **Block sharing and notify the user**
6. Set to **Test mode** first (simulate without blocking)
7. Create the policy

### 4. Review Compliance Manager

1. Go to **Compliance Manager > Overview**
2. Review your **Compliance Score** (percentage)
3. Click **Improvement actions** — see recommendations ranked by impact
4. Explore **Assessments** — view compliance against standards (GDPR, ISO 27001, etc.)
5. Click into an assessment to see control-level compliance status

### 5. Explore Data Classification

1. Go to **Data classification > Content explorer**
   - Browse content classified by sensitive information type or sensitivity label
   - View actual document content that matched classification rules
2. Go to **Data classification > Activity explorer**
   - View labeling events (label applied, changed, removed)
   - Filter by date, user, activity type

### 6. Configure a Retention Policy

1. Go to **Data lifecycle management > Policies > Retention policies**
2. Click **+ New retention policy**
3. Configure:
   - **Name:** Retain emails 7 years
   - **Locations:** Exchange email
   - **Retention:** Retain for 7 years, then delete
4. Create the policy

### 7. Test Sensitivity Labels

1. Open a Word document in Microsoft 365 (web or desktop)
2. Click the **Sensitivity** button in the ribbon
3. Apply the "Confidential - Internal" label
4. Verify:
   - Header/watermark appears
   - Encryption is applied (if configured)
   - Sharing restrictions are enforced

## Summary

You created sensitivity labels with encryption and markings, built a DLP policy for credit card detection, reviewed your compliance posture with Compliance Manager, explored data classification tools, and configured a retention policy.

## Key Takeaways

- **Sensitivity labels** classify and protect data with encryption, markings, and access restrictions
- **DLP policies** detect and prevent sharing of sensitive information — always test in simulation mode first
- **Compliance Manager** gives a score with specific improvement actions per regulatory standard
- **Content explorer** shows classified content; **Activity explorer** shows labeling events
- **Retention policies** control how long data is kept and when it is deleted
