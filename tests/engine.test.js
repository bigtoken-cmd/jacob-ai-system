import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { canTransition, evaluateResult, makeTask, retrieveMarkdown, transitionTask, validateResult, validateTask } from '../src/engine.js';
import { JsonStore } from '../src/store.js';
import { quarantineRecipe, cloneRecipe, recordRecipeOutcome } from '../src/recipes.js';
import { allocateBudget, compactText, estimateTokens } from '../src/token-budget.js';
import { buildSearchQuery, createDynamicPlan, inferTaskType } from '../src/task-planner.js';
import { prepareExecution } from '../src/orchestrator.js';

const taskInput = {
  id: 'TEST-001',
  request: 'Compare two options using verified sources.',
  goal: 'Test the universal task contract.',
  acceptanceCriteria: ['It validates']
};

test('makeTask creates a generic queued task without a domain', () => {
  const task = makeTask(taskInput);
  assert.equal(task.status, 'queued');
  assert.equal(task.taskType, null);
  assert.equal(task.approval.required, true);
  assert.deepEqual(validateTask(task), []);
});

test('state transitions support planning and reject unsafe jumps', () => {
  assert.equal(canTransition('queued', 'planning'), true);
  assert.equal(canTransition('queued', 'completed'), false);
  const planning = transitionTask(makeTask(taskInput), 'planning');
  assert.equal(planning.status, 'planning');
  assert.throws(() => transitionTask(planning, 'completed'), /invalid transition/);
});

test('result evaluation requires sources and uncertainty field', () => {
  const result = {
    taskId: 'TEST-001',
    status: 'accepted',
    content: 'A result',
    sourceIds: ['SRC-001'],
    uncertainties: [],
    nextAction: 'Review',
    createdAt: new Date().toISOString()
  };
  assert.deepEqual(validateResult(result), []);
  assert.equal(evaluateResult(result, ['SRC-001']).decision, 'pass');
  assert.equal(evaluateResult(result, ['SRC-999']).decision, 'revision-needed');
});

test('Markdown retrieval returns bounded ranked matches', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'jacob-ai-system-'));
  fs.mkdirSync(path.join(root, 'nested'));
  fs.mkdirSync(path.join(root, 'node_modules', 'package'), { recursive: true });
  fs.writeFileSync(path.join(root, 'parasyte.md'), '# PARASYTE\nUnitree design tech pack.');
  fs.writeFileSync(path.join(root, 'nested', 'school.md'), '# School\nPhysics assignment plan.');
  fs.writeFileSync(path.join(root, 'node_modules', 'package', 'README.md'), '# PARASYTE fake dependency match.');
  const results = retrieveMarkdown(root, 'PARASYTE tech pack');
  assert.equal(results.length, 1);
  assert.equal(results[0].path, 'parasyte.md');
  fs.rmSync(root, { recursive: true, force: true });
});

test('JsonStore writes atomic run records and resumes them', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'jacob-ai-store-'));
  const store = new JsonStore(root);
  const run = store.createRun('TEST-001', 'bounded-researcher');
  const finished = store.finishRun(run, 'completed', 'checks passed');
  assert.equal(store.read('runs', run.runId).status, 'completed');
  assert.equal(finished.failureCode, null);
  fs.rmSync(root, { recursive: true, force: true });
});

test('recipe promotion requires repeated success and failed recipes are quarantined', () => {
  let recipe = { recipeId: 'test-recipe', version: 1, role: 'test', status: 'experimental', tokenBudget: 100, successCount: 0, failureCodes: [], scoreHistory: [] };
  recipe = recordRecipeOutcome(recipe, { score: 0.9, passed: true });
  recipe = recordRecipeOutcome(recipe, { score: 0.9, passed: true });
  assert.equal(recipe.status, 'experimental');
  recipe = recordRecipeOutcome(recipe, { score: 0.9, passed: true });
  assert.equal(recipe.status, 'active');
  const child = cloneRecipe(recipe, { role: 'test mutation' });
  assert.equal(child.parentRecipeId, recipe.recipeId);
  assert.equal(child.status, 'experimental');
  assert.equal(quarantineRecipe(child, 'unsupported-claim').status, 'quarantined');
});

test('token controls estimate and compact context', () => {
  assert.equal(estimateTokens('12345678'), 2);
  assert.equal(compactText('a '.repeat(100), 20).endsWith('[truncated]'), true);
  const budget = allocateBudget({ contextCharacters: 4000, taskCharacters: 200 });
  assert.equal(budget.totalTokens, budget.inputTokens + budget.outputTokens);
  assert.equal(budget.maxModelCalls, 3);
});

test('dynamic planning adapts to any request type', () => {
  assert.equal(inferTaskType('Compare Unitree G1 and Figure 03'), 'comparison');
  assert.equal(inferTaskType('Find official sources about a company'), 'research');
  const task = makeTask({
    ...taskInput,
    id: 'PLAN-001',
    request: 'Research and compare three subjects.',
    goal: 'Create a source-backed comparison.',
    entities: [{ label: 'Unitree G1', type: 'subject' }, { label: 'Figure 03', type: 'subject' }],
    unknowns: ['approved output use']
  });
  const plan = createDynamicPlan(task, { contextCharacters: 4000 });
  assert.equal(plan.steps[0].id, 'clarify');
  assert.equal(plan.steps.at(-1).id, 'deliver');
  assert.equal(plan.contextPolicy.allowFullVault, false);
  assert.ok(plan.budget.totalTokens > 0);
  assert.match(buildSearchQuery(task), /Unitree G1/);
});

test('execution preparation retrieves limited context and chooses recipes', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'jacob-ai-vault-'));
  fs.writeFileSync(path.join(root, 'robot.md'), '# Unitree G1\nResearch notes for a comparison.');
  const task = makeTask({ ...taskInput, id: 'EXEC-001', request: 'Research Unitree G1', goal: 'Find verified facts', taskType: null, contextRefs: ['robot.md'] });
  const prepared = prepareExecution(task, { vaultRoot: root, recipes: [{ recipeId: 'research', status: 'experimental', capabilities: ['gather-evidence'], tokenBudget: 100 }] });
  assert.equal(prepared.task.taskType, 'research');
  assert.equal(prepared.context.length, 1);
  assert.equal(prepared.candidateRecipes[0].recipeId, 'research');
  assert.equal(prepared.plan.contextPolicy.allowFullVault, false);
  fs.rmSync(root, { recursive: true, force: true });
});

test('dry-run execution works without a model provider', async () => {
  const { runDryPlan } = await import('../src/dry-run.js');
  const task = makeTask({
    ...taskInput,
    id: 'DRY-001',
    request: 'Research any subject using available sources.',
    goal: 'Produce a source-backed research result.',
    taskType: 'research'
  });
  const result = await runDryPlan(task);
  assert.equal(result.task.taskType, 'research');
  assert.equal(result.steps.length, 4);
  assert.equal(result.steps.every(step => step.check.passed), true);
  assert.equal(result.steps[0].response.provider, 'dry-run');
});

test('the same universal schema accepts unrelated task domains', () => {
  const examples = ['robot-comparison.json', 'school-support.json', 'company-research.json'];
  for (const filename of examples) {
    const task = JSON.parse(fs.readFileSync(path.join('fixtures/generic-task-examples', filename), 'utf8'));
    assert.deepEqual(validateTask(task), [], filename);
    const prepared = prepareExecution(task, { recipes: [] });
    assert.ok(prepared.plan.steps.length >= 4, filename);
    assert.equal(prepared.plan.contextPolicy.allowFullVault, false, filename);
  }
});

test('transaction planning refuses stale writes and applies one recoverable operation', async () => {
  const { applyOperation, inspectOperation, planOperation } = await import('../src/transaction.js');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'jacob-ai-transaction-'));
  fs.writeFileSync(path.join(root, 'note.md'), 'original');
  const operation = planOperation(root, [{ target: 'note.md', content: 'updated' }]);
  assert.equal(inspectOperation(root, operation).ok, true);
  fs.writeFileSync(path.join(root, 'note.md'), 'changed by someone else');
  const conflict = applyOperation(root, operation);
  assert.equal(conflict.operation.status, 'conflict');
  assert.equal(fs.readFileSync(path.join(root, 'note.md'), 'utf8'), 'changed by someone else');
  const retry = planOperation(root, [{ target: 'note.md', content: 'updated safely' }]);
  const applied = applyOperation(root, retry);
  assert.equal(applied.operation.status, 'applied');
  assert.equal(fs.readFileSync(path.join(root, 'note.md'), 'utf8'), 'updated safely');
  fs.rmSync(root, { recursive: true, force: true });
});

test('local vault config resolves an ignored path and index records only eligible Markdown', async () => {
  const { loadLocalEnv, resolveVaultRoot } = await import('../src/config.js');
  const { buildVaultIndex, saveVaultIndex } = await import('../src/indexer.js');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'jacob-ai-vault-'));
  fs.mkdirSync(path.join(root, 'node_modules', 'dependency'), { recursive: true });
  fs.writeFileSync(path.join(root, 'note.md'), '# note');
  fs.writeFileSync(path.join(root, 'node_modules', 'dependency', 'README.md'), '# ignored');
  const envPath = path.join(root, '.env');
  fs.writeFileSync(envPath, `OBSIDIAN_VAULT_PATH=${root}\n`);
  assert.equal(resolveVaultRoot(null, loadLocalEnv(envPath)), root);
  const index = buildVaultIndex(root);
  assert.equal(index.fileCount, 1);
  assert.equal(index.files[0].path, 'note.md');
  const output = saveVaultIndex(index, path.join(root, '.runtime', 'index.json'));
  assert.equal(fs.existsSync(output), true);
  fs.rmSync(root, { recursive: true, force: true });
});

test('OpenAI provider configuration stays provider-neutral until an explicit run', async () => {
  const { createConfiguredProvider } = await import('../src/provider.js');
  const { buildOpenAIPrompt } = await import('../src/openai-provider.js');
  const provider = createConfiguredProvider({ AI_PROVIDER: 'openai', OPENAI_API_KEY: 'test-key', OPENAI_MODEL: 'gpt-test' });
  assert.equal(provider.name, 'openai');
  assert.equal(provider.model, 'gpt-test');
  const prompt = buildOpenAIPrompt({ task: { request: 'test' }, step: { objective: 'verify' }, context: [{ path: 'note.md', snippet: 'evidence' }] });
  assert.equal(prompt.includes('test-key'), false);
  assert.equal(prompt.includes('note.md'), true);
});

test('provider inspection never exposes credentials and reports missing setup', async () => {
  const { inspectProvider } = await import('../src/provider.js');
  const dryRun = inspectProvider({ AI_PROVIDER: 'dry-run' });
  assert.equal(dryRun.ready, true);
  const missing = inspectProvider({ AI_PROVIDER: 'openai' });
  assert.equal(missing.ready, false);
  assert.deepEqual(missing.missing, ['OPENAI_API_KEY']);
  const unsupported = inspectProvider({ AI_PROVIDER: 'unknown-provider' });
  assert.equal(unsupported.ready, false);
  assert.equal(JSON.stringify(unsupported).includes('sk-'), false);
});

test('usage accounting measures cost per accepted result', async () => {
  const { makeUsageEvent, summarizeUsage } = await import('../src/usage.js');
  const events = [
    makeUsageEvent({ taskId: 'USAGE-001', provider: 'dry-run', inputTokens: 100, outputTokens: 20, estimatedCost: 0.01, accepted: true }),
    makeUsageEvent({ taskId: 'USAGE-002', provider: 'dry-run', inputTokens: 200, outputTokens: 30, estimatedCost: 0.02, accepted: false, failureCode: 'unsupported-claim' })
  ];
  const summary = summarizeUsage(events);
  assert.equal(summary.totalTokens, 350);
  assert.equal(summary.acceptedResults, 1);
  assert.equal(summary.costPerAcceptedResult, 0.03);
  assert.equal(summary.tokensPerAcceptedResult, 350);
});
