/**
 * Maison Cavallé — review carousel drag.
 *
 * Mouse drag for the Junip review carousel, matching the testimonials rail
 * (assets/jci-testimonials.js). Junip's track is a native scroll container
 * with scroll-snap, so touch already swipes it and the section's CSS stops
 * each swipe on the next card; this adds the drag a mouse cannot do natively.
 *
 * The track follows the pointer with snapping suspended, then settles on one
 * card: a drag past SWIPE_THRESHOLD, or a quick flick, moves to the next or
 * previous card, anything less settles back.
 *
 * Junip renders the track after load and may re-render it, so the listeners
 * are delegated from the section root rather than bound to the track. A drag
 * that moved swallows the click that follows it, otherwise letting go over a
 * card would open Junip's review popup.
 */

const ROOT = '[data-jci-review-carousel]';
const TRACK = '.junip-review-carousel-container';
const MOVE_THRESHOLD = 4;
const SWIPE_THRESHOLD = 40;
const FLICK_VELOCITY = 0.35; // px per ms
const CLICK_SUPPRESS_MS = 350;

/** The scroll position that brings each card flush left, deduplicated at the end. */
function stops(track) {
  const max = track.scrollWidth - track.clientWidth;
  const left = track.getBoundingClientRect().left;
  const positions = [...track.children].map((card) =>
    Math.min(max, Math.max(0, Math.round(track.scrollLeft + card.getBoundingClientRect().left - left)))
  );
  return positions.filter((position, index) => index === 0 || position !== positions[index - 1]);
}

function nearest(list, x) {
  return list.reduce((best, position, index) => (Math.abs(position - x) < Math.abs(list[best] - x) ? index : best), 0);
}

function bind(root) {
  if (root.dataset.jciDragBound) return;
  root.dataset.jciDragBound = 'true';

  let drag = null;
  let suppressClick = false;

  root.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    const track = event.target instanceof Element ? event.target.closest(TRACK) : null;
    if (!track) return;

    const stopList = stops(track);
    drag = {
      pointerId: event.pointerId,
      track,
      startX: event.clientX,
      startTime: event.timeStamp,
      startScroll: track.scrollLeft,
      stopList,
      startIndex: nearest(stopList, track.scrollLeft),
      moved: false,
    };
  });

  root.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;

    const delta = event.clientX - drag.startX;
    if (!drag.moved) {
      if (Math.abs(delta) <= MOVE_THRESHOLD) return;
      drag.moved = true;
      drag.track.classList.add('is-dragging');
      drag.track.setPointerCapture?.(event.pointerId);
    }

    event.preventDefault();
    drag.track.scrollLeft = drag.startScroll - delta;
  });

  const finish = (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;

    const { track, moved, stopList, startIndex } = drag;
    const delta = event.clientX - drag.startX;
    const velocity = delta / Math.max(1, event.timeStamp - drag.startTime);
    drag = null;

    if (track.hasPointerCapture?.(event.pointerId)) track.releasePointerCapture(event.pointerId);
    if (!moved) return;

    let index = startIndex;
    if (event.type === 'pointerup') {
      if (delta <= -SWIPE_THRESHOLD || velocity <= -FLICK_VELOCITY) index += 1;
      if (delta >= SWIPE_THRESHOLD || velocity >= FLICK_VELOCITY) index -= 1;
    }

    track.classList.remove('is-dragging');
    track.scrollTo({ left: stopList[Math.min(stopList.length - 1, Math.max(0, index))], behavior: 'smooth' });

    suppressClick = true;
    window.setTimeout(() => {
      suppressClick = false;
    }, CLICK_SUPPRESS_MS);
  };

  root.addEventListener('pointerup', finish);
  root.addEventListener('pointercancel', finish);

  // Capture phase, so it runs before Junip's own click handler on the card.
  root.addEventListener(
    'click',
    (event) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
    },
    true
  );

  root.addEventListener('dragstart', (event) => {
    if (event.target instanceof Element && event.target.closest(TRACK)) event.preventDefault();
  });
}

function bindAll(scope = document) {
  scope.querySelectorAll(ROOT).forEach(bind);
}

bindAll();

// The Theme Editor replaces a section's markup wholesale.
document.addEventListener('shopify:section:load', (event) => bindAll(event.target));
