// ui-common.js
// 役割: 3タブ共通のUI描画ユーティリティ
// 依存: window.MahjongEngine, window.RiichiBridge (optional)

window.UICommon = (() => {

const { getTileImg, tileKey, detectAllYakuman } = MahjongEngine;

// z_白はSVG自体に白背景があるため、z_発・z_中はSVG内の色(緑・赤)を活かすため、jihaiから除外
const JIHAI_KEYS = new Set(['z_東','z_南','z_西','z_北']);

// 牌名マッピング（アクセシビリティ用）
const TILE_NAMES = {
  m_1:'一萬',m_2:'二萬',m_3:'三萬',m_4:'四萬',m_5:'五萬',
  m_6:'六萬',m_7:'七萬',m_8:'八萬',m_9:'九萬',
  p_1:'一筒',p_2:'二筒',p_3:'三筒',p_4:'四筒',p_5:'五筒',
  p_6:'六筒',p_7:'七筒',p_8:'八筒',p_9:'九筒',
  s_1:'一索',s_2:'二索',s_3:'三索',s_4:'四索',s_5:'五索',
  s_6:'六索',s_7:'七索',s_8:'八索',s_9:'九索',
  z_東:'東',z_南:'南',z_西:'西',z_北:'北',z_白:'白',z_発:'發',z_中:'中',
};

// ===== 牌画像生成（共通） =====
function makeTileImg(tile) {
  const key = tileKey(tile);
  const img = document.createElement('img');
  img.src = getTileImg(tile);
  img.className = 'tile-img' + (JIHAI_KEYS.has(key) ? ' jihai' : '');
  img.alt = TILE_NAMES[key] || '';
  if (key === 'z_白') {
    const wrap = document.createElement('div');
    wrap.className = 'tile-wrap-haku';
    wrap.appendChild(img);
    return wrap;
  }
  return img;
}

// ===== 手牌描画 =====
function renderHand(hand, tileRow) {
  tileRow.innerHTML = '';
  hand.forEach(tile => {
    const wrap = document.createElement('div');
    wrap.className = 'tile';
    wrap.appendChild(makeTileImg(tile));
    tileRow.appendChild(wrap);
  });
  tileRow.classList.remove('hand-flash', 'win-glow');
  void tileRow.offsetWidth; // reflow強制でアニメーション再トリガー
  tileRow.classList.add('hand-flash');
}

// ===== ツモ牌描画 =====
function renderTsumo(tile, isWin, tsumoEl) {
  tsumoEl.innerHTML = '';
  tsumoEl.classList.remove('hidden', 'gold-flash', 'normal-tsumo');
  tsumoEl.appendChild(makeTileImg(tile));
  tsumoEl.classList.add(isWin ? 'gold-flash' : 'normal-tsumo');
}

// ===== 勝利手牌描画 =====
function renderHandWin(hand, tileRow) {
  tileRow.innerHTML = '';
  hand.forEach((tile, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'tile win-tile-pop';
    wrap.style.animationDelay = `${i * 0.04}s`;
    wrap.appendChild(makeTileImg(tile));
    tileRow.appendChild(wrap);
  });
}

// ===== 勝利演出（共通フロー） =====
// domRefs: { tileRow, tsumoEl, resultOverlay, resultTiles, resultYaku, resultCount, resultLabel }
// opts: { winType, naki, baKaze, jiKaze, tenhou, labelFn, countTextFn, onStop }
function showWinAnimation(winHand, winTsumo, domRefs, opts) {
  const sortHand = MahjongEngine.sortHand;
  renderHandWin(winHand, domRefs.tileRow);

  setTimeout(() => renderTsumo(winTsumo, true, domRefs.tsumoEl), 400);

  setTimeout(() => {
    document.body.classList.add('win-flash');
    domRefs.tileRow.classList.add('win-glow');
    setTimeout(() => document.body.classList.remove('win-flash'), 1200);
  }, 500);

  setTimeout(() => { if (window.fireParticles) window.fireParticles(); }, 700);

  setTimeout(() => {
    showResult(sortHand(winHand), winTsumo, domRefs, opts);
    if (opts.onStop) opts.onStop();
  }, 2400);
}

// ===== リザルト表示（共通） =====
function showResult(hand13, tsumoTileObj, domRefs, opts) {
  const { resultOverlay, resultTiles, resultYaku, resultCount, resultLabel } = domRefs;
  resultOverlay.classList.remove('hidden');
  resultTiles.innerHTML = '';

  // 13枚手牌
  hand13.forEach((tile, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'tile result-pop';
    wrap.style.animationDelay = `${i * 0.04}s`;
    wrap.appendChild(makeTileImg(tile));
    resultTiles.appendChild(wrap);
  });

  // 区切りスペース
  const sep = document.createElement('div');
  sep.className = 'result-tsumo-sep';
  const sepLabel = document.createElement('span');
  sepLabel.className = 'result-win-type-label';
  sepLabel.textContent = opts.winType === 'ronWin' ? 'ロン' : 'ツモ';
  sep.appendChild(sepLabel);
  resultTiles.appendChild(sep);

  // ツモ牌
  const tsumoWrap = document.createElement('div');
  tsumoWrap.className = 'tile result-pop result-tsumo-tile';
  tsumoWrap.style.animationDelay = `${hand13.length * 0.04}s`;
  tsumoWrap.appendChild(makeTileImg(tsumoTileObj));
  resultTiles.appendChild(tsumoWrap);

  const hand14 = [...hand13, tsumoTileObj];
  const achieved = detectAllYakuman(hand14);

  // タイトルラベル
  if (opts.labelFn) {
    resultLabel.textContent = opts.labelFn(achieved);
  } else {
    resultLabel.textContent = achieved.length > 1
      ? '🏆 役満コンボ達成！'
      : `🀄 ${achieved[0] || '役満'}達成！`;
  }

  // 役名バッジ + 点数（riichi ライブラリで計算）
  resultYaku.innerHTML = '';
  const riichiOpts = opts.tenhou
    ? { tenhou: true }
    : { baKaze: opts.baKaze || 1, jiKaze: opts.jiKaze || 1 };
  const riichiResult = window.RiichiBridge
    ? RiichiBridge.calcScore(hand13, tsumoTileObj, opts.winType || 'tsumoWin', opts.naki || null, riichiOpts)
    : null;
  const formatted = riichiResult ? RiichiBridge.formatScoreText(riichiResult) : null;

  if (formatted && formatted.yakuman > 0) {
    formatted.yakuList.forEach(yakuText => {
      const badge = document.createElement('span');
      badge.className = 'yaku-badge';
      badge.textContent = yakuText;
      resultYaku.appendChild(badge);
    });
    const scoreEl = document.createElement('div');
    scoreEl.className = 'result-score';
    scoreEl.textContent = `${formatted.ten.toLocaleString()}点`;
    resultYaku.appendChild(scoreEl);
  } else {
    achieved.filter(name => opts.tenhou ? true : name !== '天和').forEach(name => {
      const badge = document.createElement('span');
      badge.className = 'yaku-badge';
      badge.textContent = name;
      resultYaku.appendChild(badge);
    });
    const scoreEl = document.createElement('div');
    scoreEl.className = 'result-score';
    const isOya = opts.tenhou || (opts.jiKaze || 1) === 1;
    scoreEl.textContent = isOya ? '役満 48,000点' : '役満 32,000点';
    resultYaku.appendChild(scoreEl);
  }

  // カウントテキスト
  if (opts.countTextFn) {
    resultCount.textContent = opts.countTextFn();
  } else {
    resultCount.textContent = `${(opts.totalCount || 0).toLocaleString()} 回目で達成！`;
  }
}

// ===== 速度パラメータ計算 =====
function getSimParams(speedSlider) {
  const speed = parseInt(speedSlider.value);
  if (speed <= 60) {
    return { intervalMs: Math.round(600 / speed), trialsPerFrame: 1 };
  }
  return { intervalMs: 0, trialsPerFrame: Math.ceil(speed / 60) };
}

// ===== 速度ラベル更新 =====
function formatSpeedLabel(value) {
  const v = parseInt(value);
  return v >= 1000 ? `×${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : `×${v}`;
}

return {
  JIHAI_KEYS,
  makeTileImg,
  renderHand,
  renderTsumo,
  renderHandWin,
  showWinAnimation,
  showResult,
  getSimParams,
  formatSpeedLabel,
};

})();
