import fs from 'node:fs';
import path from 'node:path';
import { evaluateResult, retrieveMarkdown, validateTask, validateResult } from './engine.js';

const command = process.argv[2];

if (command === 'validate') {
  const taskPath = path.resolve('fixtures/task.example.json');
  const resultPath = path.resolve('fixtures/result.example.json');
  const task = JSON.parse(fs.readFileSync(taskPath, 'utf8'));
  const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  const taskErrors = validateTask(task);
  const resultErrors = validateResult(result);
  const evaluation = evaluateResult(result, task.sourceIds);
  console.log(JSON.stringify({ taskErrors, resultErrors, evaluation }, null, 2));
  process.exit(taskErrors.length || resultErrors.length || evaluation.decision !== 'pass' ? 1 : 0);
}

if (command === 'search') {
  const root = process.argv[3];
  const query = process.argv.slice(4).join(' ');
  if (!root || !query) {
    console.error('Usage: node src/cli.js search <markdown-root> <query>');
    process.exit(1);
  }
  console.log(JSON.stringify(retrieveMarkdown(root, query), null, 2));
  process.exit(0);
}

console.log('Commands: validate, search <markdown-root> <query>');
process.exit(command ? 1 : 0);
