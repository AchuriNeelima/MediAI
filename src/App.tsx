import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore, useChatStore, useUIStore } from '@/stores';
import { supabase } from '@/lib/supabase';
import { DEFAULT_PREFERENCES } from '@/constants/mockData';
import { fetchProfile } from '@/lib/supabase-service';
import AppLayout from '@/components/layout/AppLayout';
import Landing from '@/pages/Landing';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import Chat from '@/pages/Chat';
import ReportAnalyzer from '@/pages/ReportAnalyzer';
import ImageAnalysis from '@/pages/ImageAnalysis';
import MedicineInfo from '@/pages/MedicineInfo';
import Profile from '@/pages/Profile';
import NotFound from '@/pages/NotFound';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicAuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

async function hydrateUser(userId: string, sessionUser?: { id: string; email?: string | null; user_metadata?: { name?: string }; created_at: string }) {
  const profile = await fetchProfile(userId);
  useAuthStore.setState({
    user: profile ?? (sessionUser ? {
      id: sessionUser.id,
      name: sessionUser.user_metadata?.name ?? sessionUser.email?.split('@')[0] ?? 'User',
      email: sessionUser.email ?? '',
      joinedAt: sessionUser.created_at,
      plan: 'free',
    } : null),
    isAuthenticated: true,
  });
  useUIStore.setState({ preferences: DEFAULT_PREFERENCES });
  await useChatStore.getState().loadConversations(userId);
  await useUIStore.getState().loadPreferences(userId);
}

export default function App() {
  const [authReady, setAuthReady] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await useChatStore.getState().resetChat();
        await hydrateUser(session.user.id, session.user);
      } else {
        useAuthStore.setState({ user: null, isAuthenticated: false });
        useChatStore.getState().resetChat();
        useUIStore.setState({ preferences: DEFAULT_PREFERENCES });
      }
      setAuthReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        useChatStore.getState().resetChat();
        hydrateUser(session.user.id, session.user);
      }
      if (event === 'SIGNED_OUT') {
        useAuthStore.setState({ user: null, isAuthenticated: false });
        useChatStore.getState().resetChat();
        useUIStore.setState({ preferences: DEFAULT_PREFERENCES });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 text-sm">
        Loading session...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        {/* Public */}
        <Route path="/landing" element={<Landing />} />
        <Route
          path="/"
          element={
            isAuthenticated
              ? <Navigate to="/dashboard" replace />
              : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/login"
          element={
            <PublicAuthRoute>
              <Auth defaultMode="login" />
            </PublicAuthRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicAuthRoute>
              <Auth defaultMode="signup" />
            </PublicAuthRoute>
          }
        />
        <Route
          path="/auth"
          element={
            <PublicAuthRoute>
              <Auth />
            </PublicAuthRoute>
          }
        />

        {/* Protected — App Shell */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="chat" element={<Chat />} />
          <Route path="reports" element={<ReportAnalyzer />} />
          <Route path="images" element={<ImageAnalysis />} />
          <Route path="medicine" element={<MedicineInfo />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
