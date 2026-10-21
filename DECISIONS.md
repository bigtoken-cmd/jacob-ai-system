# Decisions

## 2026-10-20: Separate code, knowledge, and execution

Obsidian is readable knowledge, the Git repository is deterministic system code, Conductor is isolated development, and Aside is the browser/action and approval layer.

## 2026-10-20: Start with one agent

A one-agent baseline must work before multi-agent execution is allowed.

## 2026-10-20: Quarantine failures

Failed recipes are preserved with failure codes before retirement is considered.

## 2026-10-20: Generic task envelope

Domain-specific fields are optional task context, not globally required fields. The universal contract contains request, goal, context references, constraints, deliverable, acceptance criteria, unknowns, and approval boundaries.

## 2026-10-20: Domain work is evaluation, not architecture

PARASYTE, school, and website prospect work will test whether the core generalizes. The core must not be shaped around those examples.

## 2026-10-20: Bounded context by default

The system retrieves a small ranked context packet and never injects the full vault by default.

## 2026-10-21: Borrow patterns, not whole frameworks

External projects mentioned in the TikTok research were reviewed for ideas. We adopted provenance ledgers, raw-to-knowledge flow, explicit ingestion, read-only verification, cost visibility, and single-writer transactions without adding a large third-party swarm dependency.

## 2026-10-21: One writer for vault mutations

Parallel workers may return drafts and evidence, but one inspected operation applies changes. A changed target is a conflict, not a silent overwrite.
