/**
 * Maison Cavallé — header.
 *
 * Two behaviours the prototype has that plain CSS cannot cover:
 *   - a scrolled state, toggled past 8px, that shrinks the header
 *   - the mobile navigation drawer
 *
 * Cart and search are Horizon's own components, triggered declaratively from
 * the markup, so nothing here touches them.
 */
const SCROLL_THRESHOLD = 8;

/**
 * Horizon locks html/body to 100dvh on desktop (base.css:28), so the page
 * scrolls inside .page-wrapper and `window` never fires a scroll event. These
 * two find whatever is actually scrolling instead of assuming it is the window.
 */
function scrollRoot(from) {
  let node = from?.parentElement;
  while (node && node !== document.body && node !== document.documentElement) {
    const overflowY = getComputedStyle(node).overflowY;
    const scrolls = overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'hidden';
    if (scrolls && node.scrollHeight > node.clientHeight + 1) return node;
    node = node.parentElement;
  }
  return null;
}

function scrollTopOf(root) {
  if (root) return root.scrollTop;
  return window.scrollY || document.documentElement.scrollTop || 0;
}

class JciHeader extends HTMLElement {
  #rafId = null;

  connectedCallback() {
    this.trigger = this.querySelector('[data-jci-menu-trigger]');
    this.drawer = this.querySelector('[data-jci-drawer]');
    this.backdrop = this.querySelector('[data-jci-drawer-backdrop]');
    this.closeButton = this.querySelector('[data-jci-drawer-close]');

    this.#syncScrollState();
    document.addEventListener('scroll', this.#handleScroll, { capture: true, passive: true });

    this.trigger?.addEventListener('click', this.#toggleDrawer);
    this.closeButton?.addEventListener('click', this.#closeDrawer);
    this.backdrop?.addEventListener('click', this.#closeDrawer);
    document.addEventListener('keydown', this.#handleKeydown);
  }

  disconnectedCallback() {
    document.removeEventListener('scroll', this.#handleScroll, { capture: true });
    this.trigger?.removeEventListener('click', this.#toggleDrawer);
    this.closeButton?.removeEventListener('click', this.#closeDrawer);
    this.backdrop?.removeEventListener('click', this.#closeDrawer);
    document.removeEventListener('keydown', this.#handleKeydown);

    if (this.#rafId !== null) cancelAnimationFrame(this.#rafId);
    this.#unlockScroll();
  }

  get isDrawerOpen() {
    return this.drawer?.classList.contains('is-open') ?? false;
  }

  /* --- Scrolled state --- */

  #handleScroll = () => {
    if (this.#rafId !== null) return;

    this.#rafId = requestAnimationFrame(() => {
      this.#rafId = null;
      this.#syncScrollState();
    });
  };

  #syncScrollState() {
    this.classList.toggle('is-scrolled', scrollTopOf(scrollRoot(this)) > SCROLL_THRESHOLD);
  }

  /* --- Mobile drawer --- */

  #toggleDrawer = () => {
    if (this.isDrawerOpen) this.#closeDrawer();
    else this.#openDrawer();
  };

  #openDrawer = () => {
    if (!this.drawer || !this.backdrop) return;

    this.backdrop.hidden = false;
    /* Force a frame so the opacity transition has a starting value to run from. */
    requestAnimationFrame(() => this.backdrop.classList.add('is-visible'));

    this.drawer.classList.add('is-open');
    this.drawer.removeAttribute('inert');
    this.drawer.setAttribute('aria-hidden', 'false');
    this.trigger?.setAttribute('aria-expanded', 'true');
    this.#lockScroll();

    this.closeButton?.focus();
  };

  #closeDrawer = () => {
    if (!this.drawer || !this.backdrop) return;

    this.backdrop.classList.remove('is-visible');
    this.drawer.classList.remove('is-open');
    this.drawer.setAttribute('inert', '');
    this.drawer.setAttribute('aria-hidden', 'true');
    this.trigger?.setAttribute('aria-expanded', 'false');
    this.#unlockScroll();

    /* Keep the backdrop in the layout until its fade-out finishes. */
    this.backdrop.addEventListener(
      'transitionend',
      () => {
        if (!this.isDrawerOpen) this.backdrop.hidden = true;
      },
      { once: true }
    );

    this.trigger?.focus();
  };

  #handleKeydown = (event) => {
    if (event.key === 'Escape' && this.isDrawerOpen) this.#closeDrawer();
  };

  #lockScroll() {
    document.body.style.overflow = 'hidden';
  }

  #unlockScroll() {
    document.body.style.overflow = '';
  }
}

if (!customElements.get('jci-header')) {
  customElements.define('jci-header', JciHeader);
}
