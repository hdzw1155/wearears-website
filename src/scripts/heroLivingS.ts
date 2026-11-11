import type { FanDeckController } from './fanDeck';

/**
 * Interactive living "s" choreography in the homepage WearEars wordmark:
 * delayed droplet hop -> single slow sibling tour -> idle back-corner daydreaming,
 * plus a 5-click wiggle easter egg that toggles between Rosewood sweep & Fan deck mode.
 */
export function initHeroLivingS(homeDeck: HTMLElement, deck: FanDeckController): void {
  const slides = Array.from(homeDeck.querySelectorAll<HTMLElement>('.slide-section'));
  const heroSlide = slides[0];
  if (!heroSlide) return;

  const sEl = heroSlide.querySelector<HTMLElement>('.hero-letter-s');
  const allLetters = Array.from(heroSlide.querySelectorAll<HTMLElement>('.hero-letter'));
  const siblingLetters = allLetters.slice(0, -1).reverse(); // r, a, E, r, a, e, W
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!sEl || siblingLetters.length === 0 || reducedMotion) return;

  let scriptRunId = 0;
  let idleTimerId: number | null = null;
  let introHopTimerId: number | null = null;
  let isIdleRunning = false;
  let isRecovering = false;
  let hasFinishedTour = false;
  let activeAnimations: Animation[] = [];
  let sTapCount = 0;
  let sTapResetTimer: number | null = null;
  let pokeAnim: Animation | null = null;
  let pendingWiggle = false;

  const clearAnimations = () => {
    activeAnimations.forEach((a) => {
      try { a.cancel(); } catch {}
    });
    activeAnimations = [];
  };

  const waitMs = (ms: number, runId: number) =>
    new Promise<boolean>((resolve) => {
      window.setTimeout(() => resolve(runId === scriptRunId), ms);
    });

  const playAnim = (
    el: HTMLElement,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions,
    runId: number
  ) =>
    new Promise<boolean>((resolve) => {
      if (runId !== scriptRunId) return resolve(false);
      const anim = el.animate(keyframes, options);
      activeAnimations.push(anim);
      anim.onfinish = () => {
        activeAnimations = activeAnimations.filter((a) => a !== anim);
        if (runId === scriptRunId && options.fill === 'forwards') {
          const last = keyframes[keyframes.length - 1];
          if (last && typeof last.transform === 'string') {
            el.style.transform = last.transform;
          }
          try { anim.cancel(); } catch {}
        }
        resolve(runId === scriptRunId);
      };
      anim.oncancel = () => {
        activeAnimations = activeAnimations.filter((a) => a !== anim);
        resolve(false);
      };
    });

  const isHeroFocused = () => {
    if (document.hidden) return false;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    if (!deck.isFanMode()) {
      const deckRect = homeDeck.getBoundingClientRect();
      return deckRect.bottom > vh * 0.5 && deck.getWipe1Progress() < 0.35;
    }
    const heroRect = heroSlide.getBoundingClientRect();
    const nextRect = slides[1] ? slides[1].getBoundingClientRect() : null;
    const notCovered = !nextRect || nextRect.top > vh * 0.45;
    return heroRect.bottom > vh * 0.5 && notCovered;
  };

  const playIntroHop = () => {
    if (!isHeroFocused() || isIdleRunning) return;
    sEl.animate(
      [
        { transform: 'translate3d(0, 0, 0) scale(1, 1)', offset: 0 },
        { transform: 'translate3d(0, 2px, 0) scale(1.13, 0.85)', offset: 0.15 },
        { transform: 'translate3d(0, -23px, 0) scale(0.88, 1.15)', offset: 0.44 },
        { transform: 'translate3d(0, 2px, 0) scale(1.14, 0.84)', offset: 0.72 },
        { transform: 'translate3d(0, -5px, 0) scale(0.95, 1.06)', offset: 0.86 },
        { transform: 'translate3d(0, 0, 0) scale(1, 1)', offset: 1 }
      ],
      { duration: 580, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
    );
  };

  const scheduleIntroHop = () => {
    if (introHopTimerId !== null) window.clearTimeout(introHopTimerId);
    introHopTimerId = window.setTimeout(() => {
      introHopTimerId = null;
      playIntroHop();
    }, 1720);
  };

  deck.setOnHeroUnbury(scheduleIntroHop);

  const startIdleMonitor = () => {
    if (idleTimerId !== null) window.clearTimeout(idleTimerId);
    idleTimerId = window.setTimeout(() => {
      idleTimerId = null;
      if (isHeroFocused() && !isIdleRunning) {
        void runIdleChoreography();
      }
    }, 5800);
  };

  const disturbLetter = async (letter: HTMLElement, runId: number) => {
    letter.style.zIndex = '3';
    const ok1 = await playAnim(
      letter,
      [
        { transform: 'translate3d(0, 0, 0) scale(1, 1)', offset: 0 },
        { transform: 'translate3d(0, 1px, 0) scale(1.06, 0.90)', offset: 0.22 },
        { transform: 'translate3d(0, -1px, 0) scale(0.97, 1.04)', offset: 0.48 },
        { transform: 'translate3d(0, 1px, 0) scale(1.06, 0.90)', offset: 0.74 },
        { transform: 'translate3d(0, 0, 0) scale(0.99, 1.02)', offset: 1 }
      ],
      { duration: 440, easing: 'ease-in-out' },
      runId
    );
    if (!ok1) {
      letter.style.zIndex = '';
      return false;
    }

    const ok2 = await playAnim(
      letter,
      [
        { transform: 'translate3d(0, 0, 0) scale(1, 1)', offset: 0 },
        { transform: 'translate3d(0, -5px, 0) scale(1.11, 1.16)', offset: 0.28 },
        { transform: 'translate3d(0, -4px, 0) scale(1.11, 1.16)', offset: 0.70 },
        { transform: 'translate3d(0, 0, 0) scale(1, 1)', offset: 1 }
      ],
      { duration: 920, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      runId
    );
    letter.style.zIndex = '';
    return ok2;
  };

  const runIdleChoreography = async () => {
    const runId = ++scriptRunId;
    isIdleRunning = true;
    sEl.style.zIndex = '4';

    let curX = 0;

    const lookAround = async (xBase: number, slow = false) => {
      const durLook = slow ? 1950 : 1650;
      if (!(await playAnim(
        sEl,
        [
          { transform: `translate3d(${xBase}px, 0, 0) rotate(0deg) scale(0.97, 1.03)`, offset: 0 },
          { transform: `translate3d(${xBase - 2}px, 0, 0) rotate(-14deg) scale(0.97, 1.03)`, offset: 0.18 },
          { transform: `translate3d(${xBase - 2}px, 0, 0) rotate(-14deg) scale(0.97, 1.03)`, offset: 0.36 },
          { transform: `translate3d(${xBase + 2}px, 0, 0) rotate(13deg) scale(0.97, 1.03)`, offset: 0.56 },
          { transform: `translate3d(${xBase + 2}px, 0, 0) rotate(13deg) scale(0.97, 1.03)`, offset: 0.74 },
          { transform: `translate3d(${xBase}px, -4px, 0) rotate(-3deg) scale(0.96, 1.05)`, offset: 0.87 },
          { transform: `translate3d(${xBase}px, 0, 0) rotate(0deg) scale(1, 1)`, offset: 1 }
        ],
        { duration: durLook, easing: 'ease-in-out', fill: 'forwards' },
        runId
      ))) return false;
      return true;
    };

    const lazyStretch = async (xBase: number) =>
      playAnim(
        sEl,
        [
          { transform: `translate3d(${xBase}px, 0, 0) rotate(0deg) skewX(0deg) scale(1, 1)`, offset: 0 },
          { transform: `translate3d(${xBase - 1}px, -4px, 0) rotate(-9deg) skewX(-6deg) scale(0.93, 1.11)`, offset: 0.30 },
          { transform: `translate3d(${xBase - 1}px, -4px, 0) rotate(-9deg) skewX(-6deg) scale(0.93, 1.11)`, offset: 0.52 },
          { transform: `translate3d(${xBase + 2}px, 1px, 0) rotate(7deg) skewX(5deg) scale(1.04, 0.94)`, offset: 0.78 },
          { transform: `translate3d(${xBase}px, 0, 0) rotate(0deg) skewX(0deg) scale(1, 1)`, offset: 1 }
        ],
        { duration: 1900, easing: 'ease-in-out', fill: 'forwards' },
        runId
      );

    if (!hasFinishedTour) {
      if (!(await playAnim(
        sEl,
        [
          { transform: 'translate3d(0, 0, 0) scale(1, 1)', offset: 0 },
          { transform: 'translate3d(0, 2px, 0) scale(1.12, 0.86)', offset: 0.16 },
          { transform: 'translate3d(0, -24px, 0) scale(0.89, 1.13)', offset: 0.46 },
          { transform: 'translate3d(0, 2px, 0) scale(1.08, 0.92)', offset: 0.78 },
          { transform: 'translate3d(0, 0, 0) scale(0.98, 1.03)', offset: 1 }
        ],
        { duration: 560, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' },
        runId
      ))) return;

      if (!(await lookAround(0))) return;
      if (!(await playAnim(
        sEl,
        [
          { transform: 'translate3d(0, 0, 0) rotate(0deg)', offset: 0 },
          { transform: 'translate3d(-2px, -2px, 0) rotate(-10deg)', offset: 0.3 },
          { transform: 'translate3d(2px, -2px, 0) rotate(10deg)', offset: 0.65 },
          { transform: 'translate3d(0, 0, 0) rotate(0deg)', offset: 1 }
        ],
        { duration: 720, easing: 'ease-in-out', fill: 'forwards' },
        runId
      ))) return;
      if (!(await waitMs(320, runId))) return;

      const sCenter = sEl.offsetLeft + sEl.offsetWidth * 0.5;
      for (let idx = 0; idx < siblingLetters.length; idx++) {
        if (runId !== scriptRunId || !isHeroFocused()) return;
        const target = siblingLetters[idx];
        const standbyX = Math.round(
          target.offsetLeft + target.offsetWidth + sEl.offsetWidth * 0.18 - sCenter
        );
        const midX = Math.round((curX + standbyX) * 0.5);
        const dist = Math.abs(standbyX - curX);
        const travelMs = Math.max(420, Math.min(680, dist * 2.8 + 300));
        const leanDir = standbyX < curX ? -10 : 10;

        if (!(await playAnim(
          sEl,
          [
            { transform: `translate3d(${curX}px, 0, 0) rotate(0deg)`, offset: 0 },
            { transform: `translate3d(${midX}px, -13px, 0) rotate(${leanDir}deg) scale(0.95, 1.06)`, offset: 0.5 },
            { transform: `translate3d(${standbyX}px, 0, 0) rotate(0deg) scale(1.04, 0.96)`, offset: 0.88 },
            { transform: `translate3d(${standbyX}px, 0, 0) rotate(0deg) scale(1, 1)`, offset: 1 }
          ],
          { duration: travelMs, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' },
          runId
        ))) return;
        curX = standbyX;
        if (!(await waitMs(180, runId))) return;

        if (!(await playAnim(
          sEl,
          [
            { transform: `translate3d(${curX}px, 0, 0) rotate(0deg)`, offset: 0 },
            { transform: `translate3d(${curX - 7}px, -2px, 0) rotate(-14deg)`, offset: 0.28 },
            { transform: `translate3d(${curX + 2}px, 0, 0) rotate(4deg)`, offset: 0.54 },
            { transform: `translate3d(${curX - 7}px, -2px, 0) rotate(-14deg)`, offset: 0.78 },
            { transform: `translate3d(${curX}px, 0, 0) rotate(0deg)`, offset: 1 }
          ],
          { duration: 600, easing: 'ease-in-out', fill: 'forwards' },
          runId
        ))) return;
        if (!(await waitMs(140, runId))) return;

        if (!(await disturbLetter(target, runId))) return;
        if (!(await waitMs(380, runId))) return;
      }

      if (!(await playAnim(
        sEl,
        [
          { transform: `translate3d(${curX}px, 0, 0) rotate(0deg)`, offset: 0 },
          { transform: `translate3d(${Math.round(curX * 0.5)}px, -14px, 0) rotate(12deg)`, offset: 0.5 },
          { transform: 'translate3d(2px, 0, 0) rotate(0deg)', offset: 1 }
        ],
        { duration: 680, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' },
        runId
      ))) return;
      curX = 2;
      hasFinishedTour = true;
      if (!(await waitMs(1400, runId))) return;
    }

    curX = 2;
    let cycle = 0;
    while (runId === scriptRunId && isHeroFocused()) {
      if (!(await waitMs(2400, runId))) return;
      if (cycle % 2 === 0) {
        if (!(await lookAround(curX, true))) return;
      } else {
        if (!(await lazyStretch(curX))) return;
      }
      if (!(await waitMs(1600, runId))) return;
      if (cycle % 3 === 1) {
        if (!(await playAnim(
          sEl,
          [
            { transform: `translate3d(${curX}px, 0, 0) rotate(0deg)`, offset: 0 },
            { transform: `translate3d(${curX}px, -1px, 0) rotate(-5deg)`, offset: 0.4 },
            { transform: `translate3d(${curX}px, 0, 0) rotate(4deg)`, offset: 0.75 },
            { transform: `translate3d(${curX}px, 0, 0) rotate(0deg)`, offset: 1 }
          ],
          { duration: 900, easing: 'ease-in-out', fill: 'forwards' },
          runId
        ))) return;
      }
      cycle++;
    }
  };

  const playPokeFeedback = (count: number) => {
    if (isIdleRunning || isRecovering) return;
    if (pokeAnim) {
      try { pokeAnim.cancel(); } catch {}
    }
    const dir = count % 2 === 1 ? -1 : 1;
    const tilt = (5 + count * 1.4) * dir;
    const skew = -tilt * 0.6;
    const anim = sEl.animate(
      [
        { transform: 'translate3d(0, 0, 0) scale(1, 1)', offset: 0 },
        { transform: `translate3d(0, 2px, 0) rotate(${tilt}deg) skewX(${skew}deg) scale(1.07, 0.91)`, offset: 0.35 },
        { transform: 'translate3d(0, -3px, 0) scale(0.97, 1.05)', offset: 0.72 },
        { transform: 'translate3d(0, 0, 0) scale(1, 1)', offset: 1 }
      ],
      { duration: 200, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
    );
    pokeAnim = anim;
    anim.onfinish = () => {
      if (pokeAnim === anim) pokeAnim = null;
    };
  };

  const playUnlockWiggle = () => {
    if (pokeAnim) {
      try { pokeAnim.cancel(); } catch {}
      pokeAnim = null;
    }
    sEl.style.zIndex = '4';
    const wiggleAnim = sEl.animate(
      [
        { transform: 'translate3d(0, 0, 0) rotate(0deg) skewX(0deg) scale(1, 1)', offset: 0 },
        { transform: 'translate3d(-3px, 2px, 0) rotate(-14deg) skewX(12deg) scale(1.09, 0.89)', offset: 0.14 },
        { transform: 'translate3d(4px, -6px, 0) rotate(17deg) skewX(-13deg) scale(0.93, 1.11)', offset: 0.30 },
        { transform: 'translate3d(-4px, -3px, 0) rotate(-15deg) skewX(11deg) scale(0.96, 1.07)', offset: 0.48 },
        { transform: 'translate3d(3px, -7px, 0) rotate(13deg) skewX(-10deg) scale(0.95, 1.08)', offset: 0.66 },
        { transform: 'translate3d(-1px, 2px, 0) rotate(-5deg) skewX(4deg) scale(1.06, 0.93)', offset: 0.84 },
        { transform: 'translate3d(0, 0, 0) rotate(0deg) skewX(0deg) scale(1, 1)', offset: 1 }
      ],
      { duration: 760, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
    );
    pokeAnim = wiggleAnim;
    wiggleAnim.onfinish = () => {
      if (pokeAnim === wiggleAnim) pokeAnim = null;
      if (!isIdleRunning) sEl.style.zIndex = '';
    };
    wiggleAnim.oncancel = () => {
      if (pokeAnim === wiggleAnim) pokeAnim = null;
    };
  };

  const hurryBackHome = () => {
    if (!isIdleRunning) {
      startIdleMonitor();
      return;
    }
    scriptRunId++;
    isIdleRunning = false;
    isRecovering = true;

    const computed = getComputedStyle(sEl).transform;
    let curX = 0;
    let curY = 0;
    if (computed && computed !== 'none') {
      const m = new DOMMatrix(computed);
      curX = m.m41;
      curY = m.m42;
    }

    clearAnimations();
    sEl.style.transform = '';

    siblingLetters.forEach((l) => {
      l.style.zIndex = '';
      const lt = getComputedStyle(l).transform;
      if (lt && lt !== 'none') {
        l.animate(
          [{ transform: lt }, { transform: 'translate3d(0, 0, 0) scale(1, 1)' }],
          { duration: 150, easing: 'ease-out' }
        );
      }
    });

    const dist = Math.abs(curX);
    if (dist <= 6) {
      const snapAnim = sEl.animate(
        [
          { transform: computed && computed !== 'none' ? computed : 'translate3d(0, 0, 0)' },
          { transform: 'translate3d(0, 0, 0) rotate(-3deg) scale(0.95, 1.07)', offset: 0.45 },
          { transform: 'translate3d(0, 0, 0) rotate(0deg) skewX(0deg) scale(1, 1)', offset: 1 }
        ],
        { duration: 220, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
      );
      snapAnim.onfinish = () => {
        sEl.style.zIndex = '';
        sEl.style.transform = '';
        isRecovering = false;
        if (pendingWiggle) {
          pendingWiggle = false;
          playUnlockWiggle();
        }
        startIdleMonitor();
      };
      return;
    }

    const runMs = Math.max(200, Math.min(420, dist * 0.85 + 180));
    const runDir = curX < 0 ? 1 : -1;
    const runAnim = sEl.animate(
      [
        { transform: `translate3d(${curX}px, ${curY}px, 0) rotate(${runDir * 14}deg)`, offset: 0 },
        { transform: `translate3d(${Math.round(curX * 0.65)}px, -7px, 0) rotate(${runDir * 17}deg) scale(0.96, 1.05)`, offset: 0.28 },
        { transform: `translate3d(${Math.round(curX * 0.30)}px, 0px, 0) rotate(${runDir * 15}deg)`, offset: 0.56 },
        { transform: `translate3d(${Math.round(curX * 0.08)}px, -5px, 0) rotate(${runDir * 10}deg)`, offset: 0.78 },
        { transform: 'translate3d(2px, 0, 0) rotate(-5deg) scale(0.95, 1.07)', offset: 0.90 },
        { transform: 'translate3d(0, 0, 0) rotate(0deg) scale(1, 1)', offset: 1 }
      ],
      { duration: runMs, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
    );
    runAnim.onfinish = () => {
      sEl.style.zIndex = '';
      sEl.style.transform = '';
      isRecovering = false;
      if (pendingWiggle) {
        pendingWiggle = false;
        playUnlockWiggle();
      }
      startIdleMonitor();
    };
  };

  sEl.addEventListener('click', () => {
    if (introHopTimerId !== null) {
      window.clearTimeout(introHopTimerId);
      introHopTimerId = null;
    }
    if (isIdleRunning) hurryBackHome();

    sTapCount++;
    if (sTapResetTimer !== null) window.clearTimeout(sTapResetTimer);
    sTapResetTimer = window.setTimeout(() => {
      sTapCount = 0;
      sTapResetTimer = null;
    }, 4500);

    if (sTapCount >= 5) {
      sTapCount = 0;
      if (sTapResetTimer !== null) {
        window.clearTimeout(sTapResetTimer);
        sTapResetTimer = null;
      }
      deck.toggleFanMode();
      if (isRecovering) {
        pendingWiggle = true;
      } else {
        playUnlockWiggle();
      }
    } else {
      playPokeFeedback(sTapCount);
    }
  });

  const onUserActivity = () => {
    if (isIdleRunning) {
      hurryBackHome();
    } else if (!isRecovering) {
      startIdleMonitor();
    }
  };

  ['mousemove', 'pointerdown', 'wheel', 'touchstart', 'keydown'].forEach((evt) => {
    window.addEventListener(evt, onUserActivity, { passive: true });
  });
  window.addEventListener('scroll', onUserActivity, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && isIdleRunning) {
      hurryBackHome();
    }
  });

  scheduleIntroHop();
  startIdleMonitor();
}
