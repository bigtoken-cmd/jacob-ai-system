import fs from 'node:fs';
import { buildSearchQuery, createDynamicPlan, inferTaskType } from './task-planner.js';
import { retrieveMarkdown } from './engine.js';

export function loadRecipeRegistry(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return [];
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return data.recipes ?? [];
}

export function selectRecipes(task, recipes) {
  const taskType = task.taskType ?? inferTaskType(task.request);
  const keywords = new Set(`${task.request} ${task.goal} ${taskType}`.toLowerCase().split(/\W+/).filter(Boolean));
  return [...recipes]
    .filter(recipe => recipe.status !== 'quarantined' && recipe.status !== 'retired')
    .map(recipe => ({ recipe, score: (recipe.capabilities ?? []).reduce((score, capability) => score + (keywords.has(capability.toLowerCase()) ? 1 : 0), 0) }))
    .sort((a, b) => b.score - a.score || (a.recipe.tokenBudget ?? Infinity) - (b.recipe.tokenBudget ?? Infinity))
    .map(item => item.recipe);
}

export function prepareExecution(task, { vaultRoot = null, recipes = [] } = {}) {
  const taskType = task.taskType ?? inferTaskType(task.request);
  const query = buildSearchQuery({ ...task, taskType });
  const context = vaultRoot ? retrieveMarkdown(vaultRoot, query, 8, 12000) : [];
  const contextCharacters = context.reduce((total, item) => total + item.snippet.length, 0);
  const normalizedTask = { ...task, taskType };
  return {
    task: normalizedTask,
    query,
    context,
    plan: createDynamicPlan(normalizedTask, { contextCharacters, confidence: context.length ? 0.65 : 0.35 }),
    candidateRecipes: selectRecipes(normalizedTask, recipes)
  };
}
