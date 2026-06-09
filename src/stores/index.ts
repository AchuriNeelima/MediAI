import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Conversation, Message, UserPreferences } from '@/types';
import { MOCK_USER, MOCK_CONVERSATIONS, MOCK_MESSAGES, DEFAULT_PREFERENCES } from '@/constants/mockData';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  isTyping: boolean;
  sidebarOpen: boolean;
  setActiveConversation: (id: string | null) => void;
  addConversation: (conv: Conversation) => void;
  deleteConversation: (id: string) => void;
  toggleFavorite: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  addMessage: (msg: Message) => void;
  setTyping: (val: boolean) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (val: boolean) => void;
}

interface UIState {
  activeRoute: string;
  darkMode: boolean;
  preferences: UserPreferences;
  setActiveRoute: (route: string) => void;
  toggleDarkMode: () => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email: string, _password: string) => {
        await new Promise(r => setTimeout(r, 1000));
        const user = { ...MOCK_USER, email };
        set({ user, isAuthenticated: true });
        return true;
      },
      signup: async (name: string, email: string, _password: string) => {
        await new Promise(r => setTimeout(r, 1200));
        const user: User = {
          ...MOCK_USER,
          id: 'usr_new',
          name,
          email,
          joinedAt: new Date().toISOString(),
          plan: 'free',
        };
        set({ user, isAuthenticated: true });
        return true;
      },
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'mediai-auth' }
  )
);

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      conversations: MOCK_CONVERSATIONS,
      activeConversationId: null,
      messages: MOCK_MESSAGES,
      isTyping: false,
      sidebarOpen: true,
      setActiveConversation: (id) => set({ activeConversationId: id }),
      addConversation: (conv) =>
        set((s) => ({ conversations: [conv, ...s.conversations] })),
      deleteConversation: (id) =>
        set((s) => ({
          conversations: s.conversations.filter((c) => c.id !== id),
          activeConversationId: s.activeConversationId === id ? null : s.activeConversationId,
        })),
      toggleFavorite: (id) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, isFavorite: !c.isFavorite } : c
          ),
        })),
      renameConversation: (id, title) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, title } : c
          ),
        })),
      addMessage: (msg) =>
        set((s) => ({ messages: [...s.messages, msg] })),
      setTyping: (val) => set({ isTyping: val }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (val) => set({ sidebarOpen: val }),
    }),
    { name: 'mediai-chat' }
  )
);

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeRoute: '/',
      darkMode: false,
      preferences: DEFAULT_PREFERENCES,
      setActiveRoute: (route) => set({ activeRoute: route }),
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      updatePreferences: (prefs) =>
        set((s) => ({ preferences: { ...s.preferences, ...prefs } })),
    }),
    { name: 'mediai-ui' }
  )
);
