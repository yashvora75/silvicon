/* ==========================================================================
   SILVICON hero — "golden silk"
   A 2D canvas ribbon of ~70 hairlines that twists, pinches and sweeps upward
   (the growth line). It bends away from the cursor and carries three glowing
   markers. Pure Canvas 2D: light, crisp at any DPR, paused when off-screen.
   ========================================================================== */
(() => {
  const hero = document.querySelector('.hero');
  const canvas = document.getElementById('hero-silk');
  if (!hero || !canvas) return;
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const still = reduced || /[?&]still\b/.test(location.search);
  const nodes = [...hero.querySelectorAll('.hero-node')].map((el, i) => ({ el, u: [.2, .5, .8][i] ?? .5 }));
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };

  let W = 0, H = 0, dpr = 1, raf = null, visible = false, grad = null, t0 = performance.now();
  const pointer = { x: -999, y: -999, active: 0, target: 0 };
  const small = () => W < 700;

  /* centre line: lower-left → upper-right, with slow breathing */
  const centre = (u, t) => {
    const a = small() ? .78 : .8, b = small() ? .42 : .3;
    return H * (a + (b - a) * smooth(0, 1, u)) + Math.sin(u * 5.2 + t * .35) * H * .035 + Math.sin(u * 11 + t * .6) * H * .012;
  };
  const spread = (u, t) => H * (.05 + .17 * Math.pow(Math.abs(Math.sin(u * Math.PI * 1.7 + t * .25 + .6)), 1.4));

  const resize = () => {
    W = hero.clientWidth; H = hero.clientHeight; if (!W || !H) return;
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, 'rgba(176,128,52,0)'); grad.addColorStop(.12, 'rgba(201,161,90,1)');
    grad.addColorStop(.5, 'rgba(255,234,186,1)'); grad.addColorStop(.88, 'rgba(201,161,90,1)'); grad.addColorStop(1, 'rgba(176,128,52,0)');
    draw(still ? 2.2 : (performance.now() - t0) / 1000);
  };

  const draw = t => {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = grad; ctx.lineWidth = 1;
    const N = small() ? 44 : 72, STEPS = small() ? 70 : 130, reach = 150;
    for (let i = 0; i < N; i++) {
      const s = (i / (N - 1) - .5) * 2, core = 1 - Math.abs(s);
      ctx.globalAlpha = .07 + .5 * Math.pow(core, 1.6);
      ctx.beginPath();
      for (let k = 0; k <= STEPS; k++) {
        const u = k / STEPS, x = u * W;
        const flip = Math.cos(u * 3.4 + t * .22);
        let y = centre(u, t) + s * spread(u, t) * flip + Math.sin(u * 9 + s * 2.2 + t * .5) * H * .012 * (1 - Math.abs(s) * .5);
        if (pointer.active > .01) {
          const dx = x - pointer.x, dy = y - pointer.y, d2 = dx * dx + dy * dy, f = Math.exp(-d2 / (2 * reach * reach)) * pointer.active;
          y += (dy >= 0 ? 1 : -1) * f * 34 * (.4 + core);
        }
        k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    nodes.forEach(n => {
      const x = n.u * W, y = centre(n.u, t) + (pointer.active > .01 ? 0 : 0);
      n.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
    });
  };

  const tick = now => {
    raf = requestAnimationFrame(tick);
    pointer.active += (pointer.target - pointer.active) * .06;
    draw((now - t0) / 1000);
  };
  const start = () => { if (still || raf || document.hidden || !visible) return; raf = requestAnimationFrame(tick); };
  const stop = () => { if (raf) cancelAnimationFrame(raf); raf = null; };

  hero.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    const r = hero.getBoundingClientRect(); pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.target = 1;
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { pointer.target = 0; });
  new IntersectionObserver(e => { visible = e[0].isIntersecting; visible ? start() : stop(); }).observe(hero);
  new ResizeObserver(resize).observe(hero);
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  resize();
})();
