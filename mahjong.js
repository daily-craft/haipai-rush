// 四麻用麻雀ロジック
window.MahjongEngine = (() => {

// ===== 牌定義 =====
const TILES = [];
for (let n = 1; n <= 9; n++) for (let i = 0; i < 4; i++) TILES.push({ suit: 'm', num: n });
for (let n = 1; n <= 9; n++) for (let i = 0; i < 4; i++) TILES.push({ suit: 'p', num: n });
for (let n = 1; n <= 9; n++) for (let i = 0; i < 4; i++) TILES.push({ suit: 's', num: n });
for (const name of ['東','南','西','北','白','発','中']) for (let i = 0; i < 4; i++) TILES.push({ suit: 'z', name });

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function deal() {
  const deck = shuffle(TILES);
  return { hand: deck.slice(0, 13), tsumo: deck[13] };
}

function tileKey(tile) {
  return tile.suit === 'z' ? `z_${tile.name}` : `${tile.suit}_${tile.num}`;
}

function sortHand(hand) {
  const suitOrder = { m: 0, p: 1, s: 2, z: 3 };
  const jihaiOrder = { '東':1,'南':2,'西':3,'北':4,'白':5,'発':6,'中':7 };
  return [...hand].sort((a, b) => {
    if (suitOrder[a.suit] !== suitOrder[b.suit]) return suitOrder[a.suit] - suitOrder[b.suit];
    const na = a.suit === 'z' ? jihaiOrder[a.name] : a.num;
    const nb = b.suit === 'z' ? jihaiOrder[b.name] : b.num;
    return na - nb;
  });
}

function countTiles(tiles) {
  const c = {};
  for (const t of tiles) { const k = tileKey(t); c[k] = (c[k] || 0) + 1; }
  return c;
}

function keyToTile(k) {
  const p = k.split('_');
  return p[0] === 'z' ? { suit: 'z', name: p[1] } : { suit: p[0], num: parseInt(p[1]) };
}

// ===== アガり判定 =====

function isChiitoitsu(counts) {
  const vals = Object.values(counts);
  return vals.length === 7 && vals.every(v => v === 2);
}

function isKokushiWin(counts) {
  const yaochu = ['m_1','m_9','p_1','p_9','s_1','s_9','z_東','z_南','z_西','z_北','z_白','z_発','z_中'];
  let hasDouble = false;
  for (const k of yaochu) {
    if (!counts[k]) return false;
    if (counts[k] >= 2) hasDouble = true;
  }
  return hasDouble;
}

function isNormalWin(counts) {
  for (const k of Object.keys(counts)) {
    if (counts[k] >= 2) {
      const rem = { ...counts };
      rem[k] -= 2;
      if (rem[k] === 0) delete rem[k];
      if (canFormMentsu(rem)) return true;
    }
  }
  return false;
}

function canFormMentsu(counts) {
  const keys = Object.keys(counts).sort();
  if (keys.length === 0) return true;
  const k = keys[0];
  const tile = keyToTile(k);
  const c = counts[k];
  if (c >= 3) {
    const rem = { ...counts };
    rem[k] -= 3; if (rem[k] === 0) delete rem[k];
    if (canFormMentsu(rem)) return true;
  }
  if (tile.suit !== 'z' && tile.num <= 7) {
    const k2 = `${tile.suit}_${tile.num + 1}`;
    const k3 = `${tile.suit}_${tile.num + 2}`;
    if (counts[k2] >= 1 && counts[k3] >= 1) {
      const rem = { ...counts };
      rem[k]  -= 1; if (rem[k]  === 0) delete rem[k];
      rem[k2] -= 1; if (rem[k2] === 0) delete rem[k2];
      rem[k3] -= 1; if (rem[k3] === 0) delete rem[k3];
      if (canFormMentsu(rem)) return true;
    }
  }
  return false;
}

function isAgari14(tiles) {
  if (tiles.length !== 14) return false;
  const counts = countTiles(tiles);
  return isChiitoitsu(counts) || isKokushiWin(counts) || isNormalWin(counts);
}

// ===== 役満判定 =====
//
// 設計方針:
//   各役満を「その役満の完成形」で判定する。
//
//   天和:     14枚でアガり形。約1/32万。
//   国士無双: 么九牌13種を全種含む（各1枚以上 + 1種が2枚）。約1/6億。
//   九蓮宝燈: 同suit数牌のみ14枚、1112345678999+1の形。約1/数十億。
//   四暗刻:   4刻子+雀頭の形（全て暗刻）。約1/数千万。
//   大三元:   白発中を各3枚以上。約1/3億。
//   小四喜:   東南西北の3種が3枚以上＋1種が2枚。約1/100億。
//   大四喜:   東南西北が全て3枚以上。約1/数百億。
//   字一色:   全て字牌でアガり形。約1/数十億。
//   清老頭:   全て1・9牌でアガり形。約1/数十億。
//   緑一色:   2s3s4s6s8s発のみでアガり形。約1/数十億。
//
//   ※ 上記確率は全て「1000万回上限」を大きく超えるため、
//     現実的な頻度で出現するよう「近似条件」も用意している。
//     各役満ボタンは「厳密」か「近似(緩め)」をトグルで選べる。

// ------天和------
// 完全条件: 14枚でアガり形
function checkTenhou(tiles) {
  return isAgari14(tiles);
}

// ------国士無双------
// 完全条件: 么九牌13種全て含む（13種各1枚以上 + 1種2枚）
// 緩め条件: 么九牌を11種以上含む（1枚以上ずつ）
function checkKokushi(tiles, loose = false) {
  const counts = countTiles(tiles);
  const yaochu = ['m_1','m_9','p_1','p_9','s_1','s_9','z_東','z_南','z_西','z_北','z_白','z_発','z_中'];
  if (loose) {
    const kinds = yaochu.filter(k => counts[k] >= 1).length;
    return kinds >= 11;
  }
  let hasDouble = false;
  for (const k of yaochu) {
    if (!counts[k]) return false;
    if (counts[k] >= 2) hasDouble = true;
  }
  return hasDouble;
}

// ------九蓮宝燈------
// 完全条件: 同suit14枚で1112345678999+任意1の形
// 緩め条件: どれか1suitの数牌が8枚以上
function checkChuurenPoutou(tiles, loose = false) {
  if (loose) {
    for (const s of ['m', 'p', 's']) {
      if (tiles.filter(t => t.suit === s).length >= 8) return true;
    }
    return false;
  }
  const suits = new Set(tiles.map(t => t.suit));
  if (suits.size !== 1) return false;
  const suit = [...suits][0];
  if (suit === 'z') return false;
  const counts = countTiles(tiles);
  const base = { 1:3, 2:1, 3:1, 4:1, 5:1, 6:1, 7:1, 8:1, 9:3 };
  for (let n = 1; n <= 9; n++) {
    const rem = {};
    for (let m = 1; m <= 9; m++) rem[`${suit}_${m}`] = counts[`${suit}_${m}`] || 0;
    rem[`${suit}_${n}`]--;
    if (rem[`${suit}_${n}`] < 0) continue;
    let ok = true;
    for (let m = 1; m <= 9; m++) {
      if (rem[`${suit}_${m}`] !== base[m]) { ok = false; break; }
    }
    if (ok) return true;
  }
  return false;
}

// ------四暗刻------
// 完全条件: [3,3,3,3,2]の形（4刻子+雀頭）
// 緩め条件: [3,3,3,x,x]以上（3枚組が3つ以上）
function checkSuuankou(tiles, loose = false) {
  const counts = countTiles(tiles);
  const vals = Object.values(counts);
  if (loose) {
    return vals.filter(v => v >= 3).length >= 3;
  }
  const threes = vals.filter(v => v === 3).length;
  const twos   = vals.filter(v => v === 2).length;
  return threes === 4 && twos === 1 && vals.length === 5;
}

// ------大三元------
// 完全条件: 白発中各3枚以上 + アガり形
// 緩め条件: 白発中の合計6枚以上（各1枚以上）
function checkDaisangen(tiles, loose = false) {
  const counts = countTiles(tiles);
  if (loose) {
    const total = (counts['z_白'] || 0) + (counts['z_発'] || 0) + (counts['z_中'] || 0);
    return total >= 6
        && (counts['z_白'] || 0) >= 1
        && (counts['z_発'] || 0) >= 1
        && (counts['z_中'] || 0) >= 1;
  }
  if (!((counts['z_白'] || 0) >= 3
      && (counts['z_発'] || 0) >= 3
      && (counts['z_中'] || 0) >= 3)) return false;
  // 14枚（鳴きなし）のときのみアガり形を検証
  if (tiles.length === 14) return isNormalWin(counts);
  return true;
}

// ------小四喜------
// 完全条件: 東南西北の3種が3枚以上 + 1種が2枚
// 緩め条件: 東南西北の3種以上を各2枚以上含む
function checkShousuushii(tiles, loose = false) {
  const counts = countTiles(tiles);
  const winds = ['z_東','z_南','z_西','z_北'];
  if (loose) {
    return winds.filter(k => (counts[k] || 0) >= 2).length >= 3;
  }
  const threes = winds.filter(k => (counts[k] || 0) >= 3).length;
  const twos   = winds.filter(k => (counts[k] || 0) === 2).length;
  if (!(threes === 3 && twos === 1)) return false;
  if (tiles.length === 14) return isNormalWin(counts);
  return true;
}

// ------大四喜------
// 完全条件: 東南西北全て3枚以上
// 緩め条件: 東南西北全て2枚以上
function checkDaisuushii(tiles, loose = false) {
  const counts = countTiles(tiles);
  const winds = ['z_東','z_南','z_西','z_北'];
  const min = loose ? 2 : 3;
  if (!winds.every(k => (counts[k] || 0) >= min)) return false;
  if (loose) return true;
  if (tiles.length === 14) return isNormalWin(counts);
  return true;
}

// ------字一色------
// 完全条件: 全て字牌でアガり形
// 緩め条件: 14枚中10枚以上が字牌
function checkTsuuiisou(tiles, loose = false) {
  if (loose) {
    const jiCount = tiles.filter(t => t.suit === 'z').length;
    return jiCount >= 10;
  }
  if (!tiles.every(t => t.suit === 'z')) return false;
  const counts = countTiles(tiles);
  return isChiitoitsu(counts) || isNormalWin(counts);
}

// ------清老頭------
// 完全条件: 全て1・9牌でアガり形
// 緩め条件: 14枚中10枚以上が1・9牌（字牌なし）
function checkChinroutou(tiles, loose = false) {
  if (loose) {
    const yaoCount = tiles.filter(t => t.suit !== 'z' && (t.num === 1 || t.num === 9)).length;
    return yaoCount >= 10;
  }
  if (!tiles.every(t => t.suit !== 'z' && (t.num === 1 || t.num === 9))) return false;
  const counts = countTiles(tiles);
  return isNormalWin(counts);
}

// ------緑一色------
// 完全条件: 2s3s4s6s8s発のみでアガり形
// 緩め条件: 14枚中10枚以上が2s3s4s6s8s発
function checkRyuuiisou(tiles, loose = false) {
  const green = new Set(['s_2','s_3','s_4','s_6','s_8','z_発']);
  if (loose) {
    const greenCount = tiles.filter(t => green.has(tileKey(t))).length;
    return greenCount >= 10;
  }
  if (!tiles.every(t => green.has(tileKey(t)))) return false;
  const counts = countTiles(tiles);
  return isChiitoitsu(counts) || isNormalWin(counts);
}

// ===== 役満リスト =====
// difficulty: 厳密モードでの難易度
//   1 = 約1/32万（天和）
//   2 = 約1/数千万
//   3 = 約1/数億以上
// looseDifficulty: 緩めモードでの難易度（1000万回以内で出現可能）
const YAKUMAN_LIST = [
  {
    id: 'tenhou', name: '天和', difficulty: 1,
    desc: '配牌14枚でアガり形',
    detail: '最初の配牌14枚が完成形。確率は約1/32,000',
    example: ['m1','m2','m3','m4','m5','m6','m7','m8','m9','p1','p1','p1','z1','z1'],
    looseDesc: null,
    check: (t, loose) => checkTenhou(t),
  },
  {
    id: 'kokushi', name: '国士無双', difficulty: 3,
    desc: '一・九・字牌13種を全て含む',
    detail: '么九牌（1,9,東南西北白発中）13種を1枚ずつ揃え、うち1種を2枚持つ形',
    example: ['m1','m9','p1','p9','s1','s9','z1','z2','z3','z4','z5','z6','z7','z1'],
    looseDesc: '么九牌11種以上',
    check: checkKokushi,
  },
  {
    id: 'churenPoutou', name: '九蓮宝燈', difficulty: 3,
    desc: '同じ種類で1112345678999の形',
    detail: '同一の数牌で1,1,1,2,3,4,5,6,7,8,9,9,9に任意1枚を加えた形',
    example: ['m1','m1','m1','m2','m3','m4','m5','m6','m7','m8','m9','m9','m9','m5'],
    looseDesc: '同suit数牌が8枚以上',
    check: checkChuurenPoutou,
  },
  {
    id: 'suuankou', name: '四暗刻', difficulty: 2,
    desc: '4組の刻子と雀頭（全て門前）',
    detail: '鳴かずに同じ牌3枚組を4セット揃え、残り2枚を雀頭にする形',
    example: ['m1','m1','m1','p3','p3','p3','s7','s7','s7','z5','z5','z5','z1','z1'],
    looseDesc: '3枚組が3つ以上',
    check: checkSuuankou,
  },
  {
    id: 'daisangen', name: '大三元', difficulty: 3,
    desc: '白・発・中を各3枚ずつ揃える',
    detail: '三元牌（白・発・中）をそれぞれ3枚ずつ鳴いてもよい形',
    example: ['z5','z5','z5','z6','z6','z6','z7','z7','z7','m2','m3','m4','p1','p1'],
    looseDesc: '白発中が合計6枚以上（各1枚以上）',
    check: checkDaisangen,
  },
  {
    id: 'shousuushii', name: '小四喜', difficulty: 3,
    desc: '東南西北の3種を刻子、1種を雀頭',
    detail: '風牌（東南西北）のうち3種を3枚組、残り1種を2枚持つ形',
    example: ['z1','z1','z1','z2','z2','z2','z3','z3','z3','z4','z4','m5','m6','m7'],
    looseDesc: '風牌3種以上を各2枚以上',
    check: checkShousuushii,
  },
  {
    id: 'daisuushii', name: '大四喜', difficulty: 3,
    desc: '東南西北を全て3枚ずつ揃える',
    detail: '風牌（東南西北）を全種それぞれ3枚ずつ揃えた形。雀頭は他の牌',
    example: ['z1','z1','z1','z2','z2','z2','z3','z3','z3','z4','z4','z4','m5','m5'],
    looseDesc: '東南西北が全て2枚以上',
    check: checkDaisuushii,
  },
  {
    id: 'tsuuiisou', name: '字一色', difficulty: 3,
    desc: '字牌（東南西北白発中）だけでアガる',
    detail: '東南西北白発中の字牌のみで手牌を構成した形',
    example: ['z1','z1','z1','z2','z2','z2','z3','z3','z3','z5','z5','z5','z7','z7'],
    looseDesc: '14枚中10枚以上が字牌',
    check: checkTsuuiisou,
  },
  {
    id: 'chinroutou', name: '清老頭', difficulty: 3,
    desc: '1と9の牌だけでアガる',
    detail: '数牌の1と9だけで手牌を構成した形。字牌は含まない',
    example: ['m1','m1','m1','m9','m9','m9','p1','p1','p1','p9','p9','p9','s1','s1'],
    looseDesc: '14枚中10枚以上が1・9牌',
    check: checkChinroutou,
  },
  {
    id: 'ryuuiisou', name: '緑一色', difficulty: 3,
    desc: '索子の2,3,4,6,8と発だけでアガる',
    detail: '緑色の牌（索子2,3,4,6,8と発）のみで構成した形',
    example: ['s2','s3','s4','s2','s3','s4','s6','s6','s6','s8','s8','s8','z6','z6'],
    looseDesc: '14枚中10枚以上が緑牌',
    check: checkRyuuiisou,
  },
];

function checkYakumanConditions(tiles, selectedIds, looseMode = false) {
  if (selectedIds.length === 0) return false;
  return selectedIds.every(id => {
    const y = YAKUMAN_LIST.find(y => y.id === id);
    return y ? y.check(tiles, looseMode) : false;
  });
}

function detectAllYakuman(tiles, looseMode = false) {
  return YAKUMAN_LIST.filter(y => y.check(tiles, looseMode)).map(y => y.name);
}

// ===== 牌画像 =====
const TILE_IMG = {
  m_1:'Man1',m_2:'Man2',m_3:'Man3',m_4:'Man4',m_5:'Man5',
  m_6:'Man6',m_7:'Man7',m_8:'Man8',m_9:'Man9',
  p_1:'Pin1',p_2:'Pin2',p_3:'Pin3',p_4:'Pin4',p_5:'Pin5',
  p_6:'Pin6',p_7:'Pin7',p_8:'Pin8',p_9:'Pin9',
  s_1:'Sou1',s_2:'Sou2',s_3:'Sou3',s_4:'Sou4',s_5:'Sou5',
  s_6:'Sou6',s_7:'Sou7',s_8:'Sou8',s_9:'Sou9',
  z_東:'Ton',z_南:'Nan',z_西:'Shaa',z_北:'Pei',
  z_白:'Haku',z_発:'Hatsu',z_中:'Chun',
};

function getTileImg(tile) {
  return `tiles/${TILE_IMG[tileKey(tile)] || 'Back'}.svg`;
}

return { deal, sortHand, isAgari14, getTileImg, tileKey, YAKUMAN_LIST, checkYakumanConditions, detectAllYakuman,
         shuffle, countTiles, keyToTile, isNormalWin, TILES };

})();
