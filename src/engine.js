import fs from 'node:fs';
import path from 'node:path';

export const TASK_STATUSES = [
  'queued', 'running', 'awaiting-review', 'blocked', 'failed', 'completed', 'cancelled'
];

const TRANSITIONS = {
  queued: ['running', 'cancelled'],
  running: ['awaiting-review', 'blocked', 'failed', 'cancelled'],
  'awaiting-review': ['running', 'completed', 'blocked', 'failed'],
  blocked: ['queued', 'cancelled'],
  failed: ['queued', 'cancelled'],
  completed: [],
  cancelled: []
};

export function now() {
  return new Date().toISOString();
}

export function makeTask(input) {
  const timestamp = now();
  return {
    id: input.id,
    domain: input.domain,
    title: input.title,
    goal: input.goal,
    status: 'queued',
    inputs: input.inputs ?? [],
    constraints: input.constraints ?? [],
    sourceIds: input.sourceIds ?? [],
    acceptanceCriteria: input.acceptanceCriteria ?? [],
    approvalRequired: input.approvalRequired ?? true,
    parentTaskId: input.parentTaskId ?? null,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function validateTask(task) {
  const errors = [];
  if (!task || typeof task !== 'object') return ['task must be an object'];
  for (const field of ['id', 'domain', 'title', 'goal', 'status', 'createdAt', 'updatedAt']) {
    if (typeof task[field] !== 'string' || task[field].length === 0) errors.push(`missing ${field}`);
  }
  if (!/^[A-Z0-9-]+$/.test(task.id ?? '')) errors.push('id must contain uppercase letters, numbers, and hyphens only');
  if (!['parasyte', 'school', 'lincoln-prospects', 'system'].includes(task.domain)) errors.push('invalid domain');
  if (!TASK_STATUSES.includes(task.status)) errors.push('invalid status');
  if (!Array.isArray(task.acceptanceCriteria) || task.acceptanceCriteria.length === 0) errors.push('acceptanceCriteria must contain at least one item');
  for (const field of ['inputs', 'constraints', 'sourceIds', 'acceptanceCriteria']) {
    if (!Array.isArray(task[field])) errors.push(`${field} must be an array`);
  }
  return errors;
}

export function canTransition(from, to) {
  return Boolean(TRANSITIONS[from]?.includes(to));
}

export function transitionTask(task, nextStatus) {
  if (!canTransition(task.status, nextStatus)) {
    throw new Error(`invalid transition: ${task.status} -> ${nextStatus}`);
  }
  return { ...task, status: nextStatus, updatedAt: now() };
}

export function validateResult(result) {
  const errors = [];
  if (!result || typeof result !== 'object') return ['result must be an object'];
  for (const field of ['taskId', 'status', 'content', 'nextAction', 'createdAt']) {
    if (typeof result[field] !== 'string' || result[field].length === 0) errors.push(`missing ${field}`);
  }
  if (!['draft', 'ready-for-review', 'accepted', 'revision-needed', 'blocked'].includes(result.status)) errors.push('invalid result status');
  for (const field of ['sourceIds', 'uncertainties', 'assumptions']) {
    if (result[field] !== undefined && !Array.isArray(result[field])) errors.push(`${field} must be an array`);
  }
  if (!Array.isArray(result.sourceIds)) errors.push('sourceIds must be an array');
  if (!Array.isArray(result.uncertainties)) errors.push('uncertainties must be an array');
  return errors;
}

function markdownFiles(root) {
  const found = [];
  if (!fs.existsSync(root)) return found;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === '.obsidian' || entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) found.push(full);
    }
  };
  walk(root);
  return found;
}

export function retrieveMarkdown(root, query, limit = 8) {
  const terms = String(query ?? '').toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  const results = [];
  for (const file of markdownFiles(root)) {
    const content = fs.readFileSync(file, 'utf8');
    const haystack = `${path.basename(file)}\n${content}`.toLowerCase();
    const matchedTerms = terms.filter(term => haystack.includes(term));
    if (matchedTerms.length === 0) continue;
    const score = matchedTerms.length / terms.length;
    const firstTerm = matchedTerms[0];
    const position = haystack.indexOf(firstTerm);
    const start = Math.max(0, position - 100);
    const snippet = content.replace(/\s+/g, ' ').slice(start, start + 320);
    results.push({ path: path.relative(root, file), score, matchedTerms, snippet });
  }
  return results.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path)).slice(0, limit);
}

export function evaluateResult(result, requiredSourceIds = []) {
  const checks = [];
  const resultErrors = validateResult(result);
  checks.push({ name: 'result-shape', passed: resultErrors.length === 0, details: resultErrors.join('; ') });
  const missingSources = requiredSourceIds.filter(id => !result.sourceIds?.includes(id));
  checks.push({ name: 'required-sources', passed: missingSources.length === 0, details: missingSources.length ? `missing: ${missingSources.join(', ')}` : 'all required sources present' });
  checks.push({ name: 'uncertainty-field', passed: Array.isArray(result.uncertainties), details: 'uncertainty list is explicit' });
  const failureCodes = [];
  if (resultErrors.some(error => error.includes('missing'))) failureCodes.push('missing-field');
  if (missingSources.length) failureCodes.push('missing-source');
  return {
    decision: checks.every(check => check.passed) ? 'pass' : 'revision-needed',
    checks,
    failureCodes,
    evaluatedAt: now()
  };
}
