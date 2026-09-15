/**
 * Maison Cavallé — product gallery rail controls.
 *
 * On mobile the product gallery keeps its lead image and turns the rest into
 * a swipeable rail with previous / next buttons (app.js:1478-1483). Horizon's
 * media gallery has no behaviour for this, so this file carries only that.
 *
 * The listener is delegated from the document: Horizon swaps the whole
 * <media-gallery> for fresh markup whenever a variant changes, and a listener
 * bound to the old rail would be lost with it.
 *
 * Each press moves exactly one image and lands on that image's snap point.
 * A fixed scrollBy distance fought the rail's mandatory snapping — iOS Safari
 * snapped back after every smooth scroll, and a press made mid-scroll added
 * its distance to a half-finished position, so the rail jumped and bounced.
 */
const CONTROL = '[data-jci-gallery-control]';

/** How long a press's target stays the base for the next press, in ms. */
const PRESS_WINDOW = 700;

/** @type {WeakMap<Element, { index: number, time: number }>} */
const targets = new WeakMap();

/**
 * The scroll position that puts an item at the rail's start snap edge.
 * @param {Element} rail
 * @param {Element} item
 */
function snapLeft(rail, item) {
  const scrollPadding = parseFloat(getComputedStyle(rail).scrollPaddingInlineStart) || 0;
  return rail.scrollLeft + item.getBoundingClientRect().left - rail.getBoundingClientRect().left - scrollPadding;
}

/**
 * The item currently resting nearest the start edge.
 * @param {Element} rail
 * @param {Element[]} items
 */
function currentIndex(rail, items) {
  let closest = 0;
  let distance = Infinity;

  items.forEach((item, index) => {
    const offset = Math.abs(snapLeft(rail, item) - rail.scrollLeft);
    if (offset < distance) {
      distance = offset;
      closest = index;
    }
  });

  return closest;
}

document.addEventListener('click', (event) => {
  const control = event.target instanceof Element ? event.target.closest(CONTROL) : null;
  if (!control) return;

  const rail = control.closest('[data-jci-gallery-secondary]')?.querySelector('[data-jci-gallery-rail]');
  if (!rail) return;

  event.preventDefault();

  const items = [...rail.children];
  if (items.length === 0) return;

  const direction = control.getAttribute('data-jci-gallery-control') === 'next' ? 1 : -1;
  const previous = targets.get(rail);
  const now = performance.now();

  // A press while the last one is still scrolling continues from where that
  // one is heading, not from wherever the animation happens to be.
  const maxLeft = rail.scrollWidth - rail.clientWidth;

  // The last few images can never reach the start edge; the first one that
  // sits at the end of the scroll range is as far as "next" can go, so a
  // "previous" after it moves straight away instead of spending presses.
  const lastReachable = items.findIndex((item) => snapLeft(rail, item) >= maxLeft - 1);
  const lastIndex = lastReachable === -1 ? items.length - 1 : lastReachable;

  let resting = previous && now - previous.time < PRESS_WINDOW ? previous.index : currentIndex(rail, items);
  if (!previous || now - previous.time >= PRESS_WINDOW) {
    // At the end of the range the nearest snap point can sit before the
    // scroll position; the rail is really showing the last reachable image.
    if (rail.scrollLeft >= maxLeft - 1) resting = lastIndex;
  }
  const from = Math.min(lastIndex, resting);
  const index = Math.min(lastIndex, Math.max(0, from + direction));
  targets.set(rail, { index, time: now });

  const left = Math.min(maxLeft, Math.max(0, snapLeft(rail, items[index])));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  rail.scrollTo({ left, behavior: reduceMotion ? 'auto' : 'smooth' });
});
