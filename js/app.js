// Giao diện chính
(function (GI) {
  const STATE_KEY = 'gi-akasha:current';
  const BUILDS_KEY = 'gi-akasha:builds';

  const ELEMENT_COLORS = {
    'Hỏa': '#ff8a5c', 'Băng': '#9fe3f5', 'Lôi': '#c79bff', 'Thủy': '#5cb8ff',
    'Phong': '#6fe0c0', 'Nham': '#f5c451', 'Thảo': '#a5d65a',
  };
  const SHORT = {
    'HP': 'HP', 'Tấn Công': 'ATK', 'Phòng Ngự': 'DEF', '%HP': 'HP%', '%Tấn Công': 'ATK%', '%Phòng Ngự': 'DEF%',
    'Tinh Thông Nguyên Tố': 'Tinh Thông', 'Tỷ Lệ Bạo Kích': 'TL Bạo', 'Sát Thương Bạo Kích': 'ST Bạo',
    'Hiệu Quả Nạp Nguyên Tố': 'Nạp NT', 'Hiệu Quả Trị Liệu': 'Trị Liệu',
  };
  const shortName = (s) => SHORT[s] || s.replace('ST Nguyên Tố ', 'ST ');

  let data = GI.loadInitialData();
  let team = null;
  let state = null;
  let currentView = 'builder';

  // ---------- tiện ích ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const stars = (n) => '★'.repeat(n || 0);
  const img = (src, alt, cls = '') => src
    ? `<img class="${cls}" src="${esc(src)}" alt="${esc(alt)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.classList.add('img-err')">`
    : `<span class="${cls} img-ph">${esc((alt || '?').slice(0, 1))}</span>`;
  const elemChip = (e) => e ? `<span class="chip elem" style="--ec:${ELEMENT_COLORS[e] || '#ccc'}">${esc(e)}</span>` : '';
  const isPct = (stat) => !GI.isFlat(stat);
  const toDisplay = (stat, v) => (isPct(stat) ? +(v * 100).toFixed(2) : +(+v).toFixed(2));
  const fromDisplay = (stat, v) => { const n = parseFloat(String(v).replace(',', '.')) || 0; return isPct(stat) ? n / 100 : n; };
  const fmtSigned = (stat, v) => (isPct(stat) ? (v * 100).toFixed(1) + '%' : (Math.round(v * 10) / 10).toLocaleString('vi-VN'));

  function toast(msg, kind = '') {
    const t = $('#toast');
    t.textContent = msg;
    t.className = 'toast ' + kind;
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { t.hidden = true; }, 2600);
  }

  function readJSON(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem(key) || 'null');
      return v == null ? fallback : v;
    } catch (e) { return fallback; }
  }
  function writeJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* bỏ qua */ }
  }

  // ---------- trạng thái: 1 đội 4 người, mỗi người 1 build riêng ----------
  // team = { members: [build x4], active: index người đang build }
  // build = { character, level, constellation, weapon, weaponLevel, refine, artifacts }
  // `state` luôn trỏ tới build của người đang chọn (team.members[team.active])
  const CHAR_BUILDS_KEY = 'gi-akasha:char-builds';
  const BUILD_FIELDS = ['level', 'constellation', 'weapon', 'weaponLevel', 'refine', 'artifacts'];

  function bestWeaponFor(c) {
    const best = c && data.weapons.filter((x) => x.type === c.weaponType).sort((a, b) => b.rarity - a.rarity || b.baseAtk - a.baseAtk)[0];
    return best ? best.name : '';
  }

  function normalizeMember(m) {
    m = Object.assign({ character: '', level: 90, constellation: 0, weapon: '', weaponLevel: 90, refine: 1 }, m || {});
    if (!data.charByName[m.character]) m.character = '';
    m.artifacts = [0, 1, 2, 3, 4].map((i) => {
      const a = (m.artifacts || [])[i] || GI.emptyArtifact(i);
      return { set: a.set || '', main: a.main || '', subs: [0, 1, 2, 3].map((j) => ({ stat: '', value: 0, ...((a.subs || [])[j] || {}) })) };
    });
    return Object.fromEntries(['character', ...BUILD_FIELDS].map((k) => [k, m[k]]));
  }

  // Build cho nhân vật mới vào đội: lấy build đã nhớ, nếu chưa có thì vũ khí mạnh nhất cùng loại
  function freshMember(name) {
    if (!name || !data.charByName[name]) return normalizeMember({});
    const saved = readJSON(CHAR_BUILDS_KEY, {})[name];
    if (saved) return normalizeMember({ ...saved, character: name });
    return normalizeMember({ character: name, weapon: bestWeaponFor(data.charByName[name]) });
  }

  function defaultState() {
    // Giống trạng thái hiện tại của sheet Showcase
    const set = data.setByName['Bằng Chứng Máu Đỏ'] ? 'Bằng Chứng Máu Đỏ' : '';
    const main = normalizeMember({
      character: data.charByName['Vodyanitsa'] ? 'Vodyanitsa' : (data.characters[0] || {}).name,
      weapon: data.weaponByName['Thánh Ca Vòng Xoáy'] ? 'Thánh Ca Vòng Xoáy' : '',
      artifacts: [0, 1, 2, 3, 4].map((i) => ({ ...GI.emptyArtifact(i), set })),
    });
    return { members: [main, ...['Amber', 'Citlali', 'Mavuika'].map(freshMember)], active: 0 };
  }

  // Nhận cả định dạng cũ (1 nhân vật chính + tên đồng đội)
  function normalizeState(s) {
    if (!s) return defaultState();
    if (!s.members) s = { members: [s, ...(s.team || []).map((n) => freshMember(n))], active: 0 };
    const members = [0, 1, 2, 3].map((i) => normalizeMember(s.members[i]));
    let active = Math.min(3, Math.max(0, +s.active || 0));
    if (!members[active].character) active = Math.max(0, members.findIndex((m) => m.character));
    return { members, active };
  }

  function loadState() { return normalizeState(readJSON(STATE_KEY, null)); }
  function saveState() {
    writeJSON(STATE_KEY, team);
    // nhớ build từng nhân vật để khi bỏ ra / thêm lại vào đội vẫn còn
    const all = readJSON(CHAR_BUILDS_KEY, {});
    for (const m of team.members) if (m.character) all[m.character] = JSON.parse(JSON.stringify(Object.fromEntries(BUILD_FIELDS.map((k) => [k, m[k]]))));
    writeJSON(CHAR_BUILDS_KEY, all);
  }

  const teamNames = () => team.members.map((m) => m.character);
  const others = () => team.members.filter((m, i) => i !== team.active).map((m) => m.character);
  // Dữ liệu cho GI.calculate: build người đang chọn + tên 3 người còn lại
  const calcState = (m = state, t = team) => ({ ...m, team: t.members.filter((x) => x !== m).map((x) => x.character) });
  function setActive(i) { team.active = i; state = team.members[i]; }

  // ---------- data status ----------
  function renderDataInfo() {
    const label = { snapshot: 'Dữ liệu đóng gói', cache: 'Dữ liệu đồng bộ', live: 'Vừa đồng bộ' }[data.source] || '';
    const when = data.fetchedAt ? new Date(data.fetchedAt).toLocaleString('vi-VN') : '';
    $('#dataInfo').textContent = `${label} · ${data.characters.length} NV · ${data.weapons.length} VK · ${data.sets.length} bộ`;
    $('#dataInfo').title = when ? 'Cập nhật: ' + when : '';
    $('#sheetLink').href = GI.SHEET_URL;
  }

  // ---------- điều hướng ----------
  function setView(v) {
    currentView = v;
    document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('active', b.dataset.view === v));
    document.querySelectorAll('.view').forEach((s) => s.classList.toggle('active', s.id === 'view-' + v));
    render();
  }

  function render() {
    ({ builder: renderBuilder, characters: renderCharacters, weapons: renderWeapons, sets: renderSets, builds: renderBuilds })[currentView]();
  }

  // ======================================================================
  // SHOWCASE / BUILDER
  // ======================================================================
  function renderBuilder() {
    const root = $('#view-builder');
    const c = data.charByName[state.character];
    if (!c) {
      root.innerHTML = `<div class="empty">Chưa có nhân vật nào trong đội. <button class="btn" data-act="new-team">Chọn nhân vật</button></div>`;
      return;
    }
    root.innerHTML = `
      <div class="builder">
        <div class="col col-char" style="--ec:${ELEMENT_COLORS[c.element] || '#ccc'}">
          <div class="panel team-panel">
            <div class="panel-head">
              <h3>Đội hình</h3>
              <div class="row-gap">
                <button class="btn btn-sm btn-ghost" data-act="team-recs" title="Chọn đội gợi ý cho ${esc(c.name)}">✦ Đội gợi ý</button>
                <button class="btn btn-sm btn-ghost" data-act="new-team" title="Bắt đầu đội mới từ 1 nhân vật">Đội mới</button>
              </div>
            </div>
            <div class="team" id="team"></div>
            <div class="row-between">
              <span class="muted small" id="teamHint"></span>
              <button class="btn btn-sm btn-ghost" data-act="team-rec-builds" title="Áp vũ khí, bộ thánh di vật và dòng chính gợi ý cho cả 4 người (giữ dòng phụ)">Build gợi ý cho cả đội</button>
            </div>
            <div id="resonance" class="resonance"></div>
          </div>
          <div class="char-card">
            <div class="char-splash">${img(c.splash || c.icon, c.name)}</div>
            <div class="char-overlay">
              <div class="char-name-row">
                <h2 class="char-name">${esc(c.name)}</h2>
                <button class="btn btn-sm" data-act="pick-char" title="Thay ${esc(c.name)} bằng nhân vật khác ở vị trí này">Đổi</button>
              </div>
              <div class="stars">${stars(c.rarity)}</div>
              <div class="chips">${elemChip(c.element)}<span class="chip">${esc(c.weaponType)}</span><span class="chip">${esc(c.nation)}</span><span class="chip">${esc(c.power)}</span></div>
              <div class="char-controls">
                <label>Cấp
                  <select data-field="level">${[90, 95, 100].map((l) => `<option ${+state.level === l ? 'selected' : ''}>${l}</option>`).join('')}</select>
                </label>
                <div class="cons">
                  <span>Cung Mệnh</span>
                  <div class="cons-dots">${[0, 1, 2, 3, 4, 5, 6].map((n) => `<button class="cons-dot ${+state.constellation === n ? 'on' : ''} ${+state.constellation > n ? 'lit' : ''}" data-cons="${n}">C${n}</button>`).join('')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col col-stats">
          <div class="panel" id="weaponPanel"></div>
          <div class="panel">
            <div class="panel-head"><h3>Chỉ số</h3><span class="muted small">Nhấn vào dòng để xem nguồn</span></div>
            <div id="stats"></div>
          </div>
          <div class="panel">
            <div class="panel-head"><h3>Chỉ số cộng thêm</h3><span class="muted small">Vũ khí + Thánh di vật + Bộ + Cộng hưởng</span></div>
            <div id="gear" class="gear"></div>
          </div>
        </div>

        <div class="col col-arts">
          <div class="panel rec" id="recPanel"></div>
          <div class="panel">
            <div class="panel-head">
              <h3>Thánh Di Vật</h3>
              <div class="row-gap">
                <span class="pill" id="cvPill"></span>
                <button class="btn btn-sm btn-ghost" data-act="set-all">Đặt bộ cho cả 5</button>
                <button class="btn btn-sm btn-ghost" data-act="clear-arts">Xoá</button>
              </div>
            </div>
            <div id="activeSets" class="active-sets"></div>
            <div class="arts" id="arts"></div>
          </div>
          <div class="panel actions">
            <button class="btn" data-act="save-build">💾 Lưu build</button>
            <button class="btn btn-ghost" data-act="export-build">Xuất JSON</button>
            <button class="btn btn-ghost" data-act="reset-build">Đặt lại mặc định</button>
          </div>
        </div>
      </div>`;
    renderWeaponPanel();
    renderArtifacts();
    renderTeam();
    renderComputed();
  }

  function renderWeaponPanel() {
    const w = data.weaponByName[state.weapon];
    const c = data.charByName[state.character];
    const mismatch = w && c && w.type !== c.weaponType;
    const ri = (+state.refine || 1) - 1;
    const passives = w ? Object.entries(w.passive) : [];
    $('#weaponPanel').innerHTML = `
      <div class="panel-head"><h3>Vũ Khí</h3><button class="btn btn-sm" data-act="pick-weapon">${w ? 'Đổi' : 'Chọn'} vũ khí</button></div>
      ${w ? `
      <div class="weapon">
        <div class="weapon-icon r${w.rarity}">${img(w.icon, w.name)}</div>
        <div class="weapon-info">
          <div class="weapon-name">${esc(w.name)} ${mismatch ? '<span class="warn" title="Không cùng loại vũ khí với nhân vật">⚠</span>' : ''}</div>
          <div class="stars small">${stars(w.rarity)} <span class="muted">· ${esc(w.type)}</span></div>
          <div class="weapon-stats">
            <span>ATK căn bản <b>${Math.round(w.baseAtk)}</b></span>
            ${Object.entries(w.main).map(([k, v]) => `<span>${esc(shortName(k))} <b>${GI.fmt(k, v)}</b></span>`).join('')}
          </div>
          <div class="refine">
            <span class="muted small">Tinh luyện</span>
            ${[1, 2, 3, 4, 5].map((r) => `<button class="ref-btn ${+state.refine === r ? 'on' : ''}" data-refine="${r}">R${r}</button>`).join('')}
          </div>
        </div>
      </div>
      ${GI.SPECIAL_WEAPONS.has(w.name)
        ? `<div class="note">Nội tại đặc biệt: tính theo đội hình / chỉ số (giống công thức sheet).</div>`
        : passives.length ? `<div class="note">Nội tại R${ri + 1}: ${passives.map(([k, arr]) => `${esc(shortName(k))} +${GI.fmt(k, arr[ri] != null ? arr[ri] : arr[0])}`).join(', ')}</div>` : ''}
      ` : '<div class="empty small">Chưa có vũ khí</div>'}`;
  }

  function rollOptions(stat) {
    const info = data.statInfo[stat];
    if (!info) return '';
    return info.rolls.map((v) => `<option value="${toDisplay(stat, v)}">`).join('');
  }

  function renderArtifacts() {
    const setOptions = (sel) => `<option value="">— Chọn bộ —</option>` +
      data.sets.map((s) => `<option ${s.name === sel ? 'selected' : ''}>${esc(s.name)}</option>`).join('');
    $('#arts').innerHTML = state.artifacts.map((a, i) => {
      const set = data.setByName[a.set];
      const pieceImg = set && set.pieces[i];
      const mainInfo = data.statInfo[a.main];
      const mains = GI.MAIN_STATS[i];
      return `
      <div class="art" data-slot="${i}">
        <div class="art-head">
          <div class="art-icon">${pieceImg ? img(pieceImg, GI.SLOTS[i]) : `<span class="img-ph">${i + 1}</span>`}</div>
          <div class="art-title">
            <div class="art-slot">${GI.SLOTS[i]}</div>
            <select class="art-set" data-art="set">${setOptions(a.set)}</select>
          </div>
        </div>
        <div class="art-main">
          ${mains.length === 1
            ? `<span class="main-label">${esc(mains[0])}</span>`
            : `<select data-art="main"><option value="">— Dòng chính —</option>${mains.map((m) => `<option ${m === a.main ? 'selected' : ''}>${esc(m)}</option>`).join('')}</select>`}
          <b class="main-val">${mainInfo ? GI.fmt(a.main, mainInfo.main) : '—'}</b>
        </div>
        <div class="subs">
          ${a.subs.map((s, j) => `
            <div class="sub">
              <select data-sub-stat="${j}">
                <option value="">— Dòng phụ ${j + 1} —</option>
                ${GI.SUB_STATS.filter((st) => st !== a.main).map((st) => `<option ${st === s.stat ? 'selected' : ''}>${esc(st)}</option>`).join('')}
              </select>
              <div class="sub-val">
                <input type="number" step="any" min="0" data-sub-val="${j}" ${s.stat ? '' : 'disabled'}
                  value="${s.stat && s.value ? toDisplay(s.stat, s.value) : ''}" list="rolls-${i}-${j}" placeholder="${s.stat ? '0' : ''}">
                <span class="unit">${s.stat && isPct(s.stat) ? '%' : ''}</span>
                <datalist id="rolls-${i}-${j}">${s.stat ? rollOptions(s.stat) : ''}</datalist>
              </div>
            </div>`).join('')}
        </div>
      </div>`;
    }).join('');
  }

  function renderTeam() {
    const filled = teamNames().filter(Boolean).length;
    $('#team').innerHTML = team.members.map((m, i) => {
      const t = data.charByName[m.character];
      const w = data.weaponByName[m.weapon];
      return `
        <button class="team-slot ${i === team.active ? 'active' : ''}" data-team="${i}" style="--ec:${t ? ELEMENT_COLORS[t.element] : '#555'}"
          title="${t ? (i === team.active ? 'Đang build ' + esc(t.name) : 'Bấm để build ' + esc(t.name)) : 'Thêm nhân vật'}">
          ${t ? img(t.icon, t.name) : '<span class="img-ph">+</span>'}
          <span class="team-name">${t ? esc(t.name) : 'Trống'}</span>
          ${t ? `<span class="muted tiny team-gear">C${m.constellation}${w ? ' · ' + esc(w.name) : ''}</span>` : ''}
          ${t && filled > 1 ? `<span class="x" data-team-clear="${i}" title="Bỏ khỏi đội">✕</span>` : ''}
        </button>`;
    }).join('');
    $('#teamHint').textContent = (filled < 4 ? `${filled}/4 — cần đủ 4 để kích hoạt cộng hưởng. ` : '') + 'Bấm vào thành viên để build.';
  }

  function renderComputed() {
    const r = GI.calculate(data, calcState());
    if (!r) return;

    // Chỉ số cuối
    $('#stats').innerHTML = GI.FINAL_STATS.map((k) => {
      const total = r.totals[k];
      const base = r.bases[k];
      const show = total !== 0 || ['HP', 'Tấn Công', 'Phòng Ngự', 'Tinh Thông Nguyên Tố', 'Tỷ Lệ Bạo Kích', 'Sát Thương Bạo Kích', 'Hiệu Quả Nạp Nguyên Tố'].includes(k);
      const info = data.statInfo[k];
      const sources = r.breakdown[k] || [];
      return `
        <details class="stat-row ${show ? '' : 'zero'}">
          <summary>
            <span class="stat-icon">${info && info.icon ? img(info.icon, k) : ''}</span>
            <span class="stat-name">${esc(k)}</span>
            <span class="stat-val">
              ${base != null ? `<span class="base">${Math.round(base).toLocaleString('vi-VN')}</span><span class="bonus">+${Math.round(total - base).toLocaleString('vi-VN')}</span>` : ''}
              <b>${GI.fmt(k, total)}</b>
            </span>
          </summary>
          <div class="sources">
            ${base != null ? `<div><span>Căn bản${k === 'Tấn Công' ? ' (NV + VK)' : ''}</span><b>${Math.round(base).toLocaleString('vi-VN')}</b></div>` : ''}
            ${k === 'Tỷ Lệ Bạo Kích' ? '<div><span>Căn bản</span><b>5.0%</b></div>' : ''}
            ${k === 'Sát Thương Bạo Kích' ? '<div><span>Căn bản</span><b>50.0%</b></div>' : ''}
            ${k === 'Hiệu Quả Nạp Nguyên Tố' ? '<div><span>Căn bản</span><b>100.0%</b></div>' : ''}
            ${sources.map((s) => `<div><span>${esc(s.source)}${s.pct ? ' (%)' : ''}</span><b>+${s.pct ? (s.value * 100).toFixed(1) + '%' : fmtSigned(k, s.value)}</b></div>`).join('') || (base == null ? '<div class="muted">Không có nguồn cộng thêm</div>' : '')}
          </div>
        </details>`;
    }).join('') + (() => {
      const extras = GI.EXTRA_STATS.filter((k) => r.totals[k] > 0);
      return extras.length ? `<div class="extras">${extras.map((k) => `<span class="chip gold">${esc(k)} +${(r.totals[k] * 100).toFixed(0)}%</span>`).join('')}</div>` : '';
    })();

    // Bộ đang kích hoạt
    $('#activeSets').innerHTML = r.activeSets.length
      ? r.activeSets.map((s) => {
        const set = data.setByName[s.name];
        return `<div class="set-badge">${set ? img(set.pieces.find(Boolean), s.name) : ''}<span>${esc(s.name)}</span><b>x${s.count >= 4 ? 4 : 2}</b></div>`;
      }).join('')
      : '<span class="muted small">Không có bộ nào kích hoạt (cần ≥ 2 món cùng bộ)</span>';

    // Cộng hưởng
    const resDesc = { 'Hỏa': '+25% Tấn Công', 'Thủy': '+25% HP', 'Thảo': '+50 Tinh Thông', 'Băng': '+15% TL Bạo (điều kiện)', 'Lôi': 'Tạo hạt năng lượng', 'Phong': 'Giảm hồi chiêu', 'Nham': 'Tăng ST khiên' };
    $('#resonance').innerHTML = r.resonances.length
      ? r.resonances.map((e) => `<div class="res" style="--ec:${ELEMENT_COLORS[e]}"><span class="dot"></span>Cộng hưởng Nguyên tố: <b>${esc(e)}</b><span class="muted small">${resDesc[e] || ''}</span></div>`).join('')
      : `<span class="muted small">${r.isFullTeam ? 'Không có cộng hưởng' : 'Chưa đủ đội hình'}</span>`;

    // Chỉ số cộng thêm (giống hàng 23-24 Showcase)
    const order = ['HP', 'Tấn Công', 'Phòng Ngự', '%HP', '%Tấn Công', '%Phòng Ngự', 'Tinh Thông Nguyên Tố', 'Tỷ Lệ Bạo Kích',
      'Sát Thương Bạo Kích', 'Hiệu Quả Nạp Nguyên Tố', 'Hiệu Quả Trị Liệu', ...GI.ELEMENTS.map((e) => 'ST Nguyên Tố ' + e), 'ST Vật Lý'];
    const gearKeys = order.filter((k) => r.gear[k] > 0);
    $('#gear').innerHTML = gearKeys.length
      ? gearKeys.map((k) => {
        const info = data.statInfo[k];
        return `<div class="gear-item">${info && info.icon ? img(info.icon, k) : ''}<span>${esc(shortName(k))}</span><b>${GI.fmt(k, r.gear[k])}</b></div>`;
      }).join('')
      : '<span class="muted small">Chưa có</span>';

    $('#cvPill').textContent = 'CV ' + GI.critValue(state.artifacts).toFixed(1);
    $('#cvPill').title = 'Crit Value = 2 × TL Bạo + ST Bạo (dòng phụ)';
    renderRec();
  }

  // ---------- gợi ý build / đội hình ----------
  // 4 món: cả 5 món cùng bộ · 2+2: Hoa, Lông, Nón = bộ 1; Cát, Ly = bộ 2
  const recSetLayout = (sets) => (sets.length === 1 ? Array(5).fill(sets[0]) : [sets[0], sets[0], sets[1], sets[1], sets[0]]);

  // Build đang chọn trong panel gợi ý (theo nhân vật)
  const recBuildSel = {};
  const titleCase = (s) => (s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s/&(-])([a-z])/g, (m, p, ch) => p + ch.toUpperCase()).replace(/\bDps\b/g, 'DPS') : s);

  function recSetName(opt) {
    const part = (it) => (it.generic ? `<span title="Ví dụ: ${esc(it.name)}">${esc(it.generic)}</span>` : esc(it.name));
    if (opt.four) return `${part(opt.items[0])} <b>4</b>`;
    if (opt.pick) return `2 + 2 từ: ${opt.items.map(part).join(' / ')}`;
    if (opt.items.length === 1) return `${part(opt.items[0])} <b>2 + 2</b>`;
    return opt.items.map((it) => `${part(it)} <b>2</b>`).join(' + ');
  }

  function recHtml(rec, c, interactive) {
    const curSets = state.artifacts.map((a) => a.set).join('|');
    const curTeam = others().filter(Boolean).sort().join('|');
    const sameChar = state.character === c.name;
    const bi = Math.min(recBuildSel[c.name] || 0, rec.builds.length - 1);
    const build = rec.builds[bi];
    return `
      <div class="rec-role">
        ${rec.builds.length > 1
          ? rec.builds.map((b, i) => `<button class="fchip ${i === bi ? 'on' : ''}" data-rec-build="${i}" data-char="${esc(c.name)}">${esc(titleCase(b.name))}</button>`).join('')
          : `<span class="chip gold">${esc(titleCase(build.role))}</span>`}
        ${rec.guess ? '<span class="chip" title="Chưa có guide chính thức, dự đoán theo bộ kỹ năng">Dự đoán</span>' : ''}
        ${rec.auto ? '<span class="chip" title="Tự sinh theo chỉ số đột phá">Tự động</span>' : ''}
      </div>
      ${rec.builds.length > 1 && build.role !== build.name ? `<div class="muted small">${esc(titleCase(build.role))}</div>` : ''}
      <div class="rec-block">
        <div class="rec-title">Vũ khí</div>
        <div class="rec-weapons">
          ${build.weapons.map((wr, i) => {
            const w = data.weaponByName[wr.name];
            const equipped = sameChar && state.weapon === w.name;
            const sub = Object.entries(w.main)[0];
            return `
            <button class="rec-weapon r${w.rarity} ${equipped ? 'applied' : ''}" ${interactive ? `data-rec-weapon="${esc(w.name)}"` : 'disabled'}
              title="${esc(wr.note || w.name)}${interactive ? (equipped ? '\n(Đang trang bị)' : '\nBấm để trang bị') : ''}">
              <span class="rec-rank">${i + 1}</span>
              <span class="rw-icon">${img(w.icon, w.name)}</span>
              <span class="rw-name">${esc(w.name)}</span>
              <span class="rw-sub">${stars(w.rarity)}${sub ? ` · ${esc(shortName(sub[0]))} ${GI.fmt(sub[0], sub[1])}` : ''}</span>
              ${wr.note && wr.note.length <= 32 ? `<span class="rw-note">${esc(wr.note)}</span>` : ''}
              ${equipped ? '<span class="rw-on">✓</span>' : ''}
            </button>`;
          }).join('') || '<span class="muted small">Chưa có gợi ý</span>'}
        </div>
      </div>
      <div class="rec-block">
        <div class="rec-title">Bộ thánh di vật</div>
        ${build.sets.map((opt, i) => {
          const applied = sameChar && recSetLayout(opt.sets).join('|') === curSets;
          return `
          <div class="rec-item ${applied ? 'applied' : ''}">
            <span class="rec-rank">${i + 1}</span>
            <div class="rec-set-icons">${[...new Set(opt.sets)].map((n) => img((data.setByName[n] || {}).pieces?.find(Boolean), n)).join('')}</div>
            <div class="rec-body">
              <div class="rec-name">${recSetName(opt)}${opt.note ? ` <span class="rec-note">${esc(opt.note)}</span>` : ''}</div>
              <div class="muted tiny">${opt.four ? esc(setBonusText(opt.sets[0])) : `Áp dụng: ${opt.sets.map(esc).join(' + ')}`}</div>
            </div>
            ${interactive ? `<button class="btn btn-sm ${applied ? 'btn-ghost' : ''}" data-rec-set="${i}">${applied ? '✓ Đang dùng' : 'Áp dụng'}</button>` : ''}
          </div>`;
        }).join('')}
      </div>
      <div class="rec-block">
        <div class="rec-title">Dòng chính ${interactive ? '<button class="btn btn-sm btn-ghost" data-rec-main>Áp dụng</button>' : ''}</div>
        <div class="rec-mains">
          ${['Cát', 'Ly', 'Nón'].map((slot, i) => `<div><span class="muted small">${slot}</span><b>${build.mainStats[i].map((s) => esc(shortName(s))).join(' / ') || '—'}</b></div>`).join('')}
        </div>
      </div>
      <div class="rec-block">
        <div class="rec-title">Đội hình</div>
        ${rec.teams.map((t, i) => {
          const applied = sameChar && [...t.members].sort().join('|') === curTeam;
          return `
          <div class="rec-item ${applied ? 'applied' : ''}">
            ${t.tier ? `<span class="rec-tier t-${esc(t.tier)}" title="Xếp hạng đội">${esc(t.tier)}</span>` : ''}
            <div class="rec-body">
            ${t.name ? `<div class="muted tiny rec-team-name">${esc(t.name)}</div>` : ''}
            <div class="rec-team">${[c.name, ...t.members].map((n) => {
              const m = data.charByName[n];
              return `<span class="rec-member" title="${esc(n)}" style="--ec:${ELEMENT_COLORS[m.element] || '#888'}">${img(m.icon, n)}<small>${esc(n)}</small></span>`;
            }).join('')}${Array(t.missing).fill('<span class="rec-member" title="Nhân vật không có trong database (vd. Nhà Lữ Hành)"><span class="img-ph">?</span><small>Khác</small></span>').join('')}</div>
            ${t.alts && t.alts.length ? `<div class="muted tiny">Thay thế: ${t.alts.map(esc).join(', ')}</div>` : ''}
            </div>
            ${interactive ? `<div class="team-picker-actions">
              <button class="btn btn-sm ${applied ? 'btn-ghost' : ''}" data-rec-team="${i}">${applied ? '✓ Đang dùng' : 'Áp dụng'}</button>
              <button class="btn btn-sm btn-ghost" data-rec-team="${i}" data-with-builds title="Áp dụng đội và build gợi ý (vũ khí, bộ, dòng chính) cho cả 4 người">+ Build</button>
            </div>` : ''}
          </div>`;
        }).join('') || '<span class="muted small">Chưa có gợi ý</span>'}
      </div>
      <div class="muted tiny rec-src">Nguồn: ${rec.url ? `<a href="${esc(rec.url)}" target="_blank" rel="noopener">${esc(rec.source)}</a>` : esc(rec.source)}${rec.note ? ' · ' + esc(rec.note) : ''}</div>`;
  }

  function renderRec() {
    const panel = $('#recPanel');
    const c = data.charByName[state.character];
    const rec = c && GI.getRecommendation(data, c.name);
    if (!panel || !rec) return;
    const open = readJSON('gi-akasha:rec-open', true);
    panel.innerHTML = `
      <div class="panel-head">
        <h3>✦ Gợi ý cho ${esc(c.name)}</h3>
        <button class="btn btn-sm btn-ghost" data-rec-toggle>${open ? 'Thu gọn' : 'Mở rộng'}</button>
      </div>
      ${open ? recHtml(rec, c, true) : ''}`;
  }

  // ---------- áp dụng gợi ý (luôn cho người đang chọn, hoặc cho từng người khi áp cả đội) ----------
  function recBuildFor(name) {
    const rec = GI.getRecommendation(data, name);
    return rec && rec.builds[Math.min(recBuildSel[name] || 0, rec.builds.length - 1)];
  }

  function setRecSets(m, opt) {
    const layout = recSetLayout(opt.sets);
    m.artifacts.forEach((a, slot) => { a.set = layout[slot]; });
  }

  function setRecMains(m, build) {
    [2, 3, 4].forEach((slot, i) => {
      const main = build.mainStats[i].find((s) => GI.MAIN_STATS[slot].includes(s));
      if (!main) return;
      const a = m.artifacts[slot];
      a.main = main;
      a.subs.forEach((s) => { if (s.stat === main) { s.stat = ''; s.value = 0; } });
    });
  }

  // Vũ khí #1 + bộ #1 + dòng chính gợi ý; giữ nguyên dòng phụ đã nhập
  function setRecBuild(m) {
    const build = m.character && recBuildFor(m.character);
    if (!build) return;
    const w = build.weapons[0];
    if (w && m.weapon !== w.name) { m.weapon = w.name; m.refine = 1; }
    if (build.sets[0]) setRecSets(m, build.sets[0]);
    setRecMains(m, build);
  }

  function applyRecSet(i) {
    const opt = recBuildFor(state.character).sets[i];
    setRecSets(state, opt);
    commit(renderArtifacts, renderComputed);
    toast(`${state.character}: đã áp dụng ` + (opt.four ? opt.sets[0] + ' (4)' : opt.sets.join(' + ')), 'ok');
  }

  function applyRecMain() {
    setRecMains(state, recBuildFor(state.character));
    commit(renderArtifacts, renderComputed);
    toast(`${state.character}: đã áp dụng dòng chính gợi ý`, 'ok');
  }

  // Đội = người đang chọn + 3 thành viên; ai đã từng build thì giữ build cũ
  function applyTeam(names, withBuilds) {
    const keep = state;
    team.members = [keep, ...[0, 1, 2].map((j) => {
      const n = names[j];
      return team.members.find((m) => m.character && m.character === n) || freshMember(n);
    })];
    setActive(0);
    if (withBuilds) team.members.forEach(setRecBuild);
    commit(renderBuilder);
    toast(withBuilds ? 'Đã áp dụng đội + build gợi ý cho cả 4 người' : 'Đã áp dụng đội hình', 'ok');
  }

  function applyRecTeam(i, withBuilds) {
    const rec = GI.getRecommendation(data, state.character);
    applyTeam(rec.teams[i].members, withBuilds);
  }

  function applyTeamRecBuilds() {
    const names = teamNames().filter(Boolean);
    if (!confirm(`Áp vũ khí, bộ thánh di vật và dòng chính gợi ý cho ${names.join(', ')}?\n(Dòng phụ đã nhập được giữ nguyên.)`)) return;
    team.members.forEach(setRecBuild);
    commit(renderBuilder);
    toast('Đã áp dụng build gợi ý cho cả đội', 'ok');
  }

  // Chọn đội: đội gợi ý cho nhân vật đang chọn hoặc tự chọn
  function openTeamPicker(isNew) {
    const c = data.charByName[state.character];
    const rec = GI.getRecommendation(data, c.name);
    openModal(`Đội hình cho ${c.name}`, `
      <p class="muted small">${isNew ? `Đã chọn <b>${esc(c.name)}</b>. ` : ''}Chọn 1 đội gợi ý, hoặc tự chọn từng thành viên ở mục Đội hình.
        Ai đã từng build sẽ giữ build cũ, người mới được chọn sẵn vũ khí mạnh nhất cùng loại.</p>
      <div class="team-picker">
        ${rec.teams.map((t, i) => `
          <div class="rec-item">
            <div class="rec-body">
              ${t.name ? `<div class="muted tiny rec-team-name">${esc(t.name)}</div>` : ''}
              <div class="rec-team">${[c.name, ...t.members].map((n) => {
                const m = data.charByName[n];
                return `<span class="rec-member" title="${esc(n)}" style="--ec:${ELEMENT_COLORS[m.element] || '#888'}">${img(m.icon, n)}<small>${esc(n)}</small></span>`;
              }).join('')}</div>
              ${t.alts && t.alts.length ? `<div class="muted tiny">Thay thế: ${t.alts.map(esc).join(', ')}</div>` : ''}
            </div>
            <div class="team-picker-actions">
              <button class="btn btn-sm" data-pick-team="${i}">Dùng đội</button>
              <button class="btn btn-sm btn-ghost" data-pick-team="${i}" data-with-builds title="Áp vũ khí, bộ và dòng chính gợi ý cho cả 4 người">+ Build gợi ý</button>
            </div>
          </div>`).join('') || '<div class="muted">Chưa có đội gợi ý cho nhân vật này.</div>'}
      </div>
      <div class="row-gap" style="margin-top:12px"><button class="btn btn-ghost" data-own-team>Tự chọn đội</button></div>`, (root) => {
      root.onclick = (e) => {
        const b = e.target.closest('[data-pick-team]');
        if (b) { closeModal(); return applyRecTeam(+b.dataset.pickTeam, b.hasAttribute('data-with-builds')); }
        if (e.target.closest('[data-own-team]')) closeModal();
      };
    });
  }

  function onBuilderEvent(e) {
    const t = e.target;
    const act = t.closest('[data-act]');
    if (e.type === 'click') {
      if (t.closest('[data-team-clear]')) {
        e.stopPropagation();
        const i = +t.closest('[data-team-clear]').dataset.teamClear;
        const removed = team.members[i].character;
        team.members[i] = normalizeMember({});
        if (i === team.active) setActive(team.members.findIndex((m) => m.character));
        commit(renderBuilder);
        return toast(`Đã bỏ ${removed} khỏi đội (build vẫn được nhớ)`);
      }
      const slot = t.closest('[data-team]');
      if (slot) {
        const i = +slot.dataset.team;
        if (team.members[i].character) {
          if (i !== team.active) { setActive(i); commit(renderBuilder); }
          return;
        }
        return pickCharacter((name) => { team.members[i] = freshMember(name); setActive(i); commit(renderBuilder); }, true);
      }
      const cons = t.closest('[data-cons]');
      if (cons) { state.constellation = +cons.dataset.cons; return commit(renderBuilder); }
      const recSet = t.closest('[data-rec-set]');
      if (recSet) return applyRecSet(+recSet.dataset.recSet);
      const recTeam = t.closest('[data-rec-team]');
      if (recTeam) return applyRecTeam(+recTeam.dataset.recTeam, recTeam.hasAttribute('data-with-builds'));
      if (t.closest('[data-rec-main]')) return applyRecMain();
      const recWeapon = t.closest('[data-rec-weapon]');
      if (recWeapon) {
        if (state.weapon !== recWeapon.dataset.recWeapon) state.refine = 1;
        state.weapon = recWeapon.dataset.recWeapon;
        commit(renderWeaponPanel, renderComputed);
        return toast(`${state.character}: đã trang bị ${state.weapon}`, 'ok');
      }
      const recBuild = t.closest('[data-rec-build]');
      if (recBuild) { recBuildSel[recBuild.dataset.char] = +recBuild.dataset.recBuild; return renderRec(); }
      if (t.closest('[data-rec-toggle]')) {
        writeJSON('gi-akasha:rec-open', !readJSON('gi-akasha:rec-open', true));
        return renderRec();
      }
      const ref = t.closest('[data-refine]');
      if (ref) { state.refine = +ref.dataset.refine; return commit(renderWeaponPanel, renderComputed); }
      if (!act) return;
      switch (act.dataset.act) {
        case 'pick-char': return pickCharacter((name) => selectCharacter(name), true);
        case 'new-team': return pickCharacter((name) => newTeam(name));
        case 'team-recs': return openTeamPicker(false);
        case 'team-rec-builds': return applyTeamRecBuilds();
        case 'pick-weapon': return pickWeapon();
        case 'set-all': return pickSetForAll();
        case 'clear-arts':
          if (!confirm('Xoá toàn bộ thánh di vật?')) return;
          state.artifacts = [0, 1, 2, 3, 4].map((i) => GI.emptyArtifact(i));
          return commit(renderArtifacts, renderComputed);
        case 'save-build': return saveBuildPrompt();
        case 'export-build': return exportJSON({ type: 'gi-akasha-build', build: team }, `build-${teamNames().filter(Boolean).join('-')}.json`);
        case 'reset-build':
          if (!confirm('Đặt lại đội & build về mặc định (giống sheet)?')) return;
          team = defaultState();
          setActive(team.active);
          return commit(renderBuilder);
      }
      return;
    }

    // change / input
    if (t.dataset.field === 'level') { state.level = +t.value; return commit(); }
    const art = t.closest('.art');
    if (!art) return;
    const a = state.artifacts[+art.dataset.slot];
    if (t.dataset.art === 'set' && e.type === 'change') { a.set = t.value; return commit(renderArtifacts, renderComputed); }
    if (t.dataset.art === 'main' && e.type === 'change') {
      a.main = t.value;
      a.subs.forEach((s) => { if (s.stat === a.main) { s.stat = ''; s.value = 0; } });
      return commit(renderArtifacts, renderComputed);
    }
    if (t.dataset.subStat != null && e.type === 'change') {
      const s = a.subs[+t.dataset.subStat];
      const old = s.stat;
      s.stat = t.value;
      if (!s.stat) s.value = 0;
      else if (old !== s.stat) {
        // giữ giá trị hợp lý khi đổi loại: mặc định là roll cao nhất 1 lần
        const info = data.statInfo[s.stat];
        s.value = info && info.rolls.length ? info.rolls[3] || info.rolls[0] : 0;
      }
      return commit(renderArtifacts, renderComputed);
    }
    if (t.dataset.subVal != null) {
      const s = a.subs[+t.dataset.subVal];
      s.value = Math.max(0, fromDisplay(s.stat, t.value));
      return commit(renderComputed);
    }
  }

  function commit(...renders) {
    state = team.members[team.active];
    saveState();
    renders.forEach((fn) => fn());
    // ô thành viên hiển thị cung mệnh + vũ khí nên luôn cập nhật
    if (!renders.includes(renderBuilder) && $('#team')) renderTeam();
  }

  // Thay nhân vật ở vị trí đang chọn (các thành viên khác giữ nguyên)
  function selectCharacter(name) {
    const old = state.character;
    if (old === name) return;
    team.members[team.active] = freshMember(name);
    const alone = teamNames().filter(Boolean).length === 1;
    commit(renderBuilder);
    if (alone) openTeamPicker(true);
    else toast(`Đã đổi ${old} thành ${name}`);
  }

  // Đội mới: chỉ có nhân vật vừa chọn, sau đó chọn đội gợi ý hoặc tự chọn
  function newTeam(name) {
    team.members = [freshMember(name), ...[0, 1, 2].map(() => normalizeMember({}))];
    setActive(0);
    commit(renderBuilder);
    openTeamPicker(true);
  }

  // ---------- pickers ----------
  function openModal(title, html, onMount) {
    $('#modalTitle').textContent = title;
    $('#modalBody').oninput = $('#modalBody').onclick = null; // bỏ handler của modal trước
    $('#modalBody').innerHTML = html;
    $('#modal').hidden = false;
    document.body.classList.add('no-scroll');
    if (onMount) onMount($('#modalBody'));
  }
  function closeModal() {
    $('#modal').hidden = true;
    document.body.classList.remove('no-scroll');
  }

  function filterBar(groups) {
    return `
      <div class="filters">
        <input type="search" class="search" placeholder="Tìm kiếm…" data-filter="q" autofocus>
        ${groups.map((g) => `
          <div class="filter-group">
            ${g.values.map((v) => `<button class="fchip" data-filter="${g.key}" data-value="${esc(v)}" ${g.key === 'element' ? `style="--ec:${ELEMENT_COLORS[v] || '#aaa'}"` : ''}>${esc(g.label ? g.label(v) : v)}</button>`).join('')}
          </div>`).join('')}
      </div>`;
  }

  // Gắn logic lọc chung: items cần data-* tương ứng + data-search
  function bindFilters(root, gridSel) {
    const active = {};
    const apply = () => {
      const q = ($('[data-filter="q"]', root).value || '').trim().toLowerCase();
      let shown = 0;
      root.querySelectorAll(gridSel + ' > [data-search]').forEach((el) => {
        let ok = !q || el.dataset.search.toLowerCase().includes(q);
        for (const [k, v] of Object.entries(active)) if (v && el.dataset[k] !== v) ok = false;
        el.hidden = !ok;
        if (ok) shown++;
      });
      const cnt = $('.count', root);
      if (cnt) cnt.textContent = shown + ' kết quả';
    };
    // Gán handler (không addEventListener) để render lại không bị chồng listener
    root.oninput = (e) => { if (e.target.dataset.filter === 'q') apply(); };
    root.onclick = (e) => {
      const b = e.target.closest('.fchip');
      if (!b) return;
      const k = b.dataset.filter;
      active[k] = active[k] === b.dataset.value ? '' : b.dataset.value;
      root.querySelectorAll(`.fchip[data-filter="${k}"]`).forEach((x) => x.classList.toggle('on', x.dataset.value === active[k]));
      apply();
    };
    apply();
    return apply;
  }

  const uniq = (arr) => [...new Set(arr.filter(Boolean))];

  function charTile(c, extra = '') {
    return `
      <button class="tile r${c.rarity}" data-name="${esc(c.name)}" data-search="${esc(c.name + ' ' + c.nation)}"
        data-element="${esc(c.element)}" data-weapon="${esc(c.weaponType)}" data-rarity="${c.rarity}" data-nation="${esc(c.nation)}" ${extra}>
        <div class="tile-img" style="--ec:${ELEMENT_COLORS[c.element] || '#888'}">${img(c.icon, c.name)}<span class="tile-elem"></span></div>
        <div class="tile-name">${esc(c.name)}</div>
      </button>`;
  }

  function pickCharacter(onPick, isTeam) {
    const exclude = new Set(isTeam ? teamNames().filter(Boolean) : []);
    const list = data.characters.filter((c) => !exclude.has(c.name));
    openModal('Chọn nhân vật', `
      ${filterBar([
        { key: 'element', values: GI.ELEMENTS },
        { key: 'weapon', values: uniq(data.characters.map((c) => c.weaponType)) },
        { key: 'rarity', values: ['5', '4'], label: (v) => v + '★' },
      ])}
      <div class="count muted small"></div>
      <div class="grid tiles" id="pickGrid">${list.map((c) => charTile(c)).join('')}</div>`, (root) => {
      bindFilters(root, '#pickGrid');
      root.querySelector('#pickGrid').addEventListener('click', (e) => {
        const t = e.target.closest('.tile');
        if (!t) return;
        closeModal();
        onPick(t.dataset.name);
      });
    });
  }

  function pickWeapon() {
    const c = data.charByName[state.character];
    const list = data.weapons.filter((w) => !c || w.type === c.weaponType).sort((a, b) => b.rarity - a.rarity || b.baseAtk - a.baseAtk);
    openModal(`Chọn vũ khí · ${c ? c.weaponType : ''}`, `
      ${filterBar([{ key: 'rarity', values: ['5', '4', '3', '2', '1'], label: (v) => v + '★' }])}
      <div class="count muted small"></div>
      <div class="grid tiles" id="pickGrid">${list.map((w) => `
        <button class="tile r${w.rarity}" data-name="${esc(w.name)}" data-search="${esc(w.name)}" data-rarity="${w.rarity}">
          <div class="tile-img">${img(w.icon, w.name)}</div>
          <div class="tile-name">${esc(w.name)}</div>
          <div class="tile-sub">ATK ${Math.round(w.baseAtk)}${Object.entries(w.main).map(([k, v]) => ` · ${esc(shortName(k))} ${GI.fmt(k, v)}`).join('')}</div>
        </button>`).join('')}</div>`, (root) => {
      bindFilters(root, '#pickGrid');
      root.querySelector('#pickGrid').addEventListener('click', (e) => {
        const t = e.target.closest('.tile');
        if (!t) return;
        closeModal();
        if (state.weapon !== t.dataset.name) state.refine = 1;
        state.weapon = t.dataset.name;
        commit(renderWeaponPanel, renderComputed);
      });
    });
  }

  function setTile(s) {
    return `
      <button class="tile set-tile" data-name="${esc(s.name)}" data-search="${esc(s.name)}">
        <div class="tile-img">${img(s.pieces.find(Boolean), s.name)}</div>
        <div class="tile-name">${esc(s.name)}</div>
        <div class="tile-sub">${esc(setBonusText(s.name))}</div>
      </button>`;
  }

  function pickSetForAll() {
    openModal('Đặt bộ cho cả 5 món', `
      ${filterBar([])}
      <div class="grid tiles" id="pickGrid">${data.sets.map(setTile).join('')}</div>`, (root) => {
      bindFilters(root, '#pickGrid');
      root.querySelector('#pickGrid').addEventListener('click', (e) => {
        const t = e.target.closest('.tile');
        if (!t) return;
        closeModal();
        state.artifacts.forEach((a) => { a.set = t.dataset.name; });
        commit(renderArtifacts, renderComputed);
      });
    });
  }

  function setBonusText(name) {
    const parts = GI.SET_BONUS.filter(([, , names]) => names.includes(name))
      .map(([stat, v]) => `2 món: ${stat} +${GI.isFlat(stat) ? v : (v * 100).toFixed(0) + '%'}`);
    return parts.join(' · ') || '2 món: (chưa có trong công thức)';
  }

  // ======================================================================
  // DATABASE VIEWS
  // ======================================================================
  function renderCharacters() {
    const root = $('#view-characters');
    root.innerHTML = `
      <div class="db-head"><h2>Nhân Vật</h2><span class="muted">Nguồn: Nhân_Vật_Database</span></div>
      ${filterBar([
        { key: 'element', values: GI.ELEMENTS },
        { key: 'weapon', values: uniq(data.characters.map((c) => c.weaponType)) },
        { key: 'nation', values: uniq(data.characters.map((c) => c.nation)) },
        { key: 'rarity', values: ['5', '4'], label: (v) => v + '★' },
      ])}
      <div class="count muted small"></div>
      <div class="grid tiles big" id="dbGrid">${data.characters.map((c) => charTile(c)).join('')}</div>`;
    bindFilters(root, '#dbGrid');
    $('#dbGrid', root).onclick = (e) => {
      const t = e.target.closest('.tile');
      if (t) showCharacter(t.dataset.name);
    };
  }

  function showCharacter(name) {
    const c = data.charByName[name];
    const asc = Object.entries(c.asc).filter(([, v]) => v);
    openModal(c.name, `
      <div class="detail" style="--ec:${ELEMENT_COLORS[c.element] || '#ccc'}">
        <div class="detail-img">${img(c.splash || c.icon, c.name)}</div>
        <div class="detail-info">
          <div class="stars">${stars(c.rarity)}</div>
          <div class="chips">${elemChip(c.element)}<span class="chip">${esc(c.weaponType)}</span><span class="chip">${esc(c.nation)}</span><span class="chip">${esc(c.power)}</span></div>
          <table class="kv">
            <tr><td>HP căn bản</td><td>${Math.round(c.base.hp).toLocaleString('vi-VN')}</td></tr>
            <tr><td>Tấn Công căn bản</td><td>${Math.round(c.base.atk)}</td></tr>
            <tr><td>Phòng Ngự căn bản</td><td>${Math.round(c.base.def)}</td></tr>
            <tr><td>Tinh Thông căn bản</td><td>${Math.round(c.base.em)}</td></tr>
            ${asc.map(([k, v]) => `<tr><td>Đột phá: ${esc(k)}</td><td>${GI.fmt(k, v)}</td></tr>`).join('')}
          </table>
          <button class="btn" data-use-char="${esc(c.name)}">Dùng trong Showcase →</button>
        </div>
      </div>
      <div class="rec detail-rec">
        <h3 class="section-title">✦ Gợi ý build &amp; đội hình</h3>
        <div id="detailRec">${recHtml(GI.getRecommendation(data, c.name), c, false)}</div>
      </div>`, (root) => {
      root.querySelector('#detailRec').onclick = (e) => {
        const b = e.target.closest('[data-rec-build]');
        if (!b) return;
        recBuildSel[c.name] = +b.dataset.recBuild;
        root.querySelector('#detailRec').innerHTML = recHtml(GI.getRecommendation(data, c.name), c, false);
      };
      root.querySelector('[data-use-char]').onclick = () => { closeModal(); selectCharacter(c.name); setView('builder'); };
    });
  }

  function renderWeapons() {
    const root = $('#view-weapons');
    const list = [...data.weapons].sort((a, b) => b.rarity - a.rarity || a.type.localeCompare(b.type));
    root.innerHTML = `
      <div class="db-head"><h2>Vũ Khí</h2><span class="muted">Nguồn: Vũ_Khí_Database</span></div>
      ${filterBar([
        { key: 'type', values: uniq(data.weapons.map((w) => w.type)) },
        { key: 'rarity', values: ['5', '4', '3', '2', '1'], label: (v) => v + '★' },
      ])}
      <div class="count muted small"></div>
      <div class="table-wrap">
      <table class="db-table">
        <thead><tr><th></th><th>Tên</th><th>Loại</th><th>★</th><th>ATK</th><th>Dòng chính</th><th>Nội tại (R1 → R5)</th></tr></thead>
        <tbody id="dbGrid">${list.map((w) => `
          <tr data-search="${esc(w.name)}" data-type="${esc(w.type)}" data-rarity="${w.rarity}" data-name="${esc(w.name)}">
            <td class="ti r${w.rarity}">${img(w.icon, w.name)}</td>
            <td><b>${esc(w.name)}</b></td>
            <td>${esc(w.type)}</td>
            <td class="stars small">${stars(w.rarity)}</td>
            <td>${Math.round(w.baseAtk)}</td>
            <td>${Object.entries(w.main).map(([k, v]) => `${esc(shortName(k))} ${GI.fmt(k, v)}`).join('<br>') || '—'}</td>
            <td class="small">${GI.SPECIAL_WEAPONS.has(w.name) ? '<span class="chip gold">Đặc biệt (theo đội hình)</span>' : ''}
              ${Object.entries(w.passive).map(([k, arr]) => `${esc(shortName(k))}: ${arr.map((v) => GI.fmt(k, v)).join(' / ')}`).join('<br>') || (GI.SPECIAL_WEAPONS.has(w.name) ? '' : '—')}</td>
          </tr>`).join('')}</tbody>
      </table></div>`;
    bindFilters(root, '#dbGrid');
  }

  function renderSets() {
    const root = $('#view-sets');
    const statRows = Object.values(data.statInfo);
    root.innerHTML = `
      <div class="db-head"><h2>Thánh Di Vật</h2><span class="muted">Nguồn: Thánh_Di_Vật_Database</span></div>
      ${filterBar([])}
      <div class="count muted small"></div>
      <div class="grid sets" id="dbGrid">${data.sets.map((s) => `
        <div class="set-card" data-search="${esc(s.name)}">
          <div class="set-name">${esc(s.name)}</div>
          <div class="set-pieces">${s.pieces.map((p, i) => (p ? `<span title="${GI.SLOTS[i]}">${img(p, GI.SLOTS[i])}</span>` : '')).join('') || '<span class="muted small">Không có ảnh</span>'}</div>
          <div class="small muted">${esc(setBonusText(s.name))}</div>
        </div>`).join('')}</div>
      <h3 class="section-title">Bảng chỉ số dòng chính &amp; giá trị dòng phụ hợp lệ</h3>
      <div class="table-wrap"><table class="db-table">
        <thead><tr><th></th><th>Chỉ số</th><th>Dòng chính (max)</th><th>Số giá trị dòng phụ</th><th>Dòng phụ: min → max</th></tr></thead>
        <tbody>${statRows.map((s) => `
          <tr><td class="ti">${img(s.icon, s.name)}</td><td>${esc(s.name)}</td><td>${s.main ? GI.fmt(s.name, s.main) : '—'}</td>
          <td>${s.rolls.length || '—'}</td>
          <td>${s.rolls.length ? `${GI.isFlat(s.name) ? s.rolls[0] : (s.rolls[0] * 100).toFixed(2) + '%'} → ${GI.isFlat(s.name) ? s.rolls[s.rolls.length - 1] : (s.rolls[s.rolls.length - 1] * 100).toFixed(2) + '%'}` : '—'}</td></tr>`).join('')}
        </tbody></table></div>`;
    bindFilters(root, '#dbGrid');
  }

  // ======================================================================
  // BUILDS
  // ======================================================================
  function getBuilds() { return readJSON(BUILDS_KEY, []); }
  function setBuilds(b) { writeJSON(BUILDS_KEY, b); }

  function saveBuildPrompt() {
    const name = prompt('Tên build (lưu cả đội):', teamNames().filter(Boolean).join(' · '));
    if (!name) return;
    const builds = getBuilds();
    const idx = builds.findIndex((b) => b.name === name);
    const entry = { name, savedAt: new Date().toISOString(), build: JSON.parse(JSON.stringify(team)) };
    if (idx >= 0) {
      if (!confirm(`Ghi đè build "${name}"?`)) return;
      builds[idx] = entry;
    } else builds.unshift(entry);
    setBuilds(builds);
    toast('Đã lưu build "' + name + '"', 'ok');
  }

  function renderBuilds() {
    const root = $('#view-builds');
    const builds = getBuilds();
    root.innerHTML = `
      <div class="db-head">
        <h2>Build đã lưu</h2>
        <div class="row-gap">
          <button class="btn btn-ghost" data-b="export-all" ${builds.length ? '' : 'disabled'}>Xuất tất cả</button>
          <label class="btn btn-ghost">Nhập JSON<input type="file" accept="application/json,.json" hidden data-b="import"></label>
        </div>
      </div>
      ${builds.length ? `<div class="grid builds">${builds.map((b, i) => {
        const t = normalizeState(JSON.parse(JSON.stringify(b.build)));
        const m = t.members[t.active];
        const r = m.character ? GI.calculate(data, calcState(m, t)) : null;
        const c = r && r.character;
        const mates = t.members.filter((x) => x !== m && x.character);
        return `
          <div class="build-card" style="--ec:${c ? ELEMENT_COLORS[c.element] : '#888'}">
            <div class="build-top">
              ${c ? img(c.icon, c.name, 'build-avatar') : ''}
              <div>
                <div class="build-name">${esc(b.name)}</div>
                <div class="muted small">${esc(m.character)} · C${m.constellation || 0} · ${esc(m.weapon || '—')} R${m.refine || 1}</div>
                ${mates.length ? `<div class="build-mates">${mates.map((x) => { const mc = data.charByName[x.character]; return mc ? img(mc.icon, mc.name) : ''; }).join('')}</div>` : ''}
              </div>
            </div>
            ${r ? `<div class="build-stats">
              <span>HP <b>${GI.fmt('HP', r.totals['HP'])}</b></span>
              <span>ATK <b>${GI.fmt('Tấn Công', r.totals['Tấn Công'])}</b></span>
              <span>DEF <b>${GI.fmt('Phòng Ngự', r.totals['Phòng Ngự'])}</b></span>
              <span>TT <b>${GI.fmt('Tinh Thông Nguyên Tố', r.totals['Tinh Thông Nguyên Tố'])}</b></span>
              <span>Bạo <b>${GI.fmt('Tỷ Lệ Bạo Kích', r.totals['Tỷ Lệ Bạo Kích'])} / ${GI.fmt('Sát Thương Bạo Kích', r.totals['Sát Thương Bạo Kích'])}</b></span>
              <span>Nạp <b>${GI.fmt('Hiệu Quả Nạp Nguyên Tố', r.totals['Hiệu Quả Nạp Nguyên Tố'])}</b></span>
            </div>` : '<div class="muted small">Nhân vật không còn trong database</div>'}
            <div class="muted tiny">Lưu lúc ${new Date(b.savedAt).toLocaleString('vi-VN')}</div>
            <div class="row-gap">
              <button class="btn btn-sm" data-b="load" data-i="${i}">Mở</button>
              <button class="btn btn-sm btn-ghost" data-b="export" data-i="${i}">Xuất</button>
              <button class="btn btn-sm btn-danger" data-b="delete" data-i="${i}">Xoá</button>
            </div>
          </div>`;
      }).join('')}</div>` : '<div class="empty">Chưa có build nào. Vào tab <b>Showcase</b> và bấm “Lưu build”.</div>'}`;

    root.onclick = (e) => {
      const b = e.target.closest('[data-b]');
      if (!b) return;
      const list = getBuilds();
      const i = +b.dataset.i;
      if (b.dataset.b === 'load') {
        team = normalizeState(JSON.parse(JSON.stringify(list[i].build)));
        setActive(team.active);
        saveState();
        setView('builder');
        toast('Đã mở build "' + list[i].name + '"');
      } else if (b.dataset.b === 'delete') {
        if (!confirm(`Xoá build "${list[i].name}"?`)) return;
        list.splice(i, 1);
        setBuilds(list);
        renderBuilds();
      } else if (b.dataset.b === 'export') {
        exportJSON({ type: 'gi-akasha-build', name: list[i].name, build: list[i].build }, `build-${list[i].name}.json`);
      } else if (b.dataset.b === 'export-all') {
        exportJSON({ type: 'gi-akasha-builds', builds: list }, 'gi-akasha-builds.json');
      }
    };
    root.onchange = (e) => {
      if (e.target.dataset.b !== 'import' || !e.target.files[0]) return;
      e.target.files[0].text().then((txt) => {
        const j = JSON.parse(txt);
        const list = getBuilds();
        let added = 0;
        if (j.type === 'gi-akasha-builds') j.builds.forEach((b) => { list.push(b); added++; });
        else if (j.build) { list.unshift({ name: j.name || `${(j.build.members ? j.build.members.map((x) => x.character).filter(Boolean).join(' · ') : j.build.character)} (nhập)`, savedAt: new Date().toISOString(), build: j.build }); added++; }
        else throw new Error('Sai định dạng');
        setBuilds(list);
        renderBuilds();
        toast(`Đã nhập ${added} build`, 'ok');
      }).catch((err) => toast('Không đọc được file: ' + err.message, 'err'));
    };
  }

  function exportJSON(obj, filename) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename.replace(/[\\/:*?"<>|]/g, '_');
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ---------- khởi động ----------
  async function sync() {
    const btn = $('#syncBtn');
    btn.disabled = true;
    btn.textContent = '⟳ Đang tải…';
    try {
      data = await GI.syncFromSheet();
      team = normalizeState(team);
      setActive(team.active);
      renderDataInfo();
      render();
      toast('Đã đồng bộ dữ liệu từ Google Sheet', 'ok');
    } catch (err) {
      toast('Đồng bộ thất bại: ' + err.message, 'err');
    } finally {
      btn.disabled = false;
      btn.textContent = '⟳ Đồng bộ Sheet';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('#tabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setView(b.dataset.view); });
    $('#syncBtn').addEventListener('click', sync);
    $('#modal').addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });
    const b = $('#view-builder');
    b.addEventListener('click', onBuilderEvent);
    b.addEventListener('change', onBuilderEvent);
    b.addEventListener('input', (e) => { if (e.target.dataset.subVal != null) onBuilderEvent(e); });
    team = loadState();
    state = team.members[team.active];
    renderDataInfo();
    render();
  });
})(window.GI);
