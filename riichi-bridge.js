// riichi-bridge.js
// haipai-rush の牌形式 ↔ riichi ライブラリの文字列形式を変換し、
// 点数計算・向聴数計算をラップする。
// 依存: window.RiichiCalc (riichi), window.SyantenCalc (syanten), window.MahjongEngine

window.RiichiBridge = (() => {

  const { tileKey } = MahjongEngine;

  // === haipai-rush の牌 → riichi 文字列変換 ===
  // haipai-rush: { suit: 'm'|'p'|'s'|'z', num: 1-9 } or { suit: 'z', name: '東' }
  // riichi: "123m456p789s1234567z" (z: 1東 2南 3西 4北 5白 6發 7中)

  const JIHAI_TO_NUM = { '東':1, '南':2, '西':3, '北':4, '白':5, '発':6, '中':7 };

  function tileToRiichiNum(tile) {
    if (tile.suit === 'z') return JIHAI_TO_NUM[tile.name];
    return tile.num;
  }

  // 手牌配列 → riichi 文字列 (例: "123m456p789s1234567z")
  function handToRiichiStr(tiles) {
    const groups = { m: [], p: [], s: [], z: [] };
    for (const t of tiles) {
      const n = tileToRiichiNum(t);
      groups[t.suit].push(n);
    }
    let str = '';
    for (const suit of ['m', 'p', 's', 'z']) {
      if (groups[suit].length > 0) {
        groups[suit].sort((a, b) => a - b);
        str += groups[suit].join('') + suit;
      }
    }
    return str;
  }

  // 手牌13枚 + アガり牌 → riichi calc用文字列
  // winType: 'tsumoWin' (ツモ) or 'ronWin' (ロン)
  // opts: { tenhou: bool } 天和/地和フラグ
  function buildRiichiInput(hand13, agariTile, winType, naki, opts) {
    const handStr = handToRiichiStr(hand13);
    const agariNum = tileToRiichiNum(agariTile);
    const agariSuit = agariTile.suit;

    let input;
    if (winType === 'ronWin') {
      // ロン: 手牌13枚+アガり牌を "手牌+アガり牌" 形式
      input = handStr + '+' + agariNum + agariSuit;
    } else {
      // ツモ: 手牌14枚をそのまま（最後がツモ牌）
      input = handToRiichiStr([...hand13, agariTile]);
    }

    // 副露面子を付加
    if (naki && naki.mentsu && naki.mentsu.length > 0) {
      for (const m of naki.mentsu) {
        const mStr = handToRiichiStr(m.tiles);
        input += '+' + mStr;
      }
    }

    // Extra フラグ
    let extra = '';
    if (opts && opts.tenhou) extra += 't';
    // 場風・自風 (1=東, 2=南, 3=西, 4=北)
    // riichiライブラリ: 2桁で場風+自風, 1桁で自風のみ(場風=東)
    const ba = (opts && opts.baKaze) || 1;
    const ji = (opts && opts.jiKaze) || 2;
    if (opts && opts.tenhou) {
      extra += '11'; // 天和は常に親（東家）
    } else {
      extra += '' + ba + ji;
    }
    if (extra) input += '+' + extra;

    return input;
  }

  // === 点数計算 ===
  // hand13: 手牌13枚, agariTile: アガり牌, winType: 'tsumoWin'|'ronWin'
  // naki: { mentsu: [...], isMenzen: bool } or null
  // opts: { tenhou: bool } 天和/地和フラグ
  // 戻り値: { isAgari, yakuman, yaku, han, fu, ten, name, text, oya, ko, error }
  function calcScore(hand13, agariTile, winType, naki, opts) {
    try {
      const input = buildRiichiInput(hand13, agariTile, winType, naki, opts);
      const riichi = new RiichiCalc(input);
      riichi.disableWyakuman(); // ダブル役満は無効（シンプルにする）
      const result = riichi.calc();
      return result;
    } catch (e) {
      console.warn('riichi calc error:', e);
      return { isAgari: false, error: true };
    }
  }

  // === 向聴数計算 ===
  // tiles: 手牌13枚 or 14枚
  // 戻り値: 向聴数 (-1=和了, 0=聴牌, 1+=向聴数)
  function calcShanten(tiles) {
    try {
      const haiArr = tilesToHaiArr(tiles);
      return SyantenCalc(haiArr);
    } catch (e) {
      console.warn('syanten calc error:', e);
      return -2;
    }
  }

  // 手牌 → syanten の HaiArr 形式に変換
  // HaiArr: [[m1-m9], [p1-p9], [s1-s9], [東南西北白發中]]
  function tilesToHaiArr(tiles) {
    const arr = [
      [0,0,0,0,0,0,0,0,0], // m
      [0,0,0,0,0,0,0,0,0], // p
      [0,0,0,0,0,0,0,0,0], // s
      [0,0,0,0,0,0,0],     // z
    ];
    const suitIdx = { m: 0, p: 1, s: 2, z: 3 };
    for (const t of tiles) {
      const si = suitIdx[t.suit];
      const ni = tileToRiichiNum(t) - 1;
      arr[si][ni]++;
    }
    return arr;
  }

  // === 結果テキスト生成 ===
  function formatScoreText(result) {
    if (!result || result.error || !result.isAgari) return null;

    const yakuList = [];
    for (const [name, value] of Object.entries(result.yaku || {})) {
      yakuList.push(`${name} ${value}`);
    }

    return {
      yakuList,
      ten: result.ten,
      name: result.name || '',
      text: result.text || '',
      han: result.han,
      fu: result.fu,
      yakuman: result.yakuman,
    };
  }

  return {
    handToRiichiStr,
    buildRiichiInput,
    calcScore,
    calcShanten,
    tilesToHaiArr,
    formatScoreText,
    JIHAI_TO_NUM,
  };

})();
