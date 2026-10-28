// Đọc & chuẩn hoá dữ liệu từ 3 sheet database (dạng CSV).
window.GI = window.GI || {};

(function (GI) {
  const SHEET_ID = '1IeaYRmGEPS-rU_Uvy0J9pqcdAivPh__rhHxHMTeYacc';
  const GIDS = { characters: 1949903625, weapons: 877686560, artifacts: 1346830694 };
  const CACHE_KEY = 'gi-akasha:sheet-cache';

  GI.SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;

  // ---------- CSV ----------
  function parseCSV(text) {
    const rows = [];
    let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') {
          if (text[i + 1] === '"') { cell += '"'; i++; } else q = false;
        } else cell += c;
      } else if (c === '"') q = true;
      else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
      else if (c !== '\r') cell += c;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  // "27.60%" -> 0.276, "542" -> 542, "" -> 0
  function num(v) {
    if (v == null) return 0;
    const s = String(v).trim().replace(/,/g, '');
    if (!s) return 0;
    const n = parseFloat(s);
    if (isNaN(n)) return 0;
    return s.endsWith('%') ? n / 100 : n;
  }

  // Google Drive "file/d/<id>/view" -> ảnh trực tiếp
  function driveImg(url) {
    const m = /\/d\/([^/?#]+)/.exec(url || '');
    return m ? `https://lh3.googleusercontent.com/d/${m[1]}` : '';
  }

  const clean = (s) => String(s || '').replace(/^"+|"+$/g, '').trim();

  // ---------- Nhân vật ----------
  function parseCharacters(rows) {
    const header = rows[1] || [];
    const out = [];
    for (const r of rows.slice(2)) {
      const name = clean(r[0]);
      if (!name) continue;
      const asc = {};
      for (let c = 16; c <= 30; c++) {
        const key = (header[c] || '').trim();
        if (key) asc[key] = num(r[c]);
      }
      out.push({
        name,
        rarity: parseInt(r[2], 10) || 0,
        power: clean(r[3]),
        element: clean(r[4]),
        weaponType: clean(r[5]),
        nation: clean(r[6]),
        icon: driveImg(r[7]),
        splash: driveImg(r[8]),
        base: {
          hp: num(r[9]), atk: num(r[10]), def: num(r[11]), em: num(r[12]),
          cr: num(r[13]), cd: num(r[14]), er: num(r[15]),
        },
        asc,
      });
    }
    return out;
  }

  // ---------- Vũ khí ----------
  const normStat = (s) => (s === 'Tăng ST Vật Lý' ? 'ST Vật Lý' : s);

  function parseWeapons(rows) {
    const header = rows[1] || [];
    const out = [];
    for (const r of rows.slice(2)) {
      const name = clean(r[0]);
      if (!name) continue;
      const main = {};
      for (let c = 6; c <= 13; c++) {
        const v = num(r[c]);
        if (v) main[normStat(header[c].trim())] = v;
      }
      // Nội tại: chuỗi "a/b/c/d/e" theo tinh luyện R1..R5, hoặc 1 giá trị
      const passive = {};
      for (let c = 14; c <= 29; c++) {
        const raw = (r[c] || '').trim();
        const key = (header[c] || '').trim();
        if (!raw || !key) continue;
        passive[key] = raw.includes('/') ? raw.split('/').map(num) : [num(raw)];
      }
      out.push({
        name,
        rarity: parseInt(r[2], 10) || 0,
        type: clean(r[3]),
        icon: driveImg(r[4]),
        baseAtk: num(r[5]),
        main,
        passive,
      });
    }
    return out;
  }

  // ---------- Thánh di vật ----------
  function parseArtifacts(rows) {
    const sets = [];
    const stats = {};
    rows.forEach((r, i) => {
      if (i >= 2) {
        const name = clean(r[0]);
        if (name) {
          sets.push({
            name,
            pieces: [r[2], r[3], r[4], r[5], r[6]].map(driveImg),
            bonus2: (r[7] || '').trim(),
            bonus4: (r[8] || '').trim(),
          });
        }
      }
      if (i >= 1) {
        const stat = (r[10] || '').trim();
        if (stat && !stats[stat]) {
          const rolls = [...new Set(r.slice(12).filter((v) => v.trim() !== '').map(num))].sort((a, b) => a - b);
          stats[stat] = { name: stat, icon: driveImg(r[9]), main: num(r[11]), rolls };
        }
      }
    });
    return { sets, stats };
  }

  function build(raw, source) {
    const characters = parseCharacters(parseCSV(raw.characters));
    const weapons = parseWeapons(parseCSV(raw.weapons));
    const art = parseArtifacts(parseCSV(raw.artifacts));
    return {
      characters, weapons, sets: art.sets, statInfo: art.stats,
      source, fetchedAt: raw.fetchedAt,
      charByName: Object.fromEntries(characters.map((c) => [c.name, c])),
      weaponByName: Object.fromEntries(weapons.map((w) => [w.name, w])),
      setByName: Object.fromEntries(art.sets.map((s) => [s.name, s])),
    };
  }

  // Dữ liệu ban đầu: cache từ lần đồng bộ trước (nếu có), không thì snapshot đóng gói sẵn.
  GI.loadInitialData = function () {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached && cached.characters) return build(cached, 'cache');
    } catch (e) { /* bỏ qua cache hỏng */ }
    return build(window.GI_SNAPSHOT, 'snapshot');
  };

  // Lấy trực tiếp từ Google Sheet (sheet phải được chia sẻ "Bất kỳ ai có link").
  GI.syncFromSheet = async function () {
    const raw = {};
    await Promise.all(Object.entries(GIDS).map(async ([key, gid]) => {
      const res = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`);
      if (!res.ok) throw new Error(`${key}: HTTP ${res.status}`);
      raw[key] = await res.text();
    }));
    raw.fetchedAt = new Date().toISOString();
    const data = build(raw, 'live');
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(raw)); } catch (e) { /* hết quota */ }
    return data;
  };

  GI.clearSheetCache = function () {
    try { localStorage.removeItem(CACHE_KEY); } catch (e) { /* ignore */ }
  };
})(window.GI);
