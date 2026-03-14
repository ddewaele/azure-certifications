#!/usr/bin/env node
'use strict';

const fs   = require('fs');
const path = require('path');

// ─── Terminal helpers ──────────────────────────────────────────────────────────

const W = Math.min(process.stdout.columns || 80, 80);

const c = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  red:     '\x1b[31m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  cyan:    '\x1b[36m',
  white:   '\x1b[37m',
  bgBlue:  '\x1b[44m',
  bgGray:  '\x1b[100m',
};

const clear  = () => process.stdout.write('\x1b[2J\x1b[H');
const out    = (s) => process.stdout.write(s);
const ln     = (s = '') => out(s + '\n');
const hr     = (ch = '─') => c.dim + ch.repeat(W) + c.reset;

function wrap(text, indent = '  ', width = W - 2) {
  const words = text.split(/\s+/);
  const lines = [];
  let cur = '';
  for (const word of words) {
    if (cur && cur.length + 1 + word.length > width - indent.length) {
      lines.push(indent + cur);
      cur = word;
    } else {
      cur = cur ? cur + ' ' + word : word;
    }
  }
  if (cur) lines.push(indent + cur);
  return lines.join('\n');
}

// ─── State ────────────────────────────────────────────────────────────────────

const state = {
  screen:      'FILE_SELECT',  // FILE_SELECT | QUIZ | BOOKMARKS | RESULTS
  quizDir:     '',             // resolved path to the folder containing quiz JSON files
  files:       [],
  questions:   [],
  quizName:    '',
  current:     0,
  answers:     {},            // questionIndex -> { choice: 'a'|['a','b'], correct: bool }
  bookmarks:   new Set(),
  hints:       new Set(),     // question indices where hint was revealed
  pending:     new Set(),     // in-progress selections for multi-select questions
  inputBuffer: '',            // typed chars on the file select screen
  bmBuffer:    '',            // typed chars for bookmark navigation
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isMultiSelect(q) {
  return q.question_type === 'multiple_select' || Array.isArray(q.correct_answer);
}

// ─── Load quiz files ──────────────────────────────────────────────────────────

function loadFiles() {
  return fs.readdirSync(state.quizDir)
    .filter(f => /^\d+.*\.json$/.test(f))
    .sort()
    .map(f => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(state.quizDir, f), 'utf8'));
        if (Array.isArray(data) && data[0]?.question_id != null) {
          const name = f
            .replace(/^\d+-/, '')
            .replace(/\.json$/, '')
            .replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
          return { file: f, name, questions: data };
        }
      } catch {}
      return null;
    })
    .filter(Boolean);
}

// ─── Screens ──────────────────────────────────────────────────────────────────

function renderFileSelect() {
  clear();
  const inner = W - 4;

  // Header box
  ln();
  ln(c.bold + c.cyan + '  ╔' + '═'.repeat(inner) + '╗' + c.reset);

  const title = 'AZ-900 Quiz';
  const sub   = 'Azure Fundamentals Exam Prep';
  const pad1  = Math.max(0, inner - title.length);
  const pad2  = Math.max(0, inner - sub.length);

  ln(c.bold + c.cyan + '  ║  ' + c.white + c.bold + title +
    ' '.repeat(pad1 - 2) + c.cyan + '║' + c.reset);
  ln(c.cyan + '  ║  ' + c.dim + sub +
    ' '.repeat(pad2 - 2) + c.cyan + '║' + c.reset);
  ln(c.bold + c.cyan + '  ╚' + '═'.repeat(inner) + '╝' + c.reset);
  ln();

  // File list
  ln(c.dim + '  Select a quiz to start:\n' + c.reset);
  state.files.forEach((f, i) => {
    ln(`  ${c.yellow}${i + 1}${c.reset})  ${c.bold}${f.name}${c.reset}` +
       `  ${c.dim}(${f.questions.length} questions)${c.reset}`);
  });

  const total = state.files.reduce((n, f) => n + f.questions.length, 0);
  ln();
  ln(`  ${c.yellow}A${c.reset})  ${c.bold}All Topics${c.reset}` +
     `  ${c.dim}(${total} questions — shuffled)${c.reset}`);
  ln();
  ln(hr());
  ln(c.dim + '  Type a number or A, then press Enter  │  Ctrl+C to quit' + c.reset);
  ln();
  out('  > ');
}

function renderStatusBar() {
  const total    = state.questions.length;
  const answered = Object.keys(state.answers).length;
  const correct  = Object.values(state.answers).filter(a => a.correct).length;
  const wrong    = answered - correct;
  const unanswered = total - answered;
  const bm       = state.bookmarks.size;
  const idx      = state.current + 1;

  const left  = ` Q ${idx}/${total} `;
  const mid   = ` ✓ ${correct}  ✗ ${wrong}  · ${unanswered} `;
  const right = ` 🔖 ${bm} `;
  const space = Math.max(0, W - 2 - left.length - mid.length - right.length);

  out('  ');
  out(c.bgBlue  + c.white + c.bold + left + c.reset);
  out(c.bgGray  + c.white + mid + ' '.repeat(space) + right + c.reset);
  ln();
}

function renderQuestion() {
  clear();

  const q      = state.questions[state.current];
  const answer = state.answers[state.current];
  const bmked  = state.bookmarks.has(state.current);
  const hinted = state.hints.has(state.current);

  renderStatusBar();
  ln();

  // Indicators row
  const indicators = [
    bmked ? c.yellow + '🔖 Bookmarked' + c.reset : '',
    hinted && !answer ? c.cyan + '💡 Hint shown' + c.reset : '',
  ].filter(Boolean);
  if (indicators.length) {
    ln('  ' + indicators.join('   '));
    ln();
  }

  // Question text
  ln(c.bold + wrap(q.question_text) + c.reset);
  ln();

  // Options
  const multi = isMultiSelect(q);
  for (const [key, opt] of Object.entries(q.options)) {
    const correctKeys = multi ? q.correct_answer : [q.correct_answer];
    const isCorrect   = correctKeys.includes(key);
    const isChosen    = multi ? answer?.choice.includes(key) : answer?.choice === key;
    const isPending   = state.pending.has(key);

    let keyColor  = c.yellow;
    let textColor = '';
    let tag       = '';
    let prefix    = '';  // checkbox for multi-select

    if (multi && !answer) {
      prefix = isPending ? c.cyan + '[✓] ' + c.reset : c.dim + '[ ] ' + c.reset;
      if (isPending) { keyColor = c.cyan; textColor = c.cyan; }
    }

    if (answer) {
      if (isCorrect && isChosen) {
        keyColor = c.green; textColor = c.green;
        tag = c.green + '  ✓' + c.reset;
      } else if (isCorrect) {
        keyColor = c.green; textColor = c.green;
        tag = c.green + '  ← correct' + c.reset;
      } else if (isChosen) {
        keyColor = c.red; textColor = c.red;
        tag = c.red + '  ← wrong pick' + c.reset;
      } else {
        keyColor = c.dim; textColor = c.dim;
      }
      if (multi) prefix = isChosen ? (isCorrect ? c.green + '[✓] ' : c.red + '[✓] ') + c.reset
                                   : c.dim + '[ ] ' + c.reset;
    }

    ln(`  ${prefix}${keyColor}${key}${c.reset})  ${textColor}${opt.text}${c.reset}${tag}`);
  }

  // Hint block — shown before answering, hides which option is correct
  if (hinted && !answer) {
    ln(c.bgGray + c.white + '  💡 Hint  ' + c.reset);
    ln();
    // Show each option's explanation without labelling which is correct
    for (const [key, opt] of Object.entries(q.options)) {
      ln(c.yellow + `  ${key})` + c.reset + c.dim + '  ' + opt.explanation + c.reset);
      ln();
    }
  }

  // Feedback after answering
  if (answer) {
    ln();
    if (answer.correct) {
      ln(c.bold + c.green + '  ✓ Correct!' + c.reset);
    } else {
      ln(c.bold + c.red   + '  ✗ Incorrect.' + c.reset);
    }
    ln();
    const correctKeys = isMultiSelect(q) ? q.correct_answer : [q.correct_answer];
    for (const ck of correctKeys) {
      ln(c.dim + wrap(q.options[ck].explanation) + c.reset);
    }
    ln();
  }

  ln(hr());
  if (!answer) {
    if (isMultiSelect(q)) {
      ln(c.dim + '  [a-d] toggle  [Enter] submit  [h] hint  [B] bookmark  [n/→] next  [p/←] prev  [v] bookmarks  [f] finish  [q] quit' + c.reset);
    } else {
      ln(c.dim + '  [a-d] answer  [h] hint  [B] bookmark  [n/→] next  [p/←] prev  [v] bookmarks  [f] finish  [q] quit' + c.reset);
    }
  } else {
    ln(c.dim + '  [B] bookmark  [n/→] next  [p/←] prev  [v] bookmarks  [f] finish  [q] quit' + c.reset);
  }
  ln();
}

function renderBookmarks() {
  clear();
  ln();
  ln(c.bold + c.yellow + '  🔖 Bookmarked Questions' + c.reset +
     c.dim + `  (${state.bookmarks.size} bookmarked)` + c.reset);
  ln();

  if (state.bookmarks.size === 0) {
    ln(c.dim + '  No bookmarks yet. Press [b] on any question to bookmark it.' + c.reset);
  } else {
    const list = [...state.bookmarks].sort((a, b) => a - b);
    list.forEach((qIdx, i) => {
      const q   = state.questions[qIdx];
      const ans = state.answers[qIdx];

      const maxLen = W - 18;
      const short  = q.question_text.length > maxLen
        ? q.question_text.slice(0, maxLen) + '…'
        : q.question_text;

      let status = c.dim + '· unanswered' + c.reset;
      if (ans) {
        status = ans.correct
          ? c.green + '✓ correct' + c.reset
          : c.red   + '✗ wrong'   + c.reset;
      }

      ln(`  ${c.yellow}${i + 1}${c.reset})  ${c.dim}Q${qIdx + 1}${c.reset}  ${short}`);
      ln(`        ${status}`);
      ln();
    });
  }

  ln(hr());
  if (state.bookmarks.size > 0) {
    ln(c.dim + `  [1-${state.bookmarks.size}] go to question  [r/Esc] back to quiz  [q] quit` + c.reset);
  } else {
    ln(c.dim + '  [r/Esc] back to quiz  [q] quit' + c.reset);
  }
  ln();
  if (state.bmBuffer) out(c.dim + '  > ' + state.bmBuffer + c.reset);
}

function renderResults() {
  clear();

  const total    = state.questions.length;
  const answered = Object.keys(state.answers).length;
  const correct  = Object.values(state.answers).filter(a => a.correct).length;
  const wrong    = answered - correct;
  const skipped  = total - answered;
  const pct      = Math.round((correct / total) * 100);
  const pass     = pct >= 70;

  ln();
  ln(hr('═'));
  const verdict = pass
    ? c.green + c.bold + '  ✓  Quiz Complete — ' + state.quizName + c.reset
    : c.red   + c.bold + '  ✗  Quiz Complete — ' + state.quizName + c.reset;
  ln(verdict);
  ln(hr('═'));
  ln();

  const scoreColor = pct >= 70 ? c.green : pct >= 50 ? c.yellow : c.red;
  ln(`  Score:    ${scoreColor}${c.bold}${correct} / ${total}  (${pct}%)${c.reset}`);
  ln(`  Result:   ${pass
    ? c.green + c.bold + 'PASS ✓  (AZ-900 requires 700/1000 ≈ 70%)' + c.reset
    : c.red   + c.bold + 'NOT YET — aim for 70%+' + c.reset}`);
  ln();
  ln(`  ✓ Correct:    ${c.green}${correct}${c.reset}`);
  ln(`  ✗ Incorrect:  ${c.red}${wrong}${c.reset}`);
  ln(`  · Skipped:    ${c.dim}${skipped}${c.reset}`);
  ln(`  💡 Hints used: ${c.cyan}${state.hints.size}${c.reset}`);
  ln(`  🔖 Bookmarked: ${c.yellow}${state.bookmarks.size}${c.reset}`);

  // Wrong answer review
  const wrongIdxs = Object.entries(state.answers)
    .filter(([, a]) => !a.correct)
    .map(([i]) => parseInt(i))
    .sort((a, b) => a - b);

  if (wrongIdxs.length > 0) {
    ln();
    ln(hr());
    ln();
    ln(c.bold + '  Review — Incorrect Answers' + c.reset);
    ln();
    for (const idx of wrongIdxs) {
      const q   = state.questions[idx];
      const ans = state.answers[idx];
      const multi = isMultiSelect(q);
      ln(c.dim + `  Q${idx + 1}` + c.reset);
      ln(c.bold + wrap(q.question_text) + c.reset);
      if (multi) {
        const chosenKeys  = Array.isArray(ans.choice) ? ans.choice : [ans.choice];
        const correctKeys = q.correct_answer;
        ln(`      Your answer:    ${c.red}${chosenKeys.join(', ')}${c.reset}`);
        ln(`      Correct answer: ${c.green}${correctKeys.join(', ')}${c.reset}`);
        ln();
        for (const ck of correctKeys) {
          ln(c.dim + wrap(q.options[ck].explanation, '      ') + c.reset);
        }
      } else {
        ln(`      Your answer:    ${c.red}${ans.choice})  ${q.options[ans.choice].text}${c.reset}`);
        ln(`      Correct answer: ${c.green}${q.correct_answer})  ${q.options[q.correct_answer].text}${c.reset}`);
        ln();
        ln(c.dim + wrap(q.options[q.correct_answer].explanation, '      ') + c.reset);
      }
      ln();
    }
  }

  ln(hr());
  ln(c.dim + '  [r] retry this quiz  [m] main menu  [q] quit' + c.reset);
  ln();
}

// ─── Key handlers ─────────────────────────────────────────────────────────────

function onKey(key) {
  if (key === '\u0003') { cleanup(); process.exit(); } // Ctrl+C

  switch (state.screen) {
    case 'FILE_SELECT': return onFileSelectKey(key);
    case 'QUIZ':        return onQuizKey(key);
    case 'BOOKMARKS':   return onBookmarkKey(key);
    case 'RESULTS':     return onResultsKey(key);
  }
}

function onFileSelectKey(key) {
  // Enter — submit
  if (key === '\r' || key === '\n') {
    const input = state.inputBuffer.trim().toLowerCase();
    state.inputBuffer = '';
    ln();
    if (input === 'a') {
      startQuiz('all');
    } else {
      const n = parseInt(input);
      if (n >= 1 && n <= state.files.length) {
        startQuiz(n - 1);
      } else {
        renderFileSelect();
      }
    }
    return;
  }
  // Backspace
  if (key === '\u007F' || key === '\b') {
    if (state.inputBuffer.length > 0) {
      state.inputBuffer = state.inputBuffer.slice(0, -1);
      out('\b \b');
    }
    return;
  }
  // Accepted chars: digits and 'a'
  if (/^[0-9aA]$/.test(key)) {
    state.inputBuffer += key.toLowerCase();
    out(key);
  }
}

function onQuizKey(key) {
  const q        = state.questions[state.current];
  const answered = state.answers[state.current] !== undefined;
  const lk       = key.toLowerCase();

  // Answer / toggle (only if not yet answered)
  if (!answered && Object.keys(q.options).includes(lk)) {
    if (isMultiSelect(q)) {
      // Toggle selection in pending set
      state.pending.has(lk) ? state.pending.delete(lk) : state.pending.add(lk);
      renderQuestion();
    } else {
      state.answers[state.current] = {
        choice:  lk,
        correct: lk === q.correct_answer,
      };
      renderQuestion();
    }
    return;
  }

  // Enter — submit multi-select (only if not yet answered and at least one toggle)
  if ((key === '\r' || key === '\n') && !answered && isMultiSelect(q)) {
    if (state.pending.size > 0) {
      const chosen  = [...state.pending].sort();
      const correct = [...q.correct_answer].sort();
      const isRight = chosen.length === correct.length && chosen.every((k, i) => k === correct[i]);
      state.answers[state.current] = { choice: chosen, correct: isRight };
      state.pending.clear();
      renderQuestion();
    }
    return;
  }

  // Next — n or right arrow
  if (lk === 'n' || key === '\x1b[C') {
    if (state.current < state.questions.length - 1) {
      state.pending.clear();
      state.current++;
      renderQuestion();
    }
    return;
  }

  // Prev — p or left arrow
  if (lk === 'p' || key === '\x1b[D') {
    if (state.current > 0) {
      state.pending.clear();
      state.current--;
      renderQuestion();
    }
    return;
  }

  // Hint — toggle explanation panel (only before answering)
  if (lk === 'h' && !answered) {
    state.hints.has(state.current)
      ? state.hints.delete(state.current)
      : state.hints.add(state.current);
    renderQuestion();
    return;
  }

  // Bookmark toggle — uppercase B (Shift+B) avoids conflict with answer option b
  if (key === 'B') {
    state.bookmarks.has(state.current)
      ? state.bookmarks.delete(state.current)
      : state.bookmarks.add(state.current);
    renderQuestion();
    return;
  }

  // View bookmarks
  if (lk === 'v') {
    state.pending.clear();
    state.bmBuffer = '';
    state.screen   = 'BOOKMARKS';
    renderBookmarks();
    return;
  }

  // Finish
  if (lk === 'f') {
    state.pending.clear();
    state.screen = 'RESULTS';
    renderResults();
    return;
  }

  // Quit
  if (lk === 'q') { cleanup(); process.exit(); }
}

function onBookmarkKey(key) {
  const list = [...state.bookmarks].sort((a, b) => a - b);
  const lk   = key.toLowerCase();

  // Back to quiz
  if (lk === 'r' || key === '\x1b') {
    state.bmBuffer = '';
    state.screen   = 'QUIZ';
    renderQuestion();
    return;
  }

  if (lk === 'q') { cleanup(); process.exit(); }

  // Digit input — navigate to a bookmarked question
  if (/\d/.test(key)) {
    state.bmBuffer += key;
    const n = parseInt(state.bmBuffer);

    if (n >= 1 && n <= list.length) {
      // Valid — navigate immediately
      state.current  = list[n - 1];
      state.bmBuffer = '';
      state.screen   = 'QUIZ';
      renderQuestion();
    } else if (n > list.length || state.bmBuffer.length > String(list.length).length) {
      // Overflowed — reset buffer and re-render with cleared input
      state.bmBuffer = '';
      renderBookmarks();
    } else {
      // Partial (multi-digit) — show updated prompt
      renderBookmarks();
    }
    return;
  }

  // Enter confirms a multi-digit buffer
  if ((key === '\r' || key === '\n') && state.bmBuffer.length > 0) {
    const n = parseInt(state.bmBuffer);
    state.bmBuffer = '';
    if (n >= 1 && n <= list.length) {
      state.current = list[n - 1];
      state.screen  = 'QUIZ';
      renderQuestion();
    } else {
      renderBookmarks();
    }
    return;
  }
}

function onResultsKey(key) {
  const lk = key.toLowerCase();

  if (lk === 'r') {
    // Retry — reset answers, bookmarks, hints and pending; keep same questions
    state.current   = 0;
    state.answers   = {};
    state.bookmarks = new Set();
    state.hints     = new Set();
    state.pending   = new Set();
    state.screen    = 'QUIZ';
    renderQuestion();
    return;
  }

  if (lk === 'm') {
    state.screen      = 'FILE_SELECT';
    state.inputBuffer = '';
    renderFileSelect();
    return;
  }

  if (lk === 'q') { cleanup(); process.exit(); }
}

// ─── Start quiz ───────────────────────────────────────────────────────────────

function startQuiz(fileIndex) {
  const src = fileIndex === 'all'
    ? state.files.flatMap(f => f.questions)
    : state.files[fileIndex].questions;

  state.questions  = [...src];
  state.quizName   = fileIndex === 'all' ? 'All Topics' : state.files[fileIndex].name;
  state.current    = 0;
  state.answers    = {};
  state.bookmarks  = new Set();
  state.hints      = new Set();
  state.pending    = new Set();
  state.screen     = 'QUIZ';
  renderQuestion();
}

// ─── Cleanup ──────────────────────────────────────────────────────────────────

function cleanup() {
  try { if (process.stdin.isTTY) process.stdin.setRawMode(false); } catch {}
  clear();
  ln(c.dim + '\n  Goodbye! Good luck with your exam.\n' + c.reset);
}

// ─── Entry point ──────────────────────────────────────────────────────────────

if (!process.stdin.isTTY) {
  console.error('This quiz requires an interactive terminal.');
  process.exit(1);
}

const argDir = process.argv[2];
if (!argDir) {
  console.error('Usage: node cli.js <path-to-quiz-folder>');
  console.error('Example: node cli.js ../az-900/quiz');
  process.exit(1);
}

state.quizDir = path.resolve(argDir);

if (!fs.existsSync(state.quizDir)) {
  console.error(`Folder not found: ${state.quizDir}`);
  process.exit(1);
}

state.files = loadFiles();

if (state.files.length === 0) {
  console.error(`No quiz JSON files found in: ${state.quizDir}`);
  process.exit(1);
}

process.on('exit', () => {
  try { if (process.stdin.isTTY) process.stdin.setRawMode(false); } catch {}
});

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', onKey);

renderFileSelect();
