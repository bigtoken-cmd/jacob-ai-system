# Build Plan

Each phase is complete only when its acceptance test passes and `STATE.md` is updated.

## Phase 0: Real task definition

- Define one representative task for PARASYTE, school, and Lincoln prospects.
- Capture inputs, expected outputs, sources, constraints, approval points, and acceptance tests.
- Do not build a generic swarm before these tasks are concrete.

**Gate:** three task cards exist and a human can judge success for each.

## Phase 1: Raw source collection

- Collect original ChatGPT exports or supplied conversations.
- Collect relevant Aside transcripts, project files, examples, corrections, and rejected outputs.
- Label source dates, ownership, and reliability.

**Gate:** each pilot task has enough raw material for a grounded test.

## Phase 2: Knowledge and repository foundation

- Keep the live Obsidian vault separate from the code repository.
- Create the control documents and starter note structure.
- Create schemas for tasks, sources, results, evaluations, and project state.

**Gate:** a fresh agent can understand current work from `PROJECT.md`, `STATE.md`, the task card, and selected sources.

## Phase 3: Deterministic core

- Implement task creation, state transitions, validation, deduplication, and resumable run records.
- Add lightweight Markdown retrieval with bounded results.
- Add tests before model calls.

**Gate:** the core manages a fake task correctly without an AI model.

## Phase 4: One-agent execution

- Use one bounded agent recipe.
- Provide only the current task, relevant sources, constraints, and acceptance criteria.
- Save result, sources used, uncertainty, and next action.

**Gate:** the one-agent baseline can complete the three pilot tasks with inspectable outputs.

## Phase 5: Independent evaluation

- Add deterministic checks for required fields, sources, duplicates, and task status.
- Add a separate reviewer rubric.
- Track failures by cause.

**Gate:** every result is passed, revision-needed, or blocked with a reason.

## Phase 6: Conductor workflow

- Use one Conductor workspace for implementation and review on one branch.
- Use separate workspaces for independent experiments.
- Run validation and tests through Conductor actions.
- Review diffs before merging.

**Gate:** the repository can be opened, tested, reviewed, and resumed in a new workspace.

## Phase 7: Domain packs

- Add PARASYTE, school, and Lincoln-prospect rules as separate packs.
- Keep shared execution logic separate from domain constraints.

**Gate:** a new domain can be added by creating a pack and tests rather than rewriting the core.

## Phase 8: Controlled recipe improvement

- Version prompts and tool permissions.
- Promote recipes only after repeated success on held-out tasks.
- Quarantine failed recipes with failure codes.
- Clone only the winning configuration, not full transcripts.

**Gate:** the system can explain why a recipe was promoted, changed, or archived.

## Phase 9: Real pilots and measurement

- Run at least three real tasks in each domain.
- Measure accepted-result time, corrections, unsupported claims, token/cost estimates, and human interventions.
- Compare against the manual baseline.

**Gate:** measured improvement is large enough to justify continuing.

## Phase 10: Daily-use release

- Add approval queue, safe external-action boundaries, backups, and recovery instructions.
- Document how Jacob starts, pauses, reviews, and resumes work.

**Gate:** the system is understandable, recoverable, and useful without requiring a full conversation replay.
