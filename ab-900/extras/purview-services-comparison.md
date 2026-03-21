# Microsoft Purview Services Comparison

A quick-reference comparison of all Purview services relevant to the AB-900 exam.

## Service Matrix

| Service | What It Does | What It Detects / Protects | Key Actions |
|---------|-------------|---------------------------|-------------|
| **Information Protection** | Classify and protect data | Sensitive content needing protection | Apply sensitivity labels (encrypt, mark, restrict) |
| **Data Loss Prevention (DLP)** | Prevent accidental sharing | Credit cards, SSNs, health records, custom patterns | Block sharing, notify user, alert admin |
| **Insider Risk Management** | Detect risky user behavior | Data theft, policy violations, security breaches | Investigate, escalate, take remediation action |
| **Communication Compliance** | Monitor messages | Harassment, threats, regulatory violations | Review flagged messages, take action |
| **DSPM for AI** | Manage AI data security | AI usage, data flow to AI services | Discover, monitor, enforce AI data policies |
| **Data Lifecycle Management** | Manage retention and deletion | Content past retention period | Retain, delete, retain-then-delete |
| **Compliance Manager** | Assess regulatory compliance | Compliance gaps against standards | Score, recommend improvements |
| **eDiscovery** | Legal search and hold | Content relevant to litigation | Search, hold, export |

## When to Use What

| Scenario | Service |
|----------|---------|
| "Prevent credit card numbers from being emailed externally" | **DLP** |
| "Label executive documents as Highly Confidential with encryption" | **Information Protection** |
| "A departing employee is downloading large amounts of data" | **Insider Risk Management** |
| "Check if our org meets GDPR requirements" | **Compliance Manager** |
| "Monitor Teams chats for harassment" | **Communication Compliance** |
| "Keep all emails for 7 years then delete" | **Data Lifecycle Management** |
| "Search for all documents related to a lawsuit" | **eDiscovery** |
| "See what AI tools employees are using" | **DSPM for AI** |
| "See which documents have been labeled Confidential" | **Content Explorer** (Information Protection) |

## Sensitivity Labels vs DLP

These are complementary but different:

| Aspect | Sensitivity Labels | DLP |
|--------|-------------------|-----|
| **Purpose** | Classify and protect | Detect and prevent sharing |
| **Applied to** | Individual documents/emails | Locations (Exchange, SharePoint, Teams) |
| **Actions** | Encrypt, mark, restrict access | Block, notify, alert |
| **Who applies** | User (manual) or system (auto-labeling) | System (policy-based detection) |
| **Example** | "This document is Confidential — encrypted" | "This email contains a credit card number — blocked" |

They work best together: labels classify and protect; DLP policies detect and enforce.

## Retention vs DLP vs Information Protection

| Feature | Retention | DLP | Information Protection |
|---------|-----------|-----|----------------------|
| **Goal** | Keep or delete data by age | Prevent sensitive data sharing | Classify and protect data |
| **Scope** | Time-based lifecycle | Content-based detection | Classification-based protection |
| **Triggers** | Date created / modified | Sensitive content detected | Manual or auto-label |
| **Actions** | Retain, delete | Block, notify, alert | Encrypt, mark, restrict |
