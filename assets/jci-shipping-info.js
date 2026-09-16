/**
 * Maison Cavallé — shipping info accordion reserve.
 *
 * The rows use native exclusive <details> controls. This only reserves room
 * for their tallest answer, so opening or closing a row does not move the
 * content that follows the section.
 */
const SECTION = 'section.jci-shipping-info';
const DEFAULT_DURATION = 320;
const EASING = 'cubic-bezier(0.22, 0.61, 0.36, 1)';

class JciShippingInfo {
  #animations = new WeakMap();
  #widthObserver;
  #lastWidth = 0;

  constructor(section) {
    this.section = section;
    this.list = section.querySelector('[data-jci-shipping-info-list]');
    this.rows = [...section.querySelectorAll('[data-jci-shipping-info-row]')];
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.rowNames = new Map(this.rows.map((row) => [row, row.getAttribute('name')]));

    this.#reserveHeight();
    this.#observeWidth();
    document.fonts?.ready.then(() => this.#reserveHeight());

    // The native `name` attribute closes the previous row immediately. For
    // the same smooth hand-off as FAQ, JavaScript owns that close animation.
    if (this.reducedMotion) return;

    this.section.setAttribute('data-jci-shipping-info-enhanced', '');
    for (const row of this.rows) {
      row.removeAttribute('name');
      row.querySelector('.jci-shipping-info-row-summary')?.addEventListener('click', this.#handleClick);
    }
  }

  destroy() {
    this.#widthObserver?.disconnect();
    this.section.removeAttribute('data-jci-shipping-info-enhanced');

    for (const row of this.rows) {
      row.querySelector('.jci-shipping-info-row-summary')?.removeEventListener('click', this.#handleClick);

      const name = this.rowNames.get(row);
      if (name) row.setAttribute('name', name);
    }
  }

  #handleClick = (event) => {
    event.preventDefault();

    const row = event.currentTarget.closest('[data-jci-shipping-info-row]');
    if (!row) return;

    if (row.open) {
      this.#close(row);
      return;
    }

    for (const other of this.rows) {
      if (other !== row && other.open) this.#close(other);
    }

    this.#open(row);
  };

  #answer(row) {
    return row.querySelector('[data-jci-shipping-info-answer]');
  }

  #padBottom(answer) {
    return getComputedStyle(answer).paddingBottom || '0px';
  }

  #open(row) {
    const answer = this.#answer(row);
    if (!answer) {
      row.open = true;
      return;
    }

    this.#animations.get(answer)?.cancel();
    row.open = true;

    const animation = answer.animate(
      {
        height: ['0px', `${answer.scrollHeight}px`],
        paddingBottom: ['0px', this.#padBottom(answer)],
        opacity: [0, 1],
        transform: ['translateY(-0.4rem)', 'none'],
      },
      { duration: DEFAULT_DURATION, easing: EASING }
    );

    this.#settle(answer, animation, row, true);
  }

  #close(row) {
    const answer = this.#answer(row);
    if (!answer) {
      row.open = false;
      return;
    }

    this.#animations.get(answer)?.cancel();

    const from = answer.getBoundingClientRect().height || answer.scrollHeight;
    const animation = answer.animate(
      {
        height: [`${from}px`, '0px'],
        paddingBottom: [this.#padBottom(answer), '0px'],
        opacity: [1, 0],
        transform: ['none', 'translateY(-0.4rem)'],
      },
      { duration: DEFAULT_DURATION, easing: EASING }
    );

    this.#settle(answer, animation, row, false);
  }

  #settle(answer, animation, row, open) {
    this.#animations.set(answer, animation);

    animation.finished
      .then(() => {
        if (this.#animations.get(answer) !== animation) return;
        row.open = open;
      })
      .catch(() => {
        /* cancelled - the newer interaction owns this answer */
      })
      .finally(() => {
        if (this.#animations.get(answer) === animation) this.#animations.delete(answer);
      });
  }

  #reserveHeight() {
    if (!this.list || this.rows.length === 0) return;

    this.section.style.removeProperty('--jci-shipping-info-list-reserve');

    const wasOpen = this.rows.map((row) => row.open);
    const heights = this.rows.map((row) => {
      const answer = row.querySelector('[data-jci-shipping-info-answer]');
      if (!answer) return 0;

      this.#animations.get(answer)?.cancel();
      this.#animations.delete(answer);
      row.open = true;
      const height = answer.scrollHeight;
      row.open = false;
      return height;
    });

    const closed = this.list.getBoundingClientRect().height;

    this.rows.forEach((row, index) => {
      row.open = wasOpen[index];
    });

    const reserve = Math.ceil(closed + Math.max(...heights, 0));
    if (reserve > 0) this.section.style.setProperty('--jci-shipping-info-list-reserve', `${reserve}px`);
  }

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
}

const instances = new WeakMap();

function bind(root = document) {
  for (const section of root.querySelectorAll?.(SECTION) ?? []) {
    if (instances.has(section)) continue;
    instances.set(section, new JciShippingInfo(section));
  }
}

bind();

document.addEventListener('shopify:section:load', (event) => bind(event.target));

document.addEventListener('shopify:section:unload', (event) => {
  const section = event.target.querySelector?.(SECTION);
  if (!section) return;

  instances.get(section)?.destroy();
  instances.delete(section);
});
