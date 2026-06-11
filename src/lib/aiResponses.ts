import type { Message } from '@/types';
import gemini from './gemini-client';

const SYSTEM_PROMPT = `You are Dr. MediAI, a personal AI medical doctor assistant based in India.

CRITICAL RULES — NEVER BREAK THESE:
- The emergency number in India is 108 (ambulance) and 112 (police/fire). NEVER say 911. ALWAYS say 108.
- For ANY emergency (chest pain, difficulty breathing, stroke, heart attack, severe bleeding, unconsciousness): your FIRST line must be "🚨 **CALL 108 NOW (Ambulance)**" — nothing else before it.

Response style:
- Be concise and direct — no unnecessary padding
- For medications: what it's for, standard dose, top 3-5 side effects, critical interactions, one warning
- For symptoms: top 3 likely causes, red flags, whether to see a doctor
- For lab results: normal/abnormal, one sentence per value, next step
- For general health: direct evidence-based answer
- For emergencies: first line is 🚨 **CALL 108 NOW (Ambulance)**, then 3-4 first-aid bullet steps
- Use bullet points, bold key terms, short sentences
- Always complete your full response — never stop mid-sentence
- End with: "*Consult your doctor for personalized advice.*"

Always use conversation history for follow-up context.`;

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

function buildHistory(messages: Message[]): ChatMessage[] {
  return messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .slice(-20)
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
}

export async function generateAIResponse(
  userMessage: string,
  onChunk: (accumulated: string) => void,
  history: Message[] = []
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return simulateResponse(userMessage, onChunk);
  }

  try {
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...buildHistory(history),
      { role: 'user', content: userMessage },
    ];
    return await gemini.sendChatMessage(messages, onChunk);
  } catch (error) {
    console.error('Gemini error:', error);
    // If key missing entirely, fall to simulation
    if (error instanceof Error && error.message === 'NO_KEY') {
      return simulateResponse(userMessage, onChunk);
    }
    const errMsg = `I'm sorry, I ran into a technical issue. Please try again in a moment.\n\n*Error: ${error instanceof Error ? error.message : 'Unknown error'}*`;
    onChunk(errMsg);
    return errMsg;
  }
}

export async function generateReportAnalysis(
  onChunk: (chunk: string) => void,
  reportText = ''
): Promise<string> {
  const prompt = `You are Dr. MediAI, a warm and caring doctor. A patient has just shared their medical report with you. Read it carefully and talk to them directly like a real doctor would in a consultation.

Here is the report:
---
${reportText}
---

Instructions:
- First, find the patient's name from the report and greet them warmly by first name (e.g. "Hi Sarah!" or "Hello Mr. Patel,")
- Speak naturally and conversationally — like a doctor explaining results face to face
- Go through each test result and explain what it means in plain simple words
- For normal results: briefly reassure them (e.g. "Your blood sugar is perfectly normal — nothing to worry about here")
- For abnormal results: explain clearly but calmly what it means and why it matters
- At the end, give 2-3 simple things they should do next
- Keep the tone warm, human, and supportive — not clinical or robotic
- Do NOT use medical jargon without explaining it
- Do NOT use headers or bullet points for everything — write in a natural conversational flow with occasional bullets only where it helps clarity

*Always end with: "Feel free to ask me anything about your results!"*`;

  try {
    return await gemini.analyzeMedicalReport(prompt, onChunk);
  } catch (error) {
    const errMsg = `I'm sorry, I ran into a technical issue. Please try again.\n\n*Error: ${error instanceof Error ? error.message : 'Unknown'}*`;
    onChunk(errMsg);
    return errMsg;
  }
}

export async function generateImageAnalysis(
  onChunk: (chunk: string) => void,
  imageBase64 = '',
  mimeType = 'image/png'
): Promise<string> {
  const prompt = `You are a medical imaging AI. Analyze this image and give a concise description:

1. **Image Type** — what kind of medical image this is (X-ray, MRI, CT, ultrasound, etc.) and the body part shown
2. **Key Observations** — 3-5 bullet points of what you can visually see
3. **Notable Findings** — anything that stands out (normal or abnormal)
4. **Brief Summary** — 2-3 sentences summarizing the overall picture

Be specific to THIS image. Keep it under 200 words. End with: "*Always consult a radiologist for official interpretation.*"`;

  if (!imageBase64) return simulateResponse('analyze medical image', onChunk);

  try {
    return await gemini.analyzeMedicalImage(imageBase64, { mimeType, prompt }, onChunk);
  } catch (error) {
    return simulateResponse('analyze medical image', onChunk);
  }
}

// Shown only when no API key is configured
async function simulateResponse(userMessage: string, onChunk: (chunk: string) => void): Promise<string> {
  const { sleep } = await import('./utils');
  const lower = userMessage.toLowerCase();

  let response: string;

  if (/chest pain|heart attack|stroke|can't breathe|difficulty breathing|unconscious|severe bleeding/.test(lower)) {
    response = `## 🚨 **CALL 108 NOW — Ambulance**\n\nThis sounds like a potential medical emergency. Do not wait.\n\n**While waiting for help:**\n- Stay calm and stay on the line with emergency services\n- Do not eat or drink anything\n- Unlock your door if possible so paramedics can enter\n- If chest pain: chew 325mg aspirin (if not allergic)\n- If unconscious and not breathing: begin CPR\n\n*Call 108 for ambulance or 112 for police/fire. Do not delay.*`;
  } else if (/blood|hemoglobin|cbc|platelet|wbc|lab|test result|creatinine|glucose|cholesterol/.test(lower)) {
    response = `## 🔬 Lab Result Interpretation\n\nI'd be happy to help interpret your results. Please share the specific values and I'll explain what each one means for your health.\n\n**Common reference ranges I can help with:**\n| Test | Normal Range |\n|------|-------------|\n| Hemoglobin (M) | 13.5–17.5 g/dL |\n| Hemoglobin (F) | 12.0–15.5 g/dL |\n| WBC | 4,500–11,000/μL |\n| Fasting Glucose | 70–99 mg/dL |\n| Total Cholesterol | < 200 mg/dL |\n| Creatinine | 0.7–1.3 mg/dL |\n\n> ⚙️ *Add your Gemini API key to \`.env\` as \`VITE_GEMINI_API_KEY\` for personalized AI analysis.*\n\n*This is educational information. Please consult a licensed healthcare provider in person.*`;
  } else if (/medicine|medication|drug|pill|dosage|side effect|interaction|prescription/.test(lower)) {
    response = `## 💊 Medication Information\n\nI can help you understand any medication. Just tell me the drug name and what you'd like to know — side effects, dosage, interactions, or how it works.\n\n**I can explain:**\n- How the medication works in your body\n- Common and serious side effects\n- Drug and food interactions\n- What to do if you miss a dose\n- How long until it takes effect\n\n> ⚙️ *Add your Gemini API key to \`.env\` as \`VITE_GEMINI_API_KEY\` for full AI responses.*\n\n*This is educational information. Please consult a licensed healthcare provider in person.*`;
  } else {
    response = `## 👋 Hi, I'm Dr. MediAI\n\nI'm your personal AI medical assistant. I can help you with:\n\n- 🩺 **Symptoms** — understanding what they might mean\n- 🔬 **Lab results** — interpreting your test values\n- 💊 **Medications** — side effects, interactions, dosing\n- 🏃 **Health & wellness** — evidence-based lifestyle advice\n- 📋 **Medical reports** — breaking down complex documents\n\n**To enable full AI responses**, add your Gemini API key to \`.env\`:\n\`\`\`\nVITE_GEMINI_API_KEY=your_key_here\n\`\`\`\n\n*This is educational information. Please consult a licensed healthcare provider in person.*`;
  }

  const words = response.split(' ');
  let accumulated = '';
  for (let i = 0; i < words.length; i++) {
    accumulated += (i === 0 ? '' : ' ') + words[i];
    onChunk(accumulated);
    await sleep(12 + Math.random() * 8);
  }
  return accumulated;
}
