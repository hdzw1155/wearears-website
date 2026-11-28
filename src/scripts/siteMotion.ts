/**
 * Lightweight architectural motion & utility controller:
 * - Sticky masthead elevation & hairline scroll progress ruler
 * - Calm IntersectionObserver reveals for standalone pages outside .home-deck
 * - On-demand 4-phase vector icon replay
 * - Copy-to-clipboard for developer terminal blocks
 */
export function initSiteMotion(): void {
  const root = document.documentElement;
  const masthead = document.querySelector<HTMLElement>('.masthead');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let scrollRaf = 0;
  const syncScroll = () => {
    scrollRaf = 0;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const maxScroll = Math.max(1, root.scrollHeight - window.innerHeight);
    const progress = Math.max(0, Math.min(1, scrollY / maxScroll));
    root.style.setProperty('--scroll-progress', progress.toFixed(4));
    if (masthead) {
      masthead.classList.toggle('is-scrolled', scrollY > 10);
    }
  };

  const onScroll = () => {
    if (!scrollRaf) scrollRaf = window.requestAnimationFrame(syncScroll);
  };

  syncScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  // Progressive scroll reveals for nodes NOT managed by FanDeck slides
  const standaloneReveals = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]')).filter(
    (node) => !node.closest('.home-deck')
  );
  if (standaloneReveals.length > 0) {
    if (reducedMotion || !('IntersectionObserver' in window)) {
      standaloneReveals.forEach((node) => node.classList.add('is-revealed'));
    } else {
      const vh = window.innerHeight || 900;
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-revealed');
              observer.unobserve(entry.target);
            }
          }
        },
        { rootMargin: '0px 0px -6% 0px', threshold: 0.06 }
      );

      for (const node of standaloneReveals) {
        const rect = node.getBoundingClientRect();
        if (rect.top < vh * 0.94) {
          node.classList.add('is-revealed');
        } else {
          observer.observe(node);
        }
      }
    }
  }

  // Click-to-replay 4-phase icon construction
  const replayIcon = (wrap: HTMLElement | null) => {
    if (!wrap || reducedMotion) return;
    wrap.classList.add('is-replaying');
    void wrap.offsetWidth;
    wrap.classList.remove('is-replaying');
  };

  document.querySelectorAll<HTMLElement>('[data-replay-icon]').forEach((wrap) => {
    wrap.addEventListener('click', () => replayIcon(wrap));
  });

  document.querySelectorAll<HTMLButtonElement>('[data-icon-replay]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const plate = btn.closest('.specimen-plate') ?? document;
      replayIcon(plate.querySelector<HTMLElement>('[data-replay-icon]'));
    });
  });

  // Copyable developer commands
  document.querySelectorAll<HTMLButtonElement>('[data-copy-code]').forEach((btn) => {
    const defaultLabel = btn.textContent ?? 'COPY';
    const doneLabel = btn.dataset.copiedLabel ?? 'COPIED';
    btn.addEventListener('click', async () => {
      const card = btn.closest('.terminal-card');
      const code = card?.querySelector<HTMLElement>('code')?.innerText ?? '';
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code.trim());
        btn.textContent = doneLabel;
        window.setTimeout(() => {
          btn.textContent = defaultLabel;
        }, 1600);
      } catch {
        // Fallback silently if clipboard permission is unavailable
      }
    });
  });
}
