/* =========================================================================
   Pixel Runner — a tiny endless-runner. Space (or tap) to jump.
   Pure pixel art rendered on a low-res back-buffer and scaled up crisply.
   ========================================================================= */
(function () {
  const stage = document.getElementById('game-stage');
  const canvas = document.getElementById('game-canvas');
  const overlay = document.getElementById('game-overlay');
  const overlayTitle = document.getElementById('game-overlay-title');
  const overlayBody = document.getElementById('game-overlay-body');
  const scoreEl = document.getElementById('game-score');
  const bestEl = document.getElementById('game-best');
  if (!canvas) return;

  // Internal pixel-art resolution
  const W = 480; // logical px
  const H = 90;
  const FLOOR_Y = 72;

  // Display size driven by container
  function fitCanvas() {
    const stageW = stage.clientWidth;
    const stageH = 180;
    const scale = Math.max(1, Math.floor(stageW / W));
    canvas.width = W * scale;
    canvas.height = H * scale;
    canvas.style.width = stageW + 'px';
    canvas.style.height = stageH + 'px';
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

  const ctx = canvas.getContext('2d');
  fitCanvas();
  window.addEventListener('resize', fitCanvas);

  // ----------- Palette (Omelas paper + thermal accents) -----------
  const C = {
    sky:     '#FAFAF8',
    ground:  '#E8E3DC',
    line:    '#918C87',
    dust:    '#C8C2BB',
    body:    '#1A1A1A',
    skin:    '#F7C92E', // thermal amber for the runner — a little personality
    cactus:  '#B5278F', // thermal magenta — obstacles
    cactus2: '#F26B1F', // thermal orange — alt obstacle
    cloud:   '#F0ECE7',
    bird:    '#6B6662',
    sunGlow: '#FFE0A6',
  };

  // ----------- Game state -----------
  const STATES = { IDLE: 0, RUN: 1, DEAD: 2 };
  let state = STATES.IDLE;
  let score = 0;
  let best = +(localStorage.getItem('onurkarali_runner_best') || 0);
  bestEl.textContent = String(best).padStart(5, '0');
  scoreEl.textContent = '00000';

  // Player
  const player = {
    x: 40, y: FLOOR_Y - 16, w: 12, h: 16,
    vy: 0, onGround: true,
    runFrame: 0, runAccum: 0,
  };
  const GRAVITY = 1700;       // px/s^2
  const JUMP_V = -480;        // initial jump velocity
  const SPEED_START = 170;    // px/s of world
  let worldSpeed = SPEED_START;

  // World scroll for parallax
  let groundOffset = 0;
  let bgOffset = 0;
  let timeAccum = 0;

  // Obstacles
  const obstacles = []; // {x, y, w, h, kind}
  let nextSpawn = 1.0;  // seconds until next

  // Clouds (decorative)
  const clouds = [];
  function seedClouds() {
    clouds.length = 0;
    for (let i = 0; i < 4; i++) {
      clouds.push({ x: Math.random() * W, y: 12 + Math.random() * 20, w: 16 + Math.random() * 18, s: 0.2 + Math.random() * 0.3 });
    }
  }
  seedClouds();

  function resetGame() {
    obstacles.length = 0;
    nextSpawn = 1.0;
    worldSpeed = SPEED_START;
    score = 0;
    player.y = FLOOR_Y - player.h;
    player.vy = 0;
    player.onGround = true;
    player.runFrame = 0;
    seedClouds();
  }

  function startGame() {
    if (state === STATES.RUN) return;
    resetGame();
    state = STATES.RUN;
    overlay.classList.add('hidden');
  }

  function gameOver() {
    state = STATES.DEAD;
    const intScore = Math.floor(score);
    if (intScore > best) {
      best = intScore;
      localStorage.setItem('onurkarali_runner_best', String(best));
      bestEl.textContent = String(best).padStart(5, '0');
    }
    overlayTitle.textContent = 'Game over · ' + intScore;
    overlayBody.innerHTML = 'Press <span class="kbd">Space</span> to retry';
    overlay.classList.remove('hidden');
  }

  function tryJump() {
    if (state === STATES.RUN && player.onGround) {
      player.vy = JUMP_V;
      player.onGround = false;
    }
  }

  // ----------- Input -----------
  function handleKey(e) {
    if (e.code === 'Space' || e.key === ' ' || e.code === 'ArrowUp') {
      e.preventDefault();
      if (state === STATES.RUN) tryJump();
      else startGame();
    }
  }
  window.addEventListener('keydown', handleKey);
  stage.addEventListener('click', () => {
    if (state === STATES.RUN) tryJump();
    else startGame();
  });
  stage.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (state === STATES.RUN) tryJump();
    else startGame();
  }, { passive: false });

  // ----------- Spawning -----------
  function spawnObstacle() {
    // Two kinds: small cactus and tall pillar; occasionally a "double"
    const r = Math.random();
    let w, h, kind;
    if (r < 0.55) { w = 7; h = 14; kind = 'small'; }
    else if (r < 0.85) { w = 10; h = 20; kind = 'tall'; }
    else { w = 14; h = 14; kind = 'double'; }
    obstacles.push({ x: W + 4, y: FLOOR_Y - h, w, h, kind });
    // Spawn interval scales with speed (denser as faster)
    const base = Math.max(0.55, 110 / worldSpeed);
    nextSpawn = base + Math.random() * 0.7;
  }

  // ----------- Drawing helpers -----------
  function drawPixel(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function drawRunner(px, py, frame) {
    // 12x16 chunky pixel runner. Body in primary, head amber.
    // Legs alternate based on frame.
    const f = frame % 2;
    // Head
    drawPixel(px + 3, py, 6, 5, C.body);
    drawPixel(px + 4, py + 1, 4, 3, C.skin); // amber face
    // Eye
    drawPixel(px + 7, py + 2, 1, 1, C.body);
    // Body
    drawPixel(px + 2, py + 5, 8, 6, C.body);
    // Arm
    drawPixel(px, py + 6, 3, 3, C.body);
    drawPixel(px + 9, py + 6, 3, 3, C.body);
    // Legs
    if (f === 0) {
      drawPixel(px + 3, py + 11, 2, 5, C.body);
      drawPixel(px + 7, py + 11, 2, 4, C.body);
      drawPixel(px + 7, py + 14, 3, 2, C.body); // forward foot
    } else {
      drawPixel(px + 3, py + 11, 2, 4, C.body);
      drawPixel(px + 1, py + 14, 3, 2, C.body);
      drawPixel(px + 7, py + 11, 2, 5, C.body);
    }
  }

  function drawJumping(px, py) {
    // Tucked pose
    drawPixel(px + 3, py, 6, 5, C.body);
    drawPixel(px + 4, py + 1, 4, 3, C.skin);
    drawPixel(px + 7, py + 2, 1, 1, C.body);
    drawPixel(px + 2, py + 5, 8, 6, C.body);
    drawPixel(px, py + 5, 3, 3, C.body);
    drawPixel(px + 9, py + 5, 3, 3, C.body);
    drawPixel(px + 3, py + 11, 3, 4, C.body);
    drawPixel(px + 7, py + 11, 3, 4, C.body);
  }

  function drawDead(px, py) {
    drawPixel(px + 3, py, 6, 5, C.body);
    drawPixel(px + 4, py + 1, 4, 3, C.skin);
    // X eye
    drawPixel(px + 6, py + 2, 1, 1, C.body);
    drawPixel(px + 8, py + 2, 1, 1, C.body);
    drawPixel(px + 2, py + 5, 8, 6, C.body);
    drawPixel(px, py + 7, 3, 2, C.body);
    drawPixel(px + 9, py + 7, 3, 2, C.body);
    drawPixel(px + 3, py + 11, 2, 5, C.body);
    drawPixel(px + 7, py + 11, 2, 5, C.body);
  }

  function drawCactus(o) {
    const c1 = o.kind === 'double' ? C.cactus2 : C.cactus;
    if (o.kind === 'small') {
      // simple 7x14
      drawPixel(o.x + 2, o.y, 3, o.h, c1);
      drawPixel(o.x, o.y + 5, 2, 4, c1);
      drawPixel(o.x + 5, o.y + 3, 2, 4, c1);
    } else if (o.kind === 'tall') {
      // 10x20
      drawPixel(o.x + 4, o.y, 3, o.h, c1);
      drawPixel(o.x + 1, o.y + 4, 3, 6, c1);
      drawPixel(o.x + 7, o.y + 2, 3, 7, c1);
      drawPixel(o.x + 1, o.y + 4, 2, 2, c1);
    } else {
      // double 14x14 - twin pillars
      drawPixel(o.x, o.y + 2, 4, o.h - 2, c1);
      drawPixel(o.x + 9, o.y, 4, o.h, c1);
      drawPixel(o.x + 4, o.y + 8, 5, 3, c1);
    }
    // base shadow tick
    drawPixel(o.x, FLOOR_Y, o.w, 1, C.line);
  }

  function drawCloud(c) {
    drawPixel(c.x, c.y + 2, c.w, 3, C.cloud);
    drawPixel(c.x + 3, c.y, c.w - 6, 3, C.cloud);
    drawPixel(c.x + 6, c.y - 2, c.w - 12, 2, C.cloud);
  }

  function drawScene() {
    // Sky
    ctx.fillStyle = C.sky;
    ctx.fillRect(0, 0, W, H);

    // Sun glow — a soft circle in top-right (rendered chunky)
    ctx.fillStyle = C.sunGlow;
    const sx = W - 60, sy = 14, sr = 10;
    for (let y = -sr; y <= sr; y++) {
      for (let x = -sr; x <= sr; x++) {
        if (x*x + y*y <= sr*sr) {
          ctx.fillRect(sx + x, sy + y, 1, 1);
        }
      }
    }
    ctx.fillStyle = C.cactus;
    for (let y = -4; y <= 4; y++) {
      for (let x = -4; x <= 4; x++) {
        if (x*x + y*y <= 16) ctx.fillRect(sx + x, sy + y, 1, 1);
      }
    }

    // Clouds
    for (const c of clouds) drawCloud(c);

    // Ground line
    drawPixel(0, FLOOR_Y, W, 1, C.line);

    // Ground dashes — parallax
    ctx.fillStyle = C.dust;
    const dashGap = 22;
    let dx = -((groundOffset) % dashGap);
    for (; dx < W; dx += dashGap) {
      ctx.fillRect(dx, FLOOR_Y + 4, 8, 1);
    }
    // Pebbles row
    ctx.fillStyle = C.line;
    let dx2 = -((groundOffset * 0.8) % 35);
    for (; dx2 < W; dx2 += 35) {
      ctx.fillRect(dx2, FLOOR_Y + 9, 2, 1);
    }

    // Obstacles
    for (const o of obstacles) drawCactus(o);

    // Player
    if (state === STATES.DEAD) {
      drawDead(player.x, player.y);
    } else if (!player.onGround) {
      drawJumping(player.x, player.y);
    } else {
      drawRunner(player.x, player.y, Math.floor(player.runFrame));
    }
  }

  // ----------- Main loop -----------
  let lastT = performance.now();
  function tick(now) {
    requestAnimationFrame(tick);
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;

    if (state === STATES.RUN) {
      timeAccum += dt;
      // Speed ramp: linear over time, capped
      worldSpeed = Math.min(360, SPEED_START + timeAccum * 8);

      // Score increments at ~10/s at base speed
      score += dt * (worldSpeed / SPEED_START) * 12;
      scoreEl.textContent = String(Math.floor(score)).padStart(5, '0');

      // Move world
      groundOffset += worldSpeed * dt;
      bgOffset += worldSpeed * 0.3 * dt;

      // Clouds drift
      for (const c of clouds) {
        c.x -= c.s * worldSpeed * dt;
        if (c.x + c.w < 0) {
          c.x = W + Math.random() * 40;
          c.y = 8 + Math.random() * 24;
        }
      }

      // Spawn
      nextSpawn -= dt;
      if (nextSpawn <= 0) spawnObstacle();

      // Move obstacles + collision
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        o.x -= worldSpeed * dt;
        if (o.x + o.w < -2) {
          obstacles.splice(i, 1);
          continue;
        }
        // AABB collision with shrunk player hitbox for fairness
        const px = player.x + 2, py = player.y + 2;
        const pw = player.w - 4, ph = player.h - 3;
        if (px < o.x + o.w && px + pw > o.x &&
            py < o.y + o.h && py + ph > o.y) {
          gameOver();
        }
      }

      // Physics
      player.vy += GRAVITY * dt;
      player.y += player.vy * dt;
      if (player.y >= FLOOR_Y - player.h) {
        player.y = FLOOR_Y - player.h;
        player.vy = 0;
        player.onGround = true;
      }

      // Run animation
      player.runAccum += dt;
      if (player.runAccum > 0.09) { player.runAccum = 0; player.runFrame++; }
    }

    drawScene();
  }

  // Initial overlay state
  overlayTitle.textContent = 'Pixel Runner';
  overlayBody.innerHTML = 'Press <span class="kbd">Space</span> to start · <span class="kbd">Space</span> to jump';

  requestAnimationFrame(tick);
})();
