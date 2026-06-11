import { AlertTriangle, Phone, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { EmergencyAlert as EmergencyAlertType } from '@/types';

const EMERGENCY_LABELS: Record<string, string> = {
  chest_pain: '🫀 Possible Cardiac Emergency Detected',
  breathing: '🫁 Breathing Emergency Detected',
  stroke: '🧠 Possible Stroke Symptoms Detected',
  bleeding: '🩸 Severe Bleeding Emergency',
  heart_attack: '🫀 Heart Attack Symptoms Detected',
  unconscious: '🚨 Unconsciousness Emergency',
  mental_health: '💙 Mental Health Crisis Detected',
  general: '🚨 Potential Medical Emergency Detected',
};

interface Props {
  alert: EmergencyAlertType;
  onDismiss: () => void;
}

export default function EmergencyAlert({ alert, onDismiss }: Props) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="emergency-pulse rounded-xl border-2 border-red-500 bg-red-50 overflow-hidden mb-4 animate-slide-up">
      <div className="bg-red-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-white flex-shrink-0" />
          <span className="text-white font-bold text-sm">
            {EMERGENCY_LABELS[alert.type] || EMERGENCY_LABELS.general}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setExpanded(!expanded)} className="text-white/80 hover:text-white transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button onClick={onDismiss} className="text-white/80 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 border-2 border-red-300 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-red-800 font-semibold text-sm mb-1">⚠️ Immediate Action Required</p>
              <p className="text-red-700 text-sm">
                Your message may describe a medical emergency. Please do not wait for an AI response — seek immediate medical attention.
              </p>
            </div>
          </div>

          <a
            href="tel:108"
            className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg mb-3 transition-colors animate-pulse"
          >
            <Phone className="w-5 h-5" />
            📞 Call 108 Now — Ambulance
          </a>
          <a
            href="tel:112"
            className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-lg mb-4 transition-colors"
          >
            <Phone className="w-4 h-4" />
            Call 112 — Police / Fire
          </a>

          <div>
            <p className="text-red-800 font-semibold text-sm mb-2">Immediate Steps:</p>
            <ul className="space-y-1.5">
              {alert.actions.map((action, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                  <span className="w-5 h-5 rounded-full bg-red-200 text-red-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {action}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-red-500 text-xs mt-3 text-center">
            AI responses are not a substitute for emergency medical care
          </p>
        </div>
      )}
    </div>
  );
}
