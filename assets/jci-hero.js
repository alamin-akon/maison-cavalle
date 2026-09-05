/**
 * Maison Cavallé — hero.
 *
 * Three moments crossfade behind the copy. A moment is selected by its tab, or
 * advances on its own when a video ends. Copy swaps with a short fade so the
 * headline does not snap.
 *
 * Ported from the prototype's setupHeroVideoSequence and the hero half of
 * activateMotion.
 */
const TITLE_SWAP_DELAY = 180;
const POINTER_SHIFT_X = 8;
const POINTER_SHIFT_Y = 6;
const SCROLL_FACTOR = 0.08;
const SCROLL_MAX = 38;

class JciHero extends HTMLElement {
  #index = 0;
  #titleSwapTimer = null;
  #scrollRafId = null;
  #hasRendered = false;

  connectedCallback() {
    this.media = this.querySelector('[data-jci-hero-media]');
    this.panel = this.querySelector('[data-jci-hero-panel]');
    this.eyebrow = this.querySelector('[data-jci-hero-eyebrow]');
    this.title = this.querySelector('[data-jci-hero-title]');
    this.copy = this.querySelector('[data-jci-hero-copy]');
    this.descriptor = this.querySelector('[data-jci-hero-descriptor]');
    this.indexLabel = this.querySelector('[data-jci-hero-index]');
    this.slides = [...this.querySelectorAll('[data-jci-hero-video]')];
    this.tabs = [...this.querySelectorAll('[data-jci-hero-slide]')];
    this.moments = this.#readMoments();

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // The tabs drive the copy, so they stay live even when no moment has a
    // video or poster yet — an empty media layer used to leave them dead.
    if (!this.slides.length && !this.tabs.length) return;

    for (const slide of this.slides) {
      if (slide instanceof HTMLVideoElement) {
        slide.addEventListener('ended', this.#handleEnded);
        slide.addEventListener('error', this.#handleError, { once: true });
      }
    }

    for (const tab of this.tabs) {
      tab.addEventListener('click', this.#handleTabClick);
      tab.addEventListener('keydown', this.#handleTabKeydown);
    }

    if (this.hasAttribute('data-jci-pointer-depth') && !this.reducedMotion) {
      this.addEventListener('pointermove', this.#handlePointerMove);
      this.addEventListener('pointerleave', this.#handlePointerLeave);
    }

    if (this.hasAttribute('data-jci-scroll-depth') && !this.reducedMotion) {
      window.addEventListener('scroll', this.#handleScroll, { passive: true });
    }

    this.#show(0);
  }

  disconnectedCallback() {
    window.removeEventListener('scroll', this.#handleScroll);
    window.clearTimeout(this.#titleSwapTimer);
    if (this.#scrollRafId !== null) cancelAnimationFrame(this.#scrollRafId);
  }

  #readMoments() {
    const node = this.querySelector('[data-jci-hero-moments]');
    if (!node) return [];

    try {
      return JSON.parse(node.textContent ?? '[]');
    } catch {
      /* Malformed JSON should not take the whole hero down. */
      return [];
    }
  }

  /* Counted off the moments, not the slides: a moment without a video still
     has a tab and copy to show, and an empty slide list would divide by zero. */
  #normalize(index) {
    const count = this.moments.length || this.tabs.length || this.slides.length;
    if (!count) return 0;
    return (((Number(index) || 0) % count) + count) % count;
  }

  /* --- Presentation --- */

  #titleMarkup(moment) {
    const words = String(moment.title ?? '').trim().split(/\s+/).filter(Boolean);
    const accentFrom = Number.isInteger(moment.accentFrom) ? moment.accentFrom : Math.ceil(words.length / 2);

    return words
      .map((word, i) => {
        const span = document.createElement('span');
        span.className = 'jci-hero-title-word';
        span.style.setProperty('--jci-word-index', String(i));
        if (i >= accentFrom) span.dataset.jciHeroAccent = 'true';
        span.textContent = word;
        return span.outerHTML;
      })
      .join(' ');
  }

  #present(index) {
    const moment = this.moments[index];
    if (!moment) return;

    if (this.eyebrow) this.eyebrow.textContent = moment.eyebrow ?? '';
    if (this.copy) this.copy.textContent = moment.copy ?? '';
    if (this.descriptor) this.descriptor.textContent = moment.descriptor ?? '';
    if (this.indexLabel) this.indexLabel.textContent = String(index + 1).padStart(2, '0');

    if (this.title) {
      const markup = this.#titleMarkup(moment);
      window.clearTimeout(this.#titleSwapTimer);

      if (!this.reducedMotion && this.#hasRendered) {
        this.panel?.classList.add('is-changing');
        this.#titleSwapTimer = window.setTimeout(() => {
          this.title.innerHTML = markup;
          this.panel?.classList.remove('is-changing');
        }, TITLE_SWAP_DELAY);
      } else {
        this.title.innerHTML = markup;
      }
    }

    this.tabs.forEach((tab, i) => {
      const active = i === index;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });

    this.#hasRendered = true;
  }

  #show(index) {
    this.#index = this.#normalize(index);
    this.#present(this.#index);

    this.slides.forEach((slide, i) => {
      const active = i === this.#index;
      slide.classList.toggle('is-active', active);

      if (!active && slide instanceof HTMLVideoElement) {
        slide.pause();
        /* currentTime throws while metadata is still loading. */
        try {
          slide.currentTime = 0;
        } catch {
          /* Rewind on the next play instead. */
        }
      }
    });

    if (this.reducedMotion) return;

    const active = this.slides[this.#index];
    if (!(active instanceof HTMLVideoElement)) return;

    active.muted = true;
    const start = () => {
      try {
        if (active.readyState >= 1) active.currentTime = 0;
      } catch {
        /* Play from wherever it is. */
      }
      active.play().catch(() => {
        /* Autoplay can be refused; the poster stays up. */
      });
    };

    if (active.readyState >= 1) start();
    else active.addEventListener('loadedmetadata', start, { once: true });
  }

  /* --- Events --- */

  #handleEnded = (event) => {
    if (!this.hasAttribute('data-jci-autoplay')) return;
    if (this.slides.indexOf(event.currentTarget) !== this.#index) return;
    this.#show(this.#index + 1);
  };

  #handleError = (event) => {
    /* A moment whose video will not load should not stall the sequence. */
    if (this.reducedMotion || this.slides.length < 2) return;
    if (this.slides.indexOf(event.currentTarget) !== this.#index) return;
    this.#show(this.#index + 1);
  };

  #handleTabClick = (event) => {
    this.#show(Number(event.currentTarget.dataset.jciHeroSlide));
  };

  #handleTabKeydown = (event) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();

    let next;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = this.tabs.length - 1;
    else next = this.#index + (event.key === 'ArrowRight' ? 1 : -1);

    this.#show(next);
    this.tabs[this.#index]?.focus();
  };

  #handlePointerMove = (event) => {
    if (event.pointerType !== 'mouse') return;

    const rect = this.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    this.style.setProperty('--jci-hero-shift-x', `${(x * POINTER_SHIFT_X).toFixed(2)}px`);
    this.style.setProperty('--jci-hero-shift-y', `${(y * POINTER_SHIFT_Y).toFixed(2)}px`);
  };

  #handlePointerLeave = () => {
    this.style.setProperty('--jci-hero-shift-x', '0px');
    this.style.setProperty('--jci-hero-shift-y', '0px');
  };

  #handleScroll = () => {
    if (this.#scrollRafId !== null) return;

    this.#scrollRafId = requestAnimationFrame(() => {
      this.#scrollRafId = null;
      const drift = Math.min(window.scrollY * SCROLL_FACTOR, SCROLL_MAX);
      this.style.setProperty('--jci-hero-scroll-y', `${drift}px`);
    });
  };
}

if (!customElements.get('jci-hero')) {
  customElements.define('jci-hero', JciHero);
}
