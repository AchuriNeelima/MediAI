import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bell, Shield, Moon, Sun, LogOut, Save, Camera, Mail, Calendar, Award, Edit2, Check, Trash2, VolumeX } from 'lucide-react';
import Header from '@/components/layout/Header';
import { useAuthStore, useUIStore } from '@/stores';
import UserAvatar from '@/components/features/UserAvatar';
import { upsertProfile } from '@/lib/supabase-service';
import { cn } from '@/lib/utils';

const AVATAR_GALLERY = [
  'https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=Orchid',
  'https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=River',
  'https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=Nova',
  'https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=Atlas',
  'https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=Ember',
  'https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=Echo',
  'https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=Sol',
  'https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=Halo',
];

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'preferences', label: 'Preferences', icon: Bell },
  { id: 'privacy', label: 'Privacy & Security', icon: Shield },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { darkMode, toggleDarkMode, preferences, updatePreferences } = useUIStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [editName, setEditName] = useState(user?.name || '');
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const persistUser = async (nextUser: NonNullable<typeof user>) => {
    useAuthStore.setState({ user: nextUser });
    await upsertProfile(nextUser);
  };

  const handleSave = async () => {
    if (!user) return;
    const nextUser = { ...user, name: editName.trim() || user.name };
    await persistUser(nextUser);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAvatarSelect = async (avatar: string) => {
    if (!user) return;
    await persistUser({ ...user, avatar });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAvatarUpload = () => fileInputRef.current?.click();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result;
      if (typeof result === 'string') {
        await handleAvatarSelect(result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };

  if (!user) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Profile & Settings" subtitle="Manage your account and preferences" />

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <UserAvatar
                  name={user.name}
                  src={user.avatar}
                  className="w-20 h-20 rounded-2xl ring-4 ring-blue-500/20"
                  imageClassName="object-cover"
                  fallbackClassName="text-xl"
                />
                <button onClick={handleAvatarUpload} className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors" title="Choose photo from gallery">
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl font-bold text-gray-900">{user.name}</h2>
                <p className="text-gray-500 text-sm mt-0.5">{user.email}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                    <Award className="w-3 h-3" />
                    {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} Plan
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    Member since {new Date(user.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
              <button onClick={() => { void handleLogout(); }} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 border border-red-200 transition-colors">
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>

          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn('flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all', activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
              <h3 className="font-bold text-gray-900">Personal Information</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 pr-10" />
                  <Edit2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <input type="email" value={user.email} readOnly className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 bg-gray-50 pr-10 cursor-not-allowed" />
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed in demo mode</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subscription Plan</label>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <Award className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-800 capitalize">{user.plan} Plan</p>
                    <p className="text-xs text-blue-600">{user.plan === 'free' ? '50 queries/month' : user.plan === 'pro' ? 'Unlimited queries' : 'Enterprise features'}</p>
                  </div>
                  {user.plan === 'free' && (
                    <button className="ml-auto text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors">Upgrade</button>
                  )}
                </div>
              </div>
              <button onClick={handleSave} className="btn-gradient text-white font-semibold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all">
                {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
              <h3 className="font-bold text-gray-900">Application Preferences</h3>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  {darkMode ? <Moon className="w-5 h-5 text-indigo-500" /> : <Sun className="w-5 h-5 text-amber-500" />}
                  <div>
                    <p className="text-sm font-medium text-gray-800">Dark Mode</p>
                    <p className="text-xs text-gray-500">Reduce eye strain in low light</p>
                  </div>
                </div>
                <button onClick={toggleDarkMode} className={cn('w-11 h-6 rounded-full transition-all relative', darkMode ? 'bg-blue-600' : 'bg-gray-200')}>
                  <div className={cn('absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all', darkMode ? 'left-6' : 'left-1')} />
                </button>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <VolumeX className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Voice Responses</p>
                    <p className="text-xs text-gray-500">Keep AI replies muted by default</p>
                  </div>
                </div>
                <button
                  onClick={() => updatePreferences({ voiceMuted: !preferences.voiceMuted }, user.id)}
                  className={cn('w-11 h-6 rounded-full transition-all relative', preferences.voiceMuted ? 'bg-blue-600' : 'bg-gray-200')}
                >
                  <div className={cn('absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all', preferences.voiceMuted ? 'left-6' : 'left-1')} />
                </button>
              </div>
              {[
                { key: 'notifications', label: 'Push Notifications', desc: 'Analysis complete alerts', icon: Bell },
                { key: 'emailUpdates', label: 'Email Updates', desc: 'Monthly health tips newsletter', icon: Mail },
                { key: 'emergencyAlerts', label: 'Emergency Alerts', desc: 'Real-time emergency detection', icon: Shield },
              ].map(({ key, label, desc, icon: Icon }) => (
                <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updatePreferences({ [key]: !preferences[key as keyof typeof preferences] }, user.id)}
                    className={cn('w-11 h-6 rounded-full transition-all relative', preferences[key as keyof typeof preferences] ? 'bg-blue-600' : 'bg-gray-200')}
                  >
                    <div className={cn('absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all', preferences[key as keyof typeof preferences] ? 'left-6' : 'left-1')} />
                  </button>
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Interface Font Size</label>
                <div className="flex gap-2">
                  {(['small', 'medium', 'large'] as const).map(size => (
                    <button key={size} onClick={() => updatePreferences({ fontSize: size }, user.id)} className={cn('flex-1 py-2 rounded-xl text-sm font-medium border transition-all capitalize', preferences.fontSize === size ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">Choose a profile photo</h3>
                    <p className="text-xs text-gray-500">Pick from the gallery or upload your own picture.</p>
                  </div>
                  <button onClick={handleAvatarUpload} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                    Upload from gallery
                  </button>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                  {AVATAR_GALLERY.map((avatar) => (
                    <button
                      key={avatar}
                      onClick={() => { void handleAvatarSelect(avatar); }}
                      className={cn(
                        'rounded-2xl p-1 border transition-all hover:scale-105',
                        user.avatar === avatar ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300'
                      )}
                      title="Use this avatar"
                    >
                      <img src={avatar} alt="Avatar option" className="w-full h-full rounded-xl object-cover bg-gray-50" />
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-400 mt-2">If you do not choose one, MediAI shows your initials instead of a stock photo.</p>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4">Privacy Controls</h3>
                <div className="space-y-3">
                  {[
                    { title: 'Data Encryption', desc: 'All your data is encrypted at rest and in transit', status: 'Active' },
                    { title: 'Auto File Deletion', desc: 'Uploaded files are automatically deleted after 24 hours', status: 'Active' },
                    { title: 'Audit Logging', desc: 'Access and activity logs are maintained for security', status: 'Active' },
                    { title: 'Session Security', desc: 'Secure JWT tokens with automatic expiration', status: 'Active' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-green-50 border border-green-100">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                      <span className="flex items-center gap-1 text-xs font-semibold text-green-700">
                        <Check className="w-3 h-3" />{item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4">Data Management</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center"><Save className="w-4 h-4 text-blue-600" /></div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Export My Data</p>
                      <p className="text-xs text-gray-500">Download all your conversation history and reports</p>
                    </div>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 rounded-xl border border-red-200 hover:bg-red-50 transition-all text-left">
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center"><Trash2 className="w-4 h-4 text-red-600" /></div>
                    <div>
                      <p className="text-sm font-semibold text-red-700">Delete Account</p>
                      <p className="text-xs text-gray-500">Permanently delete all your data and account</p>
                    </div>
                  </button>
                </div>
              </div>
              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800 mb-1">Medical Disclaimer</p>
                    <p className="text-xs text-amber-700 leading-relaxed">MediAI is an educational platform only. It does not provide medical diagnoses, prescriptions, or treatment recommendations. Always consult qualified healthcare professionals for medical decisions.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
