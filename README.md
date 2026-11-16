# SILVICON homepage — 3D motion build

Frontend-only homepage prototype for SILVICON Financial Services LLP.

## Preview

```powershell
node preview-server.js
```

Open http://127.0.0.1:4173/ (add `?still` to freeze the 3D loops, useful for screenshots).
No npm install or build step. **All libraries and fonts are bundled locally** in `assets/vendor` and
`assets/fonts`, so the site works offline and no longer depends on CDNs.

## What changed in this version

**Layout (the "uneven elements" fix).** The old site stacked five CSS files that overrode one another
(the header was sized three different times). They are replaced by one `css/site.css` with a single
container width, one spacing scale and one type scale. Concretely:
- One header layout (logo · nav · CTA on a 3-column grid) instead of a grid fighting an absolutely-positioned button.
- Service cards are a 2×2 grid with equal heights; rows of text align across cards (CSS subgrid on the "Why" cards).
- The hero no longer lets the 3D object collide with its label or copy; headline descenders are no longer clipped.
- Timeline dots sit exactly on the line; mobile gets a vertical timeline.
- Form fields reserve space for error text so the layout never jumps.
- No horizontal overflow at any width (checked 390 / 820 / 1024 / 1440).

**3D** (`js/scene.js`). Hero: a liquid-gold knot circled by tumbling coins and orbiting light points, with mouse parallax.
Journey (pinned, scroll-driven): you fly through golden gates and drifting coins toward a rising sun with a growth chart.
CTA: a slow contour-line wave field with sparkling crests. The "Connected by possibility" particle globe is untouched
(its code block is byte-identical to the previous build, and renders pixel-identical). Every canvas sleeps off-screen and has a CSS fallback.

**Ambient backgrounds** (`js/ambient.js` + the "Ambient backgrounds" block at the end of `css/site.css`). Every section marked
`data-ambient="dark|light"` gets layered, quiet depth: drifting aurora glow, engraved guilloche rosettes, floating gold dust,
a slow light sheen (dark sections) and fine film grain. All sit behind content and pause when off-screen.

**Motion.** `js/motion.js` — Lenis smooth scroll, masked word-by-word headline reveals, staggered card entrances,
scroll-scrubbed timeline, parallax, scroll-speed-reactive marquee, magnetic buttons, 3D tilt + spotlight cards,
cursor glow. Respects `prefers-reduced-motion`.

## Files

- `index.html` — structure and copy
- `css/site.css` — the whole design system · `css/intro.css` — brand intro overlay
- `js/ui.js` — nav, dialog, form validation (no animation code)
- `js/motion.js` — GSAP / ScrollTrigger / Lenis choreography
- `js/scene.js` — Three.js scenes · `js/ambient.js` — section backgrounds · `js/intro-animation.js` — cinematic intro (once per session, skippable, replay in footer)
- `assets/vendor/` — gsap, ScrollTrigger, lenis, lucide, three (+ RoomEnvironment) · `assets/fonts/` — Cormorant Garamond, Manrope
- `_legacy/index.old.html` — the previous homepage, kept for reference
- Unused after this rebuild and safe to delete: `css/style.css`, `css/centered.css`, `css/redesign.css`, `css/animations.css`,
  `js/main.js`, `js/interactions.js`, `js/scroll-animations.js`, `js/smooth-scroll.js`, `js/three-scene.js`

## Still to do before launch

- Replace the extracted logo crops with an approved standalone logo (original poster kept in `assets/logo/`).
- The inquiry form validates locally and sends nothing; connect a form service/backend.
- Contact details are intentionally not invented; copy needs client and legal review.


## Hero & globe
The hero is a Three.js faceted gold crystal with orbiting coin rings (`js/scene.js`). The globe is a rippling particle sphere with light travelling along great-circle arcs between cities, pulse rings and orbiting coins; it melts into a helix on scroll.
