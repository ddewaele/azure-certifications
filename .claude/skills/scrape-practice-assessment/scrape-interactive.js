#!/usr/bin/env node
'use strict';

/**
 * Interactive Practice Assessment Scraper
 *
 * File-based IPC: this script drives the browser and waits for Claude to
 * provide answers. For each question it writes:
 *   STATE_DIR/question.json   — question text + options
 *   STATE_DIR/screenshot.png  — screenshot of the current question
 *
 * Then it polls for:
 *   STATE_DIR/answer.txt      — single letter (a/b/c/d/e) written by Claude
 *
 * Once the answer file appears, the script clicks that option, clicks
 * "Check Your Answer", captures the result, clicks "Next", and repeats.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const DEFAULT_URL = 'https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-fundamentals/practice/assessment?assessment-type=practice&assessmentId=26&practice-assessment-type=certification';

const url = process.argv[2] || DEFAULT_URL;
const userDataDir = path.join(require('os').homedir(), '.playwright-ms-learn');
const stateDir = process.env.STATE_DIR || path.join(require('os').homedir(), '.playwright-scrape-state');
const outputFile = process.env.OUTPUT_FILE || path.join(process.cwd(), 'practice-assessment-questions.txt');

const questionFile = path.join(stateDir, 'question.json');
const screenshotFile = path.join(stateDir, 'screenshot.png');
const answerFile = path.join(stateDir, 'answer.txt');
const doneFile = path.join(stateDir, 'done.txt');

fs.mkdirSync(stateDir, { recursive: true });

// Clean up any stale state from a previous run
for (const f of [questionFile, screenshotFile, answerFile, doneFile]) {
  try { fs.unlinkSync(f); } catch {}
}

const questions = [];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function saveQuestions() {
  if (questions.length === 0) return;
  const letters = 'abcdefghij';
  const lines = [
    '='.repeat(80),
    'MICROSOFT LEARN PRACTICE ASSESSMENT — CAPTURED QUESTIONS',
    `Source: ${url}`,
    `Captured: ${new Date().toISOString()}`,
    `Total questions: ${questions.length}`,
    '='.repeat(80), '',
  ];
  questions.forEach((q, i) => {
    lines.push('─'.repeat(80));
    lines.push(`Q${i + 1}: ${q.text}`);
    lines.push('');
    q.options.forEach((opt, idx) => {
      const marker = opt.isCorrect ? '✓ ' : opt.isIncorrect ? '✗ ' : '  ';
      lines.push(`  ${marker}${letters[idx] || idx + 1}) ${opt.text}`);
    });
    if (q.correctAnswer) { lines.push(''); lines.push(`  Correct answer: ${q.correctAnswer}`); }
    if (q.explanation) {
      lines.push(''); lines.push('  Explanation:');
      const words = q.explanation.split(/\s+/);
      let line = '    ';
      for (const w of words) {
        if (line.length + w.length + 1 > 78) { lines.push(line); line = '    ' + w; }
        else { line += (line.trim() ? ' ' : '') + w; }
      }
      if (line.trim()) lines.push(line);
    }
    lines.push('');
  });
  fs.writeFileSync(outputFile, lines.join('\n'), 'utf8');
}

async function extractPageState(page) {
  return page.evaluate(() => {
    const skipPatterns = /^(select only one|select all that apply|sign in|trying to sign|skip to main|practice assessment|question \d)/i;
    const quizChoices = document.querySelectorAll('label.quiz-choice');
    if (!quizChoices || quizChoices.length < 2) return null;

    let questionText = '';
    const mainEl = document.querySelector('main') || document.body;
    const allText = mainEl.innerText;
    const firstChoiceText = quizChoices[0].innerText.trim();
    const idx = allText.indexOf(firstChoiceText);
    if (idx > 0) {
      const paragraphs = allText.substring(0, idx).trim().split(/\n/)
        .map(p => p.trim())
        .filter(p => p.length > 10 && !skipPatterns.test(p) &&
          !p.match(/^(practice assessment|question \d+ of|previous|next|check)/i) &&
          !p.match(/^\d+\/\d+$/) && !p.match(/^Q\d+/));
      if (paragraphs.length > 0) questionText = paragraphs.join('\n');
    }
    if (!questionText || questionText.length < 10) return null;

    const options = [];
    quizChoices.forEach(el => {
      const text = el.innerText.trim();
      if (!text) return;
      const cls = el.className + ' ' + (el.parentElement ? el.parentElement.className : '');
      const isCorrect = cls.match(/\bcorrect\b/i) && !cls.match(/\bincorrect\b/i);
      const isIncorrect = cls.match(/\bincorrect\b/i) !== null;
      options.push({ text, isCorrect: !!isCorrect, isIncorrect });
    });

    let correctAnswer = '';
    quizChoices.forEach(el => {
      if (el.className.match(/\bcorrect\b/i) && !el.className.match(/\bincorrect\b/i))
        correctAnswer = el.innerText.trim();
    });

    let explanation = '';
    for (const sel of ['[class*="explanation"]', '[class*="feedback"]', '[class*="rationale"]', '.alert']) {
      const el = document.querySelector(sel);
      if (el && el.innerText.trim().length > 10) { explanation = el.innerText.trim(); break; }
    }

    // Is multi-select?
    const isMulti = document.querySelector('input[type="checkbox"].quiz-choice-input') !== null ||
      questionText.match(/select (all|two|three|four|\d+)/i) !== null;

    return { questionText, options, correctAnswer, explanation, isMulti };
  });
}

async function waitForChoices(page, timeout = 15000) {
  try { await page.waitForSelector('label.quiz-choice', { timeout }); return true; }
  catch { return false; }
}

async function clickOptionByLetter(page, letter) {
  const letters = 'abcdefghij';
  const idx = letters.indexOf(letter.toLowerCase());
  if (idx === -1) throw new Error(`Unknown option letter: ${letter}`);
  const choices = page.locator('label.quiz-choice');
  const count = await choices.count();
  if (idx >= count) throw new Error(`Option ${letter} out of range (only ${count} options)`);
  await choices.nth(idx).click({ timeout: 5000 });
}

async function clickCheckAnswer(page) {
  for (const text of ['Check Your Answer', 'Check answer', 'Submit']) {
    try {
      const btn = page.locator(`button:has-text("${text}")`).first();
      if (await btn.isVisible({ timeout: 2000 })) { await btn.click(); return true; }
    } catch {}
  }
  return false;
}

async function clickNext(page) {
  try {
    const btn = page.locator('button:has-text("Next")').first();
    if (await btn.isVisible({ timeout: 3000 })) { await btn.click(); return true; }
  } catch {}
  return false;
}

async function isAssessmentDone(page) {
  try {
    const text = await page.evaluate(() => document.body.innerText);
    return /your score|you (passed|failed)|results|review answers/i.test(text);
  } catch { return false; }
}

async function pollForAnswer(timeoutMs = 300000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (fs.existsSync(answerFile)) {
      const answer = fs.readFileSync(answerFile, 'utf8').trim().toLowerCase();
      fs.unlinkSync(answerFile);
      return answer;
    }
    await sleep(500);
  }
  throw new Error('Timed out waiting for answer from Claude');
}

async function main() {
  console.log('=== Interactive Practice Assessment Scraper ===');
  console.log(`State dir : ${stateDir}`);
  console.log(`Output    : ${outputFile}`);
  console.log(`URL       : ${url}`);
  console.log('');
  console.log('Waiting for Claude to read each question and write answers...');
  console.log('');

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    viewport: { width: 1280, height: 900 },
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const page = context.pages()[0] || await context.newPage();

  context.on('close', () => { saveQuestions(); process.exit(0); });
  process.on('SIGINT', async () => { saveQuestions(); await context.close().catch(() => {}); process.exit(0); });

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Wait for login if needed (up to 2 minutes)
  const loginDeadline = Date.now() + 120000;
  while (Date.now() < loginDeadline) {
    const u = page.url();
    if (!u.includes('login') && !u.includes('live.com') && !u.includes('microsoftonline.com')) break;
    console.log('  Waiting for login...');
    await sleep(3000);
  }
  await sleep(2000);

  // Click Start if present
  try {
    const startBtn = page.locator('button:has-text("Start"), button:has-text("Begin")').first();
    if (await startBtn.isVisible({ timeout: 5000 })) {
      console.log('Clicking Start...');
      await startBtn.click();
      await sleep(2000);
    }
  } catch {}

  let questionNumber = 0;
  let noChoicesStreak = 0;

  while (true) {
    if (await isAssessmentDone(page)) {
      console.log('\nAssessment complete!');
      break;
    }

    const hasChoices = await waitForChoices(page, 10000);
    if (!hasChoices) {
      noChoicesStreak++;
      if (noChoicesStreak >= 8) { console.log('No more questions found. Done.'); break; }
      console.log(`  Waiting for question to load... (${noChoicesStreak})`);
      await sleep(2000);
      continue;
    }
    noChoicesStreak = 0;

    const state = await extractPageState(page);
    if (!state) { await sleep(1000); continue; }

    // Check for duplicate (already captured this question)
    const isDuplicate = questions.some(q => q.text.substring(0, 80) === state.questionText.substring(0, 80));
    if (isDuplicate) {
      console.log('  (duplicate, skipping)');
      await clickNext(page);
      await sleep(1500);
      continue;
    }

    questionNumber++;
    console.log(`\nQ${questionNumber}: ${state.questionText.substring(0, 80)}`);

    // Write state for Claude
    const letters = 'abcdefghij';
    const stateData = {
      questionNumber,
      questionText: state.questionText,
      isMultiSelect: state.isMulti,
      options: state.options.map((o, i) => ({ letter: letters[i], text: o.text })),
      instruction: state.isMulti
        ? 'Write multiple letters separated by commas, e.g.: a,c'
        : 'Write a single letter, e.g.: b',
    };
    fs.writeFileSync(questionFile, JSON.stringify(stateData, null, 2), 'utf8');
    await page.screenshot({ path: screenshotFile, fullPage: false });
    console.log(`  → State written. Waiting for answer in: ${answerFile}`);

    // Wait for Claude to write the answer
    const answerRaw = await pollForAnswer(300000);
    const answerLetters = answerRaw.split(',').map(s => s.trim()).filter(Boolean);
    console.log(`  ← Answer received: ${answerLetters.join(', ')}`);

    // Click each selected option
    for (const letter of answerLetters) {
      try { await clickOptionByLetter(page, letter); await sleep(300); }
      catch (e) { console.log(`  Warning: could not click ${letter}: ${e.message}`); }
    }

    await sleep(500);
    await clickCheckAnswer(page);
    await sleep(3000);

    // Capture final state with correct answer revealed
    const after = await extractPageState(page);
    const captured = after || state;
    questions.push({
      text: captured.questionText,
      options: captured.options,
      correctAnswer: captured.correctAnswer,
      explanation: captured.explanation,
    });

    const correct = captured.correctAnswer ? ` ✓ ${captured.correctAnswer.substring(0, 50)}` : '';
    console.log(`  Captured.${correct}`);
    saveQuestions();

    await clickNext(page);
    await sleep(1500);
  }

  console.log(`\nDone. ${questions.length} questions captured → ${outputFile}`);

  // Signal done
  fs.writeFileSync(doneFile, `${questions.length} questions captured\n`, 'utf8');
  saveQuestions();
  await context.close().catch(() => {});
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  saveQuestions();
  process.exit(1);
});
