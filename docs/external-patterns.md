# External Pattern Review

These projects were reviewed as design references after the TikTok links. No third-party code or runtime dependency has been copied into this repository.

## Ruflo

Repository: https://github.com/ruvnet/ruflo

Useful ideas:

- Agent capability routing
- Cost and event visibility
- Optional MCP/provider integration
- Explicit swarm or mission views

Decision: do not install the full swarm runtime yet. Our bounded recipe registry, token budgets, dry-run provider, and verifier layer must prove value first.

## claude-obsidian

Repository: https://github.com/AgriciDaniel/claude-obsidian

Useful ideas:

- Immutable raw source capture
- Provenance and claim ledgers
- Explicit ingest and query operations
- One orchestrator applying one recoverable mutation transaction
- Deterministic retrieval fallback

Decision: adopted the raw/knowledge/outputs/operations layout, provenance fields, bounded retrieval, and single-writer transaction design.

## SecondBrain

Repository: https://github.com/PieroSierra/SecondBrain

Useful ideas:

- `raw/ -> wiki/ -> outputs/` flow
- Explicit ingest instead of silent mutation
- Support for replaceable agent engines
- Human-readable Markdown state

Decision: adopted the raw-to-knowledge-to-output separation, but kept our own universal task contract and provider-neutral engine.

## COG second brain

Repository: https://github.com/huytieu/COG-second-brain

Useful ideas:

- Worker and read-only verifier separation
- Markdown plus Git as the system of record
- Cross-agent skills and shared logs

Decision: adopted the worker/verifier separation concept. Multi-agent execution remains gated behind one-agent baseline tests.

## Obsidian Agent Client

Repository: https://github.com/RAIT-09/obsidian-agent-client

Useful ideas:

- Visible edits and permission prompts
- Note mentions and directory-scoped context
- Multiple replaceable agent clients

Decision: keep visible diffs and approval boundaries as future interface requirements. Do not require an Obsidian plugin for the core.
