import { HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
// Use models confirmed working on this key, ordered by capability
const MODELS = ['gemini-2.5-flash-lite', 'gemini-2.0-flash-lite', 'gemini-flash-lite-latest'];

function getApiKey(): string {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') throw new Error('NO_KEY');
  return apiKey;
}

const SAFETY = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

async function callGemini(
  bodyFn: (model: string) => Record<string, unknown>,
  onChunk?: (accumulated: string) => void
): Promise<string> {
  const apiKey = getApiKey();
  let lastError: Error = new Error('Unknown error');

  for (const model of MODELS) {
    try {
      const res = await fetch(
        `${API_BASE}/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bodyFn(model)) }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg: string = (err as any)?.error?.message ?? `Gemini API error ${res.status}`;
        const retryMatch = msg.match(/retry in ([\d.]+)s/i);
        if (retryMatch && model === MODELS[MODELS.length - 1]) {
          throw new Error(`Rate limit reached. Please wait ${Math.ceil(parseFloat(retryMatch[1]))} seconds and try again.`);
        }
        throw new Error(msg);
      }

      return await readSSEStream(res, onChunk);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Only try next model on quota/rate-limit errors
      if (!/quota|rate.?limit|429/i.test(lastError.message)) throw lastError;
    }
  }

  throw lastError;
}

async function readSSEStream(res: Response, onChunk?: (accumulated: string) => void): Promise<string> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by double newlines
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';

    for (const event of events) {
      // Each event may have multiple lines; find the data line
      for (const line of event.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (!data || data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const parts = parsed?.candidates?.[0]?.content?.parts;
          if (parts) {
            for (const part of parts) {
              // skip thought signatures, only take plain text
              if (part.text && !part.thoughtSignature) {
                accumulated += part.text;
                onChunk?.(accumulated);
              }
            }
          }
        } catch {
          // skip malformed chunk
        }
      }
    }
  }

  // Flush any remaining buffer
  if (buffer.trim()) {
    for (const line of buffer.split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data);
        const parts = parsed?.candidates?.[0]?.content?.parts;
        if (parts) {
          for (const part of parts) {
            if (part.text && !part.thoughtSignature) {
              accumulated += part.text;
              onChunk?.(accumulated);
            }
          }
        }
      } catch { /* skip */ }
    }
  }

  return accumulated;
}

export async function sendChatMessage(
  messages: Array<{ role: string; content: string }>,
  onChunk?: (accumulated: string) => void
): Promise<string> {
  const systemMsg = messages.find(m => m.role === 'system');
  const convo = messages.filter(m => m.role !== 'system');
  const contents = convo.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  return callGemini((model) => {
    void model;
    const body: Record<string, unknown> = {
      contents,
      safetySettings: SAFETY,
      generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
    };
    if (systemMsg) body.systemInstruction = { parts: [{ text: systemMsg.content }] };
    return body;
  }, onChunk);
}

export async function analyzeMedicalReport(
  text: string,
  onChunk?: (chunk: string) => void,
  options?: { document?: string; mimeType?: string }
): Promise<string> {
  const parts: unknown[] = [{ text }];
  if (options?.document) {
    parts.push({ inlineData: { mimeType: options.mimeType ?? 'application/pdf', data: options.document } });
  }
  return callGemini(() => ({
    contents: [{ role: 'user', parts }],
    safetySettings: SAFETY,
    generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
  }), onChunk);
}

export async function analyzeMedicalImage(
  imageBase64: string,
  metadata?: { mimeType?: string; prompt?: string },
  onChunk?: (chunk: string) => void
): Promise<string> {
  return callGemini(() => ({
    contents: [{
      role: 'user',
      parts: [
        { text: metadata?.prompt ?? 'Analyze this medical image for educational purposes.' },
        { inlineData: { mimeType: metadata?.mimeType ?? 'image/png', data: imageBase64 } },
      ],
    }],
    safetySettings: SAFETY,
    generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
  }), onChunk);
}

export default { sendChatMessage, analyzeMedicalReport, analyzeMedicalImage };
