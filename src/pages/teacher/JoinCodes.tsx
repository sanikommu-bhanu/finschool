import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlineDuplicate, HiOutlineShare, HiOutlineRefresh, HiOutlineKey, HiOutlineQrcode } from 'react-icons/hi';
import { Screen } from '@/components/layout/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { QRSheet } from '@/components/ui/QRSheet';
import { useMyTeacherRecord } from '@/hooks/useMyTeacherRecord';
import { useJoinCodes, useRefreshJoinCode } from '@/hooks/useJoinCodes';
import type { ClassJoinCodeDoc } from '@/schemas/joinCode.schema';

export default function JoinCodes() {
  const navigate = useNavigate();
  const { data: teacher } = useMyTeacherRecord();
  const { data: codes = [], isLoading } = useJoinCodes(teacher?.id);
  const refreshMutation = useRefreshJoinCode();
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [qrCodeId, setQrCodeId] = useState<string | null>(null);
  const qrCode: ClassJoinCodeDoc | null = codes.find((c) => c.id === qrCodeId) ?? null;

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Code copied');
    } catch {
      toast.error('Could not copy — copy it manually');
    }
  };

  const shareCode = async (className: string, code: string) => {
    const text = `Join ${className} on Smart School FinTech using this code: ${code}`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // user cancelled the share sheet — no toast needed
      }
    } else {
      await copyCode(code);
    }
  };

  const doRefresh = (id: string) => {
    setRefreshingId(id);
    refreshMutation.mutate(id, { onSettled: () => setRefreshingId(null) });
  };

  return (
    <Screen>
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate(-1)} className="glass-pill w-9 h-9 flex items-center justify-center">
          <HiOutlineArrowLeft size={18} />
        </button>
        <h1 className="font-display text-lg font-semibold">Class Join Codes</h1>
      </div>

      <p className="text-xs text-blush-700/50 dark:text-blush-200/40 mb-4 leading-relaxed">
        Share a class's code with students or parents — entering it during sign-up links them straight
        to this class, teacher, and fee template automatically.
      </p>

      {isLoading && <DashboardSkeleton />}

      {!isLoading && codes.length === 0 && (
        <EmptyState
          icon={HiOutlineKey}
          title="No join codes yet"
          description="Codes are generated automatically for every class assigned to you — ask the admin to check your class list if none show up here."
        />
      )}

      <div className="space-y-3">
        {codes.map((c) => (
          <GlassCard key={c.id} padding="md" className="flex items-center gap-3">
            <button
              onClick={() => setQrCodeId(c.id)}
              className="min-w-0 flex-1 text-left"
              aria-label={`Show ${c.className} code as QR`}
            >
              <p className="font-semibold text-sm truncate">{c.className}</p>
              <p className="font-display font-semibold text-lg tracking-[0.2em] mt-0.5">{c.code}</p>
            </button>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setQrCodeId(c.id)}
                aria-label="Show QR code"
                className="w-9 h-9 rounded-xl2 flex items-center justify-center glass-pill"
              >
                <HiOutlineQrcode size={15} />
              </button>
              <button
                onClick={() => copyCode(c.code)}
                aria-label="Copy code"
                className="w-9 h-9 rounded-xl2 flex items-center justify-center glass-pill"
              >
                <HiOutlineDuplicate size={15} />
              </button>
              <button
                onClick={() => shareCode(c.className, c.code)}
                aria-label="Share code"
                className="w-9 h-9 rounded-xl2 flex items-center justify-center glass-pill"
              >
                <HiOutlineShare size={15} />
              </button>
              <button
                onClick={() => doRefresh(c.id)}
                disabled={refreshingId === c.id}
                aria-label="Refresh code"
                className="w-9 h-9 rounded-xl2 flex items-center justify-center glass-pill"
              >
                <HiOutlineRefresh size={15} className={refreshingId === c.id ? 'animate-spin' : ''} />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>

      <QRSheet
        open={!!qrCode}
        onClose={() => setQrCodeId(null)}
        title="Class Join Code"
        subtitle={qrCode ? qrCode.className : undefined}
        value={qrCode ? JSON.stringify({ type: 'join_code', code: qrCode.code, className: qrCode.className }) : ''}
        hint="Students and parents can scan this, or type the code shown above, to join."
      />
    </Screen>
  );
}
