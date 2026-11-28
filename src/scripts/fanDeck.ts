export interface FanDeckController {
  isFanMode: () => boolean;
  toggleFanMode: () => boolean;
  getWipe1Progress: () => number;
  setOnHeroUnbury: (cb: () => void) => void;
  jumpToSlide: (index: number) => void;
}

interface SegmentLayout {
  stageH: number;
  vw: number;
  wipeLen: number;
  extraH: number[];
  wipeStarts: number[];
  wipeEnds: number[];
  restStarts: number[];
  restEnds: number[];
  totalRunwayPx: number;
}

interface RibLacquer {
  hi: string;
  mid: string;
  core: string;
  deep: string;
  edge: string;
  rim: string;
  bottomEdge: string;
  grainDark: string;
  grainLight: string;
  shadow: string;
}

// Sculpted 3D fan-rib palettes strictly matching each page's exact background color
// (Ivory Paper #F5F4EE / Warm Stone #EAE8DF / Obsidian Ink #111317)
const RIB_LACQUERS: Record<'paper' | 'sunk' | 'ink', RibLacquer> = {
  paper: {
    hi: '#FFFFFF',
    mid: '#F8F7F2',
    core: '#F5F4EE',
    deep: '#E2DFD3',
    edge: '#C7C2B2',
    rim: '#FFFFFF',
    bottomEdge: 'rgba(17, 19, 23, 0.36)',
    grainDark: 'rgba(17, 19, 23, 0.09)',
    grainLight: 'rgba(255, 255, 255, 0.65)',
    shadow: 'rgba(17, 19, 23, 0.24)',
  },
  sunk: {
    hi: '#F7F6F0',
    mid: '#EEECE3',
    core: '#EAE8DF',
    deep: '#D5D1C3',
    edge: '#B8B3A2',
    rim: '#FCFBF7',
    bottomEdge: 'rgba(17, 19, 23, 0.40)',
    grainDark: 'rgba(17, 19, 23, 0.11)',
    grainLight: 'rgba(255, 255, 255, 0.55)',
    shadow: 'rgba(17, 19, 23, 0.26)',
  },
  ink: {
    hi: '#3D4350',
    mid: '#1E2129',
    core: '#111317',
    deep: '#0A0B0E',
    edge: '#040507',
    rim: 'rgba(245, 244, 238, 0.42)',
    bottomEdge: 'rgba(0, 0, 0, 0.85)',
    grainDark: 'rgba(0, 0, 0, 0.32)',
    grainLight: 'rgba(245, 244, 238, 0.14)',
    shadow: 'rgba(0, 0, 0, 0.48)',
  },
};

/**
 * Dual-mode seamless page deck:
 * 1) Default ("scroll-wipe"): Single-blade Bad Apple!!-inspired 4-corner fan-rib sweep
 *    (TL -> TR -> BR -> BL) locked mathematically to the clip-path cut line.
 * 2) Easter egg ("fan"): 5-click 's' toggles the alternating tilting folding-fan frosted card deck.
 */
export function initFanDeck(homeDeck: HTMLElement): FanDeckController | null {
  const stage = homeDeck.querySelector<HTMLElement>('.deck-stage');
  const spacer = homeDeck.querySelector<HTMLElement>('[data-deck-spacer]');
  const sweeper = homeDeck.querySelector<HTMLElement>('[data-fan-sweeper]');
  const rail = homeDeck.querySelector<HTMLElement>('[data-deck-rail]');
  const toast = homeDeck.querySelector<HTMLElement>('[data-deck-toast]');
  const slides = Array.from(homeDeck.querySelectorAll<HTMLElement>('.slide-section'));
  if (!stage || slides.length === 0) return null;

  const cards = slides.map((s) => s.querySelector<HTMLElement>('.deck-card'));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isZh = document.documentElement.lang.toLowerCase().startsWith('zh');

  let fanMode = false;
  let wipe1Progress = 0;
  let heroWasBuried = false;
  let onHeroUnburyCb: (() => void) | null = null;
  let rafId = 0;
  let toastTimer: number | null = null;
  let railButtons: HTMLButtonElement[] = [];

  let seg: SegmentLayout = {
    stageH: 820,
    vw: 1440,
    wipeLen: 640,
    extraH: slides.map(() => 0),
    wipeStarts: [0],
    wipeEnds: [0],
    restStarts: [0],
    restEnds: [0],
    totalRunwayPx: 2400,
  };

  const getHeaderHeight = () => {
    const mh = document.querySelector<HTMLElement>('.masthead');
    return mh ? Math.round(mh.getBoundingClientRect().height) : 72;
  };

  const showToast = (message: string) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    if (toastTimer !== null) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove('is-visible');
      toastTimer = null;
    }, 3400);
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

  const jumpToSlide = (idx: number) => {
    if (idx < 0 || idx >= slides.length) return;
    if (reducedMotion || fanMode) {
      const target = slides[idx];
      const top = Math.max(0, Math.round(window.scrollY + target.getBoundingClientRect().top - getHeaderHeight()));
      window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' });
      return;
    }
    const deckDocTop = Math.round(window.scrollY + homeDeck.getBoundingClientRect().top - getHeaderHeight());
    const destY = idx === 0 ? 0 : Math.max(0, deckDocTop + seg.restStarts[idx] + 4);
    window.scrollTo({ top: destY, behavior: 'smooth' });
  };

  if (rail && slides.length > 1 && !reducedMotion) {
    rail.innerHTML = '';
    railButtons = slides.map((_, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'deck-rail-dot';
      const labelNum = `0${idx + 1}`;
      btn.setAttribute('aria-label', isZh ? `前往第${idx + 1}屏` : `Go to section ${idx + 1}`);
      btn.innerHTML = `<span class="rail-num">${labelNum}</span><span class="rail-tick"></span>`;
      btn.addEventListener('click', () => jumpToSlide(idx));
      rail.appendChild(btn);
      return btn;
    });
  } else if (rail) {
    rail.hidden = true;
  }

  const syncRailAndTheme = (activeIdx: number) => {
    const activeSlide = slides[activeIdx];
    const isDark = Boolean(activeSlide?.classList.contains('ink-section'));
    homeDeck.dataset.deckTheme = isDark ? 'ink' : 'paper';
    railButtons.forEach((btn, idx) => {
      btn.setAttribute('aria-current', idx === activeIdx ? 'true' : 'false');
    });
  };

  const syncLayout = () => {
    const headerH = getHeaderHeight();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const stageH = Math.max(360, stage.clientHeight || Math.round(vh - headerH));
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
      const availH = Math.max(360, vh - headerH);
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
        const topOffset = h > availH ? Math.round(vh - h) : headerH;
        slide.style.top = `${topOffset}px`;
      }
      return;
    }

    if (sweeper) sweeper.style.opacity = '0';
    const extraH = cards.map((card, i) => {
      if (!card) return 0;
      const measured = Math.max(card.scrollHeight, slides[i].scrollHeight);
      return Math.max(0, Math.round(measured - stageH));
    });
    const wipeLen = Math.round(Math.max(440, Math.min(720, stageH * 0.82)));
    const pauseLen = Math.round(Math.max(90, Math.min(165, stageH * 0.16)));

    let cursor = extraH[0] + 40;
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
      stageH,
      vw,
      wipeLen,
      extraH,
      wipeStarts,
      wipeEnds,
      restStarts,
      restEnds,
      totalRunwayPx: cursor,
    };

    if (spacer) spacer.style.height = `${cursor}px`;
    slides.forEach((s) => {
      s.style.top = '';
    });
  };

  const updateDeckState = () => {
    rafId = 0;
    const headerH = getHeaderHeight();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const stageH = Math.max(360, stage.clientHeight || Math.round(vh - headerH));
    const vw = stage.clientWidth || window.innerWidth || document.documentElement.clientWidth;

    if (reducedMotion) {
      slides.forEach((slide) => slide.classList.add('is-active'));
      return;
    }

    if (!fanMode) {
      const deckRect = homeDeck.getBoundingClientRect();
      const pos = Math.max(0, Math.min(seg.totalRunwayPx, headerH - deckRect.top));

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
          const thetaDeg = rawPToTheta(p, vw, stageH);
          slide.style.clipPath = computeSweepClip(thetaDeg, vw, stageH, fromLeft, fromBottom);
        }
      }

      if (sweeper) {
        if (wipingIdx > 0) {
          const p = wipeP[wipingIdx];
          const corner = (wipingIdx - 1) % 4;
          const thetaDeg = rawPToTheta(p, vw, stageH);
          const alpha =
            thetaDeg < -1
              ? Math.max(0, (thetaDeg + 4) / 3)
              : thetaDeg > 92
                ? Math.max(0, (95 - thetaDeg) / 3)
                : 1;
          const incomingCard = cards[wipingIdx];
          const surface: keyof typeof RIB_LACQUERS = incomingCard?.classList.contains('deck-ink')
            ? 'ink'
            : incomingCard?.classList.contains('deck-sunk')
              ? 'sunk'
              : 'paper';
          const lacquer = RIB_LACQUERS[surface];
          sweeper.style.setProperty('--rib-hi', lacquer.hi);
          sweeper.style.setProperty('--rib-mid', lacquer.mid);
          sweeper.style.setProperty('--rib-core', lacquer.core);
          sweeper.style.setProperty('--rib-deep', lacquer.deep);
          sweeper.style.setProperty('--rib-edge', lacquer.edge);
          sweeper.style.setProperty('--rib-rim', lacquer.rim);
          sweeper.style.setProperty('--rib-bottom-edge', lacquer.bottomEdge);
          sweeper.style.setProperty('--rib-grain-dark', lacquer.grainDark);
          sweeper.style.setProperty('--rib-grain-light', lacquer.grainLight);
          sweeper.style.setProperty('--blade-shadow', lacquer.shadow);
          sweeper.style.opacity = alpha.toFixed(3);
          sweeper.style.transform = getSweeperTransform(thetaDeg, vw, stageH, corner);
        } else {
          sweeper.style.opacity = '0';
        }
      }

      const activeRailIdx = wipingIdx > 0 && wipeP[wipingIdx] > 0.5 ? wipingIdx : baseIdx;
      syncRailAndTheme(activeRailIdx);
      return;
    }

    // Easter egg mode (5 clicks on 's'): Alternating tilting folding-fan frosted card deck
    const shellW = Math.min(vw - Math.max(38.4, Math.min(vw * 0.08, 115.2)), 1312);
    const gutterPx = Math.max(16, (vw - shellW) * 0.5);
    const safeMidDeg = (Math.max(8, gutterPx - 3) / Math.max(480, vh * 0.72)) * (180 / Math.PI);
    const maxAngle = Math.min(10.5, Math.max(2.6, safeMidDeg * 2));
    const shiftFactor = Math.max(0, Math.min(1, (gutterPx - 24) / 56));
    const maxShiftVw = 2.6 * shiftFactor;
    const maxOutAngle = Math.min(2.5, maxAngle * 0.28);
    const enterSpan = vh * 0.88;
    let activeFanIdx = 0;

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const card = cards[i];
      const rect = slide.getBoundingClientRect();
      const nextSlide = i < slides.length - 1 ? slides[i + 1] : null;
      const nextRect = nextSlide ? nextSlide.getBoundingClientRect() : null;

      if (rect.top <= vh * 0.45) activeFanIdx = i;

      const settledTarget = card || slide;
      if (i > 0) {
        const rawSettled = 1 - Math.max(0, Math.min(rect.top - headerH, vh * 0.45)) / (vh * 0.45);
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

      const isBuried = Boolean(nextRect && nextRect.top <= headerH + 18);
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

    syncRailAndTheme(activeFanIdx);
  };

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
    jumpToSlide(idx);
  });

  homeDeck.addEventListener('focusin', (e) => {
    if (fanMode || reducedMotion) return;
    const target = e.target as HTMLElement | null;
    const targetSlide = target?.closest<HTMLElement>('.slide-section');
    if (!target || !targetSlide) return;
    const idx = slides.indexOf(targetSlide);
    if (idx < 0) return;

    const headerH = getHeaderHeight();
    const deckRect = homeDeck.getBoundingClientRect();
    const pos = Math.max(0, headerH - deckRect.top);
    const deckDocTop = Math.round(window.scrollY + deckRect.top - headerH);

    if (idx === 0 && wipe1Progress > 0.05) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (idx > 0 && (pos < seg.restStarts[idx] - 4 || pos > seg.restEnds[idx])) {
      window.scrollTo({ top: Math.max(0, deckDocTop + seg.restStarts[idx] + 4), behavior: 'smooth' });
      return;
    }

    const vh = window.innerHeight || document.documentElement.clientHeight;
    const elRect = target.getBoundingClientRect();
    if (elRect.bottom > vh - 24) {
      const nextPos = Math.min(seg.restEnds[idx], pos + Math.ceil(elRect.bottom - vh + 48));
      window.scrollTo({ top: Math.max(0, deckDocTop + nextPos), behavior: 'smooth' });
    } else if (elRect.top < headerH + 24) {
      const nextPos = Math.max(seg.restStarts[idx], pos - Math.ceil(headerH + 24 - elRect.top + 48));
      window.scrollTo({ top: Math.max(0, deckDocTop + nextPos), behavior: 'smooth' });
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
      showToast(
        fanMode
          ? (isZh ? '彩蛋换页模式已开启' : 'Easter egg page-flip mode enabled')
          : (isZh ? '已切回默认扇叶切屏' : 'Default fan-blade sweep restored')
      );
      return fanMode;
    },
    getWipe1Progress: () => wipe1Progress,
    setOnHeroUnbury: (cb) => {
      onHeroUnburyCb = cb;
    },
    jumpToSlide,
  };
}
