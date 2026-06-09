import { useState, useRef, useEffect } from 'react';
import {
  Send, Plus, Trash2, Star, Search,
  Copy, RefreshCw, Share2, Heart, Paperclip
} from 'lucide-react';
import Header from '@/components/layout/Header';
import MarkdownRenderer from '@/components/features/MarkdownRenderer';
import EmergencyAlert from '@/components/features/EmergencyAlert';
import { useAuthStore, useChatStore } from '@/stores';
import { useEmergencyDetection } from '@/hooks/useEmergencyDetection';
import { generateAIResponse } from '@/lib/aiResponses';
import { generateId, formatRelativeTime, truncate } from '@/lib/utils';
import { SUGGESTED_QUESTIONS } from '@/constants/mockData';
import type { Message, Conversation, EmergencyAlert as EmergencyAlertType } from '@/types';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-gray-100 text-gray-600',
  report: 'bg-blue-100 text-blue-600',
  medicine: 'bg-teal-100 text-teal-600',
  emergency: 'bg-red-100 text-red-600',
};

function ThinkingIndicator() {
  return (
    <div className="flex items-start gap-3 message-appear">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
        <Heart className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1.5 items-center">
          <div className="thinking-dot" />
          <div className="thinking-dot" />
          <div className="thinking-dot" />
          <span className="text-xs text-gray-400 ml-1">MediAI is thinking...</span>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg, onCopy }: { msg: Message; onCopy: (text: string) => void }) {
  const isUser = msg.role === 'user';
  return (
    <div className={cn('flex items-start gap-3 message-appear', isUser && 'flex-row-reverse')}>
      {isUser ? (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex-shrink-0 overflow-hidden">
          <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face" alt="You" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
          <Heart className="w-3.5 h-3.5 text-white" />
        </div>
      )}

      <div className={cn('max-w-[75%] group', isUser ? 'items-end' : 'items-start')}>
        {isUser ? (
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed">
            {msg.content}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
            <MarkdownRenderer content={msg.content} />
          </div>
        )}

        {!isUser && (
          <div className="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onCopy(msg.content)} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 transition-colors">
              <Copy className="w-3 h-3" />Copy
            </button>
            <button className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 transition-colors">
              <Share2 className="w-3 h-3" />Share
            </button>
            <button className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 transition-colors">
              <RefreshCw className="w-3 h-3" />Regenerate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Chat() {
  const [input, setInput] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [emergencyAlert, setEmergencyAlert] = useState<EmergencyAlertType | null>(null);
  const [copied, setCopied] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { user } = useAuthStore();
  const { conversations, activeConversationId, messages, isTyping, setActiveConversation, addConversation, deleteConversation, toggleFavorite, addMessage, setTyping } = useChatStore();
  const { alert: detectedAlert } = useEmergencyDetection(input);

  const activeMessages = messages.filter(m => m.conversationId === activeConversationId);
  const activeConv = conversations.find(c => c.id === activeConversationId);
  const filteredConvs = conversations.filter(c => !c.isArchived).filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages, streamingContent, isTyping]);

  const startNewChat = () => {
    setActiveConversation(null);
    setStreamingContent('');
    setEmergencyAlert(null);
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;
    const userText = input.trim();
    setInput('');

    if (detectedAlert) setEmergencyAlert(detectedAlert);

    let convId = activeConversationId;
    if (!convId) {
      convId = generateId();
      const newConv: Conversation = {
        id: convId,
        title: userText.length > 40 ? userText.slice(0, 40) + '...' : userText,
        lastMessage: userText,
        timestamp: new Date().toISOString(),
        messageCount: 0,
        isFavorite: false,
        isArchived: false,
        category: 'general',
      };
      addConversation(newConv);
      setActiveConversation(convId);
    }

    const userMsg: Message = { id: generateId(), conversationId: convId, role: 'user', content: userText, timestamp: new Date().toISOString() };
    addMessage(userMsg);

    setTyping(true);
    setIsStreaming(true);
    setStreamingContent('');

    await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
    setTyping(false);

    let accum = '';
    await generateAIResponse(userText, (chunk) => {
      accum = chunk;
      setStreamingContent(chunk);
    });

    const aiMsg: Message = { id: generateId(), conversationId: convId, role: 'assistant', content: accum, timestamp: new Date().toISOString() };
    addMessage(aiMsg);
    setStreamingContent('');
    setIsStreaming(false);
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Inner sidebar */}
      <div className="w-64 flex-shrink-0 border-r border-gray-200 bg-gray-50/80 hidden lg:flex flex-col">
        <div className="p-3 border-b border-gray-200">
          <button onClick={startNewChat} className="btn-gradient w-full text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        <div className="px-3 py-2">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
            <Search className="w-3.5 h-3.5 text-gray-400" />
            <input type="text" placeholder="Search chats..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 text-xs text-gray-700 bg-transparent focus:outline-none placeholder:text-gray-400" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
          {filteredConvs.map(conv => (
            <button key={conv.id} onClick={() => setActiveConversation(conv.id)} className={cn('w-full text-left px-3 py-2.5 rounded-xl transition-all group', activeConversationId === conv.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-white border border-transparent hover:border-gray-200')}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-semibold text-gray-800 truncate flex-1 pr-2">{truncate(conv.title, 24)}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); toggleFavorite(conv.id); }} className="p-0.5 hover:text-amber-500 transition-colors">
                    <Star className={cn('w-3 h-3', conv.isFavorite ? 'text-amber-400 fill-amber-400' : 'text-gray-400')} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }} className="p-0.5 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 truncate">{conv.lastMessage}</p>
              <div className="flex items-center justify-between mt-1">
                <span className={cn('text-[9px] font-medium px-1.5 py-0.5 rounded-full', CATEGORY_COLORS[conv.category])}>{conv.category}</span>
                <span className="text-[9px] text-gray-400">{formatRelativeTime(conv.timestamp)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main chat */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={activeConv?.title || 'AI Medical Chat'} subtitle="Educational health information only" />

        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-4 max-w-4xl w-full mx-auto">
          {emergencyAlert && <EmergencyAlert alert={emergencyAlert} onDismiss={() => setEmergencyAlert(null)} />}

          {!activeConversationId && activeMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mb-5 animate-pulse-glow">
                <Heart className="w-8 h-8 text-white animate-heartbeat" />
              </div>
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">How can I help you today?</h2>
              <p className="text-gray-500 text-sm max-w-md mb-8">Ask me about health topics, medications, test results, or general wellness. I provide educational information only.</p>
              <div className="grid sm:grid-cols-2 gap-2 w-full max-w-2xl">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button key={i} onClick={() => { setInput(q); inputRef.current?.focus(); }} className="text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-sm text-gray-700 hover:text-blue-700">
                    {q}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
                <span>⚠️</span>
                <span>Educational information only — not medical advice</span>
              </div>
            </div>
          )}

          {activeMessages.map(msg => <MessageBubble key={msg.id} msg={msg} onCopy={copyText} />)}
          {isTyping && <ThinkingIndicator />}
          {isStreaming && streamingContent && (
            <div className="flex items-start gap-3 message-appear">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                <Heart className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm max-w-[75%]">
                <MarkdownRenderer content={streamingContent} />
                <span className="inline-block w-0.5 h-4 bg-blue-500 animate-blink ml-0.5 align-text-bottom" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-200 bg-white/90 backdrop-blur-xl px-4 md:px-8 py-4">
          <div className="max-w-4xl mx-auto">
            {detectedAlert && input && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 mb-3 animate-slide-up">
                <span className="text-red-600 text-sm">⚠️ Emergency keywords detected — call 911 if this is urgent</span>
              </div>
            )}
            {copied && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 border border-green-200 mb-3">
                <span className="text-green-700 text-xs">✓ Copied to clipboard</span>
              </div>
            )}
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a health question... (Press Enter to send, Shift+Enter for new line)"
                  rows={1}
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 pr-12 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none max-h-40 transition-all"
                  style={{ minHeight: '48px' }}
                  onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 160) + 'px'; }}
                />
                <button className="absolute right-3 bottom-3 text-gray-400 hover:text-blue-500 transition-colors">
                  <Paperclip className="w-4 h-4" />
                </button>
              </div>
              <button onClick={sendMessage} disabled={!input.trim() || isStreaming} className="w-12 h-12 rounded-2xl btn-gradient text-white flex items-center justify-center flex-shrink-0 disabled:opacity-50 shadow-lg shadow-blue-500/25 transition-all">
                {isStreaming ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-2">MediAI provides educational information only. Not a substitute for professional medical advice.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
