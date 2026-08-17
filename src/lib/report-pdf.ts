import { jsPDF } from "jspdf";

type ReportMeta = { url: string; title: string; riskRating: string; createdAt: string };

/** Renders a markdown security report into a paginated, styled PDF and triggers a download. */
export function downloadReportPdf(markdown: string, meta: ReportMeta) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxW = pageW - margin * 2;
  let y = margin;

  const newPage = () => {
    doc.addPage();
    y = margin;
  };
  const ensure = (h: number) => {
    if (y + h > pageH - margin - 24) newPage();
  };

  const write = (text: string, size: number, style: "normal" | "bold" | "italic", color: [number, number, number], gapAfter = 6, indent = 0) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, maxW - indent) as string[];
    for (const line of lines) {
      ensure(size + 4);
      doc.text(line, margin + indent, y);
      y += size + 4;
    }
    y += gapAfter;
  };

  // Cover block
  doc.setFillColor(12, 22, 38);
  doc.rect(0, 0, pageW, 140, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Web Application Security Assessment", margin, 60);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Target: ${meta.url}`.slice(0, 110), margin, 84);
  doc.text(`Overall risk rating: ${meta.riskRating}`, margin, 102);
  doc.text(`Generated: ${new Date(meta.createdAt).toLocaleString()}`, margin, 120);
  doc.setFontSize(9);
  doc.text("PhishGuard Lite — AI-assisted passive assessment (OWASP ZAP style)", pageW - margin, 120, { align: "right" });
  y = 176;

  const clean = (s: string) =>
    s
      .replace(/\*\*/g, "")
      .replace(/`/g, "")
      .replace(/^#+\s*/, "")
      .trim();

  for (const raw of markdown.split("\n")) {
    const line = raw.replace(/\s+$/, "");
    if (!line.trim()) {
      y += 4;
      continue;
    }
    if (/^#\s/.test(line)) {
      ensure(40);
      write(clean(line), 16, "bold", [12, 22, 38], 8);
    } else if (/^##\s/.test(line)) {
      ensure(34);
      y += 6;
      write(clean(line), 13, "bold", [16, 90, 140], 6);
      doc.setDrawColor(200, 214, 228);
      doc.line(margin, y - 4, pageW - margin, y - 4);
      y += 6;
    } else if (/^###\s/.test(line)) {
      ensure(28);
      write(clean(line), 11.5, "bold", [120, 40, 40], 4);
    } else if (/^\s*[-*]\s+/.test(line)) {
      write(`•  ${clean(line.replace(/^\s*[-*]\s+/, ""))}`, 10, "normal", [30, 36, 46], 2, 12);
    } else if (/^\s*\|/.test(line)) {
      if (/^\s*\|[\s:-]+\|/.test(line)) continue;
      const cells = line.split("|").map((c) => clean(c)).filter((c) => c.length);
      write(cells.join("   |   "), 9.5, "normal", [30, 36, 46], 2, 8);
    } else if (/^\d+\.\s/.test(line)) {
      write(clean(line), 10, "normal", [30, 36, 46], 2, 12);
    } else {
      write(clean(line), 10, "normal", [30, 36, 46], 4);
    }
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(130, 140, 150);
    doc.text("Confidential — PhishGuard Lite security report", margin, pageH - 24);
    doc.text(`Page ${i} of ${pages}`, pageW - margin, pageH - 24, { align: "right" });
  }

  const slug = meta.url.replace(/^https?:\/\//, "").replace(/[^a-zA-Z0-9.-]/g, "_").slice(0, 60);
  doc.save(`security-report-${slug || "target"}.pdf`);
}
