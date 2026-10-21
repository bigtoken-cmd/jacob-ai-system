import fs from 'node:fs';
import path from 'node:path';
import { evaluateResult, retrieveMarkdown, validateResult, validateTask } from './engine.js';
import { resolveVaultRoot } from './config.js';
import { buildVaultIndex, saveVaultIndex } from './indexer.js';
import { inspectProvider } from './provider.js';
import { loadRecipeRegistry, prepareExecution } from './orchestrator.js';
import { runDryPlan } from './dry-run.js';

const command = process.argv[2];

if (command === 'validate') {
  const taskPath = path.resolve('fixtures/task.example.json');
  const resultPath = path.resolve('fixtures/result.example.json');
  const task = JSON.parse(fs.readFileSync(taskPath, 'utf8'));
  const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  const taskErrors = validateTask(task);
  const resultErrors = validateResult(result);
  const evaluation = evaluateResult(result, task.contextRefs);
  console.log(JSON.stringify({ taskErrors, resultErrors, evaluation }, null, 2));
  process.exit(taskErrors.length || resultErrors.length || evaluation.decision !== 'pass' ? 1 : 0);
}

if (command === 'plan') {
  const taskPath = process.argv[3];
  const vaultRoot = resolveVaultRoot(process.argv[4]);
  if (!taskPath) {
    console.error('Usage: node src/cli.js plan <task-json> [markdown-vault-root]');
    process.exit(1);
  }
  const task = JSON.parse(fs.readFileSync(path.resolve(taskPath), 'utf8'));
  const recipes = loadRecipeRegistry(path.resolve('recipes/registry.json'));
  const prepared = prepareExecution(task, { vaultRoot, recipes });
  console.log(JSON.stringify(prepared, null, 2));
  process.exit(0);
}

if (command === 'dry-run') {
  const taskPath = process.argv[3];
  const vaultRoot = resolveVaultRoot(process.argv[4]);
  if (!taskPath) {
    console.error('Usage: node src/cli.js dry-run <task-json> [markdown-vault-root]');
    process.exit(1);
  }
  const task = JSON.parse(fs.readFileSync(path.resolve(taskPath), 'utf8'));
  const result = await runDryPlan(task, { vaultRoot, registryPath: path.resolve('recipes/registry.json') });
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.steps.every(step => step.check.passed) ? 0 : 1);
}

if (command === 'search') {
  const possibleRoot = process.argv[3];
  const hasExplicitRoot = Boolean(possibleRoot && fs.existsSync(path.resolve(possibleRoot)));
  const root = resolveVaultRoot(hasExplicitRoot ? possibleRoot : null);
  const query = process.argv.slice(hasExplicitRoot ? 4 : 3).join(' ');
  if (!root || !query) {
    console.error('Usage: node src/cli.js search [markdown-root] <query>');
    process.exit(1);
  }
  console.log(JSON.stringify(retrieveMarkdown(root, query), null, 2));
  process.exit(0);
}

if (command === 'index') {
  const root = resolveVaultRoot(process.argv[3]);
  if (!root) {
    console.error('Usage: node src/cli.js index [markdown-root]');
    process.exit(1);
  }
  const index = buildVaultIndex(root);
  const output = saveVaultIndex(index, path.resolve('.runtime', 'vault-index.json'));
  console.log(JSON.stringify({ output, ...index }, null, 2));
  process.exit(0);
}

if (command === 'doctor') {
  const root = resolveVaultRoot();
  const indexPath = path.resolve('.runtime', 'vault-index.json');
  const vault = root ? { configured: true, exists: fs.existsSync(root), root, indexExists: fs.existsSync(indexPath) } : { configured: false, exists: false, root: null, indexExists: false };
  const provider = inspectProvider();
  console.log(JSON.stringify({ vault, provider, next: provider.ready ? 'ready-for-dry-run' : 'configure-provider' }, null, 2));
  process.exit(vault.configured && vault.exists && provider.ready ? 0 : 1);
}

console.log('Commands: validate, plan <task-json> [markdown-root], dry-run <task-json> [markdown-root], search [markdown-root] <query>, index [markdown-root], doctor');
process.exit(command ? 1 : 0);
