import { now } from './engine.js';
import { allocateBudget, chooseContextLimit } from './token-budget.js';

const TYPE_RULES = [
  ['comparison', /\b(compare|comparison|versus|vs\.?|differences|similarities)\b/i],
  ['research', /\b(research|investigate|find out|find official sources|learn about|source|verify|look up)\b/i],
  ['planning', /\b(plan|roadmap|schedule|organize|prioritize)\b/i],
  ['drafting', /\b(write|draft|create|compose|rewrite|brief|proposal)\b/i],
  ['analysis', /\b(analy[sz]e|evaluate|review|audit|assess|judge)\b/i],
  ['coding', /\b(build|code|implement|debug|test|refactor|program)\b/i],
  ['classification', /\b(sort|classify|tag|categorize|triage)\b/i]
];

export function inferTaskType(request) {
  for (const [type, rule] of TYPE_RULES) if (rule.test(request)) return type;
  return 'general';
}

function capabilityForType(type) {
  return {
    comparison: 'compare-evidence',
    research: 'gather-evidence',
    planning: 'plan-actions',
    drafting: 'produce-draft',
    analysis: 'analyze-evidence',
    coding: 'modify-code',
    classification: 'classify-items',
    general: 'solve-task'
  }[type] ?? 'solve-task';
}

export function buildSearchQuery(task) {
  const entityText = (task.entities ?? []).map(entity => [entity.label, entity.type, JSON.stringify(entity.attributes ?? {})].filter(Boolean).join(' ')).join(' ');
  return [task.request, task.goal, task.taskType, entityText, ...(task.contextRefs ?? [])].filter(Boolean).join(' ');
}

export function createDynamicPlan(task, { contextCharacters = 0, confidence = 0.5 } = {}) {
  const taskType = task.taskType ?? inferTaskType(task.request);
  const steps = [];
  const unknowns = task.unknowns ?? [];
  if (unknowns.length > 0) {
    steps.push({
      id: 'clarify',
      objective: 'Identify only the unknowns that block a correct result and ask for them or mark the task blocked.',
      capability: 'clarify-requirements',
      dependsOn: [],
      inputRefs: task.contextRefs ?? [],
      outputContract: { type: 'questions-or-blocked-decision', unknowns },
      acceptanceCriteria: ['No unnecessary questions are asked', 'Blocking unknowns are explicit'],
      status: 'ready'
    });
  }
  const previous = steps.at(-1)?.id;
  steps.push({
    id: 'retrieve',
    objective: 'Retrieve the smallest relevant set of source-backed context.',
    capability: 'retrieve-context',
    dependsOn: previous ? [previous] : [],
    inputRefs: task.contextRefs ?? [],
    outputContract: { type: 'ranked-context', maxNotes: 8 },
    acceptanceCriteria: ['Context is relevant', 'Original sources remain identifiable'],
    status: previous ? 'pending' : 'ready'
  });
  steps.push({
    id: 'execute',
    objective: `Complete the task using the ${taskType} capability without exceeding the task budget.`,
    capability: capabilityForType(taskType),
    dependsOn: ['retrieve'],
    inputRefs: task.contextRefs ?? [],
    outputContract: task.deliverable ?? { description: 'A useful result' },
    acceptanceCriteria: task.acceptanceCriteria,
    status: 'pending'
  });
  steps.push({
    id: 'verify',
    objective: 'Check the result against sources, constraints, and acceptance criteria.',
    capability: 'verify-result',
    dependsOn: ['execute'],
    inputRefs: task.contextRefs ?? [],
    outputContract: { type: 'evaluation', decisions: ['pass', 'revision-needed', 'blocked'] },
    acceptanceCriteria: ['Unsupported claims are marked', 'All acceptance criteria receive a decision'],
    status: 'pending'
  });
  steps.push({
    id: 'deliver',
    objective: 'Return the verified result, uncertainties, evidence, and exact next action.',
    capability: 'deliver-result',
    dependsOn: ['verify'],
    inputRefs: task.contextRefs ?? [],
    outputContract: { type: 'result-record' },
    acceptanceCriteria: ['Result is understandable', 'Next action is concrete'],
    status: 'pending'
  });
  const maxCharacters = chooseContextLimit({ confidence, taskComplexity: taskType === 'comparison' || taskType === 'research' ? 'high' : 'normal' });
  return {
    planId: `plan-${task.id}-${Date.now()}`,
    taskId: task.id,
    steps,
    contextPolicy: {
      maxNotes: 8,
      maxCharacters,
      sourcePriority: ['task.contextRefs', 'dated-primary', 'approved-project-notes', 'secondary-summaries'],
      allowFullVault: false
    },
    budget: allocateBudget({ contextCharacters, taskCharacters: task.request.length + task.goal.length, outputTokens: taskType === 'research' ? 1400 : 900, maxModelCalls: unknowns.length ? 2 : 3 }),
    escalation: {
      firstFailure: 'retry-once-with-failure-code',
      repeatedFailure: 'quarantine-recipe-and-stop',
      noEvidence: 'block-instead-of-inventing'
    },
    createdAt: now()
  };
}
