import { Link } from 'react-router-dom';
import { Heart, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
          <Heart className="w-10 h-10 text-white animate-heartbeat" />
        </div>
        <h1 className="font-display text-8xl font-black gradient-text mb-4">404</h1>
        <h2 className="font-display text-2xl font-bold text-white mb-2">Page Not Found</h2>
        <p className="text-white/50 mb-8 max-w-sm mx-auto">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/" className="flex items-center gap-2 btn-gradient text-white font-semibold px-5 py-2.5 rounded-xl">
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <button onClick={() => window.history.back()} className="flex items-center gap-2 border border-white/20 text-white/70 hover:text-white px-5 py-2.5 rounded-xl transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
