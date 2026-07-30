import { QRCodeSVG } from 'qrcode.react';
import { BottomSheet } from '@/components/ui/BottomSheet';

interface QRSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  value: string;
  hint?: string;
}

/** Generic "show this QR code" bottom sheet — used for receipt QR (and reusable anywhere else a QR needs displaying). */
export function QRSheet({ open, onClose, title, subtitle, value, hint }: QRSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <div className="text-center py-2">
        {subtitle && <p className="text-xs text-blush-700/50 dark:text-blush-200/40 mb-4">{subtitle}</p>}
        <div className="bg-white p-4 rounded-xl3 inline-block shadow-glow">
          <QRCodeSVG value={value} size={180} bgColor="#ffffff" fgColor="#2A1B22" />
        </div>
        {hint && <p className="text-[11px] text-blush-700/40 mt-4">{hint}</p>}
      </div>
    </BottomSheet>
  );
}
