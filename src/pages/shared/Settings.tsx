import { useNavigate } from 'react-router-dom';
import { HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineMoon, HiOutlineLockClosed, HiOutlineReceiptTax, HiOutlineAcademicCap } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { Screen } from '@/components/layout/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { useState } from 'react';

const LANGUAGES = ['English', 'Hindi', 'Marathi', 'Tamil'];
const CURRENCIES = [
  { label: 'INR (₹)', value: 'INR' },
  { label: 'USD ($)', value: 'USD' },
  { label: 'AED (د.إ)', value: 'AED' },
];

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${value ? 'bg-gradient-cta' : 'bg-blush-200/70'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.role);
  const { isDark, toggle } = useThemeStore();
  const [push, setPush] = useState(true);
  const [bio, setBio] = useState(true);
  const [language, setLanguage] = useState('English');
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [sheet, setSheet] = useState<'language' | 'currency' | 'password' | null>(null);

  const groups = [
    {
      title: 'General',
      rows: [
        { label: 'Language', value: language, onClick: () => setSheet('language') },
        { label: 'Currency', value: currency.label, onClick: () => setSheet('currency') },
      ],
    },
  ];

  return (
    <Screen withNav={false}>
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate(-1)} className="glass-pill w-9 h-9 flex items-center justify-center">
          <HiOutlineChevronLeft size={18} />
        </button>
        <h1 className="font-display text-lg font-semibold">Settings</h1>
      </div>

      <div className="space-y-4">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="text-xs font-semibold text-blush-700/50 uppercase tracking-wide mb-2 px-1">{g.title}</p>
            <GlassCard padding="none" className="divide-y divide-white/40 dark:divide-white/5">
              {g.rows.map((r) => (
                <button key={r.label} onClick={r.onClick} className="w-full flex items-center justify-between px-4 py-3.5 active:bg-white/30 dark:active:bg-white/5 transition-colors">
                  <span className="text-sm">{r.label}</span>
                  <span className="flex items-center gap-1 text-xs text-blush-700/50">
                    {r.value} <HiOutlineChevronRight size={14} />
                  </span>
                </button>
              ))}
            </GlassCard>
          </div>
        ))}

        {role === 'admin' && (
          <div>
            <p className="text-xs font-semibold text-blush-700/50 uppercase tracking-wide mb-2 px-1">School Setup</p>
            <GlassCard padding="none">
              <button
                onClick={() => navigate('/admin/fee-templates')}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-white/30 dark:active:bg-white/5 transition-colors"
              >
                <HiOutlineReceiptTax size={18} className="text-blush-600 shrink-0" />
                <span className="text-sm flex-1">Fee Templates</span>
                <HiOutlineChevronRight size={16} className="text-blush-700/30" />
              </button>
              <button
                onClick={() => navigate('/admin/academic-structure')}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-white/30 dark:active:bg-white/5 transition-colors border-t border-white/40 dark:border-white/5"
              >
                <HiOutlineAcademicCap size={18} className="text-blush-600 shrink-0" />
                <span className="text-sm flex-1">Academic Structure</span>
                <HiOutlineChevronRight size={16} className="text-blush-700/30" />
              </button>
            </GlassCard>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-blush-700/50 uppercase tracking-wide mb-2 px-1">Theme</p>
          <GlassCard padding="none">
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm flex items-center gap-2">
                <HiOutlineMoon size={16} /> Dark Mode
              </span>
              <Toggle value={isDark} onChange={toggle} />
            </div>
          </GlassCard>
        </div>

        <div>
          <p className="text-xs font-semibold text-blush-700/50 uppercase tracking-wide mb-2 px-1">Notifications</p>
          <GlassCard padding="none" className="divide-y divide-white/40 dark:divide-white/5">
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm">Push Notifications</span>
              <Toggle value={push} onChange={setPush} />
            </div>
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm">Biometric Login</span>
              <Toggle value={bio} onChange={setBio} />
            </div>
          </GlassCard>
        </div>

        <div>
          <p className="text-xs font-semibold text-blush-700/50 uppercase tracking-wide mb-2 px-1">Privacy</p>
          <GlassCard padding="none">
            <button onClick={() => setSheet('password')} className="w-full flex items-center justify-between px-4 py-3.5 active:bg-white/30 dark:active:bg-white/5 transition-colors">
              <span className="text-sm">Change Password</span>
              <HiOutlineChevronRight size={16} className="text-blush-700/30" />
            </button>
          </GlassCard>
        </div>
      </div>

      <BottomSheet open={sheet === 'language'} onClose={() => setSheet(null)} title="Choose language">
        <div className="space-y-2">
          {LANGUAGES.map((l) => (
            <button
              key={l}
              onClick={() => {
                setLanguage(l);
                setSheet(null);
                toast.success(`Language set to ${l}`);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl2 text-sm transition-colors ${l === language ? 'bg-gradient-cta text-white font-semibold' : 'glass'}`}
            >
              {l}
            </button>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet open={sheet === 'currency'} onClose={() => setSheet(null)} title="Choose currency">
        <div className="space-y-2">
          {CURRENCIES.map((c) => (
            <button
              key={c.value}
              onClick={() => {
                setCurrency(c);
                setSheet(null);
                toast.success(`Currency set to ${c.label}`);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl2 text-sm transition-colors ${c.value === currency.value ? 'bg-gradient-cta text-white font-semibold' : 'glass'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet open={sheet === 'password'} onClose={() => setSheet(null)} title="Change password">
        <div className="flex items-start gap-3 mb-4 p-3 rounded-xl2 glass">
          <HiOutlineLockClosed size={18} className="text-blush-600 mt-0.5 shrink-0" />
          <p className="text-xs text-blush-800/70 dark:text-blush-100/60 leading-relaxed">
            This account signs in with Google only, so there's no separate app password to change. Manage your
            Google account's password and 2-step verification directly from your Google account settings.
          </p>
        </div>
        <Button fullWidth size="lg" onClick={() => { window.open('https://myaccount.google.com/security', '_blank'); setSheet(null); }}>
          Open Google Account Security
        </Button>
      </BottomSheet>
    </Screen>
  );
}
