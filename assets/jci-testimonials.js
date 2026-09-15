/**
 * Maison Cavallé — testimonials rail.
 *
 * Pointer-drag for the quote rail, cloned from the prototype's
 * activateTestimonialsDrag (app.js 1125–1180).
 *
 * The track is moved with a transform rather than scrollLeft, so the rail
 * keeps its eased settle when the pointer is released. Travel is clamped to
 * the overflow, so the first and last card never pull past the edge.
 *
 * On touch, pen, and any pointer at tablet width and below (900px), a swipe
 * steps exactly one card: a short or quick flick past SWIPE_THRESHOLD settles
 * on the next or previous card, anything less settles back. Following the
 * finger 1:1 meant a card only moved as far as the thumb did, which felt heavy.
 * A desktop mouse keeps the prototype's free drag.
 *
 * A drag that actually moved swallows the click that follows it, otherwise
 * letting go over a card would follow the link underneath.
 *
 * With no JS the rail is a plain overflow-hidden row — every card is still in
 * the markup, and nothing below it depends on this file.
 */

const MOVE_THRESHOLD = 4;
const CLICK_SUPPRESS_MS = 350;
const SWIPE_THRESHOLD = 40;
const FLICK_VELOCITY = 0.35; // px per ms
const stepQuery = window.matchMedia('(max-width: 900px)');

/** Current translateX of an element, read back off its computed transform. */
function readTranslateX(element) {
  const transform = window.getComputedStyle(element).transform;
  if (!transform || transform === 'none') return 0;

  const matrix3d = transform.match(/matrix3d\(([^)]+)\)/);
  if (matrix3d) return Number(matrix3d[1].split(',')[12]) || 0;

  const matrix = transform.match(/matrix\(([^)]+)\)/);
  if (matrix) return Number(matrix[1].split(',')[4]) || 0;

  return 0;
}

function bindRail(rail) {
  const track = rail.querySelector('[data-jci-testimonials-track]');
  if (!track || rail.dataset.jciDragBound) return;
  rail.dataset.jciDragBound = 'true';

  let drag = null;
  let suppressClick = false;

  /** Keep travel between "first card flush left" and "last card flush right". */
  const clamp = (value) => Math.min(0, Math.max(rail.clientWidth - track.scrollWidth, value));

  /** The resting position of each card, deduplicated where the end clamp folds several into one. */
  const stops = () => {
    const cards = [...track.children];
    const origin = cards[0]?.offsetLeft ?? 0;
    const positions = cards.map((card) => clamp(origin - card.offsetLeft));
    return positions.filter((position, index) => index === 0 || position !== positions[index - 1]);
  };

  const nearestStop = (list, x) =>
    list.reduce((best, position, index) => (Math.abs(position - x) < Math.abs(list[best] - x) ? index : best), 0);

  const settleTo = (x) => {
    track.style.transition = '';
    track.style.transform = `translate3d(${x}px, 0, 0)`;
  };

  const finishDrag = (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;

    const { moved, step, startIndex, stopList } = drag;
    const delta = event.clientX - drag.startX;
    const velocity = delta / Math.max(1, event.timeStamp - drag.startTime);
    drag = null;
    rail.classList.remove('is-dragging');
    track.style.transition = '';
    if (rail.hasPointerCapture?.(event.pointerId)) rail.releasePointerCapture(event.pointerId);

    if (step && event.type === 'pointerup') {
      let index = startIndex;
      if (moved && (delta <= -SWIPE_THRESHOLD || velocity <= -FLICK_VELOCITY)) index += 1;
      if (moved && (delta >= SWIPE_THRESHOLD || velocity >= FLICK_VELOCITY)) index -= 1;
      settleTo(stopList[Math.min(stopList.length - 1, Math.max(0, index))]);
    } else if (step) {
      settleTo(stopList[startIndex]);
    }

    if (moved) {
      suppressClick = true;
      window.setTimeout(() => {
        suppressClick = false;
      }, CLICK_SUPPRESS_MS);
    }
  };

  rail.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    const currentX = clamp(readTranslateX(track));
    const step = event.pointerType !== 'mouse' || stepQuery.matches;
    const stopList = step ? stops() : [];

    drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startTime: event.timeStamp,
      currentX,
      moved: false,
      lastDelta: 0,
      step,
      stopList,
      startIndex: step ? nearestStop(stopList, currentX) : 0,
    };

    // The eased settle is for release, not for following the finger.
    track.style.transition = 'none';
    track.style.transform = `translate3d(${drag.currentX}px, 0, 0)`;
    rail.classList.add('is-dragging');
    rail.setPointerCapture?.(event.pointerId);
  });

  rail.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;

    const delta = event.clientX - drag.startX;
    if (Math.abs(delta) > MOVE_THRESHOLD) drag.moved = true;
    if (!drag.moved) return;

    event.preventDefault();
    drag.currentX = clamp(drag.currentX + delta - drag.lastDelta);
    drag.lastDelta = delta;
    track.style.transform = `translate3d(${drag.currentX}px, 0, 0)`;
  });

  rail.addEventListener('pointerup', finishDrag);
  rail.addEventListener('pointercancel', finishDrag);

  rail.addEventListener(
    'click',
    (event) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
    },
    true
  );

  rail.addEventListener('dragstart', (event) => event.preventDefault());

  // A resize can leave the track between cards or past the new overflow.
  window.addEventListener('resize', () => {
    if (drag) return;
    const x = clamp(readTranslateX(track));
    const list = stops();
    track.style.transition = 'none';
    track.style.transform = `translate3d(${stepQuery.matches ? list[nearestStop(list, x)] : x}px, 0, 0)`;
  });
}

function bindAll(root = document) {
  root.querySelectorAll('[data-jci-testimonials-rail]').forEach(bindRail);
}

bindAll();

// The Theme Editor replaces a section's markup wholesale, so the new rail
// needs binding again.
document.addEventListener('shopify:section:load', (event) => bindAll(event.target));
