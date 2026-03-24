#!/usr/bin/env node
/**
 * generate-qr.js — 場所別QRコード一括生成
 *
 * Usage:
 *   node scripts/generate-qr.js "三十日珈琲" "えんがわ" "鳥沢物件"
 *   node scripts/generate-qr.js --list locations.txt
 *
 * 出力: data/qr/{場所名}.png
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://hoshinotoshokan.vercel.app";
const OUTPUT_DIR = path.join(__dirname, "..", "data", "qr");

// QR生成にGoogle Charts APIを使用（外部パッケージ不要）
function generateQR(locationName) {
  return new Promise((resolve, reject) => {
    const slug = encodeURIComponent(locationName);
    const url = `${BASE_URL}?utm_source=${slug}&utm_medium=poster`;
    const qrApiUrl = `https://chart.googleapis.com/chart?cht=qr&chs=400x400&chl=${encodeURIComponent(url)}&choe=UTF-8`;

    const outFile = path.join(OUTPUT_DIR, `${locationName}.png`);

    https.get(qrApiUrl, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`QR API returned ${res.statusCode} for ${locationName}`));
        return;
      }
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const buffer = Buffer.concat(chunks);
        fs.writeFileSync(outFile, buffer);
        console.log(`✅ ${locationName}: ${outFile} (${buffer.length} bytes)`);
        console.log(`   URL: ${url}`);
        resolve(outFile);
      });
    }).on("error", reject);
  });
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`Usage:
  node scripts/generate-qr.js "場所名1" "場所名2" ...
  node scripts/generate-qr.js --list locations.txt

Example:
  node scripts/generate-qr.js "三十日珈琲" "えんがわ" "BasecampTorisawa"
`);
    return;
  }

  let locations = args;

  // --list オプション: ファイルから読み込み
  if (args[0] === "--list" && args[1]) {
    const content = fs.readFileSync(args[1], "utf-8");
    locations = content.split("\n").map(l => l.trim()).filter(Boolean);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`Generating QR codes for ${locations.length} locations...\n`);

  for (const loc of locations) {
    try {
      await generateQR(loc);
    } catch (e) {
      console.error(`❌ ${loc}: ${e.message}`);
    }
  }

  console.log(`\nDone. Files in: ${OUTPUT_DIR}`);
}

main();
