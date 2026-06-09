import type { User, Conversation, Message, ReportAnalysis, ImageAnalysis, DashboardMetrics, UserPreferences } from '@/types';

// Mock User
export const MOCK_USER: User = {
  id: 'usr_1',
  name: 'Alex Johnson',
  email: 'alex.johnson@example.com',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
  joinedAt: '2024-01-15',
  plan: 'pro',
};

// Mock Conversations
export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_1',
    title: 'Blood Test Results Explained',
    lastMessage: 'Your hemoglobin levels appear to be within normal range...',
    timestamp: '2025-06-09T10:30:00',
    messageCount: 8,
    isFavorite: true,
    isArchived: false,
    category: 'report',
  },
  {
    id: 'conv_2',
    title: 'Understanding Metformin',
    lastMessage: 'Metformin is commonly prescribed for type 2 diabetes...',
    timestamp: '2025-06-08T15:20:00',
    messageCount: 5,
    isFavorite: false,
    isArchived: false,
    category: 'medicine',
  },
  {
    id: 'conv_3',
    title: 'General Health Questions',
    lastMessage: 'Regular exercise and balanced nutrition are foundational...',
    timestamp: '2025-06-07T09:15:00',
    messageCount: 12,
    isFavorite: true,
    isArchived: false,
    category: 'general',
  },
  {
    id: 'conv_4',
    title: 'Vitamin D Deficiency',
    lastMessage: 'Vitamin D plays a crucial role in bone health...',
    timestamp: '2025-06-06T14:00:00',
    messageCount: 6,
    isFavorite: false,
    isArchived: false,
    category: 'general',
  },
  {
    id: 'conv_5',
    title: 'MRI Scan Observations',
    lastMessage: 'Based on the image provided, I can observe...',
    timestamp: '2025-06-05T11:45:00',
    messageCount: 4,
    isFavorite: false,
    isArchived: true,
    category: 'general',
  },
  {
    id: 'conv_6',
    title: 'Hypertension Management',
    lastMessage: 'Lifestyle modifications are the first line of approach...',
    timestamp: '2025-06-04T16:30:00',
    messageCount: 9,
    isFavorite: false,
    isArchived: false,
    category: 'general',
  },
];

// Mock Messages
export const MOCK_MESSAGES: Message[] = [
  {
    id: 'msg_1',
    conversationId: 'conv_1',
    role: 'user',
    content: 'I just got my blood test results back. My hemoglobin is 11.2 g/dL. Is that normal?',
    timestamp: '2025-06-09T10:25:00',
  },
  {
    id: 'msg_2',
    conversationId: 'conv_1',
    role: 'assistant',
    content: `## Blood Test Analysis\n\nYour hemoglobin level of **11.2 g/dL** is slightly below the typical reference range.\n\n**Reference Ranges:**\n- Adult males: 13.5–17.5 g/dL\n- Adult females: 12.0–15.5 g/dL\n\n### What This May Indicate\n\nA hemoglobin level of 11.2 g/dL is classified as **mild anemia**. This can result from various factors including:\n\n- **Iron deficiency** — the most common cause\n- **Vitamin B12 or folate deficiency**\n- **Chronic disease**\n- **Recent blood loss**\n\n### Recommended Next Steps\n\n1. Discuss these results with your healthcare provider\n2. Ask about iron studies (serum ferritin, TIBC)\n3. Review your dietary intake of iron-rich foods\n\n> ⚠️ **Important:** This is educational information only. Please consult your doctor for proper diagnosis and treatment.`,
    timestamp: '2025-06-09T10:26:00',
  },
  {
    id: 'msg_3',
    conversationId: 'conv_1',
    role: 'user',
    content: 'What foods should I eat to help with this?',
    timestamp: '2025-06-09T10:28:00',
  },
  {
    id: 'msg_4',
    conversationId: 'conv_1',
    role: 'assistant',
    content: `## Iron-Rich Foods for Anemia Support\n\nHere are evidence-based dietary recommendations to support healthy hemoglobin levels:\n\n### Heme Iron Sources (Best Absorbed)\n- **Red meat** (beef, lamb) — 2.7mg per 3oz\n- **Chicken liver** — 12.8mg per 3oz\n- **Oysters and clams** — highly concentrated iron\n- **Sardines** — convenient and affordable\n\n### Non-Heme Iron Sources (Plant-Based)\n- **Lentils** — 6.6mg per cup (cooked)\n- **Spinach** — 6.4mg per cup (cooked)\n- **Tofu** — 3.4mg per 4oz\n- **Fortified cereals** — varies by brand\n\n### Absorption Tips\n- Combine with **Vitamin C** foods (citrus, bell peppers) to enhance absorption\n- Avoid coffee/tea within 1 hour of iron-rich meals\n- Cook in cast iron pans when possible\n\n> This information is educational only. A dietitian or physician can provide personalized guidance.`,
    timestamp: '2025-06-09T10:30:00',
  },
];

// Mock Report Analysis
export const MOCK_REPORT_ANALYSIS: ReportAnalysis = {
  id: 'rpt_1',
  fileName: 'CBC_Report_June2025.pdf',
  uploadedAt: '2025-06-09T10:00:00',
  status: 'complete',
  riskLevel: 'moderate',
  summary: 'Your complete blood count (CBC) shows mild anemia with slightly low hemoglobin and hematocrit values. White blood cell count is within normal range, indicating no active infection. Platelet count is normal. These results suggest iron-deficiency anemia which is common and treatable. Please discuss with your healthcare provider.',
  keyFindings: [
    { id: 'f1', title: 'Hemoglobin Low', description: 'At 11.2 g/dL, slightly below the normal range of 12.0-15.5 g/dL', significance: 'concern' },
    { id: 'f2', title: 'WBC Normal', description: 'White blood cell count at 6,800/μL falls within the healthy range of 4,500-11,000/μL', significance: 'normal' },
    { id: 'f3', title: 'MCV Slightly Low', description: 'Mean corpuscular volume at 78 fL, slightly below the 80-100 fL normal range — consistent with iron deficiency', significance: 'watch' },
    { id: 'f4', title: 'Platelet Count Normal', description: 'Platelet count of 245,000/μL is well within the normal range of 150,000-450,000/μL', significance: 'normal' },
  ],
  abnormalValues: [
    { id: 'ab1', name: 'Hemoglobin', value: '11.2', reference: '12.0–15.5', unit: 'g/dL', status: 'low' },
    { id: 'ab2', name: 'Hematocrit', value: '33.5', reference: '36–48', unit: '%', status: 'low' },
    { id: 'ab3', name: 'MCV', value: '78', reference: '80–100', unit: 'fL', status: 'low' },
    { id: 'ab4', name: 'MCH', value: '25.1', reference: '27–33', unit: 'pg', status: 'low' },
  ],
  doctorQuestions: [
    'Should I get iron studies done (ferritin, TIBC, serum iron)?',
    'Do these results indicate I need iron supplementation?',
    'Could any medications I am taking be contributing to this?',
    'Should I repeat this CBC after dietary changes?',
    'Is there any other testing needed based on these results?',
  ],
  nextSteps: [
    'Follow up with your primary care physician to review these results',
    'Consider asking about comprehensive iron panel tests',
    'Track any symptoms like fatigue, shortness of breath, or dizziness',
    'Review dietary iron intake and discuss supplementation options with your doctor',
    'Avoid self-medicating with iron supplements without medical guidance',
  ],
};

// Mock Image Analysis
export const MOCK_IMAGE_ANALYSIS: ImageAnalysis = {
  id: 'img_1',
  fileName: 'xray_chest.jpg',
  imageUrl: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=600&h=400&fit=crop',
  uploadedAt: '2025-06-09T11:00:00',
  status: 'complete',
  observations: [
    'The image appears to show a frontal chest radiograph',
    'Lung fields appear generally clear without obvious consolidation',
    'Cardiac silhouette appears within normal size parameters',
    'No obvious pleural effusion is visible',
    'Bony structures appear intact',
  ],
  possibleExplanations: [
    'This appears to be a routine chest X-ray examination',
    'The findings described could represent a normal study',
    'A radiologist would need to formally interpret this image',
  ],
  medicalContext: 'Chest X-rays are commonly used to evaluate the lungs, heart, and chest wall. They can help detect conditions like pneumonia, heart failure, lung masses, and rib fractures. However, proper interpretation requires a qualified radiologist.',
  safetyNotes: [
    'This AI analysis is NOT a medical diagnosis',
    'Always have medical imaging reviewed by a licensed radiologist',
    'Do not make medical decisions based on AI image analysis',
    'Consult your physician for all health concerns',
  ],
  followUpQuestions: [
    'Has this image been reviewed by a radiologist?',
    'What symptoms prompted this imaging study?',
    'Are you experiencing any respiratory symptoms?',
    'Has this been compared to prior imaging?',
  ],
  educationalInsights: 'Chest radiography uses low-dose ionizing radiation to create images of thoracic structures. It remains one of the most commonly performed diagnostic imaging studies worldwide.',
};

// Mock Dashboard Metrics
export const MOCK_DASHBOARD_METRICS: DashboardMetrics = {
  totalConversations: 127,
  reportsAnalyzed: 23,
  imagesProcessed: 18,
  aiQueries: 892,
  weeklyGrowth: 12.5,
  dailyActivity: [
    { date: 'Mon', value: 24 },
    { date: 'Tue', value: 31 },
    { date: 'Wed', value: 18 },
    { date: 'Thu', value: 45 },
    { date: 'Fri', value: 38 },
    { date: 'Sat', value: 22 },
    { date: 'Sun', value: 15 },
  ],
  weeklyActivity: [
    { date: 'Week 1', value: 68 },
    { date: 'Week 2', value: 82 },
    { date: 'Week 3', value: 75 },
    { date: 'Week 4', value: 95 },
  ],
  monthlyActivity: [
    { date: 'Jan', value: 120 },
    { date: 'Feb', value: 145 },
    { date: 'Mar', value: 132 },
    { date: 'Apr', value: 178 },
    { date: 'May', value: 165 },
    { date: 'Jun', value: 193 },
  ],
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  notifications: true,
  emailUpdates: false,
  emergencyAlerts: true,
  language: 'en',
  fontSize: 'medium',
};

// Emergency keywords
export const EMERGENCY_KEYWORDS = [
  'chest pain', 'heart attack', 'cant breathe', "can't breathe", 'difficulty breathing',
  'stroke', 'severe bleeding', 'unconscious', 'fainted', 'suicidal', 'overdose',
  'anaphylaxis', 'allergic reaction', 'loss of consciousness', 'seizure', 'choking',
  'severe headache', 'face drooping', 'arm weakness', 'sudden confusion', 'poisoning',
];

// Suggested Questions
export const SUGGESTED_QUESTIONS = [
  "What do my blood test results mean?",
  "What are common symptoms of vitamin D deficiency?",
  "How do I read a cholesterol panel?",
  "What medications interact with blood thinners?",
  "What lifestyle changes help with high blood pressure?",
  "What does an elevated CRP level indicate?",
  "How often should I get a general health checkup?",
  "What are early warning signs of diabetes?",
];

// Medicine FAQ
export const MEDICINE_SUGGESTIONS = [
  "What are the side effects of ibuprofen?",
  "How does metformin work for diabetes?",
  "What is the difference between ACE inhibitors and ARBs?",
  "Can I take aspirin with blood thinners?",
  "What foods should I avoid while taking warfarin?",
  "How long does it take for SSRIs to work?",
];
