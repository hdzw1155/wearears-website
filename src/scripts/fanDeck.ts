export interface FanDeckController {
  isFanMode: () => boolean;
  toggleFanMode: () => boolean;
  getWipe1Progress: () => number;
  setOnHeroUnbury: (cb: () => void) => void;
}

interface SegmentLayout {
  vh: number;
  vw: number;
  wipeLen: number;
  extraH: number[];
  wipeStarts: number[];
  wipeEnds: number[];
  restStarts: number[];
  restEnds: number[];
  totalRunwayPx: number;
}

/**
 * Initialize a homepage or subpage deck with default 4-corner Rosewood Fan Rib sweeps
 * (TL -> TR -> BR -> BL) and an optional tilting-fan card deck mode.
 */
export function initFanDeck(homeDeck: HTMLElement): FanDeckController | null {
  const stage = homeDeck.querySelector<HTMLElement>('.deck-stage');
  const spacer = homeDeck.querySelector<HTMLElement>('[data-deck-spacer]');
  const sweeper = homeDeck.querySelector<HTMLElement>('[data-fan-sweeper]');
  const slides = Array.from(homeDeck.querySelectorAll<HTMLElement>('.slide-section'));
  if (!stage || slides.length === 0) return null;

  const cards = slides.map((s) => s.querySelector<HTMLElement>('.deck-card'));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let fanMode = false;
  let wipe1Progress = 0;
  let heroWasBuried = false;
  let onHeroUnburyCb: (() => void) | null = null;
  let rafId = 0;

  let seg: SegmentLayout = {
    vh: 900,
    vw: 1440,
    wipeLen: 702,
    extraH: slides.map(() => 0),
    wipeStarts: [0],
    wipeEnds: [0],
    restStarts: [0],
    restEnds: [0],
    totalRunwayPx: 2400
  };

  const retriggerSlide = (slide: HTMLElement) => {
    slide.classList.remove('is-waiting');
    slide.classList.remove('is-active');
    void slide.offsetWidth;
    slide.classList.add('is-active');
  };

  const computeSweepClip = (
    thetaDeg: number,
    vw: number,
    vh: number,
    fromLeft: boolean,
    fromBottom: boolean
  ) => {
    if (thetaDeg <= 0.02) return 'polygon(0px 0px, 0px 0px, 0px 0px)';
    if (thetaDeg >= 90.02) return 'none';

    const r = Math.max(vw, vh) * 1.65 + 240;
    const tanT = Math.tan((thetaDeg * Math.PI) / 180);
    const mapY = (py: number) => (fromBottom ? vh - py : py);

    let pts: [number, number][];
    if (fromLeft) {
      if (thetaDeg <= 45) {
        pts = [[0, mapY(0)], [r, mapY(0)], [r, mapY(r * tanT)]];
      } else {
        pts = [[0, mapY(0)], [r, mapY(0)], [r, mapY(r)], [r / tanT, mapY(r)]];
      }
    } else {
      const xL = vw - r;
      if (thetaDeg <= 45) {
        pts = [[vw, mapY(0)], [xL, mapY(0)], [xL, mapY(r * tanT)]];
      } else {
        pts = [[vw, mapY(0)], [xL, mapY(0)], [xL, mapY(r)], [vw - r / tanT, mapY(r)]];
      }
    }

    return `polygon(${pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(', ')})`;
  };

  const rawPToTheta = (rawP: number, vw: number, vh: number) => {
    const u = 0.5 * (1 - Math.cos(Math.PI * rawP));
    if (u < 0.04) return -4 + 4 * (u / 0.04);
    if (u > 0.96) return 90 + 5 * ((u - 0.96) / 0.04);
    const s = (u - 0.04) / 0.92;
    const d = s * (vw + vh);
    const rad = d <= vh ? Math.atan2(d, vw) : Math.atan2(vh, Math.max(0, vw - (d - vh)));
    return (rad * 180) / Math.PI;
  };

  const getSweeperTransform = (thetaDeg: number, vw: number, vh: number, corner: number) => {
    const pos = thetaDeg.toFixed(3);
    const neg = (-thetaDeg).toFixed(3);
    switch (corner) {
      case 0: // Top-Left
        return `translate3d(0px, 0px, 0) rotate(${pos}deg)`;
      case 1: // Top-Right
        return `translate3d(${vw}px, 0px, 0) rotate(${neg}deg) scaleX(-1)`;
      case 2: // Bottom-Right
        return `translate3d(${vw}px, ${vh}px, 0) rotate(${pos}deg) scale(-1, -1)`;
      default: // Bottom-Left
        return `translate3d(0px, ${vh}px, 0) rotate(${neg}deg) scaleY(-1)`;
    }
  };

  const syncLayout = () => {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const vw = stage.clientWidth || window.innerWidth || document.documentElement.clientWidth;

    if (reducedMotion) {
      if (spacer) spacer.style.height = '0px';
      slides.forEach((s, i) => {
        s.style.top = '';
        s.style.clipPath = '';
        s.style.visibility = '';
        const c = cards[i];
        if (c) {
          c.style.removeProperty('--pan-y');
          c.style.removeProperty('--under-scale');
          c.style.removeProperty('--fan-rot');
          c.style.removeProperty('--fan-x');
          c.style.removeProperty('--fan-scale');
        }
      });
      return;
    }

    if (fanMode) {
      if (spacer) spacer.style.height = '0px';
      if (sweeper) sweeper.style.opacity = '0';
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        slide.style.clipPath = '';
        slide.style.visibility = '';
        const card = cards[i];
        if (card) {
          card.style.removeProperty('--pan-y');
          card.style.removeProperty('--under-scale');
        }
        const h = slide.offsetHeight;
        const topOffset = h > vh ? Math.round(vh - h) : 0;
        slide.style.top = `${topOffset}px`;
      }
      return;
    }

    if (sweeper) sweeper.style.opacity = '0';
    const extraH = cards.map((card, i) => {
      if (!card) return 0;
      const measured = Math.max(card.scrollHeight, slides[i].scrollHeight);
      return Math.max(0, Math.round(measured - vh));
    });
    const wipeLen = Math.round(Math.max(460, Math.min(740, vh * 0.78)));
    const pauseLen = Math.round(Math.max(96, Math.min(180, vh * 0.16)));

    let cursor = extraH[0] + 44;
    const wipeStarts = [0];
    const wipeEnds = [0];
    const restStarts = [0];
    const restEnds = [cursor];

    for (let i = 1; i < slides.length; i++) {
      const wStart = cursor;
      const wEnd = cursor + wipeLen;
      const rStart = wEnd;
      const rEnd = rStart + extraH[i] + (i === slides.length - 1 ? Math.round(pauseLen * 1.15) : pauseLen);
      wipeStarts.push(wStart);
      wipeEnds.push(wEnd);
      restStarts.push(rStart);
      restEnds.push(rEnd);
      cursor = rEnd;
    }

    seg = {
      vh,
      vw,
      wipeLen,
      extraH,
      wipeStarts,
      wipeEnds,
      restStarts,
      restEnds,
      totalRunwayPx: cursor
    };

    if (spacer) spacer.style.height = `${cursor}px`;
    slides.forEach((s) => {
      s.style.top = '';
    });
  };

  const updateDeckState = () => {
    rafId = 0;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const vw = stage.clientWidth || window.innerWidth || document.documentElement.clientWidth;

    if (reducedMotion) {
      slides.forEach((slide) => slide.classList.add('is-active'));
      return;
    }

    if (!fanMode) {
      const deckRect = homeDeck.getBoundingClientRect();
      const pos = Math.max(0, Math.min(seg.totalRunwayPx, -deckRect.top));

      const wipeP = slides.map((_, i) =>
        i === 0 ? 1 : Math.max(0, Math.min(1, (pos - seg.wipeStarts[i]) / Math.max(1, seg.wipeLen)))
      );
      wipe1Progress = wipeP[1] ?? 0;

      let baseIdx = 0;
      for (let i = 1; i < slides.length; i++) {
        if (wipeP[i] >= 1) baseIdx = i;
      }
      const wipingIdx =
        baseIdx + 1 < slides.length && wipeP[baseIdx + 1] > 0 && wipeP[baseIdx + 1] < 1
          ? baseIdx + 1
          : -1;

      const heroBuriedNow = (wipeP[1] ?? 0) >= 0.96;
      if (heroBuriedNow) {
        heroWasBuried = true;
      } else if (heroWasBuried && (wipeP[1] ?? 0) <= 0.12) {
        heroWasBuried = false;
        retriggerSlide(slides[0]);
        if (onHeroUnburyCb) onHeroUnburyCb();
      }

      const panY: number[] = [];
      for (let i = 0; i < slides.length; i++) {
        if (i === 0) {
          panY.push(Math.min(seg.extraH[0], pos));
        } else {
          panY.push(Math.max(0, Math.min(seg.extraH[i], pos - seg.restStarts[i])));
        }
      }

      const activeWipeFrac = wipingIdx > 0 ? wipeP[wipingIdx] : 0;

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const card = cards[i];
        const isVisible = i === baseIdx || i === wipingIdx;

        if (!isVisible) {
          slide.style.visibility = 'hidden';
          slide.style.clipPath = 'polygon(0px 0px, 0px 0px, 0px 0px)';
          if (i > 0 && wipeP[i] <= 0 && slide.classList.contains('is-active')) {
            slide.classList.remove('is-active');
            slide.classList.add('is-waiting');
          } else if (i > 0 && wipeP[i] >= 1 && !slide.classList.contains('is-active')) {
            slide.classList.remove('is-waiting');
            slide.classList.add('is-active');
          }
          continue;
        }

        slide.style.visibility = 'visible';

        if (i === baseIdx) {
          slide.style.clipPath = 'none';
          if (!slide.classList.contains('is-active')) {
            retriggerSlide(slide);
          }
          if (card) {
            card.style.setProperty('--pan-y', `${-panY[i]}px`);
            const underScale = wipingIdx > 0 ? 1 - 0.015 * activeWipeFrac : 1;
            card.style.setProperty('--under-scale', underScale.toFixed(4));
          }
        } else if (i === wipingIdx) {
          const p = wipeP[i];
          if (p >= 0.14 && !slide.classList.contains('is-active')) {
            retriggerSlide(slide);
          } else if (p < 0.04 && slide.classList.contains('is-active')) {
            slide.classList.remove('is-active');
            slide.classList.add('is-waiting');
          }
          if (card) {
            card.style.setProperty('--pan-y', '0px');
            card.style.setProperty('--under-scale', '1');
          }
          const corner = (i - 1) % 4; // 0: TL, 1: TR, 2: BR, 3: BL
          const fromLeft = corner === 0 || corner === 3;
          const fromBottom = corner === 2 || corner === 3;
          const thetaDeg = rawPToTheta(p, vw, vh);
          slide.style.clipPath = computeSweepClip(thetaDeg, vw, vh, fromLeft, fromBottom);
        }
      }

      if (sweeper) {
        if (wipingIdx > 0) {
          const p = wipeP[wipingIdx];
          const corner = (wipingIdx - 1) % 4;
          const thetaDeg = rawPToTheta(p, vw, vh);
          const alpha =
            thetaDeg < -1
              ? Math.max(0, (thetaDeg + 4) / 3)
              : thetaDeg > 92
                ? Math.max(0, (95 - thetaDeg) / 3)
                : 1;
          sweeper.style.opacity = alpha.toFixed(3);
          sweeper.style.transform = getSweeperTransform(thetaDeg, vw, vh, corner);
        } else {
          sweeper.style.opacity = '0';
        }
      }
      return;
    }

    // Easter egg mode: Tilting folding-fan cards
    const shellW = Math.min(vw - Math.max(38.4, Math.min(vw * 0.08, 115.2)), 1248);
    const gutterPx = Math.max(16, (vw - shellW) * 0.5);
    const safeMidDeg = (Math.max(8, gutterPx - 3) / Math.max(480, vh * 0.72)) * (180 / Math.PI);
    const maxAngle = Math.min(10.5, Math.max(2.6, safeMidDeg * 2));
    const shiftFactor = Math.max(0, Math.min(1, (gutterPx - 24) / 56));
    const maxShiftVw = 2.6 * shiftFactor;
    const maxOutAngle = Math.min(2.5, maxAngle * 0.28);
    const enterSpan = vh * 0.88;

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const card = cards[i];
      const rect = slide.getBoundingClientRect();
      const nextSlide = i < slides.length - 1 ? slides[i + 1] : null;
      const nextRect = nextSlide ? nextSlide.getBoundingClientRect() : null;

      const settledTarget = card || slide;
      if (i > 0) {
        const rawSettled = 1 - Math.max(0, Math.min(rect.top, vh * 0.45)) / (vh * 0.45);
        settledTarget.style.setProperty('--settled', rawSettled.toFixed(3));
      }

      const cover = nextRect ? 1 - Math.max(0, Math.min(nextRect.top, vh)) / vh : 0;
      if (nextRect) {
        slide.style.setProperty('--buried', cover.toFixed(3));
      }

      if (card) {
        let angle = 0;
        let shiftVw = 0;
        let scale = 1;

        if (i > 0) {
          const inDir = i % 2 === 1 ? 1 : -1;
          const tIn = Math.max(0, Math.min(1, (vh - rect.top) / enterSpan));
          const remIn = 0.5 * (1 + Math.cos(Math.PI * tIn));
          angle += inDir * maxAngle * remIn;
          shiftVw += inDir * maxShiftVw * remIn;
          scale *= 1 - 0.045 * remIn;
        }

        if (nextRect && cover > 0) {
          const outDir = i % 2 === 0 ? -1 : 1;
          const tallDamp = slide.offsetHeight > vh * 1.15 ? 0.55 : 1;
          const coverEase = 0.5 * (1 - Math.cos(Math.PI * cover));
          angle += outDir * maxOutAngle * tallDamp * coverEase;
          scale *= 1 - 0.032 * tallDamp * coverEase;
        }

        card.style.setProperty('--fan-rot', `${angle.toFixed(2)}deg`);
        card.style.setProperty('--fan-x', `${shiftVw.toFixed(2)}vw`);
        card.style.setProperty('--fan-scale', scale.toFixed(4));
      }

      const isBuried = Boolean(nextRect && nextRect.top <= 18);
      if (isBuried) {
        slide.dataset.buried = '1';
      } else if (slide.dataset.buried === '1' && (!nextRect || nextRect.top > vh * 0.25)) {
        delete slide.dataset.buried;
        retriggerSlide(slide);
        if (i === 0 && onHeroUnburyCb) onHeroUnburyCb();
      }

      if (rect.top < vh * 0.88 && !slide.classList.contains('is-active')) {
        retriggerSlide(slide);
      }

      if (i > 0 && rect.top >= vh + 24 && slide.classList.contains('is-active')) {
        slide.classList.remove('is-active');
        slide.classList.add('is-waiting');
      }
    }
  };

  // Initialize slide entrance states
  const vhInit = window.innerHeight || document.documentElement.clientHeight;
  slides.forEach((slide, idx) => {
    if (idx === 0) {
      slide.classList.add('is-active');
    } else if (reducedMotion) {
      const r = slide.getBoundingClientRect();
      slide.classList.add(r.top >= vhInit - 16 ? 'is-waiting' : 'is-active');
    } else {
      slide.classList.add('is-waiting');
    }
  });

  const scheduleDeckUpdate = () => {
    if (!rafId) rafId = window.requestAnimationFrame(updateDeckState);
  };

  const handleResize = () => {
    syncLayout();
    updateDeckState();
  };

  syncLayout();
  updateDeckState();
  window.addEventListener('scroll', scheduleDeckUpdate, { passive: true });
  window.addEventListener('resize', handleResize, { passive: true });

  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => {
      syncLayout();
      updateDeckState();
    });
    cards.forEach((c) => {
      if (c) ro.observe(c);
    });
  }

  // Handle in-deck #anchor links (e.g. Partners #collaboration CTA) smoothly in sweep mode
  homeDeck.addEventListener('click', (e) => {
    if (fanMode || reducedMotion) return;
    const anchor = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
    if (!anchor) return;
    const id = anchor.getAttribute('href')?.slice(1);
    if (!id) return;
    const targetEl = document.getElementById(id);
    const targetSlide = targetEl?.closest<HTMLElement>('.slide-section');
    if (!targetSlide) return;
    const idx = slides.indexOf(targetSlide);
    if (idx < 0) return;
    e.preventDefault();
    const deckDocTop = Math.round(window.scrollY + homeDeck.getBoundingClientRect().top);
    const destY = idx === 0 ? 0 : deckDocTop + seg.restStarts[idx] + 4;
    window.scrollTo({ top: destY, behavior: 'smooth' });
  });

  // Keyboard Tab navigation smoothly reveals focused slide or pans tall slide to focused item
  homeDeck.addEventListener('focusin', (e) => {
    if (fanMode || reducedMotion) return;
    const target = e.target as HTMLElement | null;
    const targetSlide = target?.closest<HTMLElement>('.slide-section');
    if (!target || !targetSlide) return;
    const idx = slides.indexOf(targetSlide);
    if (idx < 0) return;

    const deckRect = homeDeck.getBoundingClientRect();
    const pos = Math.max(0, -deckRect.top);
    const deckDocTop = Math.round(window.scrollY + deckRect.top);

    if (idx === 0 && wipe1Progress > 0.05) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (idx > 0 && (pos < seg.restStarts[idx] - 4 || pos > seg.restEnds[idx])) {
      window.scrollTo({ top: deckDocTop + seg.restStarts[idx] + 4, behavior: 'smooth' });
      return;
    }

    const vh = window.innerHeight || document.documentElement.clientHeight;
    const elRect = target.getBoundingClientRect();
    if (elRect.bottom > vh - 24) {
      const nextPos = Math.min(seg.restEnds[idx], pos + Math.ceil(elRect.bottom - vh + 48));
      window.scrollTo({ top: deckDocTop + nextPos, behavior: 'smooth' });
    } else if (elRect.top < 24) {
      const nextPos = Math.max(seg.restStarts[idx], pos - Math.ceil(24 - elRect.top + 48));
      window.scrollTo({ top: deckDocTop + nextPos, behavior: 'smooth' });
    }
  });

  return {
    isFanMode: () => fanMode,
    toggleFanMode: () => {
      fanMode = !fanMode;
      homeDeck.classList.toggle('is-fan-mode', fanMode);
      homeDeck.dataset.deckMode = fanMode ? 'fan' : 'scroll-wipe';
      syncLayout();
      updateDeckState();
      return fanMode;
    },
    getWipe1Progress: () => wipe1Progress,
    setOnHeroUnbury: (cb) => {
      onHeroUnburyCb = cb;
    }
  };
}
