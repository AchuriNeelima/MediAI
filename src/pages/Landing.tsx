import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart, MessageSquare, FileText, Image, Pill, Shield,
  ChevronRight, Star, Check, Activity, Brain, Zap, Lock,
  ArrowRight, Play, Users, Award, TrendingUp, AlertCircle,
  ChevronDown
} from 'lucide-react';
import heroImg from '@/assets/hero-ai-medical.jpg';
import auroraImg from '@/assets/aurora-bg.jpg';

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'AI Medical Chat',
    desc: 'Conversational AI trained on medical knowledge. Ask questions about symptoms, medications, and health topics.',
    color: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50',
  },
  {
    icon: FileText,
    title: 'Report Analyzer',
    desc: 'Upload blood tests, lab reports, and medical documents. Get clear, plain-language explanations.',
    color: 'from-cyan-500 to-teal-600',
    bg: 'bg-cyan-50',
  },
  {
    icon: Image,
    title: 'Image Analysis',
    desc: 'AI-powered medical image understanding for X-rays, MRIs, and other medical images.',
    color: 'from-purple-500 to-indigo-600',
    bg: 'bg-purple-50',
  },
  {
    icon: Pill,
    title: 'Medicine Assistant',
    desc: 'Comprehensive medication information including dosages, interactions, and side effects.',
    color: 'from-teal-500 to-green-600',
    bg: 'bg-teal-50',
  },
  {
    icon: AlertCircle,
    title: 'Emergency Detection',
    desc: 'Real-time screening for emergency symptoms with immediate action guidance.',
    color: 'from-red-500 to-orange-600',
    bg: 'bg-red-50',
  },
  {
    icon: Shield,
    title: 'Privacy-First',
    desc: 'HIPAA-inspired security practices, end-to-end encryption, and strict data privacy.',
    color: 'from-gray-600 to-slate-700',
    bg: 'bg-gray-50',
  },
];

const STATS = [
  { value: 50000, suffix: '+', label: 'Reports Analyzed', icon: FileText },
  { value: 98, suffix: '%', label: 'Accuracy Rate', icon: Award },
  { value: 250000, suffix: '+', label: 'AI Queries', icon: Brain },
  { value: 12000, suffix: '+', label: 'Active Users', icon: Users },
];

const TESTIMONIALS = [
  {
    name: 'Dr. Sarah Chen',
    role: 'Internal Medicine Physician',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=80&h=80&fit=crop&crop=face',
    text: 'MediAI helps my patients understand their lab results before appointments. It significantly reduces anxiety and improves our consultation time.',
    rating: 5,
  },
  {
    name: 'James Rivera',
    role: 'Patient',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
    text: 'I uploaded my CBC results and finally understood what the numbers meant. The educational breakdown was incredibly clear.',
    rating: 5,
  },
  {
    name: 'Emily Watson',
    role: 'Nurse Practitioner',
    avatar: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=80&h=80&fit=crop&crop=face',
    text: 'The medication interaction checker is excellent for patient education. Always reminds users to consult their provider.',
    rating: 5,
  },
];

const FAQS = [
  {
    q: 'Is MediAI a replacement for my doctor?',
    a: 'Absolutely not. MediAI is an educational tool that helps you understand health information. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult your healthcare provider.',
  },
  {
    q: 'How accurate is the AI analysis?',
    a: 'MediAI uses advanced AI models to provide educational information. While we strive for accuracy, AI can make mistakes. All information should be verified with a qualified healthcare professional.',
  },
  {
    q: 'Is my health data secure?',
    a: 'We implement HIPAA-inspired security practices including encryption at rest and in transit, secure file handling with auto-deletion, and strict access controls.',
  },
  {
    q: 'What types of medical reports can I upload?',
    a: 'You can upload PDF reports including blood tests, CBC panels, metabolic panels, lipid panels, urinalysis reports, and other lab documents.',
  },
  {
    q: 'Does MediAI prescribe medication?',
    a: 'No. MediAI never prescribes medications, recommends specific treatments, or provides medical diagnoses. It provides educational information only.',
  },
];

function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      setCount(Math.floor(current));
      if (current >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, start]);
  return count;
}

function StatCard({ value, suffix, label, icon: Icon, start }: typeof STATS[0] & { start: boolean }) {
  const count = useCountUp(value, 2000, start);
  return (
    <div className="text-center group">
      <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="text-3xl font-display font-bold text-white">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-blue-200 text-sm mt-1">{label}</div>
    </div>
  );
}

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [statsStarted, setStatsStarted] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const [demoMessage, setDemoMessage] = useState('');
  const [demoResponse, setDemoResponse] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);

  const DEMO_RESPONSE = `Your blood test results show mild anemia (hemoglobin 11.2 g/dL), which falls slightly below the normal range. This pattern combined with a low MCV of 78 fL is consistent with iron-deficiency anemia.\n\n**What this means:** Your red blood cells may be slightly smaller than normal, often due to insufficient iron.\n\n**Educational next steps:**\n- Discuss iron panel testing with your doctor\n- Consider dietary sources of iron\n- Ask about Vitamin C intake to enhance iron absorption\n\n> This is educational information only. Please consult your healthcare provider.`;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsStarted(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const runDemo = async () => {
    if (!demoMessage.trim() || demoLoading) return;
    setDemoLoading(true);
    setDemoResponse('');
    await new Promise(r => setTimeout(r, 800));
    const words = DEMO_RESPONSE.split(' ');
    for (let i = 0; i < words.length; i++) {
      await new Promise(r => setTimeout(r, 20));
      setDemoResponse(prev => prev + (i === 0 ? '' : ' ') + words[i]);
    }
    setDemoLoading(false);
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-xl gradient-text">MediAI</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How It Works</a>
            <a href="#testimonials" className="hover:text-blue-600 transition-colors">Reviews</a>
            <a href="#faq" className="hover:text-blue-600 transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth?mode=login" className="hidden sm:block text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
              Sign In
            </Link>
            <Link to="/auth?mode=signup" className="btn-gradient text-white text-sm font-semibold px-4 py-2 rounded-xl">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        <div className="absolute inset-0">
          <img src={heroImg} alt="AI Medical Hero" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/30" />
        </div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-blue-400/10 blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-indigo-400/10 blur-3xl animate-float" style={{ animationDelay: '-3s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium mb-6">
              <Zap className="w-3.5 h-3.5" />
              Powered by Advanced AI
            </div>
            <h1 className="font-display text-5xl lg:text-6xl font-black leading-[1.1] mb-6 text-gray-900">
              AI-Powered{' '}
              <span className="gradient-text block">Health Intelligence</span>
              for Everyone
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed mb-8 max-w-lg">
              Understand medical reports, analyze images, get health insights, and stay informed with responsible AI. Your premium healthcare intelligence platform.
            </p>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 mb-8">
              <Shield className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700">
                <strong>Educational Only:</strong> MediAI provides health education and information. It is not a substitute for professional medical advice, diagnosis, or treatment.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to="/auth?mode=signup" className="btn-gradient text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/25">
                Start for Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#demo" className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:border-blue-300 hover:text-blue-700 transition-colors">
                <Play className="w-4 h-4" />
                See Demo
              </a>
            </div>

            <div className="flex items-center gap-3 mt-8">
              <div className="flex -space-x-2">
                {['photo-1472099645785-5658abf4ff4e', 'photo-1559839734-2b71ea197ec2', 'photo-1507003211169-0a1dd7228f2d'].map((id, i) => (
                  <img key={i} src={`https://images.unsplash.com/${id}?w=40&h=40&fit=crop&crop=face`} className="w-8 h-8 rounded-full ring-2 ring-white object-cover" alt="User" />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5 mb-0.5">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-xs text-gray-500">Trusted by 12,000+ users</p>
              </div>
            </div>
          </div>

          {/* Demo card */}
          <div id="demo" className="glass-card-light rounded-2xl p-6 shadow-2xl border border-white/80 animate-slide-in-right">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-2 text-xs text-gray-500 font-medium">Live Demo</span>
            </div>

            <div className="space-y-3 mb-4 min-h-[200px] max-h-[280px] overflow-y-auto">
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-3 py-2 text-xs text-gray-700 max-w-[80%]">
                  Hello! I'm your AI Medical Assistant. Ask me anything about health topics, medications, or your lab results.
                </div>
              </div>

              {demoMessage && (
                <div className="flex gap-2 justify-end">
                  <div className="bg-blue-600 rounded-2xl rounded-tr-sm px-3 py-2 text-xs text-white max-w-[80%]">{demoMessage}</div>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex-shrink-0 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face" alt="You" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              {demoLoading && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-3 py-2">
                    <div className="flex gap-1"><div className="thinking-dot" /><div className="thinking-dot" /><div className="thinking-dot" /></div>
                  </div>
                </div>
              )}

              {demoResponse && !demoLoading && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-3 py-2 text-xs text-gray-700 max-w-[85%] whitespace-pre-line leading-relaxed">{demoResponse}</div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask a health question..."
                value={demoMessage}
                onChange={(e) => setDemoMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runDemo()}
                className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
              <button onClick={runDemo} disabled={demoLoading || !demoMessage.trim()} className="btn-gradient text-white text-xs font-semibold px-4 py-2.5 rounded-xl disabled:opacity-50">
                Ask
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-2">Demo mode — responses are illustrative only</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium mb-4">
              <Zap className="w-3.5 h-3.5" />
              Platform Features
            </div>
            <h2 className="font-display text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to{' '}
              <span className="gradient-text">Understand Your Health</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A comprehensive suite of AI-powered health intelligence tools, designed for patients and healthcare-curious individuals.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="group bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 hover:-translate-y-1">
                  <div className={`w-12 h-12 rounded-2xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <div className={`w-6 h-6 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section ref={statsRef} className="py-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img src={auroraImg} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-white mb-3">Trusted by Thousands of Users</h2>
            <p className="text-blue-200">Real impact in health education worldwide</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((stat, i) => <StatCard key={i} {...stat} start={statsStarted} />)}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-gray-900 mb-4">
              How <span className="gradient-text">MediAI Works</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-blue-300 via-indigo-300 to-purple-300" />
            {[
              { step: 1, icon: Users, title: 'Create Account', desc: 'Sign up in seconds. No credit card required for the free tier.', color: 'from-blue-500 to-indigo-600' },
              { step: 2, icon: MessageSquare, title: 'Ask or Upload', desc: 'Chat with AI, upload medical reports, or share medical images for analysis.', color: 'from-indigo-500 to-purple-600' },
              { step: 3, icon: Brain, title: 'Get Insights', desc: 'Receive clear, educational explanations with actionable next steps for your doctor.', color: 'from-purple-500 to-pink-600' },
            ].map(({ step, icon: Icon, title, desc, color }) => (
              <div key={step} className="text-center relative">
                <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${color} flex items-center justify-center mx-auto mb-5 shadow-xl shadow-blue-500/20 relative`}>
                  <Icon className="w-10 h-10 text-white" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white shadow border-2 border-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center">
                    {step}
                  </span>
                </div>
                <h3 className="font-bold text-xl text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed max-w-xs mx-auto">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-gray-900 mb-4">
              Loved by <span className="gradient-text">Healthcare Professionals & Patients</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all">
                <div className="flex gap-0.5 mb-4">
                  {Array(t.rating).fill(0).map((_, j) => <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4 italic">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="font-display text-3xl font-bold text-gray-900 mb-4">Privacy & Security You Can Trust</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">We follow HIPAA-inspired security practices to protect your sensitive health information.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Lock, text: 'End-to-End Encryption' },
              { icon: Shield, text: 'HIPAA-Inspired Practices' },
              { icon: Check, text: 'Auto File Deletion' },
              { icon: TrendingUp, text: 'Audit Logging' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-100">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm font-medium text-green-800">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors">
                  <span className="font-semibold text-gray-900 text-sm">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4">
                    <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img src={auroraImg} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 animate-heartbeat">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h2 className="font-display text-4xl font-bold text-white mb-4">Start Understanding Your Health Today</h2>
          <p className="text-blue-200 text-lg mb-8">Join thousands of users who use MediAI to better understand their health. Free to start, no credit card required.</p>
          <Link to="/auth?mode=signup" className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors shadow-xl">
            Get Started Free
            <ChevronRight className="w-5 h-5" />
          </Link>
          <p className="text-blue-300 text-xs mt-4">⚠️ Educational information only. Not a substitute for professional medical advice.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-white text-lg">MediAI</span>
            </div>
            <p className="text-xs text-center text-gray-500 max-w-md">
              MediAI provides educational health information only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.
            </p>
            <p className="text-xs text-gray-600">© 2025 MediAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
