import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  HeartPulse,
  Lock,
  LogIn,
  Mail,
  Shield,
  User,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores';
import heroImg from '@/assets/hero-ai-medical.jpg';

type AuthMode = 'login' | 'signup';

interface AuthProps {
  defaultMode?: AuthMode;
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'Contains uppercase', pass: /[A-Z]/.test(password) },
    { label: 'Contains number', pass: /\d/.test(password) },
    { label: 'Contains symbol', pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.pass).length;
  const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-500'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];

  if (!password) return null;

  return (
    <div className="mt-3">
      <div className="flex gap-1 mb-2">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < score ? colors[score - 1] : 'bg-slate-200'}`} />
        ))}
      </div>
      {score > 0 && (
        <p className={`text-xs font-semibold ${score <= 1 ? 'text-red-500' : score <= 2 ? 'text-amber-600' : score <= 3 ? 'text-lime-600' : 'text-emerald-600'}`}>
          {labels[score - 1]} password
        </p>
      )}
      <div className="mt-2 grid gap-1 sm:grid-cols-2">
        {checks.map((c, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${c.pass ? 'bg-emerald-100' : 'bg-slate-100'}`}>
              <Check className={`w-2 h-2 ${c.pass ? 'text-emerald-600' : 'text-slate-300'}`} />
            </div>
            <span className={`text-xs ${c.pass ? 'text-emerald-700' : 'text-slate-400'}`}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Auth({ defaultMode = 'login' }: AuthProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const mode = useMemo<AuthMode>(() => {
    if (location.pathname === '/signup') return 'signup';
    if (location.pathname === '/login') return 'login';
    return searchParams.get('mode') === 'signup' ? 'signup' : defaultMode;
  }, [defaultMode, location.pathname, searchParams]);

  const isLogin = mode === 'login';
  const { login, signup, isAuthenticated } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agree, setAgree] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google sign-in is not available right now.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) { setError('Please fill in all fields.'); return; }
    if (!isLogin && !name.trim()) { setError('Please enter your name.'); return; }
    if (!isLogin && !agree) { setError('Please accept the medical disclaimer to continue.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }

    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(name.trim(), email, password);
      }
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-slate-900 lg:block">
          <img src={heroImg} alt="Medical AI workspace" className="absolute inset-0 h-full w-full object-cover opacity-55" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-blue-950/70 to-emerald-950/65" />

          <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
            <Link to="/landing" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-white/80 transition-colors hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>

            <div className="max-w-xl">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20">
                <HeartPulse className="h-7 w-7 text-emerald-300" />
              </div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-emerald-200">MediAI Assistant</p>
              <h1 className="font-display text-5xl font-black leading-tight text-white">
                Secure access to your medical AI dashboard
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-blue-100">
                Continue to your protected workspace for AI chat, report analysis, medical image review, and medication education.
              </p>
            </div>

            <div className="grid max-w-xl gap-3 sm:grid-cols-3">
              {[
                { icon: Shield, label: 'Privacy-first' },
                { icon: Activity, label: 'Clinical context' },
                { icon: Lock, label: 'Protected tools' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <Icon className="mb-3 h-5 w-5 text-emerald-300" />
                  <p className="text-sm font-semibold text-white">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-7 flex items-center justify-between">
              <Link to="/landing" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-blue-700 lg:hidden">
                <ArrowLeft className="h-4 w-4" />
                Home
              </Link>
              <div className="ml-auto flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
                  <HeartPulse className="h-5 w-5 text-white" />
                </div>
                <span className="font-display text-lg font-bold text-slate-900">MediAI</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 sm:p-7">
              <div className="mb-6">
                <p className="text-sm font-semibold text-blue-700">{isLogin ? 'Login' : 'Sign Up'}</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-slate-950">
                  {isLogin ? 'Welcome back' : 'Create your account'}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {isLogin
                    ? 'Sign in to continue to the Medical AI Assistant dashboard.'
                    : 'Create a secure account to start using your Medical AI Assistant dashboard.'}
                </p>
              </div>

              <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                <Link to="/login" className={`rounded-lg px-3 py-2 text-center text-sm font-bold transition-all ${isLogin ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
                  Login
                </Link>
                <Link to="/signup" className={`rounded-lg px-3 py-2 text-center text-sm font-bold transition-all ${!isLogin ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
                  Sign Up
                </Link>
              </div>

              {error && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-slate-700">Full name</span>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Alex Johnson"
                        className="w-full rounded-xl border border-slate-200 bg-white px-10 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  </label>
                )}

                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">Email address</span>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-slate-200 bg-white px-10 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">Password</span>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-slate-200 bg-white px-10 py-3 pr-12 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:text-slate-700"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {!isLogin && <PasswordStrength password={password} />}
                </label>

                {!isLogin && (
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <input
                      type="checkbox"
                      checked={agree}
                      onChange={e => setAgree(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-amber-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs leading-5 text-amber-800">
                      I understand MediAI provides educational information only and does not replace professional medical advice.
                    </span>
                  </label>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      {isLogin ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      {isLogin ? 'Login' : 'Create Account'}
                    </>
                  )}
                </button>
              </form>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Or</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogIn className="h-4 w-4 text-blue-600" />
                Continue with Google
              </button>

              <p className="mt-6 text-center text-sm text-slate-500">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                <Link to={isLogin ? '/signup' : '/login'} className="font-bold text-blue-700 hover:text-blue-800">
                  {isLogin ? 'Sign up' : 'Login'}
                </Link>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
