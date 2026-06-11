import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare, FileText, Image, Brain, ArrowRight,
  Star, Stethoscope, Activity, Zap, TrendingUp, Clock,
  HeartPulse, Pill, FlaskConical, ScanLine, Download, CheckCircle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadialBarChart, RadialBar
} from 'recharts';
import { jsPDF } from 'jspdf';
import { useAuthStore, useChatStore } from '@/stores';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);
  useEffect(() => {
    const start = ref.current;
    const diff = value - start;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * ease));
      if (progress < 1) requestAnimationFrame(tick);
      else ref.current = value;
    };
    requestAnimationFrame(tick);
  }, [value, duration]);
  return <>{display.toLocaleString()}</>;
}

// ── Pulse dot ─────────────────────────────────────────────────────────────────
function PulseDot({ color = 'bg-green-400' }: { color?: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-60`} />
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`} />
    </span>
  );
}

const QUICK_ACTIONS = [
  { label: 'AI Chat', desc: 'Ask health questions', icon: MessageSquare, path: '/chat', from: 'from-blue-500', to: 'to-indigo-600', light: 'bg-blue-50 text-blue-700' },
  { label: 'Lab Reports', desc: 'Analyze PDF results', icon: FileText, path: '/reports', from: 'from-teal-500', to: 'to-cyan-600', light: 'bg-teal-50 text-teal-700' },
  { label: 'Medical Images', desc: 'X-ray & scan AI', icon: ScanLine, path: '/images', from: 'from-purple-500', to: 'to-violet-600', light: 'bg-purple-50 text-purple-700' },
  { label: 'Medicine Info', desc: 'Drug lookup', icon: Pill, path: '/medicine', from: 'from-rose-500', to: 'to-pink-600', light: 'bg-rose-50 text-rose-700' },
];

const FEATURES = [
  { icon: HeartPulse, label: 'Symptom Analysis', color: 'text-rose-500 bg-rose-50' },
  { icon: FlaskConical, label: 'Lab Interpretation', color: 'text-blue-500 bg-blue-50' },
  { icon: Pill, label: 'Drug Information', color: 'text-violet-500 bg-violet-50' },
  { icon: Brain, label: 'AI Diagnosis Aid', color: 'text-amber-500 bg-amber-50' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-gray-600 mb-0.5">{label}</p>
      <p className="text-blue-600 font-bold">{payload[0].value} queries</p>
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuthStore();
  const { conversations, messages } = useChatStore();

  // Real-time stats derived from store
  const totalConversations = conversations.length;
  const totalMessages = messages.length;
  const favoriteConvs = conversations.filter(c => c.isFavorite).length;
  const recentConvs = conversations.filter(c => !c.isArchived).slice(0, 5);

  // Activity chart — build from real conversations by day
  const activityData = (() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const counts = new Array(7).fill(0);
    conversations.forEach(c => {
      const d = new Date(c.timestamp);
      const day = (d.getDay() + 6) % 7; // Mon=0
      counts[day]++;
    });
    return days.map((date, i) => ({ date, value: counts[i] }));
  })();

  // Radial health score (visual only)
  const healthScore = Math.min(100, 60 + totalConversations * 2 + favoriteConvs * 5);
  const radialData = [{ value: healthScore, fill: '#2563eb' }];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'there';

  // Live clock
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // PDF download
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const downloadPDF = async () => {
    setDownloading(true);
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    // Header bar
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('MediAI — Health Summary Report', 14, 14);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on ${dateStr} at ${timeStr}`, 14, 22);
    doc.text('Educational Use Only — Not a Medical Diagnosis', 14, 28);

    let y = 42;

    // User info
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Patient Overview', 14, y); y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Name: ${user?.name || 'N/A'}`, 14, y); y += 6;
    doc.text(`Email: ${user?.email || 'N/A'}`, 14, y); y += 6;
    doc.text(`Plan: ${user?.plan?.toUpperCase() || 'FREE'}`, 14, y); y += 6;
    doc.text(`Member Since: ${user?.joinedAt ? new Date(user.joinedAt).toLocaleDateString('en-IN') : 'N/A'}`, 14, y); y += 10;

    // Divider
    doc.setDrawColor(220, 220, 220);
    doc.line(14, y, 196, y); y += 8;

    // Stats
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Activity Summary', 14, y); y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const stats = [
      ['Total Conversations', totalConversations.toString()],
      ['Total Messages', totalMessages.toString()],
      ['Saved Conversations', favoriteConvs.toString()],
      ['Health Engagement Score', `${healthScore} / 100`],
    ];
    stats.forEach(([label, val]) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text(`${label}:`, 14, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(37, 99, 235);
      doc.text(val, 80, y);
      y += 6;
    });
    y += 4;

    // Divider
    doc.setDrawColor(220, 220, 220);
    doc.line(14, y, 196, y); y += 8;

    // Recent conversations
    if (recentConvs.length > 0) {
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Recent Conversations', 14, y); y += 7;

      recentConvs.forEach((conv, i) => {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(14, y - 4, 182, 16, 2, 2, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 30);
        doc.text(`${i + 1}. ${conv.title.slice(0, 60)}`, 18, y + 2);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(conv.lastMessage.slice(0, 80), 18, y + 7);
        doc.text(new Date(conv.timestamp).toLocaleDateString('en-IN'), 170, y + 2, { align: 'right' });
        y += 20;
      });
      y += 4;
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 285, 210, 12, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text('MediAI — Educational Health Platform. This report is not a medical diagnosis.', 14, 292);
      doc.text(`Page ${i} of ${pageCount}`, 196, 292, { align: 'right' });
    }

    doc.save(`MediAI_Summary_${now.toISOString().slice(0, 10)}.pdf`);
    setDownloading(false);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  const STAT_CARDS = [
    {
      label: 'Conversations', value: totalConversations, icon: MessageSquare,
      gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50', text: 'text-blue-600',
      path: '/chat', suffix: ''
    },
    {
      label: 'Messages Sent', value: totalMessages, icon: Activity,
      gradient: 'from-teal-500 to-cyan-600', bg: 'bg-teal-50', text: 'text-teal-600',
      path: '/chat', suffix: ''
    },
    {
      label: 'Saved Chats', value: favoriteConvs, icon: Star,
      gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-600',
      path: '/chat', suffix: ''
    },
    {
      label: 'Health Score', value: healthScore, icon: HeartPulse,
      gradient: 'from-rose-500 to-pink-600', bg: 'bg-rose-50', text: 'text-rose-600',
      path: '/profile', suffix: '%'
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50/80">
      <div className="flex-1 overflow-y-auto">

        {/* ── Hero Banner ───────────────────────────────────────────────── */}
        <div className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-6 py-7 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full" />
            <div className="absolute top-8 right-32 w-32 h-32 bg-white/5 rounded-full" />
            <div className="absolute -bottom-8 left-1/3 w-48 h-48 bg-indigo-500/20 rounded-full" />
          </div>

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <PulseDot color="bg-green-400" />
                <span className="text-blue-200 text-xs font-medium">System Online</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                {greeting}, {firstName} 👋
              </h1>
              <p className="text-blue-200 text-sm max-w-md">
                Your personal AI medical assistant is ready. Ask anything about your health.
              </p>
              <Link
                to="/chat"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-white text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-50 transition-all shadow-lg shadow-blue-900/20"
              >
                <Stethoscope className="w-4 h-4" />
                Start a Consultation
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={downloadPDF}
                disabled={downloading}
                className="inline-flex items-center gap-2 mt-4 ml-3 px-4 py-2 bg-white/15 hover:bg-white/25 border border-white/30 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-900/10 disabled:opacity-60"
              >
                {downloaded ? (
                  <><CheckCircle className="w-4 h-4 text-green-300" /> Downloaded!</>
                ) : downloading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
                ) : (
                  <><Download className="w-4 h-4" /> Download PDF Summary</>
                )}
              </button>
            </div>

            {/* Live clock */}
            <div className="hidden md:flex flex-col items-end flex-shrink-0">
              <div className="text-white/90 text-3xl font-bold font-mono tracking-tight">
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="text-blue-200 text-xs mt-0.5">
                {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>
              <div className="flex items-center gap-1.5 mt-2 bg-white/10 px-2.5 py-1 rounded-lg">
                <Zap className="w-3 h-3 text-yellow-300" />
                <span className="text-xs text-white/80 font-medium">AI Ready</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 py-5 space-y-5">

          {/* ── Stat Cards ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {STAT_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.label} to={card.path}
                  className="bg-white rounded-2xl p-4 border border-gray-200/80 hover:shadow-md hover:-translate-y-0.5 transition-all group overflow-hidden relative"
                >
                  <div className={`absolute top-0 right-0 w-20 h-20 rounded-full bg-gradient-to-br ${card.gradient} opacity-5 -translate-y-6 translate-x-6`} />
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', card.bg)}>
                      <Icon className={cn('w-4.5 h-4.5', card.text)} />
                    </div>
                    <TrendingUp className="w-3.5 h-3.5 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 leading-none">
                    <AnimatedNumber value={card.value} />{card.suffix}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 font-medium">{card.label}</div>
                  <div className={cn('mt-2 h-0.5 w-0 group-hover:w-full rounded-full transition-all duration-500 bg-gradient-to-r', card.gradient)} />
                </Link>
              );
            })}
          </div>

          {/* ── Main grid ──────────────────────────────────────────────── */}
          <div className="grid lg:grid-cols-3 gap-4">

            {/* Activity Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">Conversation Activity</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Your weekly health query pattern</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full font-semibold">
                  <PulseDot color="bg-green-400" />
                  Live
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={activityData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2.5} fill="url(#grad1)"
                    dot={{ r: 3, fill: '#2563eb', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Health Score Radial */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex flex-col">
              <h3 className="font-bold text-gray-900 mb-1">Health Engagement</h3>
              <p className="text-xs text-gray-400 mb-3">Based on your activity</p>
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="relative">
                  <ResponsiveContainer width={160} height={160}>
                    <RadialBarChart cx={80} cy={80} innerRadius={50} outerRadius={75}
                      data={[{ value: 100, fill: '#f3f4f6' }, { value: healthScore, fill: '#2563eb' }]}
                      startAngle={225} endAngle={-45}
                    >
                      <RadialBar dataKey="value" cornerRadius={8} background={false} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900">{healthScore}</span>
                    <span className="text-xs text-gray-400 font-medium">/ 100</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full mt-3">
                  {FEATURES.map(f => {
                    const Icon = f.icon;
                    return (
                      <div key={f.label} className={cn('flex items-center gap-1.5 px-2 py-1.5 rounded-xl', f.color.split(' ')[1])}>
                        <Icon className={cn('w-3.5 h-3.5 flex-shrink-0', f.color.split(' ')[0])} />
                        <span className="text-[10px] font-semibold text-gray-700 leading-tight">{f.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom grid ────────────────────────────────────────────── */}
          <div className="grid lg:grid-cols-5 gap-4">

            {/* Quick Actions */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-1">Quick Actions</h3>
              <p className="text-xs text-gray-400 mb-4">Jump right in</p>
              <div className="grid grid-cols-2 gap-2.5">
                {QUICK_ACTIONS.map(action => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.label} to={action.path}
                      className="flex flex-col items-center gap-2 p-3.5 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md hover:-translate-y-0.5 transition-all group text-center"
                    >
                      <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm', action.from, action.to)}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-800 group-hover:text-blue-700 transition-colors">{action.label}</p>
                        <p className="text-[10px] text-gray-400">{action.desc}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Recent Conversations */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">Recent Conversations</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Your latest AI interactions</p>
                </div>
                <Link to="/chat" className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {recentConvs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-3">
                    <MessageSquare className="w-6 h-6 text-blue-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-500 mb-1">No conversations yet</p>
                  <p className="text-xs text-gray-400 mb-3">Start chatting with Dr. MediAI</p>
                  <Link to="/chat" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors">
                    Start Chat
                  </Link>
                </div>
              ) : (
                <div className="space-y-1">
                  {recentConvs.map((conv, i) => (
                    <Link key={conv.id} to="/chat"
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Stethoscope className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-700 transition-colors">
                            {conv.title}
                          </p>
                          {conv.isFavorite && <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-gray-400 truncate">{conv.lastMessage}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {formatRelativeTime(conv.timestamp)}
                        </span>
                        <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-semibold',
                          conv.category === 'emergency' ? 'bg-red-100 text-red-600' :
                          conv.category === 'report' ? 'bg-blue-100 text-blue-600' :
                          conv.category === 'medicine' ? 'bg-teal-100 text-teal-600' :
                          'bg-gray-100 text-gray-500'
                        )}>
                          {conv.category}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Disclaimer ─────────────────────────────────────────────── */}
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <HeartPulse className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-800 mb-0.5">Medical Disclaimer</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                MediAI provides educational health information only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
