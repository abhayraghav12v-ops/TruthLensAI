import { jsPDF } from 'jspdf';

const COLORS = {
  primary: [79, 70, 229],
  primaryDark: [67, 56, 202],
  success: [5, 150, 105],
  danger: [220, 38, 38],
  warning: [217, 119, 6],
  slate500: [100, 116, 139],
  slate700: [51, 65, 85],
  slate900: [15, 23, 42],
  white: [255, 255, 255],
  lightBg: [248, 250, 252],
  border: [226, 232, 240],
};

function getVerdictColor(score) {
  if (score < 25) return COLORS.success;
  if (score < 50) return COLORS.warning;
  return COLORS.danger;
}

function getScoreBackground(score) {
  if (score < 25) return [236, 253, 245];
  if (score < 50) return [255, 251, 235];
  return [254, 242, 242];
}

function formatFileSize(bytes) {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function formatAnalysisDateTime(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatFooterDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function drawLabelValue(doc, label, value, x, y, valueMaxWidth) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.slate500);
  doc.text(label, x, y);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.slate700);
  const lines = doc.splitTextToSize(String(value), valueMaxWidth);
  doc.text(lines, x + 42, y);
  return Math.max(6, lines.length * 5);
}

/**
 * Build a one-page TruthLens AI forensic analysis PDF and return it as a Blob.
 */
export function generateVerificationReportPdf({
  fileName,
  mediaType,
  fileSizeBytes,
  score,
  verdictLabel,
  confidence,
  processingTime,
  flags = [],
  analyzedAt = new Date(),
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = 210;
  const margin = 20;
  const contentW = pageW - margin * 2;
  const verdictColor = getVerdictColor(score);

  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageW, 38, 'F');
  doc.setFillColor(...COLORS.primaryDark);
  doc.rect(0, 38, pageW, 2, 'F');

  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('TruthLens AI', margin, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('AI Forensic Analysis Report', margin, 26);

  let y = 52;

  doc.setTextColor(...COLORS.slate900);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('File Information', margin, y);
  y += 8;

  const infoStartY = y;
  const infoRows = [
    ['File Name', fileName],
    ['Media Type', mediaType.charAt(0).toUpperCase() + mediaType.slice(1)],
    ['File Size', formatFileSize(fileSizeBytes)],
    ['Analysis Date', formatAnalysisDateTime(analyzedAt)],
  ];

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  const measuredRows = infoRows.map(([label, value]) => {
    const lines = doc.splitTextToSize(String(value), contentW - 55);
    const rowH = Math.max(6, lines.length * 5);
    return { label, lines, rowH };
  });

  const infoBoxH = measuredRows.reduce((sum, row) => sum + row.rowH + 2, 8) + 4;

  doc.setDrawColor(...COLORS.border);
  doc.setFillColor(...COLORS.lightBg);
  doc.roundedRect(margin, infoStartY - 4, contentW, infoBoxH, 3, 3, 'FD');

  let rowY = infoStartY + 4;
  measuredRows.forEach(({ label, lines, rowH }) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.slate500);
    doc.text(label, margin + 5, rowY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.slate700);
    doc.text(lines, margin + 47, rowY);
    rowY += rowH + 2;
  });

  y = infoStartY + infoBoxH + 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.slate900);
  doc.text('Analysis Result', margin, y);
  y += 6;

  const scoreBoxH = 44;
  doc.setDrawColor(...verdictColor);
  doc.setFillColor(...getScoreBackground(score));
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, y, contentW, scoreBoxH, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(44);
  doc.setTextColor(...verdictColor);
  doc.text(`${score}%`, pageW / 2, y + 22, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.slate500);
  doc.text('Manipulation Score', pageW / 2, y + 30, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(...verdictColor);
  doc.text(verdictLabel, pageW / 2, y + 38, { align: 'center' });

  y += scoreBoxH + 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.slate900);
  doc.text('Detected Signals', margin, y);
  y += 7;

  if (flags.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.slate500);
    doc.text('No suspicious signals detected.', margin, y);
    y += 10;
  } else {
    flags.forEach((flag) => {
      doc.setFillColor(...COLORS.primary);
      doc.circle(margin + 1.5, y - 1.2, 1, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.slate700);
      const lines = doc.splitTextToSize(flag, contentW - 8);
      doc.text(lines, margin + 6, y);
      y += lines.length * 5 + 3;
    });
  }

  y += 6;
  doc.setDrawColor(...COLORS.border);
  doc.line(margin, y, margin + contentW, y);
  y += 9;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.slate500);
  doc.text('Confidence Level', margin, y);
  doc.text('Processing Time', margin + contentW / 2, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.slate900);
  doc.text(confidence, margin, y);
  doc.text(processingTime, margin + contentW / 2, y);

  const footerY = 287;
  doc.setDrawColor(...COLORS.border);
  doc.line(margin, footerY - 5, margin + contentW, footerY - 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.slate500);
  doc.text(`Generated by TruthLens AI — ${formatFooterDate(analyzedAt)}`, pageW / 2, footerY, { align: 'center' });

  return doc.output('blob');
}
