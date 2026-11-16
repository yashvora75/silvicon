/* SILVICON hero — animated growth line chart.
   Draws itself from bottom-left to top-right, then light keeps travelling along the line. Canvas 2D, works at every size. */
(() => {
  const hero = document.querySelector('.hero'), canvas = document.getElementById('hero-chart');
  if (!hero || !canvas) return;
  const ctx = canvas.getContext('2d');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]still\b/.test(location.search);
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = t => 1 - Math.pow(1 - t, 3);
  let W = 0, H = 0, dpr = 1, raf = 0, visible = false, t0 = performance.now(), pts = [];
  const small = () => W < 700;

  const build = () => {
    const N = small() ? 90 : 160; pts = [];
    const y0 = small() ? .9 : .88, y1 = small() ? .34 : .26, padX = small() ? 0 : .02;
    for (let i = 0; i <= N; i++) {
      const u = i / N, trend = y0 + (y1 - y0) * (u * .72 + .28 * Math.pow(u, 1.8));
      const wob = Math.sin(u * 17) * .022 + Math.sin(u * 33 + 1.3) * .011 + Math.sin(u * 7 + .4) * .03 * (1 - u * .4);
      pts.push([(padX + u * (1 - padX * 2)) * W, (trend - wob * (.4 + u * .6)) * H]);
    }
  };
  const resize = () => {
    W = hero.clientWidth; H = hero.clientHeight; if (!W || !H) return;
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build(); draw(still ? 6 : (performance.now() - t0) / 1000);
  };
  const at = f => { const i = clamp(f) * (pts.length - 1), a = Math.floor(i), b = Math.min(a + 1, pts.length - 1), k = i - a; return [pts[a][0] + (pts[b][0] - pts[a][0]) * k, pts[a][1] + (pts[b][1] - pts[a][1]) * k]; };

  const draw = t => {
    ctx.clearRect(0, 0, W, H);
    /* grid */
    ctx.strokeStyle = 'rgba(233,197,119,.07)'; ctx.lineWidth = 1;
    const gy = small() ? 5 : 7, gx = small() ? 6 : 12;
    for (let i = 1; i < gy; i++) { const y = H * (.2 + .72 * i / gy); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    for (let i = 1; i < gx; i++) { const x = W * i / gx; ctx.beginPath(); ctx.moveTo(x, H * .2); ctx.lineTo(x, H); ctx.stroke(); }
    const draw01 = still ? 1 : ease(clamp((t - .3) / 2.8)), last = Math.floor(draw01 * (pts.length - 1));
    if (last < 1) return;
    const path = () => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i <= last; i++) ctx.lineTo(pts[i][0], pts[i][1]); const e = at(draw01); ctx.lineTo(e[0], e[1]); return e; };
    /* area */
    const e = path(); ctx.lineTo(e[0], H); ctx.lineTo(pts[0][0], H); ctx.closePath();
    const fill = ctx.createLinearGradient(0, H * .25, 0, H); fill.addColorStop(0, 'rgba(233,197,119,.22)'); fill.addColorStop(1, 'rgba(233,197,119,0)');
    ctx.fillStyle = fill; ctx.fill();
    /* line */
    const g = ctx.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(201,161,90,.15)'); g.addColorStop(.35, 'rgba(214,176,100,.75)'); g.addColorStop(1, 'rgba(255,236,190,1)');
    path(); ctx.strokeStyle = g; ctx.lineWidth = small() ? 2 : 2.6; ctx.lineJoin = 'round'; ctx.shadowColor = 'rgba(241,200,120,.7)'; ctx.shadowBlur = 14; ctx.stroke(); ctx.shadowBlur = 0;
    /* travelling light */
    const run = still ? .72 : ((t - 3) * .28) % 1.35;
    if (t > 3 || still) {
      const head = clamp(run, 0, 1), tail = clamp(run - .22, 0, 1), seg = 28;
      for (let s = 0; s < seg; s++) {
        const a = at(tail + (head - tail) * s / seg), b = at(tail + (head - tail) * (s + 1) / seg), k = (s + 1) / seg;
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
        ctx.strokeStyle = `rgba(255,246,220,${(k * k * .95).toFixed(3)})`; ctx.lineWidth = 1.5 + k * (small() ? 2.5 : 3.5); ctx.lineCap = 'round';
        ctx.shadowColor = 'rgba(255,225,150,.9)'; ctx.shadowBlur = 16 * k; ctx.stroke();
      }
      ctx.shadowBlur = 0;
      if (run <= 1.02) {
        const h = at(head), r = small() ? 26 : 40, rg = ctx.createRadialGradient(h[0], h[1], 0, h[0], h[1], r);
        rg.addColorStop(0, 'rgba(255,248,226,.95)'); rg.addColorStop(.25, 'rgba(255,224,150,.5)'); rg.addColorStop(1, 'rgba(255,200,100,0)');
        ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(h[0], h[1], r, 0, 7); ctx.fill();
      }
    }
    /* end marker + pulse */
    const p = at(draw01);
    ctx.fillStyle = '#fff1c9'; ctx.beginPath(); ctx.arc(p[0], p[1], small() ? 4 : 5.5, 0, 7); ctx.fill();
    const q = (t * .6) % 1; ctx.strokeStyle = `rgba(255,236,190,${(1 - q) * .7})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p[0], p[1], 6 + q * 26, 0, 7); ctx.stroke();
    /* data dots */
    for (let i = 14; i <= last; i += small() ? 30 : 22) { ctx.fillStyle = 'rgba(255,236,190,.85)'; ctx.beginPath(); ctx.arc(pts[i][0], pts[i][1], 2.6, 0, 7); ctx.fill(); }
  };
  const tick = now => { raf = requestAnimationFrame(tick); draw((now - t0) / 1000); };
  const start = () => { if (still || raf || document.hidden || !visible) return; raf = requestAnimationFrame(tick); };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  new IntersectionObserver(e => { visible = e[0].isIntersecting; visible ? start() : stop(); }).observe(hero);
  new ResizeObserver(resize).observe(hero);
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  resize();
})();
