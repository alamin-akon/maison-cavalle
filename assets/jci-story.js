/**
 * Maison Cavallé — story.
 *
 * Two behaviours, both ported from the prototype's activateMotion:
 *
 *   1. Reveal — the section fades up once, the first time it enters view.
 *   2. Tilt   — the framed film leans towards the pointer on a fine-pointer
 *               device, and returns to flat on leave.
 *
 * Both are opt-in from the section settings and both stand down under
 * prefers-reduced-motion, matching the prototype.
 */
const TILT_MAX_DEGREES = 4;
const REVEAL_ROOT_MARGIN = '0px 0px -8% 0px';
const REVEAL_THRESHOLD = 0.08;

class JciStory extends HTMLElement {
  #observer = null;
  #tiltRafId = null;

  connectedCallback() {
    this.frame = this.querySelector('[data-jci-story-tilt]');
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.#setupReveal();
    this.#setupTilt();
  }

  disconnectedCallback() {
    this.#observer?.disconnect();
    this.#observer = null;

    if (this.#tiltRafId !== null) {
      cancelAnimationFrame(this.#tiltRafId);
      this.#tiltRafId = null;
    }

    if (this.frame) {
      this.frame.removeEventListener('pointermove', this.#handlePointerMove);
      this.frame.removeEventListener('pointerleave', this.#handlePointerLeave);
    }
  }

  /**
   * The prototype reveals once and unobserves. Without an IntersectionObserver,
   * or under reduced motion, the section is shown immediately rather than left
   * at opacity 0.
   */
  #setupReveal() {
    if (!this.hasAttribute('data-jci-story-reveal')) return;

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

  /**
   * Coarse pointers get no tilt — the prototype gates on (pointer: fine) so a
   * touch drag never leaves the frame stuck at an angle.
   */
  #setupTilt() {
    if (!this.frame) return;
    if (!this.hasAttribute('data-jci-story-tilt-enabled')) return;
    if (this.reducedMotion) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    this.frame.addEventListener('pointermove', this.#handlePointerMove);
    this.frame.addEventListener('pointerleave', this.#handlePointerLeave);
  }

  #handlePointerMove = (event) => {
    if (this.#tiltRafId !== null) return;

    this.#tiltRafId = requestAnimationFrame(() => {
      this.#tiltRafId = null;

      const bounds = this.frame.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;

      // -0.5 … 0.5 from the frame's centre, so the sign drives the lean.
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;

      this.frame.style.setProperty('--jci-story-tilt-x', `${(-y * TILT_MAX_DEGREES).toFixed(2)}deg`);
      this.frame.style.setProperty('--jci-story-tilt-y', `${(x * TILT_MAX_DEGREES).toFixed(2)}deg`);
    });
  };

  #handlePointerLeave = () => {
    if (this.#tiltRafId !== null) {
      cancelAnimationFrame(this.#tiltRafId);
      this.#tiltRafId = null;
    }

    this.frame.style.setProperty('--jci-story-tilt-x', '0deg');
    this.frame.style.setProperty('--jci-story-tilt-y', '0deg');
  };
}

if (!customElements.get('jci-story')) {
  customElements.define('jci-story', JciStory);
}
