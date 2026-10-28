// Gợi ý build & đội hình cho từng nhân vật.
// Dữ liệu chính: data/recommendations-data.js (đồng bộ từ Game8, dự phòng genshin-builds.com, bằng scripts/sync-recommendations.mjs).
// File này chỉ đổi tên tiếng Anh -> tên trong database và bổ sung nhân vật mà nguồn chưa có.
window.GI = window.GI || {};

(function (GI) {
  // id bộ thánh di vật (genshin-builds) -> tên trong Thánh_Di_Vật_Database
  const SETS = {
    gladiators_finale: 'Lễ Bế Mạc Của Giác Đấu Sĩ',
    wanderers_troupe: 'Đoàn Hát Lang Thang Đại Lục',
    blizzard_strayer: 'Dũng Sĩ Trong Băng Giá',
    heart_of_depth: 'Trái Tim Trầm Luân',
    viridescent_venerer: 'Bóng Hình Màu Xanh',
    thundering_fury: 'Như Sấm Thịnh Nộ',
    crimson_witch_of_flames: 'Diệm Liệt Ma Nữ Cháy Rực',
    noblesse_oblige: 'Nghi Thức Tông Thất Cổ',
    bloodstained_chivalry: 'Kỵ Sĩ Đạo Nhuốm Máu',
    archaic_petra: 'Phiến Đá Lâu Đời',
    retracing_bolide: 'Sao Băng Bay Ngược',
    tenacity_of_the_millelith: 'Thiên Nham Vững Chắc',
    pale_flame: 'Lửa Trắng Xám',
    shimenawas_reminiscence: 'Dòng Hồi Ức Bất Tận',
    emblem_of_severed_fate: 'Dấu Ấn Ngăn Cách',
    husk_of_opulent_dreams: 'Giấc Mộng Phù Hoa',
    oceanhued_clam: 'Xà Cừ Đại Dương',
    vermillion_hereafter: 'Thần Sa Vãng Sinh Lục',
    echoes_of_an_offering: 'Dư Âm Tế Lễ',
    deepwood_memories: 'Ký Ức Rừng Sâu',
    gilded_dreams: 'Giấc Mộng Hoàng Kim',
    desert_pavilion_chronicle: 'Sử Ký Đình Đài Cát',
    flower_of_paradise_lost: 'Đóa Hoa Trang Viên Thất Lạc',
    nymphs_dream: 'Giấc Mộng Thủy Tiên',
    vourukashas_glow: 'Vầng Sáng Vourukasha',
    marechaussee_hunter: 'Thợ Săn Marechaussee',
    golden_troupe: 'Đoàn Kịch Hoàng Kim',
    song_of_days_past: 'Khúc Ca Ngày Cũ',
    nighttime_whispers_in_the_echoing_woods: 'Tiếng Đêm Trong Rừng Vang',
    fragment_of_harmonic_whimsy: 'Mảnh Hài Hòa Bất Thường',
    unfinished_reverie: 'Ảo Mộng Chưa Hoàn Thành',
    scroll_of_the_hero_of_cinder_city: 'Bức Tranh Dũng Sĩ Thành Tro Tàn',
    obsidian_codex: 'Bí Điển Obsidian',
    long_nights_oath: 'Lời Thề Đêm Dài',
    finale_of_the_deep_galleries: 'Đoạn Kết Hành Lang Sâu',
    night_of_the_skys_unveiling: 'Đêm Trời Hé Lộ',
    silken_moons_serenade: 'Khúc Ca Trăng Lụa',
    aubade_of_morningstar_and_moon: 'Khúc Ca Của Trăng Và Sao Mai',
    a_day_carved_from_rising_winds: 'Ngày Nổi Gió',
    celestial_gift: 'Phước Lành Trời Cao',
    disenchantment_in_deep_shadow: 'Ảo Tưởng Vụn Vỡ Trong Bóng Tối',
    scarlet_proof: 'Bằng Chứng Máu Đỏ',
    heart_of_the_furnace: 'Trái Tim Lửa Nung',
    maiden_beloved: 'Thiếu Nữ Đáng Yêu',
    instructor: 'Giáo Quan',
    the_exile: 'Kẻ Lưu Đày',
    defenders_will: 'Trái Tim Thủ Hộ',
    martial_artist: 'Võ Nhân',
    gambler: 'Con Bạc',
    berserker: 'Cuồng Chiến',
    thundersoother: 'Tôn Giả Trầm Lặng',
    lavawalker: 'Hiền Nhân Bốc Lửa',
  };

  // Bộ "2 món bất kỳ có chỉ số X" -> bộ đại diện để áp dụng + nhãn hiển thị
  const GENERIC = {
    '18atk_set': ['gladiators_finale', 'Bộ +18% Tấn Công'],
    '80elementalmastery_set': ['wanderers_troupe', 'Bộ +80 Tinh Thông'],
    '20hp_set': ['tenacity_of_the_millelith', 'Bộ +20% HP'],
    '20energyrecharge_set': ['emblem_of_severed_fate', 'Bộ +20% Nạp NT'],
    '15hydrodmg_set': ['heart_of_depth', 'Bộ +15% ST Thủy'],
    '15_cryo_dmg_set': ['blizzard_strayer', 'Bộ +15% ST Băng'],
    '15anemodmg_set': ['viridescent_venerer', 'Bộ +15% ST Phong'],
    'and_15_anemo_dmg_set': ['viridescent_venerer', 'Bộ +15% ST Phong'],
    '25physicaldmg_set': ['bloodstained_chivalry', 'Bộ +25% ST Vật Lý'],
    'and5_physical_dmg_set': ['bloodstained_chivalry', 'Bộ +25% ST Vật Lý'],
    '15healingbonus_set': ['oceanhued_clam', 'Bộ +15% Trị Liệu'],
    '30_def_set': ['husk_of_opulent_dreams', 'Bộ +30% Phòng Ngự'],
  };

  const ELEM_EN = { Pyro: 'Hỏa', Cryo: 'Băng', Electro: 'Lôi', Hydro: 'Thủy', Anemo: 'Phong', Geo: 'Nham', Dendro: 'Thảo' };
  const STATS = {
    'ATK%': '%Tấn Công', 'HP%': '%HP', 'DEF%': '%Phòng Ngự', 'Elemental Mastery': 'Tinh Thông Nguyên Tố',
    'Energy Recharge': 'Hiệu Quả Nạp Nguyên Tố', 'CRIT Rate': 'Tỷ Lệ Bạo Kích', 'CRIT DMG': 'Sát Thương Bạo Kích',
    'Healing Bonus': 'Hiệu Quả Trị Liệu', 'Physical DMG Bonus': 'ST Vật Lý',
  };
  const mapStat = (s) => {
    if (STATS[s]) return STATS[s];
    const m = /^(\w+) DMG( Bonus)?$/.exec(s);
    return m && ELEM_EN[m[1]] ? 'ST Nguyên Tố ' + ELEM_EN[m[1]] : s;
  };

  // Nhân vật nguồn chưa có trang (bản mới / chưa ra mắt). guess = dự đoán theo bộ kỹ năng.
  const MANUAL = {
    danica: {
      name: 'Danica', guess: true,
      builds: [{ name: 'Stellar-Conduct DPS', role: 'DPS', sets: [['disenchantment_in_deep_shadow'], ['gilded_dreams'], ['18atk_set', 'a_day_carved_from_rising_winds']],
        weapons: ['Trấn Danica', 'verdict', 'redhorn_stonethresher', 'serpent_spine', 'tidal_shadow'],
        weaponNotes: { 'Trấn Danica': 'Dự đoán: vũ khí riêng (Trọng Kiếm 5★ mới)' },
        stats: { sands: ['ATK%', 'Elemental Mastery'], goblet: ['Electro DMG Bonus', 'ATK%'], circlet: ['CRIT Rate', 'CRIT DMG'] } }],
      teams: [{ name: 'Stellar-Conduct', tier: '', chars: ['danica', 'tsaritsa', 'odette', 'yae_miko'] },
        { name: 'Stellar-Conduct', tier: '', chars: ['danica', 'mitya', 'odette', 'alyosha'] }],
    },
    tsaritsa: {
      name: 'Tsaritsa', guess: true, note: 'Theo leak 7.3 — chưa chính thức',
      builds: [{ name: 'Stellar DPS', role: 'Main / Sub-DPS', sets: [['disenchantment_in_deep_shadow'], ['scarlet_proof'], ['18atk_set', 'a_day_carved_from_rising_winds']],
        weapons: ['Trấn Tsaritsa', 'aqua_simulacra', 'polar_star', 'thundering_pulse', 'the_first_great_magic', 'slingshot'],
        weaponNotes: { 'Trấn Tsaritsa': 'Dự đoán: vũ khí riêng (Cung 5★ mới)' },
        stats: { sands: ['ATK%'], goblet: ['Cryo DMG Bonus', 'ATK%'], circlet: ['CRIT Rate', 'CRIT DMG'] } }],
      teams: [{ name: 'Stellar-Conduct', tier: '', chars: ['tsaritsa', 'danica', 'odette', 'yae_miko'] },
        { name: 'Stellar-Conduct', tier: '', chars: ['tsaritsa', 'odette', 'danica', 'mitya'] }],
    },
  };

  const ALIASES = { 'Kẻ Lang Thang': 'wanderer' };
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

  const SOURCE = window.GI_REC_DATA || { characters: {} };
  const ALL = Object.assign({}, MANUAL, SOURCE.characters);

  // Bảng id nguồn <-> tên trong database (tính 1 lần cho mỗi bộ dữ liệu)
  let cacheFor = null, idToName = {}, nameToId = {};
  function index(data) {
    if (cacheFor === data) return;
    cacheFor = data;
    idToName = {}; nameToId = {};
    const byNorm = {};
    for (const [id, c] of Object.entries(ALL)) {
      byNorm[norm(id)] = id;
      if (c.fullName) byNorm[norm(c.fullName)] = id;
      if (!byNorm[norm(c.name)]) byNorm[norm(c.name)] = id;
    }
    for (const c of data.characters) {
      const id = ALIASES[c.name] || byNorm[norm(c.name)];
      if (id) { idToName[id] = c.name; nameToId[c.name] = id; }
    }
  }

  // id bộ -> tên trong database (chấp nhận khác biệt nhỏ giữa các nguồn, vd. ..._shadows / ..._shadow)
  const SET_NORM = Object.fromEntries(Object.keys(SETS).map((k) => [norm(k).replace(/s$/, ''), k]));
  const setKey = (id) => (SETS[id] ? id : SET_NORM[norm(id).replace(/s$/, '')] || id);

  // Nhãn xếp hạng của Game8 -> tiếng Việt
  const LABELS = [
    [/^best[- ]in[- ]slot/i, 'Tốt nhất'], [/^best for /i, 'Tốt nhất cho '], [/^best in general/i, 'Tốt nhất (đội thường)'], [/^best\b/i, 'Tốt nhất'],
    [/^alt(ernative|ernate|\.)? for /i, 'Thay thế cho '], [/^alt(ernative|ernate|\.)?(?=\s|$)/i, 'Thay thế'],
    [/^4-star/i, '4★'], [/\(on-field\)/i, '(trên sân)'], [/\(off-field\)/i, '(hậu trường)'],
    [/\(event\)/i, '(sự kiện)'], [/\(craftable\)|\(crafted\)/i, '(rèn)'],
  ];
  const label = (s) => LABELS.reduce((t, [re, v]) => t.replace(re, v), String(s || '')).trim();

  function mapSetOption(ids, data, note) {
    const seen = new Set();
    const items = ids.map((id) => {
      const g = GENERIC[id];
      const name = SETS[setKey(g ? g[0] : id)];
      return name && data.setByName[name] ? { name, generic: g ? g[1] : '' } : null;
    }).filter((it) => it && !seen.has(it.generic || it.name) && seen.add(it.generic || it.name));
    if (!items.length) return null;
    // 1 bộ = 4 món · 2 bộ = 2+2 · từ 3 bộ = 2 món + 2 món chọn trong danh sách (áp dụng 2 bộ đầu)
    const four = ids.length === 1;
    const apply = four ? [items[0].name] : [items[0].name, (items[1] || items[0]).name];
    return { sets: apply, items, four, pick: !four && items.length > 2, note: label(note) };
  }

  // id vũ khí (hoặc tên tiếng Việt, cho MANUAL) -> vũ khí trong Vũ_Khí_Database, đúng loại vũ khí của nhân vật
  function mapWeapons(b, c, data) {
    const names = SOURCE.weaponNames || {};
    const byNorm = {};
    for (const w of data.weapons) byNorm[norm(w.name)] = w.name;
    const out = [];
    for (const id of b.weapons || []) {
      const name = data.weaponByName[id] ? id : byNorm[norm(names[id])];
      const w = name && data.weaponByName[name];
      if (!w || w.type !== c.weaponType || out.some((x) => x.name === name)) continue;
      out.push({ name, note: label((b.weaponNotes || {})[id]) });
    }
    return out;
  }

  // Gợi ý vũ khí khi không có dữ liệu: vũ khí cùng loại, độ hiếm cao, ưu tiên dòng chính hợp chỉ số đột phá
  function fallbackWeapons(c, data) {
    return data.weapons.filter((w) => w.type === c.weaponType && w.rarity >= 4)
      .sort((a, b) => b.rarity - a.rarity || b.baseAtk - a.baseAtk).slice(0, 5).map((w) => w.name);
  }

  // Gợi ý tự động khi cả nguồn lẫn MANUAL đều chưa có nhân vật
  function fallback(c, data) {
    const asc = Object.entries(c.asc).filter(([, v]) => v).map(([k]) => k)[0] || '';
    const elemSet = { 'Hỏa': 'crimson_witch_of_flames', 'Băng': 'blizzard_strayer', 'Lôi': 'thundering_fury', 'Thủy': 'heart_of_depth',
      'Phong': 'viridescent_venerer', 'Nham': 'archaic_petra', 'Thảo': 'deepwood_memories' }[c.element];
    const crit = /Bạo|ST Nguyên Tố|Vật Lý/.test(asc);
    const em = /Tinh Thông/.test(asc);
    const build = crit
      ? { name: 'DPS', role: 'DPS', sets: [[elemSet], ['18atk_set', elemSet]], stats: { sands: ['ATK%'], goblet: [`${Object.keys(ELEM_EN).find((k) => ELEM_EN[k] === c.element)} DMG Bonus`], circlet: ['CRIT Rate', 'CRIT DMG'] } }
      : em
        ? { name: 'Reaction', role: 'Reaction / Support', sets: [['gilded_dreams'], ['80elementalmastery_set', 'gilded_dreams']], stats: { sands: ['Elemental Mastery'], goblet: ['Elemental Mastery'], circlet: ['Elemental Mastery'] } }
        : { name: 'Support', role: 'Support', sets: [['noblesse_oblige'], ['tenacity_of_the_millelith']], stats: { sands: ['Energy Recharge', 'HP%'], goblet: ['HP%'], circlet: ['HP%'] } };
    const sameNation = data.characters.filter((x) => x.name !== c.name && x.nation === c.nation).sort((a, b) => b.rarity - a.rarity).slice(0, 2);
    const teamNames = [...sameNation.map((x) => x.name), 'Bennett', 'Kaedehara Kazuha', 'Furina'].filter((n) => n !== c.name).slice(0, 3);
    build.weapons = fallbackWeapons(c, data);
    return { name: c.name, auto: true, builds: [build], teamNames: [teamNames] };
  }

  GI.getRecommendation = function (data, name) {
    const c = data.charByName[name];
    if (!c) return null;
    index(data);
    const id = nameToId[name];
    const raw = (id && ALL[id]) || fallback(c, data);

    const builds = raw.builds.map((b) => ({
      name: b.name,
      role: b.role,
      weapons: mapWeapons(b, c, data),
      sets: b.sets.map((ids) => mapSetOption(ids, data, (b.setNotes || {})[ids.join('+')])).filter(Boolean),
      mainStats: ['sands', 'goblet', 'circlet'].map((k) => (b.stats[k] || []).map(mapStat)),
    })).filter((b) => b.sets.length || b.mainStats.some((s) => s.length));

    let teams;
    if (raw.teamNames) teams = raw.teamNames.map((t) => ({ name: '', tier: '', members: t, missing: 0 }));
    else {
      teams = (raw.teams || []).map((t) => {
        const others = t.chars.filter((x) => x !== id);
        const members = others.map((x) => idToName[x]).filter((n) => n && n !== name);
        // Lựa chọn thay thế cho từng vị trí (Game8), chỉ giữ nhân vật có trong database
        const alts = [...new Set((t.alts || []).flat().map((x) => idToName[x]).filter((n) => n && n !== name && !members.includes(n)))];
        return { name: t.name, tier: t.tier, members, alts, missing: others.length - members.length };
      }).filter((t) => t.members.length)
        // đội có đủ thành viên trong database lên trước
        .sort((a, b) => a.missing - b.missing);
    }

    return {
      builds, teams,
      guess: !!raw.guess, auto: !!raw.auto, note: raw.note || '',
      source: raw.auto ? 'Tự động' : !SOURCE.characters[id] ? 'Bổ sung thủ công'
        : raw.source === 'g8' ? `Game8${raw.updated ? ' · cập nhật ' + fmtDate(raw.updated) : ''}`
          : `genshin-builds.com${raw.version ? ' · v' + raw.version : ''}`,
      url: raw.url || '',
    };
  };

  function fmtDate(s) {
    const d = new Date(String(s).replace(/\s+\d+:\d+\s*(AM|PM)?$/i, ''));
    return isNaN(d) ? s : d.toLocaleDateString('vi-VN');
  }

  GI.REC_META = { source: SOURCE.source, fetchedAt: SOURCE.fetchedAt };
})(window.GI);
