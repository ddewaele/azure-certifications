---
name: scrape-practice-assessment
description: Launch a browser to a Microsoft Learn practice assessment and capture all questions and answer choices to a text file using the Playwright scraper script
argument-hint: [url="..."] [description="..."] [output="..."]
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Scrape Microsoft Learn Practice Assessment

You are capturing practice assessment questions from Microsoft Learn using Playwright.

Arguments provided: **$ARGUMENTS**

## Overview

The scraper (`scripts/scrape-practice-assessment.js`) opens a real browser window. The user manually answers each question and clicks "Check answer" — the script watches the DOM and captures questions automatically in the background.

## Step 0: Collect required inputs

You need three pieces of information before proceeding. Parse them from `$ARGUMENTS` first (accept any reasonable format — quoted key=value pairs, plain URL, plain description, plain filename). For any that are missing or unclear, use the `AskUserQuestion` tool to ask — collect all missing fields in a **single question** rather than asking one at a time.

| Field | Description | Default |
|-------|-------------|---------|
| **url** | Full Microsoft Learn practice assessment URL | *(required — no default)* |
| **description** | Short human-readable label, e.g. `"AI-900 practice assessment"` | Derived from the URL cert code if possible |
| **output** | File path to write captured questions to | `practice-assessment-questions.txt` in repo root |

Example of a well-formed invocation:
```
/scrape-practice-assessment url="https://learn.microsoft.com/..." description="AI-900 practice" output="ai-900/practice-assessment-questions.txt"
```

Once you have all three values, confirm them back to the user in a single short message before proceeding:
> **Ready to scrape**
> - URL: `<url>`
> - Description: `<description>`
> - Output: `<output>`

## Step 1: Check prerequisites

1. **Verify Node.js** — run `node --version`. Must be >= 16.
2. **Verify Playwright is installed** — run `node -e "require('playwright')"`. If it fails, run `npm install playwright` in the repo root.
3. **Verify the scraper script exists** — check `scripts/scrape-practice-assessment.js` exists. If it doesn't, stop and tell the user.

## Step 2: Clean up stale browser processes

Stale browser sessions from previous runs will cause a "profile already in use" or timeout error. Always clean up before launching:

```bash
# Kill any leftover Chrome for Testing processes
pkill -f "Google Chrome for Testing" 2>/dev/null || true

# Remove stale lock files
rm -f ~/.playwright-ms-learn/SingletonLock
rm -f ~/.playwright-ms-learn/lockfile
```

Wait 1–2 seconds after killing processes before continuing.

## Step 3: Configure the script

The script accepts the URL as `process.argv[2]` and writes output to a hardcoded path. Before launching:

1. Pass the **url** as a command-line argument — no script edits needed for the URL.
2. For the **output** path: the script's `outputFile` constant defaults to `practice-assessment-questions.txt` in `process.cwd()`. If the user specified a different output path, temporarily edit line ~32 in `scripts/scrape-practice-assessment.js` to set `outputFile` to the absolute resolved path. Restore it after capture, or leave it if it's a sensible permanent default.

## Step 4: Launch the scraper

Run the script in the background so the user can interact with the browser:

```bash
node scripts/scrape-practice-assessment.js "<url>" &
```

The browser window will open automatically.

## Step 5: Instruct the user

Tell the user **exactly** what to do in the browser:

---

**The browser is now open. Follow these steps:**

1. **Log in** if prompted (Microsoft account). This only happens the first time — your session is saved in `~/.playwright-ms-learn`.
2. **Click "Start"** to begin the practice assessment.
3. **For each question:**
   - Select any answer option
   - Click **"Check answer"** — this reveals the explanation and marks the correct answer
   - The script captures the question automatically at this point
   - Click **"Next"** to move to the next question
4. **Repeat** until all questions are done.
5. **Close the browser** when finished (or press Ctrl+C in the terminal).

Questions are saved incrementally — if the browser crashes, you won't lose already-captured questions.

---

## Step 6: Confirm output

After the browser is closed, confirm the output file exists and report:
- Description: `<description>`
- Output file: `<output>` (show absolute path)
- Number of questions captured (read from the "Total questions:" line in the file header)
- First 3 question texts to confirm the capture looks correct

If fewer questions were captured than expected (the assessment typically has 50 questions), advise the user to re-run and continue from where they left off — the script deduplicates by question content so re-capturing already-seen questions is safe.

## Troubleshooting

**"Timeout 180000ms exceeded" / "database is locked"**
→ Another browser is still using the profile. Run the cleanup commands in Step 2 and try again.

**"Cannot find module 'playwright'"**
→ Run `npm install playwright` in the repo root.

**Questions not being captured / only first question captured**
→ Make sure you click "Check answer" before "Next". The script captures the question after the correct answer styling appears in the DOM.

**Login required every time**
→ The persistent profile is stored in `~/.playwright-ms-learn`. If this directory was deleted or is corrupt, you'll need to log in again once.

**Script file not found**
→ The script lives at `scripts/scrape-practice-assessment.js` relative to the repo root. Run the command from the repo root directory.
