import fs from 'node:fs';
import path from 'node:path';
import { now } from './engine.js';

export class JsonStore {
  constructor(root = path.resolve('runtime')) {
    this.root = root;
    for (const folder of ['tasks', 'results', 'evaluations', 'runs']) fs.mkdirSync(path.join(root, folder), { recursive: true });
  }

  write(kind, id, value) {
    if (!/^[A-Za-z0-9._-]+$/.test(id)) throw new Error(`unsafe record id: ${id}`);
    const destination = path.join(this.root, kind, `${id}.json`);
    const temporary = `${destination}.tmp`;
    fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    fs.renameSync(temporary, destination);
    return destination;
  }

  read(kind, id) {
    const file = path.join(this.root, kind, `${id}.json`);
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }

  createRun(taskId, recipeId = null, attempt = 1) {
    const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const run = { runId, taskId, recipeId, status: 'started', startedAt: now(), finishedAt: null, attempt, failureCode: null, notes: '' };
    this.write('runs', runId, run);
    return run;
  }

  finishRun(run, status, notes = '', failureCode = null) {
    const finished = { ...run, status, finishedAt: now(), notes, failureCode };
    this.write('runs', run.runId, finished);
    return finished;
  }
}
