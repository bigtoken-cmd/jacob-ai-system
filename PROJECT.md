# Project Definition

## Product promise

Turn any natural-language request into a bounded, source-grounded, resumable workflow that uses the fewest model calls and the smallest relevant context while preserving human control.

## What this is

This is a general-purpose AI operating system and process template. It is not built around PARASYTE, school, website work, robots, or any other single goal.

Those are evaluation environments used to prove that the core can adapt.

## Universal task contract

A task carries only universal information:

- Request and intended goal
- Relevant context references
- Constraints and rules
- Optional entities or subjects
- Desired deliverable
- Acceptance criteria
- Unknowns that may block correctness
- Approval boundaries

Task-specific fields are generated dynamically or supplied by optional adapters. They are never required globally.

## Core loop

1. Intake a request.
2. Infer the task shape without pretending certainty.
3. Ask only questions that block a correct result.
4. Retrieve the smallest useful context packet.
5. Select or create a bounded recipe.
6. Execute with a token and tool budget.
7. Verify against sources, constraints, and acceptance criteria.
8. Deliver the result, uncertainties, and next action.
9. Record useful state and evidence.
10. Promote, mutate, quarantine, or retire recipes based on independent evidence.

## Recipe evolution

A successful recipe means its repeatable process, not its entire conversation, is reusable. A recipe may be promoted after repeated success across held-out tasks. A failed recipe is first quarantined with a failure code so temporary failures are not confused with bad methods.

## Layers

- **Obsidian:** readable memory, raw sources, decisions, project state, and human review.
- **Repository:** schemas, deterministic engine, retrieval, budgeting, recipes, evaluators, and tests.
- **Conductor:** isolated coding-agent workspaces and review flow.
- **Aside:** browser actions, account-connected work, and approval boundaries.
- **Model providers:** replaceable execution providers, not the source of truth.

## Explicit non-goals

- No public SaaS product yet.
- No foundational-model training.
- No unrestricted autonomous agent swarm.
- No automatic outreach, publishing, purchases, payments, or school submissions.
- No full-vault context injection by default.
- No success decision based only on an agent's self-rating.
