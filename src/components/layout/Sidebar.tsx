import { Link, useLocation } from 'react-router-dom';
import {
  MessageSquare, LayoutDashboard, FileText, Image, Pill,
  User, ChevronLeft, ChevronRight, Heart, Star, Plus, Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore, useChatStore, useUIStore } from '@/stores';
import { truncate } from '@/lib/utils';
import UserAvatar from '@/components/features/UserAvatar';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'AI Chat', path: '/chat', icon: MessageSquare },
  { label: 'Report Analyzer', path: '/reports', icon: FileText },
  { label: 'Image Analysis', path: '/images', icon: Image },
  { label: 'Medicine Info', path: '/medicine', icon: Pill },
  { label: 'Profile', path: '/profile', icon: User },
];

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuthStore();
  const { conversations, sidebarOpen, toggleSidebar, setActiveConversation, toggleFavorite } = useChatStore();
  const { darkMode } = useUIStore();

  const recentConvs = conversations.filter(c => !c.isArchived).slice(0, 5);
  const favConvs = conversations.filter(c => c.isFavorite && !c.isArchived);

  return (
    <div
      className={cn(
        'flex flex-col h-full transition-all duration-300 ease-in-out border-r border-gray-200/80 relative',
        darkMode ? 'bg-gray-950 border-gray-800' : 'bg-white/90 backdrop-blur-xl',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b transition-all duration-300',
        darkMode ? 'border-gray-800' : 'border-gray-200/80'
      )}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0 animate-pulse-glow">
            <Heart className="w-4 h-4 text-white" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0 animate-slide-in-right">
              <span className="font-display font-bold text-base gradient-text">MediAI</span>
              <div className="text-[10px] text-gray-400 font-medium -mt-0.5">Health Intelligence</div>
            </div>
          )}
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className={cn(
          'absolute -right-3 top-20 w-6 h-6 rounded-full border shadow-md flex items-center justify-center z-10 transition-colors',
          darkMode
            ? 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
            : 'bg-white border-gray-200 text-gray-500 hover:text-gray-900'
        )}
      >
        {sidebarOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto pt-3 pb-2">
        {/* New Chat button removed per request */}

        <div className="px-2 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path === '/chat' && location.pathname.startsWith('/chat'));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
                    : darkMode
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
                  !sidebarOpen && 'justify-center'
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-blue-600' : '')} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {sidebarOpen && favConvs.length > 0 && (
          <div className="mt-4 px-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">
              Favorites
            </p>
            {favConvs.map(conv => (
              <Link
                key={conv.id}
                to="/chat"
                onClick={() => setActiveConversation(conv.id)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors group"
              >
                <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                <span className="truncate flex-1">{truncate(conv.title, 24)}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Recent chats removed per request */}
      </nav>

      {/* User profile */}
      <div className={cn(
        'p-3 border-t',
        darkMode ? 'border-gray-800' : 'border-gray-200/80'
      )}>
        {user && (
          <Link
            to="/profile"
            className={cn(
              'flex items-center gap-3 px-2 py-2 rounded-lg transition-colors',
              darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100',
              !sidebarOpen && 'justify-center'
            )}
          >
            <UserAvatar
              name={user.name}
              src={user.avatar}
              className="w-7 h-7 ring-2 ring-blue-500/30 flex-shrink-0"
              imageClassName="object-cover"
              fallbackClassName="text-[10px]"
            />
            {sidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className={cn('text-xs font-semibold truncate', darkMode ? 'text-white' : 'text-gray-900')}>
                  {user.name}
                </p>
                <p className={cn('text-[10px] truncate', darkMode ? 'text-gray-400' : 'text-gray-500')}>
                  {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} Plan
                </p>
              </div>
            )}
            {sidebarOpen && <Settings className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
          </Link>
        )}
      </div>
    </div>
  );
}
