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

Each file is a JSON array. Every question object must follow this exact schema:

```json
{
  "question_id": 1,
  "question_text": "Full question text here",
  "options": {
    "a": { "text": "Option text", "is_true": false, "explanation": "Why this is wrong" },
    "b": { "text": "Option text", "is_true": true, "explanation": "Why this is correct" },
    "c": { "text": "Option text", "is_true": false, "explanation": "Why this is wrong" },
    "d": { "text": "Option text", "is_true": false, "explanation": "Why this is wrong" }
  },
  "correct_answer": "b"
}
```

For **multiple-select** questions:

```json
{
  "question_id": 2,
  "question_type": "multiple_select",
  "question_text": "Which TWO options are correct?",
  "options": {
    "a": { "text": "...", "is_true": true, "explanation": "..." },
    "b": { "text": "...", "is_true": false, "explanation": "..." },
    "c": { "text": "...", "is_true": true, "explanation": "..." },
    "d": { "text": "...", "is_true": false, "explanation": "..." }
  },
  "correct_answer": ["a", "c"]
}
```

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
