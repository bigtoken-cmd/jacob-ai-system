export function recordRecipeOutcome(recipe, { score, passed, failureCode = null }) {
  const next = {
    ...recipe,
    scoreHistory: [...(recipe.scoreHistory ?? []), score],
    successCount: (recipe.successCount ?? 0) + (passed ? 1 : 0),
    failureCodes: failureCode ? [...new Set([...(recipe.failureCodes ?? []), failureCode])] : [...(recipe.failureCodes ?? [])]
  };
  if (!passed && next.failureCodes.length >= 3) next.status = 'quarantined';
  if (passed && next.successCount >= 3 && next.status === 'experimental') next.status = 'active';
  return next;
}

export function cloneRecipe(recipe, mutation = {}) {
  return {
    ...recipe,
    ...mutation,
    recipeId: `${recipe.recipeId}-v${recipe.version + 1}`,
    version: recipe.version + 1,
    parentRecipeId: recipe.recipeId,
    status: 'experimental',
    successCount: 0,
    failureCodes: [],
    scoreHistory: []
  };
}

export function quarantineRecipe(recipe, reason) {
  return { ...recipe, status: 'quarantined', failureCodes: [...new Set([...(recipe.failureCodes ?? []), reason])] };
}
