---
name: scrape-practice-assessment
description: Launch a browser to a Microsoft Learn practice assessment and capture all questions and answer choices to a text file using the Playwright scraper script
argument-hint: <microsoft-learn-practice-assessment-url> [output-filename]
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Scrape Microsoft Learn Practice Assessment

You are capturing practice assessment questions from Microsoft Learn using Playwright.

Arguments: **$ARGUMENTS**

## Overview

The scraper (`scripts/scrape-practice-assessment.js`) opens a real browser window. The user manually answers each question and clicks "Check answer" — the script watches the DOM and captures questions automatically in the background.

## Step 0: Parse arguments

Parse `$ARGUMENTS`:
- **URL** — a Microsoft Learn practice assessment URL (required). If not provided, ask the user for it. The URL typically looks like:
  `https://learn.microsoft.com/en-us/credentials/certifications/<cert>/practice/assessment?assessment-type=practice&assessmentId=<id>&practice-assessment-type=certification`
- **Output filename** — optional. Defaults to `practice-assessment-questions.txt` in the repo root. If provided, use it as the output path.

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

## Step 3: Update the script for the target URL (if needed)

Open `scripts/scrape-practice-assessment.js` and check the `DEFAULT_URL` constant (line ~28). If the user provided a URL that differs from the current default:
- Update `DEFAULT_URL` to the user's URL, OR
- Pass the URL as a command-line argument (the script accepts `process.argv[2]`)

If the user specified a custom output filename, note that the script currently writes to `practice-assessment-questions.txt` in `process.cwd()`. You may need to update the `outputFile` path in the script, or advise the user to rename the file after capture.

## Step 4: Launch the scraper

Run the script in the background so the user can interact with the browser:

```bash
node scripts/scrape-practice-assessment.js "<URL>" &
```

Or if using the default URL:

```bash
node scripts/scrape-practice-assessment.js &
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
- Path to the output file
- Number of questions captured
- A brief summary of the first few questions to confirm the capture was successful

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
