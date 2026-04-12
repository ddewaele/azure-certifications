# Microsoft Azure Certifications

A hands-on study repo for Microsoft Azure certifications. Each certification has its own folder with concept guides, hands-on labs, a quiz bank, and reference cheatsheets.

---

## Certifications

| Certification | Level | Concepts | Labs | Quizzes |
|---|---|---|---|---|
| [AZ-900 — Azure Fundamentals](./az-900/README.md) | Foundational | 10 | 12 | 12 files |
| [AZ-104 — Azure Administrator Associate](./az-104/README.md) | Associate | 5 | 7 | 28 files / 560 questions |
| [AI-900 — Azure AI Fundamentals](./ai-900/README.md) | Foundational | 5 | 5 | 4 files |
| [AI-102 — Azure AI Engineer Associate](./ai-102/README.md) | Associate | 6 | 5 | 2 files |
| [AB-900 — M365 Copilot and Agent Admin Fundamentals](./ab-900/README.md) | Foundational | 3 | 4 | 2 files |

---

## What's Inside Each Certification

Every certification folder follows the same layout:

```
<cert>/
├── README.md              # Exam overview, study plan, resource links
├── concepts/              # Markdown guides per exam domain (numbered)
├── labs/                  # Step-by-step Azure CLI / portal walkthroughs
├── quiz/                  # JSON question banks for exam prep
├── glossary.md            # Key term definitions
└── microsoft-learn-toc.md # Microsoft Learn path mapping
```

### AZ-900 — Azure Fundamentals
Core cloud and Azure concepts: cloud models, pricing, SLA, core services, security, compliance, and governance.

### AZ-104 — Azure Administrator Associate
Day-to-day Azure administration across five domains:

| Domain | Weight |
|--------|--------|
| Manage Azure identities and governance | 20–25% |
| Implement and manage storage | 15–20% |
| Deploy and manage Azure compute resources | 20–25% |
| Implement and manage virtual networking | 15–20% |
| Monitor and maintain Azure resources | 10–15% |

Includes an extensive [troubleshooting guide](./az-104/troubleshooting/README.md) and dedicated CLI + PowerShell cheatsheets.

### AI-900 — Azure AI Fundamentals
AI and ML concepts on Azure: Cognitive Services, Azure Machine Learning, responsible AI, language and vision workloads.

### AI-102 — Azure AI Engineer Associate
Building AI solutions: Azure AI Services, Azure OpenAI, document intelligence, knowledge mining, and Copilot extensions.

### AB-900 — M365 Copilot and Agent Admin Fundamentals
Microsoft Copilot administration: Copilot for M365, Copilot Studio, agent management, governance, and licensing.

---

## Quiz CLI

An interactive terminal quiz app built on Node.js. Supports single-select and multi-select questions, bookmarking, hints, and a 70% pass threshold.

**Requires Node.js 16+** — no dependencies, runs directly from the repo.

```bash
# Run quizzes for a specific certification
node cli/cli.js az-900/quiz
node cli/cli.js az-104/quiz
node cli/cli.js ai-900/quiz
node cli/cli.js ai-102/quiz
node cli/cli.js ab-900/quiz
```

The CLI presents a file picker listing all quizzes in the folder — select one to start. See [quiz/README.md](./quiz/README.md) for the JSON schema used to author questions.

---

## Shared Resources

- [Azure CLI Setup](./guides/01-azure-cli-setup.md) — install, authenticate, set defaults, create your first resource group
- [Quiz JSON Schema](./quiz/README.md) — format reference for authoring new quiz questions

---

## Troubleshooting

- [Common errors index](./troubleshooting/README.md)
- [MissingSubscriptionRegistration](./troubleshooting/missing-subscription-registration.md) — resource provider not registered on subscription
