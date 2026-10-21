import { estimateTokens } from './token-budget.js';
import { now } from './engine.js';

export function createDryRunProvider() {
  return {
    name: 'dry-run',
    async complete({ task, step, context }) {
      const sourceIds = context.map(item => item.sourceId ?? item.path).filter(Boolean);
      return {
        provider: 'dry-run',
        status: 'simulated',
        content: `[DRY RUN] ${step.objective}`,
        sourceIds,
        uncertainties: ['No model provider is connected.'],
        nextAction: 'Connect an approved provider or continue inspecting the generated plan.',
        usage: { inputTokens: estimateTokens(JSON.stringify({ task, step, context })), outputTokens: 40 },
        createdAt: now()
      };
    }
  };
}

export function validateProviderResponse(response) {
  const errors = [];
  if (!response || typeof response !== 'object') return ['provider response must be an object'];
  for (const field of ['provider', 'status', 'content', 'sourceIds', 'uncertainties', 'nextAction', 'createdAt']) {
    if (response[field] === undefined || response[field] === null) errors.push(`missing ${field}`);
  }
  if (!Array.isArray(response.sourceIds)) errors.push('sourceIds must be an array');
  if (!Array.isArray(response.uncertainties)) errors.push('uncertainties must be an array');
  if (response.usage && (!Number.isInteger(response.usage.inputTokens) || !Number.isInteger(response.usage.outputTokens))) errors.push('usage token counts must be integers');
  return errors;
}

export function enforceBudget(response, budget) {
  const errors = validateProviderResponse(response);
  const used = (response.usage?.inputTokens ?? 0) + (response.usage?.outputTokens ?? 0);
  if (budget && used > budget.totalTokens) errors.push(`token budget exceeded: ${used} > ${budget.totalTokens}`);
  return { passed: errors.length === 0, errors, usedTokens: used };
}

export async function executeStep({ provider, task, step, context = [], budget }) {
  if (!provider || typeof provider.complete !== 'function') throw new Error('provider.complete is required');
  const response = await provider.complete({ task, step, context, budget });
  const check = enforceBudget(response, budget);
  return { response, check };
}
