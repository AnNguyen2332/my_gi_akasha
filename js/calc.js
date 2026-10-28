// Tính chỉ số nhân vật — chuyển từ công thức LET trong sheet "Showcase" / "Thánh_Di_Vật".
window.GI = window.GI || {};

(function (GI) {
  const ELEMENTS = ['Hỏa', 'Băng', 'Lôi', 'Thủy', 'Phong', 'Nham', 'Thảo'];
  const SLOTS = ['Hoa Sự Sống', 'Lông Vũ Tử Vong', 'Cát Thời Gian', 'Ly Không Gian', 'Nón Lý Trí'];
  const SUB_STATS = ['HP', 'Tấn Công', 'Phòng Ngự', '%HP', '%Tấn Công', '%Phòng Ngự',
    'Tinh Thông Nguyên Tố', 'Tỷ Lệ Bạo Kích', 'Sát Thương Bạo Kích', 'Hiệu Quả Nạp Nguyên Tố'];
  const MAIN_STATS = [
    ['HP'],
    ['Tấn Công'],
    ['%HP', '%Tấn Công', '%Phòng Ngự', 'Tinh Thông Nguyên Tố', 'Hiệu Quả Nạp Nguyên Tố'],
    ['%HP', '%Tấn Công', '%Phòng Ngự', 'Tinh Thông Nguyên Tố',
      ...ELEMENTS.map((e) => 'ST Nguyên Tố ' + e), 'ST Vật Lý'],
    ['%HP', '%Tấn Công', '%Phòng Ngự', 'Tinh Thông Nguyên Tố',
      'Tỷ Lệ Bạo Kích', 'Sát Thương Bạo Kích', 'Hiệu Quả Trị Liệu'],
  ];
  const FLAT_STATS = new Set(['HP', 'Tấn Công', 'Phòng Ngự', 'Tinh Thông Nguyên Tố']);

  // Hiệu ứng 2 món (giống bảng 'Thánh_Di_Vật'!A25:D64). Có 2 bộ 2 món cùng loại thì cộng 2 lần.
  const SET_BONUS = [
    ['%HP', 0.2, ['Thiên Nham Vững Chắc', 'Vầng Sáng Vourukasha']],
    ['%Tấn Công', 0.18, ['Lễ Bế Mạc Của Giác Đấu Sĩ', 'Dòng Hồi Ức Bất Tận', 'Thần Sa Vãng Sinh Lục', 'Dư Âm Tế Lễ',
      'Tiếng Đêm Trong Rừng Vang', 'Mảnh Hài Hòa Bất Thường', 'Ảo Mộng Chưa Hoàn Thành', 'Ngày Nổi Gió',
      'Ảo Tưởng Vụn Vỡ Trong Bóng Tối', 'Bằng Chứng Máu Đỏ', 'Trái Tim Lửa Nung']],
    ['%Phòng Ngự', 0.3, ['Trái Tim Thủ Hộ', 'Giấc Mộng Phù Hoa']],
    ['Tinh Thông Nguyên Tố', 80, ['Đoàn Hát Lang Thang Đại Lục', 'Giấc Mộng Hoàng Kim', 'Đóa Hoa Trang Viên Thất Lạc',
      'Đêm Trời Hé Lộ', 'Khúc Ca Của Trăng Và Sao Mai']],
    ['Hiệu Quả Nạp Nguyên Tố', 0.2, ['Dấu Ấn Ngăn Cách', 'Khúc Ca Trăng Lụa', 'Phước Lành Trời Cao']],
    ['Hiệu Quả Trị Liệu', 0.15, ['Xà Cừ Đại Dương', 'Khúc Ca Ngày Cũ']],
    ['Tăng ST Gây Ra', 0.15, ['Bí Điển Obsidian']],
    ['ST Nguyên Tố Hỏa', 0.15, ['Diệm Liệt Ma Nữ Cháy Rực']],
    ['ST Nguyên Tố Băng', 0.15, ['Dũng Sĩ Trong Băng Giá', 'Đoạn Kết Hành Lang Sâu']],
    ['ST Nguyên Tố Lôi', 0.15, ['Như Sấm Thịnh Nộ']],
    ['ST Nguyên Tố Thủy', 0.15, ['Trái Tim Trầm Luân', 'Giấc Mộng Thủy Tiên']],
    ['ST Nguyên Tố Phong', 0.15, ['Bóng Hình Màu Xanh', 'Sử Ký Đình Đài Cát']],
    ['ST Nguyên Tố Nham', 0.15, ['Phiến Đá Lâu Đời']],
    ['ST Nguyên Tố Thảo', 0.15, ['Ký Ức Rừng Sâu']],
    ['ST Vật Lý', 0.25, ['Kỵ Sĩ Đạo Nhuốm Máu', 'Lửa Trắng Xám']],
    ['Tăng STKN Nguyên Tố', 0.2, ['Đoàn Kịch Hoàng Kim']],
    ['Tăng STKN Nộ', 0.2, ['Nghi Thức Tông Thất Cổ']],
    ['Tăng ST Tấn Công Thường', 0.15, ['Thợ Săn Marechaussee']],
    ['Tăng ST Trọng Kích', 0.15, ['Thợ Săn Marechaussee']],
    ['Tăng ST Tấn Công Khi Đáp', 0.25, ['Lời Thề Đêm Dài']],
  ];

  // Vũ khí có nội tại phụ thuộc đội hình / chỉ số khác (nội tại trong DB bị bỏ qua, tính riêng bên dưới).
  const SPECIAL_WEAPONS = new Set(['Cõi Mộng Ngàn Đêm', 'Quyền Trượng Cát Đỏ', 'Trượng Hộ Ma', 'Bàn Nham Kết Lục',
    'Cung Huyền Lê', 'Phá Xích', 'Trái Tim Ngưng Tuyết', 'Khúc Ca Vịnh Hẹp', 'Thương Thiên Nham',
    'Thiên Nham Cổ Kiếm', 'Sao Đêm Rong Ruổi', 'Sắc Nước Makhaira', 'Ánh Trăng Xiphos']);

  // Thứ tự hiển thị chỉ số cuối cùng (giống Showcase!K5:S20)
  const FINAL_STATS = ['HP', 'Tấn Công', 'Phòng Ngự', 'Tinh Thông Nguyên Tố', 'Tỷ Lệ Bạo Kích', 'Sát Thương Bạo Kích',
    'Hiệu Quả Nạp Nguyên Tố', ...ELEMENTS.map((e) => 'ST Nguyên Tố ' + e), 'ST Vật Lý', 'Hiệu Quả Trị Liệu'];
  const EXTRA_STATS = ['Tăng ST Gây Ra', 'Tăng STKN Nguyên Tố', 'Tăng STKN Nộ', 'Tăng ST Tấn Công Thường',
    'Tăng ST Trọng Kích', 'Tăng ST Tấn Công Khi Đáp'];

  const isFlat = (stat) => FLAT_STATS.has(stat);

  function emptyArtifact(slot) {
    return { set: '', main: slot === 0 ? 'HP' : slot === 1 ? 'Tấn Công' : '', subs: [0, 1, 2, 3].map(() => ({ stat: '', value: 0 })) };
  }

  function calculate(data, st) {
    const c = data.charByName[st.character];
    if (!c) return null;
    const w = data.weaponByName[st.weapon] || null;
    const ri = Math.min(5, Math.max(1, parseInt(st.refine, 10) || 1)) - 1;
    const pick = (arr) => arr[ri];

    // Đội hình: nhân vật chính + 3 đồng đội
    const teamNames = [c.name, ...(st.team || [])].slice(0, 4);
    const teamObjs = teamNames.map((n) => (n ? data.charByName[n] || null : null));
    const filled = teamObjs.filter(Boolean);
    const teamEls = filled.map((t) => t.element);
    const isFullTeam = teamNames.filter(Boolean).length === 4;
    const countEl = (e) => teamEls.filter((x) => x === e).length;

    const contrib = {};
    const add = (stat, value, source) => {
      if (!value) return;
      (contrib[stat] = contrib[stat] || []).push({ source, value });
    };
    const sum = (stat) => (contrib[stat] || []).reduce((a, b) => a + b.value, 0);

    // Nhân vật (đột phá)
    for (const [k, v] of Object.entries(c.asc)) add(k, v, 'Đột phá');
    add('Tinh Thông Nguyên Tố', c.base.em, 'Căn bản');

    // Vũ khí: dòng chính + nội tại (theo tinh luyện)
    const special = w && SPECIAL_WEAPONS.has(w.name);
    if (w) {
      for (const [k, v] of Object.entries(w.main)) add(k, v, 'Vũ khí');
      if (!special) {
        for (const [k, arr] of Object.entries(w.passive)) {
          const v = arr[ri] != null ? arr[ri] : arr[0];
          if (k === 'ST Tất Cả Nguyên Tố') ELEMENTS.forEach((e) => add('ST Nguyên Tố ' + e, v, 'Nội tại vũ khí'));
          else add(k, v, 'Nội tại vũ khí');
        }
      }
    }

    // Thánh di vật: dòng chính + dòng phụ
    const setCount = {};
    (st.artifacts || []).forEach((a, i) => {
      if (!a) return;
      if (a.set) setCount[a.set] = (setCount[a.set] || 0) + 1;
      if (a.main && data.statInfo[a.main]) add(a.main, data.statInfo[a.main].main, 'Thánh di vật');
      (a.subs || []).forEach((s) => s.stat && add(s.stat, Number(s.value) || 0, 'Thánh di vật'));
    });
    const activeSets = Object.entries(setCount).filter(([, n]) => n >= 2).map(([name, n]) => ({ name, count: n }));
    for (const [stat, val, names] of SET_BONUS) {
      for (const s of activeSets) if (names.includes(s.name)) add(stat, val, `Bộ ${s.name} (2)`);
    }

    // Cộng hưởng nguyên tố (chỉ khi đủ 4 người)
    const resonances = isFullTeam ? ELEMENTS.filter((e) => countEl(e) >= 2) : [];
    if (resonances.includes('Hỏa')) add('%Tấn Công', 0.25, 'Cộng hưởng Hỏa');
    if (resonances.includes('Thủy')) add('%HP', 0.25, 'Cộng hưởng Thủy');
    if (resonances.includes('Thảo')) add('Tinh Thông Nguyên Tố', 50, 'Cộng hưởng Thảo');

    // ----- Nội tại đặc biệt -----
    const wn = w ? w.name : '';
    const same = Math.max(0, countEl(c.element) - 1);
    const diff = Math.max(0, filled.length - countEl(c.element));
    const src = 'Nội tại ' + wn;
    if (wn === 'Cõi Mộng Ngàn Đêm') {
      add('Tinh Thông Nguyên Tố', same * pick([32, 40, 48, 56, 64]), src);
      add('ST Nguyên Tố ' + c.element, diff * pick([0.1, 0.14, 0.18, 0.22, 0.26]), src);
    }
    if (wn === 'Cung Huyền Lê') {
      const s1 = Math.min(3, same), s2 = Math.min(3 - s1, diff);
      add('Tinh Thông Nguyên Tố', s1 * pick([40, 50, 60, 70, 80]), src);
      add('%Tấn Công', s2 * pick([0.12, 0.15, 0.18, 0.21, 0.24]), src);
    }
    if (wn === 'Phá Xích') {
      const n = filled.filter((t) => t.nation === 'Natlan' || t.element !== c.element).length;
      add('%Tấn Công', Math.min(3, n) * pick([0.048, 0.06, 0.072, 0.084, 0.096]), src);
      if (n >= 3) add('Tinh Thông Nguyên Tố', pick([24, 30, 36, 42, 48]), src);
    }
    if (wn === 'Trái Tim Ngưng Tuyết') {
      add('Tinh Thông Nguyên Tố', Math.min(4, countEl('Băng')) * pick([12, 15, 18, 21, 24]), src);
      add('%Tấn Công', Math.min(4, countEl('Lôi')) * pick([0.048, 0.06, 0.072, 0.084, 0.096]), src);
    }
    if (wn === 'Khúc Ca Vịnh Hẹp' && new Set(teamEls).size >= 3) {
      add('Tinh Thông Nguyên Tố', pick([120, 150, 180, 210, 240]), src);
    }
    if (wn === 'Trượng Hộ Ma' || wn === 'Bàn Nham Kết Lục') add('%HP', pick([0.2, 0.25, 0.3, 0.35, 0.4]), src);
    if (wn === 'Thương Thiên Nham' || wn === 'Thiên Nham Cổ Kiếm') {
      const n = Math.min(4, filled.filter((t) => t.nation === 'Liyue').length);
      add('%Tấn Công', n * pick([0.07, 0.08, 0.09, 0.1, 0.11]), src);
      add('Tỷ Lệ Bạo Kích', n * pick([0.03, 0.04, 0.05, 0.06, 0.07]), src);
    }

    // ----- Tổng hợp -----
    const em = sum('Tinh Thông Nguyên Tố');
    if (wn === 'Ánh Trăng Xiphos') add('Hiệu Quả Nạp Nguyên Tố', em * pick([0.00036, 0.00045, 0.00054, 0.00063, 0.00072]), src);

    const hpBase = c.base.hp;
    const hp = hpBase * (1 + sum('%HP')) + sum('HP');

    const atkBase = c.base.atk + (w ? w.baseAtk : 0);
    let atkExtra = 0;
    const atkAdd = (v) => { if (v) { add('Tấn Công (quy đổi)', v, src); atkExtra += v; } };
    if (wn === 'Quyền Trượng Cát Đỏ') atkAdd(em * pick([0.52, 0.65, 0.78, 0.91, 1.04]));
    if (wn === 'Sao Đêm Rong Ruổi' || wn === 'Sắc Nước Makhaira') atkAdd(em * pick([0.24, 0.3, 0.36, 0.42, 0.48]));
    if (wn === 'Trượng Hộ Ma') atkAdd(hp * pick([0.008, 0.01, 0.012, 0.014, 0.016]));
    if (wn === 'Bàn Nham Kết Lục') atkAdd(hp * pick([0.012, 0.015, 0.018, 0.021, 0.024]));
    const atk = atkBase * (1 + sum('%Tấn Công')) + sum('Tấn Công') + atkExtra;

    const defBase = c.base.def;
    const def = defBase * (1 + sum('%Phòng Ngự')) + sum('Phòng Ngự');

    const totals = {
      'HP': hp, 'Tấn Công': atk, 'Phòng Ngự': def, 'Tinh Thông Nguyên Tố': em,
      'Tỷ Lệ Bạo Kích': 0.05 + sum('Tỷ Lệ Bạo Kích'),
      'Sát Thương Bạo Kích': 0.5 + sum('Sát Thương Bạo Kích'),
      'Hiệu Quả Nạp Nguyên Tố': 1 + sum('Hiệu Quả Nạp Nguyên Tố'),
      'ST Vật Lý': sum('ST Vật Lý'),
      'Hiệu Quả Trị Liệu': sum('Hiệu Quả Trị Liệu'),
    };
    ELEMENTS.forEach((e) => { totals['ST Nguyên Tố ' + e] = sum('ST Nguyên Tố ' + e); });
    EXTRA_STATS.forEach((k) => { totals[k] = sum(k); });

    const bases = { 'HP': hpBase, 'Tấn Công': atkBase, 'Phòng Ngự': defBase };

    // Nguồn chi tiết cho từng chỉ số (tooltip)
    const breakdown = {
      'HP': [...(contrib['%HP'] || []).map((x) => ({ ...x, pct: true })), ...(contrib['HP'] || [])],
      'Tấn Công': [...(contrib['%Tấn Công'] || []).map((x) => ({ ...x, pct: true })), ...(contrib['Tấn Công'] || []), ...(contrib['Tấn Công (quy đổi)'] || [])],
      'Phòng Ngự': [...(contrib['%Phòng Ngự'] || []).map((x) => ({ ...x, pct: true })), ...(contrib['Phòng Ngự'] || [])],
    };
    for (const k of Object.keys(totals)) if (!breakdown[k]) breakdown[k] = contrib[k] || [];

    // Tổng chỉ số cộng thêm từ vũ khí + thánh di vật + bộ + cộng hưởng (giống Showcase hàng 23-24)
    const gear = {};
    for (const [k, list] of Object.entries(contrib)) {
      const v = list.filter((x) => x.source !== 'Đột phá' && x.source !== 'Căn bản').reduce((a, b) => a + b.value, 0);
      if (v > 0) gear[k] = v;
    }

    return { character: c, weapon: w, totals, bases, breakdown, activeSets, resonances, isFullTeam, gear, teamObjs };
  }

  // Định dạng số kiểu sheet
  function fmt(stat, v) {
    if (stat === 'HP' || stat === 'Tấn Công' || stat === 'Phòng Ngự') return Math.round(v).toLocaleString('vi-VN');
    if (isFlat(stat)) return Math.round(v).toLocaleString('vi-VN');
    return (v * 100).toFixed(1) + '%';
  }

  // Điểm chí mạng (CV) đơn giản: 2×TLBK + STBK từ dòng phụ + nón
  function critValue(artifacts) {
    let cv = 0;
    for (const a of artifacts || []) {
      for (const s of a.subs || []) {
        if (s.stat === 'Tỷ Lệ Bạo Kích') cv += 2 * s.value;
        if (s.stat === 'Sát Thương Bạo Kích') cv += s.value;
      }
    }
    return cv * 100;
  }

  Object.assign(GI, { ELEMENTS, SLOTS, SUB_STATS, MAIN_STATS, FINAL_STATS, EXTRA_STATS, SET_BONUS, SPECIAL_WEAPONS,
    calculate, fmt, isFlat, emptyArtifact, critValue });
})(window.GI);
