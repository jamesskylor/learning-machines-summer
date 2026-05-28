/* ============================================================
   OffSeason — interactions
   ============================================================ */

(function () {
  'use strict';

  /* --- Local Toronto time --- */
  const timeEl = document.getElementById('local-time');
  if (timeEl) {
    const updateTime = () => {
      const now = new Date();
      const opts = { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Toronto' };
      timeEl.textContent = new Intl.DateTimeFormat('en-US', opts).format(now);
    };
    updateTime();
    setInterval(updateTime, 30 * 1000);
  }

  /* --- Day / Night hero background (Toronto local time)
         Day   08:00 – 17:59  → hero-toronto.png
         Night 18:00 – 07:59  → hero-toronto-night.png
         Falls back to the day image if the night file hasn't been saved yet.
         Rechecks every 10 min so a long-open tab flips at dusk/dawn. --- */
  const heroBg = document.querySelector('.hero__bg');
  if (heroBg) {
    const applySrc = (src, isNight) => {
      heroBg.style.backgroundImage = `url('${src}')`;
      heroBg.classList.toggle('hero__bg--night', isNight);
    };

    const applyDayNight = () => {
      const hour = parseInt(
        new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          hour12: false,
          timeZone: 'America/Toronto',
        }).format(new Date()),
        10
      );
      const isDay = hour >= 7 && hour < 18;
      const wantedSrc  = isDay ? heroBg.dataset.dayImage : heroBg.dataset.nightImage;
      const fallbackSrc = heroBg.dataset.dayImage;

      if (!wantedSrc) return;

      // Already applied — just sync the night class
      if (heroBg.style.backgroundImage === `url("${wantedSrc}")`) {
        heroBg.classList.toggle('hero__bg--night', !isDay);
        return;
      }

      if (isDay || !heroBg.dataset.nightImage) {
        applySrc(wantedSrc, false);
      } else {
        // Preload night image; fall back gracefully if the file doesn't exist yet
        const img = new Image();
        img.onload  = () => applySrc(wantedSrc, true);
        img.onerror = () => applySrc(fallbackSrc, false);
        img.src = wantedSrc;
      }
    };

    applyDayNight();
    setInterval(applyDayNight, 10 * 60 * 1000);
  }

  /* --- FAQ accordion --- */
  const faqList = document.getElementById('faq-list');
  if (faqList) {
    faqList.addEventListener('click', (e) => {
      const btn = e.target.closest('.faq__q');
      if (!btn) return;
      const item = btn.closest('.faq__item');
      const isOpen = item.getAttribute('aria-expanded') === 'true';
      faqList.querySelectorAll('.faq__item').forEach((el) => el.setAttribute('aria-expanded', 'false'));
      item.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
    });
  }

  /* --- Reveal-on-scroll --- */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  /* --- Adaptive nav color tracking --- */
  const navColorSections = document.querySelectorAll('[data-nav-color]:not(body)');
  const setNavColor = (value) => {
    if (document.body.dataset.navColor !== value) {
      document.body.dataset.navColor = value;
    }
  };

  if ('IntersectionObserver' in window && navColorSections.length) {
    let scheduled = false;
    const recomputeNavColor = () => {
      const threshold = 80;
      let current = null;
      let bestTop = -Infinity;
      navColorSections.forEach((s) => {
        const r = s.getBoundingClientRect();
        if (r.top <= threshold && r.top > bestTop) {
          bestTop = r.top;
          current = s;
        }
      });
      if (current && current.dataset.navColor) {
        setNavColor(current.dataset.navColor);
      }
    };

    const onScrollColor = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => { recomputeNavColor(); scheduled = false; });
    };
    window.addEventListener('scroll', onScrollColor, { passive: true });
    recomputeNavColor();
  }

  /* --- Hero: background pan + card fixed→absolute settle ---
       Pattern: hero__bottom is position:fixed at viewport bottom while
       the hero section is visible. The card is always visible from
       scroll=0 — it feels like part of the page flow (moves with the
       content, not stuck to the viewport forever). When the hero is
       about to exit (scroll ≥ heroH − vh), the card switches to
       position:absolute; bottom:5vh — it "settles" at the bottom of
       the hero and scrolls away naturally. No visual jump because the
       two positions are pixel-identical at the transition threshold.
       Background pans (20%→62%) independently the whole time. --- */
  const hero       = document.querySelector('.hero');
  const heroBottom = document.querySelector('.hero__bottom');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const updateHero = () => {
    const y     = window.scrollY;
    const heroH = hero ? hero.offsetHeight : 0;
    const vh    = window.innerHeight;

    // Background pan (always, as long as hero is near viewport)
    if (heroBg && !prefersReducedMotion && y < heroH * 1.2) {
      const bgY = Math.min(20 + y * 0.025, 62);
      heroBg.style.backgroundPosition = `center ${bgY}%`;
    }

    if (!heroBottom || prefersReducedMotion) return;

    // Settle threshold: scroll position where hero bottom == viewport bottom
    // At this exact point, fixed(bottom:5vh) == absolute(bottom:5vh) in the hero.
    const settleAt = Math.max(heroH - vh, 0);

    if (y < settleAt) {
      // Hero still filling viewport — fix card to viewport bottom
      heroBottom.style.position = 'fixed';
      heroBottom.style.bottom   = '5vh';
      heroBottom.style.top      = '';
      heroBottom.style.transform = '';
    } else {
      // Hero exiting — anchor card at bottom of hero section
      heroBottom.style.position = 'absolute';
      heroBottom.style.bottom   = '5vh';
      heroBottom.style.top      = '';
      heroBottom.style.transform = '';
    }
  };

  if (hero) {
    let ticking = false;
    const onScrollHero = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { updateHero(); ticking = false; });
    };
    window.addEventListener('scroll', onScrollHero, { passive: true });
    window.addEventListener('resize', updateHero, { passive: true });
    updateHero(); // position card immediately on load
  }

  /* --- Essay reading effect (Altalogy-style) ---
       Each .essay__p starts at low opacity.
       When it enters the viewport: fade to full opacity (is-reading).
       When it scrolls past: dim slightly but stay readable (is-read). --- */
  const essayParagraphs = document.querySelectorAll('.essay__p');
  if ('IntersectionObserver' in window && essayParagraphs.length) {
    const readObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target;
          if (entry.isIntersecting) {
            el.classList.add('is-reading');
            el.classList.remove('is-read');
          } else {
            const rect = el.getBoundingClientRect();
            if (rect.top < 0) {
              // Scrolled past — dim but keep visible
              el.classList.remove('is-reading');
              el.classList.add('is-read');
            } else {
              // Below viewport — not yet read, fully dimmed
              el.classList.remove('is-reading');
              el.classList.remove('is-read');
            }
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    essayParagraphs.forEach((p) => readObserver.observe(p));
  } else {
    // No IO support or reduced-motion — show all at full opacity
    essayParagraphs.forEach((p) => p.classList.add('is-reading'));
  }

  /* --- Email signups → auto-subscribe to skylor.substack.com ---
         Fires a no-cors POST to Substack's free-tier subscribe endpoint.
         The response is opaque (we can't read it cross-origin), so the
         UI confirms optimistically. Verify in the Substack dashboard. --- */
  const SUBSTACK_DOMAIN = 'skylor.substack.com';

  const subscribeToSubstack = (email) => {
    try {
      // Default fetch Content-Type for a string body is text/plain, which is
      // CORS-safe and won't trigger a preflight. Substack's endpoint parses
      // the body as JSON regardless.
      fetch(`https://${SUBSTACK_DOMAIN}/api/v1/free`, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          email: email,
          first_url: window.location.href,
          first_referrer: document.referrer || '',
          source: 'embed',
          domain: SUBSTACK_DOMAIN,
        }),
      }).catch(() => { /* opaque response, ignore */ });
    } catch (_) { /* no-op */ }
  };

  const handleEmailForm = (formId, okClass) => {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      if (!input) return;
      const value = (input.value || '').trim();
      if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        input.focus();
        input.setAttribute('aria-invalid', 'true');
        return;
      }
      input.removeAttribute('aria-invalid');

      // Fire-and-forget subscribe to Substack
      subscribeToSubstack(value);

      // Confirm optimistically
      form.classList.add(okClass);
      input.value = "You're on the list ✓";
      input.disabled = true;
    });
  };
  handleEmailForm('email-signup', 'foot__signup--ok');
  handleEmailForm('closing-signup', 'closing__newsletter--ok');

  /* --- Word-by-word reveal on hero title --- */
  const heroTitle = document.querySelector('.hero__title h1');
  if (heroTitle && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const text  = heroTitle.innerHTML;
    const lines = text.split(/<br\s*\/?>/i);
    heroTitle.innerHTML = lines
      .map((line, lineIdx) =>
        line.trim().split(/\s+/).map((word, wordIdx) => {
          const delay = lineIdx * 0.5 + wordIdx * 0.08;
          return `<span class="word-reveal" style="animation-delay:${delay}s">${word}</span>`;
        }).join(' ')
      )
      .join('<br/>');
  }
})();
