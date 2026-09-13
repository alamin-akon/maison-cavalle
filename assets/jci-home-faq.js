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
 *
 * The list also reserves the height of its tallest open state up front, so
 * opening or closing a question never resizes the section. Without it the
 * section grows and shrinks under the pointer — and with single-open on, it
 * moves twice in one click, since the outgoing answer collapses as the
 * incoming one expands.
 */
const DEFAULT_DURATION = 320;
const EASING = 'cubic-bezier(0.22, 0.61, 0.36, 1)';

class JciHomeFaq extends HTMLElement {
  #animations = new WeakMap();
  #widthObserver;
  #lastWidth = 0;

  connectedCallback() {
    this.items = [...this.querySelectorAll('[data-jci-faq-item]')];
    this.list = this.querySelector('.jci-home-faq-list');
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.duration = Number(this.dataset.jciFaqDuration) || DEFAULT_DURATION;
    this.singleOpen = this.hasAttribute('data-jci-faq-single');

    // The reserve depends on the wrapped height of every answer, so it is
    // remeasured whenever the list changes width and once webfonts land.
    this.#reserveHeight();
    this.#observeWidth();
    document.fonts?.ready.then(() => this.#reserveHeight());

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
    this.#widthObserver?.disconnect();

    for (const item of this.items ?? []) {
      item.querySelector('[data-jci-faq-summary]')?.removeEventListener('click', this.#handleClick);
    }
  }

  /**
   * Pins the list to the tallest height it can reach, so the section keeps one
   * height whatever is open. The tallest state is every summary plus the
   * single tallest answer, since only one answer is ever expanded at a time
   * under single-open; with single-open off the answers are summed instead.
   *
   * Each closed answer has no box to measure, so it is opened, measured and
   * put back within the same frame — the reserve is cleared first so a
   * previous value cannot floor the reading.
   */
  #reserveHeight() {
    if (!this.list || this.items.length === 0) return;

    this.style.removeProperty('--jci-home-faq-reserve');

    const wasOpen = this.items.map((item) => item.open);
    const heights = this.items.map((item) => {
      const answer = item.querySelector('[data-jci-faq-answer]');
      if (!answer) return 0;

      // Skip the transition while measuring, or the running animation's
      // inline height is what gets read back.
      const animation = this.#animations.get(answer);
      animation?.cancel();
      this.#animations.delete(answer);

      item.open = true;
      const height = answer.scrollHeight;
      item.open = false;
      return height;
    });

    const closed = this.list.getBoundingClientRect().height;

    this.items.forEach((item, i) => {
      item.open = wasOpen[i];
    });

    const answers = this.singleOpen ? Math.max(...heights, 0) : heights.reduce((a, b) => a + b, 0);
    const reserve = Math.ceil(closed + answers);
    if (reserve > 0) this.style.setProperty('--jci-home-faq-reserve', `${reserve}px`);
  }

  /**
   * Answers rewrap at every width, so the reserve is only valid for the width
   * it was taken at. Height changes are ignored — the reserve drives those,
   * and reacting to them would loop.
   */
  #observeWidth() {
    if (typeof ResizeObserver === 'undefined' || !this.list) return;

    this.#lastWidth = this.list.getBoundingClientRect().width;
    this.#widthObserver = new ResizeObserver(() => {
      const width = this.list.getBoundingClientRect().width;
      if (Math.abs(width - this.#lastWidth) < 1) return;

      this.#lastWidth = width;
      this.#reserveHeight();
    });
    this.#widthObserver.observe(this.list);
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
