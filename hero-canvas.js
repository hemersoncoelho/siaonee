// ─────────────────────────────────────────────────────────────────────────────
// Sia One Hero — canvas frame scrubber + scroll animations
// ─────────────────────────────────────────────────────────────────────────────
(function () {
  'use strict';

  gsap.registerPlugin(ScrollTrigger);

  const FRAME_COUNT = 90;
  const FRAME_PATH  = (i) => `assets/hero-frames/frame_${String(i + 1).padStart(4, '0')}.webp`;
  const PRIORITY_N  = 22;
  const MAX_DPR     = 2;
  const SCRUB_SPEED = 1.5;

  const canvas      = document.getElementById('hero-canvas');
  const ctx         = canvas.getContext('2d', { alpha: false });
  const preloadEl   = document.getElementById('preloadIndicator');
  const preloadFill = document.getElementById('preloadFill');
  const frameNumEl  = document.getElementById('frameNum');
  const nav         = document.getElementById('siaNav');

  const prefersRM       = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const supportsIBitmap = typeof createImageBitmap === 'function';

  // ── State ────────────────────────────────────────────────────────────────
  const bitmaps      = new Array(FRAME_COUNT).fill(null);
  const imgs         = new Array(FRAME_COUNT).fill(null);
  let   loadedCount  = 0;
  let   lastDrawnIdx = -1;
  const cf           = { index: 0 };
  let   needsRedraw  = true;
  let   vw = 0, vh = 0;

  // ── Canvas sizing ────────────────────────────────────────────────────────
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    vw = window.innerWidth;
    vh = window.innerHeight;
    canvas.style.width  = vw + 'px';
    canvas.style.height = vh + 'px';
    canvas.width        = Math.floor(vw * dpr);
    canvas.height       = Math.floor(vh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    needsRedraw = true;
  }
  window.addEventListener('resize', resizeCanvas, { passive: true });
  resizeCanvas();

  // ── Draw object-cover ────────────────────────────────────────────────────
  function drawCover(src) {
    const iw = src.width  || src.naturalWidth;
    const ih = src.height || src.naturalHeight;
    if (!iw || !ih) return;
    const scale = Math.max(vw / iw, vh / ih);
    const dw    = iw * scale, dh = ih * scale;
    const dx    = (vw - dw) / 2;
    const dy    = (vh - dh) / 2 - dh * 0.02;
    ctx.fillStyle = '#08080A';
    ctx.fillRect(0, 0, vw, vh);
    ctx.drawImage(src, dx, dy, dw, dh);
  }

  // ── Render loop (rAF — skips when nothing changed) ───────────────────────
  function render() {
    const idx = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(cf.index)));
    if (!needsRedraw && idx === lastDrawnIdx) return;
    const src = bitmaps[idx]
      || (imgs[idx]?.complete && imgs[idx].naturalWidth ? imgs[idx] : null);
    if (src) {
      drawCover(src);
      lastDrawnIdx = idx;
      needsRedraw  = false;
      if (frameNumEl) frameNumEl.textContent = String(idx + 1).padStart(2, '0');
      return;
    }
    // Nearest-neighbor fallback while frame loads
    for (let d = 1; d < 25; d++) {
      for (const i of [idx - d, idx + d]) {
        if (i < 0 || i >= FRAME_COUNT) continue;
        const fb = bitmaps[i] || (imgs[i]?.complete && imgs[i].naturalWidth ? imgs[i] : null);
        if (fb) { drawCover(fb); return; }
      }
    }
  }

  let rafActive = true;
  function tick() {
    if (!rafActive) return;
    render();
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      rafActive = false;
    } else {
      rafActive = true;
      needsRedraw = true;
      requestAnimationFrame(tick);
    }
  });

  // ── Frame loading ────────────────────────────────────────────────────────
  function loadFrame(i) {
    return new Promise((resolve) => {
      if (imgs[i]?.src) { resolve(imgs[i]); return; }
      const img    = new Image();
      imgs[i]      = img;
      img.decoding = 'async';
      img.onload   = () => {
        loadedCount++;
        if (preloadFill) {
          preloadFill.style.height = Math.min(100, loadedCount / FRAME_COUNT * 100) + '%';
        }
        if (supportsIBitmap) {
          createImageBitmap(img, { resizeQuality: 'medium' })
            .then(bmp => { bitmaps[i] = bmp; if (i === Math.round(cf.index)) needsRedraw = true; })
            .catch(() => { if (i === Math.round(cf.index)) needsRedraw = true; });
        } else {
          if (i === Math.round(cf.index)) needsRedraw = true;
        }
        resolve(img);
      };
      img.onerror = () => { loadedCount++; resolve(null); };
      img.src     = FRAME_PATH(i);
    });
  }

  async function preloadAll() {
    await Promise.all(
      Array.from({ length: Math.min(PRIORITY_N, FRAME_COUNT) }, (_, i) => loadFrame(i))
    );
    needsRedraw = true;
    const f0 = bitmaps[0] || imgs[0];
    if (f0) { drawCover(f0); lastDrawnIdx = 0; needsRedraw = false; }

    const CONCURRENCY = 8;
    let qi = PRIORITY_N, active = 0;
    function pump() {
      while (active < CONCURRENCY && qi < FRAME_COUNT) {
        active++;
        loadFrame(qi++).then(() => {
          active--;
          if (loadedCount >= FRAME_COUNT) preloadEl?.classList.add('done');
          pump();
        });
      }
    }
    pump();
  }

  // ── Frame scrub (runs immediately — no conflict with entry reveal) ────────
  function initFrameScrub() {
    if (prefersRM) {
      cf.index    = Math.floor(FRAME_COUNT / 2);
      needsRedraw = true;
      return;
    }
    gsap.to(cf, {
      index: FRAME_COUNT - 1,
      ease:  'none',
      scrollTrigger: {
        trigger: '.hero-scrub-container',
        start:   'top top',
        end:     'bottom bottom',
        scrub:   SCRUB_SPEED,
        invalidateOnRefresh: true,
        onUpdate: () => { needsRedraw = true; },
      },
    });

    // Nav border on scroll
    ScrollTrigger.create({
      start:    'top -20',
      onUpdate: (self) => nav?.classList.toggle('scrolled', self.scroll() > 20),
    });
  }

  // ── Scroll effects (wired AFTER entry reveal to avoid tween conflicts) ────
  //
  // Strategy:
  //  1. entryReveal() completes → clearProps('all') removes all GSAP inline
  //     styles, returning elements to their clean CSS state (opacity:1, no transform)
  //  2. fromTo() uses pixel-based offsets ("top+=Npx top") so positions are
  //     predictable regardless of the 300vh trigger height
  //  3. overwrite:true kills any stale tweens left by the entry timeline
  //  4. Explicit { y:0, opacity:1 } "from" state guarantees clean reversal
  //     when scrolling back up — GSAP has a precise target, no ambiguity
  //
  function initScrollEffects() {
    if (prefersRM) return;

    // Text elements — cascading fade-up-out, each element offset slightly
    const textEls = ['#heroBadge', '#heroHeadline', '#heroSub', '#heroActions', '#heroTrust'];
    const starts  = [0,   50,  90, 130, 170];   // px from hero top where fade begins
    const ends    = [300, 370, 420, 480, 540];   // px from hero top where fully gone
    const yOuts   = [48,  60,  54,  46,  38];   // upward travel (px) — varies for naturalness

    textEls.forEach((sel, i) => {
      gsap.fromTo(sel,
        { y: 0, opacity: 1 },
        {
          y:         -yOuts[i],
          opacity:   0,
          ease:      'none',
          overwrite: true,
          scrollTrigger: {
            trigger:             '.hero-scrub-container',
            start:               `top+=${starts[i]} top`,
            end:                 `top+=${ends[i]}   top`,
            scrub:               1,
            invalidateOnRefresh: true,
          },
        }
      );
    });

    // HUD cards — staggered slide-right-out
    gsap.utils.toArray('#hud1, #hud2, #hud3').forEach((el, i) => {
      gsap.fromTo(el,
        { x: 0, opacity: 1 },
        {
          x:         90,
          opacity:   0,
          ease:      'none',
          overwrite: true,
          scrollTrigger: {
            trigger:             '.hero-scrub-container',
            start:               `top+=${60  + i * 70} top`,
            end:                 `top+=${340 + i * 70} top`,
            scrub:               1,
            invalidateOnRefresh: true,
          },
        }
      );
    });

    // Scroll hint — fades out quickly at first scroll
    gsap.fromTo('#scrollHint',
      { y: 0, opacity: 1 },
      {
        y:         14,
        opacity:   0,
        ease:      'none',
        overwrite: true,
        scrollTrigger: {
          trigger:             '.hero-scrub-container',
          start:               'top top',
          end:                 'top+=220 top',
          scrub:               0.6,
          invalidateOnRefresh: true,
        },
      }
    );

    // Frame ticker — dims gently across the whole hero scroll
    gsap.fromTo('#frameTicker',
      { opacity: 1 },
      {
        opacity:   0.25,
        ease:      'none',
        overwrite: true,
        scrollTrigger: {
          trigger:             '.hero-scrub-container',
          start:               'top top',
          end:                 'top+=600 top',
          scrub:               1,
          invalidateOnRefresh: true,
        },
      }
    );
  }

  // ── Entry reveal ─────────────────────────────────────────────────────────
  function entryReveal() {
    if (prefersRM) {
      initScrollEffects();
      return;
    }

    const animated = [
      '#heroBadge', '#heroHeadline', '#heroSub', '#heroActions', '#heroTrust',
      '#hud1', '#hud2', '#hud3', '#scrollHint', '#frameTicker',
    ];

    gsap.timeline({
      defaults:   { ease: 'power3.out' },
      onComplete: () => {
        // Remove all GSAP-managed inline styles so elements are back at their
        // CSS-defined state (opacity:1, no transform) before scroll tweens wire up.
        // Without this, stale inline styles from .from() tweens compete with the
        // new fromTo() scroll tweens and break the scroll-back reversal.
        gsap.set(animated, { clearProps: 'all' });
        initScrollEffects();
      },
    })
      .from('#siaNav',       { y: -24, opacity: 0, duration: 0.7 })
      .from('#heroBadge',    { y: 16,  opacity: 0, duration: 0.6 }, 0.15)
      .from('#heroHeadline', { y: 28,  opacity: 0, duration: 0.9 }, 0.25)
      .from('#heroSub',      { y: 16,  opacity: 0, duration: 0.7 }, 0.55)
      .from('#heroActions',  { y: 14,  opacity: 0, duration: 0.6 }, 0.70)
      .from('#heroTrust',    { opacity: 0, duration: 0.6 }, 0.9)
      .from('#hud1',         { x: 30,  opacity: 0, duration: 0.6 }, 0.85)
      .from('#hud2',         { x: 30,  opacity: 0, duration: 0.6 }, 0.95)
      .from('#hud3',         { x: 30,  opacity: 0, duration: 0.6 }, 1.05)
      .from('#scrollHint',   { opacity: 0, duration: 0.8 }, 1.3)
      .from('#frameTicker',  { opacity: 0, duration: 0.8 }, 1.3);
  }

  // ── Kickoff ──────────────────────────────────────────────────────────────
  preloadAll();
  initFrameScrub();  // frame scrub starts immediately (independent)
  entryReveal();     // text reveal → onComplete → clearProps → initScrollEffects
})();
