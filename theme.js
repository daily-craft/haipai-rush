// ===== パーティクル演出 =====
const canvas  = document.getElementById('particle-canvas');
const ctx     = canvas.getContext('2d');
let particles = [];
let animId    = null;

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const PARTICLE_COLORS = ['#c8a84b','#e8c96a','#ffd700','#ffffff','#a06010','#ffe08a'];

function createParticle(x, y, color) {
  const angle = Math.random() * Math.PI * 2;
  const speed = 4 + Math.random() * 12;
  const size  = 4 + Math.random() * 9;
  const type  = Math.random() < 0.35 ? 'star' : 'circle';
  return {
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 5,
    size,
    color,
    alpha: 1,
    gravity: 0.28 + Math.random() * 0.2,
    decay:   0.016 + Math.random() * 0.01,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.25,
    type,
  };
}

function drawStar(cx, cy, r, rot) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    ctx.lineTo(Math.cos((i * 4 * Math.PI) / 5) * r,        Math.sin((i * 4 * Math.PI) / 5) * r);
    ctx.lineTo(Math.cos(((i * 4 + 2) * Math.PI) / 5) * r * 0.4, Math.sin(((i * 4 + 2) * Math.PI) / 5) * r * 0.4);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function updateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles = particles.filter(p => p.alpha > 0.01);

  for (const p of particles) {
    p.x  += p.vx;
    p.y  += p.vy;
    p.vy += p.gravity;
    p.vx *= 0.98;
    p.alpha    -= p.decay;
    p.rotation += p.rotSpeed;

    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle   = p.color;

    if (p.type === 'star') {
      drawStar(p.x, p.y, p.size, p.rotation);
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.globalAlpha = 1;

  if (particles.length > 0) {
    animId = requestAnimationFrame(updateParticles);
  } else {
    animId = null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function fireParticles() {
  const cx = window.innerWidth  / 2;
  const cy = window.innerHeight / 2;

  // 中央から大爆発
  for (let i = 0; i < 160; i++) {
    particles.push(createParticle(
      cx + (Math.random() - 0.5) * 240,
      cy + (Math.random() - 0.5) * 120,
      PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)]
    ));
  }

  // 左右の端からも打ち上げ
  for (let i = 0; i < 40; i++) {
    const side = Math.random() < 0.5 ? cx * 0.3 : cx * 1.7;
    const p = createParticle(side, cy * 0.8,
      PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)]);
    p.vy = -(6 + Math.random() * 8);
    p.vx = (Math.random() - 0.5) * 6;
    p.gravity = 0.15;
    p.decay   = 0.01;
    particles.push(p);
  }

  // 上部から降り注ぐ
  for (let i = 0; i < 80; i++) {
    const p = createParticle(
      Math.random() * window.innerWidth,
      -20,
      PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)]
    );
    p.vy = Math.random() * 4 + 1;
    p.vx = (Math.random() - 0.5) * 5;
    p.gravity = 0.08;
    p.decay   = 0.007;
    particles.push(p);
  }

  if (!animId) animId = requestAnimationFrame(updateParticles);
}

window.fireParticles = fireParticles;
