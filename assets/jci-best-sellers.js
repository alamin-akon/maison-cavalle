/**
 * Maison Cavallé — best sellers.
 *
 * A tall section with a sticky stage. Scrolling through the section deals the
 * cards: the current one sits square, the ones behind fan back, and the ones
 * already seen slide off to the left.
 *
 * Three presentations, in order of precedence:
 *
 *   reduced motion — every card shown at rest, no scroll coupling at all
 *   narrow         — index-driven, advanced by the controls or a swipe
 *   otherwise      — driven by the section's scroll progress
 *
 * Ported from the prototype's updateBestSellerScroll,
 * setMobileBestSellerPresentation, scrollBestSellerTo and activateBestSellerDrag.
 */
const NARROW_QUERY = '(max-width: 680px)';
const DRAG_AXIS_THRESHOLD = 8;
const DRAG_MOVE_THRESHOLD = 4;
const CLICK_SUPPRESS_MS = 350;
/* Below this the section has no usable scroll runway, so scroll-driving it
   would just snap between the first and last card. */
const MIN_TRAVEL = 120;

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

class JciBestSellers extends HTMLElement {
  #frame = null;
  #drag = null;
  #suppressClick = false;
  #narrowIndex = 0;

  connectedCallback() {
    this.stage = this.querySelector('[data-jci-best-sellers-stage]');
    this.cards = [...this.querySelectorAll('[data-jci-best-seller-card]')];
    this.currentLabel = this.querySelector('[data-jci-best-sellers-current]');
    this.cardLabel = this.querySelector('[data-jci-best-sellers-current-card]');
    this.progressBar = this.querySelector('[data-jci-best-sellers-progress]');
    this.controls = [...this.querySelectorAll('[data-jci-best-sellers-control]')];

    this.narrowQuery = window.matchMedia(NARROW_QUERY);
    this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (!this.cards.length) return;

    for (const control of this.controls) {
      control.addEventListener('click', this.#handleControlClick);
    }

    this.narrowQuery.addEventListener('change', this.#requestUpdate);
    this.motionQuery.addEventListener('change', this.#requestUpdate);
    // Capture on document: scroll does not bubble, but it does pass through
    // the capture phase, so this catches whichever element actually scrolls.
    document.addEventListener('scroll', this.#requestUpdate, { capture: true, passive: true });
    window.addEventListener('resize', this.#requestUpdate, { passive: true });

    this.#setupDrag();
    this.#update();
  }

  disconnectedCallback() {
    if (this.#frame !== null) cancelAnimationFrame(this.#frame);
    this.#frame = null;

    for (const control of this.controls ?? []) {
      control.removeEventListener('click', this.#handleControlClick);
    }

    this.narrowQuery?.removeEventListener('change', this.#requestUpdate);
    this.motionQuery?.removeEventListener('change', this.#requestUpdate);
    document.removeEventListener('scroll', this.#requestUpdate, { capture: true });
    window.removeEventListener('resize', this.#requestUpdate);
  }

  /* --- Scheduling --- */

  #requestUpdate = () => {
    if (this.#frame !== null) return;
    this.#frame = requestAnimationFrame(() => {
      this.#frame = null;
      this.#update();
    });
  };

  #update() {
    if (this.motionQuery.matches) {
      this.#presentAtRest();
      return;
    }

    // Without a runway taller than the viewport there is no scroll to read, so
    // the stack falls back to being stepped rather than freezing at progress 0.
    if (this.narrowQuery.matches || this.#travel() < MIN_TRAVEL) {
      this.#presentByIndex(this.#narrowIndex);
      return;
    }

    this.#presentByScroll();
  }

  /**
   * offsetTop/offsetHeight are measured against offsetParent, which is any
   * positioned ancestor — a section wrapper is enough to throw them off. The
   * viewport rect plus the scroll offset is the same number without that trap.
   */
  #geometry() {
    const root = scrollRoot(this);
    const rect = this.getBoundingClientRect();
    return { top: rect.top, scrolled: scrollTopOf(root), root, height: rect.height };
  }

  #travel() {
    return this.#geometry().height - window.innerHeight;
  }

  /* --- Presentations --- */

  /** Reduced motion: the stack becomes a plain list, every card readable. */
  #presentAtRest() {
    for (const card of this.cards) {
      card.classList.add('is-current');
      card.setAttribute('aria-hidden', 'false');
      card.tabIndex = 0;
    }

    this.#setLabels(0, 0);
  }

  /** Scroll progress through the section deals the cards. */
  #presentByScroll() {
    const { top } = this.#geometry();
    const travel = Math.max(this.#travel(), 1);
    const progress = Math.min(1, Math.max(0, -top / travel));
    const position = progress * (this.cards.length - 1);
    const activeIndex = Math.min(this.cards.length - 1, Math.round(position));

    this.style.setProperty('--jci-best-seller-progress', `${progress * 100}%`);

    const stageWidth = this.stage?.clientWidth || 560;
    const exitDistance = Math.max(stageWidth * 0.9, 360);
    const stackOffset = Math.min(stageWidth * 0.09, 62);

    this.cards.forEach((card, index) => {
      const delta = index - position;

      if (delta < 0) {
        // Already seen: leaves to the left, fading fast.
        const departure = Math.min(1, Math.abs(delta));
        this.#placeCard(card, index, {
          x: -exitDistance * departure,
          y: 22 * departure,
          scale: 0.98 - departure * 0.02,
          rotate: -7 * departure,
          opacity: Math.max(0, 1 - departure * 2.2),
        });
      } else {
        // Still to come: fanned back behind the current card.
        this.#placeCard(card, index, {
          x: delta * stackOffset,
          y: -delta * 18,
          scale: 1 - delta * 0.06,
          rotate: delta * 4,
          opacity: Math.max(0, 1 - delta * 0.28),
        });
      }

      this.#markCard(card, index === activeIndex);
    });

    this.#setLabels(activeIndex, progress * 100);
  }

  /** Narrow screens: a shallow fan the controls and swipes step through. */
  #presentByIndex(index) {
    const activeIndex = Math.min(this.cards.length - 1, Math.max(0, index));
    this.#narrowIndex = activeIndex;

    this.cards.forEach((card, cardIndex) => {
      const delta = cardIndex - activeIndex;
      const distance = Math.min(Math.abs(delta), 2);
      const isCurrent = cardIndex === activeIndex;

      this.#placeCard(card, cardIndex, {
        x: delta * 16,
        y: -delta * 9,
        scale: isCurrent ? 1 : 1 - distance * 0.055,
        rotate: delta * 2.5,
        opacity: isCurrent ? 1 : Math.max(0, 0.34 - distance * 0.14),
        z: this.cards.length - distance,
      });

      this.#markCard(card, isCurrent);
    });

    const span = this.cards.length > 1 ? (activeIndex / (this.cards.length - 1)) * 100 : 0;
    this.#setLabels(activeIndex, span);
  }

  /* --- Card helpers --- */

  #placeCard(card, index, { x, y, scale, rotate, opacity, z }) {
    card.style.setProperty('--jci-card-x', `${x}px`);
    card.style.setProperty('--jci-card-y', `${y}px`);
    card.style.setProperty('--jci-card-scale', scale.toFixed(3));
    card.style.setProperty('--jci-card-rotate', `${rotate.toFixed(2)}deg`);
    card.style.setProperty('--jci-card-opacity', opacity.toFixed(3));
    card.style.setProperty('--jci-card-z', String(z ?? this.cards.length - index));
  }

  #markCard(card, isCurrent) {
    card.classList.toggle('is-current', isCurrent);
    card.setAttribute('aria-hidden', String(!isCurrent));
    card.tabIndex = isCurrent ? 0 : -1;
  }

  #setLabels(activeIndex, progressPercent) {
    const label = String(activeIndex + 1).padStart(2, '0');
    if (this.currentLabel) this.currentLabel.textContent = label;
    if (this.cardLabel) this.cardLabel.textContent = label;
    if (this.progressBar) this.progressBar.style.width = `${progressPercent}%`;
  }

  #currentIndex() {
    const found = this.cards.findIndex((card) => card.classList.contains('is-current'));
    if (found >= 0) return found;
    return Math.min(this.cards.length - 1, Math.max(0, Number(this.cardLabel?.textContent || '01') - 1));
  }

  /* --- Navigation --- */

  /**
   * On a wide screen the cards are bound to scroll position, so moving to a
   * card means scrolling to where that card is dealt, not repositioning it.
   */
  #goTo(index) {
    if (this.cards.length < 2) return;
    const nextIndex = Math.min(this.cards.length - 1, Math.max(0, index));

    const travel = this.#travel();

    // Same two cases as #update: no runway, or too narrow, means stepping the
    // stack in place rather than scrolling the page to it.
    if (this.motionQuery.matches || this.narrowQuery.matches || travel < MIN_TRAVEL) {
      this.#presentByIndex(nextIndex);
      return;
    }

    const { top, scrolled, root } = this.#geometry();
    const target = scrolled + top + (travel * nextIndex) / (this.cards.length - 1);
    (root ?? window).scrollTo({ top: target, behavior: 'smooth' });
  }

  #handleControlClick = (event) => {
    event.preventDefault();
    const step = event.currentTarget.dataset.jciBestSellersControl === 'next' ? 1 : -1;
    const total = this.cards.length;
    this.#goTo((this.#currentIndex() + step + total) % total);
  };

  /* --- Drag --- */

  #setupDrag() {
    if (!this.stage || this.cards.length < 2) return;

    this.stage.addEventListener('pointerdown', this.#handlePointerDown);
    this.stage.addEventListener('pointermove', this.#handlePointerMove);
    this.stage.addEventListener('pointerup', this.#handlePointerUp);
    this.stage.addEventListener('pointercancel', this.#handlePointerCancel);
    this.stage.addEventListener('dragstart', this.#preventDefault);
    // Capture phase: a swipe must not also open the card it ended on.
    this.stage.addEventListener('click', this.#handleStageClick, true);
  }

  #preventDefault = (event) => event.preventDefault();

  #handlePointerDown = (event) => {
    if (event.target.closest('button, [data-jci-best-sellers-controls]')) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    this.#drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      currentX: event.clientX,
      axis: null,
    };
    this.stage.classList.add('is-dragging');
  };

  #handlePointerMove = (event) => {
    const drag = this.#drag;
    if (!drag || event.pointerId !== drag.pointerId) return;

    drag.currentX = event.clientX;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;

    // The axis is decided once, so a vertical scroll is never stolen.
    if (!drag.axis && Math.max(Math.abs(deltaX), Math.abs(deltaY)) > DRAG_AXIS_THRESHOLD) {
      drag.axis = Math.abs(deltaX) > Math.abs(deltaY) ? 'x' : 'y';
    }
    if (drag.axis !== 'x') return;

    if (Math.abs(deltaX) >= this.#dragThreshold() && !this.stage.hasPointerCapture?.(event.pointerId)) {
      this.stage.setPointerCapture?.(event.pointerId);
    }

    drag.moved = Math.abs(deltaX) > DRAG_MOVE_THRESHOLD;
    event.preventDefault();
  };

  #handlePointerUp = (event) => this.#finishDrag(event, false);
  #handlePointerCancel = (event) => this.#finishDrag(event, true);

  #dragThreshold() {
    return Math.max(42, (this.stage?.clientWidth || 0) * 0.1);
  }

  #finishDrag(event, cancelled) {
    const drag = this.#drag;
    if (!drag || event.pointerId !== drag.pointerId) return;

    this.#drag = null;
    this.stage.classList.remove('is-dragging');
    if (this.stage.hasPointerCapture?.(event.pointerId)) {
      this.stage.releasePointerCapture(event.pointerId);
    }

    const distance = drag.currentX - drag.startX;
    const swiped = !cancelled && drag.axis === 'x' && Math.abs(distance) >= this.#dragThreshold();
    if (!swiped) return;

    this.#goTo(this.#currentIndex() + (distance < 0 ? 1 : -1));

    this.#suppressClick = true;
    window.setTimeout(() => {
      this.#suppressClick = false;
    }, CLICK_SUPPRESS_MS);
  }

  #handleStageClick = (event) => {
    if (!this.#suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
  };
}

if (!customElements.get('jci-best-sellers')) {
  customElements.define('jci-best-sellers', JciBestSellers);
}
