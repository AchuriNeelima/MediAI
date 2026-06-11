import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, FileText, Image, Pill, User, Home, Heart, LogOut } from 'lucide-react';
import { useAuthStore, useUIStore } from '@/stores';
import { cn } from '@/lib/utils';
import UserAvatar from '@/components/features/UserAvatar';

const NAV_ITEMS = [
  { label: 'Home', path: '/landing', icon: Home },
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'AI Chat', path: '/chat', icon: MessageSquare },
  { label: 'Report Analyzer', path: '/reports', icon: FileText },
  { label: 'Image Analysis', path: '/images', icon: Image },
  { label: 'Medicine Info', path: '/medicine', icon: Pill },
  { label: 'Profile', path: '/profile', icon: User },
];

export default function TopNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { darkMode } = useUIStore();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className={cn(
      'h-16 border-b px-4 md:px-6 flex items-center justify-between gap-3 flex-shrink-0',
      darkMode ? 'bg-gray-950/95 border-gray-800' : 'bg-white/90 backdrop-blur-xl border-gray-200/80'
    )}>
      <Link to="/dashboard" className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
          <Heart className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0 hidden sm:block">
          <span className="font-display font-bold text-base gradient-text">MediAI</span>
        </div>
      </Link>

      <nav className="flex-1 min-w-0 overflow-x-auto">
        <div className="flex items-center justify-start md:justify-center gap-1 min-w-max px-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path === '/chat' && location.pathname.startsWith('/chat'));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : darkMode
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {user && (
        <div className="flex items-center gap-2">
          <Link to="/profile" className={cn(
            'flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors',
            darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100/80'
          )}>
            <UserAvatar
              name={user.name}
              src={user.avatar}
              className="w-8 h-8 ring-2 ring-blue-500/30"
              imageClassName="object-cover"
              fallbackClassName="text-[10px]"
            />
            <span className={cn('hidden md:block text-xs font-semibold max-w-[100px] truncate', darkMode ? 'text-gray-200' : 'text-gray-700')}>
              {user.name}
            </span>
          </Link>
          <button
            type="button"
            onClick={() => { void handleLogout(); }}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
              darkMode ? 'bg-gray-900 text-red-400 hover:bg-gray-800' : 'bg-red-50 text-red-600 hover:bg-red-100'
            )}
            title="Logout"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      )}
    </header>
  );
}
