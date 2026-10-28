// Tải build & đội hình mới nhất từ genshin-builds.com và ghi vào data/recommendations-data.js
// Chạy: node scripts/sync-recommendations.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const BASE = 'https://genshin-builds.com/en';
const MAX_BUILDS = 3;
const MAX_SETS = 5;
const MAX_WEAPONS = 8;
const MAX_TEAMS = 4;
const TIER_ORDER = ['SS', 'S', 'A', 'B', 'C', ''];

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (GI-Akasha-UI data sync)' } });
    if (res.ok) return res.text();
    if (attempt >= 3) throw new Error(`${url}: HTTP ${res.status}`);
    await sleep(2000 * attempt);
  }
}

// ---- Giải mã props của Astro island: [0, value] = giá trị, [1, [...]] = mảng ----
const unescape = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
function revive(v) {
  if (Array.isArray(v)) {
    const [type, x] = v;
    if (type === 0) return reviveObj(x);
    if (type === 1) return x.map(revive);
    return x;
  }
  return reviveObj(v);
}
function reviveObj(x) {
  if (x && typeof x === 'object' && !Array.isArray(x)) {
    const o = {};
    for (const k in x) o[k] = revive(x[k]);
    return o;
  }
  return x;
}
function islands(html) {
  const out = {};
  const re = /<astro-island[^>]*component-url="\/_astro\/([A-Za-z]+)[^"]*"[^>]*props="([^"]*)"/g;
  for (const m of html.matchAll(re)) {
    if (out[m[1]]) continue;
    const props = JSON.parse(unescape(m[2]));
    const o = {};
    for (const k in props) o[k] = revive(props[k]);
    out[m[1]] = o;
  }
  return out;
}

const cleanText = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

function extract(id, html) {
  const o = islands(html);
  const title = (/<title>([^<]*)/.exec(html) || [])[1] || '';
  const name = cleanText(title.replace(/^Best\s+/, '').replace(/\s+Build:.*$/, '')) || id;
  const version = (/\(v([\d.]+)\)/.exec(title) || [])[1] || '';

  const builds = ((o.CharacterBuildTabs || {}).builds || [])
    .filter((b) => !/OUT OF DATE/i.test(`${b.name} ${b.role}`))
    .sort((a, b) => Number(!!b.recommended) - Number(!!a.recommended))
    .slice(0, MAX_BUILDS)
    .map((b) => ({
      name: cleanText(b.name),
      role: cleanText(b.role),
      recommended: !!b.recommended,
      weapons: (b.weapons || []).slice(0, MAX_WEAPONS).map((w) => w.id),
      weaponNotes: Object.fromEntries((b.weapon_notes || [])
        .filter((n) => (b.weapons || []).slice(0, MAX_WEAPONS).some((w) => w.id === n.id))
        .map((n) => [n.id, cleanText(n.note)])),
      sets: (b.sets || []).slice(0, MAX_SETS),
      stats: {
        sands: (b.stats || {}).sands || [],
        goblet: (b.stats || {}).goblet || [],
        circlet: (b.stats || {}).circlet || [],
      },
    }));

  const teams = ((o.CharacterTeamsSection || {}).teams || [])
    .map((t, i) => ({ name: cleanText(t.name), tier: t.tier || '', chars: (t.characters || []).map((c) => c.id), i }))
    .sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier) || a.i - b.i)
    .slice(0, MAX_TEAMS)
    .map(({ i, ...t }) => t);

  return { name, version, builds, teams };
}

const list = await get(`${BASE}/characters`);
const ids = [...new Set([...list.matchAll(/\/en\/character\/([a-z0-9_]+)/g)].map((m) => m[1]))]
  .filter((id) => !/^(traveler_|manekin)/.test(id));
console.log(`${ids.length} nhân vật`);

const characters = {};
const versions = {};
for (const id of ids) {
  try {
    const c = extract(id, await get(`${BASE}/character/${id}`));
    characters[id] = c;
    versions[c.version] = (versions[c.version] || 0) + 1;
    process.stdout.write('.');
  } catch (e) {
    console.warn(`\n${id}: ${e.message}`);
  }
  await sleep(300);
}

// Tên vũ khí tiếng Việt (bản dịch chính thức) để khớp với Vũ_Khí_Database
const weaponPage = islands(await get('https://genshin-builds.com/vi/weapons'));
const weaponNames = Object.fromEntries(((weaponPage.WeaponList || {}).weapons || []).map((w) => [w.id, w.name]));
console.log(`\n${Object.keys(weaponNames).length} vũ khí (tên tiếng Việt)`);

const version = Object.entries(versions).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
const out = { source: 'genshin-builds.com', version, fetchedAt: new Date().toISOString(), weaponNames, characters };
writeFileSync(join(root, 'data', 'recommendations-data.js'),
  `// Tự động tạo bởi scripts/sync-recommendations.mjs — không sửa tay.\nwindow.GI_REC_DATA = ${JSON.stringify(out)};\n`);
console.log(`\nĐã ghi data/recommendations-data.js (${Object.keys(characters).length} nhân vật, v${version})`);
