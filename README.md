# Microsoft Azure Certifications

A hands-on study repo for Microsoft Azure certifications. Each certification has its own folder with concept guides, hands-on labs, and a quiz bank.

---

## Certifications

| Certification | Level | Status |
|---|---|---|
| [AZ-900 — Azure Fundamentals](./az-900/README.md) | Foundational | In progress |
| [AI-900 — Azure AI Fundamentals](./ai-900/README.md) | Foundational | In progress |
| [AI-102 — Azure AI Engineer Associate](./ai-102/README.md) | Associate | In progress |
| [AB-900 — M365 Copilot and Agent Admin Fundamentals](./ab-900/README.md) | Foundational | In progress |

---

## Quiz CLI

An interactive terminal quiz app for any certification's JSON question bank. Requires Node.js 16+.

```bash
node cli/cli.js <path-to-quiz-folder>

# Example — AZ-900:
node cli/cli.js az-900/quiz

# Example — AI-900:
node cli/cli.js ai-900/quiz

# Example — AI-102:
node cli/cli.js ai-102/quiz

# Example — AB-900:
node cli/cli.js ab-900/quiz
```

See [cli/](./cli/) for details.

---

## Shared Resources

These guides apply across all certifications.

- [Azure CLI Setup](./guides/01-azure-cli-setup.md) — install, authenticate, set defaults, create your first resource group

---

## Troubleshooting

Common errors and fixes encountered across labs.

- [Troubleshooting Index](./troubleshooting/README.md)
- [MissingSubscriptionRegistration](./troubleshooting/missing-subscription-registration.md) — resource provider not registered on subscription
