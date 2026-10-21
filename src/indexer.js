import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { listMarkdownFiles, now } from './engine.js';

export function hashFile(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

export function buildVaultIndex(root) {
  const absoluteRoot = path.resolve(root);
  if (!fs.existsSync(absoluteRoot)) throw new Error(`vault root does not exist: ${absoluteRoot}`);
  const files = listMarkdownFiles(absoluteRoot).map(filePath => {
    const stat = fs.statSync(filePath);
    return {
      path: path.relative(absoluteRoot, filePath),
      bytes: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      sha256: hashFile(filePath)
    };
  });
  return {
    version: 1,
    root: absoluteRoot,
    generatedAt: now(),
    fileCount: files.length,
    totalBytes: files.reduce((total, file) => total + file.bytes, 0),
    files
  };
}

export function saveVaultIndex(index, outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(index, null, 2)}\n`, 'utf8');
  return outputPath;
}
