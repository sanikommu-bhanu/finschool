import { jsPDF } from 'jspdf';

interface ReportPdfOptions {
  title: string;
  subtitle: string;
  summary: [string, string][];
  tableHeaders: string[];
  tableRows: (string | number)[][];
  filename: string;
}

/** Builds a simple, print-friendly A4 PDF report (summary block + table) and downloads it. */
export function downloadReportPdf({ title, subtitle, summary, tableHeaders, tableRows, filename }: ReportPdfOptions) {
  const docPdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = docPdf.internal.pageSize.getWidth();
  const pageHeight = docPdf.internal.pageSize.getHeight();
  const margin = 40;

  docPdf.setFillColor(238, 122, 144);
  docPdf.rect(0, 0, pageWidth, 70, 'F');
  docPdf.setTextColor(255, 255, 255);
  docPdf.setFont('helvetica', 'bold');
  docPdf.setFontSize(18);
  docPdf.text('Smart School FinTech', margin, 32);
  docPdf.setFontSize(10);
  docPdf.setFont('helvetica', 'normal');
  docPdf.text(subtitle, margin, 50);

  let y = 100;
  docPdf.setTextColor(30, 20, 25);
  docPdf.setFontSize(14);
  docPdf.setFont('helvetica', 'bold');
  docPdf.text(title, margin, y);
  docPdf.setFontSize(9);
  docPdf.setFont('helvetica', 'normal');
  docPdf.setTextColor(120, 100, 110);
  docPdf.text(new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }), pageWidth - margin, y, { align: 'right' });

  y += 20;
  docPdf.setDrawColor(230, 200, 210);
  docPdf.line(margin, y, pageWidth - margin, y);
  y += 22;

  // Summary block — up to 4 stats per row
  const colWidth = (pageWidth - margin * 2) / Math.min(summary.length, 4);
  summary.forEach(([label, value], i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = margin + col * colWidth;
    const rowY = y + row * 40;
    docPdf.setFontSize(8);
    docPdf.setTextColor(120, 100, 110);
    docPdf.text(label, x, rowY);
    docPdf.setFontSize(13);
    docPdf.setFont('helvetica', 'bold');
    docPdf.setTextColor(30, 20, 25);
    docPdf.text(value, x, rowY + 16);
    docPdf.setFont('helvetica', 'normal');
  });
  y += Math.ceil(summary.length / 4) * 40 + 16;

  docPdf.setDrawColor(230, 200, 210);
  docPdf.line(margin, y, pageWidth - margin, y);
  y += 20;

  // Table
  const colCount = tableHeaders.length;
  const tableColWidth = (pageWidth - margin * 2) / colCount;
  docPdf.setFontSize(9);
  docPdf.setFont('helvetica', 'bold');
  docPdf.setFillColor(250, 235, 238);
  docPdf.rect(margin, y - 12, pageWidth - margin * 2, 20, 'F');
  tableHeaders.forEach((h, i) => docPdf.text(h, margin + i * tableColWidth + 4, y + 2));
  y += 16;
  docPdf.setFont('helvetica', 'normal');

  tableRows.forEach((row) => {
    if (y > pageHeight - 60) {
      docPdf.addPage();
      y = 50;
    }
    row.forEach((cell, i) => {
      docPdf.text(String(cell), margin + i * tableColWidth + 4, y + 2, { maxWidth: tableColWidth - 6 });
    });
    y += 18;
    docPdf.setDrawColor(245, 225, 230);
    docPdf.line(margin, y - 6, pageWidth - margin, y - 6);
  });

  y += 20;
  docPdf.setFontSize(8);
  docPdf.setTextColor(140, 120, 130);
  docPdf.text('System-generated report — Smart School FinTech.', margin, pageHeight - 30);

  docPdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}
