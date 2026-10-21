import fs from 'node:fs';
import path from 'node:path';

export function loadLocalEnv(filePath = path.resolve('.env')) {
  if (!fs.existsSync(filePath)) return {};
  const values = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator < 1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
    values[key] = value;
  }
  return values;
}

export function resolveVaultRoot(cliRoot = null, env = loadLocalEnv()) {
  const candidate = cliRoot || process.env.OBSIDIAN_VAULT_PATH || env.OBSIDIAN_VAULT_PATH || null;
  return candidate ? path.resolve(candidate) : null;
}
