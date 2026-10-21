export function estimateTokens(text) {
  return Math.max(1, Math.ceil(String(text ?? '').length / 4));
}

export function compactText(text, maxCharacters) {
  const normalized = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxCharacters) return normalized;
  return `${normalized.slice(0, Math.max(0, maxCharacters - 24))} ...[truncated]`;
}

export function allocateBudget({ contextCharacters = 0, taskCharacters = 0, outputTokens = 900, maxModelCalls = 3, inputReserve = 500 } = {}) {
  const inputTokens = estimateTokens(contextCharacters + taskCharacters) + inputReserve;
  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    maxModelCalls,
    escalateAfterFailure: maxModelCalls > 1
  };
}

export function chooseContextLimit({ confidence = 0.5, taskComplexity = 'normal' } = {}) {
  const complexityMultiplier = taskComplexity === 'high' ? 1.5 : taskComplexity === 'low' ? 0.7 : 1;
  const confidenceMultiplier = confidence < 0.35 ? 1.35 : confidence > 0.8 ? 0.7 : 1;
  return Math.round(8000 * complexityMultiplier * confidenceMultiplier);
}
