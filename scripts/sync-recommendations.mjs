// Tải build & đội hình mới nhất và ghi vào data/recommendations-data.js
//  - Nguồn chính: Game8 (cập nhật theo meta nhanh nhất, vd. Stellar-Swirl / Stellar-Conduct)
//  - Dự phòng: genshin-builds.com cho nhân vật Game8 chưa có trang build
// Chạy: node scripts/sync-recommendations.mjs
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const G8 = 'https://game8.co/games/Genshin-Impact/archives/';
const G8_BUILDS = `${G8}530535`; // All Character Builds
const G8_CHARACTERS = `${G8}296707`; // Characters List (có cả nhân vật sắp ra mắt)
const GB = 'https://genshin-builds.com';
const MAX_BUILDS = 3;
const MAX_SETS = 5;
const MAX_WEAPONS = 8;
const MAX_TEAMS = 5;
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

const decode = (s) => String(s || '').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
const cleanText = (s) => decode(String(s || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const slug = (s) => String(s || '').toLowerCase().replace(/['’.]/g, '').replace(/-/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

// ======================= genshin-builds.com =======================
// Giải mã props của Astro island: [0, value] = giá trị, [1, [...]] = mảng
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
    const props = JSON.parse(decode(m[2]));
    const o = {};
    for (const k in props) o[k] = revive(props[k]);
    out[m[1]] = o;
  }
  return out;
}

function extractGB(id, html) {
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

  return { name, source: 'gb', version, builds, teams };
}

// ======================= Game8 =======================
// Bảng tra id (theo genshin-builds) để dữ liệu Game8 dùng chung id với phần còn lại
let charIds = [];
let weaponIdByName = {};
function charId(name) {
  const n = norm(name.replace(/\(C\d\)/, ''));
  return charIds.find((id) => norm(id) === n)
    || charIds.find((id) => id.split('_').some((p) => p === n))
    || slug(name);
}
const weaponId = (name) => weaponIdByName[norm(name)] || slug(name);

// "HP% or Energy Recharge", "HP% > Hydro DMG", "HP% (với vũ khí ATK) ATK%" -> ['HP%', 'Energy Recharge'] ...
// Quét lần lượt các chỉ số xuất hiện trong chuỗi thay vì tách theo dấu phân cách (Game8 viết không thống nhất)
const STAT_RE = /\b(crit(?:ical)?\s*rate|crit(?:ical)?\s*(?:dmg|damage)|crit(?:ical)?|atk\s*%?|attack\s*%?|hp\s*%?|def\s*%?|elemental mastery|em|energy recharge|er|heal(?:ing)?(?:\s*bonus)?|phys(?:ical)?\s*(?:dmg|damage)(?:\s*bonus)?|(pyro|hydro|anemo|electro|dendro|cryo|geo)(?:\s*(?:dmg|damage))?(?:\s*bonus)?)(?![a-z])/gi;
function statName(s, elem) {
  const t = s.toLowerCase().replace(/\s+/g, ' ');
  if (elem) return `${elem[0].toUpperCase()}${elem.slice(1).toLowerCase()} DMG Bonus`;
  if (/^crit\w* rate/.test(t)) return 'CRIT Rate';
  if (/^crit\w* (dmg|damage)/.test(t)) return 'CRIT DMG';
  if (/^crit/.test(t)) return ['CRIT Rate', 'CRIT DMG'];
  if (/^(atk|attack)/.test(t)) return 'ATK%';
  if (/^hp/.test(t)) return 'HP%';
  if (/^def/.test(t)) return 'DEF%';
  if (/^(em|elemental mastery)$/.test(t)) return 'Elemental Mastery';
  if (/^(er|energy recharge)$/.test(t)) return 'Energy Recharge';
  if (/^heal/.test(t)) return 'Healing Bonus';
  if (/^phys/.test(t)) return 'Physical DMG Bonus';
  return null;
}
function parseStats(text) {
  const out = [];
  for (const m of text.replace(/\(.*?\)/g, ' ').matchAll(STAT_RE)) {
    for (const x of [].concat(statName(m[1], m[2]) || [])) if (!out.includes(x)) out.push(x);
  }
  return out;
}

const stripTemplates = (h) => h.replace(/<template[\s\S]*?<\/template>/g, '');
// Các mục (vũ khí / thánh di vật / nhân vật) trong 1 đoạn HTML: lấy chữ ngay sau ảnh, hoặc alt của ảnh
function items(h) {
  const out = [];
  for (const m of h.matchAll(/<img[^>]*alt=["']([^"']*)["'][^>]*>\s*([^<]*)/g)) {
    const alt = decode(m[1]).replace(/^Genshin( Impact)?\s*-\s*/, '').replace(/\s*Image$/, '').trim();
    if (/^(Hourglass|Goblet|Circlet|Sands|Flower|Plume|Feather)$/i.test(alt)) continue;
    const text = decode(m[2]).replace(/\((Event|Gacha|Craft\w*|Battle Pass|Fishing|C\d|R\d)\)/gi, '').trim();
    out.push(text && text.length >= alt.length - 3 ? text : alt);
  }
  return out;
}
const rows = (h) => [...h.matchAll(/<tr[\s>][\s\S]*?<\/tr>/g)].map((m) => m[0]);
const cells = (row) => [...row.matchAll(/<(t[hd])([^>]*)>([\s\S]*?)<\/t[hd]>/g)].map((m) => ({ tag: m[1], html: m[3] }));
const tables = (h) => [...h.matchAll(/<table[\s\S]*?<\/table>/g)].map((m) => ({ html: m[0], index: m.index }));
const headingBefore = (h, idx) => {
  const all = [...h.slice(0, idx).matchAll(/<h[34][^>]*>([\s\S]*?)<\/h[34]>/g)];
  return all.length ? cleanText(all[all.length - 1][1]) : '';
};

// Ô chứa bộ thánh di vật: "Bộ A x4 <hr> Bộ B x4" = 2 lựa chọn 4 món; "Bộ A x2 + Bộ B x2" = 1 lựa chọn 2+2
function setOptions(cellHtml) {
  const out = [];
  let pair = [];
  for (const seg of cellHtml.split(/<hr[^>]*>/)) {
    const names = items(seg).map(slug);
    if (!names.length) continue;
    const text = cleanText(seg);
    const two = (/x\s*2\b/i.test(text) || (names.length >= 2 && /\+/.test(text))) && !/x\s*4\b/i.test(text);
    if (two && names.length >= 2) out.push(names.slice(0, 2));
    else if (two) { pair.push(names[0]); if (pair.length === 2) { out.push(pair); pair = []; } }
    else for (const n of names) out.push([n]);
  }
  if (pair.length) out.push(pair);
  return out;
}

function sectionsOf(html) {
  const marks = [...html.matchAll(/<h2[^>]*class=['"]a-header--2['"][^>]*>([\s\S]*?)<\/h2>/g)];
  return marks.map((m, i) => ({
    title: cleanText(m[1]),
    html: stripTemplates(html.slice(m.index, i + 1 < marks.length ? marks[i + 1].index : html.length)),
  }));
}

// Bảng xếp hạng ("Best-in-Slot" | item ...) -> [{ names, label }]
function rankedRows(h) {
  const out = [];
  for (const t of tables(h)) {
    for (const r of rows(t.html)) {
      const cs = cells(r);
      const withItems = cs.filter((c) => items(c.html).length);
      if (!withItems.length) continue;
      // Nhãn xếp hạng nằm trước ô vũ khí/bộ (cột sau thường là cách nhận, vd. Gacha)
      const first = cs.indexOf(withItems[0]);
      const labelCell = cs.slice(0, first).find((c) => cleanText(c.html).length < 40);
      for (const c of withItems) out.push({ html: c.html, label: labelCell ? cleanText(labelCell.html) : '' });
    }
  }
  return out;
}

function extractG8(html) {
  const updated = (/Last updated on:\s*([^<]+)/.exec(html) || [])[1]?.trim() || '';
  const secs = sectionsOf(html);
  const sec = (re) => secs.find((s) => re.test(s.title));
  const buildSec = sec(/Builds?\b/i);
  const weaponSec = sec(/Weapons?\b/i);
  const artifactSec = sec(/Artifacts?\b/i);
  const teamSec = sec(/Team/i);

  // ---- Vũ khí & bộ xếp hạng chung (dùng cho mọi build) ----
  const weaponRank = [];
  const weaponNotes = {};
  for (const r of weaponSec ? rankedRows(weaponSec.html) : []) {
    for (const n of items(r.html)) {
      const id = weaponId(n);
      if (!weaponRank.includes(id)) weaponRank.push(id);
      if (r.label && !weaponNotes[id] && !/^(Recommended|Weapon)/i.test(r.label)) weaponNotes[id] = r.label;
    }
  }
  const setRank = [];
  const setNotes = {};
  for (const r of artifactSec ? rankedRows(artifactSec.html) : []) {
    if (/Sands|Goblet|Circlet/i.test(r.html)) continue;
    for (const opt of setOptions(r.html)) {
      const key = opt.join('+');
      if (!setRank.some((o) => o.join('+') === key)) setRank.push(opt);
      if (r.label && !setNotes[key]) setNotes[key] = r.label;
    }
  }

  // ---- Các bảng build (bảng có "Sands:") ----
  const builds = [];
  for (const t of buildSec ? tables(buildSec.html) : []) {
    if (!/Sands\s*:/i.test(cleanText(t.html))) continue;
    const name = headingBefore(buildSec.html, t.index).replace(/^.*?\b(Best\s+)?/i, (x) => x).trim();
    let mode = '';
    const weapons = [];
    const sets = [];
    const stats = { sands: [], goblet: [], circlet: [] };
    for (const r of rows(t.html)) {
      const cs = cells(r);
      const head = cs.filter((c) => c.tag === 'th').map((c) => cleanText(c.html)).join(' ');
      // Bảng ngang (tiêu đề riêng 1 hàng) hoặc dọc (tiêu đề ở cột đầu mỗi hàng)
      if (head) mode = /Team/i.test(head) ? 'team' : /Artifact/i.test(head) ? 'set' : /Weapon/i.test(head) ? 'weapon' : mode;
      for (const c of cs.filter((x) => x.tag === 'td')) {
        const text = cleanText(c.html);
        if (/(Sands|Goblet|Circlet)\s*:/i.test(text)) {
          for (const k of ['sands', 'goblet', 'circlet']) {
            const m = new RegExp(`${k}\\s*:\\s*(.+?)(?=(Sands|Goblet|Circlet|Artifact Sub|$))`, 'i').exec(text);
            if (m) stats[k] = parseStats(m[1]);
          }
          continue;
        }
        if (mode === 'weapon') for (const n of items(c.html)) { const id = weaponId(n); if (!weapons.includes(id)) weapons.push(id); }
        if (mode === 'set') for (const opt of setOptions(c.html)) if (!sets.some((o) => o.join('+') === opt.join('+'))) sets.push(opt);
      }
    }
    builds.push({ name, weapons, sets, stats });
  }

  // Ghép phần xếp hạng chung vào sau phần riêng của từng build
  const out = (builds.length ? builds : [{ name: '', weapons: [], sets: [], stats: { sands: [], goblet: [], circlet: [] } }])
    .slice(0, MAX_BUILDS)
    .map((b) => {
      const weapons = [...new Set([...b.weapons, ...weaponRank])].slice(0, MAX_WEAPONS);
      const sets = [...b.sets];
      for (const o of setRank) if (!sets.some((x) => x.join('+') === o.join('+'))) sets.push(o);
      const name = b.name.replace(/\s*Build$/i, '').replace(/^.*?\bBest\s+/i, '').trim() || 'Build';
      return {
        name, role: name,
        weapons,
        weaponNotes: Object.fromEntries(weapons.filter((w) => weaponNotes[w]).map((w) => [w, weaponNotes[w]])),
        sets: sets.slice(0, MAX_SETS),
        setNotes: Object.fromEntries(sets.slice(0, MAX_SETS).map((o) => [o.join('+'), setNotes[o.join('+')] || '']).filter((x) => x[1])),
        stats: b.stats,
      };
    })
    .filter((b) => b.weapons.length || b.sets.length);

  // ---- Đội hình: mỗi ô là 1 vị trí, nhân vật đầu tiên trong ô là lựa chọn chính ----
  const teams = [];
  for (const t of teamSec ? tables(teamSec.html) : []) {
    const title = cleanText((/<th[^>]*>([\s\S]*?)<\/th>/.exec(t.html) || [])[1]);
    for (const r of rows(t.html)) {
      const cs = cells(r).filter((c) => c.tag === 'td' && items(c.html).length);
      if (cs.length < 3) continue;
      const slots = cs.map((c) => items(c.html).map(charId));
      const chars = slots.map((s) => s[0]);
      if (new Set(chars).size !== chars.length) continue;
      teams.push({
        name: title || headingBefore(teamSec.html, t.index),
        heading: headingBefore(teamSec.html, t.index),
        tier: '',
        chars,
        alts: slots.map((s) => s.slice(1)),
      });
    }
  }
  // Tên đội trùng (vd. bảng copy tiêu đề) -> dùng tiêu đề mục
  const dup = teams.filter((t) => teams.filter((x) => x.name === t.name).length > 1);
  for (const t of teams) {
    if (dup.includes(t) && t.heading) t.name = t.heading.replace(/\s*Teams?( Comps?)?$/i, ' Team');
    delete t.heading;
  }

  return { builds: out, teams: teams.slice(0, MAX_TEAMS), updated };
}

// ======================= Chạy =======================
// 1) Bảng id / tên từ genshin-builds
const gbList = await get(`${GB}/en/characters`);
charIds = [...new Set([...gbList.matchAll(/\/en\/character\/([a-z0-9_]+)/g)].map((m) => m[1]))].filter((id) => id !== 'upcoming');
const enWeapons = islands(await get(`${GB}/en/weapons`));
weaponIdByName = Object.fromEntries(((enWeapons.WeaponList || {}).weapons || []).map((w) => [norm(w.name), w.id]));
const viWeapons = islands(await get(`${GB}/vi/weapons`));
const weaponNames = Object.fromEntries(((viWeapons.WeaponList || {}).weapons || []).map((w) => [w.id, w.name]));
console.log(`${charIds.length} nhân vật, ${Object.keys(weaponNames).length} vũ khí (genshin-builds)`);

// Chạy thử trên file HTML đã tải: node scripts/sync-recommendations.mjs page.html
if (process.argv[2]) {
  console.log(JSON.stringify(extractG8(readFileSync(process.argv[2], 'utf8')), null, 1));
  process.exit(0);
}

// 2) Danh sách trang build của Game8 (+ trang nhân vật sắp ra mắt có build)
const pages = new Map();
for (const url of [G8_BUILDS, G8_CHARACTERS]) {
  const h = await get(url);
  const body = h.slice(h.indexOf('a-header--2'));
  for (const m of body.matchAll(/archives\/([^\s"'>]+)["']?[^>]*>\s*<img[^>]*alt=["'](?:Genshin Impact - ([^"']*) Image|([A-Z][A-Za-z ]+))["']/g)) {
    const name = decode(m[2] || m[3]).trim();
    if (!name || /^(Traveler|Manekin)/.test(name)) continue;
    const id = charId(name);
    // Trang danh sách nhân vật có cả mục lọc (Pyro, Sword...) -> chỉ giữ tên khớp nhân vật đã biết hoặc mới
    if (url === G8_CHARACTERS && !/^\d+$/.test(m[1])) continue;
    if (!pages.has(id)) pages.set(id, { name, path: m[1] });
  }
}
console.log(`${pages.size} trang Game8`);

const characters = {};
const stats = { g8: 0, gb: 0 };
for (const [id, p] of pages) {
  try {
    const html = await get(G8 + p.path);
    if (!/Best (Builds|Artifacts|Weapons)|Builds and Teams/i.test(html.slice(0, 200000))) continue;
    const c = extractG8(html);
    // Bỏ trang không phải build nhân vật (vd. trang vũ khí lọt vào danh sách)
    if (!c.builds.some((b) => b.sets.length && b.stats.sands.length)) continue;
    characters[id] = { name: p.name, source: 'g8', url: G8 + p.path, ...c };
    stats.g8++;
    process.stdout.write('.');
  } catch (e) {
    console.warn(`\n${id}: ${e.message}`);
  }
  await sleep(500);
}

// 3) Dự phòng genshin-builds cho nhân vật Game8 chưa có
for (const id of charIds.filter((x) => !characters[x] && !/^(traveler_|manekin)/.test(x))) {
  try {
    const c = extractGB(id, await get(`${GB}/en/character/${id}`));
    if (c.builds.length) { characters[id] = c; stats.gb++; process.stdout.write('+'); }
  } catch (e) {
    console.warn(`\n${id}: ${e.message}`);
  }
  await sleep(300);
}

// Tên đầy đủ (theo genshin-builds) giúp khớp tên trong database, vd. "Mizuki" -> "Yumemizuki Mizuki"
for (const [id, c] of Object.entries(characters)) {
  if (charIds.includes(id)) c.fullName = id.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
}

const out = {
  source: 'Game8 + genshin-builds.com',
  fetchedAt: new Date().toISOString(),
  weaponNames,
  characters,
};
writeFileSync(join(root, 'data', 'recommendations-data.js'),
  `// Tự động tạo bởi scripts/sync-recommendations.mjs — không sửa tay.\nwindow.GI_REC_DATA = ${JSON.stringify(out)};\n`);
console.log(`\nĐã ghi data/recommendations-data.js (${Object.keys(characters).length} nhân vật: Game8 ${stats.g8}, genshin-builds ${stats.gb})`);
