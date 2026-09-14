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
 */
const CONTROL = '[data-jci-gallery-control]';

document.addEventListener('click', (event) => {
  const control = event.target instanceof Element ? event.target.closest(CONTROL) : null;
  if (!control) return;

  const rail = control.closest('[data-jci-gallery-secondary]')?.querySelector('[data-jci-gallery-rail]');
  if (!rail) return;

  event.preventDefault();

  const direction = control.getAttribute('data-jci-gallery-control') === 'next' ? 1 : -1;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  rail.scrollBy({
    left: direction * Math.max(rail.clientWidth * 0.8, 180),
    behavior: reduceMotion ? 'auto' : 'smooth',
  });
});
