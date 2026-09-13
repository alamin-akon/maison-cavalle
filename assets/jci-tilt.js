/**
 * Maison Cavallé — pointer tilt.
 *
 * Tips an element towards the pointer, the way the prototype's `data-tilt`
 * does. Shared, because more than one section wants it: the FAQ hero film and
 * the contact hero feature both tilt, and two copies of this would drift.
 *
 * Usage — put the hook on the element that should tilt:
 *
 *   <div data-jci-tilt data-jci-tilt-strength="6" data-jci-tilt-lift="-6"></div>
 *
 * It sets `--jci-tilt-x` / `--jci-tilt-y` (and `--jci-tilt-lift` on hover, if
 * a lift is given); the CSS decides what to do with them, so a section can
 * use a different perspective or transform order without touching this file.
 *
 * Reads are batched into a rAF so a fast pointer cannot queue a layout read
 * per move event, and the whole thing sits out under prefers-reduced-motion.
 */
const HOOK = '[data-jci-tilt]';
const DEFAULT_STRENGTH = 6;

class JciTilt {
  #frame = 0;
  #pointer = null;

  constructor(element) {
    this.element = element;
    this.strength = Number(element.dataset.jciTiltStrength) || DEFAULT_STRENGTH;

    if (this.strength === 0) return;

    element.addEventListener('pointermove', this.#handleMove);
    element.addEventListener('pointerleave', this.#handleLeave);
    this.bound = true;
  }

  destroy() {
    if (!this.bound) return;

    cancelAnimationFrame(this.#frame);
    this.element.removeEventListener('pointermove', this.#handleMove);
    this.element.removeEventListener('pointerleave', this.#handleLeave);
  }

  #handleMove = (event) => {
    // Touch drags the page; a tilt there would fight the scroll.
    if (event.pointerType !== 'mouse') return;

    this.#pointer = { x: event.clientX, y: event.clientY };
    if (this.#frame) return;

    this.#frame = requestAnimationFrame(this.#apply);
  };

  #apply = () => {
    this.#frame = 0;
    if (!this.#pointer) return;

    const box = this.element.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;

    // -0.5 .. 0.5 from the centre of the element, either way.
    const offsetX = (this.#pointer.x - box.left) / box.width - 0.5;
    const offsetY = (this.#pointer.y - box.top) / box.height - 0.5;

    // Y movement tips the top towards the pointer, so the sign is flipped.
    this.element.style.setProperty('--jci-tilt-x', `${(offsetY * this.strength * -1).toFixed(2)}deg`);
    this.element.style.setProperty('--jci-tilt-y', `${(offsetX * this.strength).toFixed(2)}deg`);
  };

  #handleLeave = () => {
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
    this.#pointer = null;

    this.element.style.removeProperty('--jci-tilt-x');
    this.element.style.removeProperty('--jci-tilt-y');
  };
}

const instances = new WeakMap();

function bind(root = document) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  for (const element of root.querySelectorAll?.(HOOK) ?? []) {
    if (instances.has(element)) continue;
    instances.set(element, new JciTilt(element));
  }
}

bind();

// The Theme Editor swaps section markup in place, so new nodes are bound and
// the old ones released.
document.addEventListener('shopify:section:load', (event) => bind(event.target));

document.addEventListener('shopify:section:unload', (event) => {
  for (const element of event.target.querySelectorAll?.(HOOK) ?? []) {
    instances.get(element)?.destroy();
    instances.delete(element);
  }
});
