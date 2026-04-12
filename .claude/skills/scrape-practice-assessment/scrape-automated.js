#!/usr/bin/env node
'use strict';

/**
 * Fully automated Microsoft Learn Practice Assessment Scraper
 *
 * Clicks through all questions automatically:
 * 1. Navigates to the assessment page
 * 2. Clicks "Start" (waits for user to log in first if needed)
 * 3. For each question: selects first option, clicks "Check answer",
 *    captures question + correct answer + explanation, clicks "Next"
 * 4. Saves all questions to a file
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const DEFAULT_URL = 'https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-fundamentals/practice/assessment?assessment-type=practice&assessmentId=26&practice-assessment-type=certification';

const url = process.argv[2] || DEFAULT_URL;
const userDataDir = path.join(require('os').homedir(), '.playwright-ms-learn');
const outputFile = process.env.OUTPUT_FILE
  || process.argv[3]
  || path.join(process.cwd(), 'practice-assessment-questions.txt');

const questions = [];

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function saveQuestions() {
  if (questions.length === 0) {
    console.log('No questions captured.');
    return;
  }
  const lines = [];
  lines.push('='.repeat(80));
  lines.push('MICROSOFT LEARN PRACTICE ASSESSMENT — CAPTURED QUESTIONS');
  lines.push(`Source: ${url}`);
  lines.push(`Captured: ${new Date().toISOString()}`);
  lines.push(`Total questions: ${questions.length}`);
  lines.push('='.repeat(80));
  lines.push('');

  const letters = 'abcdefghij';
  questions.forEach((q, i) => {
    lines.push('─'.repeat(80));
    lines.push(`Q${i + 1}: ${q.text}`);
    lines.push('');
    q.options.forEach((opt, idx) => {
      let marker = '  ';
      if (opt.isCorrect) marker = '✓ ';
      else if (opt.isIncorrect) marker = '✗ ';
      lines.push(`  ${marker}${letters[idx] || idx + 1}) ${opt.text}`);
    });
    if (q.correctAnswer) {
      lines.push('');
      lines.push(`  Correct answer: ${q.correctAnswer}`);
    }
    if (q.explanation) {
      lines.push('');
      lines.push(`  Explanation:`);
      const words = q.explanation.split(/\s+/);
      let line = '    ';
      for (const word of words) {
        if (line.length + word.length + 1 > 78) { lines.push(line); line = '    ' + word; }
        else { line += (line.trim() ? ' ' : '') + word; }
      }
      if (line.trim()) lines.push(line);
    }
    lines.push('');
  });

  fs.writeFileSync(outputFile, lines.join('\n'), 'utf8');
  console.log(`Saved ${questions.length} questions to: ${outputFile}`);
}

async function extractCurrentQuestion(page) {
  return page.evaluate(() => {
    const skipPatterns = /^(select only one|select all that apply|choose the|check your|sign in|trying to sign|face, fingerprint|enter your|pick an account|skip to main|practice assessment|question \d)/i;

    const quizChoices = document.querySelectorAll('label.quiz-choice');
    if (!quizChoices || quizChoices.length < 2) return null;

    // Question text
    let questionText = '';
    const mainEl = document.querySelector('main') || document.body;
    const allText = mainEl.innerText;
    const firstChoiceText = quizChoices[0].innerText.trim();
    const idx = allText.indexOf(firstChoiceText);
    if (idx > 0) {
      const paragraphs = allText.substring(0, idx).trim()
        .split(/\n/)
        .map(p => p.trim())
        .filter(p =>
          p.length > 10 &&
          !skipPatterns.test(p) &&
          !p.match(/^(practice assessment|question \d+ of|previous|next|check)/i) &&
          !p.match(/^\d+\/\d+$/) &&
          !p.match(/^Q\d+/)
        );
      if (paragraphs.length > 0) questionText = paragraphs.join('\n');
    }
    if (!questionText || questionText.length < 10) return null;

    // Options with correct/incorrect markers
    const options = [];
    quizChoices.forEach(el => {
      const text = el.innerText.trim();
      if (!text) return;
      const cls = el.className + ' ' + (el.parentElement ? el.parentElement.className : '');
      const isCorrect = cls.match(/\bcorrect\b/i) !== null && !cls.match(/\bincorrect\b/i);
      const isIncorrect = cls.match(/\bincorrect\b/i) !== null;
      options.push({ text, isCorrect, isIncorrect });
    });

    // Correct answer text
    let correctAnswer = '';
    quizChoices.forEach(el => {
      if (el.className.match(/\bcorrect\b/i) && !el.className.match(/\bincorrect\b/i)) {
        correctAnswer = el.innerText.trim();
      }
    });

    // Explanation
    let explanation = '';
    const explanationSelectors = [
      '[class*="explanation"]', '[class*="Explanation"]',
      '[class*="feedback"]', '[class*="Feedback"]',
      '[class*="rationale"]', '.alert', '.quiz-answer-feedback',
    ];
    for (const sel of explanationSelectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText.trim().length > 10) { explanation = el.innerText.trim(); break; }
    }
    if (!explanation) {
      const els = document.querySelectorAll('[class*="correct"], [class*="incorrect"], [class*="result"], [class*="feedback"]');
      for (const el of els) {
        const t = el.innerText.trim();
        if (t.length > 20 && !el.closest('label.quiz-choice')) { explanation = t; break; }
      }
    }

    return { text: questionText, options, correctAnswer, explanation };
  });
}

async function waitForChoices(page, timeout = 15000) {
  try {
    await page.waitForSelector('label.quiz-choice', { timeout });
    return true;
  } catch {
    return false;
  }
}

async function clickCheckAnswer(page) {
  // Try various selectors for the "Check answer" button
  const selectors = [
    'button:has-text("Check Your Answer")',
    'button:has-text("Check answer")',
    'button:has-text("Check your answer")',
    'button:has-text("Submit")',
    '[data-bi-name*="check"]',
  ];
  for (const sel of selectors) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 2000 })) {
        await btn.click();
        return true;
      }
    } catch { /* try next */ }
  }
  return false;
}

async function clickNext(page) {
  const selectors = [
    'button:has-text("Next")',
    'button:has-text("next")',
    '[data-bi-name*="next"]',
    'button.next',
  ];
  for (const sel of selectors) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 2000 })) {
        await btn.click();
        return true;
      }
    } catch { /* try next */ }
  }
  return false;
}

async function isAssessmentDone(page) {
  // Check for results/score screen
  try {
    const text = await page.evaluate(() => document.body.innerText);
    return text.match(/your score|you (passed|failed)|results|(\d+) of \d+ correct|review answers/i) !== null;
  } catch {
    return false;
  }
}

async function main() {
  console.log('Starting automated scraper...');
  console.log(`Output: ${outputFile}`);
  console.log('');

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    viewport: { width: 1280, height: 900 },
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const page = context.pages()[0] || await context.newPage();

  // Handle unexpected browser close
  context.on('close', () => {
    saveQuestions();
    process.exit(0);
  });
  process.on('SIGINT', async () => {
    saveQuestions();
    await context.close().catch(() => {});
    process.exit(0);
  });

  console.log(`Navigating to: ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Wait for the user to log in if needed (up to 2 minutes)
  console.log('Waiting for assessment page to load (log in if prompted)...');
  await sleep(3000);

  // Check if login is needed — wait up to 90s for user to log in
  const loginDeadline = Date.now() + 90000;
  while (Date.now() < loginDeadline) {
    const currentUrl = page.url();
    if (!currentUrl.includes('login') && !currentUrl.includes('live.com') && !currentUrl.includes('microsoftonline.com')) break;
    console.log('  Waiting for login...');
    await sleep(3000);
  }

  // Click "Start" button if present
  await sleep(2000);
  try {
    const startBtn = page.locator('button:has-text("Start"), a:has-text("Start assessment"), button:has-text("Begin")').first();
    if (await startBtn.isVisible({ timeout: 5000 })) {
      console.log('Clicking Start...');
      await startBtn.click();
      await sleep(2000);
    }
  } catch {
    console.log('No Start button found — assuming assessment already started.');
  }

  // Main loop: answer questions
  let questionNumber = 0;
  let consecutiveFailures = 0;

  while (consecutiveFailures < 10) {
    // Check if we're on the results screen
    if (await isAssessmentDone(page)) {
      console.log('\nAssessment complete!');
      break;
    }

    // Wait for quiz choices to appear
    const hasChoices = await waitForChoices(page, 10000);
    if (!hasChoices) {
      consecutiveFailures++;
      console.log(`  No choices found (attempt ${consecutiveFailures}/5), waiting...`);
      await sleep(2000);
      continue;
    }
    consecutiveFailures = 0;

    // Capture question before checking (to get the text)
    const before = await extractCurrentQuestion(page);
    if (!before) {
      await sleep(1000);
      continue;
    }

    questionNumber++;
    console.log(`Q${questionNumber}: ${before.text.substring(0, 70)}...`);

    // Select the first available option
    try {
      const firstChoice = page.locator('label.quiz-choice').first();
      await firstChoice.click({ timeout: 5000 });
      await sleep(500);
    } catch (e) {
      console.log('  Could not click answer option:', e.message);
    }

    // Click "Check answer"
    const checked = await clickCheckAnswer(page);
    if (!checked) {
      console.log('  Could not find Check answer button');
    }

    // Wait for explanation / correct-answer styling to appear
    await sleep(3000);

    // Capture full question with correct answer and explanation
    const after = await extractCurrentQuestion(page);
    const q = after || before;

    // Deduplicate by question text
    const exists = questions.some(existing =>
      existing.text.substring(0, 80) === q.text.substring(0, 80)
    );
    if (!exists) {
      questions.push(q);
      const correctText = q.correctAnswer ? ` → ${q.correctAnswer.substring(0, 40)}` : '';
      console.log(`  Captured.${correctText}`);
      saveQuestions();
    } else {
      console.log('  Duplicate, skipping.');
      questionNumber--;
    }

    // Click Next
    const moved = await clickNext(page);
    if (!moved) {
      // Maybe it's the last question — check for results
      await sleep(2000);
      if (await isAssessmentDone(page)) {
        console.log('\nAssessment complete!');
        break;
      }
      console.log('  Could not find Next button');
      consecutiveFailures++;
    }

    await sleep(1500);
  }

  console.log(`\nDone. ${questions.length} questions captured.`);
  saveQuestions();
  await context.close().catch(() => {});
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  saveQuestions();
  process.exit(1);
});
