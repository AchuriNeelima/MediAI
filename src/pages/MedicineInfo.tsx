import { useState } from 'react';
import { Search, Pill, Shield, Send, X } from 'lucide-react';
import Header from '@/components/layout/Header';
import MarkdownRenderer from '@/components/features/MarkdownRenderer';
import { generateAIResponse } from '@/lib/aiResponses';
import { MEDICINE_SUGGESTIONS } from '@/constants/mockData';
import { generateId } from '@/lib/utils';
import { cn } from '@/lib/utils';

const QUICK_TOPICS = [
  { label: 'Aspirin', icon: '💊' },
  { label: 'Ibuprofen', icon: '🔴' },
  { label: 'Metformin', icon: '💉' },
  { label: 'Lisinopril', icon: '🫀' },
  { label: 'Atorvastatin', icon: '🧪' },
  { label: 'Sertraline', icon: '🧠' },
  { label: 'Omeprazole', icon: '🫁' },
  { label: 'Levothyroxine', icon: '⚗️' },
];

interface ChatEntry {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function MedicineInfo() {
  const [input, setInput] = useState('');
  const [chat, setChat] = useState<ChatEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');

  const sendQuery = async (query: string) => {
    if (!query.trim() || isStreaming) return;
    const q = query.trim();
    setInput('');
    setChat(prev => [...prev, { id: generateId(), role: 'user', content: q }]);
    setIsStreaming(true);
    setStreamContent('');
    let accum = '';
    await generateAIResponse(q, (chunk) => { accum = chunk; setStreamContent(chunk); });
    setChat(prev => [...prev, { id: generateId(), role: 'assistant', content: accum }]);
    setStreamContent('');
    setIsStreaming(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Medicine Information" subtitle="Educational drug and medication information" />

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 max-w-4xl w-full mx-auto">
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 mb-6">
          <Shield className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            <strong>Never prescribes medication.</strong> MediAI provides educational information about medications only. Always consult your doctor or pharmacist before starting, stopping, or changing medications.
          </p>
        </div>

        {chat.length === 0 && (
          <div className="mb-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-teal-500 to-green-600 flex items-center justify-center mx-auto mb-4">
                <Pill className="w-8 h-8 text-white" />
              </div>
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">Medicine Information Center</h2>
              <p className="text-gray-500 text-sm max-w-md mx-auto">Get educational information about medications, side effects, drug interactions, dosing guidelines, and more.</p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {QUICK_TOPICS.map((topic) => (
                <button key={topic.label} onClick={() => sendQuery(`Tell me about ${topic.label}`)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 hover:border-teal-300 hover:bg-teal-50 text-sm text-gray-700 hover:text-teal-700 transition-all">
                  <span>{topic.icon}</span>
                  {topic.label}
                </button>
              ))}
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest text-center mb-3">Common Questions</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {MEDICINE_SUGGESTIONS.map((q, i) => (
                  <button key={i} onClick={() => sendQuery(q)} className="text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-teal-300 hover:bg-teal-50 text-sm text-gray-700 hover:text-teal-700 transition-all flex items-start gap-2">
                    <Pill className="w-3.5 h-3.5 text-teal-500 mt-0.5 flex-shrink-0" />
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4 mb-6">
          {chat.map(entry => (
            <div key={entry.id} className={cn('flex items-start gap-3', entry.role === 'user' && 'flex-row-reverse')}>
              {entry.role === 'assistant' ? (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-green-600 flex items-center justify-center flex-shrink-0">
                  <Pill className="w-3.5 h-3.5 text-white" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex-shrink-0 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-600 to-green-600 text-white text-xs font-bold">Y</div>
                </div>
              )}
              <div className={cn('max-w-[80%] rounded-2xl px-4 py-3', entry.role === 'user' ? 'bg-gradient-to-br from-teal-600 to-green-600 text-white text-sm rounded-tr-sm' : 'bg-white border border-gray-200 shadow-sm rounded-tl-sm')}>
                {entry.role === 'user' ? <p className="text-sm leading-relaxed">{entry.content}</p> : <MarkdownRenderer content={entry.content} />}
              </div>
            </div>
          ))}

          {isStreaming && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-green-600 flex items-center justify-center flex-shrink-0">
                <Pill className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm max-w-[80%]">
                {streamContent ? (
                  <>
                    <MarkdownRenderer content={streamContent} />
                    <span className="inline-block w-0.5 h-4 bg-teal-500 animate-blink ml-0.5 align-text-bottom" />
                  </>
                ) : (
                  <div className="flex gap-1 items-center py-1">
                    <div className="thinking-dot" style={{ background: '#14b8a6' }} />
                    <div className="thinking-dot" style={{ background: '#14b8a6' }} />
                    <div className="thinking-dot" style={{ background: '#14b8a6' }} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-200 bg-white/90 backdrop-blur-xl px-4 md:px-8 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-teal-500/30 focus-within:border-teal-400 transition-all bg-white">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendQuery(input)}
                placeholder="Ask about any medication, drug interaction, or side effects..."
                className="flex-1 text-sm text-gray-800 placeholder:text-gray-400 bg-transparent focus:outline-none"
              />
              {input && <button onClick={() => setInput('')} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>}
            </div>
            <button
              onClick={() => sendQuery(input)}
              disabled={!input.trim() || isStreaming}
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white disabled:opacity-50 shadow-lg transition-all"
              style={{ background: 'linear-gradient(135deg, #14b8a6, #22c55e)' }}
            >
              {isStreaming ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-400 mt-2">For informational purposes only — never a substitute for pharmacist or physician advice</p>
        </div>
      </div>
    </div>
  );
}
