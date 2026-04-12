---
name: scrape-practice-assessment-interactive
description: Claude-driven practice assessment scraper. Claude reads each question screenshot and picks the correct answer. The browser script handles all clicking. Use this for accurate answer capture on Microsoft Learn practice assessments.
argument-hint: [cert-code-or-url] [output="..."]
user-invocable: true
allowed-tools: Read, Write, Bash, AskUserQuestion
---

# Scrape Practice Assessment (Claude-Driven)

You are driving a Microsoft Learn practice assessment for: **$ARGUMENTS**

The browser script handles navigation and clicking. You read each question (from a JSON state file + screenshot), determine the correct answer, and write it to a file. The script clicks your answer, captures the result, and moves to the next question.

## Step 0: Collect inputs

Parse from `$ARGUMENTS`. Ask with `AskUserQuestion` if the URL is missing.

Known assessment URLs:
- AI-900: `https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-fundamentals/practice/assessment?assessment-type=practice&assessmentId=26&practice-assessment-type=certification`
- AZ-900: `https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/practice/assessment?assessment-type=practice&assessmentId=23&practice-assessment-type=certification`
- AZ-104: `https://learn.microsoft.com/en-us/credentials/certifications/azure-administrator/practice/assessment?assessment-type=practice&assessmentId=21&practice-assessment-type=certification`

Default output path: `<cert>/extras/practice-assessment-questions.txt`

State files are written to: `~/.playwright-scrape-state/`

## Step 1: Prerequisites and cleanup

```bash
node --version   # must be >= 16
node -e "require('playwright')" 2>&1 || npm install playwright
pkill -f "Google Chrome for Testing" 2>/dev/null || true
rm -f ~/.playwright-ms-learn/SingletonLock ~/.playwright-ms-learn/lockfile
rm -f ~/.playwright-scrape-state/answer.txt ~/.playwright-scrape-state/done.txt
mkdir -p <output-dir>
sleep 1
```

## Step 2: Launch the browser script in the background

```bash
OUTPUT_FILE="<output>" node .claude/skills/scrape-practice-assessment/scrape-interactive.js "<url>" &
```

The browser opens automatically. If a login prompt appears, the user logs in once and the script continues.

## Step 3: Answer loop

Repeat this loop until `~/.playwright-scrape-state/done.txt` exists:

### 3a. Wait for a new question

Poll until `~/.playwright-scrape-state/question.json` exists:
```bash
# Check once — if not there yet, wait and retry
ls ~/.playwright-scrape-state/question.json 2>/dev/null
```
Wait up to 30 seconds between polls. If it doesn't appear after 2 minutes, check if `done.txt` exists.

### 3b. Read the question

Read `~/.playwright-scrape-state/question.json` — it contains:
```json
{
  "questionNumber": 1,
  "questionText": "Full question text",
  "isMultiSelect": false,
  "options": [
    { "letter": "a", "text": "Option A text" },
    { "letter": "b", "text": "Option B text" },
    ...
  ],
  "instruction": "Write a single letter, e.g.: b"
}
```

Also read the screenshot at `~/.playwright-scrape-state/screenshot.png` for visual context.

### 3c. Determine the correct answer

Use your knowledge of the certification domain to select the correct answer(s).

- For **single-select**: write one letter (e.g. `b`)
- For **multi-select**: write comma-separated letters (e.g. `a,c`)

Be accurate — you are answering these questions for real. Apply your knowledge of Azure, AI services, M365, or whatever domain the certification covers.

### 3d. Write the answer

```bash
echo -n "<answer>" > ~/.playwright-scrape-state/answer.txt
```

Example: `echo -n "b" > ~/.playwright-scrape-state/answer.txt`
Example: `echo -n "a,c" > ~/.playwright-scrape-state/answer.txt`

The script detects this file, clicks the answer, captures the result, and deletes the file. Then it writes the next `question.json`.

### 3e. Loop

Go back to 3a. The `question.json` file is deleted by you after reading (or overwritten by the script for the next question). Check for `done.txt` to know when all questions are captured.

## Step 4: Report results

Once `done.txt` exists, read the output file and report:
- Total questions captured
- First 3 questions + correct answers to confirm accuracy
- Full path to output file

## Important notes

- **Do not write `answer.txt` until you have read `question.json`** — the script polls for it
- **Delete `question.json` after reading** to avoid re-processing — or just let the script overwrite it on the next question
- The script deduplicates by question text, so re-running is safe
- If the browser closes unexpectedly, all captured questions up to that point are saved
