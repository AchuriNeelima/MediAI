import { useRef } from 'react';

export type VoiceState = 'idle' | 'listening' | 'processing';
export type TTSState = 'idle' | 'playing' | 'paused';

// ── Speech to Text ────────────────────────────────────────────────────────────
export function useSpeechToText() {
  const recognitionRef = useRef<any>(null);

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const start = (callbacks: {
    onState: (s: VoiceState) => void;
    onInterim: (t: string) => void;
    onFinal: (t: string) => void;
  }) => {
    if (!isSupported) return;

    // Stop any existing session first
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognitionRef.current = recognition;

    recognition.lang = 'en-IN';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    callbacks.onState('listening');

    recognition.onresult = (e: any) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += transcript;
        else interim += transcript;
      }
      if (interim) callbacks.onInterim(interim);
      if (final) {
        callbacks.onState('processing');
        recognitionRef.current = null;
        setTimeout(() => {
          callbacks.onFinal(final.trim());
          callbacks.onState('idle');
        }, 300);
      }
    };

    recognition.onerror = (e: any) => {
      console.warn('Speech recognition error:', e.error);
      recognitionRef.current = null;
      callbacks.onState('idle');
    };

    recognition.onend = () => {
      // Only reset to idle if we haven't already moved to processing
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
        callbacks.onState('idle');
      }
    };

    try {
      recognition.start();
    } catch (err) {
      console.warn('Failed to start recognition:', err);
      recognitionRef.current = null;
      callbacks.onState('idle');
    }
  };

  const stop = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
  };

  return { start, stop, isSupported };
}

// ── Text to Speech ────────────────────────────────────────────────────────────
export function useTextToSpeech() {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const stripMarkdown = (text: string) =>
    text
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`{1,3}[^`]*`{1,3}/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[>|#]/g, '')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

  const getVoice = (): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find(v => v.lang === 'en-IN') ||
      voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('google')) ||
      voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Enhanced'))) ||
      voices.find(v => v.lang.startsWith('en')) ||
      null
    );
  };

  const speak = (text: string, onState: (s: TTSState) => void) => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();

    const clean = stripMarkdown(text);
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    utteranceRef.current = utterance;

    utterance.lang = 'en-IN';
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Voices may not be loaded yet — wait if needed
    const trySpeak = () => {
      const voice = getVoice();
      if (voice) utterance.voice = voice;

      utterance.onstart = () => onState('playing');
      utterance.onpause = () => onState('paused');
      utterance.onresume = () => onState('playing');
      utterance.onend = () => { onState('idle'); utteranceRef.current = null; };
      utterance.onerror = () => { onState('idle'); utteranceRef.current = null; };

      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => { trySpeak(); };
    } else {
      trySpeak();
    }
  };

  const pause = () => { if (isSupported) window.speechSynthesis.pause(); };
  const resume = () => { if (isSupported) window.speechSynthesis.resume(); };
  const stop = () => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
    }
  };

  return { speak, pause, resume, stop, isSupported };
}
