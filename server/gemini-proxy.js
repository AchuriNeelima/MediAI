import 'dotenv/config';
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
const app = express();
const PORT = process.env.PORT || 8787;
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!API_KEY) {
  // eslint-disable-next-line no-console
  console.warn('[gemini-proxy] Missing GEMINI API key. Set VITE_GEMINI_API_KEY or GEMINI_API_KEY in .env');
}
app.use(express.json({ limit: '25mb' }));

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;
function getModel(modelName = DEFAULT_MODEL) {
  if (!genAI) {
    throw new Error('Gemini API key not configured.');
  return genAI.getGenerativeModel({ model: modelName });
}

function normalizeMessages(messages = []) {
  return messages
    .filter((message) => message && typeof message.content === 'string')
    .map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }]
    }));
}

function wantsStream(req) {
  const accept = req.headers.accept || '';
  return accept.includes('text/event-stream') || req.query.stream === '1' || req.body?.stream === true;
}
function writeSseEvent(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}
async function streamResultToClient(res, stream, fallbackText = '') {
  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
  let accumulated = '';
  try {
    for await (const chunk of stream.stream || stream) {
  const text = chunk.text?.() ?? '';
  if (!text) continue;
  accumulated += text;
      writeSseEvent(res, { delta: text, accumulated });
    }
    writeSseEvent(res, { done: true, result: accumulated || fallbackText });
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
  // eslint-disable-next-line no-console
  console.error('[gemini-proxy] stream error:', error);
  writeSseEvent(res, { error: String(error?.message || error) });
    res.end();
  }
}
async function collectResult(stream) {
  let accumulated = '';
  for await (const chunk of stream.stream || stream) {
    accumulated += chunk.text?.() ?? '';
  }
  return accumulated;
}

async function handleTextPrompt(req, res, prompt, modelName = DEFAULT_MODEL) {
  if (!genAI) {
    return res.status(500).json({ error: 'Gemini API key not configured.' });
  }
  try {
    const model = getModel(modelName);
    const stream = await model.generateContentStream(prompt);
    if (wantsStream(req)) {
      return streamResultToClient(res, stream);
    }
    const result = await collectResult(stream);
    return res.json({ result });
  } catch (error) {
  // eslint-disable-next-line no-console
  console.error('[gemini-proxy] text prompt error:', error);
  return res.status(500).json({ error: String(error?.message || error) });
  }
}

app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages = [], model } = req.body || {};
    if (!messages.length) {
      return res.status(400).json({ error: 'Missing messages in body' });
    }

    const systemPrompt = `You are MediAI, an expert AI medical assistant. Your role is to provide accurate, helpful, and empathetic medical education to users.

  const history = normalizeMessages(messages.slice(0, -1));
  const latest = messages[messages.length - 1];
  const modelInstance = getModel(model);
    const chat = modelInstance.startChat({
      history,
      systemInstruction: systemPrompt,
  });

  const stream = await chat.sendMessageStream(latest.content);
    if (wantsStream(req)) {
      return streamResultToClient(res, stream);
    }
    const result = await collectResult(stream);
    return res.json({ result });
  } catch (error) {
  // eslint-disable-next-line no-console
  console.error('[gemini-proxy][chat] error', error);
  return res.status(500).json({ error: String(error?.message || error) });
  }
});

app.post('/api/gemini/analyze/report', async (req, res) => {
  const { text = '', document = '', mimeType = 'application/pdf', model } = req.body || {};
  if (!text && !document) {
    return res.status(400).json({ error: 'Missing text or document in body' });
  }

  if (document) {
    try {
      const modelInstance = getModel(model);
      const prompt = `Analyze the following medical report for a patient and provide an educational summary, key findings, abnormal values with reference ranges, questions for the doctor, and next steps. Return in markdown.`;
      const stream = await modelInstance.generateContentStream([
        { text: `${prompt}\n\nUse the attached PDF report as the source of truth.` },
        {
          inlineData: {
            mimeType,
            data: document,
          }
        }
      ]);

      if (wantsStream(req)) {
        return streamResultToClient(res, stream);
      }

      const result = await collectResult(stream);
      return res.json({ result });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[gemini-proxy][analyze/report] error', error);
      return res.status(500).json({ error: String(error?.message || error) });
    }
  }

  const prompt = `Analyze the following medical report for a patient and provide an educational summary, key findings, abnormal values with reference ranges, questions for the doctor, and next steps. Return in markdown.\n\nREPORT:\n${text}`;
  return handleTextPrompt(req, res, prompt, model);
});

app.post('/api/gemini/analyze/image', async (req, res) => {
  const { image = '', metadata = {}, model } = req.body || {};
  if (!image) {
    return res.status(400).json({ error: 'Missing image in body' });
  }

  try {
    const modelInstance = getModel(model);
    const mimeType = metadata.mimeType || 'image/png';
    const prompt = `A patient uploaded a medical image (X-ray, CT, MRI, ultrasound, or clinical photograph). Provide an educational analysis describing possible findings, what radiologists look for, and red flags. Do NOT provide a diagnosis. Include guidance for next steps. End with a disclaimer.`;
    const payload = [
      { text: prompt },
      {
        inlineData: {
          mimeType,
          data: image,
        }
      }
    ];

    const stream = await modelInstance.generateContentStream(payload);
    if (wantsStream(req)) {
      return streamResultToClient(res, stream);
    }

    const result = await collectResult(stream);
    return res.json({ result });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[gemini-proxy][analyze/image] error', error);
    return res.status(500).json({ error: String(error?.message || error) });
  }
});

app.post('/api/gemini/medicine/lookup', async (req, res) => {
  const { query = '', model } = req.body || {};
  if (!query) {
    return res.status(400).json({ error: 'Missing query in body' });
  }

  const prompt = `Provide concise educational information about the medicine or query: ${query}. Include mechanism, common dosages, common side effects, interactions, and patient-friendly advice. End with a short disclaimer.`;
  return handleTextPrompt(req, res, prompt, model);
});

app.post('/api/gemini/explain', async (req, res) => {
  const { text = '', model } = req.body || {};
  if (!text) {
    return res.status(400).json({ error: 'Missing text in body' });
  }

  const prompt = `Explain the following to a patient in plain language: ${text}`;
  return handleTextPrompt(req, res, prompt, model);
});

// Fallback generic forwarder kept for compatibility with older client code.
app.post('/api/gemini', async (req, res) => {
  const { path = '', method = 'POST', body } = req.body || {};
  const base = (process.env.GEMINI_API_URL || '').replace(/\/$/, '');

  if (!API_KEY || !base) {
    return res.status(500).json({ error: 'VITE_GEMINI_API_KEY or GEMINI_API_URL not set on server.' });
  }

  let url;
  if (/^https?:\/\//i.test(path)) {
    url = path;
  } else {
    url = base + (path.startsWith('/') ? path : `/${path}`);
  }

  // eslint-disable-next-line no-console
  console.log('[gemini-proxy] forwarding request to:', url);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Upstream returned non-OK status',
        upstreamStatus: response.status,
        upstreamUrl: url,
        upstreamBody: text,
      });
    }

    try {
      return res.status(response.status).json(JSON.parse(text));
    } catch {
      return res.status(response.status).send(text);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[gemini-proxy] fetch error:', error);
    return res.status(500).json({ error: String(error?.message || error) });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Gemini proxy listening on http://localhost:${PORT}`);
});
import express from 'express'

const app = express()
const PORT = process.env.PORT || 8787

app.use(express.json({ limit: '25mb' }))
// Helper to call the generative language REST endpoint for text
async function callGenerateText(promptText, model = 'gemini-2.5-flash', options = {}) {
  const base = (process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com').replace(/\/$/, '')
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set on server.')

  const url = `${base}/v1beta2/models/${model}:generateText`
  const payload = {
    prompt: { text: promptText },
    temperature: options.temperature ?? 0.4,
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  const text = await r.text()
  if (!r.ok) {
    throw { status: r.status, body: text, url }
  }
  try { return JSON.parse(text) } catch { return text }
}

// Chat endpoint: accepts { messages: [{role, content}], model? }
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, model } = req.body || {}
  if (!messages) return res.status(400).json({ error: 'Missing messages in body' })
  // Build prompt from system + history
  const systemPrompt = `You are MediAI, an expert AI medical assistant. Provide helpful, empathetic medical education.`
  const text = [systemPrompt, ...messages.map(m => `${m.role.toUpperCase()}: ${m.content}`)].join('\n\n')
  const resp = await callGenerateText(text, model)
  res.json({ result: resp })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[gemini-proxy][chat] error', err)
    res.status(err.status || 500).json({ error: String(err.body || err.message || err) })
  }
})

// Report analysis endpoint: accepts { text }
app.post('/api/gemini/analyze/report', async (req, res) => {
  try {
    const { text, model } = req.body || {}
  if (!text) return res.status(400).json({ error: 'Missing text in body' })
  const prompt = `Analyze the following medical report for a patient and provide an educational summary, key findings, abnormal values with reference ranges, questions for the doctor, and next steps. Return in markdown.\n\nREPORT:\n${text}`
  const resp = await callGenerateText(prompt, model)
    res.json({ result: resp })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[gemini-proxy][analyze/report] error', err)
    res.status(err.status || 500).json({ error: String(err.body || err.message || err) })
  }
})

// Image analysis endpoint: accepts { image: base64, metadata }
app.post('/api/gemini/analyze/image', async (req, res) => {
  try {
    const { image, metadata, model } = req.body || {}
  if (!image) return res.status(400).json({ error: 'Missing image in body' })
  const prompt = `A patient uploaded a medical image (X-ray, CT, MRI). Provide an educational analysis describing possible findings, what radiologists look for, and red flags. Do NOT provide a diagnosis. Include guidance for next steps.\n\nImage metadata: ${JSON.stringify(metadata || {})}`
  const resp = await callGenerateText(prompt, model)
    res.json({ result: resp })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[gemini-proxy][analyze/image] error', err)
    res.status(err.status || 500).json({ error: String(err.body || err.message || err) })
  }
})

// Medicine lookup: accepts { query }
app.post('/api/gemini/medicine/lookup', async (req, res) => {
  try {
    const { query, model } = req.body || {}
  if (!query) return res.status(400).json({ error: 'Missing query in body' })
  const prompt = `Provide concise educational information about the medicine or query: ${query}. Include mechanism, common dosages, common side effects, interactions, and patient-friendly advice. End with a short disclaimer.`
  const resp = await callGenerateText(prompt, model)
    res.json({ result: resp })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[gemini-proxy][medicine/lookup] error', err)
    res.status(err.status || 500).json({ error: String(err.body || err.message || err) })
  }
})

// Explain for patient: accepts { text }
app.post('/api/gemini/explain', async (req, res) => {
  try {
    const { text, model } = req.body || {}
  if (!text) return res.status(400).json({ error: 'Missing text in body' })
  const prompt = `Explain the following to a patient in plain language: ${text}`
  const resp = await callGenerateText(prompt, model)
    res.json({ result: resp })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[gemini-proxy][explain] error', err)
    res.status(err.status || 500).json({ error: String(err.body || err.message || err) })
  }
})

// Fallback generic forwarder (kept for flexibility)
app.post('/api/gemini', async (req, res) => {
  const { path = '', method = 'POST', body } = req.body || {}
  const base = (process.env.GEMINI_API_URL || '').replace(/\/$/, '')
  if (!process.env.GEMINI_API_KEY || !base) {
    return res.status(500).json({ error: 'GEMINI_API_KEY or GEMINI_API_URL not set on server.' })
  }

  // Build the target URL. Accept either a full absolute URL in `path` or a relative path.
  let url
  if (/^https?:\/\//i.test(path)) {
    url = path
  } else {
    // ensure there's exactly one slash between base and path
    url = base + (path.startsWith('/') ? path : `/${path}`)
  }

  // Log for diagnostics
  // eslint-disable-next-line no-console
  console.log('[gemini-proxy] forwarding request to:', url)

  try {
    const r = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    })

    const text = await r.text()

    if (!r.ok) {
      // Return a helpful diagnostic payload when the upstream returns non-OK
      return res.status(r.status).json({
        error: 'Upstream returned non-OK status',
        upstreamStatus: r.status,
        upstreamUrl: url,
        upstreamBody: text
      })
    }

    try {
      const json = JSON.parse(text)
      res.status(r.status).json(json)
    } catch (e) {
      res.status(r.status).send(text)
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[gemini-proxy] fetch error:', err)
    res.status(500).json({ error: String(err) })
  }
})
import express from 'express'

const app = express()
const PORT = process.env.PORT || 8787

app.use(express.json({ limit: '25mb' }))

app.post('/api/gemini', async (req, res) => {
  const { path = '', method = 'POST', body } = req.body || {}
  const base = (process.env.GEMINI_API_URL || '').replace(/\/$/, '')

  if (!process.env.GEMINI_API_KEY || !base) {
    return res.status(500).json({ error: 'GEMINI_API_KEY or GEMINI_API_URL not set on server.' })
  }
  // Build the target URL. Accept either a full absolute URL in `path` or a relative path.
  let url
  if (/^https?:\/\//i.test(path)) {
    url = path
  } else {
    // ensure there's exactly one slash between base and path
    url = base + (path.startsWith('/') ? path : `/${path}`)
  }

  // Log for diagnostics
  // eslint-disable-next-line no-console
  console.log('[gemini-proxy] forwarding request to:', url)

  try {
    const r = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    })

    const text = await r.text()

    if (!r.ok) {
      // Return a helpful diagnostic payload when the upstream returns non-OK
      return res.status(r.status).json({
        error: 'Upstream returned non-OK status',
        upstreamStatus: r.status,
        upstreamUrl: url,
        upstreamBody: text
      })
    }

    try {
      const json = JSON.parse(text)
      res.status(r.status).json(json)
    } catch (e) {
      res.status(r.status).send(text)
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[gemini-proxy] fetch error:', err)
    res.status(500).json({ error: String(err) })
  }
})

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Gemini proxy listening on http://localhost:${PORT}`)
})
