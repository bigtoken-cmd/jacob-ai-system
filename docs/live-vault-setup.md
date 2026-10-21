# Local Vault Setup

The core can run without a live vault or model provider. For a local read-only Obsidian source:

1. Make a copy of the vault you want the system to read.
2. Put its absolute path in the ignored `.env` file:

```text
OBSIDIAN_VAULT_PATH=/absolute/path/to/selected-copy
```

3. Build a metadata-only index:

```bash
node src/cli.js index
```

4. Test bounded retrieval using the configured vault:

```bash
node src/cli.js search "PARASYTE"
```

5. Plan or dry-run any task against the configured vault:

```bash
node src/cli.js plan fixtures/task.example.json
node src/cli.js dry-run fixtures/task.example.json
```

The index stores paths, sizes, modification times, and hashes. It does not copy note contents into the repository. Generated folders such as `.obsidian`, `.git`, `node_modules`, build output, and caches are excluded.

A real model provider is optional until the dry-run and retrieval behavior are accepted. Once `doctor` reports `provider-configured-not-tested`, a model-backed run is available with:

```bash
node src/cli.js run fixtures/task.example.json
```

This command sends task context to the configured provider and may incur provider charges. Keep it manual and approval-gated; never make it the default Conductor script.
