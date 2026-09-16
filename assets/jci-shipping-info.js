/**
 * Maison Cavallé — shipping info accordion reserve.
 *
 * The rows use native exclusive <details> controls. This only reserves room
 * for their tallest answer, so opening or closing a row does not move the
 * content that follows the section.
 */
const SECTION = 'section.jci-shipping-info';

class JciShippingInfo {
  #widthObserver;
  #lastWidth = 0;

  constructor(section) {
    this.section = section;
    this.list = section.querySelector('[data-jci-shipping-info-list]');
    this.rows = [...section.querySelectorAll('[data-jci-shipping-info-row]')];

    this.#reserveHeight();
    this.#observeWidth();
    document.fonts?.ready.then(() => this.#reserveHeight());
  }

  destroy() {
    this.#widthObserver?.disconnect();
  }

  #reserveHeight() {
    if (!this.list || this.rows.length === 0) return;

    this.section.style.removeProperty('--jci-shipping-info-list-reserve');

    const wasOpen = this.rows.map((row) => row.open);
    const heights = this.rows.map((row) => {
      const answer = row.querySelector('[data-jci-shipping-info-answer]');
      if (!answer) return 0;

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
