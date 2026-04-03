(() => {
const { deal, sortHand, YAKUMAN_LIST, checkYakumanConditions } = MahjongEngine;
const { makeTileImg, renderHand, renderTsumo, showWinAnimation, getSimParams, formatSpeedLabel } = UICommon;

// ===== タブ切り替え =====
const tabBtns = document.querySelectorAll('.tab-btn');

function switchTab(btn) {
  if (isRunning) stopSimulation();
  if (window.Main3D && window.Main3D.isRunning) window.Main3D.stopSimulation();
  tabBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
  btn.classList.add('active');
  btn.setAttribute('aria-selected', 'true');
  document.getElementById(`tab-${btn.dataset.tab}`).classList.remove('hidden');
}

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn));
  // 矢印キーでタブ間を移動
  btn.addEventListener('keydown', (e) => {
    const tabs = [...tabBtns];
    const idx = tabs.indexOf(btn);
    let target = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') target = tabs[(idx + 1) % tabs.length];
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') target = tabs[(idx - 1 + tabs.length) % tabs.length];
    if (target) { e.preventDefault(); target.focus(); switchTab(target); }
  });
});

// Escキーで結果オーバーレイを閉じる
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('#result-overlay, #td-result-overlay').forEach(el => {
      if (!el.classList.contains('hidden')) el.classList.add('hidden');
    });
  }
});

let isRunning = false;
let count = 0;
let animFrameId = null;
let lastTime = 0;
let isPaused = false;

const startBtn   = document.getElementById('start-btn');
const stopBtn    = document.getElementById('stop-btn');
const countEl    = document.getElementById('count');
const tileRow    = document.getElementById('tile-row');
const tsumoTile  = document.getElementById('tsumo-tile');
const speedSlider = document.getElementById('speed');
const speedLabel = document.getElementById('speed-label');
const resultOverlay = document.getElementById('result-overlay');
const resultTiles   = document.getElementById('result-tiles');
const resultYaku    = document.getElementById('result-yaku');
const resultCount   = document.getElementById('result-count');
const resultLabel   = document.getElementById('result-label');
const restartBtn    = document.getElementById('restart-btn');
const yakumanGrid   = document.getElementById('yakuman-grid');
const selectAllBtn  = document.getElementById('select-all-btn');
const clearBtn      = document.getElementById('clear-btn');

const domRefs = {
  tileRow, tsumoEl: tsumoTile,
  resultOverlay, resultTiles, resultYaku, resultCount, resultLabel,
};

// ===== 役満選択UI =====
const selectedYakuman = new Set(['tenhou']); // デフォルトは天和

const DIFFICULTY_LABEL = { 1: '★', 2: '★★★', 3: '★★★★★' };

YAKUMAN_LIST.forEach(y => {
  const btn = document.createElement('button');
  btn.className = 'yakuman-btn diff-' + y.difficulty + (selectedYakuman.has(y.id) ? ' active' : '');
  btn.dataset.id = y.id;
  btn.innerHTML = `<span class="yakuman-btn-name">${y.name}<span class="diff-star">${DIFFICULTY_LABEL[y.difficulty]}</span></span><span class="yakuman-btn-desc">${y.desc}</span>`;

  btn.addEventListener('click', () => {
    if (selectedYakuman.has(y.id)) {
      selectedYakuman.delete(y.id);
      btn.classList.remove('active');
    } else {
      selectedYakuman.add(y.id);
      btn.classList.add('active');
    }
    updateNotice();
  });
  yakumanGrid.appendChild(btn);
});

selectAllBtn.addEventListener('click', () => {
  YAKUMAN_LIST.forEach(y => {
    selectedYakuman.add(y.id);
    yakumanGrid.querySelector(`[data-id="${y.id}"]`).classList.add('active');
  });
  updateNotice();
});

clearBtn.addEventListener('click', () => {
  selectedYakuman.clear();
  yakumanGrid.querySelectorAll('.yakuman-btn').forEach(b => b.classList.remove('active'));
  updateNotice();
});

function updateNotice() {
  const notice = document.getElementById('yakuman-notice');
  if (selectedYakuman.size === 0) {
    notice.textContent = '※ 未選択の場合は天和のみ判定';
    notice.style.color = '#aaa';
  } else {
    notice.textContent = '';
  }
}
updateNotice();

// ===== 速度 =====
speedSlider.addEventListener('input', () => {
  speedLabel.textContent = formatSpeedLabel(speedSlider.value);
});

// ===== 天和演出 =====
function onWin(winHand, winTsumo, totalCount) {
  showWinAnimation(winHand, winTsumo, domRefs, {
    winType: 'tsumoWin',
    tenhou: true,
    totalCount,
    onStop: stopSimulation,
  });
}

function hideResult() {
  resultOverlay.classList.add('hidden');
}

// ===== シミュレーションループ =====
function runSimulation(timestamp) {
  if (!isRunning) return;

  const { intervalMs, trialsPerFrame } = getSimParams(speedSlider);

  if (timestamp - lastTime >= intervalMs) {
    lastTime = timestamp;

    const ids = [...selectedYakuman];
    const targetIds = ids.length === 0 ? ['tenhou'] : ids;

    let winHand = null, winTsumo = null, lastSorted = null;

    for (let t = 0; t < trialsPerFrame; t++) {
      const { hand, tsumo } = deal();
      const sorted = sortHand(hand);
      const hand14 = [...sorted, tsumo];
      count++;
      lastSorted = sorted;

      if (checkYakumanConditions(hand14, targetIds, false)) {
        winHand = sorted;
        winTsumo = tsumo;
        break;
      }
    }

    countEl.textContent = count.toLocaleString();

    if (winHand) {
      onWin(winHand, winTsumo, count);
      return;
    }

    if (lastSorted) {
      renderHand(lastSorted, tileRow);
      tsumoTile.classList.add('hidden');
    }
  }

  animFrameId = requestAnimationFrame(runSimulation);
}

function startSimulation(resetCount = true) {
  isRunning = true;
  isPaused = false;
  if (resetCount) {
    count = 0;
    countEl.textContent = '0';
  }
  hideResult();
  tsumoTile.innerHTML = '';
  tsumoTile.classList.add('hidden');
  startBtn.classList.add('hidden');
  stopBtn.classList.remove('hidden');
  lastTime = 0;
  animFrameId = requestAnimationFrame(runSimulation);
}

function stopSimulation() {
  isRunning = false;
  isPaused = true;
  if (animFrameId) cancelAnimationFrame(animFrameId);
  startBtn.classList.remove('hidden');
  stopBtn.classList.add('hidden');
}

startBtn.addEventListener('click', () => startSimulation(!isPaused));
stopBtn.addEventListener('click', stopSimulation);
restartBtn.addEventListener('click', () => { isPaused = false; hideResult(); startSimulation(true); });

// 初期表示
(function initDisplay() {
  const { hand } = deal();
  renderHand(sortHand(hand), tileRow);
})();

})();
