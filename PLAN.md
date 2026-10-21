# Build Plan

This plan builds a reusable task-processing engine. PARASYTE, school, and website research are test suites, not the architecture.

## Phase 0: Universal requirements

- Define the product promise and non-goals.
- Define the universal task envelope.
- Define the meaning of success, failure, promotion, quarantine, and completion.
- Select representative tasks from several unrelated domains.

**Gate:** a task can be described without domain-specific required fields.

## Phase 1: Raw source collection

- Collect original conversations, files, examples, corrections, and rejected outputs.
- Keep summaries separate from original evidence.
- Record source dates, provenance, and freshness.

**Gate:** a task can reference raw sources without copying the entire history into a prompt.

## Phase 2: Knowledge foundation

- Keep the live Obsidian vault separate from the code repository.
- Add generic task, evidence, project-state, run, and recipe templates.
- Add source linking and a bounded inbox.

**Gate:** a new task can be stored and resumed from a short state record.

## Phase 3: Deterministic core

- Validate universal task envelopes.
- Track state transitions and resumable runs.
- Deduplicate tasks and records.
- Retrieve bounded Markdown context.
- Estimate tokens and enforce budgets.

**Gate:** the core can plan and validate a task without a model.

## Phase 4: Dynamic planning

- Infer a provisional task type from the request.
- Generate only the steps needed for that request.
- Ask only blocking questions.
- Load optional domain adapters only when relevant.

**Gate:** the same engine can plan research, comparison, coding, drafting, analysis, planning, or an unfamiliar task.

## Phase 5: One-agent baseline

- Connect one replaceable model provider.
- Run a bounded recipe with selected context and structured output.
- Save sources, uncertainty, budget, result, and next action.

**Gate:** one agent can complete representative tasks with inspectable evidence.

## Phase 6: Independent evaluation

- Add deterministic checks.
- Add independent review recipes.
- Add held-out task examples.
- Classify failures by cause.

**Gate:** the system can explain why a result passed, needs revision, or is blocked.

## Phase 7: Recipe evolution

- Promote repeated winners.
- Clone only recipe configuration and small controlled mutations.
- Quarantine repeated failures.
- Retire recipes only after preserving failure evidence.

**Gate:** improvement is measured against the previous recipe and does not consume more resources than it saves.

## Phase 8: Multi-agent execution

- Add multiple agents only where independent perspectives or sequential capabilities improve results.
- Use bounded fan-out and one verifier.
- Stop when acceptance criteria pass.

**Gate:** multi-agent runs beat the one-agent baseline on accepted-result cost and quality.

## Phase 9: Domain adapters as tests

- Run the same generic core on Unitree G1, Figure 03, and 1X NEO research.
- Run one school task and one website-prospect task.
- Keep adapter instructions optional and isolated.

**Gate:** domain-specific details do not leak into the universal contract.

## Phase 10: Daily-use release

- Add safe approvals, backups, recovery, and provider configuration.
- Measure time to accepted result, correction rate, unsupported claims, token usage, and human interventions.

**Gate:** the system is useful, understandable, and recoverable across unrelated tasks.
