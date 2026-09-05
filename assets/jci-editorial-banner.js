/**
 * Maison Cavallé — editorial banner.
 *
 * A crossfading collage with previous/next controls and an autoplay that steps
 * aside whenever someone is interacting: pointer over the collage, or focus
 * inside it.
 *
 * Ported from the prototype's setupEditorialSlider, plus the reveal half of
 * activateMotion.
 */
const REVEAL_ROOT_MARGIN = '0px 0px -8% 0px';
const REVEAL_THRESHOLD = 0.08;

class JciEditorialBanner extends HTMLElement {
  #index = 0;
  #timer = null;
  #observer = null;

  connectedCallback() {
    this.slider = this.querySelector('[data-jci-editorial-slider]');
    this.slides = [...this.querySelectorAll('[data-jci-editorial-slide]')];
    this.counter = this.querySelector('[data-jci-editorial-current]');
    this.controls = [...this.querySelectorAll('[data-jci-editorial-control]')];

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.interval = Number(this.dataset.jciEditorialInterval) || 5600;

    this.#setupReveal();

    // Films are driven from here rather than by an autoplay attribute: a slide
    // that is hidden must not be playing, and the one that becomes active has
    // to be told to start.
    this.#syncFilms();

    // One slide has nothing to advance to, so the controls stay out of the way.
    if (this.slides.length < 2) {
      this.slider?.classList.add('is-single');
      return;
    }

    for (const control of this.controls) {
      control.addEventListener('click', this.#handleControlClick);
    }

    this.slider?.addEventListener('pointerenter', this.#stopAuto);
    this.slider?.addEventListener('pointerleave', this.#startAuto);
    this.slider?.addEventListener('focusin', this.#stopAuto);
    this.slider?.addEventListener('focusout', this.#handleFocusOut);

    this.#update(0);
    this.#startAuto();
  }

  disconnectedCallback() {
    this.#stopAuto();
    this.#observer?.disconnect();
    this.#observer = null;

    for (const control of this.controls) {
      control.removeEventListener('click', this.#handleControlClick);
    }

    this.slider?.removeEventListener('pointerenter', this.#stopAuto);
    this.slider?.removeEventListener('pointerleave', this.#startAuto);
    this.slider?.removeEventListener('focusin', this.#stopAuto);
    this.slider?.removeEventListener('focusout', this.#handleFocusOut);
  }

  #setupReveal() {
    if (!this.hasAttribute('data-jci-editorial-reveal')) return;

    if (this.reducedMotion || !('IntersectionObserver' in window)) {
      this.classList.add('is-revealed');
      return;
    }

    this.#observer = new IntersectionObserver(
      (entries, observer) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: REVEAL_ROOT_MARGIN, threshold: REVEAL_THRESHOLD }
    );

    this.#observer.observe(this);
  }

  #update(nextIndex) {
    const total = this.slides.length;
    this.#index = ((nextIndex % total) + total) % total;

    this.slides.forEach((slide, index) => {
      const isActive = index === this.#index;
      slide.classList.toggle('is-active', isActive);
      slide.setAttribute('aria-hidden', String(!isActive));
    });

    if (this.counter) {
      this.counter.textContent = String(this.#index + 1).padStart(2, '0');
    }

    this.#syncFilms();
  }

  /**
   * Every film off, then the active slide's back on. Rewinding on the way out
   * means a slide always returns to its first frame.
   */
  #syncFilms() {
    this.slides.forEach((slide, index) => {
      // A slide can carry a film in each frame, so both are handled.
      for (const film of slide.querySelectorAll('video')) {
        film.muted = true;

        if (index !== this.#index) {
          film.pause();
          try {
            film.currentTime = 0;
          } catch {
            /* Metadata is still loading; it will rewind on the next play. */
          }
          continue;
        }

        if (this.reducedMotion) continue;

        const start = () => {
          film.play().catch(() => {
            /* Autoplay can be refused; the poster stays up. */
          });
        };

        if (film.readyState >= 2) start();
        else film.addEventListener('canplay', start, { once: true });
      }
    });
  }

  #startAuto = () => {
    if (this.reducedMotion) return;
    if (!this.hasAttribute('data-jci-editorial-autoplay')) return;

    this.#stopAuto();
    this.#timer = window.setInterval(() => this.#update(this.#index + 1), this.interval);
  };

  #stopAuto = () => {
    if (this.#timer === null) return;
    window.clearInterval(this.#timer);
    this.#timer = null;
  };

  #handleControlClick = (event) => {
    const direction = event.currentTarget.dataset.jciEditorialControl === 'next' ? 1 : -1;
    this.#update(this.#index + direction);
    this.#startAuto();
  };

  /* Focus moving between two controls should not restart autoplay. */
  #handleFocusOut = (event) => {
    if (this.slider?.contains(event.relatedTarget)) return;
    this.#startAuto();
  };
}

if (!customElements.get('jci-editorial-banner')) {
  customElements.define('jci-editorial-banner', JciEditorialBanner);
}
