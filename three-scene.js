// ===== HAIPAI RUSH — 3D Scene (Three.js) =====
// BoxGeometry牌 + テクスチャプール方式

const ThreeScene = (() => {
  let scene, camera, renderer;
  let tableGroup, tilesGroup;
  let container;
  let animFrameId = null;

  // --- 牌の寸法 ---
  const TILE_W = 0.026;   // 幅 26mm
  const TILE_H = 0.035;   // 高さ 35mm
  const TILE_D = 0.018;   // 奥行き（厚み）18mm
  const TILE_GAP = 0.002;

  const TABLE_SIZE = 0.8;
  const TABLE_BORDER = 0.04;
  const TABLE_HEIGHT = 0.02;
  const TABLE_LEG_HEIGHT = 0.55;

  // --- テクスチャキャッシュ（34種 + 裏面） ---
  const textureCache = new Map();
  let backTexture = null;
  let sideTexture = null;
  let preloadDone = false;

  // --- Meshプール（手牌13 + ツモ1 + 予備1 = 15個） ---
  const POOL_SIZE = 15;
  const tilePool = [];
  let poolCreated = false;

  // ===== 初期化 =====
  function init(containerEl) {
    container = containerEl;

    scene = new THREE.Scene();
    // 雀荘風グラデーション背景
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = 2; bgCanvas.height = 512;
    const bgCtx = bgCanvas.getContext('2d');
    const bgGrad = bgCtx.createLinearGradient(0, 0, 0, 512);
    bgGrad.addColorStop(0, '#1a1510');     // 天井（暗い暖色）
    bgGrad.addColorStop(0.3, '#12100a');   // 壁上部
    bgGrad.addColorStop(0.6, '#0a1208');   // 壁下部（緑がかった暗色）
    bgGrad.addColorStop(1, '#060804');     // 床方向（ほぼ黒）
    bgCtx.fillStyle = bgGrad;
    bgCtx.fillRect(0, 0, 2, 512);
    const bgTex = new THREE.CanvasTexture(bgCanvas);
    scene.background = bgTex;
    // 非線形Fog: Fog(color, near, far) — 手前は透明、奥だけ暗くなる
    scene.fog = new THREE.Fog(0x0a0e06, 0.6, 2.8);

    // カメラ: 正面寄りプレイヤー視点
    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(45, aspect, 0.01, 10);
    camera.position.set(0, 0.08, 0.58);
    camera.lookAt(0, 0.02, 0.30);

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    setupLighting();

    tableGroup = new THREE.Group();
    scene.add(tableGroup);
    createTable(); // async but non-blocking — table appears when textures load
    createFloor();
    createEnvironment();

    tilesGroup = new THREE.Group();
    scene.add(tilesGroup);

    window.addEventListener('resize', onResize);
    renderLoop();
  }

  // ===== 照明 =====
  function setupLighting() {
    // 環境光（暖色寄り、控えめ — 雀荘の薄暗さを表現）
    scene.add(new THREE.AmbientLight(0xfff5e8, 0.25));

    // メインライト（卓上のペンダントライト — 真上から）
    // r150+は物理ベースなので intensity は控えめに
    const mainLight = new THREE.SpotLight(0xfff5e0, 3, 3, Math.PI / 5, 0.7, 2.0);
    mainLight.position.set(0, 1.0, 0.25);
    mainLight.target.position.set(0, 0, 0.25);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.set(2048, 2048);
    mainLight.shadow.camera.near = 0.3;
    mainLight.shadow.camera.far = 3;
    mainLight.shadow.bias = -0.0003;
    mainLight.shadow.radius = 3;
    scene.add(mainLight);
    scene.add(mainLight.target);

    // フィルライト（手前から牌を照らす — 暖色系）
    const fillLight = new THREE.PointLight(0xfff0d8, 0.6, 2, 2);
    fillLight.position.set(0, 0.08, 0.55);
    scene.add(fillLight);

    // リムライト（奥から — 冷色系でエッジを出す）
    const rimLight = new THREE.PointLight(0xc0d8ff, 0.3, 3, 2);
    rimLight.position.set(0, 0.20, -0.4);
    scene.add(rimLight);

    // 左右サイドライト（牌の側面にハイライト）
    const sideL = new THREE.PointLight(0xfff5e8, 0.25, 1.5, 2);
    sideL.position.set(-0.3, 0.06, 0.35);
    scene.add(sideL);
    const sideR = new THREE.PointLight(0xfff5e8, 0.25, 1.5, 2);
    sideR.position.set(0.3, 0.06, 0.35);
    scene.add(sideR);
  }

  // ===== GLBモデルローダー =====
  let gltfLoader = null;
  function loadGLB(url) {
    if (!gltfLoader) {
      if (!THREE.GLTFLoader) return Promise.resolve(null);
      gltfLoader = new THREE.GLTFLoader();
    }
    return new Promise((resolve) => {
      gltfLoader.load(url, (gltf) => resolve(gltf), undefined, () => resolve(null));
    });
  }

  // ===== 画像テクスチャローダー =====
  function loadImageTexture(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const tex = new THREE.Texture(img);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.needsUpdate = true;
        resolve(tex);
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  // ===== 雀卓 =====
  async function createTable() {
    // フェルト面 — 画像テクスチャ優先、フォールバックでプロシージャル
    const feltImgTex = await loadImageTexture('felt-texture.webp');
    const feltMat = new THREE.MeshStandardMaterial({
      color: 0x0a5522,
      roughness: 0.96,
      metalness: 0.0,
    });
    if (feltImgTex) {
      feltImgTex.repeat.set(3, 3);
      feltMat.map = feltImgTex;
    }
    addFeltTextures(feltMat, !feltImgTex);
    const felt = new THREE.Mesh(new THREE.BoxGeometry(TABLE_SIZE, 0.003, TABLE_SIZE), feltMat);
    felt.position.y = 0;
    felt.receiveShadow = true;
    tableGroup.add(felt);

    // 木枠 — 画像テクスチャ優先
    const woodImgTex = await loadImageTexture('wood-texture.webp');
    const woodMat = createWoodMaterial(woodImgTex);
    const inner = TABLE_SIZE;
    const outer = TABLE_SIZE + TABLE_BORDER * 2;
    const h = TABLE_HEIGHT;
    const sides = [
      { pos: [0, h / 2, -(inner / 2 + TABLE_BORDER / 2)], size: [outer, h, TABLE_BORDER] },
      { pos: [0, h / 2, (inner / 2 + TABLE_BORDER / 2)], size: [outer, h, TABLE_BORDER] },
      { pos: [-(inner / 2 + TABLE_BORDER / 2), h / 2, 0], size: [TABLE_BORDER, h, inner] },
      { pos: [(inner / 2 + TABLE_BORDER / 2), h / 2, 0], size: [TABLE_BORDER, h, inner] },
    ];
    sides.forEach(({ pos, size }) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), woodMat);
      mesh.position.set(...pos);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      tableGroup.add(mesh);
    });

    // 角柱（木枠の4隅、少し高い）
    const cornerH = h * 1.4;
    const cornerSize = TABLE_BORDER * 0.9;
    const cornerGeom = new THREE.BoxGeometry(cornerSize, cornerH, cornerSize);
    const halfInner = inner / 2 + TABLE_BORDER / 2;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      const corner = new THREE.Mesh(cornerGeom, woodMat);
      corner.position.set(sx * halfInner, cornerH / 2, sz * halfInner);
      corner.castShadow = true;
      tableGroup.add(corner);
    });

    // フェルト-木枠境界の暗線
    const edgeLineMat = new THREE.MeshStandardMaterial({
      color: 0x050a04, roughness: 0.9, metalness: 0.0,
    });
    const edgeH = 0.001;
    const edgeW = 0.002;
    const halfFelt = inner / 2;
    // 4辺の暗線
    [
      { pos: [0, edgeH / 2, -halfFelt], size: [inner, edgeH, edgeW] },
      { pos: [0, edgeH / 2, halfFelt], size: [inner, edgeH, edgeW] },
      { pos: [-halfFelt, edgeH / 2, 0], size: [edgeW, edgeH, inner] },
      { pos: [halfFelt, edgeH / 2, 0], size: [edgeW, edgeH, inner] },
    ].forEach(({ pos, size }) => {
      const line = new THREE.Mesh(new THREE.BoxGeometry(...size), edgeLineMat);
      line.position.set(...pos);
      tableGroup.add(line);
    });

    // 脚
    const legGeom = new THREE.CylinderGeometry(0.018, 0.022, TABLE_LEG_HEIGHT, 8);
    const halfSize = TABLE_SIZE / 2 + TABLE_BORDER * 0.7;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      const leg = new THREE.Mesh(legGeom, woodMat);
      leg.position.set(sx * halfSize, -TABLE_LEG_HEIGHT / 2, sz * halfSize);
      leg.castShadow = true;
      tableGroup.add(leg);
    });

    needsRender = true;
  }

  function addFeltTextures(mat, addDiffuse = true) {
    const size = 512;
    // --- diffuse map（繊維の色ムラ） ---
    const dc = document.createElement('canvas');
    dc.width = size; dc.height = size;
    const dctx = dc.getContext('2d');
    dctx.fillStyle = '#0d6b2c';
    dctx.fillRect(0, 0, size, size);
    // 大きな色ムラ（パッチ感）
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      const r = 20 + Math.random() * 60;
      const g = dctx.createRadialGradient(x, y, 0, x, y, r);
      const shade = Math.random() > 0.5 ? 'rgba(20,120,50,0.08)' : 'rgba(5,80,25,0.08)';
      g.addColorStop(0, shade); g.addColorStop(1, 'rgba(0,0,0,0)');
      dctx.fillStyle = g;
      dctx.fillRect(0, 0, size, size);
    }
    // 細かい繊維ノイズ
    for (let i = 0; i < 40000; i++) {
      const b = 15 + Math.random() * 30;
      dctx.fillStyle = `rgba(${b}, ${b + 45}, ${b}, 0.12)`;
      dctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
    }
    // 横方向の繊維筋
    for (let i = 0; i < 200; i++) {
      const y = Math.random() * size;
      dctx.strokeStyle = `rgba(8,90,30,${0.03 + Math.random() * 0.04})`;
      dctx.lineWidth = 0.3 + Math.random() * 0.5;
      dctx.beginPath();
      dctx.moveTo(0, y);
      for (let x = 0; x < size; x += 8) dctx.lineTo(x, y + (Math.random() - 0.5) * 1.5);
      dctx.stroke();
    }
    if (addDiffuse) {
      const diffTex = new THREE.CanvasTexture(dc);
      diffTex.wrapS = diffTex.wrapT = THREE.RepeatWrapping;
      diffTex.repeat.set(4, 4);
      mat.map = diffTex;
    }

    // --- bump map（繊維の凹凸） ---
    const bc = document.createElement('canvas');
    bc.width = 256; bc.height = 256;
    const bctx = bc.getContext('2d');
    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, 256, 256);
    // 繊維方向のストライプ
    for (let i = 0; i < 400; i++) {
      const y = Math.random() * 256;
      const v = 115 + Math.random() * 26;
      bctx.strokeStyle = `rgb(${v},${v},${v})`;
      bctx.lineWidth = 0.4 + Math.random() * 0.8;
      bctx.beginPath();
      bctx.moveTo(0, y);
      for (let x = 0; x < 256; x += 6) bctx.lineTo(x, y + (Math.random() - 0.5) * 1);
      bctx.stroke();
    }
    // ランダムな凹凸
    for (let i = 0; i < 8000; i++) {
      const v = 110 + Math.random() * 36;
      bctx.fillStyle = `rgb(${v},${v},${v})`;
      bctx.fillRect(Math.random() * 256, Math.random() * 256, 1, 1);
    }
    const bumpTex = new THREE.CanvasTexture(bc);
    bumpTex.wrapS = bumpTex.wrapT = THREE.RepeatWrapping;
    bumpTex.repeat.set(4, 4);
    mat.bumpMap = bumpTex;
    mat.bumpScale = 0.003;
  }

  function createWoodMaterial(woodImgTex) {
    const w = 512, h = 256;
    // --- diffuse ---
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    // ベースグラデーション（年輪方向）
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#6b3812');
    bg.addColorStop(0.25, '#7a4520');
    bg.addColorStop(0.5, '#5c2e0a');
    bg.addColorStop(0.75, '#7a4520');
    bg.addColorStop(1, '#6b3812');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    // 木目の筋（太さと間隔にバリエーション）
    for (let i = 0; i < 120; i++) {
      const y = Math.random() * h;
      const dark = Math.random() > 0.3;
      ctx.strokeStyle = dark
        ? `rgba(30, 15, 5, ${0.06 + Math.random() * 0.12})`
        : `rgba(100, 60, 25, ${0.04 + Math.random() * 0.06})`;
      ctx.lineWidth = 0.3 + Math.random() * 2.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      const freq = 0.01 + Math.random() * 0.025;
      const amp = 1 + Math.random() * 3;
      for (let x = 0; x < w; x += 6) ctx.lineTo(x, y + Math.sin(x * freq + i) * amp);
      ctx.stroke();
    }
    // 節（knot）をランダムに1-2個
    const knots = 1 + Math.floor(Math.random() * 2);
    for (let k = 0; k < knots; k++) {
      const kx = 80 + Math.random() * (w - 160);
      const ky = 40 + Math.random() * (h - 80);
      const kr = 8 + Math.random() * 12;
      const kg = ctx.createRadialGradient(kx, ky, 0, kx, ky, kr);
      kg.addColorStop(0, 'rgba(35, 18, 5, 0.6)');
      kg.addColorStop(0.5, 'rgba(50, 28, 10, 0.3)');
      kg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = kg;
      ctx.fillRect(kx - kr, ky - kr, kr * 2, kr * 2);
      // 節の周りに木目の歪み
      for (let r = 0; r < 5; r++) {
        ctx.strokeStyle = `rgba(40, 20, 8, ${0.08 + Math.random() * 0.08})`;
        ctx.lineWidth = 0.5 + Math.random();
        ctx.beginPath();
        ctx.arc(kx, ky, kr + 2 + r * 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    const diffTex = new THREE.CanvasTexture(c);
    diffTex.wrapS = diffTex.wrapT = THREE.RepeatWrapping;

    // --- roughness map（木目に沿って光沢ムラ） ---
    const rc = document.createElement('canvas');
    rc.width = 256; rc.height = 128;
    const rctx = rc.getContext('2d');
    rctx.fillStyle = '#999'; // roughness 0.6 ベース
    rctx.fillRect(0, 0, 256, 128);
    for (let i = 0; i < 80; i++) {
      const y = Math.random() * 128;
      const v = Math.random() > 0.5 ? 170 : 130; // 光沢ムラ
      rctx.strokeStyle = `rgb(${v},${v},${v})`;
      rctx.lineWidth = 0.5 + Math.random() * 1.5;
      rctx.beginPath();
      rctx.moveTo(0, y);
      for (let x = 0; x < 256; x += 8) rctx.lineTo(x, y + Math.sin(x * 0.02 + i) * 1.5);
      rctx.stroke();
    }
    const roughTex = new THREE.CanvasTexture(rc);
    roughTex.wrapS = roughTex.wrapT = THREE.RepeatWrapping;

    // --- bump map ---
    const bc = document.createElement('canvas');
    bc.width = 256; bc.height = 128;
    const bctx = bc.getContext('2d');
    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, 256, 128);
    for (let i = 0; i < 80; i++) {
      const y = Math.random() * 128;
      const v = 118 + Math.random() * 20;
      bctx.strokeStyle = `rgb(${v},${v},${v})`;
      bctx.lineWidth = 0.3 + Math.random() * 1.2;
      bctx.beginPath();
      bctx.moveTo(0, y);
      for (let x = 0; x < 256; x += 8) bctx.lineTo(x, y + Math.sin(x * 0.02 + i) * 1.5);
      bctx.stroke();
    }
    const bumpTex = new THREE.CanvasTexture(bc);
    bumpTex.wrapS = bumpTex.wrapT = THREE.RepeatWrapping;

    const mapTex = woodImgTex || diffTex;
    if (woodImgTex) { woodImgTex.repeat.set(2, 1); }
    return new THREE.MeshPhysicalMaterial({
      map: mapTex,
      roughnessMap: roughTex,
      roughness: 0.45,
      metalness: 0.0,
      bumpMap: bumpTex,
      bumpScale: 0.002,
      clearcoat: 0.15,
      clearcoatRoughness: 0.35,
      color: 0x3d1f0c,
    });
  }

  function createFloor() {
    const size = 512;
    // --- diffuse（フローリング風） ---
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#2a1c10';
    ctx.fillRect(0, 0, size, size);
    // 板目を描画（横方向のプランク）
    const plankH = 40 + Math.random() * 20;
    for (let py = 0; py < size; py += plankH) {
      // 各板に微妙な色差（やや明るく）
      const r = 32 + Math.floor(Math.random() * 20);
      const g = 20 + Math.floor(Math.random() * 14);
      const b = 10 + Math.floor(Math.random() * 8);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, py, size, plankH - 1);
      // 板の境界線（溝）
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, py + plankH - 1, size, 1);
      // 木目
      for (let i = 0; i < 15; i++) {
        const y = py + Math.random() * plankH;
        ctx.strokeStyle = `rgba(${30 + Math.random() * 20}, ${18 + Math.random() * 12}, ${6 + Math.random() * 8}, ${0.08 + Math.random() * 0.1})`;
        ctx.lineWidth = 0.5 + Math.random() * 1.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x < size; x += 10) ctx.lineTo(x, y + Math.sin(x * 0.012 + i) * 2);
        ctx.stroke();
      }
    }
    const diffTex = new THREE.CanvasTexture(c);
    diffTex.wrapS = diffTex.wrapT = THREE.RepeatWrapping;
    diffTex.repeat.set(6, 6);

    // --- bump map ---
    const bc = document.createElement('canvas');
    bc.width = 256; bc.height = 256;
    const bctx = bc.getContext('2d');
    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, 256, 256);
    // 板の溝
    for (let py = 0; py < 256; py += 20) {
      bctx.fillStyle = '#606060';
      bctx.fillRect(0, py + 19, 256, 1);
    }
    // 木目の凹凸
    for (let i = 0; i < 60; i++) {
      const y = Math.random() * 256;
      const v = 118 + Math.random() * 20;
      bctx.strokeStyle = `rgb(${v},${v},${v})`;
      bctx.lineWidth = 0.5 + Math.random() * 1;
      bctx.beginPath();
      bctx.moveTo(0, y);
      for (let x = 0; x < 256; x += 10) bctx.lineTo(x, y + Math.sin(x * 0.015 + i) * 1.5);
      bctx.stroke();
    }
    const bumpTex = new THREE.CanvasTexture(bc);
    bumpTex.wrapS = bumpTex.wrapT = THREE.RepeatWrapping;
    bumpTex.repeat.set(6, 6);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(5, 5),
      new THREE.MeshStandardMaterial({
        map: diffTex,
        bumpMap: bumpTex,
        bumpScale: 0.004,
        roughness: 0.55,
        metalness: 0.0,
        color: 0x3a2a18,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -(TABLE_LEG_HEIGHT + 0.001);
    floor.receiveShadow = true;
    scene.add(floor);
  }

  // ===== 環境オブジェクト（壁・ランプ） =====
  function createEnvironment() {
    const floorY = -(TABLE_LEG_HEIGHT + 0.001);

    // --- 背面の壁 ---
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x1a150f,
      roughness: 0.85,
      metalness: 0.0,
    });
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.5), wallMat);
    backWall.position.set(0, floorY + 1.25, -1.8);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // --- 左右の壁（薄暗く、フォグで消える） ---
    const sideWallMat = new THREE.MeshStandardMaterial({
      color: 0x16120c,
      roughness: 0.9,
      metalness: 0.0,
    });
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.5), sideWallMat);
    leftWall.position.set(-2.0, floorY + 1.25, -0.2);
    leftWall.rotation.y = Math.PI / 2;
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.5), sideWallMat);
    rightWall.position.set(2.0, floorY + 1.25, -0.2);
    rightWall.rotation.y = -Math.PI / 2;
    scene.add(rightWall);

    // --- ペンダントライト器具 ---
    // シェード（逆円錐台）
    const shadeMat = new THREE.MeshStandardMaterial({
      color: 0x2a2218,
      roughness: 0.4,
      metalness: 0.3,
      side: THREE.DoubleSide,
    });
    const shade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.10, 0.04, 16, 1, true),
      shadeMat
    );
    shade.position.set(0, 0.95, 0.25);
    scene.add(shade);

    // シェード上蓋
    const capMat = new THREE.MeshStandardMaterial({ color: 0x2a2218, roughness: 0.4, metalness: 0.3 });
    const cap = new THREE.Mesh(new THREE.CircleGeometry(0.06, 16), capMat);
    cap.rotation.x = -Math.PI / 2;
    cap.position.set(0, 0.97, 0.25);
    scene.add(cap);

    // 吊り下げロッド
    const rodMat = new THREE.MeshStandardMaterial({ color: 0x3a3028, roughness: 0.3, metalness: 0.4 });
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.5, 6), rodMat);
    rod.position.set(0, 1.22, 0.25);
    scene.add(rod);

    // 電球（発光体 — emissive で光る）
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xfff5e0,
      emissive: 0xfff0c8,
      emissiveIntensity: 0.8,
      roughness: 0.3,
      metalness: 0.0,
    });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.015, 12, 12), bulbMat);
    bulb.position.set(0, 0.94, 0.25);
    scene.add(bulb);
  }

  // ===== テクスチャ プリロード =====
  // 全34種のSVGをCanvas経由でTextureに変換しキャッシュ
  async function preloadTextures() {
    if (preloadDone) return Promise.resolve();

    const TILE_KEYS = [
      'm_1','m_2','m_3','m_4','m_5','m_6','m_7','m_8','m_9',
      'p_1','p_2','p_3','p_4','p_5','p_6','p_7','p_8','p_9',
      's_1','s_2','s_3','s_4','s_5','s_6','s_7','s_8','s_9',
      'z_東','z_南','z_西','z_北','z_白','z_発','z_中',
    ];

    const IMG_MAP = {
      m_1:'Man1',m_2:'Man2',m_3:'Man3',m_4:'Man4',m_5:'Man5',
      m_6:'Man6',m_7:'Man7',m_8:'Man8',m_9:'Man9',
      p_1:'Pin1',p_2:'Pin2',p_3:'Pin3',p_4:'Pin4',p_5:'Pin5',
      p_6:'Pin6',p_7:'Pin7',p_8:'Pin8',p_9:'Pin9',
      s_1:'Sou1',s_2:'Sou2',s_3:'Sou3',s_4:'Sou4',s_5:'Sou5',
      s_6:'Sou6',s_7:'Sou7',s_8:'Sou8',s_9:'Sou9',
      z_東:'Ton',z_南:'Nan',z_西:'Shaa',z_北:'Pei',
      z_白:'Haku',z_発:'Hatsu',z_中:'Chun',
    };

    // 表面ベーステクスチャをプリロード
    let faceBaseImg = null;
    const faceBasePromise = new Promise((resolve) => {
      const bi = new Image();
      bi.onload = () => { faceBaseImg = bi; resolve(); };
      bi.onerror = () => resolve();
      bi.src = 'tile-face-base.webp';
    });
    await faceBasePromise;

    const loadOne = (key) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = 128; c.height = 170;
        const ctx = c.getContext('2d');
        // 下地: 画像ベーステクスチャ優先、フォールバックでフラット象牙色
        if (faceBaseImg) {
          ctx.drawImage(faceBaseImg, 0, 0, 128, 170);
        } else {
          ctx.fillStyle = '#f5f0e0';
          ctx.fillRect(0, 0, 128, 170);
        }
        // SVG図柄を上に描画（マージン付き — 実物の牌は縁に余白がある）
        const mx = 12, my = 16; // 左右12px、上下16pxのマージン
        ctx.drawImage(img, mx, my, 128 - mx * 2, 170 - my * 2);
        const tex = new THREE.CanvasTexture(c);
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        textureCache.set(key, tex);
        resolve();
      };
      img.onerror = () => {
        // フォールバック: ?マーク
        const c = document.createElement('canvas');
        c.width = 64; c.height = 84;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#f0ead8';
        ctx.fillRect(0, 0, 64, 84);
        ctx.fillStyle = '#c00';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('?', 32, 52);
        textureCache.set(key, new THREE.CanvasTexture(c));
        resolve();
      };
      img.src = `tiles/${IMG_MAP[key]}.svg`;
    });

    // 裏面テクスチャ — 画像優先、フォールバックでプロシージャル
    const createBack = async () => {
      const imgTex = await loadImageTexture('tile-back.webp');
      if (imgTex) {
        imgTex.wrapS = imgTex.wrapT = THREE.ClampToEdgeWrapping;
        imgTex.minFilter = THREE.LinearMipmapLinearFilter;
        imgTex.magFilter = THREE.LinearFilter;
        backTexture = imgTex;
        return;
      }
      // フォールバック: プロシージャル
      const c = document.createElement('canvas');
      c.width = 128; c.height = 170;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#0a3d1c';
      ctx.fillRect(0, 0, 128, 170);
      ctx.strokeStyle = '#b89d45';
      ctx.lineWidth = 3;
      ctx.strokeRect(6, 8, 116, 154);
      ctx.save(); ctx.translate(64, 85);
      ctx.strokeStyle = 'rgba(184,157,69,0.3)';
      ctx.lineWidth = 1.5;
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath(); ctx.moveTo(i * 12, -55); ctx.lineTo(i * 12, 55); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-40, i * 15); ctx.lineTo(40, i * 15); ctx.stroke();
      }
      ctx.strokeStyle = '#b89d45'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -30); ctx.lineTo(25, 0); ctx.lineTo(0, 30); ctx.lineTo(-25, 0); ctx.closePath();
      ctx.stroke();
      ctx.restore();
      backTexture = new THREE.CanvasTexture(c);
    };

    // 側面テクスチャ
    const createSide = () => {
      const c = document.createElement('canvas');
      c.width = 32; c.height = 32;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#e8e0c8';
      ctx.fillRect(0, 0, 32, 32);
      sideTexture = new THREE.CanvasTexture(c);
    };

    await createBack();
    createSide();

    // 竹テクスチャもプリロード
    bambooImgTexCached = await loadImageTexture('bamboo-texture.webp');

    // GLB牌モデル: マテリアル・UV統合は後日対応
    // 現在はプロシージャル方式を使用

    return Promise.all(TILE_KEYS.map(loadOne)).then(() => {
      preloadDone = true;
    });
  }

  function getTileTexture(tile) {
    const key = MahjongEngine.tileKey(tile);
    return textureCache.get(key) || backTexture;
  }

  // ===== 角丸牌ジオメトリ（Group方式: 表面+裏面+側面を個別Meshで構成） =====
  function createRoundedRectPoints(w, h, r, segments) {
    // 角丸矩形の外周点を生成（反時計回り）
    const hw = w / 2, hh = h / 2;
    r = Math.min(r, hw, hh);
    const pts = [];
    const cornerSegs = segments;
    // 右下角
    for (let i = 0; i <= cornerSegs; i++) {
      const a = -Math.PI / 2 + (Math.PI / 2) * (i / cornerSegs);
      pts.push(new THREE.Vector2(hw - r + Math.cos(a) * r, -hh + r + Math.sin(a) * r));
    }
    // 右上角
    for (let i = 0; i <= cornerSegs; i++) {
      const a = 0 + (Math.PI / 2) * (i / cornerSegs);
      pts.push(new THREE.Vector2(hw - r + Math.cos(a) * r, hh - r + Math.sin(a) * r));
    }
    // 左上角
    for (let i = 0; i <= cornerSegs; i++) {
      const a = Math.PI / 2 + (Math.PI / 2) * (i / cornerSegs);
      pts.push(new THREE.Vector2(-hw + r + Math.cos(a) * r, hh - r + Math.sin(a) * r));
    }
    // 左下角
    for (let i = 0; i <= cornerSegs; i++) {
      const a = Math.PI + (Math.PI / 2) * (i / cornerSegs);
      pts.push(new THREE.Vector2(-hw + r + Math.cos(a) * r, -hh + r + Math.sin(a) * r));
    }
    return pts;
  }

  function createRoundedTileGroup(w, h, d, radius, cornerSegs, faceMat, backMat, sideMat, bambooMat) {
    const group = new THREE.Group();
    const hz = d / 2;
    const bambooRatio = 0.75; // 裏面側の竹層の厚み比率
    const splitZ = hz - d * bambooRatio; // 象牙層と竹層の境界Z座標
    const pts = createRoundedRectPoints(w, h, radius, cornerSegs);

    // --- 表面（+z方向を向く） ---
    const faceShape = new THREE.Shape();
    faceShape.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) faceShape.lineTo(pts[i].x, pts[i].y);
    faceShape.closePath();

    const faceGeom = new THREE.ShapeGeometry(faceShape);
    // UV を 0〜1 に正規化（ShapeGeometryはshape座標をそのままUVにするため）
    const faceUV = faceGeom.attributes.uv;
    const hw = w / 2, hh = h / 2;
    for (let i = 0; i < faceUV.count; i++) {
      faceUV.setXY(i,
        (faceUV.getX(i) + hw) / w,
        (faceUV.getY(i) + hh) / h
      );
    }
    faceUV.needsUpdate = true;
    const faceMesh = new THREE.Mesh(faceGeom, faceMat);
    faceMesh.position.z = hz;
    group.add(faceMesh);

    // --- 裏面（-z方向を向く） ---
    const backGeom = new THREE.ShapeGeometry(faceShape);
    // UV正規化
    const backUV = backGeom.attributes.uv;
    for (let i = 0; i < backUV.count; i++) {
      backUV.setXY(i,
        (backUV.getX(i) + hw) / w,
        (backUV.getY(i) + hh) / h
      );
    }
    backUV.needsUpdate = true;
    const backMesh = new THREE.Mesh(backGeom, backMat);
    backMesh.position.z = -hz;
    backMesh.scale.z = -1; // 法線反転
    group.add(backMesh);

    // --- 側面（2層構造: 象牙層 + 竹層） ---
    const n = pts.length;
    let totalLen = 0;
    const segLens = [];
    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n;
      const dx = pts[next].x - pts[i].x;
      const dy = pts[next].y - pts[i].y;
      segLens.push(Math.sqrt(dx * dx + dy * dy));
      totalLen += segLens[i];
    }

    // 帯状メッシュを生成するヘルパー（zTop〜zBottom の帯）
    function buildSideStrip(zTop, zBottom) {
      const pos = [], nrm = [], uv = [], idx = [];
      let cum = 0;
      for (let i = 0; i <= n; i++) {
        const ci = i % n;
        const prev = (ci + n - 1) % n;
        const next = (ci + 1) % n;
        const dx = pts[next].x - pts[prev].x;
        const dy = pts[next].y - pts[prev].y;
        const l = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = dy / l, ny = -dx / l;
        const u = cum / totalLen;
        pos.push(pts[ci].x, pts[ci].y, zTop);
        nrm.push(nx, ny, 0); uv.push(u, 1);
        pos.push(pts[ci].x, pts[ci].y, zBottom);
        nrm.push(nx, ny, 0); uv.push(u, 0);
        if (i < n) {
          const b = i * 2;
          idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
          cum += segLens[ci];
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx);
      return g;
    }

    // 象牙層（表面側 +z寄り）: +hz → splitZ — 大きい方
    const ivoryGeom = buildSideStrip(hz, splitZ);
    const ivorySideMesh = new THREE.Mesh(ivoryGeom, sideMat);
    ivorySideMesh.castShadow = true;
    ivorySideMesh.receiveShadow = true;
    group.add(ivorySideMesh);

    // 竹層（裏面側 -z寄り）: splitZ → -hz — 小さい方
    const bambooGeom = buildSideStrip(splitZ, -hz);
    const bambooSideMesh = new THREE.Mesh(bambooGeom, bambooMat);
    bambooSideMesh.castShadow = true;
    bambooSideMesh.receiveShadow = true;
    group.add(bambooSideMesh);

    faceMesh.castShadow = true;
    faceMesh.receiveShadow = true;
    backMesh.castShadow = true;

    // faceMesh を userData に保存（テクスチャ差し替え用）
    group.userData.faceMesh = faceMesh;

    return group;
  }

  // ===== 牌Meshプール =====
  let bambooImgTexCached = null;

  // GLBテンプレートキャッシュ
  let glbTileTemplate = null;

  function createPool() {
    if (poolCreated) return;
    poolCreated = true;

    // --- 側面用テクスチャ生成 ---
    // アイボリー繊維 diffuse
    const ivDiffC = document.createElement('canvas');
    ivDiffC.width = 128; ivDiffC.height = 128;
    const ivDiffCtx = ivDiffC.getContext('2d');
    ivDiffCtx.fillStyle = '#f0ead8';
    ivDiffCtx.fillRect(0, 0, 128, 128);
    // 象牙の微細な色ムラ
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 128, y = Math.random() * 128;
      const r = 10 + Math.random() * 30;
      const g = ivDiffCtx.createRadialGradient(x, y, 0, x, y, r);
      const warm = Math.random() > 0.5;
      g.addColorStop(0, warm ? 'rgba(245,235,210,0.15)' : 'rgba(230,220,195,0.15)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ivDiffCtx.fillStyle = g;
      ivDiffCtx.fillRect(0, 0, 128, 128);
    }
    // 細かい繊維筋（縦方向 — 牌の高さ方向）
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 128;
      const v = Math.random() > 0.5 ? 'rgba(220,210,185,0.12)' : 'rgba(245,238,218,0.1)';
      ivDiffCtx.strokeStyle = v;
      ivDiffCtx.lineWidth = 0.3 + Math.random() * 0.5;
      ivDiffCtx.beginPath();
      ivDiffCtx.moveTo(x, 0);
      for (let y = 0; y < 128; y += 6) ivDiffCtx.lineTo(x + (Math.random() - 0.5) * 1, y);
      ivDiffCtx.stroke();
    }
    const ivDiffTex = new THREE.CanvasTexture(ivDiffC);
    ivDiffTex.wrapS = ivDiffTex.wrapT = THREE.RepeatWrapping;

    // アイボリー bump（微細な凹凸）
    const ivBumpC = document.createElement('canvas');
    ivBumpC.width = 64; ivBumpC.height = 64;
    const ivBumpCtx = ivBumpC.getContext('2d');
    ivBumpCtx.fillStyle = '#808080';
    ivBumpCtx.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 2000; i++) {
      const v = 115 + Math.random() * 26;
      ivBumpCtx.fillStyle = `rgb(${v},${v},${v})`;
      ivBumpCtx.fillRect(Math.random() * 64, Math.random() * 64, 1, 1);
    }
    // 縦方向の繊維筋
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * 64;
      const v = 120 + Math.random() * 16;
      ivBumpCtx.strokeStyle = `rgb(${v},${v},${v})`;
      ivBumpCtx.lineWidth = 0.3 + Math.random() * 0.5;
      ivBumpCtx.beginPath();
      ivBumpCtx.moveTo(x, 0);
      for (let y = 0; y < 64; y += 4) ivBumpCtx.lineTo(x + (Math.random() - 0.5) * 0.5, y);
      ivBumpCtx.stroke();
    }
    const ivBumpTex = new THREE.CanvasTexture(ivBumpC);
    ivBumpTex.wrapS = ivBumpTex.wrapT = THREE.RepeatWrapping;

    // 側面マテリアル — 高級象牙風
    const ivoryMat = new THREE.MeshPhysicalMaterial({
      color: 0xf2ecda,
      map: ivDiffTex,
      roughness: 0.22,
      metalness: 0.0,
      clearcoat: 0.5,
      clearcoatRoughness: 0.15,
      bumpMap: ivBumpTex,
      bumpScale: 0.0008,
      sheen: 0.3,
      sheenColor: new THREE.Color(0xfff8e8),
    });

    // --- 裏面用テクスチャ ---
    const backDiffC = document.createElement('canvas');
    backDiffC.width = 64; backDiffC.height = 64;
    const backCtx = backDiffC.getContext('2d');
    backCtx.fillStyle = '#1a5a32';
    backCtx.fillRect(0, 0, 64, 64);
    // 格子模様（裏面の装飾）
    backCtx.strokeStyle = 'rgba(20, 80, 40, 0.3)';
    backCtx.lineWidth = 0.5;
    for (let i = 0; i < 64; i += 8) {
      backCtx.beginPath(); backCtx.moveTo(0, i); backCtx.lineTo(64, i); backCtx.stroke();
      backCtx.beginPath(); backCtx.moveTo(i, 0); backCtx.lineTo(i, 64); backCtx.stroke();
    }
    const backDiffTex = new THREE.CanvasTexture(backDiffC);

    const backMat = new THREE.MeshPhysicalMaterial({
      color: 0x0e4a25,
      map: backTexture,
      roughness: 0.25,
      metalness: 0.0,
      clearcoat: 0.4,
      clearcoatRoughness: 0.2,
    });

    // --- 竹層マテリアル（牌の裏面側の側面に使用） ---
    // プリロード済みの画像テクスチャ優先
    let bambooDiffTex;
    if (bambooImgTexCached) {
      bambooImgTexCached.wrapS = THREE.RepeatWrapping;
      bambooImgTexCached.wrapT = THREE.ClampToEdgeWrapping;
      bambooDiffTex = bambooImgTexCached;
    } else {
      // フォールバック: プロシージャル竹テクスチャ
      const bambooC = document.createElement('canvas');
      bambooC.width = 128; bambooC.height = 64;
      const bCtx = bambooC.getContext('2d');
      const bbg = bCtx.createLinearGradient(0, 0, 0, 64);
      bbg.addColorStop(0, '#c49a5c');
      bbg.addColorStop(0.5, '#a07038');
      bbg.addColorStop(1, '#c49a5c');
      bCtx.fillStyle = bbg;
      bCtx.fillRect(0, 0, 128, 64);
      for (let i = 0; i < 80; i++) {
        const y = Math.random() * 64;
        bCtx.strokeStyle = `rgba(100,65,25,${0.06 + Math.random() * 0.1})`;
        bCtx.lineWidth = 0.3 + Math.random() * 1.5;
        bCtx.beginPath(); bCtx.moveTo(0, y);
        for (let x = 0; x < 128; x += 8) bCtx.lineTo(x, y + (Math.random() - 0.5) * 0.8);
        bCtx.stroke();
      }
      bambooDiffTex = new THREE.CanvasTexture(bambooC);
      bambooDiffTex.wrapS = bambooDiffTex.wrapT = THREE.RepeatWrapping;
    }

    const bambooMat = new THREE.MeshPhysicalMaterial({
      color: 0x9a7035,
      map: bambooDiffTex,
      roughness: 0.38,
      metalness: 0.0,
      clearcoat: 0.3,
      clearcoatRoughness: 0.25,
    });

    for (let i = 0; i < POOL_SIZE; i++) {
      let tileGroup;
      const faceMat = new THREE.MeshBasicMaterial({ color: 0xffffff }); // SVG差し替え用

      if (glbTileTemplate) {
        // --- GLBクローン方式 ---
        tileGroup = new THREE.Group();
        // GLBシーンの子メッシュをクローンしてGroupに追加
        glbTileTemplate.traverse((child) => {
          if (!child.isMesh) return;
          const clone = child.clone();
          clone.material = clone.material.clone(); // マテリアルを個別化
          const matName = child.material.name || '';
          if (matName === 'face') {
            clone.material = faceMat;
          } else if (matName === 'back') {
            clone.material = backMat;
          } else {
            clone.material = ivoryMat;
          }
          clone.castShadow = true;
          clone.receiveShadow = true;
          tileGroup.add(clone);
        });
        // GLBモデルはTILE_W/H/Dに正確にスケール済み
      } else {
        // --- プロシージャル方式（フォールバック） ---
        tileGroup = createRoundedTileGroup(
          TILE_W, TILE_H, TILE_D, 0.0015, 3,
          faceMat, backMat, ivoryMat, bambooMat
        );
      }

      tileGroup.visible = false;
      tileGroup.userData.faceMat = faceMat; // テクスチャ差し替え用に保持
      tilesGroup.add(tileGroup);
      tilePool.push(tileGroup);
    }
  }

  // 牌テクスチャを差し替え（Group方式対応）
  function setTileTexture(tileGroup, tile) {
    const tex = getTileTexture(tile);
    const faceMat = tileGroup.userData.faceMat;
    if (faceMat) {
      faceMat.map = tex;
      faceMat.needsUpdate = true;
    }
  }

  // ===== 手牌描画（テクスチャ差し替えのみ） =====
  function renderHand3D(hand, tsumoTile, isWin) {
    const handCount = hand.length;
    const hasTsumo = !!tsumoTile;
    const totalTiles = handCount + (hasTsumo ? 1 : 0);

    // 配置計算
    const totalWidth = handCount * (TILE_W + TILE_GAP) - TILE_GAP;
    const tsumoGap = TILE_W * 0.6;
    const fullWidth = totalWidth + (hasTsumo ? tsumoGap + TILE_W : 0);
    const startX = -fullWidth / 2;
    const z = TABLE_SIZE / 2 - 0.08;   // 手前の木枠内側
    const baseY = 0.002 + TILE_H / 2;  // フェルト面上に立てる

    // プール内の牌を配置
    for (let i = 0; i < POOL_SIZE; i++) {
      const mesh = tilePool[i];
      if (i < handCount) {
        // 手牌
        const x = startX + i * (TILE_W + TILE_GAP) + TILE_W / 2;
        mesh.position.set(x, baseY, z);
        mesh.rotation.set(0, 0, 0);
        setTileTexture(mesh, hand[i]);
        mesh.visible = true;
        mesh.userData.baseY = baseY;
        mesh.userData.isWinTile = isWin;
        mesh.userData.isTsumo = false;
      } else if (i === handCount && hasTsumo) {
        // ツモ牌
        const x = startX + handCount * (TILE_W + TILE_GAP) + tsumoGap + TILE_W / 2;
        mesh.position.set(x, baseY, z);
        mesh.rotation.set(0, 0, 0);
        setTileTexture(mesh, tsumoTile);
        mesh.visible = true;
        mesh.userData.baseY = baseY;
        mesh.userData.isWinTile = isWin;
        mesh.userData.isTsumo = true;
      } else {
        mesh.visible = false;
      }
    }

    needsRender = true;

    if (isWin) {
      startWinAnimation();
    }
  }

  // ===== 勝利演出 =====
  let winAnimActive = false;
  let winAnimTime = 0;
  let winParticlesMesh = null;
  let winVelocities = [];
  let winGlowLight = null;

  function startWinAnimation() {
    winAnimActive = true;
    winAnimTime = 0;

    // CSS Bloom風グロー
    if (container) container.classList.add('win-glow');

    // 金色のポイントライトを牌の上に追加（光のパルス演出）
    winGlowLight = new THREE.PointLight(0xffd700, 0, 1, 2);
    winGlowLight.position.set(0, 0.08, TABLE_SIZE / 2 - 0.08);
    scene.add(winGlowLight);

    // 3Dパーティクル（牌の上方から噴出）
    const count = 200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    winVelocities = [];

    const goldColors = [
      new THREE.Color(0xffd700),
      new THREE.Color(0xe8c96a),
      new THREE.Color(0xc8a84b),
      new THREE.Color(0xffffff),
      new THREE.Color(0xffaa00),
    ];

    for (let i = 0; i < count; i++) {
      // 牌列の上方から放射状に発生
      positions[i * 3]     = (Math.random() - 0.5) * 0.35;
      positions[i * 3 + 1] = 0.04 + Math.random() * 0.02;
      positions[i * 3 + 2] = TABLE_SIZE / 2 - 0.08 + (Math.random() - 0.5) * 0.03;

      const c = goldColors[Math.floor(Math.random() * goldColors.length)];
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;

      winVelocities.push({
        vx: (Math.random() - 0.5) * 0.012,
        vy: 0.015 + Math.random() * 0.03,   // 上方向に強く
        vz: (Math.random() - 0.5) * 0.008,
        gravity: -0.0004,
        life: 1.0,
        decay: 0.003 + Math.random() * 0.006,
      });
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.006,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    winParticlesMesh = new THREE.Points(geom, mat);
    scene.add(winParticlesMesh);
  }

  function updateWinAnimation(dt) {
    if (!winAnimActive) return;
    winAnimTime += dt;

    // パーティクル更新
    if (winParticlesMesh) {
      const pos = winParticlesMesh.geometry.attributes.position;
      let anyAlive = false;
      for (let i = 0; i < winVelocities.length; i++) {
        const v = winVelocities[i];
        v.life -= v.decay;
        if (v.life <= 0) continue;
        anyAlive = true;
        pos.array[i * 3]     += v.vx;
        pos.array[i * 3 + 1] += v.vy;
        pos.array[i * 3 + 2] += v.vz;
        v.vy += v.gravity;
      }
      pos.needsUpdate = true;
      winParticlesMesh.material.opacity = Math.max(0, 1 - winAnimTime / 4);
    }

    // 金色ライトのパルス（ふわっと光ってゆっくり消える）
    if (winGlowLight) {
      if (winAnimTime < 0.5) {
        // 0〜0.5秒: ふわっと光る
        winGlowLight.intensity = 3 * (winAnimTime / 0.5);
      } else if (winAnimTime < 2.5) {
        // 0.5〜2.5秒: ゆっくり脈動
        winGlowLight.intensity = 2 + Math.sin(winAnimTime * 4) * 1;
      } else {
        // 2.5秒〜: フェードアウト
        winGlowLight.intensity = Math.max(0, 3 * (1 - (winAnimTime - 2.5) / 1.5));
      }
    }

    // 牌の演出: 順番にせり上がるウェーブ（上方向のみ、めり込まない）
    tilePool.forEach((mesh, i) => {
      if (!mesh.visible || !mesh.userData.isWinTile) return;
      const baseY = mesh.userData.baseY;

      // 各牌が順番にせり上がる（ディレイ付き）
      const delay = i * 0.08;
      const t = Math.max(0, winAnimTime - delay);

      if (t <= 0) return;

      // せり上がり（最初の0.3秒で上昇、その後ゆっくり浮遊）
      let liftY = 0;
      if (t < 0.3) {
        // イーズアウトで上昇
        const p = t / 0.3;
        liftY = 0.008 * (1 - (1 - p) * (1 - p));
      } else {
        // 浮遊（ゆっくり上下、常にbaseYより上）
        liftY = 0.008 + Math.sin((t - 0.3) * 3 + i * 0.4) * 0.002;
      }

      // 手前に少し傾ける（表面がもっと見える）
      const tiltX = t < 0.3 ? -0.08 * (t / 0.3) : -0.08;

      mesh.position.y = baseY + liftY;
      mesh.rotation.x = tiltX;
    });

    if (winAnimTime > 4) {
      stopWinAnimation();
    }
  }

  function stopWinAnimation() {
    winAnimActive = false;
    // CSS Bloom風グロー解除
    if (container) container.classList.remove('win-glow');
    if (winParticlesMesh) {
      scene.remove(winParticlesMesh);
      winParticlesMesh.geometry.dispose();
      winParticlesMesh.material.dispose();
      winParticlesMesh = null;
    }
    if (winGlowLight) {
      scene.remove(winGlowLight);
      winGlowLight.dispose();
      winGlowLight = null;
    }
    winVelocities = [];
    // 牌の位置・回転をリセット
    tilePool.forEach(mesh => {
      if (mesh.userData.baseY !== undefined) {
        mesh.position.y = mesh.userData.baseY;
        mesh.rotation.x = 0;
      }
    });
  }

  // ===== レンダーループ =====
  let needsRender = true;
  let lastRenderTime = 0;

  function renderLoop(time) {
    animFrameId = requestAnimationFrame(renderLoop);
    const dt = (time - lastRenderTime) / 1000 || 0.016;
    lastRenderTime = time;

    if (winAnimActive) {
      updateWinAnimation(dt);
      needsRender = true;
    }

    if (needsRender) {
      renderer.render(scene, camera);
      needsRender = false;
    }
  }

  function onResize() {
    if (!container || !camera || !renderer) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    needsRender = true;
  }

  function dispose() {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    window.removeEventListener('resize', onResize);
    if (renderer) {
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    }
    textureCache.forEach(t => t.dispose());
    textureCache.clear();
  }

  return {
    init,
    preloadTextures,
    createPool,
    renderHand3D,
    stopWinAnimation,
    dispose,
    requestRender() { needsRender = true; },
    get isWinAnimating() { return winAnimActive; },
  };
})();

window.ThreeScene = ThreeScene;
