import fs from 'node:fs';
import path from 'node:path';
import { evaluateResult, retrieveMarkdown, validateResult, validateTask } from './engine.js';
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
  const vaultRoot = process.argv[4] ? path.resolve(process.argv[4]) : null;
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
  const vaultRoot = process.argv[4] ? path.resolve(process.argv[4]) : null;
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
  const root = process.argv[3];
  const query = process.argv.slice(4).join(' ');
  if (!root || !query) {
    console.error('Usage: node src/cli.js search <markdown-root> <query>');
    process.exit(1);
  }
  console.log(JSON.stringify(retrieveMarkdown(root, query), null, 2));
  process.exit(0);
}

console.log('Commands: validate, plan <task-json> [markdown-root], dry-run <task-json> [markdown-root], search <markdown-root> <query>');
process.exit(command ? 1 : 0);
