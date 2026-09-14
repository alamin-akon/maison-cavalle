/**
 * Maison Cavallé — product page behaviour.
 *
 * Prototype source: maison-cavalle-main/app.js → setupProductLightbox,
 * updateProductColour, updateProductSizeOptions, setupMobileStickyPurchase and
 * the [data-colour-index] / [data-size] / [data-quantity] click handlers.
 *
 * What it does, and nothing more:
 *   - keeps the chosen variant: option buttons, price, add-to-bag state, the
 *     hidden variant id, the lead image and the ?variant= URL;
 *   - the quantity stepper;
 *   - the lightbox (buttons, arrow keys, Escape, swipe, focus trap);
 *   - the mobile sticky add-to-bag bar.
 *
 * The add itself is Horizon's product-form-component, which reads the hidden
 * `id` and `quantity` inputs this file keeps current.
 */
const ROOT = '[data-jci-product]';
const SWIPE_THRESHOLD = 45;
const pad = (value) => String(value).padStart(2, '0');

class JciProduct {
  #frame = 0;
  #returnFocus = null;
  #swipe = null;
  #lightboxIndex = 0;

  constructor(root) {
    this.root = root;
    this.variants = JSON.parse(root.querySelector('[data-jci-product-variants]')?.textContent || '[]');
    this.variantInput = root.querySelector('[data-jci-variant-input]');
    this.form = this.variantInput?.form ?? null;
    this.addButton = this.form?.querySelector('button[name="add"]') ?? null;
    this.lightbox = root.querySelector('[data-jci-lightbox]');
    this.sticky = root.querySelector('[data-jci-product-sticky]');

    const initial =
      this.variants.find((variant) => String(variant.id) === this.variantInput?.value) ?? this.variants[0];
    this.variant = initial ?? null;
    this.selected = initial ? [...initial.options] : [];

    root.addEventListener('click', this.#handleClick);
    root.addEventListener('keydown', this.#handleFigureKeydown);
    document.addEventListener('keydown', this.#handleLightboxKeydown);

    const stage = this.lightbox?.querySelector('[data-jci-lightbox-stage]');
    stage?.addEventListener('pointerdown', this.#handlePointerDown);
    stage?.addEventListener('pointerup', this.#handlePointerUp);
    stage?.addEventListener('pointercancel', this.#clearSwipe);

    if (this.sticky) {
      // Capture, because Horizon scrolls .page-wrapper rather than the window
      // at some widths, and scroll events do not bubble.
      document.addEventListener('scroll', this.#queueStickySync, { capture: true, passive: true });
      window.addEventListener('resize', this.#queueStickySync);
      this.#queueStickySync();
    }

    this.#renderOptions();
  }

  destroy() {
    this.root.removeEventListener('click', this.#handleClick);
    this.root.removeEventListener('keydown', this.#handleFigureKeydown);
    document.removeEventListener('keydown', this.#handleLightboxKeydown);
    document.removeEventListener('scroll', this.#queueStickySync, { capture: true });
    window.removeEventListener('resize', this.#queueStickySync);
    cancelAnimationFrame(this.#frame);
    document.body.classList.remove('jci-product-lightbox-open');
  }

  /* -- Clicks ------------------------------------------------------------ */

  #handleClick = (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const option = target.closest('[data-jci-option]');
    if (option && !option.disabled) {
      this.#selectOption(Number(option.getAttribute('data-jci-option')) - 1, option.getAttribute('data-jci-option-value'));
      return;
    }

    const stepper = target.closest('[data-jci-quantity]');
    if (stepper) {
      this.#stepQuantity(stepper.getAttribute('data-jci-quantity') === 'increase' ? 1 : -1);
      return;
    }

    if (target.closest('[data-jci-sticky-add]')) {
      this.addButton?.click();
      return;
    }

    const figure = target.closest('[data-jci-lightbox-open]');
    if (figure) {
      this.#openLightbox(Number(figure.getAttribute('data-jci-lightbox-open')), figure);
      return;
    }

    if (!this.lightbox?.classList.contains('is-open')) return;

    if (target === this.lightbox || target.closest('[data-jci-lightbox-close]')) {
      this.#closeLightbox();
      return;
    }

    const control = target.closest('[data-jci-lightbox-control]');
    if (control) {
      this.#showLightboxImage(this.#lightboxIndex + (control.getAttribute('data-jci-lightbox-control') === 'next' ? 1 : -1));
    }
  };

  /* -- Variant ----------------------------------------------------------- */

  #matches(options, position, value) {
    return this.selected.every((selected, index) => index === position ? options[index] === value : options[index] === selected);
  }

  #selectOption(position, value) {
    this.selected[position] = value;

    let variant = this.variants.find((candidate) => candidate.options.every((option, index) => option === this.selected[index]));

    // The combination does not exist: keep the value just chosen and take the
    // closest variant that has it, preferring one that can be bought
    // (app.js:325 falls back to the first size the colour comes in).
    if (!variant) {
      const score = (candidate) =>
        candidate.options.filter((option, index) => option === this.selected[index]).length * 2 + (candidate.available ? 1 : 0);

      variant = this.variants
        .filter((candidate) => candidate.options[position] === value)
        .sort((a, b) => score(b) - score(a))[0];

      if (variant) this.selected = [...variant.options];
    }

    this.variant = variant ?? null;
    this.#renderVariant();
  }

  #renderOptions() {
    for (const button of this.root.querySelectorAll('[data-jci-option]')) {
      const position = Number(button.getAttribute('data-jci-option')) - 1;
      const value = button.getAttribute('data-jci-option-value');
      const candidates = this.variants.filter((variant) => this.#matches(variant.options, position, value));
      const active = this.selected[position] === value;

      button.disabled = candidates.length === 0;
      button.classList.toggle('is-active', active);
      button.classList.toggle('is-unavailable', !candidates.some((variant) => variant.available));
      button.setAttribute('aria-pressed', String(active));
    }

    for (const label of this.root.querySelectorAll('[data-jci-option-selected]')) {
      label.textContent = this.selected[Number(label.getAttribute('data-jci-option-selected')) - 1] ?? '';
    }
  }

  #renderVariant() {
    const { variant, root } = this;

    this.#renderOptions();

    if (this.variantInput && variant) this.variantInput.value = String(variant.id);

    if (variant) {
      for (const price of root.querySelectorAll('[data-jci-price]')) price.textContent = variant.price;
      for (const was of root.querySelectorAll('[data-jci-price-was]')) {
        was.textContent = variant.compare ?? '';
        was.hidden = !variant.compare;
      }
    }

    const purchasable = Boolean(variant?.available);
    const label = !variant
      ? root.dataset.jciLabelUnavailable
      : purchasable
        ? root.dataset.jciLabelAdd
        : root.dataset.jciLabelSoldOut;

    if (this.addButton) this.addButton.disabled = !purchasable;
    for (const button of root.querySelectorAll('[data-jci-sticky-add]')) button.disabled = !purchasable;
    for (const text of root.querySelectorAll('[data-jci-buy-label]')) text.textContent = label ?? '';

    this.#renderLeadImage();

    if (variant) {
      const url = new URL(window.location.href);
      url.searchParams.set('variant', String(variant.id));
      window.history.replaceState(window.history.state, '', url.toString());
    }
  }

  // app.js:342-346 — the lead image follows the chosen colour.
  #renderLeadImage() {
    const image = this.variant?.image;
    const lead = this.root.querySelector('[data-jci-lead-image]');
    if (!image || !lead) return;

    lead.srcset = [600, 900, 1200, 1800]
      .map((width) => `${image.src.replace(/([?&])width=\d+/, `$1width=${width}`)} ${width}w`)
      .join(', ');
    lead.src = image.src;
    lead.alt = image.alt;
    lead.setAttribute('data-jci-lightbox-src', image.full);
  }

  /* -- Quantity ---------------------------------------------------------- */

  #stepQuantity(change) {
    const input = this.root.querySelector('[data-jci-quantity-input]');
    if (!input) return;

    const quantity = Math.max(1, (Number(input.value) || 1) + change);
    input.value = String(quantity);

    for (const display of this.root.querySelectorAll('[data-jci-quantity-value]')) display.textContent = String(quantity);
  }

  /* -- Lightbox ---------------------------------------------------------- */

  get #figures() {
    return [...this.root.querySelectorAll('[data-jci-lightbox-open]')];
  }

  #handleFigureKeydown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;

    const figure = event.target instanceof Element ? event.target.closest('[data-jci-lightbox-open]') : null;
    if (!figure) return;

    event.preventDefault();
    this.#openLightbox(Number(figure.getAttribute('data-jci-lightbox-open')), figure);
  };

  #showLightboxImage(index) {
    const figures = this.#figures;
    if (!figures.length || !this.lightbox) return;

    this.#lightboxIndex = (index + figures.length) % figures.length;

    const source = figures[this.#lightboxIndex].querySelector('img');
    const image = this.lightbox.querySelector('[data-jci-lightbox-image]');
    const count = this.lightbox.querySelector('[data-jci-lightbox-count]');

    if (source && image) {
      image.src = source.getAttribute('data-jci-lightbox-src') || source.currentSrc || source.src;
      image.alt = source.alt;
    }

    if (count) count.textContent = `${pad(this.#lightboxIndex + 1)} / ${pad(figures.length)}`;
  }

  #openLightbox(index, trigger) {
    if (!this.lightbox) return;

    this.#returnFocus = trigger;
    this.#showLightboxImage(index);
    this.lightbox.inert = false;
    this.lightbox.setAttribute('aria-hidden', 'false');
    this.lightbox.classList.add('is-open');
    document.body.classList.add('jci-product-lightbox-open');

    requestAnimationFrame(() => this.lightbox?.querySelector('[data-jci-lightbox-close]')?.focus({ preventScroll: true }));
  }

  #closeLightbox() {
    if (!this.lightbox?.classList.contains('is-open')) return;

    this.lightbox.classList.remove('is-open');
    this.lightbox.setAttribute('aria-hidden', 'true');
    this.lightbox.inert = true;
    document.body.classList.remove('jci-product-lightbox-open');
    this.#returnFocus?.focus({ preventScroll: true });
  }

  #handleLightboxKeydown = (event) => {
    if (!this.lightbox?.classList.contains('is-open')) return;

    if (event.key === 'Escape') {
      this.#closeLightbox();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      this.#showLightboxImage(this.#lightboxIndex + (event.key === 'ArrowRight' ? 1 : -1));
    } else if (event.key === 'Tab') {
      const focusable = [...this.lightbox.querySelectorAll('button:not([disabled])')];
      const first = focusable[0];
      const last = focusable.at(-1);

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  };

  #handlePointerDown = (event) => {
    this.#swipe = { id: event.pointerId, x: event.clientX, y: event.clientY };
  };

  #handlePointerUp = (event) => {
    const swipe = this.#swipe;
    if (!swipe || event.pointerId !== swipe.id) return;

    this.#swipe = null;

    const deltaX = event.clientX - swipe.x;
    const deltaY = event.clientY - swipe.y;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) <= Math.abs(deltaY)) return;

    this.#showLightboxImage(this.#lightboxIndex + (deltaX < 0 ? 1 : -1));
  };

  #clearSwipe = () => {
    this.#swipe = null;
  };

  /* -- Mobile sticky bar ------------------------------------------------- */

  #scrollTop = 0;

  #queueStickySync = (event) => {
    // Only a scroller the page sits in counts — not the gallery rail.
    const scroller = event?.target;
    if (scroller instanceof Element && scroller.contains(this.root)) this.#scrollTop = scroller.scrollTop;
    if (this.#frame) return;
    this.#frame = requestAnimationFrame(this.#syncSticky);
  };

  // app.js:621-630
  #syncSticky = () => {
    this.#frame = 0;
    if (!this.sticky?.isConnected || !this.addButton) return;

    const box = this.addButton.getBoundingClientRect();
    const buttonInView = box.bottom > 0 && box.top < window.innerHeight;
    const scrolled = Math.max(window.scrollY, this.#scrollTop);
    const show = window.matchMedia('(max-width: 680px)').matches && scrolled > 80 && !buttonInView;

    this.sticky.classList.toggle('is-visible', show);
    this.sticky.setAttribute('aria-hidden', String(!show));
    this.sticky.inert = !show;
  };
}

const instances = new WeakMap();

function bind(scope = document) {
  for (const root of scope.querySelectorAll?.(ROOT) ?? []) {
    if (instances.has(root)) continue;
    instances.set(root, new JciProduct(root));
  }
}

bind();

document.addEventListener('shopify:section:load', (event) => bind(event.target));

document.addEventListener('shopify:section:unload', (event) => {
  for (const root of event.target.querySelectorAll?.(ROOT) ?? []) {
    instances.get(root)?.destroy();
    instances.delete(root);
  }
});
