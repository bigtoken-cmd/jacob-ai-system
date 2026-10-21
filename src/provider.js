import { execFileSync } from 'node:child_process';
import { loadLocalEnv } from './config.js';
import { createDryRunProvider } from './executor.js';
import { createOpenAIProvider, DEFAULT_OPENAI_MODEL } from './openai-provider.js';

function commandExists(command) {
  try {
    execFileSync('sh', ['-lc', `command -v ${command}`], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function inspectProvider(env = { ...loadLocalEnv(), ...process.env }) {
  const provider = (env.AI_PROVIDER || 'dry-run').trim().toLowerCase();
  if (provider === 'dry-run' || provider === '') return { provider: 'dry-run', mode: 'simulation', ready: true, missing: [] };
  if (provider === 'openai') return { provider, mode: 'api', ready: Boolean(env.OPENAI_API_KEY), missing: env.OPENAI_API_KEY ? [] : ['OPENAI_API_KEY'] };
  if (provider === 'anthropic') return { provider, mode: 'api', ready: Boolean(env.ANTHROPIC_API_KEY), missing: env.ANTHROPIC_API_KEY ? [] : ['ANTHROPIC_API_KEY'] };
  if (['codex', 'claude', 'opencode'].includes(provider)) {
    const available = commandExists(provider);
    return { provider, mode: 'local-cli', ready: available, missing: available ? [] : [`${provider} command not installed or not on PATH`] };
  }
  return { provider, mode: 'unknown', ready: false, missing: [`unsupported provider: ${provider}`] };
}

export function createConfiguredProvider(env = { ...loadLocalEnv(), ...process.env }) {
  const provider = (env.AI_PROVIDER || 'dry-run').trim().toLowerCase();
  if (provider === 'dry-run' || provider === '') return createDryRunProvider();
  if (provider === 'openai') return createOpenAIProvider({ apiKey: env.OPENAI_API_KEY, model: env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL });
  throw new Error(`provider runtime is not implemented: ${provider}`);
}
