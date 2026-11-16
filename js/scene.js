import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* ==========================================================================
   SILVICON 3D — four scenes share one toolkit:
   hero crystal · pinned journey · particle sphere · CTA ribbon
   Every renderer sleeps while off-screen and falls back to CSS if WebGL fails.
   ========================================================================== */

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const still = reduced || /[?&]still\b/.test(location.search); // ?still renders on demand (used for screenshots)
const mobile = () => innerWidth < 760;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
addEventListener('pointermove', e => {
  if (mobile()) return;
  pointer.tx = e.clientX / innerWidth * 2 - 1;
  pointer.ty = e.clientY / innerHeight * 2 - 1;
}, { passive: true });

/* ---------- shared assets ---------- */
const dotTexture = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,244,214,1)');
  grad.addColorStop(.3, 'rgba(246,208,128,.7)');
  grad.addColorStop(1, 'rgba(246,208,128,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();

const gold = (opacity = 1) => new THREE.MeshStandardMaterial({
  color: 0xf2c66e, metalness: 1, roughness: .26, envMapIntensity: 2.1,
  side: THREE.DoubleSide, transparent: opacity < 1, opacity, depthWrite: opacity === 1
});
const paleGold = () => new THREE.MeshStandardMaterial({ color: 0xf6e0ac, metalness: .9, roughness: .22, envMapIntensity: 1.4 });

/* ---------- renderer wrapper ---------- */
function create(canvas, container, scene, camera, update) {
  if (!canvas || !container) return null;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile(), alpha: true, powerPreference: 'high-performance' });
  } catch { return null; }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  pmrem.dispose();

  let frame = null, visible = false, last = 0;
  const render = () => { update(0, performance.now() / 1000); renderer.render(scene, camera); };
  const resize = () => {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile() ? 1.5 : 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    render();
  };
  const tick = time => {
    frame = requestAnimationFrame(tick);
    pointer.x += (pointer.tx - pointer.x) * .05;
    pointer.y += (pointer.ty - pointer.y) * .05;
    update(Math.min((time - last) / 1000, .05), time / 1000);
    last = time;
    renderer.render(scene, camera);
  };
  const start = () => { if (still || frame || document.hidden || !visible) return; last = performance.now(); frame = requestAnimationFrame(tick); };
  const stop = () => { if (frame) cancelAnimationFrame(frame); frame = null; };
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; visible ? start() : stop(); }, { rootMargin: '120px' }).observe(container);
  new ResizeObserver(resize).observe(container);
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  resize();
  container.classList.add('webgl-ready');
  return { render, renderer };
}

function lights(scene) {
  scene.add(new THREE.AmbientLight(0xffffff, .35));
  const key = new THREE.PointLight(0xffe2a8, 70); key.position.set(-3, 4, 5); scene.add(key);
  const rim = new THREE.PointLight(0xd8872f, 55); rim.position.set(3.5, -1, -3); scene.add(rim);
  return { key, rim };
}

function halo(radius = 2, opacity = .4) {
  return new THREE.Mesh(new THREE.TorusGeometry(radius, .01, 6, 160),
    new THREE.MeshBasicMaterial({ color: 0xf4d391, transparent: true, opacity, depthWrite: false }));
}

function motes(count, spreadX = 3.4, spreadY = 2.4, size = .16) {
  const p = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = i * 2.399963, r = .35 + ((i * 7919) % 100) / 100;
    p[i * 3] = Math.cos(a) * r * spreadX;
    p[i * 3 + 1] = Math.sin(a) * r * spreadY;
    p[i * 3 + 2] = (((i * 31) % 17) - 8) * .22;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({
    map: dotTexture, size: mobile() ? size * .8 : size, transparent: true, opacity: .8,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true
  }));
}

/* ==========================================================================
   2 · JOURNEY — a scroll-driven flight through golden gates, past drifting
   coins, ending at a rising sun with a growth chart
   ========================================================================== */
{
  const stage = document.querySelector('.journey-stage');
  if (stage) {
    const section = stage.parentElement;
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(58, 1, .1, 240);
    scene.fog = new THREE.FogExp2(0x0b1d30, .034);
    const rig = lights(scene);
    const L = 72, TRAVEL = 75;
    const noFog = o => { o.fog = false; return o; };

    /* gates */
    const gates = [];
    const thinGeo = new THREE.TorusGeometry(3, .035, 12, 160), arcGeo = new THREE.TorusGeometry(2.62, .016, 8, 160, Math.PI * 1.35);
    const goldMat = gold(), pale = paleGold();
    for (let i = 1; i <= 15; i++) {
      const g = new THREE.Group(); g.position.z = -i * 4.5;
      g.add(new THREE.Mesh(thinGeo, goldMat));
      const arc = new THREE.Mesh(arcGeo, pale); g.add(arc); g.userData = { arc, dir: i % 2 ? 1 : -1, i };
      scene.add(g); gates.push(g);
    }
    /* milestone gates, one per story beat */
    const milestones = [.22, .46, .70, .94].map((f, k) => {
      const g = new THREE.Group(); g.position.z = 9 - TRAVEL * f - 6;
      g.add(new THREE.Mesh(new THREE.TorusGeometry(3.7, .1, 18, 180), goldMat));
      const inner = new THREE.Mesh(new THREE.TorusGeometry(3.2, .03, 10, 160), pale); g.add(inner);
      const halo2 = new THREE.Mesh(new THREE.TorusGeometry(4.3, .012, 8, 180), new THREE.MeshBasicMaterial({ color: 0xf4d391, transparent: true, opacity: .5 })); g.add(halo2);
      const s = new THREE.Sprite(noFog(new THREE.SpriteMaterial({ map: dotTexture, color: 0xf3b862, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false })));
      s.scale.set(6.5, 6.5, 1); s.material.opacity = .26; s.position.z = -.2; g.add(s);
      g.userData = { inner, k }; scene.add(g); return g;
    });

    /* coins */
    const coinN = mobile() ? 90 : 190;
    const coins = new THREE.InstancedMesh(new THREE.CylinderGeometry(.16, .16, .04, 36), goldMat, coinN);
    const cd = [];
    for (let i = 0; i < coinN; i++) {
      const s = Math.sin(i * 12.9898) * 43758.5453, r1 = s - Math.floor(s), s2 = Math.sin(i * 78.233) * 12345.678, r2 = s2 - Math.floor(s2);
      const a = r1 * Math.PI * 2, rad = 5.2 + r2 * 6;
      cd.push({ x: Math.cos(a) * rad, y: Math.sin(a) * rad * .7, z: -r2 * (L + 6) + (r1 - .5) * 6, ph: r1 * 6.28, sp: .3 + r2 * .9, sc: .6 + r1 * .8 });
    }
    scene.add(coins);
    const dummy = new THREE.Object3D();

    /* streaks */
    const sN = mobile() ? 160 : 340, sp = new Float32Array(sN * 6);
    for (let i = 0; i < sN; i++) {
      const s = Math.sin(i * 37.1) * 1e4, r1 = s - Math.floor(s), s2 = Math.sin(i * 17.3) * 1e4, r2 = s2 - Math.floor(s2);
      const a = r1 * Math.PI * 2, rad = 2.6 + r2 * 9, z = -r1 * (L + 8), len = 1 + r2 * 2.6;
      sp.set([Math.cos(a) * rad, Math.sin(a) * rad * .75, z, Math.cos(a) * rad, Math.sin(a) * rad * .75, z - len], i * 6);
    }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    scene.add(new THREE.LineSegments(sg, new THREE.LineBasicMaterial({ color: 0xf1d08a, transparent: true, opacity: .38, blending: THREE.AdditiveBlending, depthWrite: false })));

    /* finale: sun + chart */
    const sun = new THREE.Sprite(noFog(new THREE.SpriteMaterial({ map: dotTexture, color: 0xffcf86, transparent: true, opacity: .75, blending: THREE.AdditiveBlending, depthWrite: false })));
    sun.scale.set(24, 24, 1); sun.position.set(0, 2, -L - 20); scene.add(sun);
    const sunRing = new THREE.Mesh(new THREE.TorusGeometry(9, .06, 8, 200), noFog(new THREE.MeshBasicMaterial({ color: 0xf6dca8, transparent: true, opacity: .45 })));
    sunRing.position.copy(sun.position); scene.add(sunRing);
    const finale = new THREE.Group(); finale.position.set(0, -1.2, -L - 3); finale.scale.setScalar(1.7); scene.add(finale);
    const bars = new THREE.Group();
    [1, 1.55, 2.15, 2.85, 3.6].forEach((h, i) => {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(.45, h, .5), goldMat);
      bar.userData.h = h; bar.position.set((i - 2) * .72, h / 2 - 1.7, -1); bars.add(bar);
    });
    finale.add(bars);
    const arrowCurve = new THREE.CatmullRomCurve3([[-1.65, -1.1, .4], [-.9, -.5, .4], [-.25, -.25, .45], [.4, .35, .5], [1.2, 1.25, .55], [1.75, 2, .55]].map(p => new THREE.Vector3(...p)));
    const arrow = new THREE.Group();
    arrow.add(new THREE.Mesh(new THREE.TubeGeometry(arrowCurve, 64, .05, 8, false), pale));
    const head = new THREE.Mesh(new THREE.ConeGeometry(.16, .36, 6), pale);
    head.position.set(1.79, 2.12, .55); head.rotation.z = -.48; arrow.add(head);
    finale.add(arrow);

    let progress = 0, forced = null, lastFov = 0;
    const read = () => {
      if (forced !== null) return;
      const r = section.getBoundingClientRect();
      progress = clamp(-r.top / Math.max(1, r.height - innerHeight));
    };
    addEventListener('scroll', read, { passive: true }); read();

    const managed = create(document.getElementById('journey-canvas'), stage, scene, camera, (dt, time) => {
      const p = progress, t = reduced ? 0 : time, camZ = 9 - p * TRAVEL;
      camera.position.set(Math.sin(p * Math.PI * 3) * .6 + pointer.x * .5, Math.cos(p * Math.PI * 2.4) * .3 + .1 - pointer.y * .3, camZ);
      const fov = 58 + Math.sin(p * Math.PI) * 9;
      if (Math.abs(fov - lastFov) > .05) { camera.fov = fov; camera.updateProjectionMatrix(); lastFov = fov; }
      camera.lookAt(camera.position.x * .4, camera.position.y * .4, camZ - 12);
      camera.rotateZ(Math.sin(p * Math.PI * 2) * .05);
      rig.key.position.set(camera.position.x - 2, camera.position.y + 3, camZ - 4);
      rig.rim.position.set(camera.position.x + 3, camera.position.y - 1, camZ - 9);
      gates.forEach(g => { g.userData.arc.rotation.z = t * .25 * g.userData.dir + g.userData.i; });
      milestones.forEach(g => { g.userData.inner.rotation.z = t * .2; g.rotation.z = Math.sin(t * .3 + g.userData.k) * .08; });
      cd.forEach((d, i) => {
        dummy.position.set(d.x, d.y + Math.sin(t * d.sp + d.ph) * .25, d.z);
        dummy.rotation.set(t * d.sp + d.ph, d.ph, t * d.sp * .5); dummy.scale.setScalar(d.sc);
        dummy.updateMatrix(); coins.setMatrixAt(i, dummy.matrix);
      });
      coins.instanceMatrix.needsUpdate = true;
      const rise = smooth(.8, .98, p);
      bars.children.forEach((bar, i) => {
        const r = Math.max(.002, smooth(.8 + i * .03, .93 + i * .02, p));
        bar.scale.y = r; bar.position.y = bar.userData.h * r / 2 - 1.7;
      });
      arrow.scale.setScalar(Math.max(.001, smooth(.88, 1, p)));
      finale.rotation.y = Math.sin(t * .4) * .12;
      sun.material.opacity = .08 + smooth(.55, 1, p) * .4; sun.scale.setScalar(24 + rise * 5);
      sunRing.rotation.z = t * .05;
    });
    if (managed) {
      addEventListener('scroll', () => { if (still) managed.render(); }, { passive: true });
      window.silviconJourney = { setProgress: v => { forced = clamp(v); progress = forced; managed.render(); } };
    }
  }
}

/* ==========================================================================
   3 · UNIVERSE — one centred golden globe with a single ring.
   Rotation only: slow on its own, spins fast (and breathes) while scrolling.
   ========================================================================== */
{
  const container = document.querySelector('.universe-visual');
  if (container) {
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(45, 1, .1, 100);
    const count = mobile() ? 1400 : 3000;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const y = 1 - i / (count - 1) * 2, r = Math.sqrt(1 - y * y), th = i * 2.399963;
      pos.set([Math.cos(th) * r * 2, y * 2, Math.sin(th) * r * 2], i * 3);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const globe = new THREE.Points(geo, new THREE.PointsMaterial({
      map: dotTexture, color: 0xf6d98f, size: mobile() ? .085 : .095, transparent: true, opacity: .95,
      depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true
    }));
    scene.add(globe);
    const ring = halo(2.65, .55); ring.rotation.x = 1.2; ring.rotation.y = .25; scene.add(ring);
    let lastY = scrollY, vel = 0, spin = 0;
    addEventListener('scroll', () => { const d = Math.abs(scrollY - lastY); lastY = scrollY; vel = Math.min(vel + d * .02, 5); }, { passive: true });
    const managed = create(document.getElementById('universe-canvas'), container, scene, camera, (dt, time) => {
      vel *= .94;
      const speed = .1 + vel * .9;              // idle ≈ .1 rad/s, scrolling up to ~4.6 rad/s
      if (!reduced) { spin += dt * speed; globe.rotation.y = spin; ring.rotation.z += dt * speed * .6; }
      const k = 1 + Math.min(vel, 3) * .018;     // gentle "adjust" while spinning
      globe.scale.setScalar(k); ring.scale.setScalar(k);
      /* keep the whole globe + ring in view at any aspect ratio */
      const need = (mobile() ? 2.35 : 3.1) / (Math.tan(camera.fov * Math.PI / 360) * Math.min(camera.aspect, 1.6));
      camera.position.z = Math.max(7.2, need);
    });
    if (managed && still) addEventListener('scroll', () => managed.render(), { passive: true });
  }
}

/* ==========================================================================
   4 · CTA — a slow golden wave field (contour lines + sparkling crests)
   ========================================================================== */
{
  const container = document.querySelector('.cta-visual');
  if (container) {
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(48, 1, .1, 120);
    camera.position.set(0, 3.1, 7.5);
    const rows = mobile() ? 26 : 46, cols = mobile() ? 90 : 170, W = 40, D = 26;
    const wave = (x, z, t) => Math.sin(x * .42 + t * .5 + z * .3) * .6 + Math.sin(x * .9 - t * .7 + z * .6) * .26 + Math.sin(z * .5 + t * .4) * .34;
    const lineSets = [];
    for (let r = 0; r < rows; r++) {
      const arr = new Float32Array(cols * 3), z = -r / (rows - 1) * D, f = 1 - r / (rows - 1);
      for (let c = 0; c < cols; c++) { arr[c * 3] = (c / (cols - 1) - .5) * W; arr[c * 3 + 2] = z; }
      const g = new THREE.BufferGeometry(), attr = new THREE.BufferAttribute(arr, 3); attr.setUsage(THREE.DynamicDrawUsage);
      g.setAttribute('position', attr);
      const line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xf0cf8a, transparent: true, opacity: .1 + f * .6 }));
      line.frustumCulled = false; scene.add(line); lineSets.push({ arr, attr, z });
    }
    const spark = mobile() ? 90 : 220, sa = new Float32Array(spark * 3), sd = [];
    for (let i = 0; i < spark; i++) {
      const s = Math.sin(i * 12.99) * 1e4, r1 = s - Math.floor(s), s2 = Math.sin(i * 7.7) * 1e4, r2 = s2 - Math.floor(s2);
      sd.push({ x: (r1 - .5) * W, z: -r2 * D, ph: r1 * 6.28, sp: .5 + r2 });
    }
    const sg = new THREE.BufferGeometry(), sAttr = new THREE.BufferAttribute(sa, 3); sAttr.setUsage(THREE.DynamicDrawUsage);
    sg.setAttribute('position', sAttr);
    const sparks = new THREE.Points(sg, new THREE.PointsMaterial({ map: dotTexture, color: 0xfff0c8, size: .32, transparent: true, opacity: .95, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
    sparks.frustumCulled = false; scene.add(sparks);
    const fill = (t) => {
      lineSets.forEach(({ arr, attr, z }) => { for (let c = 0; c < cols; c++) arr[c * 3 + 1] = wave(arr[c * 3], z, t); attr.needsUpdate = true; });
      sd.forEach((d, i) => { sa[i * 3] = d.x + Math.sin(t * .2 + d.ph) * .4; sa[i * 3 + 2] = d.z; sa[i * 3 + 1] = wave(d.x, d.z, t) + .08 + Math.sin(t * d.sp + d.ph) * .05; });
      sAttr.needsUpdate = true;
    };
    fill(0);
    create(document.getElementById('cta-canvas'), container, scene, camera, (dt, time) => {
      const t = reduced ? 0 : time;
      fill(t);
      camera.position.x = pointer.x * 1.4; camera.position.y = 3.1 - pointer.y * .4;
      camera.lookAt(0, 2.7, -9);
    });
  }
}
