import { now } from './engine.js';

export function makeUsageEvent({ taskId, provider, recipeId = null, inputTokens = 0, outputTokens = 0, estimatedCost = null, accepted = false, failureCode = null }) {
  return {
    eventId: `usage-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    taskId,
    provider,
    recipeId,
    inputTokens,
    outputTokens,
    estimatedCost,
    accepted,
    failureCode,
    createdAt: now()
  };
}

export function summarizeUsage(events = []) {
  const totalInputTokens = events.reduce((sum, event) => sum + (event.inputTokens ?? 0), 0);
  const totalOutputTokens = events.reduce((sum, event) => sum + (event.outputTokens ?? 0), 0);
  const totalTokens = totalInputTokens + totalOutputTokens;
  const acceptedResults = events.filter(event => event.accepted).length;
  const totalCost = events.reduce((sum, event) => sum + (event.estimatedCost ?? 0), 0);
  return {
    calls: events.length,
    totalInputTokens,
    totalOutputTokens,
    totalTokens,
    acceptedResults,
    totalCost,
    costPerAcceptedResult: acceptedResults ? totalCost / acceptedResults : null,
    tokensPerAcceptedResult: acceptedResults ? totalTokens / acceptedResults : null
  };
}
