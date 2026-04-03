// ===== HAIPAI RUSH — 3D天和モード =====

const Main3D = (() => {
  const { deal, sortHand, YAKUMAN_LIST, checkYakumanConditions } = MahjongEngine;
  const { showResult: ucShowResult, getSimParams, formatSpeedLabel } = UICommon;

  let isRunning = false;
  let count = 0;
  let animFrameId = null;
  let lastTime = 0;
  let isPaused = false;
  let sceneReady = false;

  // DOM
  let startBtn, stopBtn, countEl, speedSlider, speedLabel;
  let resultOverlay, resultTiles, resultYaku, resultCount, resultLabel, restartBtn;
  let yakumanGrid, selectAllBtn, clearBtn;

  const selectedYakuman = new Set(['tenhou']);
  const DIFFICULTY_LABEL = { 1: '★', 2: '★★★', 3: '★★★★★' };

  function init() {
    startBtn     = document.getElementById('td-start-btn');
    stopBtn      = document.getElementById('td-stop-btn');
    countEl      = document.getElementById('td-count');
    speedSlider  = document.getElementById('td-speed');
    speedLabel   = document.getElementById('td-speed-label');
    resultOverlay = document.getElementById('td-result-overlay');
    resultTiles   = document.getElementById('td-result-tiles');
    resultYaku    = document.getElementById('td-result-yaku');
    resultCount   = document.getElementById('td-result-count');
    resultLabel   = document.getElementById('td-result-label');
    restartBtn    = document.getElementById('td-restart-btn');
    yakumanGrid   = document.getElementById('td-yakuman-grid');
    selectAllBtn  = document.getElementById('td-select-all-btn');
    clearBtn      = document.getElementById('td-clear-btn');

    buildYakumanGrid();

    speedSlider.addEventListener('input', () => {
      speedLabel.textContent = formatSpeedLabel(speedSlider.value);
    });

    startBtn.addEventListener('click', () => startSimulation(!isPaused));
    stopBtn.addEventListener('click', stopSimulation);
    restartBtn.addEventListener('click', () => { isPaused = false; hideResult(); startSimulation(true); });
  }

  // 3Dシーン初期化（テクスチャプリロード含む）
  async function initScene() {
    if (sceneReady) return;
    const container = document.getElementById('td-3d-container');
    if (!container) return;

    // WebGL対応チェック
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;min-height:300px;color:#c4a862;text-align:center;padding:40px;font-size:1.1em;line-height:1.8;">' +
        '<div><p style="font-size:1.4em;margin-bottom:12px;">⚠ 3Dモードは利用できません</p>' +
        '<p>お使いのブラウザまたはデバイスがWebGLに対応していません。<br>「役満チャレンジ」タブで2Dモードをお楽しみください。</p></div></div>';
      if (startBtn) startBtn.disabled = true;
      return;
    }

    ThreeScene.init(container);
    await ThreeScene.preloadTextures();
    ThreeScene.createPool();
    sceneReady = true;

    // 初期表示
    const { hand } = deal();
    ThreeScene.renderHand3D(sortHand(hand), null, false);
  }

  function buildYakumanGrid() {
    YAKUMAN_LIST.forEach(y => {
      const btn = document.createElement('button');
      btn.className = 'yakuman-btn diff-' + y.difficulty + (selectedYakuman.has(y.id) ? ' active' : '');
      btn.dataset.id = y.id;
      btn.innerHTML = `<span class="yakuman-btn-name">${y.name}<span class="diff-star">${DIFFICULTY_LABEL[y.difficulty]}</span></span><span class="yakuman-btn-desc">${y.desc}</span>`;
      btn.addEventListener('click', () => {
        if (selectedYakuman.has(y.id)) { selectedYakuman.delete(y.id); btn.classList.remove('active'); }
        else { selectedYakuman.add(y.id); btn.classList.add('active'); }
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
    updateNotice();
  }

  function updateNotice() {
    const notice = document.getElementById('td-yakuman-notice');
    if (selectedYakuman.size === 0) {
      notice.textContent = '※ 未選択の場合は天和のみ判定';
      notice.style.color = '#aaa';
    } else {
      notice.textContent = '';
    }
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

      // 1000回ごとにパルス演出
      if (count % 1000 < trialsPerFrame) {
        countEl.classList.remove('pulse');
        void countEl.offsetWidth; // reflow で再発火
        countEl.classList.add('pulse');
      }

      if (winHand) {
        showWin(winHand, winTsumo, count);
        return;
      }

      // 通常描画（テクスチャ差し替えのみなので軽い）
      if (lastSorted) {
        ThreeScene.renderHand3D(lastSorted, null, false);
      }
    }

    animFrameId = requestAnimationFrame(runSimulation);
  }

  function startSimulation(resetCount = true) {
    if (!sceneReady) return; // initScene完了前は無視
    isRunning = true;
    isPaused = false;
    if (resetCount) { count = 0; countEl.textContent = '0'; }
    hideResult();
    ThreeScene.stopWinAnimation();
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

  // ===== 勝利 =====
  function showWin(winHand, winTsumo, totalCount) {
    // 3D側の勝利演出
    ThreeScene.renderHand3D(winHand, winTsumo, true);

    // 2Dパーティクルも
    setTimeout(() => { if (window.fireParticles) window.fireParticles(); }, 700);

    // 結果オーバーレイ表示
    setTimeout(() => {
      const domRefs = {
        tileRow: null, tsumoEl: null,
        resultOverlay, resultTiles, resultYaku, resultCount, resultLabel,
      };
      ucShowResult(sortHand(winHand), winTsumo, domRefs, {
        winType: 'tsumoWin',
        tenhou: true,
        totalCount,
      });
      stopSimulation();
    }, 2400);
  }

  function hideResult() {
    resultOverlay.classList.add('hidden');
  }

  return { init, initScene, stopSimulation, get isRunning() { return isRunning; } };
})();

window.Main3D = Main3D;
