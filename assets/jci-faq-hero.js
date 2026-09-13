/**
 * Maison Cavallé — FAQ hero.
 *
 * The film tilts towards the pointer. The prototype drives this with
 * `--tilt-x` / `--tilt-y` on the element and a `data-tilt` hook; the same
 * shape is kept here, renamed per §1 (behaviour targets data-jci-*, never a
 * jci- class).
 *
 * Reads are batched into a rAF so a fast pointer cannot queue a layout read
 * per move event, and the whole thing sits out under prefers-reduced-motion.
 */
const SECTION = 'section.jci-faq-hero';
const VISUAL = '[data-jci-faq-hero-visual]';
const DEFAULT_STRENGTH = 6;

class JciFaqHeroTilt {
  #frame = 0;
  #pointer = null;

  constructor(section) {
    this.section = section;
    this.visual = section.querySelector(VISUAL);
    this.strength = Number(section.dataset.jciTiltStrength) || DEFAULT_STRENGTH;

    if (!this.visual || this.strength === 0) return;

    this.visual.addEventListener('pointermove', this.#handleMove);
    this.visual.addEventListener('pointerleave', this.#handleLeave);
    this.bound = true;
  }

  destroy() {
    if (!this.bound) return;

    cancelAnimationFrame(this.#frame);
    this.visual.removeEventListener('pointermove', this.#handleMove);
    this.visual.removeEventListener('pointerleave', this.#handleLeave);
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

    const box = this.visual.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;

    // -0.5 .. 0.5 from the centre of the film, either way.
    const offsetX = (this.#pointer.x - box.left) / box.width - 0.5;
    const offsetY = (this.#pointer.y - box.top) / box.height - 0.5;

    // Y movement tips the top towards the pointer, so the sign is flipped.
    this.visual.style.setProperty('--jci-tilt-x', `${(offsetY * this.strength * -1).toFixed(2)}deg`);
    this.visual.style.setProperty('--jci-tilt-y', `${(offsetX * this.strength).toFixed(2)}deg`);
  };

  #handleLeave = () => {
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
    this.#pointer = null;

    this.visual.style.removeProperty('--jci-tilt-x');
    this.visual.style.removeProperty('--jci-tilt-y');
  };
}

const instances = new WeakMap();

function init() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  for (const section of document.querySelectorAll(`${SECTION}[data-jci-tilt]`)) {
    if (instances.has(section)) continue;
    instances.set(section, new JciFaqHeroTilt(section));
  }
}

init();

// The Theme Editor swaps section markup in place, so the new node is bound and
// the old one released.
document.addEventListener('shopify:section:load', (event) => {
  const section = event.target.querySelector?.(`${SECTION}[data-jci-tilt]`);
  if (section && !instances.has(section)) instances.set(section, new JciFaqHeroTilt(section));
});

document.addEventListener('shopify:section:unload', (event) => {
  const section = event.target.querySelector?.(SECTION);
  if (!section) return;

  instances.get(section)?.destroy();
  instances.delete(section);
});
