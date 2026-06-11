import { useMemo } from 'react';
import { EMERGENCY_KEYWORDS } from '@/constants/mockData';
import type { EmergencyAlert } from '@/types';
import { generateId } from '@/lib/utils';

const EMERGENCY_CONFIGS: Record<string, { type: EmergencyAlert['type']; actions: string[] }> = {
  'chest pain': {
    type: 'chest_pain',
    actions: [
      'Call 108 immediately or have someone drive you to the ER',
      'Chew an aspirin (325mg) if not allergic and no contraindications',
      'Sit or lie down in a comfortable position',
      'Loosen tight clothing',
      'Do not drive yourself to the hospital',
    ],
  },
  'heart attack': {
    type: 'heart_attack',
    actions: [
      'Call 108 immediately',
      'Chew aspirin if available and not contraindicated',
      'Stay calm and still — do not exert yourself',
      'Unlock your door so emergency services can enter',
      'If trained, begin CPR if the person is unresponsive',
    ],
  },
  "can't breathe": {
    type: 'breathing',
    actions: [
      'Call 108 immediately',
      'Sit upright to make breathing easier',
      'Use prescribed inhaler if available (asthma)',
      'Remove tight clothing around chest and neck',
      'Do not leave the person alone',
    ],
  },
  'stroke': {
    type: 'stroke',
    actions: [
      'Call 108 immediately — time is critical for stroke treatment',
      'Note the exact time symptoms started',
      'Do not give food, water, or medications',
      'Keep person calm and lying down',
      'Remember FAST: Face drooping, Arm weakness, Speech difficulty, Time to call 108',
    ],
  },
  'suicidal': {
    type: 'mental_health',
    actions: [
      'Call iCall at 9152987821 immediately',
      'If in immediate danger, call 112',
      'Stay with the person — do not leave them alone',
      'Remove access to means of self-harm if safe to do so',
      'Listen without judgment and express care',
    ],
  },
};

function detectEmergency(text: string): EmergencyAlert | null {
  const lower = text.toLowerCase();
  for (const keyword of EMERGENCY_KEYWORDS) {
    if (lower.includes(keyword)) {
      const config = EMERGENCY_CONFIGS[keyword] || {
        type: 'general' as const,
        actions: [
          'Call 108 if this is a life-threatening emergency',
          'Contact your nearest emergency room',
          'Call your doctor or urgent care immediately',
          'Do not delay seeking professional medical help',
        ],
      };
      return {
        id: generateId(),
        type: config.type,
        message: text,
        actions: config.actions,
        timestamp: new Date().toISOString(),
      };
    }
  }
  return null;
}

export function useEmergencyDetection(text: string) {
  const alert = useMemo(() => detectEmergency(text), [text]);
  return { alert, isEmergency: alert !== null };
}
