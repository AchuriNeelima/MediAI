import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare, FileText, Image, Brain, TrendingUp,
  ArrowRight, Activity, Clock, Star, Shield
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import Header from '@/components/layout/Header';
import { useAuthStore, useChatStore } from '@/stores';
import { MOCK_DASHBOARD_METRICS } from '@/constants/mockData';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

const STAT_CARDS = [
  { label: 'AI Conversations', value: 127, delta: '+12', icon: MessageSquare, gradient: 'stat-gradient-blue', iconColor: 'text-blue-600', iconBg: 'bg-blue-100', path: '/chat' },
  { label: 'Reports Analyzed', value: 23, delta: '+3', icon: FileText, gradient: 'stat-gradient-cyan', iconColor: 'text-cyan-600', iconBg: 'bg-cyan-100', path: '/reports' },
  { label: 'Images Processed', value: 18, delta: '+5', icon: Image, gradient: 'stat-gradient-purple', iconColor: 'text-purple-600', iconBg: 'bg-purple-100', path: '/images' },
  { label: 'Total AI Queries', value: 892, delta: '+89', icon: Brain, gradient: 'stat-gradient-green', iconColor: 'text-green-600', iconBg: 'bg-green-100', path: '/chat' },
];

const QUICK_ACTIONS = [
  { label: 'New AI Chat', desc: 'Ask health questions', icon: MessageSquare, path: '/chat', color: 'from-blue-500 to-indigo-600' },
  { label: 'Analyze Report', desc: 'Upload lab results', icon: FileText, path: '/reports', color: 'from-cyan-500 to-teal-600' },
  { label: 'Image Analysis', desc: 'Medical imaging AI', icon: Image, path: '/images', color: 'from-purple-500 to-indigo-600' },
  { label: 'Medicine Info', desc: 'Drug information', icon: Brain, path: '/medicine', color: 'from-teal-500 to-green-600' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-xl text-xs">
        <p className="font-semibold text-gray-700 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-medium">{p.value} queries</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const { user } = useAuthStore();
  const { conversations } = useChatStore();
  const metrics = MOCK_DASHBOARD_METRICS;

  const chartData = { daily: metrics.dailyActivity, weekly: metrics.weeklyActivity, monthly: metrics.monthlyActivity }[chartPeriod];
  const recentConvs = conversations.filter(c => !c.isArchived).slice(0, 4);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Dashboard" subtitle={`Good ${greeting}, ${user?.name?.split(' ')[0] || 'there'}`} />
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
          <Shield className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            <strong>Reminder:</strong> All AI outputs are educational only and not a substitute for professional medical advice. Always consult your healthcare provider.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.label} to={card.path} className={`${card.gradient} rounded-2xl p-5 border border-gray-200/60 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5 transition-all group`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${card.iconColor}`} />
                  </div>
                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <TrendingUp className="w-2.5 h-2.5" />
                    {card.delta}
                  </span>
                </div>
                <div className="text-2xl font-display font-bold text-gray-900">{card.value.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 group-hover:text-blue-600 transition-colors">
                  {card.label}
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-display font-bold text-gray-900">AI Query Activity</h3>
                <p className="text-xs text-gray-500 mt-0.5">Your health intelligence usage over time</p>
              </div>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {(['daily', 'weekly', 'monthly'] as const).map(period => (
                  <button key={period} onClick={() => setChartPeriod(period)} className={cn('px-3 py-1 rounded-md text-xs font-medium capitalize transition-all', chartPeriod === period ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
                    {period === 'daily' ? 'Week' : period === 'weekly' ? 'Month' : '6 Mo'}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} fill="url(#colorValue)" dot={{ r: 3, fill: '#2563eb' }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h3 className="font-display font-bold text-gray-900 mb-1">Quick Actions</h3>
            <p className="text-xs text-gray-500 mb-4">Jump right in</p>
            <div className="space-y-2">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.label} to={action.path} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">{action.label}</p>
                      <p className="text-xs text-gray-500">{action.desc}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-display font-bold text-gray-900">Weekly Distribution</h3>
                <p className="text-xs text-gray-500 mt-0.5">Query pattern by day</p>
              </div>
              <Activity className="w-4 h-4 text-blue-500" />
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={metrics.dailyActivity} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#4f46e5" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-display font-bold text-gray-900">Recent Conversations</h3>
                <p className="text-xs text-gray-500 mt-0.5">Your latest AI interactions</p>
              </div>
              <Link to="/chat" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {recentConvs.map(conv => (
                <Link key={conv.id} to="/chat" className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-700 transition-colors">{conv.title}</p>
                      {conv.isFavorite && <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
                  </div>
                  <div className="text-[10px] text-gray-400 flex-shrink-0 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {formatRelativeTime(conv.timestamp)}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
