/* ==========================================================================
   SILVICON — motion layer (GSAP + ScrollTrigger + Lenis)
   Order of play: intro → hero entrance → scroll-driven reveals.
   Everything is skipped under prefers-reduced-motion, and content stays
   visible if any library fails to load.
   ========================================================================== */

const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const { gsap, ScrollTrigger, Lenis } = window;

if (reduce || !gsap || !ScrollTrigger) {
  root.classList.add('hero-ready');
} else {
  gsap.registerPlugin(ScrollTrigger);
  const fine = matchMedia('(pointer: fine)').matches;
  const $ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (Lenis) {
    lenis = new Lenis({ duration: 1.2, smoothWheel: true, wheelMultiplier: .9, touchMultiplier: 1.1 });
    window.silviconLenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $('a[href^="#"]').forEach(link => link.addEventListener('click', e => {
      const id = link.getAttribute('href');
      const target = id.length > 1 && document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      history.pushState(null, '', id);
      lenis.scrollTo(target, { offset: -(parseFloat(getComputedStyle(root).getPropertyValue('--header-h')) || 76) + 4, duration: 1.4 });
    }));
    new MutationObserver(() => document.body.classList.contains('intro-playing') ? lenis.stop() : lenis.start())
      .observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  /* ---------- split headings into masked words ---------- */
  const splitWords = el => {
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(document.createTextNode(' ')); return; }
          const w = document.createElement('span'), inner = document.createElement('span');
          w.className = 'w'; inner.textContent = part; w.append(inner); frag.append(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
    });
    walk(el);
  };
  $('[data-split]').forEach(h => {
    splitWords(h);
    gsap.from($('.w>span', h), {
      yPercent: 118, rotate: 4, duration: 1.15, ease: 'power4.out', stagger: .07,
      scrollTrigger: { trigger: h, start: 'top 88%', once: true }
    });
  });

  /* ---------- generic fade-ups ---------- */
  $('[data-reveal]').forEach(el => gsap.from(el, {
    y: 36, opacity: 0, duration: 1.1, ease: 'power3.out', clearProps: 'transform,opacity',
    scrollTrigger: { trigger: el, start: 'top 90%', once: true }
  }));
  const stagger = (selector, vars = {}) => ScrollTrigger.batch(selector, {
    start: 'top 92%', once: true,
    onEnter: batch => gsap.from(batch, {
      y: 56, opacity: 0, scale: .97, duration: 1, ease: 'power3.out', stagger: .12, clearProps: 'transform,opacity', ...vars
    })
  });
  if (reduce) stagger('.service-card'); stagger('.why-grid article', { scale: 1 }); stagger('.universe-list li', { y: 24, scale: 1, stagger: .1 });

  /* ---------- hero entrance (after the intro settles) ---------- */
  let heroDone = false;
  const heroIn = () => {
    if (heroDone) return; heroDone = true;
    const played = window.silviconIntroSettled?.played;
    gsap.set('.hero .mask>span', { yPercent: 110, skewY: 6, opacity: 0, filter: 'blur(14px)', transformOrigin: '0% 100%' });
    root.classList.add('hero-ready');
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to('.hero .mask>span', { yPercent: 0, skewY: 0, opacity: 1, filter: 'blur(0px)', duration: 1.7, stagger: .16, clearProps: 'transform,filter,opacity' }, 0)
      .from('.hero .eyebrow', { opacity: 0, y: 18, letterSpacing: '.5em', duration: 1.6 }, 0)
      .from('.hero .eyebrow .line', { scaleX: 0, transformOrigin: '0 50%', duration: 1.4 }, .1)
      .from('#hero-chart', { opacity: 0, duration: 2.4, ease: 'power2.out' }, .1)
      .from('.hero-end > p, .hero-end .visual-label', { opacity: 0, y: 24, filter: 'blur(8px)', duration: 1.3, stagger: .12, clearProps: 'transform,opacity,filter' }, .7)
      .from('.hero-end .button', { opacity: 0, y: 30, scale: .88, duration: 1.2, stagger: .12, ease: 'back.out(1.6)', clearProps: 'transform,opacity' }, .95);
    if (!played) tl.from('.header-inner', { opacity: 0, y: -24, duration: 1 }, .2).from('.hero-foot', { opacity: 0, duration: 1 }, 1.2);
  };
  if (window.silviconIntroSettled) heroIn();
  else document.addEventListener('silvicon:intro-settled', heroIn, { once: true });
  setTimeout(heroIn, 9000);

  /* hero parallax on scroll */
  const heroScroll = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
  gsap.to('#hero-chart', { yPercent: -10, ease: 'none', scrollTrigger: heroScroll });
  gsap.to('.hero-glow', { yPercent: -18, opacity: .4, ease: 'none', scrollTrigger: heroScroll });

  /* ---------- journey: beat copy + dots ---------- */
  const journey = document.querySelector('.journey');
  if (journey) {
    const beats = $('.journey-beat'), dots = $('.journey-dots li');
    let current = -1;
    ScrollTrigger.create({
      trigger: journey, start: 'top top', end: 'bottom bottom',
      onUpdate: self => {
        const i = Math.min(beats.length - 1, Math.floor(self.progress * beats.length));
        if (i === current) return; current = i;
        beats.forEach((b, n) => b.classList.toggle('active', n === i));
        dots.forEach((d, n) => d.classList.toggle('on', n === i));
      }
    });
    gsap.from('.journey-copy > *', {
      opacity: 0, y: 30, duration: 1.1, stagger: .12, ease: 'power3.out',
      scrollTrigger: { trigger: journey, start: 'top 60%', once: true }
    });
  }

  /* ---------- marquee reacts to scroll speed ---------- */
  const track = document.querySelector('.marquee-track');
  if (track) {
    const loop = gsap.to(track, { xPercent: -50, duration: 36, ease: 'none', repeat: -1 });
    let boost = 0;
    lenis?.on('scroll', e => { boost = Math.min(Math.abs(e.velocity) * .35, 7); });
    gsap.ticker.add(() => { boost *= .93; loop.timeScale(1 + boost); });
  }

  /* ---------- about ---------- */
  if (document.querySelector('.about-graphic')) {
    gsap.from('.about-graphic', {
      clipPath: 'inset(0 0 100% 0)', duration: 1.5, ease: 'power4.inOut',
      scrollTrigger: { trigger: '.about-graphic', start: 'top 82%', once: true }
    });
    gsap.from('.graphic-core', {
      scale: .6, opacity: 0, duration: 1.6, ease: 'power3.out', delay: .5,
      scrollTrigger: { trigger: '.about-graphic', start: 'top 82%', once: true }
    });
    gsap.to('.graphic-core', {
      yPercent: -12, ease: 'none',
      scrollTrigger: { trigger: '.about-graphic', start: 'top bottom', end: 'bottom top', scrub: true }
    });
  }

  /* ---------- approach timeline ---------- */
  if (document.querySelector('.timeline')) {
    const mm = gsap.matchMedia();
    const scrub = { trigger: '.timeline', start: 'top 72%', end: 'bottom 62%', scrub: .6 };
    mm.add('(min-width:761px)', () => { gsap.fromTo('.timeline-line span', { width: '0%' }, { width: '100%', ease: 'none', scrollTrigger: scrub }); });
    mm.add('(max-width:760px)', () => { gsap.fromTo('.timeline-line span', { height: '0%' }, { height: '100%', ease: 'none', scrollTrigger: scrub }); });
    /* each step wakes up as the gold line reaches it: number, dot, title and copy glide in */
    const steps = $('.timeline article');
    steps.forEach((step, i) => {
      const parts = step.querySelectorAll('.step-num, h3, p');
      gsap.set(parts, { opacity: .18, y: 22 });
      gsap.set(step.querySelector('.step-dot'), { scale: .6, opacity: .4 });
      ScrollTrigger.create({
        trigger: step, start: 'top 72%',
        onEnter: () => { step.classList.add('spatial-active'); gsap.to(parts, { opacity: 1, y: 0, duration: .9, stagger: .09, ease: 'power3.out', overwrite: true }); gsap.to(step.querySelector('.step-dot'), { opacity: 1, duration: .5 }); },
        onLeaveBack: () => { step.classList.remove('spatial-active'); gsap.to(parts, { opacity: .18, y: 22, duration: .5, overwrite: true }); gsap.to(step.querySelector('.step-dot'), { opacity: .4, duration: .4 }); }
      });
    });
  }

  /* ---------- CTA parallax ---------- */
  if (document.querySelector('.cta')) {
    gsap.fromTo('.cta-visual', { scale: 1, yPercent: 4 }, {
      scale: 1.14, yPercent: -6, ease: 'none',
      scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true }
    });
    gsap.from('.cta-wave', { yPercent: 20, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'center center', scrub: true } });
  }


  /* ---------- multi-layer parallax: Why + CTA ---------- */
  if (!reduce) {
    const lay = (sel, from, to, trig, extra = {}) => document.querySelectorAll(sel).length && gsap.fromTo(sel, { yPercent: from, ...extra.from }, {
      yPercent: to, ease: 'none', ...extra.to, scrollTrigger: { trigger: trig, start: 'top bottom', end: 'bottom top', scrub: .6 }
    });
    /* Why: background drifts slowest, header floats up, each card travels at its own speed */
    lay('#why .amb', -14, 14, '#why');
    lay('#why .section-head', 14, -14, '#why');
    ['1', '2', '3'].forEach((n, i) => lay(`#why .why-grid article:nth-child(${n})`, [18, 4, 26][i], [-10, -22, -4][i], '#why'));
    lay('#why .why-grid article i', 30, -30, '#why');
    /* CTA: layered depth — rings + wave behind, copy ahead, button last */
    lay('.cta .cta-inner .eyebrow', 40, -40, '.cta');
    lay('.cta .cta-inner h2', 22, -22, '.cta');
    lay('.cta .cta-inner > p:not(.eyebrow)', 12, -12, '.cta');
    lay('.cta .cta-inner .button', 6, -6, '.cta');
    gsap.fromTo('.cta-inner', { scale: .94, opacity: .2 }, { scale: 1, opacity: 1, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top 95%', end: 'top 35%', scrub: true } });
  }

  /* ---------- pointer-driven polish (mouse only) ---------- */
  if (fine) {
    const glow = document.querySelector('.cursor-glow');
    const gx = gsap.quickTo(glow, 'x', { duration: .6, ease: 'power3' }), gy = gsap.quickTo(glow, 'y', { duration: .6, ease: 'power3' });
    addEventListener('pointermove', e => { glow.classList.add('on'); gx(e.clientX); gy(e.clientY); }, { passive: true });
    document.addEventListener('pointerleave', () => glow.classList.remove('on'));

    const heroGlow = document.querySelector('.hero-glow');
    if (heroGlow) {
      const hx = gsap.quickTo(heroGlow, 'x', { duration: 1.2, ease: 'power3' }), hy = gsap.quickTo(heroGlow, 'y', { duration: 1.2, ease: 'power3' });
      addEventListener('pointermove', e => { hx((e.clientX / innerWidth - .5) * 60); hy((e.clientY / innerHeight - .5) * 40); }, { passive: true });
    }

    /* magnetic buttons */
    $('.button').forEach(btn => {
      const x = gsap.quickTo(btn, 'x', { duration: .5, ease: 'power3' }), y = gsap.quickTo(btn, 'y', { duration: .5, ease: 'power3' });
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        x((e.clientX - r.left - r.width / 2) * .22); y((e.clientY - r.top - r.height / 2) * .3);
      });
      btn.addEventListener('pointerleave', () => { x(0); y(0); });
    });

    /* 3D tilt + spotlight on service cards */
    if (false) $('.service-card').forEach(card => {
      const rx = gsap.quickTo(card, 'rotationX', { duration: .6, ease: 'power3' });
      const ry = gsap.quickTo(card, 'rotationY', { duration: .6, ease: 'power3' });
      gsap.set(card, { transformPerspective: 900 });
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        rx((.5 - py) * 7); ry((px - .5) * 7);
        card.style.setProperty('--mx', `${px * 100}%`); card.style.setProperty('--my', `${py * 100}%`);
      });
      card.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  }


  /* ---------- services: cards ride a half-circle wheel as you scroll ---------- */
  {
    const grid = document.querySelector('.service-grid'), cards = $('.service-card');
    if (grid && cards.length && !reduce) {
      const mmArc = gsap.matchMedia();
      mmArc.add('(min-width: 1px)', () => {
        const section = document.querySelector('#services'), n = cards.length;
        section.classList.add('arc-on'); grid.classList.add('service-arc');
        const state = { p: 0 };
        const place = () => {
          const cw = Math.min(460, innerWidth * (innerWidth < 700 ? .8 : .38)), R = innerWidth < 700 ? cw * .5 : Math.max(cw * 1.55, Math.min(innerWidth * .5, 760)), step = innerWidth < 700 ? 22 : 27;
          cards.forEach((c, i) => {
            const th = (i - state.p * (n - 1)) * step, rad = th * Math.PI / 180, a = Math.abs(th);
            const hide = a > 62;
            gsap.set(c, {
              x: Math.sin(rad) * R, y: (1 - Math.cos(rad)) * R * .6, rotation: th * .9, scale: 1 - Math.min(a, 70) / 70 * .22,
              opacity: hide ? 0 : 1 - Math.min(a, 62) / 62 * .8, zIndex: 100 - Math.round(a), pointerEvents: a < 18 ? 'auto' : 'none', force3D: true
            });
            c.classList.toggle('is-active', a < 18);
          });
        };
        place();
        const st = ScrollTrigger.create({
          trigger: section, start: 'top top', end: () => '+=' + innerHeight * 2.4, pin: true, scrub: .8, anticipatePin: 1, refreshPriority: 10,
          onUpdate: self => { gsap.to(state, { p: self.progress, duration: .6, ease: 'power3.out', overwrite: true, onUpdate: place }); }
        });
        addEventListener('resize', place);
        return () => { st.kill(); removeEventListener('resize', place); section.classList.remove('arc-on'); grid.classList.remove('service-arc'); gsap.set(cards, { clearProps: 'all' }); };
      });
    }
  }

  /* layout settles after fonts/images */
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  addEventListener('load', () => ScrollTrigger.refresh());
}
