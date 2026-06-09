import { sleep } from './utils';

const MEDICAL_RESPONSES: Record<string, string> = {
  default: `I'm your AI Medical Assistant. I can help you understand medical information, explain test results, discuss medications, and provide health education.

**How I can help:**
- Explain blood test and lab results
- Provide medication information and interactions
- Discuss symptoms and health topics educationally
- Help interpret medical images with context
- Answer general health and wellness questions

What health question can I help you explore today?

> ⚠️ **Disclaimer:** I provide educational information only. Always consult a qualified healthcare professional for medical advice, diagnosis, or treatment.`,

  blood: `## Understanding Your Blood Test Results

Blood tests measure various components to provide insight into your health status.

**Common Blood Test Panels:**

### Complete Blood Count (CBC)
| Component | Normal Range | Purpose |
|-----------|-------------|---------|
| Hemoglobin | 12–17.5 g/dL | Oxygen-carrying capacity |
| WBC | 4,500–11,000/μL | Immune function |
| Platelets | 150,000–450,000/μL | Blood clotting |

### Basic Metabolic Panel (BMP)
- **Glucose** — Blood sugar regulation
- **Creatinine** — Kidney function marker
- **Electrolytes** — Sodium, potassium, calcium balance

### Lipid Panel
- **Total Cholesterol** — Target < 200 mg/dL
- **LDL ("bad")** — Target < 100 mg/dL
- **HDL ("good")** — Target > 60 mg/dL

> Always review results with your physician who can interpret them in the context of your complete medical history.`,

  medication: `## Medication Information

I can provide educational information about many common medications. Here's what I can help explain:

**Types of Information Available:**
- **Mechanism of action** — How the medication works
- **Common side effects** — What to watch for
- **Drug interactions** — Medications to be cautious about
- **Dosing guidelines** — General information (your prescription is specific to you)
- **Storage instructions** — How to store properly
- **Contraindications** — Who should avoid it

**Please tell me:**
- Which medication are you asking about?
- Are you curious about a specific aspect?

> ⚠️ Never adjust your medication dose or stop taking a prescribed medication without consulting your doctor or pharmacist.`,

  symptom: `## Understanding Symptoms

Symptoms can have many possible causes, and a thorough medical evaluation is essential for proper diagnosis.

**For any symptom, consider:**

### Immediate Medical Attention Required
Call 911 or go to the ER for:
- Chest pain or pressure
- Sudden severe headache
- Difficulty breathing
- Signs of stroke (FAST: Face drooping, Arm weakness, Speech difficulty, Time to call)
- Severe allergic reactions

### Schedule a Doctor's Visit
- Persistent symptoms lasting more than a few days
- Symptoms that are worsening
- Unexplained weight loss
- New or unusual symptoms

**What symptom would you like to learn more about?**

> This is educational information only. A healthcare provider can properly evaluate your specific situation.`,

  nutrition: `## Nutrition & Dietary Guidelines

Evidence-based nutrition plays a fundamental role in health maintenance and disease prevention.

### The Basics of Healthy Eating
**Macronutrients:**
- **Carbohydrates** — 45–65% of calories; prioritize whole grains, vegetables, fruits
- **Proteins** — 10–35% of calories; lean meats, legumes, dairy, eggs
- **Fats** — 20–35% of calories; focus on unsaturated fats

**Key Micronutrients to Monitor:**
- **Vitamin D** — Bone health, immune function
- **B12** — Nerve function, especially important for vegetarians
- **Iron** — Oxygen transport, especially for menstruating individuals
- **Omega-3s** — Cardiovascular and brain health

### Dietary Patterns with Strong Evidence
1. **Mediterranean Diet** — Cardiovascular benefits
2. **DASH Diet** — Blood pressure management
3. **Whole Food Plant-Based** — Metabolic health

> Consult a registered dietitian for personalized nutrition guidance tailored to your health conditions.`,
};

function detectTopic(text: string): string {
  const lower = text.toLowerCase();
  if (/blood|hemoglobin|cbc|hematocrit|platelet|wbc|rbc|lab|test result/.test(lower)) return 'blood';
  if (/medicine|medication|drug|pill|tablet|dosage|side effect|interaction/.test(lower)) return 'medication';
  if (/symptom|pain|hurt|ache|fever|dizzy|nausea|fatigue|tired/.test(lower)) return 'symptom';
  if (/food|diet|nutrition|vitamin|mineral|eat|weight/.test(lower)) return 'nutrition';
  return 'default';
}

export async function generateAIResponse(
  userMessage: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  const topic = detectTopic(userMessage);
  const response = MEDICAL_RESPONSES[topic] || MEDICAL_RESPONSES['default'];

  const words = response.split(' ');
  let accumulated = '';

  for (let i = 0; i < words.length; i++) {
    accumulated += (i === 0 ? '' : ' ') + words[i];
    onChunk(accumulated);
    await sleep(18 + Math.random() * 15);
  }
}

export async function generateReportAnalysis(onChunk: (chunk: string) => void): Promise<void> {
  const response = `## Analyzing Your Medical Report...

I've processed the document and extracted the key information. Here's a comprehensive breakdown:

### Executive Summary
Your CBC report from June 2025 shows **mild anemia** (hemoglobin 11.2 g/dL) with microcytic indices suggesting **iron-deficiency anemia**. All other parameters including white blood cell count, platelet count, and differential are within normal ranges.

### Key Findings
1. **Hemoglobin 11.2 g/dL** — Below the normal female range of 12.0–15.5 g/dL
2. **MCV 78 fL** — Microcytic (small) red cells, classic for iron deficiency
3. **MCH 25.1 pg** — Hypochromic cells, supporting iron deficiency diagnosis
4. **WBC 6,800/μL** — Normal range, no signs of infection
5. **Platelets 245,000/μL** — Normal clotting function

### Values Needing Attention
The combination of low hemoglobin, low MCV, and low MCH forms the classic triad of **iron-deficiency anemia**. This is the most common nutritional deficiency worldwide.

### Questions to Ask Your Doctor
- Should I get an iron panel (ferritin, serum iron, TIBC)?
- Do I need iron supplementation, and if so, what type?
- Are there any absorption issues to investigate?
- When should I repeat these tests?

> ⚠️ This analysis is for educational purposes only. Your physician will interpret results in context of your complete health history.`;

  const words = response.split(' ');
  let accumulated = '';
  for (let i = 0; i < words.length; i++) {
    accumulated += (i === 0 ? '' : ' ') + words[i];
    onChunk(accumulated);
    await sleep(12 + Math.random() * 10);
  }
}

export async function generateImageAnalysis(onChunk: (chunk: string) => void): Promise<void> {
  const response = `## Medical Image Analysis

I've examined the uploaded image and can provide the following educational observations:

### Visual Observations
- The image appears to be a **frontal chest radiograph** (PA view)
- **Lung fields**: Generally clear without obvious areas of consolidation or opacity
- **Cardiac silhouette**: Appears within normal size limits for a chest radiograph
- **Pleural spaces**: No obvious pleural effusion or pneumothorax visible
- **Mediastinum**: Appears within normal width
- **Bony structures**: Visible ribs and clavicles appear intact

### Possible Explanations
This appears consistent with a **routine chest X-ray examination** that may represent a normal study. However, subtle findings that require clinical correlation may not be appreciable through AI analysis alone.

### Medical Context
Chest radiography is one of the most commonly ordered imaging studies. Standard interpretation examines:
- Lung parenchyma for infiltrates, masses, or atelectasis
- Heart size and shape
- Mediastinal contours
- Pleural spaces

### Important Safety Notes
**This AI analysis is NOT a medical diagnosis**
- Medical imaging must be formally interpreted by a licensed radiologist
- Clinical symptoms, history, and physical examination are essential for diagnosis
- Please consult your ordering physician for official results`;

  const words = response.split(' ');
  let accumulated = '';
  for (let i = 0; i < words.length; i++) {
    accumulated += (i === 0 ? '' : ' ') + words[i];
    onChunk(accumulated);
    await sleep(12 + Math.random() * 10);
  }
}
