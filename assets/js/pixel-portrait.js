/* =========================================================================
   Pixel Portrait — thermal photo sampled to a grid; mouse causes
   ripple waves to propagate, displacing each pixel like water.
   ========================================================================= */
(function () {
  const canvas = document.getElementById('portrait-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  // Logical display size
  const CSS_SIZE = canvas.clientWidth;
  canvas.width = CSS_SIZE * dpr;
  canvas.height = CSS_SIZE * dpr;
  ctx.scale(dpr, dpr);

  // Grid resolution (how chunky the pixels are)
  const GRID = 56; // 56x56 pixel grid
  const cell = CSS_SIZE / GRID;

  // Offscreen canvas to sample the source image
  const sampler = document.createElement('canvas');
  sampler.width = GRID;
  sampler.height = GRID;
  const sctx = sampler.getContext('2d', { willReadFrequently: true });

  // Pixel buffer of base colors
  let pixels = null; // Uint8ClampedArray

  // Ambient noise — gentle baseline shimmer
  const tStart = performance.now();

  // Ripples emitted by the mouse
  const ripples = [];
  const RIPPLE_SPEED = 120; // px / s in CSS units
  const RIPPLE_WAVELEN = 50; // px
  const RIPPLE_LIFE = 1400; // ms
  const RIPPLE_AMP = 0.55;  // peak displacement amplitude in cell units

  let mouse = { x: -999, y: -999, inside: false };

  function spawnRipple(x, y) {
    ripples.push({ x, y, t0: performance.now() });
    if (ripples.length > 18) ripples.shift();
  }

  // Load image and seed pixels
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    // Draw cover-fit into sampler
    const ratio = Math.max(GRID / img.width, GRID / img.height);
    const dw = img.width * ratio;
    const dh = img.height * ratio;
    sctx.imageSmoothingEnabled = true;
    sctx.drawImage(img, (GRID - dw) / 2, (GRID - dh) / 2, dw, dh);
    pixels = sctx.getImageData(0, 0, GRID, GRID).data;
    requestAnimationFrame(draw);
  };
  img.onerror = () => {
    // fallback gradient so we still see something
    pixels = new Uint8ClampedArray(GRID * GRID * 4);
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const i = (y * GRID + x) * 4;
        const t = (x + y) / (GRID * 2);
        pixels[i + 0] = 181 + 60 * t;
        pixels[i + 1] = 39 + 100 * t;
        pixels[i + 2] = 143 - 80 * t;
        pixels[i + 3] = 255;
      }
    }
    requestAnimationFrame(draw);
  };
  img.src = '/assets/portrait-thermal.jpg';

  function computeDisplacement(px, py, now) {
    // Sum contributions from ripples + ambient
    let dx = 0, dy = 0, brightness = 0;

    for (let i = 0; i < ripples.length; i++) {
      const r = ripples[i];
      const age = (now - r.t0) / 1000;
      if (age * 1000 > RIPPLE_LIFE) continue;
      const fade = Math.max(0, 1 - (age * 1000) / RIPPLE_LIFE);
      const dxr = px - r.x;
      const dyr = py - r.y;
      const dist = Math.sqrt(dxr * dxr + dyr * dyr) + 0.0001;
      const front = age * RIPPLE_SPEED;
      // bell-shaped envelope around the wavefront
      const sigma = 28;
      const env = Math.exp(-Math.pow(dist - front, 2) / (2 * sigma * sigma));
      const phase = (dist - front) / RIPPLE_WAVELEN * Math.PI * 2;
      const amp = Math.sin(phase) * env * fade * RIPPLE_AMP * cell;
      // direction: outward from ripple center
      dx += (dxr / dist) * amp;
      dy += (dyr / dist) * amp;
      brightness += env * fade * 0.35;
    }

    // Ambient sine for subtle "alive" feel
    const tt = (now - tStart) / 1000;
    const amb = 0.12 * cell;
    dx += Math.sin(tt * 0.6 + py * 0.06) * amb * 0.25;
    dy += Math.cos(tt * 0.55 + px * 0.05) * amb * 0.25;

    return { dx, dy, brightness };
  }

  // Slight color boost helper
  function clamp255(v) { return v < 0 ? 0 : v > 255 ? 255 : v; }

  function draw(now) {
    requestAnimationFrame(draw);
    if (!pixels) return;

    ctx.clearRect(0, 0, CSS_SIZE, CSS_SIZE);

    // Background pad — near-black so dark cells blend
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(0, 0, CSS_SIZE, CSS_SIZE);

    for (let gy = 0; gy < GRID; gy++) {
      for (let gx = 0; gx < GRID; gx++) {
        const i = (gy * GRID + gx) * 4;
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];

        const baseX = gx * cell + cell / 2;
        const baseY = gy * cell + cell / 2;

        const { dx, dy, brightness } = computeDisplacement(baseX, baseY, now);

        // size dips/bulges with displacement magnitude (water surface tension)
        const mag = Math.sqrt(dx * dx + dy * dy);
        const sizeMul = 1.0 + Math.min(0.45, mag / cell * 0.55);
        // +0.6 to defeat sub-pixel seams between adjacent cells
        const s = cell * sizeMul + 0.6;

        // boost brightness near wavefronts
        const bb = brightness;
        const rr = clamp255(r + bb * 90);
        const gg = clamp255(g + bb * 70);
        const bbb = clamp255(b + bb * 30);

        ctx.fillStyle = 'rgb(' + rr + ',' + gg + ',' + bbb + ')';
        ctx.fillRect(
          (baseX + dx) - s / 2,
          (baseY + dy) - s / 2,
          s,
          s
        );
      }
    }
  }

  // ---------------- Mouse interaction ----------------
  let lastSpawn = 0;
  const SPAWN_INTERVAL = 70; // ms between auto-ripples while dragging mouse

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);

    const moved = Math.hypot(x - mouse.x, y - mouse.y);
    mouse.x = x; mouse.y = y; mouse.inside = true;

    const now = performance.now();
    // Spawn ripples while moving — denser near fast cursor
    if (moved > 4 && now - lastSpawn > SPAWN_INTERVAL) {
      spawnRipple(x, y);
      lastSpawn = now;
    }
  });

  canvas.addEventListener('mouseenter', (e) => {
    const rect = canvas.getBoundingClientRect();
    spawnRipple(e.clientX - rect.left, e.clientY - rect.top);
  });

  canvas.addEventListener('mouseleave', () => { mouse.inside = false; });

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    // Two ripples for a stronger splash
    spawnRipple(e.clientX - rect.left, e.clientY - rect.top);
    setTimeout(() => {
      if (mouse.inside) spawnRipple(e.clientX - rect.left, e.clientY - rect.top);
    }, 60);
  });

  // Touch support
  canvas.addEventListener('touchstart', (e) => {
    const rect = canvas.getBoundingClientRect();
    for (const t of e.touches) {
      spawnRipple(t.clientX - rect.left, t.clientY - rect.top);
    }
  }, { passive: true });
  canvas.addEventListener('touchmove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const now = performance.now();
    if (now - lastSpawn > SPAWN_INTERVAL) {
      for (const t of e.touches) {
        spawnRipple(t.clientX - rect.left, t.clientY - rect.top);
      }
      lastSpawn = now;
    }
  }, { passive: true });

  // Re-handle resize
  window.addEventListener('resize', () => {
    const newSize = canvas.clientWidth;
    if (newSize === CSS_SIZE) return;
    // Simplest: full reload of layout. We re-init by reloading dims.
    // (Keep it simple — site doesn't dynamically resize portrait much.)
  });
})();
