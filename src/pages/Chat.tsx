import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Trash2, Star, Search, Copy, Heart, Plus, Shield,
  CheckCheck, Stethoscope, Mic, MicOff, Volume2, VolumeX,
  Play, Pause, Square, Loader2
} from 'lucide-react';
import MarkdownRenderer from '@/components/features/MarkdownRenderer';
import { useAuthStore, useChatStore, useUIStore } from '@/stores';
import { useEmergencyDetection } from '@/hooks/useEmergencyDetection';
import { useSpeechToText, useTextToSpeech } from '@/hooks/useVoice';
import type { VoiceState, TTSState } from '@/hooks/useVoice';
import { generateAIResponse } from '@/lib/aiResponses';
import { formatRelativeTime, truncate } from '@/lib/utils';
import { SUGGESTED_QUESTIONS } from '@/constants/mockData';
import type { Message } from '@/types';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-gray-100 text-gray-500',
  report: 'bg-blue-100 text-blue-600',
  medicine: 'bg-teal-100 text-teal-600',
  emergency: 'bg-red-100 text-red-600',
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── Voice waveform ────────────────────────────────────────────────────────────
function VoiceWave({ color = 'bg-red-500' }: { color?: string }) {
  return (
    <div className="flex items-center gap-[3px] h-5">
      {[0.6, 1, 0.7, 1, 0.6].map((h, i) => (
        <span
          key={i}
          className={cn('w-[3px] rounded-full animate-voice-wave', color)}
          style={{ height: `${h * 100}%`, animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}

// ── TTS player for a single AI message ───────────────────────────────────────
function TTSPlayer({ msgId, text, isMuted, activeId, onActivate, onDeactivate }: {
  msgId: string; text: string; isMuted: boolean;
  activeId: string | null;
  onActivate: (id: string) => void;
  onDeactivate: () => void;
}) {
  const [state, setState] = useState<TTSState>('idle');
  const tts = useTextToSpeech();
  const isActive = activeId === msgId;

  // Stop if another message became active
  useEffect(() => {
    if (!isActive && state !== 'idle') {
      tts.stop();
      setState('idle');
    }
  }, [isActive]);

  if (!tts.isSupported || isMuted) return null;

  const handlePlay = () => {
    onActivate(msgId);
    tts.speak(text, (s) => {
      setState(s);
      if (s === 'idle') onDeactivate();
    });
  };

  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      {state === 'idle' && (
        <button onClick={handlePlay}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 text-[11px] font-semibold transition-colors"
        >
          <Volume2 className="w-3 h-3" /> Listen
        </button>
      )}
      {state === 'playing' && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100 border border-blue-300">
          <VoiceWave color="bg-blue-500" />
          <span className="text-[11px] font-semibold text-blue-700">Speaking...</span>
          <button onClick={() => { tts.pause(); setState('paused'); }}
            className="w-5 h-5 rounded-md bg-white flex items-center justify-center hover:bg-blue-50 ml-1">
            <Pause className="w-2.5 h-2.5 text-blue-600" />
          </button>
          <button onClick={() => { tts.stop(); setState('idle'); onDeactivate(); }}
            className="w-5 h-5 rounded-md bg-white flex items-center justify-center hover:bg-red-50">
            <Square className="w-2.5 h-2.5 text-red-500" />
          </button>
        </div>
      )}
      {state === 'paused' && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200">
          <span className="text-[11px] font-semibold text-gray-500">Paused</span>
          <button onClick={() => { tts.resume(); setState('playing'); }}
            className="w-5 h-5 rounded-md bg-white flex items-center justify-center hover:bg-blue-50">
            <Play className="w-2.5 h-2.5 text-blue-600" />
          </button>
          <button onClick={() => { tts.stop(); setState('idle'); onDeactivate(); }}
            className="w-5 h-5 rounded-md bg-white flex items-center justify-center hover:bg-red-50">
            <Square className="w-2.5 h-2.5 text-red-500" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Thinking indicator ────────────────────────────────────────────────────────
function ThinkingIndicator() {
  return (
    <div className="flex items-end gap-2 message-appear">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md">
        <Stethoscope className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1.5 items-center h-5">
          {[0, 150, 300].map(d => (
            <span key={d} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, onCopy, userAvatar, isMuted, activeTTSId, onTTSActivate, onTTSDeactivate }: {
  msg: Message; onCopy: (t: string) => void; userAvatar?: string;
  isMuted: boolean; activeTTSId: string | null;
  onTTSActivate: (id: string) => void;
  onTTSDeactivate: () => void;
}) {
  const isUser = msg.role === 'user';
  const isEmergency = msg.isEmergency || /call 108|call 112|emergency|ambulance/i.test(msg.content);
  const [copied, setCopied] = useState(false);

  return (
    <div className={cn('flex items-end gap-2 message-appear', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      {!isUser ? (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md mb-1">
          <Stethoscope className="w-4 h-4 text-white" />
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden shadow-md mb-1 bg-gradient-to-br from-blue-500 to-indigo-600">
          {userAvatar
            ? <img src={userAvatar} alt="You" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><Heart className="w-4 h-4 text-white" /></div>
          }
        </div>
      )}

      <div className={cn('flex flex-col max-w-[72%] md:max-w-[60%]', isUser ? 'items-end' : 'items-start')}>
        <span className="text-[11px] text-gray-400 font-medium mb-1 px-1">{isUser ? 'You' : 'Dr. MediAI'}</span>

        <div className="group relative">
          {isUser ? (
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-2xl rounded-br-sm shadow-md text-sm leading-relaxed">
              {msg.content}
            </div>
          ) : (
            <div className={cn('px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm text-sm',
              isEmergency ? 'bg-red-50 border-2 border-red-400 ring-2 ring-red-200' : 'bg-white border border-gray-200'
            )}>
              {isEmergency && (
                <div className="flex items-center gap-1.5 mb-2 text-red-600 font-bold text-xs">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  EMERGENCY — Call 108 immediately
                </div>
              )}
              <MarkdownRenderer content={msg.content} />
            </div>
          )}
          {!isUser && (
            <button onClick={() => { onCopy(msg.content); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-gray-200 rounded-full shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Copy className="w-3 h-3 text-gray-500" />
            </button>
          )}
        </div>

        {/* TTS player */}
        {!isUser && !isEmergency && msg.id && (
          <TTSPlayer
            msgId={msg.id} text={msg.content}
            isMuted={isMuted} activeId={activeTTSId}
            onActivate={onTTSActivate} onDeactivate={onTTSDeactivate}
          />
        )}

        <div className={cn('flex items-center gap-1 mt-1 px-1', isUser ? 'flex-row-reverse' : 'flex-row')}>
          <span className="text-[10px] text-gray-400">{msg.timestamp ? formatTime(msg.timestamp) : ''}</span>
          {isUser && <CheckCheck className="w-3 h-3 text-blue-400" />}
          {copied && <span className="text-[10px] text-green-500 font-medium">Copied!</span>}
        </div>
      </div>
    </div>
  );
}

// ── Streaming bubble ──────────────────────────────────────────────────────────
function StreamingBubble({ content }: { content: string }) {
  return (
    <div className="flex items-end gap-2 message-appear">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md mb-1">
        <Stethoscope className="w-4 h-4 text-white" />
      </div>
      <div className="flex flex-col items-start max-w-[72%] md:max-w-[60%]">
        <span className="text-[11px] text-gray-400 font-medium mb-1 px-1">Dr. MediAI</span>
        <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm text-sm">
          <MarkdownRenderer content={content} />
          <span className="inline-block w-0.5 h-4 bg-blue-500 animate-pulse ml-0.5 align-text-bottom rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Chat() {
  const [input, setInput] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [interimText, setInterimText] = useState('');
  const [activeTTSId, setActiveTTSId] = useState<string | null>(null);
  const [voiceMode, setVoiceMode] = useState(false); // true = auto-send after STT

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pendingSendRef = useRef(''); // holds text to auto-send after STT

  const { user } = useAuthStore();
  const { conversations, activeConversationId, messages, isTyping,
    setActiveConversation, addConversation, deleteConversation,
    toggleFavorite, addMessage, setTyping } = useChatStore();
  const { preferences, updatePreferences } = useUIStore();
  const { alert: detectedAlert } = useEmergencyDetection(input);

  const stt = useSpeechToText();
  const tts = useTextToSpeech();

  const activeMessages = messages.filter(m => m.conversationId === activeConversationId);
  const isMuted = preferences.voiceMuted;
  const filteredConvs = conversations.filter(c => !c.isArchived)
    .filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages, streamingContent, isTyping]);

  // Core send function — accepts text directly
  const doSend = useCallback(async (text: string) => {
    if (!text.trim() || !user) return;
    setInput('');
    setInterimText('');
    if (inputRef.current) inputRef.current.style.height = 'auto';

    let convId = activeConversationId;
    if (!convId) {
      const newConv = await addConversation(user.id, {
        title: text.length > 40 ? text.slice(0, 40) + '...' : text,
        lastMessage: text,
        timestamp: new Date().toISOString(),
        messageCount: 0, isFavorite: false, isArchived: false, category: 'general',
      });
      if (!newConv) return;
      convId = newConv.id;
      setActiveConversation(convId);
    }

    if (detectedAlert) {
      await addMessage(user.id, {
        conversationId: convId, role: 'assistant',
        content: `🚨 **EMERGENCY DETECTED**\n\n📞 **[Call 108 — Ambulance](tel:108)** | **[Call 112 — Police/Fire](tel:112)**\n\nYour message may describe a life-threatening situation. **Do not wait for an AI response** — call emergency services immediately.\n\n*AI response below is for informational support only.*`,
        isEmergency: true,
      } as any);
    }

    await addMessage(user.id, { conversationId: convId, role: 'user', content: text });
    setTyping(true);
    setIsStreaming(true);
    setStreamingContent('');
    tts.stop();
    setActiveTTSId(null);
    await new Promise(r => setTimeout(r, 300));
    setTyping(false);

    let accum = '';
    await generateAIResponse(text, (chunk) => { accum = chunk; setStreamingContent(chunk); }, messages);

    const saved = await addMessage(user.id, { conversationId: convId, role: 'assistant', content: accum });
    setStreamingContent('');
    setIsStreaming(false);

    // Auto-play TTS if not muted
    if (!isMuted && saved?.id && accum) {
      setActiveTTSId(saved.id);
      tts.speak(accum, (s) => { if (s === 'idle') setActiveTTSId(null); });
    }
  }, [user, activeConversationId, messages, detectedAlert, isMuted]);

  // Start mic recording
  const startListening = useCallback(() => {
    if (voiceState !== 'idle' || isStreaming) return;
    stt.start({
      onState: setVoiceState,
      onInterim: setInterimText,
      onFinal: (finalText) => {
        setInput(finalText);
        setInterimText('');
        pendingSendRef.current = finalText;
        // Small delay so state updates, then auto-send
        setTimeout(() => {
          if (pendingSendRef.current) {
            doSend(pendingSendRef.current);
            pendingSendRef.current = '';
          }
        }, 400);
      },
    });
  }, [voiceState, isStreaming, doSend]);

  const stopListening = useCallback(() => {
    stt.stop();
    setVoiceState('idle');
    setInterimText('');
  }, []);

  const toggleMic = useCallback(() => {
    if (voiceState === 'listening') stopListening();
    else startListening();
  }, [voiceState, startListening, stopListening]);

  const sendMessage = () => { if (input.trim() && !isStreaming) doSend(input.trim()); };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="flex h-full overflow-hidden bg-gray-50">

      {/* ── Sidebar ── */}
      <div className="w-64 flex-shrink-0 border-r border-gray-200 bg-white hidden lg:flex flex-col">
        <div className="p-3 border-b border-gray-100">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input type="text" placeholder="Search conversations..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 text-xs text-gray-700 bg-transparent focus:outline-none placeholder:text-gray-400"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {filteredConvs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Heart className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-xs text-gray-400">No conversations yet</p>
            </div>
          ) : filteredConvs.map(conv => (
            <button key={conv.id} onClick={() => setActiveConversation(conv.id)}
              className={cn('w-full text-left px-3 py-3 transition-all group border-b border-gray-50',
                activeConversationId === conv.id ? 'bg-blue-50' : 'hover:bg-gray-50'
              )}
            >
              <div className="flex items-start gap-2.5">
                <div className={cn('w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                  activeConversationId === conv.id ? 'bg-blue-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                )}>
                  <Stethoscope className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-800 truncate">{truncate(conv.title, 20)}</span>
                    <span className="text-[9px] text-gray-400 flex-shrink-0 ml-1">{formatRelativeTime(conv.timestamp)}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 truncate mt-0.5">{conv.lastMessage}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className={cn('text-[9px] font-medium px-1.5 py-0.5 rounded-full', CATEGORY_COLORS[conv.category])}>{conv.category}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={e => { e.stopPropagation(); toggleFavorite(conv.id); }} className="p-0.5">
                        <Star className={cn('w-3 h-3', conv.isFavorite ? 'text-amber-400 fill-amber-400' : 'text-gray-300')} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); deleteConversation(conv.id); }} className="p-0.5">
                        <Trash2 className="w-3 h-3 text-gray-300 hover:text-red-400 transition-colors" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-gray-100">
          <button onClick={() => setActiveConversation(null)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold shadow-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" /> New Conversation
          </button>
        </div>
      </div>

      {/* ── Main Chat ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0 shadow-sm">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
            <Stethoscope className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-gray-900 text-sm">Dr. MediAI</h2>
              <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
            </div>
            <p className="text-[11px] text-gray-400">Personal Medical Assistant · Online</p>
          </div>
          <button
            onClick={() => {
              const nextMuted = !isMuted;
              updatePreferences({ voiceMuted: nextMuted }, user?.id);
              if (nextMuted) {
                tts.stop();
                setActiveTTSId(null);
              }
            }}
            className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all',
              isMuted ? 'bg-gray-100 border-gray-200 text-gray-400' : 'bg-blue-50 border-blue-200 text-blue-600'
            )}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Voice On'}</span>
          </button>
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
            <Shield className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] text-amber-700 font-medium hidden sm:inline">Educational Only</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 md:px-6 py-4 space-y-3">
          {!activeConversationId && activeMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[55vh] text-center px-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
                <Stethoscope className="w-8 h-8 text-white" />
              </div>
              <h2 className="font-bold text-xl text-gray-900 mb-1">Hi, I'm Dr. MediAI 👋</h2>
              <p className="text-gray-500 text-sm max-w-sm mb-2">Type or speak your health question — I'll respond with text and voice.</p>
              <div className="flex items-center gap-2 mb-5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full">
                <Mic className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs text-blue-700 font-medium">Tap the mic button to speak</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-2 w-full max-w-lg">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button key={i} onClick={() => doSend(q)}
                    className="text-left px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 transition-all text-xs text-gray-700 hover:text-blue-700 shadow-sm"
                  >{q}</button>
                ))}
              </div>
            </div>
          )}

          {activeMessages.length > 0 && (
            <div className="flex items-center gap-2 py-1">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[10px] text-gray-400 font-medium px-2">Today</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          )}

          {activeMessages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} onCopy={t => navigator.clipboard.writeText(t)}
              userAvatar={user?.avatar} isMuted={isMuted}
              activeTTSId={activeTTSId}
              onTTSActivate={setActiveTTSId}
              onTTSDeactivate={() => setActiveTTSId(null)}
            />
          ))}
          {isTyping && <ThinkingIndicator />}
          {isStreaming && streamingContent && <StreamingBubble content={streamingContent} />}
          <div ref={messagesEndRef} />
        </div>

        {/* Voice status bar */}
        {voiceState !== 'idle' && (
          <div className={cn(
            'mx-3 md:mx-5 mb-2 flex items-center gap-3 px-4 py-2.5 rounded-2xl border text-sm font-semibold',
            voiceState === 'listening' ? 'bg-red-50 border-red-300 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'
          )}>
            {voiceState === 'listening' ? (
              <>
                <VoiceWave color="bg-red-500" />
                <span>Listening...</span>
                {interimText && (
                  <span className="text-xs font-normal text-gray-500 truncate flex-1 italic">"{interimText}"</span>
                )}
                <button onClick={stopListening} className="ml-auto text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-0.5 rounded-lg">
                  Stop
                </button>
              </>
            ) : (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing your voice...</span>
              </>
            )}
          </div>
        )}

        {/* Input bar */}
        <div className="bg-white border-t border-gray-200 px-3 md:px-5 py-3 flex-shrink-0">
          {detectedAlert && input && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 mb-2 text-xs text-red-600">
              ⚠️ Emergency detected — <strong>Call 108</strong> immediately if urgent
            </div>
          )}

          <div className={cn(
            'flex items-end gap-2 rounded-2xl px-3 py-2 transition-all border',
            voiceState === 'listening' ? 'bg-red-50 border-red-300 shadow-inner' : 'bg-gray-100 border-transparent'
          )}>
            {/* Mic button */}
            {stt.isSupported && (
              <button onClick={toggleMic} disabled={voiceState === 'processing' || isStreaming}
                title={voiceState === 'listening' ? 'Stop listening' : voiceState === 'processing' ? 'Processing...' : 'Speak your question'}
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all',
                  voiceState === 'listening'
                    ? 'bg-red-500 text-white shadow-lg shadow-red-300 scale-110 animate-pulse'
                    : voiceState === 'processing'
                    ? 'bg-blue-100 text-blue-400 cursor-wait'
                    : 'bg-white border border-gray-200 text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 hover:scale-105'
                )}
              >
                {voiceState === 'processing' ? <Loader2 className="w-4 h-4 animate-spin" />
                  : voiceState === 'listening' ? <MicOff className="w-4 h-4" />
                  : <Mic className="w-4 h-4" />}
              </button>
            )}

            <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={voiceState === 'listening' ? '🎤 Listening...' : 'Type or speak your question...'}
              rows={1}
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none resize-none max-h-32 py-1.5"
              style={{ minHeight: '36px' }}
              onInput={e => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = 'auto';
                t.style.height = Math.min(t.scrollHeight, 128) + 'px';
              }}
            />

            <button onClick={sendMessage} disabled={!input.trim() || isStreaming || voiceState !== 'idle'}
              className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all',
                input.trim() && !isStreaming && voiceState === 'idle'
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              )}
            >
              {isStreaming ? <div className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
                : <Send className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between mt-1.5 px-1">
            <p className="text-[10px] text-gray-400 flex items-center gap-1">
              {stt.isSupported
                ? <><Mic className="w-2.5 h-2.5" /> Tap mic · Supports English & Indian accents · Auto-sends after speaking</>
                : 'Voice not supported in this browser (use Chrome)'}
            </p>
            <p className="text-[10px] text-gray-400">Not a substitute for medical advice</p>
          </div>
        </div>
      </div>
    </div>
  );
}
