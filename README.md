# Jacob AI System

A private, multi-domain work system for PARASYTE, school, and Lincoln website prospects.

## The split

- **Obsidian** stores readable knowledge, sources, decisions, project state, and human notes.
- **This repository** stores schemas, deterministic code, agent recipes, tests, and domain rules.
- **Conductor** provides isolated coding-agent workspaces for building and reviewing this repository.
- **Aside** remains the browser/action and approval layer when an external website or account is involved.

This repository intentionally starts without autonomous outreach, publishing, purchases, school submissions, or full-vault access.

## Current status

Read `STATE.md`. Attempted work is not treated as completed until its checks pass.

## First local check

```bash
node src/cli.js validate
node --test
```

## Obsidian

Copy `obsidian-starter/` into a selected Obsidian vault only after reviewing the templates. Keep the live vault outside this repository unless you intentionally choose to version it.

## Conductor

Open this repository in Conductor. The repository includes `.conductor/settings.toml` with a validation action. Start with one workspace named `foundation-state-and-schemas`.
