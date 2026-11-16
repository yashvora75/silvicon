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
  stagger('.service-card'); stagger('.why-grid article', { scale: 1 }); stagger('.universe-list li', { y: 24, scale: 1, stagger: .1 });

  /* ---------- hero entrance (after the intro settles) ---------- */
  let heroDone = false;
  const heroIn = () => {
    if (heroDone) return; heroDone = true;
    const played = window.silviconIntroSettled?.played;
    gsap.set('.hero .mask>span', { yPercent: 118 });
    root.classList.add('hero-ready');
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.to('.hero .mask>span', { yPercent: 0, duration: 1.3, stagger: .12, clearProps: 'transform' }, 0)
      .from('.hero .eyebrow', { opacity: 0, y: 14, duration: .9 }, 0)
      .from('#hero-silk', { opacity: 0, duration: 2.4, ease: 'power2.out' }, .1)
      .from('.hero-node > *', { opacity: 0, scale: .5, duration: 1.1, stagger: .22, ease: 'back.out(1.7)' }, 1.2)
      .from('.hero-end > *', { opacity: 0, y: 26, duration: 1, stagger: .1, clearProps: 'transform,opacity' }, .55);
    if (!played) tl.from('.header-inner', { opacity: 0, y: -24, duration: 1 }, .2).from('.hero-foot', { opacity: 0, duration: 1 }, 1.2);
  };
  if (window.silviconIntroSettled) heroIn();
  else document.addEventListener('silvicon:intro-settled', heroIn, { once: true });
  setTimeout(heroIn, 9000);

  /* hero parallax on scroll */
  const heroScroll = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
  gsap.to('#hero-silk', { yPercent: -10, ease: 'none', scrollTrigger: heroScroll });
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
    $('.timeline article').forEach(step => {
      ScrollTrigger.create({
        trigger: step, start: 'top 70%',
        onEnter: () => step.classList.add('spatial-active'),
        onLeaveBack: () => step.classList.remove('spatial-active')
      });
      gsap.from(step, { y: 36, opacity: 0, duration: .9, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: step, start: 'top 90%', once: true } });
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
    $('.service-card').forEach(card => {
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

  /* layout settles after fonts/images */
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  addEventListener('load', () => ScrollTrigger.refresh());
}
