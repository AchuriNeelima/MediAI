import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Heart, Eye, EyeOff, ArrowLeft, Shield, Check, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores';

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'Contains uppercase', pass: /[A-Z]/.test(password) },
    { label: 'Contains number', pass: /\d/.test(password) },
    { label: 'Contains symbol', pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.pass).length;
  const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-2">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < score ? colors[score - 1] : 'bg-gray-200'}`} />
        ))}
      </div>
      {score > 0 && (
        <p className={`text-xs font-medium ${score <= 1 ? 'text-red-500' : score <= 2 ? 'text-yellow-600' : score <= 3 ? 'text-yellow-500' : 'text-green-600'}`}>
          {labels[score - 1]} password
        </p>
      )}
      <div className="mt-2 space-y-1">
        {checks.map((c, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${c.pass ? 'bg-green-100' : 'bg-gray-100'}`}>
              <Check className={`w-2 h-2 ${c.pass ? 'text-green-600' : 'text-gray-300'}`} />
            </div>
            <span className={`text-xs ${c.pass ? 'text-green-600' : 'text-gray-400'}`}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'login';
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
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) { setError('Please fill in all fields.'); return; }
    if (!isLogin && !name) { setError('Please enter your name.'); return; }
    if (!isLogin && !agree) { setError('Please accept the terms to continue.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }

    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(name, email, password);
      }
      navigate('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl translate-x-1/2 translate-y-1/2" />

      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" />
        Back to home
      </Link>

      <div className="w-full max-w-md animate-slide-up">
        <div className="glass-card rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
              <Heart className="w-7 h-7 text-white animate-heartbeat" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white mb-1">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-white/50 text-sm">
              {isLogin ? 'Sign in to your MediAI account' : 'Start your health intelligence journey'}
            </p>
          </div>

          <div className="flex bg-white/5 rounded-xl p-1 mb-6 border border-white/10">
            <Link to="/auth?mode=login" className={`flex-1 text-center py-2 rounded-lg text-sm font-medium transition-all ${isLogin ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80'}`}>
              Sign In
            </Link>
            <Link to="/auth?mode=signup" className={`flex-1 text-center py-2 rounded-lg text-sm font-medium transition-all ${!isLogin ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80'}`}>
              Sign Up
            </Link>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/15 border border-red-500/30 mb-4">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Alex Johnson"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11 text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {!isLogin && <PasswordStrength password={password} />}
            </div>

            {!isLogin && (
              <label className="flex items-start gap-3 cursor-pointer">
                <div onClick={() => setAgree(!agree)} className={`w-5 h-5 rounded flex items-center justify-center mt-0.5 flex-shrink-0 border transition-all ${agree ? 'bg-blue-600 border-blue-600' : 'border-white/20 bg-white/5'}`}>
                  {agree && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-xs text-white/50 leading-relaxed">
                  I understand that MediAI provides educational information only and is not a substitute for professional medical advice. I agree to the Terms of Service and Privacy Policy.
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gradient text-white font-bold py-3 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {isLogin && (
            <button className="w-full text-center text-sm text-blue-400 hover:text-blue-300 mt-3 transition-colors">
              Forgot your password?
            </button>
          )}

          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mt-6">
            <Shield className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-300/80">
              MediAI is an educational tool only. It does not provide medical diagnoses, prescriptions, or treatment recommendations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
