# AZ-900 Quiz Bank

JSON-formatted multiple choice questions for each AZ-900 exam domain. Each file can be loaded into a quiz app, parsed with a script, or read directly for self-study.

---

## JSON Structure

Each file is a JSON array of question objects:

```json
[
  {
    "question_id": 1,
    "question_text": "The question...",
    "options": {
      "a": {
        "text": "Option A text",
        "is_true": false,
        "explanation": "Why this is correct or incorrect."
      },
      "b": { ... },
      "c": { ... },
      "d": { ... }
    },
    "correct_answer": "b"
  }
]
```

---

## Interactive CLI

A full interactive quiz CLI lives in the top-level `cli/` folder. No dependencies — requires Node.js 16+.

```bash
node cli/cli.js az-900/quiz
```

Or from inside the `cli/` directory:

```bash
cd cli
node cli.js ../az-900/quiz
```

### Controls

| Key | Action |
|---|---|
| `1`–`9`, `A` + Enter | Select a quiz on the menu |
| `a` `b` `c` `d` | Submit your answer |
| `h` | Toggle hint (shows all option explanations without revealing the correct letter) |
| `B` (Shift+B) | Bookmark / unbookmark current question |
| `n` or `→` | Next question |
| `p` or `←` | Previous question |
| `v` | View bookmarked questions |
| `f` | Finish and see results |
| `r` | Retry (from results screen) |
| `m` | Back to main menu (from results screen) |
| `q` or Ctrl+C | Quit |

### Features

- **File select** — choose a single topic or all 65 questions shuffled
- **Status bar** — shows current question, correct/incorrect/unanswered counts, bookmark count
- **Instant feedback** — after answering, see correct/incorrect with the full explanation
- **Free navigation** — skip questions and come back with `n`/`p` or arrow keys; answer in any order
- **Bookmarks** — flag questions to review later; jump back to them from the bookmarks screen
- **Results screen** — final score, pass/fail verdict, and full review of every wrong answer with explanations
- **Retry** — reset answers and attempt the same question set again

---

## Quick CLI Quiz (bash)

Run a simple interactive quiz from the terminal using `jq`:

```bash
# Install jq if needed: brew install jq

quiz_file="./01-cloud-concepts.json"
total=$(jq length $quiz_file)
correct=0

for i in $(seq 0 $((total - 1))); do
  question=$(jq -r ".[$i].question_text" $quiz_file)
  correct_answer=$(jq -r ".[$i].correct_answer" $quiz_file)

  echo ""
  echo "Q$((i+1)): $question"
  echo ""

  for opt in a b c d; do
    text=$(jq -r ".[$i].options.$opt.text // empty" $quiz_file)
    [ -n "$text" ] && echo "  $opt) $text"
  done

  echo ""
  read -p "Your answer: " answer

  if [ "$answer" = "$correct_answer" ]; then
    echo "✓ Correct!"
    correct=$((correct + 1))
  else
    echo "✗ Incorrect. Correct answer: $correct_answer"
    explanation=$(jq -r ".[$i].options.$correct_answer.explanation" $quiz_file)
    echo "  $explanation"
  fi
done

echo ""
echo "Score: $correct/$total"
```

---

## Parse with Python

```python
import json, random

with open("01-cloud-concepts.json") as f:
    questions = json.load(f)

random.shuffle(questions)

score = 0
for q in questions:
    print(f"\n{q['question_text']}\n")
    for key, opt in q["options"].items():
        print(f"  {key}) {opt['text']}")
    answer = input("\nYour answer: ").strip().lower()
    correct = q["correct_answer"]
    if answer == correct:
        print("Correct!")
        score += 1
    else:
        print(f"Incorrect. Answer: {correct}")
        print(f"  {q['options'][correct]['explanation']}")

print(f"\nFinal score: {score}/{len(questions)}")
```
