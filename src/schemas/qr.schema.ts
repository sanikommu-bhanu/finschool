import { z } from 'zod';

/**
 * Every QR code the app generates (student digital ID, receipts) encodes this
 * exact JSON shape. ScanQR decodes against this schema so a scan of any
 * random/foreign QR code fails safely instead of crashing the app.
 */
export const qrPayloadSchema = z.object({
  type: z.enum(['student', 'receipt']),
  id: z.string().min(1),
});

export type QRPayload = z.infer<typeof qrPayloadSchema>;

/** Returns the parsed payload, or null if the scanned text isn't one of our QR codes. */
export function parseQrPayload(raw: string): QRPayload | null {
  try {
    const parsed = qrPayloadSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
