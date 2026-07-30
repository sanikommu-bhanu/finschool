import { jsPDF } from 'jspdf';
import type { ReceiptDoc } from '@/schemas/payment.schema';

const methodLabel: Record<ReceiptDoc['method'], string> = {
  upi: 'UPI',
  card: 'Card',
  cash: 'Cash',
};

/** Builds a simple, print-friendly PDF receipt and triggers a browser download. */
export function downloadReceiptPdf(receipt: ReceiptDoc, issuedDate = new Date()) {
  const docPdf = new jsPDF({ unit: 'pt', format: 'a5' });
  const pageWidth = docPdf.internal.pageSize.getWidth();
  const margin = 40;

  docPdf.setFillColor(238, 122, 144);
  docPdf.rect(0, 0, pageWidth, 70, 'F');
  docPdf.setTextColor(255, 255, 255);
  docPdf.setFont('helvetica', 'bold');
  docPdf.setFontSize(18);
  docPdf.text('Smart School FinTech', margin, 32);
  docPdf.setFontSize(10);
  docPdf.setFont('helvetica', 'normal');
  docPdf.text('Official Fee Payment Receipt', margin, 50);

  let y = 100;
  docPdf.setTextColor(30, 20, 25);
  docPdf.setFontSize(12);
  docPdf.setFont('helvetica', 'bold');
  docPdf.text(receipt.receiptNo, margin, y);
  docPdf.setFont('helvetica', 'normal');
  docPdf.setFontSize(10);
  docPdf.text(issuedDate.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }), pageWidth - margin, y, { align: 'right' });

  y += 30;
  docPdf.setDrawColor(230, 200, 210);
  docPdf.line(margin, y, pageWidth - margin, y);
  y += 25;

  const rows: [string, string][] = [
    ['Student', receipt.studentName],
    ['Class', receipt.className],
    ['Amount paid', `Rs. ${receipt.amount.toLocaleString('en-IN')}`],
    ['Payment method', methodLabel[receipt.method]],
    ['Transaction ID', receipt.transactionId],
    ['Status', 'SUCCESS'],
  ];

  docPdf.setFontSize(11);
  rows.forEach(([label, value]) => {
    docPdf.setFont('helvetica', 'normal');
    docPdf.setTextColor(100, 80, 90);
    docPdf.text(label, margin, y);
    docPdf.setFont('helvetica', 'bold');
    docPdf.setTextColor(30, 20, 25);
    docPdf.text(value, pageWidth - margin, y, { align: 'right' });
    y += 24;
  });

  y += 20;
  docPdf.setDrawColor(230, 200, 210);
  docPdf.line(margin, y, pageWidth - margin, y);
  y += 20;
  docPdf.setFontSize(9);
  docPdf.setTextColor(140, 120, 130);
  docPdf.text('This is a system-generated receipt and does not require a signature.', margin, y);
  docPdf.text('Smart School FinTech · Thank you for your payment.', margin, y + 14);

  docPdf.save(`${receipt.receiptNo}.pdf`);
}
