import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineChatAlt2, HiOutlinePhone, HiOutlineMail, HiOutlineQuestionMarkCircle } from 'react-icons/hi';
import { Screen } from '@/components/layout/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { BottomSheet } from '@/components/ui/BottomSheet';

const SUPPORT_PHONE = '+911800123456';
const SUPPORT_EMAIL = 'support@smartschoolfintech.app';

const FAQS = [
  { q: 'How do I pay my fees?', a: 'Go to Fees on your dashboard, choose a due amount, then pick UPI, card, or net banking to complete payment.' },
  { q: 'Where can I find my receipt?', a: 'Open Receipts from your dashboard — every payment auto-generates a downloadable PDF receipt.' },
  { q: 'How do I update my child\u2019s details?', a: 'Only school admins can edit student records. Contact the admin office to request a change.' },
  { q: 'The app shows the wrong attendance %.', a: 'Attendance updates after teachers mark each class. If it looks wrong after 24 hours, contact your class teacher.' },
];

const items = [
  { icon: HiOutlineQuestionMarkCircle, label: 'FAQs', action: 'faq' as const },
  { icon: HiOutlineChatAlt2, label: 'WhatsApp Support', action: 'whatsapp' as const },
  { icon: HiOutlinePhone, label: 'Call Support', action: 'call' as const },
  { icon: HiOutlineMail, label: 'Email Support', action: 'email' as const },
];

export default function HelpSupport() {
  const navigate = useNavigate();
  const [faqOpen, setFaqOpen] = useState(false);

  const handleAction = (action: typeof items[number]['action']) => {
    if (action === 'faq') return setFaqOpen(true);
    if (action === 'whatsapp') return window.open(`https://wa.me/${SUPPORT_PHONE.replace('+', '')}`, '_blank');
    if (action === 'call') return window.open(`tel:${SUPPORT_PHONE}`, '_self');
    if (action === 'email') return window.open(`mailto:${SUPPORT_EMAIL}?subject=Support%20request`, '_self');
  };

  return (
    <Screen withNav={false}>
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate(-1)} className="glass-pill w-9 h-9 flex items-center justify-center">
          <HiOutlineChevronLeft size={18} />
        </button>
        <h1 className="font-display text-lg font-semibold">Help & Support</h1>
      </div>

      <GlassCard className="mb-4 text-center py-6">
        <p className="font-display text-lg font-semibold mb-1">We're here to help! 💗</p>
        <p className="text-xs text-blush-700/60">Reach out any time, our team replies within a few hours.</p>
      </GlassCard>

      <GlassCard padding="none" className="divide-y divide-white/40 dark:divide-white/5">
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => handleAction(item.action)}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-white/30 dark:active:bg-white/5 transition-colors"
          >
            <item.icon size={18} className="text-blush-600 shrink-0" />
            <span className="text-sm flex-1">{item.label}</span>
            <HiOutlineChevronRight size={16} className="text-blush-700/30" />
          </button>
        ))}
      </GlassCard>

      <BottomSheet open={faqOpen} onClose={() => setFaqOpen(false)} title="Frequently asked questions">
        <div className="space-y-3">
          {FAQS.map((f) => (
            <div key={f.q} className="glass-card p-3.5">
              <p className="text-sm font-semibold mb-1">{f.q}</p>
              <p className="text-xs text-blush-700/60 dark:text-blush-200/50 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </BottomSheet>
    </Screen>
  );
}
