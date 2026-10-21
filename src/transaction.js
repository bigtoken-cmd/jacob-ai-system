import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { now } from './engine.js';

export function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function safeTarget(root, relativeTarget) {
  const base = path.resolve(root);
  const target = path.resolve(base, relativeTarget);
  if (target !== base && !target.startsWith(`${base}${path.sep}`)) throw new Error(`unsafe transaction target: ${relativeTarget}`);
  return target;
}

export function planOperation(root, writes) {
  return {
    operationId: `op-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    status: 'planned',
    writes: writes.map(write => {
      const target = safeTarget(root, write.target);
      const existing = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;
      return { target: write.target, content: write.content, expectedHash: existing === null ? null : sha256(existing), resultHash: sha256(write.content) };
    }),
    createdAt: now(),
    appliedAt: null,
    notes: ''
  };
}

export function inspectOperation(root, operation) {
  const conflicts = [];
  for (const write of operation.writes) {
    const target = safeTarget(root, write.target);
    const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;
    const currentHash = current === null ? null : sha256(current);
    if (currentHash !== write.expectedHash) conflicts.push({ target: write.target, expectedHash: write.expectedHash, currentHash });
  }
  return { ok: conflicts.length === 0, conflicts, inspectedAt: now() };
}

export function applyOperation(root, operation) {
  const inspection = inspectOperation(root, operation);
  if (!inspection.ok) return { operation: { ...operation, status: 'conflict', notes: 'Target changed after planning.' }, inspection };
  const backupRoot = path.join(root, '.runtime', 'backups', operation.operationId);
  fs.mkdirSync(backupRoot, { recursive: true });
  try {
    for (const write of operation.writes) {
      const target = safeTarget(root, write.target);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      if (fs.existsSync(target)) fs.copyFileSync(target, path.join(backupRoot, path.basename(write.target)));
      const temporary = `${target}.tmp-${operation.operationId}`;
      fs.writeFileSync(temporary, write.content, 'utf8');
      fs.renameSync(temporary, target);
    }
    return { operation: { ...operation, status: 'applied', appliedAt: now() }, inspection };
  } catch (error) {
    return { operation: { ...operation, status: 'failed', notes: error.message }, inspection };
  }
}
