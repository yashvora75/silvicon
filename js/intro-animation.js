let THREE;
try { THREE = await import('three'); } catch { /* CSS particle fallback is used. */ }

const overlay = document.getElementById('intro-overlay');
const skip = document.getElementById('intro-skip');
const replay = document.getElementById('replay-intro');
const emblem = document.querySelector('.intro-emblem');
const brand = document.querySelector('.intro-brand-clip');
const tagline = document.querySelector('.intro-tagline');
const ribbon = document.querySelector('.intro-ribbon');
const progress = document.querySelector('.intro-progress span');
const canvas = document.getElementById('intro-canvas');
const fallback = document.querySelector('.intro-fallback-particles');
const KEY = 'silvicon-intro-played-v1';
const DURATION = { awaken: 1, emblem: 1.5, brand: 1, transition: 1 };
let runtime = null, timeline = null, timeout = null, previousFocus = null, active = false;
let completeCallback = null;
const motionAllowed = () => !matchMedia('(prefers-reduced-motion: reduce)').matches;
function settle(played) {
  window.silviconIntroSettled = { played };
  document.dispatchEvent(new CustomEvent('silvicon:intro-settled', { detail: { played } }));
}
function hasPlayed() { try { return sessionStorage.getItem(KEY) === '1'; } catch { return false; } }
function markPlayed() { try { sessionStorage.setItem(KEY, '1'); } catch {} }
function createParticles() {
  if (!THREE) { fallback.style.opacity = '.6'; return null; }
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' }); }
  catch { fallback.style.opacity = '.6'; return null; }
  renderer.setClearColor(0x061426, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, .1, 100);
  camera.position.z = 10;
  const count = innerWidth < 700 ? 170 : 340;
  const positions = new Float32Array(count * 3);
  const origins = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const radius = 1.2 + Math.random() * 7;
    const x = Math.cos(theta) * radius, y = Math.sin(theta) * radius * .75, z = (Math.random() - .5) * 11;
    positions.set([x,y,z],i*3); origins.set([x,y,z],i*3);
    const glow = .45 + Math.random() * .55;
    colors.set([glow,glow*.75,glow*.33],i*3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const material = new THREE.PointsMaterial({ size: innerWidth < 700 ? .035 : .045, vertexColors:true, transparent:true, opacity:0, depthWrite:false, sizeAttenuation:true });
  const particles = new THREE.Points(geometry,material); scene.add(particles);
  let raf = null, running = false, strength = 1, expansion = 0;
  const clock = new THREE.Clock();
  function resize() { renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth < 700 ? 1.25 : 1.6)); renderer.setSize(innerWidth,innerHeight,false); camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix(); }
  function render() {
    if (!running) return;
    raf = requestAnimationFrame(render);
    const t = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      const j = i*3, drift = Math.sin(t*.4+i*.17)*.025;
      const angle = Math.atan2(origins[j+1],origins[j]) + t*(.12 + (i%5)*.008); const radius = Math.hypot(origins[j],origins[j+1])*(strength+expansion); positions[j] = Math.cos(angle)*radius+drift;
      positions[j+1] = Math.sin(angle)*radius*.98+Math.cos(t*.36+i*.2)*.025;
      positions[j+2] = origins[j+2]+Math.sin(t*.45+i)*.14;
    }
    geometry.attributes.position.needsUpdate = true;
    particles.rotation.y = Math.sin(t*.28)*.08;
    renderer.render(scene,camera);
  }
  function pause() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }
  function resume() { if (!running && !document.hidden) { running = true; clock.getDelta(); render(); } }
  function visibility() { document.hidden ? pause() : resume(); }
  resize(); addEventListener('resize',resize); document.addEventListener('visibilitychange',visibility); resume();
  return { material, camera, get strength(){return strength},set strength(v){strength=v},get expansion(){return expansion},set expansion(v){expansion=v},dispose(){ pause(); removeEventListener('resize',resize); document.removeEventListener('visibilitychange',visibility); geometry.dispose(); material.dispose(); renderer.dispose(); renderer.forceContextLoss(); } };
}
function finish({ skipped = false } = {}) {
  if (!active) return;
  active = false;
  clearTimeout(timeout);
  timeline?.kill(); timeline = null;
  runtime?.dispose(); runtime = null;
  overlay.classList.remove('active'); overlay.setAttribute('aria-hidden','true');
  document.body.classList.remove('intro-playing');
  overlay.style.cssText = ''; emblem.style.cssText = ''; brand.style.cssText = ''; tagline.style.cssText = ''; ribbon.style.cssText = ''; progress.style.cssText = ''; fallback.style.opacity = '';
  emblem.classList.remove('sweep');
  markPlayed();
  if (!skipped && window.gsap && motionAllowed()) {
    gsap.fromTo('.header,.hero-copy,.hero-end,.hero-foot',{opacity:0,y:20},{opacity:1,y:0,duration:.7,stagger:.1,ease:'power2.out',clearProps:'all'});
  }
  if (previousFocus && document.contains(previousFocus) && previousFocus !== document.body) previousFocus.focus({preventScroll:true});
  else document.getElementById('hero-heading').setAttribute('tabindex','-1'), document.getElementById('hero-heading').focus({preventScroll:true});
  completeCallback?.(); completeCallback = null;
  settle(true);
}
function start({ replaying = false } = {}) {
  if (active) finish({skipped:true});
  if (!motionAllowed()) return;
  if (replaying) window.scrollTo({ top: 0, behavior: 'instant' });
  active = true; previousFocus = replaying ? null : document.activeElement;
  overlay.classList.add('active'); overlay.removeAttribute('aria-hidden'); document.body.classList.add('intro-playing');
  skip.focus({preventScroll:true});
  timeout = setTimeout(() => finish(), 7000);
  runtime = createParticles();
  if (!window.gsap) { fallback.style.opacity = '.6'; setTimeout(() => finish(), 1800); return; }
  const gs = window.gsap;
  gs.set([emblem,brand,tagline],{opacity:0});
  gs.set(emblem,{scale:.75,rotationY:-23,y:25,transformPerspective:900});
  gs.set(brand,{y:35,letterSpacing:'0.08em'});
  gs.set(tagline,{y:16});
  gs.set(ribbon,{xPercent:-100,opacity:0});
  gs.set(progress,{width:0});
  timeline = gs.timeline({onComplete:() => finish()});
  timeline.to(progress,{width:'100%',duration:4.5,ease:'none'},0);
  if (runtime) {
    timeline.to(runtime.material,{opacity:.8,duration:DURATION.awaken,ease:'power2.inOut'},0);
    timeline.fromTo(runtime,{strength:1.8},{strength:.85,duration:2.2,ease:'power2.out'},0);
    timeline.to(runtime.camera.position,{z:8.8,duration:3.2,ease:'sine.inOut'},.2);
  } else timeline.to(fallback,{opacity:.6,duration:1},0);
  timeline.to(emblem,{opacity:1,scale:1,rotationY:0,y:0,duration:DURATION.emblem,ease:'power3.out'},1);
  timeline.fromTo(emblem,{filter:'drop-shadow(0 0 0px rgba(245,200,111,0))'},{filter:'drop-shadow(0 0 35px rgba(245,200,111,.48))',duration:1.6,ease:'sine.inOut'},1.15);
  timeline.call(() => emblem.classList.add('sweep'),[],1.7);
  timeline.to(brand,{opacity:1,y:0,letterSpacing:'0em',duration:.85,ease:'power2.out'},2.45);
  timeline.to(tagline,{opacity:1,y:0,duration:.65,ease:'power2.out'},2.8);
  timeline.to(emblem,{scale:1.12,z:80,duration:1,ease:'power2.inOut'},3.5);
  timeline.fromTo(ribbon,{xPercent:-100,opacity:0},{xPercent:100,opacity:1,duration:.8,ease:'power2.inOut'},3.55);
  if (runtime) timeline.to(runtime,{expansion:2.2,duration:1,ease:'power2.in'},3.5);
  timeline.to(overlay,{opacity:0,clipPath:'inset(0 0 100% 0)',duration:.8,ease:'power2.inOut'},3.8);
}
skip.addEventListener('click',() => finish({skipped:true}));
replay.addEventListener('click',() => start({replaying:true}));
if (!hasPlayed() && motionAllowed()) start(); else settle(false);
