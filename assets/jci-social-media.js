/**
 * Maison Cavallé — social media band.
 *
 * Pointer-drag over a track that is already drifting under a CSS animation,
 * cloned from the prototype's activateSocialMediaDrag (app.js).
 *
 * The awkward part is handing control back and forth. On pointer-down the
 * animation is frozen at wherever it currently sits, by reading the computed
 * transform and pinning it as an inline one. On release the inline transform
 * comes off and the animation restarts with a negative `animation-delay`, so
 * it picks up at the position the drag ended rather than snapping to the top
 * of the loop.
 *
 * Travel wraps rather than clamps: the set is rendered twice, so one loop is
 * half the track, and the offset is normalised into that range — the band has
 * no start or end to hit.
 *
 * A drag that moved swallows the click that follows, otherwise letting go over
 * a card would open its link.
 *
 * With no JS the band still drifts — the animation is pure CSS. Under
 * prefers-reduced-motion it holds still and the duplicate set is hidden, so
 * there is nothing to drag and nothing is bound.
 */

const MOVE_THRESHOLD = 4;
const CLICK_SUPPRESS_MS = 350;
const FALLBACK_DURATION = 42;

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

function bindMarquee(marquee) {
  const track = marquee.querySelector('[data-jci-social-track]');
  if (!track || marquee.dataset.jciDragBound) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  marquee.dataset.jciDragBound = 'true';

  let drag = null;
  let suppressClick = false;

  /** One loop is half the track — the set is rendered twice. */
  const loopWidth = () => track.scrollWidth / 2;

  /** Wrap an offset into a single loop, so the band never runs out. */
  const normalize = (value, width) => {
    if (!width) return value;
    let wrapped = value;
    while (wrapped > 0) wrapped -= width;
    while (wrapped < -width) wrapped += width;
    return wrapped;
  };

  /** Freeze the drift where it currently is, and report that position. */
  const pauseTrack = () => {
    const currentX = readTranslateX(track);
    track.style.animation = 'none';
    track.style.transform = `translate3d(${currentX}px, 0, 0)`;
    return currentX;
  };

  /** Hand the drift back, resuming from where the drag left off. */
  const resumeTrack = (currentX) => {
    const width = loopWidth();
    const wrapped = normalize(currentX, width);
    const progress = width ? (wrapped + width) / width : 0;
    const duration = Number.parseFloat(window.getComputedStyle(track).animationDuration) || FALLBACK_DURATION;

    track.style.transform = '';
    track.style.animation = '';
    track.style.animationDelay = `${-Math.min(Math.max(progress, 0), 1) * duration}s`;
  };

  const finishDrag = (event, cancelled = false) => {
    if (!drag || event.pointerId !== drag.pointerId) return;

    const finished = drag;
    drag = null;
    marquee.classList.remove('is-dragging');

    if (cancelled) {
      track.style.transform = '';
      track.style.animation = '';
    } else {
      resumeTrack(finished.currentX);
    }

    if (marquee.hasPointerCapture?.(event.pointerId)) marquee.releasePointerCapture(event.pointerId);

    if (finished.moved && !cancelled) {
      suppressClick = true;
      window.setTimeout(() => {
        suppressClick = false;
      }, CLICK_SUPPRESS_MS);
    }
  };

  marquee.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      currentX: pauseTrack(),
      moved: false,
      lastDelta: 0,
    };

    marquee.classList.add('is-dragging');
    marquee.setPointerCapture?.(event.pointerId);
  });

  marquee.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;

    const delta = event.clientX - drag.startX;
    if (Math.abs(delta) > MOVE_THRESHOLD) drag.moved = true;
    if (!drag.moved) return;

    event.preventDefault();
    drag.currentX = normalize(drag.currentX + delta - drag.lastDelta, loopWidth());
    drag.lastDelta = delta;
    track.style.transform = `translate3d(${drag.currentX}px, 0, 0)`;
  });

  marquee.addEventListener('pointerup', (event) => finishDrag(event));
  marquee.addEventListener('pointercancel', (event) => finishDrag(event, true));

  marquee.addEventListener(
    'click',
    (event) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
    },
    true
  );

  marquee.addEventListener('dragstart', (event) => event.preventDefault());
}

function bindAll(root = document) {
  root.querySelectorAll('[data-jci-social-marquee]').forEach(bindMarquee);
}

bindAll();

// The Theme Editor replaces a section's markup wholesale, so the new band
// needs binding again.
document.addEventListener('shopify:section:load', (event) => bindAll(event.target));
