# AZ-104 Exam Prep — Cram Pack

Last-mile material for the AZ-104 exam. Tables and bullets, not paragraphs. Designed for the day before the exam.

## Files

| File | Use |
|------|-----|
| [01-identity-cheatsheet.md](01-identity-cheatsheet.md) | Domain 1: Identity & Governance (15–20%) |
| [02-storage-cheatsheet.md](02-storage-cheatsheet.md) | Domain 2: Storage (15–20%) |
| [03-compute-cheatsheet.md](03-compute-cheatsheet.md) | Domain 3: Compute (20–25%) |
| [04-networking-cheatsheet.md](04-networking-cheatsheet.md) | Domain 4: Networking (15–20%) |
| [05-monitor-cheatsheet.md](05-monitor-cheatsheet.md) | Domain 5: Monitor & Maintain (10–15%) |
| [exam-traps.md](exam-traps.md) | Cross-domain "looks obvious but isn't" — read this twice |
| [numbers-and-limits.md](numbers-and-limits.md) | Specific values to memorize (sizes, ports, TTLs, prefixes) |
| [decision-guide.md](decision-guide.md) | "Scenario → answer" patterns for the 60% of questions that follow templates |

---

## Exam format

| Property | Value |
|----------|-------|
| Length | 100 minutes |
| Questions | 40–60 |
| Pass score | **700 / 1000** (~70%) |
| Cost | $165 USD |
| Languages | English + ~10 others |
| Retake policy | 24h after 1st fail, 14d after 2nd, max 5 per year |

### Question types

| Type | What it looks like | Tactical tip |
|------|-------------------|--------------|
| **Single multiple choice** | "What should you do?" | Default form, ~50% of questions |
| **Multi-select** | "Which TWO actions should you perform?" | Read the count carefully |
| **Yes/No solution series** | "Solution: X. Does this meet the goal? Yes / No." | 3 questions in a row with the SAME goal but different solutions — each is independent, multiple Yes answers are possible |
| **Drag-and-drop / sequence** | "Place the steps in the correct order" | Order matters — re-read after placing |
| **Hotspot** | Click a region of a screenshot | Look for the exact label/icon — they're testing UI navigation |
| **Case study** | Long scenario + 5–10 questions | Read the scenario ONCE end-to-end, then answer; you can navigate back |
| **Lab tasks** | Live Azure portal | If they appear, do them last — 30+ min |

### Question phrasing — the constraint clue

The phrase tells you which answer to pick:

| Phrase | Optimize for |
|--------|--------------|
| "minimize administrative effort" | Built-in features over custom scripts; managed identities over secrets; templates over manual |
| "minimize cost" | Smaller SKU, LRS over GRS, basic over standard, autoscale-to-zero, dev/test pricing |
| "minimum required permissions" | Least-privilege built-in role, not Owner |
| "ensure high availability" | Availability Zones, geo-redundant, Standard SKU |
| "encrypted at rest" | SSE / customer-managed keys / Azure Disk Encryption |
| "from on-premises" | VPN/ExpressRoute, hybrid identity, Azure Arc |
| "without exposing" | Private endpoint, service endpoint, Bastion |
| "must be highly available across regions" | Geo-redundant + Traffic Manager / Front Door / RA-GRS |

### "Each correct answer presents a complete solution"

When you see this, **any** working answer scores — they're testing whether you know multiple valid approaches. Pick the simplest one that meets the constraint.

### "This question is part of a series. Each question presents a unique solution."

Yes/No format. The goal is repeated; only the solution changes. **Each question is independent** — there's no "carry-over" from a previous Yes answer. Evaluate each solution against the goal in isolation.

---

## Study strategy (cramming order)

1. **[exam-traps.md](exam-traps.md)** — read it twice. These show up disproportionately.
2. **[numbers-and-limits.md](numbers-and-limits.md)** — flashcard-style. The exam tests these directly.
3. **Cheat sheets in order of weakness** — start with whichever domain you scored worst on in the practice assessment.
4. **[decision-guide.md](decision-guide.md)** — last 30 minutes before the exam.

## On the day

- **Skip on first pass** if you don't know — flag it and come back. Time pressure causes mistakes.
- **Eliminate first** — discard 2 obviously wrong answers, then choose between the remaining 2.
- **Read the LAST sentence first** in long scenarios — the actual question is usually one line at the end.
- **"Most cost-effective" + "Standard SKU"** = trick. Pick Basic if it meets the requirement.
- **"User Administrator can't manage MFA / security questions"** — that's Global Admin only. Watch for permission-scope traps.
