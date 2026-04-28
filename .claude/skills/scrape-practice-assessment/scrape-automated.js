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

    const debug = { reason: '', choiceCount: 0, preTextLen: 0, preTextSample: '' };

    const quizChoices = document.querySelectorAll('label.quiz-choice');
    debug.choiceCount = quizChoices.length;
    if (!quizChoices || quizChoices.length < 2) {
      debug.reason = 'fewer than 2 quiz-choice elements';
      return { __debug: debug };
    }

    const mainEl = document.querySelector('main') || document.body;
    const firstChoice = quizChoices[0];

    // Collect all text-bearing elements that precede the first choice in document order.
    // Avoids the earlier bug where allText.indexOf(firstChoiceText) matched inside
    // the question body for short choice text like "1" (matching inside "VNet1").
    const textSelectors = 'p, li, h1, h2, h3, h4, h5, h6, span, div';
    const candidates = mainEl.querySelectorAll(textSelectors);
    const preceding = [];
    const seen = new Set();
    for (const el of candidates) {
      if (el.contains(firstChoice) || firstChoice.contains(el)) continue;
      const pos = firstChoice.compareDocumentPosition(el);
      if (!(pos & Node.DOCUMENT_POSITION_PRECEDING)) continue;
      // Skip if this element contains another text element we'll also capture
      // (prefer the leaf with the text, not the wrapper)
      const hasTextChild = el.querySelector(textSelectors);
      if (hasTextChild) continue;
      const t = el.innerText.trim();
      if (!t || t.length < 3) continue;
      if (seen.has(t)) continue;
      seen.add(t);
      preceding.push(t);
    }

    const filtered = preceding.filter(p =>
      p.length > 3 &&
      !skipPatterns.test(p) &&
      !p.match(/^(practice assessment|question \d+ of|previous|next|check)/i) &&
      !p.match(/^\d+\/\d+$/) &&
      !p.match(/^Q\d+/) &&
      !p.match(/^\d+$/)
    );

    debug.preTextLen = filtered.join('\n').length;
    debug.preTextSample = filtered.slice(0, 3).join(' | ').substring(0, 200);

    const questionText = filtered.join('\n');
    if (!questionText || questionText.length < 10) {
      debug.reason = `question text too short (${questionText.length} chars after filtering ${preceding.length} candidates)`;
      return { __debug: debug };
    }

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

    // Explanation — try class-based selectors first, then positional fallback
    let explanation = '';
    const explanationSelectors = [
      '[class*="explanation"]', '[class*="Explanation"]',
      '[class*="feedback"]', '[class*="Feedback"]',
      '[class*="rationale"]', '.alert', '.quiz-answer-feedback',
      '[role="alert"]',
    ];
    for (const sel of explanationSelectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText.trim().length > 10) { explanation = el.innerText.trim(); break; }
    }

    // Positional fallback: any substantial text element that appears AFTER the
    // last quiz-choice is almost always the explanation shown by Microsoft Learn
    // after clicking "Check Your Answer" (shown for both correct and incorrect).
    if (!explanation) {
      const lastChoice = quizChoices[quizChoices.length - 1];
      const candidates2 = mainEl.querySelectorAll('p, div, li, span');
      const parts = [];
      const seen2 = new Set();
      for (const el of candidates2) {
        if (el.contains(lastChoice) || lastChoice.contains(el)) continue;
        if (el.closest('label.quiz-choice')) continue;
        const pos = lastChoice.compareDocumentPosition(el);
        if (!(pos & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
        const hasTextChild = el.querySelector('p, div, li, span');
        if (hasTextChild) continue;
        const t = el.innerText.trim();
        if (t.length < 20) continue;
        if (/^(check|next|previous|submit|finish|question \d+ of|view results)/i.test(t)) continue;
        if (seen2.has(t)) continue;
        seen2.add(t);
        parts.push(t);
      }
      if (parts.length) explanation = parts.join('\n\n');
    }

    debug.explanationLen = explanation.length;
    debug.reason = 'ok';

    return { text: questionText, options, correctAnswer, explanation, __debug: debug };
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
  let consecutiveExtractFails = 0;
  const MAX_EXTRACT_FAILS = 5;

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
      console.log(`  No choices found (attempt ${consecutiveFailures}/10), URL=${page.url()}`);
      await sleep(2000);
      continue;
    }
    consecutiveFailures = 0;

    // Capture question before checking (to get the text)
    const before = await extractCurrentQuestion(page);
    if (!before || !before.text) {
      consecutiveExtractFails++;
      const dbg = before && before.__debug ? before.__debug : { reason: 'null return' };
      console.log(`  [extract-fail ${consecutiveExtractFails}/${MAX_EXTRACT_FAILS}] ${dbg.reason} | choices=${dbg.choiceCount || 0} | preText="${dbg.preTextSample || ''}"`);
      if (consecutiveExtractFails >= MAX_EXTRACT_FAILS) {
        console.log('  Too many extraction failures — trying to advance past this question');
        // Try to click first choice blindly and move on
        try { await page.locator('label.quiz-choice').first().click({ timeout: 3000 }); } catch {}
        await sleep(500);
        await clickCheckAnswer(page);
        await sleep(2000);
        await clickNext(page);
        await sleep(2000);
        consecutiveExtractFails = 0;
      } else {
        await sleep(1500);
      }
      continue;
    }
    consecutiveExtractFails = 0;

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

    // Strip debug field before saving/deduping
    const cleanQ = { text: q.text, options: q.options, correctAnswer: q.correctAnswer, explanation: q.explanation };

    // Deduplicate by question text
    const exists = questions.some(existing =>
      existing.text.substring(0, 80) === cleanQ.text.substring(0, 80)
    );
    if (!exists) {
      questions.push(cleanQ);
      const correctText = cleanQ.correctAnswer ? ` → ${cleanQ.correctAnswer.substring(0, 40)}` : '';
      const explLen = cleanQ.explanation ? cleanQ.explanation.length : 0;
      const explNote = explLen > 0 ? ` [expl: ${explLen} chars]` : ' [NO explanation]';
      console.log(`  Captured.${correctText}${explNote}`);
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
