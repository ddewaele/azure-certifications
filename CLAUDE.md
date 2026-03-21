# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Azure certification study repository with interactive CLI quizzes. Covers AZ-900, AI-900, AI-102, and AB-900 certifications. No external dependencies — pure Node.js + filesystem.

## Commands

```bash
# Run quiz CLI (requires Node >= 16)
node cli/cli.js <path-to-quiz-folder>

# Examples
node cli/cli.js az-900/quiz
node cli/cli.js ai-900/quiz
node cli/cli.js ai-102/quiz
node cli/cli.js ab-900/quiz

# Syntax-check the CLI
node --check cli/cli.js
```

There are no test suites, linting, or build steps.

## Repository Structure

The repo is organized around **certifications**, each in its own top-level folder:

| Folder | Certification | Level |
|--------|--------------|-------|
| `az-900/` | Azure Fundamentals | Foundational |
| `ai-900/` | Azure AI Fundamentals | Foundational |
| `ai-102/` | Azure AI Engineer Associate | Associate |
| `ab-900/` | M365 Copilot & Agent Administration Fundamentals | Foundational |

### Per-Certification Structure

Every certification folder follows the same consistent layout:

```
<cert>/
├── README.md              # Study roadmap, exam info, and resource links
├── concepts/              # Markdown guides organized by exam domain (numbered)
├── labs/                  # Hands-on lab walkthroughs using Azure CLI/Portal (numbered)
├── quiz/                  # JSON quiz files for exam prep (numbered)
├── glossary.md            # Key term definitions for the certification
└── microsoft-learn-toc.md # Table of contents mapping to the Microsoft Learn path
```

- **concepts/** — Each file covers one exam domain or topic area (e.g., `01-cloud-concepts.md`). Numbered to follow the exam outline order.
- **labs/** — Step-by-step practical exercises. Numbered sequentially (e.g., `01-create-resource-group.md`).
- **quiz/** — JSON quiz banks. Each file maps to a topic area (e.g., `01-cloud-concepts.json`). Schema detailed below.
- **glossary.md** — Alphabetical term definitions specific to the certification scope.
- **microsoft-learn-toc.md** — Maps the official Microsoft Learn learning path modules and units, used to track study progress.
- **README.md** — Entry point for each certification with exam overview, study plan, and curated external resources.

### Shared/Top-Level Folders

- `cli/` — Interactive quiz CLI application
- `quiz/` — Top-level schema documentation for the quiz JSON format (`quiz/README.md`)
- `guides/` — Cross-certification guides (e.g., Azure CLI setup)
- `troubleshooting/` — Common Azure errors and fixes
- `personal/` — Personal study notes (e.g., MeasureUp practice exam notes)

## Architecture

### Quiz CLI (`cli/cli.js`)

Single-file terminal UI application (~650 lines) using a state machine pattern with four screens: `FILE_SELECT → QUIZ → RESULTS/BOOKMARKS`. Renders directly via ANSI escape codes — no framework. Supports single-select and multi-select questions, bookmarking, hints, and a 70% pass threshold aligned with Azure exams.

### Quiz JSON Schema

Each quiz file is a JSON array of question objects:
```json
{
  "question_id": 1,
  "question_text": "...",
  "question_type": "multiple_select",
  "options": {
    "a": { "text": "...", "is_true": false, "explanation": "..." },
    "b": { "text": "...", "is_true": true, "explanation": "..." }
  },
  "correct_answer": "b"
}
```
- `question_type` is optional; omit for single-select, set to `"multiple_select"` for multi-answer
- `correct_answer` is a string for single-select, array of strings for multi-select
- Every option must have `text`, `is_true`, and `explanation` fields
- `question_id` must be unique within a file

Full schema documented in `quiz/README.md`.
