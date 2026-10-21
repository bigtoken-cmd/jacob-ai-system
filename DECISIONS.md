# Decisions

## 2026-10-20: Separate code, knowledge, and execution

- Obsidian is the readable knowledge layer.
- The Git repository is the deterministic system and recipe layer.
- Conductor is the isolated development and review layer.
- Aside remains the browser/action and approval layer.

Reason: this keeps the vault readable, the code testable, and agent work isolated.

## 2026-10-20: Start with one agent

A single bounded agent plus deterministic validation must work before agent multiplication is allowed.

Reason: multiple agents can increase cost, duplication, and debugging difficulty without proving usefulness.

## 2026-10-20: Quarantine failures

Failed recipes are archived with failure reasons before deletion is considered.

Reason: temporary tool failure, missing context, and bad task definitions are different from a bad recipe.

## 2026-10-20: Human approval boundaries

No autonomous outreach, publishing, purchases, payments, school submissions, or irreversible external actions.

Reason: these actions have real consequences and require Jacob's judgment.
