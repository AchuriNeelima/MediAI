import { useNavigate } from 'react-router-dom';
import { Bell, Moon, Sun, Search, Shield, LogOut } from 'lucide-react';
import UserAvatar from '@/components/features/UserAvatar';
import { useUIStore, useAuthStore } from '@/stores';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: Props) {
  const { darkMode, toggleDarkMode } = useUIStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className={cn(
      'h-16 flex items-center justify-between px-6 border-b flex-shrink-0 transition-colors',
      darkMode
        ? 'bg-gray-950/95 border-gray-800 text-white'
        : 'bg-white/80 backdrop-blur-xl border-gray-200/80'
    )}>
      <div>
        <h1 className={cn('font-display font-bold text-lg leading-tight', darkMode ? 'text-white' : 'text-gray-900')}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className={cn(
          'hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors',
          darkMode
            ? 'bg-gray-900 border-gray-700 text-gray-400'
            : 'bg-gray-50 border-gray-200 text-gray-400'
        )}>
          <Search className="w-3.5 h-3.5" />
          <span className="text-xs">Search...</span>
          <kbd className="hidden lg:inline text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
        </div>

        <div className="hidden lg:flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded-lg">
          <Shield className="w-3 h-3 text-amber-600" />
          <span className="text-[10px] text-amber-700 font-medium">Educational Only</span>
        </div>

        <button
          onClick={toggleDarkMode}
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
            darkMode ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {user && (
          <button
            onClick={() => { void handleLogout(); }}
            className={cn(
              'h-8 px-3 rounded-lg flex items-center gap-2 transition-colors text-xs font-semibold whitespace-nowrap',
              darkMode ? 'bg-gray-800 text-red-400 hover:bg-gray-700' : 'bg-gray-100 text-red-600 hover:bg-red-50'
            )}
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        )}

        <button className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center relative transition-colors',
          darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        )}>
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
        </button>

        {user && (
          <UserAvatar
            name={user.name}
            src={user.avatar}
            className="w-8 h-8 ring-2 ring-blue-500/30 cursor-pointer hover:ring-blue-500 transition-all rounded-lg"
            imageClassName="object-cover"
            fallbackClassName="text-[10px]"
          />
        )}
      </div>
    </header>
  );
}
