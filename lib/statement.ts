function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function generateStatementNumber(periodStart: string, index: number): string {
  const ym = periodStart.replace(/-/g, "").slice(0, 6);
  return `KB-${ym}-${String(index + 1).padStart(3, "0")}`;
}

export function formatDateJP(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export function buildStatementHtml(params: {
  statementNumber: string;
  issuedDate: string;
  contactName: string;
  locationName: string;
  periodStart: string;
  periodEnd: string;
  count: number;
  unitRate: number;
  monthlyAmount: number;
  carriedOver: number;
  totalAmount: number;
}): string {
  const {
    statementNumber, issuedDate, contactName, locationName,
    periodStart, periodEnd, count, unitRate, monthlyAmount, carriedOver, totalAmount,
  } = params;

  const carryRow = carriedOver > 0
    ? `<tr><td style="padding: 8px 0; color: #555;">前月繰越</td><td style="padding: 8px 0; text-align: right;">¥${carriedOver.toLocaleString()}</td></tr>`
    : "";

  return `
<div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; color: #333;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 4px; color: #222;">支払明細書</h1>
    <div style="width: 40px; height: 2px; background: #7c3aed; margin: 8px auto;"></div>
  </div>

  <table style="width: 100%; font-size: 13px; margin-bottom: 24px;">
    <tr>
      <td style="color: #888;">発行日</td>
      <td style="text-align: right;">${escapeHtml(issuedDate)}</td>
    </tr>
    <tr>
      <td style="color: #888;">明細書番号</td>
      <td style="text-align: right; font-family: monospace;">${escapeHtml(statementNumber)}</td>
    </tr>
  </table>

  <p style="font-size: 15px; font-weight: 500; margin: 0 0 24px;">
    ${escapeHtml(contactName || locationName)} 様
  </p>

  <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 8px 0; color: #555;">対象期間</td>
      <td style="padding: 8px 0; text-align: right;">${formatDateJP(periodStart)} 〜 ${formatDateJP(periodEnd)}</td>
    </tr>
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 8px 0; color: #555;">設置場所</td>
      <td style="padding: 8px 0; text-align: right; font-weight: 500;">${escapeHtml(locationName)}</td>
    </tr>
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 8px 0; color: #555;">有料診断件数</td>
      <td style="padding: 8px 0; text-align: right;">${count}件</td>
    </tr>
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 8px 0; color: #555;">単価</td>
      <td style="padding: 8px 0; text-align: right;">¥${unitRate}（税込）</td>
    </tr>
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 8px 0; color: #555;">当月分</td>
      <td style="padding: 8px 0; text-align: right;">¥${monthlyAmount.toLocaleString()}</td>
    </tr>
    ${carryRow}
    <tr style="border-top: 2px solid #7c3aed;">
      <td style="padding: 12px 0; color: #222; font-weight: 600;">お支払金額</td>
      <td style="padding: 12px 0; text-align: right; font-size: 20px; font-weight: 700; color: #7c3aed;">¥${totalAmount.toLocaleString()}</td>
    </tr>
  </table>

  <p style="font-size: 13px; color: #555; margin-bottom: 32px;">お支払方法: 銀行振込</p>

  <div style="border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #999;">
    <p style="margin: 0 0 4px;">発行者:</p>
    <p style="margin: 0 0 2px; color: #666;">SATOYAMA AI BASE / 星の図書館</p>
    <p style="margin: 0 0 2px; color: #666;">稲福良祐</p>
    <p style="margin: 0;">メール: satoyama-ai-base@tonari2tomaru.com</p>
  </div>
</div>`;
}

export function buildStatementText(params: {
  statementNumber: string;
  issuedDate: string;
  contactName: string;
  locationName: string;
  periodStart: string;
  periodEnd: string;
  count: number;
  unitRate: number;
  monthlyAmount: number;
  carriedOver: number;
  totalAmount: number;
}): string {
  const p = params;
  const carryLine = p.carriedOver > 0 ? `前月繰越:       ¥${p.carriedOver.toLocaleString()}\n` : "";

  return `━━━━━━━━━━━━━━━━━━━━━━━━
  支払明細書
━━━━━━━━━━━━━━━━━━━━━━━━

発行日: ${p.issuedDate}
明細書番号: ${p.statementNumber}

宛先: ${p.contactName || p.locationName} 様

対象期間:       ${formatDateJP(p.periodStart)} 〜 ${formatDateJP(p.periodEnd)}
設置場所:       ${p.locationName}
有料診断件数:   ${p.count}件
単価:           ¥${p.unitRate}（税込）
当月分:         ¥${p.monthlyAmount.toLocaleString()}
${carryLine}お支払金額:     ¥${p.totalAmount.toLocaleString()}

お支払方法: 銀行振込

━━━━━━━━━━━━━━━━━━━━━━━━
発行者:
SATOYAMA AI BASE / 星の図書館
稲福良祐
メール: satoyama-ai-base@tonari2tomaru.com`;
}

export async function buildStatementPdf(params: {
  statementNumber: string;
  issuedDate: string;
  contactName: string;
  locationName: string;
  periodStart: string;
  periodEnd: string;
  count: number;
  unitRate: number;
  monthlyAmount: number;
  carriedOver: number;
  totalAmount: number;
}): Promise<Buffer> {
  const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");

  const p = params;
  const doc = await PDFDocument.create();

  // Load Japanese font from filesystem
  let font;
  try {
    const fs = await import("fs");
    const path = await import("path");
    // Try multiple paths for different environments
    const cwd = process.cwd();
    const candidates = [
      path.join(cwd, "lib/fonts/NotoSansJP-Regular.ttf"),
      path.join(cwd, "public/fonts/NotoSansJP-Regular.ttf"),
      path.join(cwd, ".next/server/lib/fonts/NotoSansJP-Regular.ttf"),
      "/var/task/lib/fonts/NotoSansJP-Regular.ttf",
      "/var/task/public/fonts/NotoSansJP-Regular.ttf",
      "/var/task/.next/server/lib/fonts/NotoSansJP-Regular.ttf",
      path.join(__dirname, "../fonts/NotoSansJP-Regular.ttf"),
      path.join(__dirname, "../../lib/fonts/NotoSansJP-Regular.ttf"),
    ];
    let fontBytes: Buffer | null = null;
    for (const fp of candidates) {
      try { fontBytes = fs.readFileSync(fp); break; } catch { /* next */ }
    }
    if (!fontBytes) throw new Error(`Font not found. cwd=${cwd}, tried: ${candidates.join(", ")}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fontkit = (await import("fontkit")).default as any;
    doc.registerFontkit(fontkit);
    font = await doc.embedFont(fontBytes);
  } catch (fontErr) {
    console.error("Japanese font load failed, using Helvetica:", fontErr);
    font = await doc.embedFont(StandardFonts.Helvetica);
  }

  const page = doc.addPage([595, 842]); // A4
  const { width } = page.getSize();
  const purple = rgb(0.486, 0.228, 0.929);
  const gray = rgb(0.4, 0.4, 0.4);
  const black = rgb(0.13, 0.13, 0.13);
  const lineGray = rgb(0.85, 0.85, 0.85);

  let y = 780;
  const lm = 60; // left margin
  const rm = width - 60; // right margin

  // Title
  page.drawText("支払明細書", { x: lm, y, font, size: 20, color: black });
  y -= 8;
  page.drawLine({ start: { x: lm, y }, end: { x: lm + 80, y }, thickness: 2, color: purple });
  y -= 28;

  // Meta
  const meta = [
    ["発行日", p.issuedDate],
    ["明細書番号", p.statementNumber],
  ];
  for (const [label, value] of meta) {
    page.drawText(label, { x: lm, y, font, size: 10, color: gray });
    page.drawText(value, { x: rm - font.widthOfTextAtSize(value, 10), y, font, size: 10, color: black });
    y -= 18;
  }
  y -= 12;

  // Recipient
  const recipientName = `${p.contactName || p.locationName} 様`;
  page.drawText(recipientName, { x: lm, y, font, size: 14, color: black });
  y -= 32;

  // Table rows
  const rows = [
    ["対象期間", `${formatDateJP(p.periodStart)} 〜 ${formatDateJP(p.periodEnd)}`],
    ["設置場所", p.locationName],
    ["有料診断件数", `${p.count}件`],
    ["単価", `¥${p.unitRate}（税込）`],
    ["当月分", `¥${p.monthlyAmount.toLocaleString()}`],
  ];
  if (p.carriedOver > 0) {
    rows.push(["前月繰越", `¥${p.carriedOver.toLocaleString()}`]);
  }

  for (const [label, value] of rows) {
    page.drawText(label, { x: lm, y, font, size: 11, color: gray });
    page.drawText(value, { x: rm - font.widthOfTextAtSize(value, 11), y, font, size: 11, color: black });
    y -= 6;
    page.drawLine({ start: { x: lm, y }, end: { x: rm, y }, thickness: 0.5, color: lineGray });
    y -= 18;
  }

  // Total
  const lineY = y + 4;
  page.drawLine({ start: { x: lm, y: lineY }, end: { x: rm, y: lineY }, thickness: 2, color: purple });
  y -= 4;
  page.drawText("お支払金額", { x: lm, y, font, size: 12, color: black });
  const totalStr = `¥${p.totalAmount.toLocaleString()}`;
  const totalY = y - 2;
  page.drawText(totalStr, { x: rm - font.widthOfTextAtSize(totalStr, 18), y: totalY, font, size: 18, color: purple });
  y -= 36;

  // Payment method
  page.drawText("お支払方法: 銀行振込", { x: lm, y, font, size: 10, color: gray });
  y -= 48;

  // Footer
  page.drawLine({ start: { x: lm, y }, end: { x: rm, y }, thickness: 0.5, color: lineGray });
  y -= 18;
  const footerLines = [
    "発行者:",
    "SATOYAMA AI BASE / 星の図書館",
    "稲福良祐",
    "メール: satoyama-ai-base@tonari2tomaru.com",
  ];
  for (const line of footerLines) {
    page.drawText(line, { x: lm, y, font, size: 9, color: gray });
    y -= 14;
  }

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}
