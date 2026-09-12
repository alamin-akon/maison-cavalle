/**
 * Maison Cavallé — home FAQ.
 *
 * <details> snaps open and shut. This animates the answer's height instead,
 * keeping the element semantics intact: the click is intercepted, the height
 * is animated, and `open` is set at the right end of the transition so the
 * markup is always honest about what is showing.
 *
 * With no JS, or under prefers-reduced-motion, the accordion behaves exactly
 * as the browser's own <details> does.
 */
const DEFAULT_DURATION = 320;
const EASING = 'cubic-bezier(0.22, 0.61, 0.36, 1)';

class JciHomeFaq extends HTMLElement {
  #animations = new WeakMap();

  connectedCallback() {
    this.items = [...this.querySelectorAll('[data-jci-faq-item]')];
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.duration = Number(this.dataset.jciFaqDuration) || DEFAULT_DURATION;
    this.singleOpen = this.hasAttribute('data-jci-faq-single');

    // Under reduced motion the height animation is skipped, so <details> is
    // left to toggle itself. Single-open still has to hold, so it rides the
    // native toggle event instead of the intercepted click.
    if (this.reducedMotion) {
      if (this.singleOpen) this.addEventListener('toggle', this.#handleToggle, true);
      return;
    }

    for (const item of this.items) {
      item.querySelector('[data-jci-faq-summary]')?.addEventListener('click', this.#handleClick);
    }
  }

  disconnectedCallback() {
    this.removeEventListener('toggle', this.#handleToggle, true);

    for (const item of this.items ?? []) {
      item.querySelector('[data-jci-faq-summary]')?.removeEventListener('click', this.#handleClick);
    }
  }

  #handleToggle = (event) => {
    const item = event.target;
    if (!item.open || !this.items.includes(item)) return;

    for (const other of this.items) {
      if (other !== item) other.open = false;
    }
  };

  #handleClick = (event) => {
    // The browser would toggle `open` immediately; the height animation needs
    // to drive that instead.
    event.preventDefault();

    const item = event.currentTarget.closest('[data-jci-faq-item]');
    if (!item) return;

    if (item.open) {
      this.#close(item);
      return;
    }

    if (this.singleOpen) {
      for (const other of this.items) {
        if (other !== item && other.open) this.#close(other);
      }
    }

    this.#open(item);
  };

  #open(item) {
    const answer = item.querySelector('[data-jci-faq-answer]');
    if (!answer) {
      item.open = true;
      return;
    }

    this.#animations.get(answer)?.cancel();
    item.open = true;

    const animation = answer.animate(
      { height: ['0px', `${answer.scrollHeight}px`], opacity: [0, 1] },
      { duration: this.duration, easing: EASING }
    );

    this.#animations.set(answer, animation);
    animation.addEventListener('finish', () => this.#animations.delete(answer), { once: true });
  }

  #close(item) {
    const answer = item.querySelector('[data-jci-faq-answer]');
    if (!answer) {
      item.open = false;
      return;
    }

    this.#animations.get(answer)?.cancel();

    const animation = answer.animate(
      { height: [`${answer.scrollHeight}px`, '0px'], opacity: [1, 0] },
      { duration: this.duration, easing: EASING }
    );

    this.#animations.set(answer, animation);

    // `open` comes off only once the answer has finished collapsing, so the
    // row never jumps ahead of the animation.
    animation.addEventListener(
      'finish',
      () => {
        this.#animations.delete(answer);
        item.open = false;
      },
      { once: true }
    );
  }
}

if (!customElements.get('jci-home-faq')) {
  customElements.define('jci-home-faq', JciHomeFaq);
}
