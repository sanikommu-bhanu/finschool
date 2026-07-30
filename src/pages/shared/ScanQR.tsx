import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import jsQR from 'jsqr';
import {
  HiOutlineQrcode,
  HiOutlineCamera,
  HiOutlineUserCircle,
  HiOutlineReceiptTax,
  HiOutlineDownload,
  HiOutlineArrowRight,
  HiOutlineRefresh,
} from 'react-icons/hi';
import { Screen } from '@/components/layout/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/store/authStore';
import { getStudent } from '@/services/students.service';
import { getReceiptById } from '@/services/payments.service';
import { downloadReceiptPdf } from '@/lib/receiptPdf';
import { parseQrPayload } from '@/schemas/qr.schema';
import type { StudentDoc } from '@/schemas/student.schema';
import type { ReceiptDoc } from '@/schemas/payment.schema';

type ScanResult =
  | { kind: 'student'; data: StudentDoc }
  | { kind: 'receipt'; data: ReceiptDoc }
  | { kind: 'not-found' }
  | { kind: 'invalid' };

export default function ScanQR() {
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.role) ?? 'admin';

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [manualCode, setManualCode] = useState('');

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const handleDecoded = useCallback(async (raw: string) => {
    setScanning(false);
    stopCamera();

    const payload = parseQrPayload(raw);
    if (!payload) {
      setResult({ kind: 'invalid' });
      return;
    }

    if (payload.type === 'student') {
      const student = await getStudent(payload.id);
      setResult(student ? { kind: 'student', data: student } : { kind: 'not-found' });
    } else {
      const receipt = await getReceiptById(payload.id);
      setResult(receipt ? { kind: 'receipt', data: receipt } : { kind: 'not-found' });
    }
  }, [stopCamera]);

  useEffect(() => {
    if (!scanning) return;
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        tick();
      } catch {
        if (!cancelled) setCameraError('Camera access was denied or is unavailable. Use manual entry below instead.');
      }
    }

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code?.data) {
            handleDecoded(code.data);
            return;
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    start();
    return () => {
      cancelled = true;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  const scanAgain = () => {
    setResult(null);
    setCameraError(null);
    setManualCode('');
    setScanning(true);
  };

  const submitManual = () => {
    if (manualCode.trim()) handleDecoded(manualCode.trim());
  };

  const PROFILE_LIST_ROLES: Record<string, string> = {
    admin: '/admin/students',
    teacher: '/teacher/students',
  };
  const profileListPath = PROFILE_LIST_ROLES[role];

  const goToStudent = (id: string) => {
    if (!profileListPath) return;
    navigate(`${profileListPath}?focus=${id}`);
  };

  return (
    <Screen>
      <h1 className="font-display text-xl font-semibold mb-1">Scan QR</h1>
      <p className="text-xs text-blush-700/60 dark:text-blush-200/50 mb-4">
        Scan a student ID or a receipt QR to open it instantly.
      </p>

      {!result && (
        <GlassCard padding="none" className="overflow-hidden mb-4 relative aspect-square">
          {cameraError ? (
            <div className="p-6">
              <EmptyState icon={HiOutlineCamera} title="Camera unavailable" description={cameraError} />
            </div>
          ) : (
            <>
              <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-8 border-2 border-white/70 rounded-xl3 pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]" />
            </>
          )}
        </GlassCard>
      )}

      {!result && (
        <GlassCard padding="md" className="mb-4">
          <p className="text-xs font-semibold text-blush-700/60 dark:text-blush-200/50 mb-2">
            No camera? Paste the scanned code manually
          </p>
          <div className="flex gap-2">
            <input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder='{"type":"student","id":"..."}'
              className="glass-input flex-1 px-3 py-2 text-xs outline-none"
            />
            <Button size="sm" onClick={submitManual}>Go</Button>
          </div>
        </GlassCard>
      )}

      {result?.kind === 'invalid' && (
        <>
          <EmptyState icon={HiOutlineQrcode} title="Not a Smart School code" description="This QR code wasn't generated by Smart School FinTech." />
          <Button fullWidth icon={<HiOutlineRefresh size={16} />} onClick={scanAgain}>Scan again</Button>
        </>
      )}

      {result?.kind === 'not-found' && (
        <>
          <EmptyState icon={HiOutlineQrcode} title="Record not found" description="This code was valid but the linked record no longer exists." />
          <Button fullWidth icon={<HiOutlineRefresh size={16} />} onClick={scanAgain}>Scan again</Button>
        </>
      )}

      {result?.kind === 'student' && (
        <GlassCard glow padding="lg" className="text-center">
          <img
            src={result.data.avatar || `https://i.pravatar.cc/150?u=${result.data.id}`}
            alt={result.data.name}
            className="w-16 h-16 rounded-full object-cover mx-auto mb-3 border-4 border-white/70 shadow-glass"
          />
          <p className="font-display text-lg font-semibold">{result.data.name}</p>
          <p className="text-xs text-blush-700/50 mb-1">{result.data.className} · Roll {result.data.rollNo}</p>
          <p className="text-xs text-blush-700/60 mb-5">
            Fee: {result.data.feeStatus === 'paid' ? 'Paid' : `₹${result.data.feeDue.toLocaleString('en-IN')} due`}
          </p>
          <div className={clsx('grid gap-3', profileListPath ? 'grid-cols-2' : 'grid-cols-1')}>
            <Button variant="glass" icon={<HiOutlineRefresh size={16} />} onClick={scanAgain}>Scan again</Button>
            {profileListPath && (
              <Button icon={<HiOutlineArrowRight size={16} />} onClick={() => goToStudent(result.data.id)}>Open profile</Button>
            )}
          </div>
        </GlassCard>
      )}

      {result?.kind === 'receipt' && (
        <GlassCard glow padding="lg" className="text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-3">
            <HiOutlineReceiptTax size={24} className="text-emerald-600" />
          </div>
          <p className="font-display text-lg font-semibold">{result.data.receiptNo}</p>
          <p className="text-xs text-blush-700/50 mb-1">{result.data.studentName} · {result.data.className}</p>
          <p className="text-sm font-semibold text-emerald-600 mb-5">₹{result.data.amount.toLocaleString('en-IN')} · {result.data.method.toUpperCase()}</p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="glass" icon={<HiOutlineRefresh size={16} />} onClick={scanAgain}>Scan again</Button>
            <Button icon={<HiOutlineDownload size={16} />} onClick={() => downloadReceiptPdf(result.data)}>Download PDF</Button>
          </div>
        </GlassCard>
      )}

      {!result && !cameraError && (
        <p className="flex items-center gap-2 justify-center text-[11px] text-blush-700/40 mt-4">
          <HiOutlineUserCircle size={14} /> Point the camera at a student ID or receipt QR code.
        </p>
      )}
    </Screen>
  );
}
