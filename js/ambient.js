/* ==========================================================================
   SILVICON — ambient backgrounds
   Every section marked [data-ambient] gets a quiet, layered backdrop:
   aurora glow · engraved guilloche rosettes · drifting gold dust · slow sheen.
   Pure CSS + one light 2D canvas per section (paused when off-screen).
   ========================================================================== */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const still = reduced || /[?&]still\b/.test(location.search);
  const NS = 'http://www.w3.org/2000/svg';
  const mobile = () => innerWidth < 760;

  /* engraved rosette: hypotrochoid family, three rotated passes + fine rings */
  const rosette = seed => {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '-100 -100 200 200'); svg.setAttribute('class', 'amb-rosette');
    const sets = [[11, 4, 6], [13, 5, 7], [9, 4, 5]][seed % 3];
    const curve = (R, r, d, rot) => {
      const k = (R - r) / r, norm = (R - r) + d, steps = 900, turns = r; let dstr = '';
      for (let i = 0; i <= steps; i++) {
        const t = i / steps * Math.PI * 2 * turns;
        const x = ((R - r) * Math.cos(t) + d * Math.cos(k * t)) / norm * 94, y = ((R - r) * Math.sin(t) - d * Math.sin(k * t)) / norm * 94;
        dstr += (i ? 'L' : 'M') + x.toFixed(2) + ' ' + y.toFixed(2);
      }
      const p = document.createElementNS(NS, 'path'); p.setAttribute('d', dstr); p.setAttribute('transform', `rotate(${rot})`); return p;
    };
    const [R, r, d] = sets;
    [0, 8, 16].forEach((rot, i) => svg.append(curve(R, r, d - i * .7, rot)));
    [97, 72, 46].forEach(rad => { const c = document.createElementNS(NS, 'circle'); c.setAttribute('r', rad); svg.append(c); });
    return svg;
  };

  /* soft glowing dot sprite, drawn once per palette */
  const sprites = {};
  const sprite = rgb => sprites[rgb] || (sprites[rgb] = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(.35, `rgba(${rgb},.45)`); gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c;
  })());

  document.querySelectorAll('[data-ambient]').forEach((host, index) => {
    const light = host.dataset.ambient === 'light', hero = host.classList.contains('hero');
    const layer = document.createElement('div'); layer.className = `amb ${light ? 'amb-light' : 'amb-dark'}`; layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = '<i class="amb-blob b1"></i><i class="amb-blob b2"></i><i class="amb-blob b3"></i>';
    if (!hero) {
      const l = rosette(index), r = rosette(index + 1);
      l.classList.add('l'); r.classList.add('r'); layer.append(l, r);
    }
    if (!light) layer.insertAdjacentHTML('beforeend', '<i class="amb-sheen"></i>');
    const canvas = document.createElement('canvas'); canvas.className = 'amb-dust'; layer.append(canvas);
    host.prepend(layer);

    /* gold dust */
    const ctx = canvas.getContext('2d'), tone = light ? '176,128,52' : '246,214,150', base = sprite(tone);
    let w = 0, h = 0, dpr = 1, parts = [], raf = null, visible = false, last = 0;
    const seedParts = () => {
      const n = Math.round(Math.min(70, Math.max(18, (w * h) / (mobile() ? 26000 : 17000))));
      parts = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h, r: 3 + Math.random() * 9 * (Math.random() < .12 ? 2.2 : 1),
        vy: -(4 + Math.random() * 14), sway: 8 + Math.random() * 22, ph: Math.random() * 6.28, sp: .2 + Math.random() * .5,
        a: (light ? .22 : .28) + Math.random() * (light ? .3 : .5), tw: .4 + Math.random() * 1.2
      }));
    };
    const size = () => {
      w = host.clientWidth; h = host.clientHeight; if (!w || !h) return;
      dpr = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = w * dpr; canvas.height = h * dpr; canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); seedParts(); draw(0);
    };
    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        const tw = .55 + .45 * Math.sin(t * p.tw + p.ph);
        ctx.globalAlpha = p.a * tw;
        const x = p.x + Math.sin(t * p.sp + p.ph) * p.sway;
        ctx.drawImage(base, x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      }
      ctx.globalAlpha = 1;
    };
    const tick = now => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, .05); last = now;
      for (const p of parts) { p.y += p.vy * dt; if (p.y < -20) { p.y = h + 20; p.x = Math.random() * w; } }
      draw(now / 1000);
    };
    const start = () => { if (still || raf || document.hidden || !visible) return; last = performance.now(); raf = requestAnimationFrame(tick); };
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf = null; };
    new IntersectionObserver(e => { visible = e[0].isIntersecting; visible ? start() : stop(); }, { rootMargin: '80px' }).observe(host);
    new ResizeObserver(size).observe(host);
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
    size();
  });
})();
