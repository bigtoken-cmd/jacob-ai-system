# Jacob AI System

A general-purpose AI operating system and process template for turning any request into a bounded, source-grounded, resumable workflow.

## Core loop

Intake -> infer -> clarify only blockers -> retrieve minimal context -> select recipe -> execute -> verify -> deliver -> record -> improve.

## The split

- **Obsidian:** readable memory, sources, decisions, project state, and review.
- **Repository:** universal schemas, deterministic state, retrieval, budgets, recipes, evaluation, and tests.
- **Conductor:** isolated coding-agent workspaces and code review.
- **Aside:** browser actions and human approvals.

PARASYTE, school, and website prospect work are test environments only. The task contract is intentionally not robot-, school-, or sales-specific.

## Local checks

```bash
node src/cli.js validate
node --test
node src/cli.js plan fixtures/task.example.json
```

## Obsidian

Use the generic templates in `obsidian-starter/90-System/`. Keep the live vault outside this repository unless you intentionally choose to version it.

## Current status

Read `STATE.md`. Attempted work is not treated as completed until its checks pass.
