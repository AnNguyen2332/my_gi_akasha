// Gợi ý build & đội hình cho từng nhân vật.
// Nguồn: tổng hợp từ các guide cộng đồng (KQM, genshin-builds.com, Prydwen, Game8...) — tháng 10/2026.
// Nhân vật có `guess: true` là dự đoán dựa trên bộ kỹ năng (chưa có guide chính thức).
window.GI = window.GI || {};

(function (GI) {
  // Mã bộ thánh di vật -> tên trong Thánh_Di_Vật_Database
  const SETS = {
    GF: 'Lễ Bế Mạc Của Giác Đấu Sĩ',        // Gladiator's Finale
    WT: 'Đoàn Hát Lang Thang Đại Lục',      // Wanderer's Troupe
    BS: 'Dũng Sĩ Trong Băng Giá',           // Blizzard Strayer
    HOD: 'Trái Tim Trầm Luân',              // Heart of Depth
    VV: 'Bóng Hình Màu Xanh',               // Viridescent Venerer
    TF: 'Như Sấm Thịnh Nộ',                 // Thundering Fury
    CW: 'Diệm Liệt Ma Nữ Cháy Rực',         // Crimson Witch of Flames
    NO: 'Nghi Thức Tông Thất Cổ',           // Noblesse Oblige
    BC: 'Kỵ Sĩ Đạo Nhuốm Máu',              // Bloodstained Chivalry
    AP: 'Phiến Đá Lâu Đời',                 // Archaic Petra
    RB: 'Sao Băng Bay Ngược',               // Retracing Bolide
    TOM: 'Thiên Nham Vững Chắc',            // Tenacity of the Millelith
    PF: 'Lửa Trắng Xám',                    // Pale Flame
    SR: 'Dòng Hồi Ức Bất Tận',              // Shimenawa's Reminiscence
    EOSF: 'Dấu Ấn Ngăn Cách',               // Emblem of Severed Fate
    HUSK: 'Giấc Mộng Phù Hoa',              // Husk of Opulent Dreams
    OHC: 'Xà Cừ Đại Dương',                 // Ocean-Hued Clam
    VH: 'Thần Sa Vãng Sinh Lục',            // Vermillion Hereafter
    EOAO: 'Dư Âm Tế Lễ',                    // Echoes of an Offering
    DM: 'Ký Ức Rừng Sâu',                   // Deepwood Memories
    GD: 'Giấc Mộng Hoàng Kim',              // Gilded Dreams
    DPC: 'Sử Ký Đình Đài Cát',              // Desert Pavilion Chronicle
    FOPL: 'Đóa Hoa Trang Viên Thất Lạc',    // Flower of Paradise Lost
    NYMPH: 'Giấc Mộng Thủy Tiên',           // Nymph's Dream
    VG: 'Vầng Sáng Vourukasha',             // Vourukasha's Glow
    MH: 'Thợ Săn Marechaussee',             // Marechaussee Hunter
    GT: 'Đoàn Kịch Hoàng Kim',              // Golden Troupe
    SODP: 'Khúc Ca Ngày Cũ',                // Song of Days Past
    NWEW: 'Tiếng Đêm Trong Rừng Vang',      // Nighttime Whispers in the Echoing Woods
    FOHW: 'Mảnh Hài Hòa Bất Thường',        // Fragment of Harmonic Whimsy
    UR: 'Ảo Mộng Chưa Hoàn Thành',          // Unfinished Reverie
    SCROLL: 'Bức Tranh Dũng Sĩ Thành Tro Tàn', // Scroll of the Hero of Cinder City
    OC: 'Bí Điển Obsidian',                 // Obsidian Codex
    LNO: 'Lời Thề Đêm Dài',                 // Long Night's Oath
    FDG: 'Đoạn Kết Hành Lang Sâu',          // Finale of the Deep Galleries
    NSU: 'Đêm Trời Hé Lộ',                  // Night of the Sky's Unveiling
    SMS: 'Khúc Ca Trăng Lụa',               // Silken Moon's Serenade
    AMM: 'Khúc Ca Của Trăng Và Sao Mai',    // Aubade of Morningstar and Moon
    ADC: 'Ngày Nổi Gió',                    // A Day Carved From Rising Winds
    CG: 'Phước Lành Trời Cao',              // Celestial Gift
    DDS: 'Ảo Tưởng Vụn Vỡ Trong Bóng Tối',  // Disenchantment in Deep Shadow
    SP: 'Bằng Chứng Máu Đỏ',                // Scarlet Proof
    HOTF: 'Trái Tim Lửa Nung',              // Heart of the Furnace
    MB: 'Thiếu Nữ Đáng Yêu',                // Maiden Beloved
    INS: 'Giáo Quan',                       // Instructor
    EXILE: 'Kẻ Lưu Đày',                    // The Exile
  };

  // Mã dòng chính. E = ST nguyên tố của chính nhân vật
  const STATS = {
    A: '%Tấn Công', H: '%HP', D: '%Phòng Ngự', EM: 'Tinh Thông Nguyên Tố', ER: 'Hiệu Quả Nạp Nguyên Tố',
    CR: 'Tỷ Lệ Bạo Kích', CD: 'Sát Thương Bạo Kích', HB: 'Hiệu Quả Trị Liệu', VL: 'ST Vật Lý',
  };

  // r: vai trò · s: các lựa chọn bộ (1 mã = 4 món, 2 mã = 2+2) · m: [Cát, Ly, Nón] (dùng "/" cho lựa chọn thay thế)
  // t: các đội hình gợi ý (3 đồng đội) · n: ghi chú
  const R = {
    // ---------------- Mondstadt / Liyue cũ ----------------
    'Amber': { r: 'Sub-DPS / Support', s: [['NO'], ['GF', 'CW']], m: ['A/ER', 'E', 'CR/CD'], t: [['Ganyu', 'Bennett', 'Zhongli'], ['Diluc', 'Kaeya', 'Bennett']] },
    'Kaeya': { r: 'Sub-DPS', s: [['BS'], ['EOSF'], ['GF', 'BS']], m: ['A/ER', 'E', 'CR/CD'], t: [['Kamisato Ayaka', 'Sangonomiya Kokomi', 'Kaedehara Kazuha'], ['Diluc', 'Bennett', 'Xingqiu']] },
    'Lisa': { r: 'Support / Sub-DPS', s: [['TF'], ['GD'], ['WT', 'TF']], m: ['EM/A', 'EM/E', 'EM/CR'], t: [['Nahida', 'Xingqiu', 'Kuki Shinobu'], ['Hutao', 'Xingqiu', 'Zhongli']] },
    'Barbara': { r: 'Healer', s: [['OHC'], ['MB'], ['TOM']], m: ['H/ER', 'H', 'HB'], t: [['Klee', 'Kaedehara Kazuha', 'Bennett'], ['Ganyu', 'Venti', 'Diona']] },
    'Razor': { r: 'Main DPS (Vật lý)', s: [['PF'], ['GF', 'BC']], m: ['A', 'VL', 'CR/CD'], t: [['Fischl', 'Beidou', 'Bennett'], ['Raiden Shogun', 'Bennett', 'Sucrose']] },
    'Xiangling': { r: 'Sub-DPS', s: [['EOSF'], ['CW'], ['GF', 'EOSF']], m: ['ER/EM/A', 'E/EM', 'CR/CD'], t: [['Bennett', 'Xingqiu', 'Sucrose'], ['Raiden Shogun', 'Bennett', 'Kaedehara Kazuha']] },
    'Beidou': { r: 'Sub-DPS', s: [['EOSF'], ['TF'], ['GF', 'EOSF']], m: ['ER/A', 'E', 'CR/CD'], t: [['Xingqiu', 'Fischl', 'Kaedehara Kazuha'], ['Raiden Shogun', 'Xingqiu', 'Bennett']] },
    'Xingqiu': { r: 'Sub-DPS', s: [['EOSF'], ['NO'], ['GF', 'EOSF']], m: ['ER/A', 'E', 'CR/CD'], t: [['Hutao', 'Yelan', 'Zhongli'], ['Raiden Shogun', 'Xiangling', 'Bennett']] },
    'Ningguang': { r: 'Main DPS', s: [['AP'], ['GF', 'AP'], ['HUSK']], m: ['A', 'E', 'CR/CD'], t: [['Zhongli', 'Albedo', 'Bennett'], ['Navia', 'Bennett', 'Xingqiu']] },
    'Fischl': { r: 'Sub-DPS', s: [['GT'], ['TF'], ['GF', 'TF']], m: ['A/EM', 'E', 'CR/CD'], t: [['Nahida', 'Xingqiu', 'Kuki Shinobu'], ['Furina', 'Xianyun', 'Chasca']] },
    'Bennett': { r: 'Support / Healer', s: [['NO'], ['SCROLL']], m: ['ER/H', 'H', 'HB/H'], t: [['Xiangling', 'Xingqiu', 'Raiden Shogun'], ['Mavuika', 'Xilonen', 'Citlali']] },
    'Noelle': { r: 'Main DPS / Shield', s: [['HUSK'], ['GF', 'AP']], m: ['D', 'E/D', 'CR/CD'], t: [['Gorou', 'Zhongli', 'Albedo'], ['Furina', 'Bennett', 'Chevreuse']] },
    'Chongyun': { r: 'Sub-DPS', s: [['NO'], ['BS'], ['GF', 'BS']], m: ['A/ER', 'E', 'CR/CD'], t: [['Xiangling', 'Xingqiu', 'Bennett'], ['Kamisato Ayaka', 'Shenhe', 'Kaedehara Kazuha']] },
    'Sucrose': { r: 'Support (Tụ màu)', s: [['VV']], m: ['EM', 'EM', 'EM'], t: [['Xiangling', 'Bennett', 'Xingqiu'], ['Neuvillette', 'Furina', 'Baizhu']] },
    'Diona': { r: 'Shield / Healer', s: [['NO'], ['TOM'], ['SODP']], m: ['ER/H', 'H', 'H/HB'], t: [['Kamisato Ayaka', 'Shenhe', 'Kaedehara Kazuha'], ['Eula', 'Raiden Shogun', 'Rosaria']] },
    'Xinyan': { r: 'Shield / Support', s: [['NO'], ['TOM']], m: ['D/ER', 'D', 'D'], t: [['Eula', 'Raiden Shogun', 'Rosaria']] },
    'Rosaria': { r: 'Sub-DPS', s: [['NO'], ['BS'], ['GF', 'BS']], m: ['A/ER', 'E', 'CR/CD'], t: [['Eula', 'Raiden Shogun', 'Zhongli'], ['Kamisato Ayaka', 'Sangonomiya Kokomi', 'Kaedehara Kazuha']] },
    'Yanfei': { r: 'Main DPS', s: [['CW'], ['WT'], ['GF', 'CW']], m: ['A/EM', 'E', 'CR/CD'], t: [['Xingqiu', 'Bennett', 'Zhongli']] },
    'Sayu': { r: 'Support / Healer', s: [['VV']], m: ['EM/ER', 'EM', 'EM/HB'], t: [['Xiangling', 'Bennett', 'Xingqiu']] },
    'Kujou Sara': { r: 'Buffer', s: [['NO'], ['EOSF']], m: ['ER/A', 'A', 'CR/CD'], t: [['Raiden Shogun', 'Xiangling', 'Bennett'], ['Cyno', 'Nahida', 'Baizhu']] },
    'Thoma': { r: 'Shield / Support', s: [['TOM'], ['NO'], ['GD']], m: ['H/ER/EM', 'H/EM', 'H/EM'], t: [['Raiden Shogun', 'Kuki Shinobu', 'Nahida'], ['Yoimiya', 'Yunjin', 'Zhongli']] },
    'Gorou': { r: 'Buffer (Nham)', s: [['EOAO'], ['NO'], ['HUSK']], m: ['ER/D', 'D', 'D'], t: [['Arataki Itto', 'Albedo', 'Zhongli'], ['Navia', 'Chiori', 'Zhongli']] },
    'Yunjin': { r: 'Buffer', s: [['HUSK'], ['NO']], m: ['D/ER', 'D', 'D'], t: [['Yoimiya', 'Bennett', 'Zhongli'], ['Navia', 'Bennett', 'Xiangling']] },
    'Kuki Shinobu': { r: 'Healer (Bung Tỏa)', s: [['FOPL'], ['GD'], ['TOM']], m: ['EM', 'EM', 'EM'], t: [['Nahida', 'Xingqiu', 'Yelan'], ['Alhaitham', 'Nahida', 'Xingqiu']] },
    'Shikanoin Heizou': { r: 'Main DPS', s: [['VV'], ['GF', 'VV']], m: ['A/EM', 'E', 'CR/CD'], t: [['Xiangling', 'Bennett', 'Xingqiu']] },
    'Collei': { r: 'Sub-DPS', s: [['DM'], ['GD'], ['NO']], m: ['ER/EM', 'E/EM', 'CR/EM'], t: [['Nilou', 'Nahida', 'Sangonomiya Kokomi'], ['Cyno', 'Nahida', 'Baizhu']] },
    'Dori': { r: 'Healer / Battery', s: [['NO'], ['SODP']], m: ['ER/H', 'H', 'H/HB'], t: [['Cyno', 'Nahida', 'Xingqiu']] },
    'Candace': { r: 'Buffer', s: [['NO'], ['TOM']], m: ['H/ER', 'H', 'H'], t: [['Cyno', 'Nahida', 'Baizhu'], ['Eula', 'Raiden Shogun', 'Rosaria']] },
    'Layla': { r: 'Shield', s: [['TOM'], ['NO'], ['OHC']], m: ['H', 'H', 'H'], t: [['Kamisato Ayaka', 'Shenhe', 'Kaedehara Kazuha'], ['Ganyu', 'Venti', 'Sangonomiya Kokomi']] },
    'Faruzan': { r: 'Buffer (Phong)', s: [['TOM'], ['NO'], ['VV']], m: ['ER', 'A/E', 'CR/CD'], t: [['Kẻ Lang Thang', 'Bennett', 'Zhongli'], ['Xiao', 'Xianyun', 'Furina']] },
    'Yaoyao': { r: 'Healer', s: [['DM'], ['TOM'], ['SODP']], m: ['H/ER', 'H', 'H/HB'], t: [['Nilou', 'Nahida', 'Sangonomiya Kokomi'], ['Kinich', 'Emilie', 'Bennett']] },
    'Mika': { r: 'Buffer / Healer', s: [['NO'], ['TOM'], ['SODP']], m: ['ER/H', 'H', 'H/HB'], t: [['Eula', 'Raiden Shogun', 'Rosaria'], ['Wriothesley', 'Furina', 'Xianyun']] },
    'Kaveh': { r: 'Driver (Bung Tỏa)', s: [['DM'], ['GD'], ['FOPL']], m: ['EM', 'EM', 'EM'], t: [['Nilou', 'Nahida', 'Sangonomiya Kokomi']] },
    'Kirara': { r: 'Shield', s: [['TOM'], ['DM']], m: ['H', 'H', 'H'], t: [['Nahida', 'Xingqiu', 'Raiden Shogun'], ['Clorinde', 'Fischl', 'Chevreuse']] },
    'Lynette': { r: 'Sub-DPS', s: [['GT'], ['VV']], m: ['A/ER', 'A/E', 'CR/CD'], t: [['Arlecchino', 'Chevreuse', 'Bennett']] },
    'Freminet': { r: 'Main DPS', s: [['PF'], ['BS'], ['GF', 'BC']], m: ['A', 'VL/E', 'CR/CD'], t: [['Furina', 'Shenhe', 'Kaedehara Kazuha']] },
    'Charlotte': { r: 'Healer', s: [['SODP'], ['NO'], ['TOM']], m: ['ER/A', 'A', 'HB/A'], t: [['Wriothesley', 'Furina', 'Kaedehara Kazuha'], ['Neuvillette', 'Furina', 'Kaedehara Kazuha']] },
    'Chevreuse': { r: 'Buffer (Quá Tải)', s: [['SODP'], ['NO'], ['TOM']], m: ['H/ER', 'H', 'H'], t: [['Raiden Shogun', 'Xiangling', 'Bennett'], ['Clorinde', 'Fischl', 'Bennett']] },
    'Gaming': { r: 'Main DPS (Plunge)', s: [['MH'], ['CW'], ['GF', 'CW']], m: ['A/EM', 'E', 'CR/CD'], t: [['Xianyun', 'Furina', 'Bennett'], ['Xianyun', 'Xingqiu', 'Bennett']] },
    'Sethos': { r: 'Main DPS (Trọng kích)', s: [['WT'], ['GD']], m: ['EM', 'E/EM', 'CR/CD'], t: [['Nahida', 'Xingqiu', 'Kuki Shinobu']] },
    'Kachina': { r: 'Sub-DPS (Nham)', s: [['SCROLL'], ['NO'], ['HUSK']], m: ['D/ER', 'E/D', 'CR/CD'], t: [['Navia', 'Zhongli', 'Bennett'], ['Mualani', 'Xilonen', 'Citlali']] },
    'Ororon': { r: 'Sub-DPS / Support', s: [['SCROLL'], ['NO'], ['EOSF']], m: ['ER/A', 'E', 'CR/CD'], t: [['Mualani', 'Xilonen', 'Citlali'], ['Chasca', 'Mavuika', 'Bennett']] },
    'Lan Yan': { r: 'Shield / Support', s: [['VV'], ['SCROLL'], ['TOM']], m: ['A/ER', 'A', 'A'], t: [['Mavuika', 'Xiangling', 'Bennett'], ['Chasca', 'Ororon', 'Mavuika']] },
    'Iansan': { r: 'Buffer', s: [['SCROLL'], ['NO'], ['SODP']], m: ['A/ER', 'A', 'A'], t: [['Varesa', 'Xilonen', 'Bennett'], ['Mavuika', 'Citlali', 'Bennett']] },
    'Ifa': { r: 'Healer / Tụ màu', s: [['VV'], ['SCROLL']], m: ['EM', 'EM', 'EM'], t: [['Varesa', 'Iansan', 'Citlali'], ['Varka', 'Durin', 'Bennett']] },
    'Dahlia': { r: 'Shield / Support', guess: true, s: [['TOM'], ['NO'], ['SODP']], m: ['H/ER', 'H', 'H'], t: [['Flins', 'Ineffa', 'Aino'], ['Neuvillette', 'Furina', 'Kaedehara Kazuha']] },
    'Aino': { r: 'Support (Phản ứng)', s: [['SMS'], ['NO'], ['SCROLL']], m: ['ER/EM', 'EM', 'EM/CR'], t: [['Flins', 'Ineffa', 'Xilonen'], ['Hutao', 'Furina', 'Citlali']] },
    'Jahoda': { r: 'Off-field DPS / Healer', s: [['VV'], ['SMS'], ['DM']], m: ['ER/A', 'A', 'HB/A/CR'], t: [['Flins', 'Aino', 'Ineffa'], ['Flins', 'Aino', 'Fischl']] },
    'Illuga': { r: 'Support (Nham, Nguyệt Kết Tinh)', s: [['SMS'], ['WT', 'SMS']], m: ['EM/ER', 'EM', 'EM'], t: [['Zibai', 'Columbina', 'Gorou'], ['Zibai', 'Columbina', 'Zhongli']] },
    'Prune': { r: 'Buffer / Sub-DPS', s: [['VV'], ['CG'], ['NO']], m: ['ER/A', 'A', 'A/CR'], t: [['Varka', 'Venti', 'Klee'], ['Clorinde', 'Fischl', 'Kirara']] },
    'Alyosha': { r: 'Sub-DPS / Buffer (Stellar)', s: [['NO'], ['HOTF'], ['GF', 'ADC']], m: ['A', 'A', 'A/CR'], t: [['Sandrone', 'Yae Miko', 'Odette'], ['Sandrone', 'Qiqi', 'Odette']] },
    'Valeriy': { r: 'Sub-DPS (Stellar)', guess: true, s: [['HOTF'], ['NO'], ['GF', 'ADC']], m: ['A/ER', 'E/A', 'CR/CD'], t: [['Mitya', 'Odette', 'Yae Miko'], ['Mitya', 'Odette', 'Sucrose']] },

    // ---------------- 5 sao ----------------
    'Jean': { r: 'Healer / Tụ màu', s: [['VV'], ['NO']], m: ['ER/A', 'A/E', 'CR/HB'], t: [['Diluc', 'Bennett', 'Xingqiu'], ['Eula', 'Raiden Shogun', 'Rosaria']] },
    'Diluc': { r: 'Main DPS', s: [['CW'], ['GF', 'CW']], m: ['A/EM', 'E', 'CR/CD'], t: [['Xingqiu', 'Bennett', 'Kaedehara Kazuha'], ['Kaeya', 'Bennett', 'Sucrose']] },
    'Qiqi': { r: 'Healer', s: [['OHC'], ['TOM'], ['NO']], m: ['A', 'A', 'HB'], t: [['Sandrone', 'Yae Miko', 'Zhongli'], ['Ganyu', 'Venti', 'Mona']] },
    'Mona': { r: 'Support (Đóng băng)', s: [['NO'], ['TOM'], ['EOSF']], m: ['ER', 'E/A', 'CR/CD'], t: [['Kamisato Ayaka', 'Shenhe', 'Kaedehara Kazuha'], ['Ganyu', 'Venti', 'Diona']] },
    'Keqing': { r: 'Main DPS', s: [['TF'], ['GD'], ['GF', 'TF']], m: ['A/EM', 'E', 'CR/CD'], t: [['Nahida', 'Kuki Shinobu', 'Xingqiu'], ['Fischl', 'Furina', 'Kaedehara Kazuha']] },
    'Venti': { r: 'Support (Gom quái)', s: [['VV']], m: ['ER/EM', 'E/EM', 'CR/EM'], t: [['Ganyu', 'Diona', 'Mona'], ['Varka', 'Durin', 'Bennett']] },
    'Klee': { r: 'Main DPS', s: [['CW'], ['GF', 'CW']], m: ['A/EM', 'E', 'CR/CD'], t: [['Kaedehara Kazuha', 'Bennett', 'Xingqiu'], ['Prune', 'Varka', 'Venti']] },
    'Tartaglia': { r: 'Sub-DPS / Driver', s: [['NO'], ['NYMPH'], ['HOD']], m: ['A', 'E', 'CR/CD'], t: [['Xiangling', 'Bennett', 'Kaedehara Kazuha'], ['Raiden Shogun', 'Xiangling', 'Bennett']] },
    'Zhongli': { r: 'Shield', s: [['TOM'], ['AP'], ['NO']], m: ['H', 'H', 'H'], t: [['Hutao', 'Xingqiu', 'Yelan'], ['Raiden Shogun', 'Xiangling', 'Bennett']] },
    'Albedo': { r: 'Sub-DPS (Nham)', s: [['HUSK'], ['GT'], ['AP']], m: ['D', 'E', 'CR/CD'], t: [['Arataki Itto', 'Gorou', 'Zhongli'], ['Navia', 'Zhongli', 'Bennett']] },
    'Ganyu': { r: 'Main DPS', s: [['BS'], ['WT'], ['SR']], m: ['A/EM', 'E', 'CR/CD'], t: [['Venti', 'Mona', 'Diona'], ['Xiangling', 'Bennett', 'Zhongli']] },
    'Xiao': { r: 'Main DPS (Plunge)', s: [['VH'], ['MH'], ['GF', 'VV']], m: ['A', 'E', 'CR/CD'], t: [['Xianyun', 'Furina', 'Faruzan'], ['Faruzan', 'Bennett', 'Zhongli']] },
    'Hutao': { r: 'Main DPS', s: [['CW'], ['SR'], ['MH']], m: ['H/EM', 'E', 'CR/CD'], t: [['Xingqiu', 'Yelan', 'Zhongli'], ['Furina', 'Xilonen', 'Yelan']] },
    'Eula': { r: 'Main DPS (Vật lý)', s: [['PF'], ['GF', 'BC']], m: ['A', 'VL', 'CR/CD'], t: [['Raiden Shogun', 'Rosaria', 'Zhongli'], ['Mika', 'Raiden Shogun', 'Furina']] },
    'Kaedehara Kazuha': { r: 'Support (Tụ màu)', s: [['VV']], m: ['EM', 'EM', 'EM'], t: [['Kamisato Ayaka', 'Shenhe', 'Sangonomiya Kokomi'], ['Hutao', 'Furina', 'Yelan']] },
    'Kamisato Ayaka': { r: 'Main DPS (Đóng băng)', s: [['BS'], ['FDG']], m: ['A', 'E', 'CD'], t: [['Shenhe', 'Kaedehara Kazuha', 'Sangonomiya Kokomi'], ['Furina', 'Kaedehara Kazuha', 'Citlali']] },
    'Yoimiya': { r: 'Main DPS', s: [['SR'], ['EOAO'], ['GF', 'SR']], m: ['A/EM', 'E', 'CR/CD'], t: [['Yunjin', 'Bennett', 'Zhongli'], ['Yelan', 'Xingqiu', 'Bennett']] },
    'Aloy': { r: 'Main DPS', s: [['BS'], ['GF', 'BS']], m: ['A', 'E', 'CR/CD'], t: [['Shenhe', 'Kaedehara Kazuha', 'Sangonomiya Kokomi']] },
    'Raiden Shogun': { r: 'Main DPS / Battery', s: [['EOSF'], ['GF', 'EOSF']], m: ['ER/A', 'E/A', 'CR/CD'], t: [['Xiangling', 'Bennett', 'Xingqiu'], ['Nahida', 'Kuki Shinobu', 'Yelan']] },
    'Sangonomiya Kokomi': { r: 'Healer / Driver', s: [['OHC'], ['TOM'], ['HOD']], m: ['H/ER', 'E/H', 'HB'], t: [['Nilou', 'Nahida', 'Collei'], ['Kamisato Ayaka', 'Shenhe', 'Kaedehara Kazuha']] },
    'Arataki Itto': { r: 'Main DPS', s: [['HUSK'], ['GF', 'HUSK']], m: ['D', 'E', 'CR/CD'], t: [['Gorou', 'Albedo', 'Zhongli'], ['Gorou', 'Zhongli', 'Chiori']] },
    'Shenhe': { r: 'Buffer (Băng)', s: [['NO'], ['GF', 'NO']], m: ['A/ER', 'A', 'A'], t: [['Kamisato Ayaka', 'Kaedehara Kazuha', 'Sangonomiya Kokomi'], ['Wriothesley', 'Furina', 'Kaedehara Kazuha']] },
    'Yae Miko': { r: 'Sub-DPS', s: [['GD'], ['GF', 'TF'], ['TF']], m: ['A/EM', 'E', 'CR/CD'], t: [['Raiden Shogun', 'Furina', 'Kaedehara Kazuha'], ['Sandrone', 'Odette', 'Alyosha']] },
    'Kamisato Ayato': { r: 'Main DPS', s: [['HOD'], ['EOSF'], ['GF', 'HOD']], m: ['A/H', 'E', 'CR/CD'], t: [['Xiangling', 'Bennett', 'Kaedehara Kazuha'], ['Fischl', 'Furina', 'Xianyun']] },
    'Yelan': { r: 'Sub-DPS', s: [['EOSF'], ['NO'], ['GT']], m: ['H/ER', 'E', 'CR/CD'], t: [['Hutao', 'Xingqiu', 'Zhongli'], ['Raiden Shogun', 'Xiangling', 'Bennett']] },
    'Tighnari': { r: 'Main DPS (Trọng kích)', s: [['WT'], ['GD']], m: ['EM/A', 'E', 'CR/CD'], t: [['Nahida', 'Fischl', 'Zhongli'], ['Yae Miko', 'Kuki Shinobu', 'Zhongli']] },
    'Cyno': { r: 'Main DPS', s: [['GD'], ['TF'], ['FOPL']], m: ['EM/A', 'E', 'CR/CD'], t: [['Nahida', 'Baizhu', 'Furina'], ['Nahida', 'Xingqiu', 'Kuki Shinobu']] },
    'Nilou': { r: 'Driver (Nở Rộ)', s: [['TOM'], ['VG'], ['GD']], m: ['H', 'H', 'H'], t: [['Nahida', 'Sangonomiya Kokomi', 'Baizhu'], ['Nahida', 'Collei', 'Yaoyao']] },
    'Nahida': { r: 'Sub-DPS / Support', s: [['DM'], ['GD']], m: ['EM', 'EM/E', 'EM/CR'], t: [['Raiden Shogun', 'Xingqiu', 'Kuki Shinobu'], ['Alhaitham', 'Xingqiu', 'Kuki Shinobu']] },
    'Kẻ Lang Thang': { r: 'Main DPS', s: [['DPC'], ['SR'], ['MH']], m: ['A', 'E', 'CR/CD'], t: [['Faruzan', 'Bennett', 'Zhongli'], ['Furina', 'Faruzan', 'Xianyun']] },
    'Alhaitham': { r: 'Main DPS (Lan Tràn)', s: [['GD'], ['DM']], m: ['EM', 'E', 'CR/CD'], t: [['Nahida', 'Kuki Shinobu', 'Xingqiu'], ['Yelan', 'Nahida', 'Kuki Shinobu']] },
    'Dehya': { r: 'Sub-DPS / Tank', s: [['EOSF'], ['VG'], ['GF', 'CW']], m: ['H/A', 'E', 'CR/CD'], t: [['Hutao', 'Furina', 'Yelan']] },
    'Baizhu': { r: 'Healer', s: [['DM'], ['OHC'], ['TOM']], m: ['H/ER', 'H', 'HB/H'], t: [['Cyno', 'Nahida', 'Furina'], ['Neuvillette', 'Furina', 'Kaedehara Kazuha']] },
    'Lyney': { r: 'Main DPS', s: [['MH'], ['SR'], ['GF', 'MH']], m: ['A', 'E', 'CR/CD'], t: [['Furina', 'Bennett', 'Kaedehara Kazuha'], ['Lynette', 'Bennett', 'Xilonen']] },
    'Neuvillette': { r: 'Main DPS', s: [['MH'], ['HOD'], ['TOM', 'HOD']], m: ['H', 'E/H', 'CD'], t: [['Furina', 'Kaedehara Kazuha', 'Baizhu'], ['Furina', 'Xilonen', 'Ineffa']] },
    'Wriothesley': { r: 'Main DPS', s: [['MH'], ['BS']], m: ['A', 'E', 'CR/CD'], t: [['Furina', 'Shenhe', 'Kaedehara Kazuha'], ['Furina', 'Xianyun', 'Charlotte']] },
    'Furina': { r: 'Sub-DPS / Buffer', s: [['GT'], ['TOM'], ['NO']], m: ['H/ER', 'H', 'CR/CD'], t: [['Neuvillette', 'Kaedehara Kazuha', 'Baizhu'], ['Hutao', 'Yelan', 'Xilonen']] },
    'Navia': { r: 'Main DPS', s: [['NWEW'], ['GF', 'AP']], m: ['A', 'E', 'CR/CD'], t: [['Xiangling', 'Bennett', 'Zhongli'], ['Furina', 'Bennett', 'Xilonen']] },
    'Xianyun': { r: 'Support (Plunge)', s: [['VV'], ['SODP'], ['NO']], m: ['A/ER', 'A', 'A'], t: [['Xiao', 'Furina', 'Faruzan'], ['Gaming', 'Bennett', 'Xingqiu']] },
    'Chiori': { r: 'Sub-DPS', s: [['GT'], ['HUSK'], ['GF', 'HUSK']], m: ['D/A', 'E', 'CR/CD'], t: [['Navia', 'Zhongli', 'Bennett'], ['Arataki Itto', 'Gorou', 'Zhongli']] },
    'Arlecchino': { r: 'Main DPS', s: [['FOHW'], ['GF', 'SR']], m: ['A', 'E', 'CR/CD'], t: [['Yelan', 'Xingqiu', 'Bennett'], ['Chevreuse', 'Bennett', 'Lynette']] },
    'Clorinde': { r: 'Main DPS', s: [['FOHW'], ['GF', 'TF']], m: ['A', 'E', 'CR/CD'], t: [['Fischl', 'Chevreuse', 'Bennett'], ['Nahida', 'Fischl', 'Kirara']] },
    'Sigewinne': { r: 'Healer / Sub-DPS', s: [['SODP'], ['OHC'], ['GT']], m: ['H', 'H', 'CR/HB'], t: [['Neuvillette', 'Furina', 'Kaedehara Kazuha']] },
    'Emilie': { r: 'Sub-DPS (Thiêu Đốt)', s: [['UR'], ['GF', 'DM']], m: ['A', 'E', 'CR/CD'], t: [['Kinich', 'Bennett', 'Kaedehara Kazuha'], ['Arlecchino', 'Baizhu', 'Bennett']] },
    'Mualani': { r: 'Main DPS', s: [['OC'], ['HOD', 'GF']], m: ['H', 'E', 'CR/CD'], t: [['Kachina', 'Xilonen', 'Citlali'], ['Xiangling', 'Bennett', 'Citlali']] },
    'Kinich': { r: 'Main DPS', s: [['OC'], ['GF', 'DM']], m: ['A', 'E', 'CR/CD'], t: [['Emilie', 'Bennett', 'Xilonen'], ['Furina', 'Bennett', 'Xilonen']] },
    'Xilonen': { r: 'Buffer / Healer', s: [['SCROLL'], ['TOM'], ['NO']], m: ['D/ER', 'D', 'D'], t: [['Mavuika', 'Citlali', 'Bennett'], ['Neuvillette', 'Furina', 'Ineffa']] },
    'Chasca': { r: 'Main DPS', s: [['OC'], ['LNO'], ['GF', 'VV']], m: ['A', 'E', 'CR/CD'], t: [['Ororon', 'Furina', 'Bennett'], ['Ororon', 'Mavuika', 'Bennett']] },
    'Citlali': { r: 'Support (Băng)', s: [['SCROLL'], ['NO'], ['AMM']], m: ['EM/ER', 'EM', 'EM'], t: [['Mavuika', 'Xilonen', 'Bennett'], ['Mualani', 'Kachina', 'Xilonen']] },
    'Mavuika': { r: 'Main DPS', s: [['OC'], ['NWEW'], ['GF', 'CW']], m: ['A/EM', 'E', 'CR/CD'], t: [['Citlali', 'Xilonen', 'Bennett'], ['Citlali', 'Iansan', 'Xilonen']] },
    'Yumemizuki Mizuki': { r: 'Sub-DPS (Tụ màu)', s: [['VV'], ['WT', 'GD']], m: ['EM', 'EM', 'EM'], t: [['Furina', 'Xiangling', 'Bennett'], ['Neuvillette', 'Furina', 'Kaedehara Kazuha']] },
    'Varesa': { r: 'Main DPS (Plunge)', s: [['LNO'], ['OC'], ['GF', 'TF']], m: ['A', 'E', 'CR/CD'], t: [['Iansan', 'Xilonen', 'Bennett'], ['Iansan', 'Citlali', 'Xianyun']] },
    'Escoffier': { r: 'Support (Băng)', s: [['GT'], ['FDG'], ['BS']], m: ['A/ER', 'A/E', 'CR/CD'], t: [['Neuvillette', 'Furina', 'Kaedehara Kazuha'], ['Skirk', 'Furina', 'Shenhe']] },
    'Skirk': { r: 'Main DPS', s: [['FDG'], ['BS'], ['GF', 'BS']], m: ['A', 'E', 'CR/CD'], t: [['Escoffier', 'Furina', 'Shenhe'], ['Escoffier', 'Furina', 'Citlali']] },
    'Ineffa': { r: 'Off-field DPS / Shield (Nguyệt Điện Cảm)', s: [['AMM'], ['GD'], ['SMS']], m: ['A', 'A', 'CR/CD'], t: [['Flins', 'Aino', 'Xilonen'], ['Neuvillette', 'Furina', 'Xilonen']] },
    'Lauma': { r: 'Support (Nguyệt Sum Suê)', s: [['SMS'], ['DM'], ['NSU']], m: ['ER/EM', 'EM', 'EM'], t: [['Nefer', 'Aino', 'Yaoyao'], ['Furina', 'Yelan', 'Kuki Shinobu']] },
    'Flins': { r: 'Main DPS (Nguyệt Điện Cảm)', s: [['NSU'], ['GD'], ['GF', 'EOSF']], m: ['A', 'A', 'CR/CD'], t: [['Aino', 'Xilonen', 'Ineffa'], ['Aino', 'Sucrose', 'Ineffa']] },
    'Nefer': { r: 'Main DPS (Nguyệt Sum Suê)', s: [['NSU'], ['WT'], ['GD']], m: ['EM', 'EM', 'CR/CD'], t: [['Lauma', 'Yaoyao', 'Aino'], ['Lauma', 'Nilou', 'Diona']] },
    'Durin': { r: 'Support / Off-field DPS (Hỏa)', s: [['ADC'], ['GD'], ['EOSF']], m: ['A', 'E/A', 'CR/CD'], t: [['Venti', 'Faruzan', 'Bennett'], ['Varka', 'Ifa', 'Bennett']] },
    'Columbina': { r: 'Off-field Sub-DPS / Buffer (Nguyệt)', s: [['SMS'], ['AMM']], m: ['H/ER', 'H', 'CR/CD'], t: [['Nefer', 'Lauma', 'Yaoyao'], ['Zibai', 'Illuga', 'Gorou']] },
    'Zibai': { r: 'Main DPS (Nguyệt Kết Tinh)', s: [['NSU'], ['HUSK'], ['WT']], m: ['D', 'D', 'CR/CD'], t: [['Illuga', 'Columbina', 'Gorou'], ['Illuga', 'Columbina', 'Zhongli']] },
    'Varka': { r: 'Main DPS', s: [['ADC'], ['SR'], ['DPC']], m: ['A', 'A', 'CR/CD'], t: [['Ifa', 'Durin', 'Bennett'], ['Venti', 'Durin', 'Bennett']] },
    'Linnea': { r: 'Sub-DPS (Nguyệt Kết Tinh)', s: [['AMM'], ['HUSK']], m: ['D', 'D', 'CR/CD'], t: [['Zibai', 'Columbina', 'Illuga'], ['Navia', 'Columbina', 'Furina']] },
    'Nicole': { r: 'Shield / Buffer (Hỏa)', s: [['CG'], ['SCROLL'], ['NO']], m: ['ER/A', 'A', 'A/CR'], t: [['Varka', 'Prune', 'Bennett'], ['Varka', 'Prune', 'Durin']] },
    'Lohen': { r: 'Main DPS (Băng)', s: [['ADC'], ['BS'], ['SR']], m: ['A', 'E', 'CR/CD'], t: [['Nicole', 'Durin', 'Citlali'], ['Furina', 'Mona', 'Escoffier']] },
    'Sandrone': { r: 'Main DPS (Stellar-Conduct)', s: [['DDS'], ['GD'], ['GF', 'ADC']], m: ['A/EM', 'A/EM', 'CD/CR'], t: [['Yae Miko', 'Odette', 'Alyosha'], ['Yae Miko', 'Zhongli', 'Qiqi']] },
    'Odette': { r: 'Stellar Support / Sub-DPS', s: [['HOTF'], ['DDS'], ['GF', 'ADC']], m: ['A', 'A', 'CR'], t: [['Sandrone', 'Yae Miko', 'Alyosha'], ['Vesna', 'Vodyanitsa', 'Qiqi']] },
    'Vesna': { r: 'Main DPS (Stellar-Swirl)', s: [['SP'], ['VV'], ['GF', 'ADC']], m: ['A', 'A', 'CR/CD'], t: [['Odette', 'Vodyanitsa', 'Qiqi'], ['Odette', 'Vodyanitsa', 'Kaedehara Kazuha']] },
    'Vodyanitsa': { r: 'Healer / Giảm kháng (Thủy)', s: [['TOM'], ['TOM', 'VG'], ['SODP']], m: ['H', 'H', 'H'], t: [['Vesna', 'Odette', 'Qiqi'], ['Sandrone', 'Odette', 'Alyosha']] },
    'Mitya': { r: 'DPS / Sub-DPS (Stellar-Conduct)', s: [['DDS'], ['GD'], ['WT', 'GD']], m: ['EM', 'EM', 'CR/CD'], t: [['Odette', 'Yae Miko', 'Valeriy'], ['Odette', 'Valeriy', 'Sucrose']] },
    'Danica': { r: 'DPS (Stellar-Conduct)', guess: true, s: [['DDS'], ['GD'], ['GF', 'ADC']], m: ['A/EM', 'E/A', 'CR/CD'], t: [['Mitya', 'Odette', 'Tsaritsa'], ['Sandrone', 'Odette', 'Alyosha']] },
    'Tsaritsa': { r: 'Main / Sub-DPS (Stellar)', guess: true, s: [['DDS'], ['SP'], ['GF', 'ADC']], m: ['A', 'E/A', 'CR/CD'], t: [['Danica', 'Odette', 'Yae Miko'], ['Odette', 'Danica', 'Mitya']] },
  };

  const expandStat = (code, element) => (code === 'E' ? 'ST Nguyên Tố ' + element : STATS[code] || code);

  // Gợi ý tự động khi chưa có dữ liệu cho nhân vật
  function fallback(c, data) {
    const asc = Object.entries(c.asc).filter(([, v]) => v).map(([k]) => k)[0] || '';
    const elemSet = { 'Hỏa': 'CW', 'Băng': 'BS', 'Lôi': 'TF', 'Thủy': 'HOD', 'Phong': 'VV', 'Nham': 'AP', 'Thảo': 'DM' }[c.element];
    let r;
    if (/Bạo/.test(asc) || /ST Nguyên Tố|Vật Lý/.test(asc)) r = { r: 'DPS', s: [[elemSet], ['GF', elemSet], ['SR']], m: ['A', 'E', 'CR/CD'] };
    else if (/Tinh Thông/.test(asc)) r = { r: 'Phản ứng / Support', s: [['GD'], ['WT', 'GD']], m: ['EM', 'EM', 'EM'] };
    else if (/HP|Phòng Ngự/.test(asc)) r = { r: 'Support', s: [['TOM'], ['NO']], m: ['H/ER', 'H', 'H'] };
    else r = { r: 'Support', s: [['NO'], ['EOSF']], m: ['ER/A', 'A', 'CR/CD'] };
    // Đội: các nhân vật cùng quốc gia (ưu tiên 5★) + support phổ biến
    const pool = data.characters.filter((x) => x.name !== c.name);
    const sameNation = pool.filter((x) => x.nation === c.nation).sort((a, b) => b.rarity - a.rarity).slice(0, 2).map((x) => x.name);
    const flex = ['Bennett', 'Kaedehara Kazuha', 'Furina', 'Zhongli'].filter((n) => n !== c.name && !sameNation.includes(n));
    r.t = [[...sameNation, ...flex].slice(0, 3), ['Bennett', 'Kaedehara Kazuha', 'Furina'].filter((n) => n !== c.name)];
    r.auto = true;
    return r;
  }

  // Trả về gợi ý đã được chuẩn hoá theo tên trong database
  GI.getRecommendation = function (data, name) {
    const c = data.charByName[name];
    if (!c) return null;
    const raw = R[name] || fallback(c, data);
    const sets = raw.s
      .map((codes) => codes.map((k) => SETS[k]).filter((n) => data.setByName[n]))
      .filter((arr) => arr.length)
      .map((arr) => ({ sets: arr, label: arr.length === 1 ? `${arr[0]} (4)` : arr.map((n) => `${n} (2)`).join(' + ') }));
    const mainStats = raw.m.map((slot) => slot.split('/').map((code) => expandStat(code, c.element)));
    const teams = (raw.t || [])
      .map((t) => t.filter((n) => n !== name && data.charByName[n]))
      .filter((t) => t.length);
    return { role: raw.r, guess: !!raw.guess, auto: !!raw.auto, sets, mainStats, teams };
  };

  GI.REC_SETS = SETS;
})(window.GI);
