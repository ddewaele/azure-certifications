---
name: create-certification-package
description: Create a complete certification study package with concepts, labs, quizzes, glossary, cheatsheet, and README for a given certification or subject
argument-hint: <certification-code-or-subject> [microsoft-learn-url]
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, WebFetch, WebSearch, Agent
---

# Create Certification Package

You are creating a comprehensive certification study package for: **$ARGUMENTS**

## Step 0: Research

1. **Identify the certification or subject.** Parse `$ARGUMENTS` for a certification code (e.g., `az-104`, `dp-900`, `sc-200`) and/or a Microsoft Learn URL.
2. **Find and fetch the official exam study guide (CRITICAL).** Every Microsoft certification has an official "Study guide for Exam XX-NNN" document that lists the **exact skills measured** with percentage weights and detailed sub-topics. This is the **authoritative source** for what the exam tests — all content you create must be grounded in this document.
   - The study guide URL typically follows the pattern: `https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/<exam-code>` (e.g., `ai-900`, `ai-102`, `ab-900`)
   - Shortcut URLs often exist: `https://aka.ms/<exam-code>-StudyGuide`
   - Fetch this document and extract: domains, percentage weights, every sub-topic and bullet point
   - **The skills measured document is your primary source.** The Microsoft Learn training modules cover broader educational content but may include topics not directly tested on the exam. Concept guides, quizzes, and labs should focus on what the study guide lists.
3. **Fetch the certification overview page.** Find exam details (duration, passing score, cost, prerequisites, languages) from `https://learn.microsoft.com/en-us/credentials/certifications/<cert-name>/`
4. **Fetch the learning paths.** Find the associated Microsoft Learn learning path(s) and extract the module list. Note that the course code may differ from the exam code (e.g., course AI-901T00 prepares for exam AI-900).
5. **Gather supplementary material.** Search for high-quality third-party study resources (blogs, YouTube channels, practice tests) that cover this certification.
6. **Determine the folder name.** Use the lowercase exam code (e.g., `az-104`, `dp-900`). If this is not a Microsoft certification, derive a short kebab-case slug from the subject name.

**Important:** If the study guide lists specific skills (e.g., "image classification, object detection, OCR, facial detection") but the training modules cover additional concepts (e.g., "semantic segmentation"), prioritise the study guide skills in your concept files. You may include additional training content but clearly indicate it is supplementary to the exam-tested skills.

## Step 1: Create the folder structure

Create the following directory structure under the repo root:

```
<cert>/
├── README.md
├── glossary.md
├── cheatsheet.md
├── microsoft-learn-toc.md   (only if a Microsoft Learn path exists)
├── concepts/
├── labs/
└── quiz/
```

## Step 2: Microsoft Learn Table of Contents (`microsoft-learn-toc.md`)

If this is a Microsoft certification with an official Learn path:

1. Fetch the learning path page and extract the module/unit structure.
2. Create `microsoft-learn-toc.md` with:
   - Exam code, certification title, and certification level
   - A table of exam domains with their weights
   - For each domain: a table of topics and key areas covered
   - Include links back to the Microsoft Learn modules where possible

Follow the format used in existing files like `ab-900/microsoft-learn-toc.md`.

## Step 3: Concepts (`concepts/`)

Based on the exam domains / major topic areas identified in Step 0:

1. Create one numbered markdown file per domain or major topic: `01-<topic-slug>.md`, `02-<topic-slug>.md`, etc.
2. Each concept file should:
   - Have a clear H1 title with the domain name and weight percentage (if applicable)
   - Use **tables** extensively for structured information (concept/description pairs, feature comparisons, service breakdowns)
   - Use **subsections** (H2/H3) to organize by sub-topic
   - Include practical details: what you configure, where you configure it, key distinctions the exam tests
   - Include an **Exam Tips** section (H2) just before the References section with 4-8 bullet points highlighting what's most important for the exam. Tips should cover: key facts to memorize, common exam traps, how to distinguish similar concepts, and scenario-matching advice. Example:
     ```markdown
     ## Exam Tips

     - Know all **six responsible AI principles** by name and be able to match each to a scenario
     - **Fairness** is about equitable treatment and avoiding bias — not about equal outcomes
     - **Transparency** is about understanding how AI makes decisions — not about open-sourcing code
     - **Reliability and safety** is the principle most relevant to life-critical systems (medical, automotive)
     - Be able to identify which AI workload type matches a given scenario (computer vision vs NLP vs generative AI vs document processing)
     - Responsible AI is not just a set of guidelines — Microsoft embeds it into Azure AI services through content filters, fairness dashboards, and transparency notes
     ```
   - Include a **References** section at the bottom with links to official documentation, Microsoft Learn modules, and any supplementary sources used
3. Write content that is **exam-focused**: cover every bullet point from the study guide's skills measured list. Emphasize what candidates need to know, common exam traps, and key differentiators between similar services/concepts.
4. **Ground all content in the official study guide.** If a topic appears in the study guide, it must be covered. If a topic only appears in the training modules but not the study guide, you may include it as supplementary context but do not give it equal weight to exam-tested skills.

Follow the style of existing concept files (e.g., `ab-900/concepts/01-m365-core-features-and-objects.md`) — heavy use of tables, concise descriptions, practical focus.

## Step 4: Glossary (`glossary.md`)

Create an alphabetical glossary of key terms for the certification:

1. Extract important terms from the concepts you wrote and from official documentation.
2. Format: `**Term** — Definition.` grouped under letter headings (## A, ## B, etc.).
3. Keep definitions concise (1-2 sentences). Focus on what the exam expects you to know.
4. Include all service names, acronyms, security concepts, architectural patterns, and key features.

Follow the format of `ab-900/glossary.md`.

## Step 5: Cheatsheet (`cheatsheet.md`)

Create a quick-reference cheatsheet / handout covering the most important facts:

1. Organize by exam domain or topic area.
2. Use tables, bullet points, and short descriptions — this should be scannable in 10-15 minutes.
3. Focus on: key differentiators, decision criteria (when to use X vs Y), important limits/thresholds, common exam scenarios.
4. Include a **References** section at the bottom.

## Step 6: Labs (`labs/`)

If hands-on labs are feasible for this certification (most Azure/M365 certs):

1. Create 4-6 numbered lab files: `01-<lab-slug>.md`, `02-<lab-slug>.md`, etc.
2. Each lab should follow this structure:
   - **H1 title**: `Lab NN: Descriptive Title`
   - **Overview**: 2-3 sentence description
   - **Learning Objectives**: bullet list
   - **Prerequisites**: what's needed (tenant, subscription, roles)
   - **Steps**: numbered sections with **Explore** (what to look at) and **Try** (what to do) subsections
   - **Cleanup**: how to remove resources created during the lab
   - **References**: links to relevant documentation
3. Labs should progress from basic exploration to more advanced configuration.
4. Use Azure CLI commands where applicable, with Portal alternatives noted.

Follow the style of existing labs (e.g., `ab-900/labs/01-m365-admin-center-exploration.md`).

## Step 7: Quizzes (`quiz/`)

Create **5 quiz JSON files** with a total of at least 100 questions:

1. **`01-<topic>.json`** — Easy difficulty (20 questions). Foundational recall and basic concepts.
2. **`02-<topic>.json`** — Easy difficulty (20 questions). Different topic area from quiz 01.
3. **`03-<topic>.json`** — Medium difficulty (20 questions). Application and scenario-based questions.
4. **`04-<topic>.json`** — Hard difficulty (20 questions). Complex scenarios, multi-select, tricky distinctions.
5. **`05-mixed-review.json`** — Mixed difficulty (20 questions). Covers all domains, simulates exam breadth.

### Quiz JSON format

A quiz file is a **JSON object** with a required metadata block and a questions array:

```json
{
  "meta": {
    "title": "Azure Fundamentals – Cloud Concepts",
    "subject": "Cloud Computing",
    "version": "1.0.0",
    "created": "2025-09-01"
  },
  "questions": [
    { ...question },
    { ...question }
  ]
}
```

---

## Metadata Object (`meta`) — Required

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | Yes | Human-readable title for the quiz. |
| `subject` | `string` | No | Broad subject area (e.g. `"Cloud Computing"`, `"ISO 27001"`). |
| `version` | `string` | No | Semantic version string for tracking revisions. |
| `created` | `string` | No | ISO 8601 date string (`YYYY-MM-DD`). |

---

## Question Object

### Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `question_id` | `number` | Yes | Unique identifier within the file. Used for stable cross-referencing (e.g. linking from external tools or merging quiz files) — not for display order, which follows the array. Must not be renumbered on insertion. |
| `question_text` | `string` | Yes | The full question text shown to the user. |
| `options` | `object` | Yes | Map of answer options. Keys are single lowercase letters: `"a"`, `"b"`, `"c"`, `"d"`, etc. Minimum 2 options required. |
| `correct_answer` | `string[]` | Yes | Array of correct option key(s). Always an array. Single-select questions have one element (e.g. `["b"]`); multiple-select questions have two or more (e.g. `["a", "c"]`). The CLI infers question type from this array length — no separate `question_type` field is needed. |
| `difficulty` | `string` | No | Difficulty level of the question. Allowed values: `"easy"`, `"medium"`, `"hard"`. Defaults to `"medium"` if omitted. |
| `topic` | `string` | No | Specific sub-topic this question covers (e.g. `"CapEx vs OpEx"`, `"Shared Responsibility Model"`). Useful for filtering or grouping questions. |
| `tags` | `string[]` | No | Free-form labels for further categorisation (e.g. `["definition", "scenario", "AZ-900"]`). |

---

## Option Object

Each key in `options` maps to an option object:

| Field | Type | Required | Description |
|---|---|---|---|
| `text` | `string` | Yes | The answer text shown to the user. |
| `is_true` | `boolean` | Yes | `true` if this option is a correct answer, `false` otherwise. Must be consistent with `correct_answer`. |
| `explanation` | `string` | Yes | Shown after the user answers. For correct options, explain *why* it is correct. For incorrect options, explain *why* it is wrong. |

---

## Single-Select Question

The most common type. The user presses a single letter key to answer immediately. `correct_answer` is a single-element array — the CLI treats any question with exactly one correct answer as single-select.

```json
{
  "question_id": 1,
  "question_text": "A company moves its servers from an on-premises datacenter to Azure and switches from buying hardware to paying a monthly fee. How does this change their cost model?",
  "difficulty": "medium",
  "topic": "CapEx vs OpEx",
  "tags": ["cost-model", "scenario", "AZ-900"],
  "options": {
    "a": {
      "text": "From OpEx to CapEx",
      "is_true": false,
      "explanation": "Incorrect. Buying on-premises hardware is CapEx. Moving to Azure shifts costs to OpEx, not the other way around."
    },
    "b": {
      "text": "From CapEx to OpEx",
      "is_true": true,
      "explanation": "Correct. Purchasing and maintaining physical servers is a capital expenditure (CapEx). Paying monthly for Azure services is an operational expenditure (OpEx)."
    },
    "c": {
      "text": "No change — both models have the same total cost",
      "is_true": false,
      "explanation": "Incorrect. The cost model changes fundamentally: on-premises requires large upfront investment, while cloud uses pay-as-you-go billing."
    },
    "d": {
      "text": "From CapEx to CapEx and OpEx combined",
      "is_true": false,
      "explanation": "Incorrect. Cloud removes the need for capital hardware investment. Azure billing is purely OpEx."
    }
  },
  "correct_answer": ["b"]
}
```

---

## Multiple-Select Question

Used when two or more answers are correct. `correct_answer` contains more than one element — the CLI infers multiple-select from this automatically. The CLI shows checkboxes and the user toggles options with letter keys before pressing Enter to submit.

```json
{
  "question_id": 2,
  "question_text": "A startup is launching a new service and wants to avoid overbuying infrastructure before customer demand is known. Which TWO cloud benefits are the strongest match for this scenario?",
  "difficulty": "easy",
  "topic": "Cloud Benefits",
  "tags": ["elasticity", "pricing", "scenario"],
  "options": {
    "a": {
      "text": "Elasticity",
      "is_true": true,
      "explanation": "Correct. Elasticity lets resources automatically expand or shrink based on actual demand, avoiding both over-provisioning and under-provisioning."
    },
    "b": {
      "text": "Physical access to servers",
      "is_true": false,
      "explanation": "Incorrect. Physical access to servers is not a cloud benefit — cloud customers do not have access to provider datacenter hardware."
    },
    "c": {
      "text": "Consumption-based pricing",
      "is_true": true,
      "explanation": "Correct. Pay-as-you-go pricing means the startup only pays for what it actually uses, with no upfront commitment to a fixed capacity."
    },
    "d": {
      "text": "Manual capacity forecasting",
      "is_true": false,
      "explanation": "Incorrect. Cloud reduces the need for manual capacity forecasting by allowing on-demand scaling instead."
    }
  },
  "correct_answer": ["a", "c"]
}
```

---

## Schema Constraints Summary

- `meta` is **required**. `meta.title` is the only required field within it.
- `correct_answer` is **always an array**. Single-select: one element (e.g. `["b"]`). Multiple-select: two or more (e.g. `["a", "c"]`). The CLI infers question type from array length — no `question_type` field exists.
- `options` must contain **at least 2** entries.
- `difficulty` defaults to `"medium"` if omitted. Allowed values: `"easy"`, `"medium"`, `"hard"`.
- `is_true` on each option must be consistent with `correct_answer` — if a key appears in `correct_answer`, its `is_true` must be `true`, and vice versa.
- `question_id` must be unique within the file and stable across edits (do not renumber on insertion). Display order follows the array, not the ID.
- `tags` entries are free-form lowercase strings; no fixed vocabulary.
- `meta.subject` (broad area) and `question.topic` (specific sub-topic) serve different granularities — use both to enable coarse and fine filtering.

### Quiz rules

- `question_id` must be unique within each file (start at 1 per file)
- `is_true` must be consistent with `correct_answer`
- Every option must have `text`, `is_true`, and `explanation`
- Explanations should teach — explain *why* right answers are right and *why* wrong answers are wrong
- For multiple-select, always state how many to select in the question text (e.g., "Which TWO...")
- Include a mix of single-select and multiple-select questions (roughly 80/20 split)
- Make wrong options plausible — avoid obviously silly distractors
- Include scenario-based questions, not just factual recall
- Questions should cover all exam domains proportionally to their weight

### Quiz validation

After creating each quiz file, validate it by running:

```bash
node -e "
const data = JSON.parse(require('fs').readFileSync('<cert>/quiz/<filename>', 'utf8'));
let ok = true;
for (const q of data) {
  if (!q.question_id || !q.question_text || !q.options || !q.correct_answer) {
    console.error('Missing fields in Q' + q.question_id); ok = false;
  }
  const ca = Array.isArray(q.correct_answer) ? q.correct_answer : [q.correct_answer];
  for (const k of ca) {
    if (!q.options[k]) { console.error('Bad correct_answer in Q' + q.question_id); ok = false; }
    if (!q.options[k].is_true) { console.error('is_true mismatch in Q' + q.question_id); ok = false; }
  }
  for (const [k, v] of Object.entries(q.options)) {
    if (!v.text || typeof v.is_true !== 'boolean' || !v.explanation) {
      console.error('Bad option ' + k + ' in Q' + q.question_id); ok = false;
    }
  }
}
console.log(ok ? 'Valid: ' + data.length + ' questions' : 'ERRORS FOUND');
"
```

## Step 8: README (`README.md`)

Create the certification README with:

1. **H1 title**: `<cert-code> -- <Full Certification Name>`
2. **Exam Overview** table: exam code, level, duration, passing score, question types, cost, prerequisites, languages
3. **Exam Domains** table: domain number, name, weight
4. **Concepts** section: numbered links to each concept file with domain weight
5. **Quiz Bank** section: total question count, link to quiz README, numbered links to each quiz file with question count and difficulty
6. **Hands-on Labs** section: numbered links to each lab file
7. **Additional Resources** section: links to glossary, cheatsheet, and microsoft-learn-toc
8. **Useful Links** table: links to exam study guide, certification page, scheduling page, exam sandbox, relevant documentation portals

Follow the format of `ab-900/README.md`.

## Important guidelines

- **Always include references.** Every concept file, lab, and the cheatsheet should have a References section linking to source material (Microsoft Learn, official docs, relevant third-party resources).
- **Be accurate.** Do not invent exam details (passing scores, domain weights, question counts). If you cannot find official information, state what is known and note what is estimated.
- **Match existing style.** Read and follow the patterns established in existing certification folders (table-heavy concepts, structured labs, detailed quiz explanations).
- **Validate all JSON.** Run the validation script on every quiz file before finishing.
- **Update CLAUDE.md.** After creating the package, add the new certification to the certification table in `CLAUDE.md`.
