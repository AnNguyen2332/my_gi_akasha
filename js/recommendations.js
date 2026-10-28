// Gợi ý build & đội hình cho từng nhân vật.
// Dữ liệu chính: data/recommendations-data.js (đồng bộ từ genshin-builds.com bằng scripts/sync-recommendations.mjs).
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
    mitya: {
      name: 'Mitya', note: 'Theo guide trước phát hành (Game8, Icy Veins)',
      builds: [{ name: 'Stellar-Conduct', role: 'DPS / Sub-DPS', sets: [['disenchantment_in_deep_shadow'], ['gilded_dreams'], ['wanderers_troupe', 'gilded_dreams']],
        stats: { sands: ['Elemental Mastery'], goblet: ['Elemental Mastery'], circlet: ['CRIT Rate', 'CRIT DMG'] } }],
      teams: [{ name: 'Stellar-Conduct', tier: '', chars: ['mitya', 'odette', 'yae_miko', 'valeriy'] },
        { name: 'Stellar-Conduct on-field', tier: '', chars: ['mitya', 'odette', 'valeriy', 'sucrose'] }],
    },
    valeriy: {
      name: 'Valeriy', guess: true,
      builds: [{ name: 'Stellar Sub-DPS', role: 'Sub-DPS', sets: [['heart_of_the_furnace'], ['noblesse_oblige'], ['18atk_set', 'a_day_carved_from_rising_winds']],
        stats: { sands: ['ATK%', 'Energy Recharge'], goblet: ['Electro DMG Bonus', 'ATK%'], circlet: ['CRIT Rate', 'CRIT DMG'] } }],
      teams: [{ name: 'Stellar-Conduct', tier: '', chars: ['valeriy', 'mitya', 'odette', 'yae_miko'] }],
    },
    danica: {
      name: 'Danica', guess: true,
      builds: [{ name: 'Stellar-Conduct DPS', role: 'DPS', sets: [['disenchantment_in_deep_shadow'], ['gilded_dreams'], ['18atk_set', 'a_day_carved_from_rising_winds']],
        stats: { sands: ['ATK%', 'Elemental Mastery'], goblet: ['Electro DMG Bonus', 'ATK%'], circlet: ['CRIT Rate', 'CRIT DMG'] } }],
      teams: [{ name: 'Stellar-Conduct', tier: '', chars: ['danica', 'tsaritsa', 'odette', 'yae_miko'] },
        { name: 'Stellar-Conduct', tier: '', chars: ['danica', 'mitya', 'odette', 'alyosha'] }],
    },
    tsaritsa: {
      name: 'Tsaritsa', guess: true, note: 'Theo leak 7.3 — chưa chính thức',
      builds: [{ name: 'Stellar DPS', role: 'Main / Sub-DPS', sets: [['disenchantment_in_deep_shadow'], ['scarlet_proof'], ['18atk_set', 'a_day_carved_from_rising_winds']],
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
    for (const [id, c] of Object.entries(ALL)) { byNorm[norm(id)] = id; byNorm[norm(c.name)] = id; }
    for (const c of data.characters) {
      const id = ALIASES[c.name] || byNorm[norm(c.name)];
      if (id) { idToName[id] = c.name; nameToId[c.name] = id; }
    }
  }

  function mapSetOption(ids, data) {
    const seen = new Set();
    const items = ids.map((id) => {
      const g = GENERIC[id];
      const name = SETS[g ? g[0] : id];
      return name && data.setByName[name] ? { name, generic: g ? g[1] : '' } : null;
    }).filter((it) => it && !seen.has(it.generic || it.name) && seen.add(it.generic || it.name));
    if (!items.length) return null;
    // 1 bộ = 4 món · 2 bộ = 2+2 · từ 3 bộ = 2 món + 2 món chọn trong danh sách (áp dụng 2 bộ đầu)
    const four = ids.length === 1;
    const apply = four ? [items[0].name] : [items[0].name, (items[1] || items[0]).name];
    return { sets: apply, items, four, pick: !four && items.length > 2 };
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
      sets: b.sets.map((ids) => mapSetOption(ids, data)).filter(Boolean),
      mainStats: ['sands', 'goblet', 'circlet'].map((k) => (b.stats[k] || []).map(mapStat)),
    })).filter((b) => b.sets.length || b.mainStats.some((s) => s.length));

    let teams;
    if (raw.teamNames) teams = raw.teamNames.map((t) => ({ name: '', tier: '', members: t, missing: 0 }));
    else {
      teams = (raw.teams || []).map((t) => {
        const others = t.chars.filter((x) => x !== id);
        const members = others.map((x) => idToName[x]).filter((n) => n && n !== name);
        return { name: t.name, tier: t.tier, members, missing: others.length - members.length };
      }).filter((t) => t.members.length)
        // đội có đủ thành viên trong database lên trước
        .sort((a, b) => a.missing - b.missing);
    }

    return {
      builds, teams,
      guess: !!raw.guess, auto: !!raw.auto, note: raw.note || '',
      source: raw.auto ? 'Tự động' : (SOURCE.characters[id] ? `${SOURCE.source || 'genshin-builds.com'} · v${SOURCE.version}` : 'Bổ sung thủ công'),
    };
  };

  GI.REC_META = { source: SOURCE.source, version: SOURCE.version, fetchedAt: SOURCE.fetchedAt };
})(window.GI);
