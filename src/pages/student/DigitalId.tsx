import { QRCodeSVG } from 'qrcode.react';
import { HiOutlineUserCircle } from 'react-icons/hi';
import { Screen } from '@/components/layout/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { useMyStudentRecord } from '@/hooks/useMyStudentRecord';

export default function DigitalId() {
  const { data: student, isLoading } = useMyStudentRecord();

  if (isLoading) {
    return (
      <Screen>
        <h1 className="font-display text-xl font-semibold mb-4">Digital ID</h1>
        <DashboardSkeleton />
      </Screen>
    );
  }

  if (!student) {
    return (
      <Screen>
        <h1 className="font-display text-xl font-semibold mb-4">Digital ID</h1>
        <EmptyState icon={HiOutlineUserCircle} title="No record linked" description="Ask the school admin to link your Google email to your student record." />
      </Screen>
    );
  }

  // Scanning this (via Admin/Accountant "Scan QR") opens this exact student's profile.
  const qrValue = JSON.stringify({ type: 'student', id: student.id });

  return (
    <Screen>
      <h1 className="font-display text-xl font-semibold mb-4">Digital ID</h1>

      <GlassCard glow className="text-center py-8">
        <img
          src={student.avatar || `https://i.pravatar.cc/150?u=${student.id}`}
          alt={student.name}
          className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-4 border-white/70 shadow-glass"
        />
        <p className="font-display text-lg font-semibold">{student.name}</p>
        <p className="text-xs text-blush-700/50 mb-5">{student.className} · Roll {student.rollNo}</p>

        <div className="bg-white p-4 rounded-xl3 inline-block shadow-glow">
          <QRCodeSVG value={qrValue} size={160} bgColor="#ffffff" fgColor="#2A1B22" />
        </div>

        <p className="text-[11px] text-blush-700/40 mt-4">Present this QR at the gate or accounts desk for instant verification.</p>
      </GlassCard>
    </Screen>
  );
}
