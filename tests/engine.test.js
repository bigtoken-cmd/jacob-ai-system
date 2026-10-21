import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { canTransition, evaluateResult, makeTask, retrieveMarkdown, transitionTask, validateResult, validateTask } from '../src/engine.js';

const taskInput = {
  id: 'TEST-001',
  domain: 'system',
  title: 'Test task',
  goal: 'Test deterministic state.',
  acceptanceCriteria: ['It validates']
};

test('makeTask creates a queued task with explicit approval', () => {
  const task = makeTask(taskInput);
  assert.equal(task.status, 'queued');
  assert.equal(task.approvalRequired, true);
  assert.deepEqual(validateTask(task), []);
});

test('state transitions reject unsafe jumps', () => {
  assert.equal(canTransition('queued', 'running'), true);
  assert.equal(canTransition('queued', 'completed'), false);
  const running = transitionTask(makeTask(taskInput), 'running');
  assert.equal(running.status, 'running');
  assert.throws(() => transitionTask(running, 'completed'), /invalid transition/);
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
  fs.writeFileSync(path.join(root, 'parasyte.md'), '# PARASYTE\nUnitree design tech pack.');
  fs.writeFileSync(path.join(root, 'nested', 'school.md'), '# School\nPhysics assignment plan.');
  const results = retrieveMarkdown(root, 'PARASYTE tech pack');
  assert.equal(results.length, 1);
  assert.equal(results[0].path, 'parasyte.md');
  fs.rmSync(root, { recursive: true, force: true });
});

import { JsonStore } from '../src/store.js';
import { cloneRecipe, quarantineRecipe, recordRecipeOutcome } from '../src/recipes.js';

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
