// Tải dữ liệu mới nhất từ Google Sheet và ghi vào data/snapshot.js
// Chạy: node scripts/sync-data.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SHEET_ID = '1IeaYRmGEPS-rU_Uvy0J9pqcdAivPh__rhHxHMTeYacc';
const SHEETS = {
  characters: 1949903625, // Nhân_Vật_Database
  weapons: 877686560,     // Vũ_Khí_Database
  artifacts: 1346830694,  // Thánh_Di_Vật_Database
};

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = {};
for (const [key, gid] of Object.entries(SHEETS)) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${key}: HTTP ${res.status}`);
  out[key] = await res.text();
  console.log(`${key}: ${out[key].length} bytes`);
}
out.fetchedAt = new Date().toISOString();

const js = `// Tự động tạo bởi scripts/sync-data.mjs — không sửa tay.\nwindow.GI_SNAPSHOT = ${JSON.stringify(out)};\n`;
writeFileSync(join(root, 'data', 'snapshot.js'), js);
console.log('Đã ghi data/snapshot.js');
