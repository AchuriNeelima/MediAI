import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Conversation, Message, UserPreferences } from '@/types';
import { DEFAULT_PREFERENCES } from '@/constants/mockData';
import { supabase } from '@/lib/supabase';
import {
  upsertProfile, fetchProfile,
  fetchConversations, createConversation, updateConversation, deleteConversation,
  fetchMessages, insertMessage,
  fetchPreferences, upsertPreferences,
  logActivity,
} from '@/lib/supabase-service';

// ── Auth ──────────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loadProfile: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);
        const su = data.user!;
        const profile = await fetchProfile(su.id);
        const user: User = profile ?? {
          id: su.id,
          name: su.user_metadata?.name ?? email.split('@')[0],
          email,
          joinedAt: su.created_at,
          plan: 'free',
        };
        set({ user, isAuthenticated: true });
        await logActivity(su.id, 'login');
        return true;
      },
      signup: async (name, email, password) => {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
        if (error) throw new Error(error.message);
        const su = data.user!;
        const user: User = { id: su.id, name, email, joinedAt: su.created_at, plan: 'free' };
        await upsertProfile(user);
        set({ user, isAuthenticated: true });
        await logActivity(su.id, 'signup');
        return true;
      },
      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, isAuthenticated: false });
      },
      loadProfile: async (userId) => {
        const profile = await fetchProfile(userId);
        if (profile) set({ user: profile, isAuthenticated: true });
      },
    }),
    { name: 'mediai-auth' }
  )
);

// ── Chat ──────────────────────────────────────────────────────────────────────

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  isTyping: boolean;
  sidebarOpen: boolean;
  loadConversations: (userId: string) => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  setActiveConversation: (id: string | null) => void;
  addConversation: (userId: string, conv: Omit<Conversation, 'id'>) => Promise<Conversation | null>;
  deleteConversation: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  addMessage: (userId: string, msg: Omit<Message, 'id' | 'timestamp'>) => Promise<Message | null>;
  setTyping: (val: boolean) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (val: boolean) => void;
  resetChat: () => void;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isTyping: false,
  sidebarOpen: true,

  loadConversations: async (userId) => {
    const conversations = await fetchConversations(userId);
    set({ conversations });
  },

  loadMessages: async (conversationId) => {
    const messages = await fetchMessages(conversationId);
    set({ messages });
  },

  setActiveConversation: (id) => {
    set({ activeConversationId: id, messages: [] });
    if (id) get().loadMessages(id);
  },

  addConversation: async (userId, conv) => {
    const created = await createConversation(userId, conv);
    if (created) set((s) => ({ conversations: [created, ...s.conversations] }));
    return created;
  },

  deleteConversation: async (id) => {
    await deleteConversation(id);
    set((s) => ({
      conversations: s.conversations.filter((c) => c.id !== id),
      activeConversationId: s.activeConversationId === id ? null : s.activeConversationId,
    }));
  },

  toggleFavorite: async (id) => {
    const conv = get().conversations.find((c) => c.id === id);
    if (!conv) return;
    const isFavorite = !conv.isFavorite;
    await updateConversation(id, { isFavorite });
    set((s) => ({
      conversations: s.conversations.map((c) => c.id === id ? { ...c, isFavorite } : c),
    }));
  },

  renameConversation: async (id, title) => {
    await updateConversation(id, { title });
    set((s) => ({
      conversations: s.conversations.map((c) => c.id === id ? { ...c, title } : c),
    }));
  },

  addMessage: async (userId, msg) => {
    const saved = await insertMessage(userId, msg);
    if (saved) {
      set((s) => ({ messages: [...s.messages, saved] }));
      // update conversation last_message + count
      const conv = get().conversations.find((c) => c.id === msg.conversationId);
      if (conv) {
        const patch = { lastMessage: msg.content, messageCount: conv.messageCount + 1 };
        await updateConversation(msg.conversationId, patch);
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === msg.conversationId ? { ...c, ...patch } : c
          ),
        }));
      }
    }
    return saved;
  },

  setTyping: (val) => set({ isTyping: val }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (val) => set({ sidebarOpen: val }),
  resetChat: () => set({
    conversations: [],
    activeConversationId: null,
    messages: [],
    isTyping: false,
    sidebarOpen: true,
  }),
}));

// ── UI / Preferences ──────────────────────────────────────────────────────────

interface UIState {
  activeRoute: string;
  darkMode: boolean;
  preferences: UserPreferences;
  setActiveRoute: (route: string) => void;
  toggleDarkMode: () => void;
  updatePreferences: (prefs: Partial<UserPreferences>, userId?: string) => void;
  loadPreferences: (userId: string) => Promise<void>;
  resetPreferences: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      activeRoute: '/',
      darkMode: false,
      preferences: DEFAULT_PREFERENCES,
      setActiveRoute: (route) => set({ activeRoute: route }),
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      updatePreferences: (prefs, userId) => {
        const merged = { ...get().preferences, ...prefs };
        set({ preferences: merged });
        if (userId) upsertPreferences(userId, merged);
      },
      loadPreferences: async (userId) => {
        const prefs = await fetchPreferences(userId);
        set({ preferences: prefs ?? DEFAULT_PREFERENCES });
      },
      resetPreferences: () => set({ preferences: DEFAULT_PREFERENCES }),
    }),
    { name: 'mediai-ui' }
  )
);
