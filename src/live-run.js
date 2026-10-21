import fs from 'node:fs';
import path from 'node:path';
import { executeStep } from './executor.js';
import { prepareExecution } from './orchestrator.js';
import { createConfiguredProvider } from './provider.js';

export async function runConfiguredPlan(task, { vaultRoot = null, registryPath = 'recipes/registry.json', env } = {}) {
  const registry = fs.existsSync(registryPath) ? JSON.parse(fs.readFileSync(registryPath, 'utf8')).recipes ?? [] : [];
  const prepared = prepareExecution(task, { vaultRoot, recipes: registry });
  const provider = createConfiguredProvider(env);
  const steps = [];
  for (const step of prepared.plan.steps) {
    const result = await executeStep({ provider, task: prepared.task, step, context: prepared.context, budget: prepared.plan.budget });
    steps.push({ stepId: step.id, capability: step.capability, ...result });
    if (!result.check.passed) break;
  }
  return { ...prepared, provider: provider.name, steps };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const taskPath = process.argv[2];
  if (!taskPath) {
    console.error('Usage: node src/live-run.js <task-json> [markdown-vault-root]');
    process.exit(1);
  }
  const task = JSON.parse(fs.readFileSync(path.resolve(taskPath), 'utf8'));
  const result = await runConfiguredPlan(task, { vaultRoot: process.argv[3] ? path.resolve(process.argv[3]) : null });
  console.log(JSON.stringify(result, null, 2));
}
