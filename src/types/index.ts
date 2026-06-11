export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  joinedAt: string;
  plan: 'free' | 'pro' | 'enterprise';
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  messageCount: number;
  isFavorite: boolean;
  isArchived: boolean;
  category: 'general' | 'report' | 'medicine' | 'emergency';
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isEmergency?: boolean;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  name: string;
  type: 'pdf' | 'image';
  url: string;
  size: number;
}

export interface ReportAnalysis {
  id: string;
  fileName: string;
  uploadedAt: string;
  status: 'processing' | 'complete' | 'error';
  summary?: string;
  keyFindings?: Finding[];
  abnormalValues?: AbnormalValue[];
  doctorQuestions?: string[];
  nextSteps?: string[];
  riskLevel?: 'low' | 'moderate' | 'high';
}

export interface Finding {
  id: string;
  title: string;
  description: string;
  significance: 'normal' | 'watch' | 'concern';
}

export interface AbnormalValue {
  id: string;
  name: string;
  value: string;
  reference: string;
  unit: string;
  status: 'high' | 'low' | 'critical';
}

export interface ImageAnalysis {
  id: string;
  fileName: string;
  imageUrl: string;
  uploadedAt: string;
  status: 'processing' | 'complete' | 'error';
  observations?: string[];
  possibleExplanations?: string[];
  medicalContext?: string;
  safetyNotes?: string[];
  followUpQuestions?: string[];
  educationalInsights?: string;
}

export interface DashboardMetrics {
  totalConversations: number;
  reportsAnalyzed: number;
  imagesProcessed: number;
  aiQueries: number;
  weeklyGrowth: number;
  dailyActivity: ActivityPoint[];
  weeklyActivity: ActivityPoint[];
  monthlyActivity: ActivityPoint[];
}

export interface ActivityPoint {
  date: string;
  value: number;
  label?: string;
}

export interface EmergencyAlert {
  id: string;
  type: 'chest_pain' | 'breathing' | 'stroke' | 'bleeding' | 'heart_attack' | 'unconscious' | 'mental_health' | 'general';
  message: string;
  actions: string[];
  timestamp: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  emailUpdates: boolean;
  emergencyAlerts: boolean;
  voiceMuted: boolean;
  language: string;
  fontSize: 'small' | 'medium' | 'large';
}

export type NavItem = {
  label: string;
  path: string;
  icon: string;
  badge?: number;
};
