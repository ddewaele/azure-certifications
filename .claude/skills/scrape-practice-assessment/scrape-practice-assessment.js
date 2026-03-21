#!/usr/bin/env node
'use strict';

/**
 * Semi-automated Microsoft Learn Practice Assessment Scraper
 *
 * Usage:
 *   node scripts/scrape-practice-assessment.js [url]
 *
 * Default URL: AI-900 practice assessment
 *
 * How it works:
 *   1. Opens a Chromium browser with a persistent profile (remembers your login)
 *   2. Navigates to the practice assessment page
 *   3. You log in (first time only) and start the assessment manually
 *   4. The script watches for questions and captures them automatically
 *   5. Click "Next" / "Check answer" yourself — the script records everything
 *   6. When done, close the browser or press Ctrl+C — questions are saved to a file
 *
 * The persistent profile is stored in ~/.playwright-ms-learn so you only need
 * to log in once.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const DEFAULT_URL = 'https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-fundamentals/practice/assessment?assessment-type=practice&assessmentId=26&practice-assessment-type=certification';

const url = process.argv[2] || DEFAULT_URL;
const userDataDir = path.join(require('os').homedir(), '.playwright-ms-learn');
const outputFile = path.join(process.cwd(), 'practice-assessment-questions.txt');

const questions = new Map(); // questionText -> { text, options, answer, explanation }
let pollInterval = null;

async function dumpDOM(page) {
  // Dump the page structure to help identify the right selectors
  try {
    const info = await page.evaluate(() => {
      const url = window.location.href;
      const title = document.title;

      // Collect all elements with useful attributes for selector discovery
      const interesting = [];
      const allEls = document.querySelectorAll('*');
      for (const el of allEls) {
        const tag = el.tagName.toLowerCase();
        const cls = el.className && typeof el.className === 'string' ? el.className : '';
        const role = el.getAttribute('role') || '';
        const dataBi = el.getAttribute('data-bi-name') || '';
        const ariaLabel = el.getAttribute('aria-label') || '';
        const text = (el.innerText || '').substring(0, 80).replace(/\n/g, ' ');

        // Only capture elements that look assessment-related
        if (cls.match(/question|answer|option|choice|explanation|feedback|assess|quiz|check|correct|incorrect/i) ||
            dataBi.match(/question|answer|option|choice|explanation|check/i) ||
            role.match(/radio|checkbox|option|listbox/i) ||
            (tag === 'button' && text.match(/check|next|submit|start/i))) {
          interesting.push({
            tag,
            class: cls.substring(0, 120),
            role,
            dataBi,
            ariaLabel: ariaLabel.substring(0, 80),
            text: text.substring(0, 80)
          });
        }
      }
      return { url, title, elementCount: allEls.length, interesting: interesting.slice(0, 50) };
    });
    return info;
  } catch (err) {
    return null;
  }
}

async function extractQuestion(page) {
  try {
    // First check we're actually on the assessment page (not login, not landing)
    const currentUrl = page.url();
    if (!currentUrl.includes('learn.microsoft.com') || currentUrl.includes('login')) {
      return null;
    }

    const data = await page.evaluate(() => {
      // ── Find the quiz container ──
      // The quiz-choice labels are inside the assessment — find the question near them
      const quizChoices = document.querySelectorAll('label.quiz-choice');
      if (!quizChoices || quizChoices.length < 2) return null;

      // ── Question text ──
      // Walk up from the quiz choices to find the question text
      // It's typically a <p>, <h2>, <h3>, or <div> before the choices
      let questionText = '';

      // Instructional text to skip (not the actual question)
      const skipPatterns = /^(select only one|select all that apply|choose the|check your|sign in|trying to sign|face, fingerprint|enter your|pick an account|skip to main|practice assessment|question \d)/i;

      // Strategy 1: Get all text in main content area before the first quiz-choice
      const mainEl = document.querySelector('main') || document.querySelector('[role="main"]') || document.body;
      const allText = mainEl.innerText;
      const firstChoiceText = quizChoices[0].innerText.trim();
      const idx = allText.indexOf(firstChoiceText);
      if (idx > 0) {
        const beforeChoices = allText.substring(0, idx).trim();
        // Split into lines/paragraphs, filter out noise
        const paragraphs = beforeChoices.split(/\n/).map(p => p.trim()).filter(p =>
          p.length > 10 &&
          !skipPatterns.test(p) &&
          !p.match(/^(practice assessment|question \d+ of|previous|next|check)/i) &&
          !p.match(/^\d+\/\d+$/) && // skip "1/50" progress indicators
          !p.match(/^Q\d+/) // skip "Q1" labels
        );
        // Take all meaningful paragraphs as the question (some questions are multi-paragraph)
        if (paragraphs.length > 0) {
          questionText = paragraphs.join('\n');
        }
      }

      // Strategy 2: Walk up from choices looking for preceding text elements
      if (!questionText) {
        const choiceParent = quizChoices[0].closest('main, [role="main"], [class*="quiz"], [class*="assess"], [class*="question"]');
        if (choiceParent) {
          const candidates = choiceParent.querySelectorAll('p, h2, h3, h4, div > span');
          for (const el of candidates) {
            const text = el.innerText.trim();
            if (text.length > 15 && !skipPatterns.test(text) &&
                !el.closest('label.quiz-choice') && !el.closest('button') && !el.closest('nav') && !el.closest('header') && !el.closest('footer')) {
              questionText = text;
              break;
            }
          }
        }
      }

      if (!questionText || questionText.length < 10) return null;

      // ── Answer options ──
      let options = [];
      quizChoices.forEach(el => {
        const text = el.innerText.trim();
        if (text && text.length > 0) {
          const allClasses = el.className + ' ' + (el.parentElement ? el.parentElement.className : '');
          const isSelected = allClasses.match(/selected|checked|active/i) !== null ||
            el.querySelector('input:checked') !== null ||
            el.getAttribute('aria-checked') === 'true';
          const isCorrect = allClasses.match(/\bcorrect\b/i) !== null &&
            !allClasses.match(/\bincorrect\b/i);
          const isIncorrect = allClasses.match(/\bincorrect\b/i) !== null;

          options.push({
            text,
            isSelected,
            isCorrect: isCorrect || false,
            isIncorrect: isIncorrect || false
          });
        }
      });

      // ── Explanation / feedback ──
      // After clicking "Check Your Answer", look for explanation text
      const explanationSelectors = [
        '[class*="explanation"]',
        '[class*="Explanation"]',
        '[class*="feedback"]',
        '[class*="Feedback"]',
        '[class*="rationale"]',
        '[class*="answer-detail"]',
        '[class*="answerDetail"]',
        '.alert',
        '.quiz-answer-feedback',
      ];

      let explanation = '';
      for (const sel of explanationSelectors) {
        const el = document.querySelector(sel);
        if (el && el.innerText.trim().length > 10) {
          explanation = el.innerText.trim();
          break;
        }
      }

      // Fallback: look for any text that appeared after checking the answer
      // (often a div that becomes visible with correct/incorrect feedback)
      if (!explanation) {
        const allAlerts = document.querySelectorAll('[class*="correct"], [class*="incorrect"], [class*="result"], [class*="feedback"]');
        for (const el of allAlerts) {
          const text = el.innerText.trim();
          if (text.length > 20 && !el.closest('label.quiz-choice')) {
            explanation = text;
            break;
          }
        }
      }

      // ── Correct answer: check which quiz-choice has correct styling ──
      let correctAnswer = '';
      quizChoices.forEach(el => {
        const cls = el.className || '';
        if (cls.match(/\bcorrect\b/i) && !cls.match(/\bincorrect\b/i)) {
          correctAnswer = el.innerText.trim();
        }
      });

      return { questionText, options, explanation, correctAnswer };
    });

    return data;
  } catch (err) {
    return null;
  }
}

function formatQuestions() {
  const lines = [];
  lines.push('='.repeat(80));
  lines.push('MICROSOFT LEARN PRACTICE ASSESSMENT — CAPTURED QUESTIONS');
  lines.push(`Source: ${url}`);
  lines.push(`Captured: ${new Date().toISOString()}`);
  lines.push(`Total questions: ${questions.size}`);
  lines.push('='.repeat(80));
  lines.push('');

  let i = 1;
  for (const [, q] of questions) {
    lines.push(`${'─'.repeat(80)}`);
    lines.push(`Q${i}: ${q.text}`);
    lines.push('');
    if (q.options.length > 0) {
      const letters = 'abcdefghij';
      q.options.forEach((opt, idx) => {
        let marker = '  ';
        if (opt.isCorrect) marker = '✓ ';
        else if (opt.isIncorrect) marker = '✗ ';
        const letter = letters[idx] || `${idx + 1}`;
        lines.push(`  ${marker}${letter}) ${opt.text}`);
      });
    }
    if (q.correctAnswer) {
      lines.push('');
      lines.push(`  Correct answer: ${q.correctAnswer}`);
    }
    if (q.explanation) {
      lines.push('');
      lines.push(`  Explanation:`);
      // Word-wrap explanation
      const words = q.explanation.split(/\s+/);
      let line = '    ';
      for (const word of words) {
        if (line.length + word.length + 1 > 78) {
          lines.push(line);
          line = '    ' + word;
        } else {
          line += (line.trim() ? ' ' : '') + word;
        }
      }
      if (line.trim()) lines.push(line);
    }
    lines.push('');
    i++;
  }

  return lines.join('\n');
}

function saveQuestions() {
  if (questions.size === 0) {
    console.log('\nNo questions captured.');
    return;
  }
  const content = formatQuestions();
  fs.writeFileSync(outputFile, content, 'utf8');
  console.log(`\nSaved ${questions.size} questions to: ${outputFile}`);
}

async function main() {
  console.log('Starting browser with persistent profile...');
  console.log(`Profile dir: ${userDataDir}`);
  console.log('');

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    viewport: { width: 1280, height: 900 },
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const page = context.pages()[0] || await context.newPage();

  console.log(`Navigating to: ${url}`);
  console.log('');
  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│  INSTRUCTIONS:                                          │');
  console.log('│                                                          │');
  console.log('│  1. Log in if prompted (first time only)                │');
  console.log('│  2. Start the practice assessment                       │');
  console.log('│  3. For each question:                                  │');
  console.log('│     - Select your answer (or any answer)                │');
  console.log('│     - Click "Check answer" to reveal the explanation    │');
  console.log('│     - The script captures the question automatically    │');
  console.log('│     - Click "Next" to proceed                           │');
  console.log('│  4. When done, close the browser or press Ctrl+C       │');
  console.log('│  5. Questions are saved to practice-assessment-questions │');
  console.log('└─────────────────────────────────────────────────────────┘');
  console.log('');

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // One-time DOM dump for debugging selectors (written to dom-dump.json)
  let domDumped = false;
  page.on('load', async () => {
    // Wait a bit for SPA content to render
    await new Promise(r => setTimeout(r, 3000));
    if (!domDumped && page.url().includes('learn.microsoft.com')) {
      const info = await dumpDOM(page);
      if (info && info.interesting.length > 0) {
        const dumpFile = path.join(process.cwd(), 'dom-dump.json');
        fs.writeFileSync(dumpFile, JSON.stringify(info, null, 2), 'utf8');
        console.log(`[DEBUG] DOM structure saved to ${dumpFile} (${info.interesting.length} interesting elements)`);
        domDumped = true;
      }
    }
  });

  // Poll for questions every 2 seconds
  let lastQuestion = '';
  let dumpedOnAssessment = false;
  pollInterval = setInterval(async () => {
    try {
      // Dump DOM once when we detect we're on the assessment
      if (!dumpedOnAssessment && page.url().includes('assessment')) {
        const info = await dumpDOM(page);
        if (info && info.interesting.length > 0) {
          const dumpFile = path.join(process.cwd(), 'dom-dump.json');
          fs.writeFileSync(dumpFile, JSON.stringify(info, null, 2), 'utf8');
          console.log(`[DEBUG] Assessment DOM saved to ${dumpFile} (${info.interesting.length} elements)`);
          dumpedOnAssessment = true;
        }
      }

      const data = await extractQuestion(page);
      if (data && data.questionText) {
        // Use question text + first option as key to detect new questions
        // (handles cases where instructional text is the same across questions)
        const optionFingerprint = data.options.map(o => o.text).sort().join('|');
        const key = (data.questionText.substring(0, 100) + '||' + optionFingerprint.substring(0, 100));

        if (key === lastQuestion) return; // same question, no update needed — skip

        const existing = questions.get(key);

        // Update if we now have more info (explanation, correct answer)
        if (!existing || data.explanation || data.options.some(o => o.isCorrect)) {
          questions.set(key, {
            text: data.questionText,
            options: data.options,
            explanation: data.explanation,
            correctAnswer: data.correctAnswer,
          });
          const status = existing ? 'UPDATED' : 'CAPTURED';
          console.log(`[${status}] Q${questions.size}: ${data.questionText.substring(0, 70)}...`);

          // Save after each question (in case of crash)
          saveQuestions();
        }

        lastQuestion = key;
      }
    } catch (err) {
      // Page might be navigating, ignore
    }
  }, 2000);

  // Handle browser close
  context.on('close', () => {
    clearInterval(pollInterval);
    saveQuestions();
    console.log('\nBrowser closed. Done!');
    process.exit(0);
  });

  // Handle Ctrl+C
  process.on('SIGINT', async () => {
    clearInterval(pollInterval);
    saveQuestions();
    console.log('\nInterrupted. Closing browser...');
    await context.close().catch(() => {});
    process.exit(0);
  });

  // Keep the process alive
  await new Promise(() => {});
}

main().catch(err => {
  console.error('Error:', err.message);
  if (pollInterval) clearInterval(pollInterval);
  saveQuestions();
  process.exit(1);
});
