import { estimateTokens } from './token-budget.js';
import { now } from './engine.js';

export const DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini';

function stripCodeFence(text) {
  return text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

function outputText(body) {
  if (typeof body.output_text === 'string') return body.output_text;
  return (body.output ?? [])
    .flatMap(item => item.content ?? [])
    .filter(item => item.type === 'output_text' && typeof item.text === 'string')
    .map(item => item.text)
    .join('\n');
}

export function buildOpenAIPrompt({ task, step, context }) {
  const allowedSourceIds = context.map(item => item.sourceId ?? item.path).filter(Boolean);
  return [
    'You are a bounded task worker in a general-purpose operating system.',
    'Use only the supplied task and context. Do not invent sources or facts.',
    'Return only a JSON object with exactly these fields:',
    '{"status":"draft|ready-for-review","content":"string","sourceIds":["string"],"uncertainties":["string"],"nextAction":"string"}',
    `Allowed source IDs: ${JSON.stringify(allowedSourceIds)}`,
    `Task: ${JSON.stringify(task)}`,
    `Current step: ${JSON.stringify(step)}`,
    `Retrieved context: ${JSON.stringify(context)}`
  ].join('\n');
}

export function createOpenAIProvider({ apiKey, model = DEFAULT_OPENAI_MODEL, baseUrl = 'https://api.openai.com/v1' } = {}) {
  if (!apiKey) throw new Error('OPENAI_API_KEY is required');
  return {
    name: 'openai',
    model,
    async complete({ task, step, context = [] }) {
      const prompt = buildOpenAIPrompt({ task, step, context });
      const response = await fetch(`${baseUrl}/responses`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, input: prompt })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(`OpenAI request failed (${response.status}): ${body.error?.message ?? 'unknown error'}`);
      const text = outputText(body);
      let parsed;
      try {
        parsed = JSON.parse(stripCodeFence(text));
      } catch {
        parsed = { status: 'draft', content: text, sourceIds: [], uncertainties: ['Model output was not valid JSON.'], nextAction: 'Review and normalize the model output.' };
      }
      const allowed = new Set(context.map(item => item.sourceId ?? item.path).filter(Boolean));
      const sourceIds = [...new Set((Array.isArray(parsed.sourceIds) ? parsed.sourceIds : []).filter(id => allowed.has(id)))];
      const uncertainties = Array.isArray(parsed.uncertainties) ? parsed.uncertainties : ['Model did not provide a valid uncertainty list.'];
      return {
        provider: 'openai',
        model,
        status: ['draft', 'ready-for-review'].includes(parsed.status) ? parsed.status : 'draft',
        content: typeof parsed.content === 'string' ? parsed.content : text,
        sourceIds,
        uncertainties,
        nextAction: typeof parsed.nextAction === 'string' ? parsed.nextAction : 'Review the draft before accepting it.',
        usage: {
          inputTokens: Number.isInteger(body.usage?.input_tokens) ? body.usage.input_tokens : estimateTokens(prompt),
          outputTokens: Number.isInteger(body.usage?.output_tokens) ? body.usage.output_tokens : estimateTokens(text)
        },
        createdAt: now()
      };
    }
  };
}
