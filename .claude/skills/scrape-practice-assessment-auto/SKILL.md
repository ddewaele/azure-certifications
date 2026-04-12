---
name: scrape-practice-assessment-auto
description: Fully automated scraper that clicks through a Microsoft Learn practice assessment without any user interaction, capturing all questions, correct answers, and explanations
argument-hint: [url="..."] [output="..."]
user-invocable: true
allowed-tools: Read, Write, Glob, Bash, AskUserQuestion
---

# Scrape Practice Assessment (Automated)

You are fully automating a Microsoft Learn practice assessment scrape for: **$ARGUMENTS**

The automated scraper opens a browser, clicks through every question on its own (selecting the first option, clicking "Check Your Answer", waiting for the explanation, clicking "Next"), and saves all questions with correct answers to a file.

## Step 0: Collect required inputs

Parse from `$ARGUMENTS`. For any missing fields, use `AskUserQuestion` to ask — collect all in a **single question**.

| Field | Description | Default |
|-------|-------------|---------|
| **url** | Full Microsoft Learn practice assessment URL | *(required)* |
| **output** | File path to write captured questions to | `<cert>/extras/practice-assessment-questions.txt` derived from URL cert code, or repo root |

Known assessment URLs:
- AI-900: `https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-fundamentals/practice/assessment?assessment-type=practice&assessmentId=26&practice-assessment-type=certification`
- AZ-900: `https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/practice/assessment?assessment-type=practice&assessmentId=23&practice-assessment-type=certification`
- AZ-104: `https://learn.microsoft.com/en-us/credentials/certifications/azure-administrator/practice/assessment?assessment-type=practice&assessmentId=21&practice-assessment-type=certification`

Confirm inputs before proceeding:
> **Ready to scrape (automated)**
> - URL: `<url>`
> - Output: `<output>`

## Step 1: Check prerequisites

1. Run `node --version` — must be >= 16.
2. Run `node -e "require('playwright')"` — if it fails, run `npm install playwright`.
3. Confirm `.claude/skills/scrape-practice-assessment/scrape-automated.js` exists.
4. Ensure the output directory exists (`mkdir -p <output-dir>`).

## Step 2: Clean up stale browser processes

```bash
pkill -f "Google Chrome for Testing" 2>/dev/null || true
rm -f ~/.playwright-ms-learn/SingletonLock ~/.playwright-ms-learn/lockfile
sleep 1
```

## Step 3: Launch the automated scraper in the background

```bash
OUTPUT_FILE="<output>" node .claude/skills/scrape-practice-assessment/scrape-automated.js "<url>" &
```

## Step 4: Tell the user what to expect

Inform the user:

> The browser is now open and will click through all questions automatically.
> **You only need to act if a login prompt appears** — sign in once with your Microsoft account, then the scraper takes over.
> Questions are saved incrementally to `<output>`. Do not close the browser until it finishes.

Then wait for the background task to complete.

## Step 5: Report results

After the task completes, read the output file and report:
- Total questions captured (from the "Total questions:" header line)
- First 3 question texts to confirm correctness
- Full path to the output file

If fewer than ~50 questions were captured, check the scraper log for errors and advise re-running — the scraper deduplicates by question text so re-running is safe and will pick up missed questions.

## Troubleshooting

**Stopped early / consecutive failures**
→ The "Next" or "Check Your Answer" button selector may have changed. Check the dom-dump.json in the repo root for the actual button text/class, then update `scrape-automated.js` accordingly.

**"database is locked" / timeout**
→ Run the Step 2 cleanup and re-launch.

**"Cannot find module 'playwright'"**
→ Run `npm install playwright` in the repo root.
