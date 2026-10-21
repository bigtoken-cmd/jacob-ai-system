# Current State

## Current phase

Phase 4: Dynamic planning

## Verified complete

- A universal task envelope no longer requires a domain field.
- Optional entities, deliverables, capabilities, unknowns, custom context, and approval boundaries are supported.
- Generic task planning can infer provisional task types and generate clarify, retrieve, execute, verify, and deliver steps.
- Bounded Markdown retrieval, token estimation, context limits, JSON run persistence, and recipe promotion/quarantine are implemented.
- Provenance-aware source fields and a single-writer transaction layer now preserve hashes, detect stale writes, and apply recoverable changes atomically.
- Usage events now measure calls, input/output tokens, estimated cost, accepted results, and cost per accepted result.
- Generic raw, knowledge, outputs, and operations vault folders and templates are included.
- PARASYTE, school, and Lincoln prospect cards exist as evaluation fixtures rather than universal requirements.
- `node src/cli.js validate` passes.
- `node --test` passes the generic core tests.

## Not yet verified

- No live Obsidian vault is connected.
- No raw ChatGPT export has been supplied.
- No model provider is connected to the runtime.
- No real task has completed through the model execution layer.
- Recipe quality has not been measured on held-out real tasks.
- Multi-agent execution has not been enabled.
- No third-party swarm or second-brain repository has been installed; useful patterns were implemented selectively in our own code.
- External pattern review is documented in `docs/external-patterns.md`.

## Current blockers

1. A selected Obsidian copy or vault path is needed for live retrieval tests.
2. A model provider connection is needed for real execution.
3. Original source material is needed for meaningful evaluation.
4. The system still needs provider-neutral execution and evaluation adapters.

## Exact next build actions

1. Add generic Obsidian task, evidence, plan, run, recipe, and approval templates.
2. Add a provider-neutral execution interface with a dry-run provider.
3. Add tests showing the same core can plan Unitree research, a school task, and a website-prospect task without changing the universal schema.
4. Use Unitree G1, Figure 03, and 1X NEO as the first research evaluation set, not as hardcoded architecture.
