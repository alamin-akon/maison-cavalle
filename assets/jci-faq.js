/**
 * Maison Cavallé — FAQ questions.
 *
 * Two jobs:
 *
 * 1. Open and close. `<details>` snaps; this animates the answer's height
 *    instead, keeping the element semantics intact — the click is
 *    intercepted, the height is animated, and `open` is set at the right end
 *    of the transition so the markup is always honest about what is showing.
 *    Same treatment as the home FAQ, including the two things that bite:
 *      - the bottom padding travels with the height, because under
 *        `box-sizing: border-box` an element at `height: 0` is still as tall
 *        as its padding, which left a padding-tall strip to vanish on close;
 *      - `cancel()` fires `cancel`, never `finish`, so the intended `open`
 *        state is applied off the `finished` promise rather than a `finish`
 *        listener that an interrupting click would drop.
 *
 * 2. Search. Filters the questions as you type, hides a topic once none of
 *    its questions match, and shows the no-results line. Mirrors the
 *    prototype (app.js → FAQ search): an open question closes while
 *    filtering, so the list reads as a list of matches.
 *
 * With no JS, or under prefers-reduced-motion, the accordion behaves exactly
 * as the browser's own <details> does.
 */
const SECTION = 'section.jci-faq';
const QUERY_TOKEN = '[query]';
const DEFAULT_DURATION = 320;
const EASING = 'cubic-bezier(0.22, 0.61, 0.36, 1)';

class JciFaq {
  #animations = new WeakMap();
  #entries = [];
  #widthObserver;
  #lastWidth = 0;

  constructor(section) {
    this.section = section;
    this.input = section.querySelector('[data-jci-faq-search]');
    this.clear = section.querySelector('[data-jci-faq-clear]');
    this.groups = [...section.querySelectorAll('[data-jci-faq-group]')];
    this.groupsContainer = section.querySelector('.jci-faq-groups');
    this.empty = section.querySelector('[data-jci-faq-empty]');
    this.items = [...section.querySelectorAll('[data-jci-faq-item]')];

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.duration = Number(section.dataset.jciFaqDuration) || DEFAULT_DURATION;
    this.singleOpen = section.hasAttribute('data-jci-faq-single');

    // The haystack is built once. Reading textContent per keystroke would
    // walk every answer on every character.
    this.#entries = this.items.map((item) => ({
      item,
      text: item.textContent.toLowerCase().replace(/\s+/g, ' '),
    }));

    // Just like the home FAQ, hold enough space for the tallest possible
    // single answer before anything is clicked. That keeps the section below
    // this FAQ stationary while its answers open and close.
    this.#reserveHeight();
    this.#observeWidth();
    document.fonts?.ready.then(() => this.#reserveHeight());

    this.input?.addEventListener('input', this.#handleInput);
    this.clear?.addEventListener('click', this.#handleClear);

    // Under reduced motion <details> is left to toggle itself. Single-open
    // still has to hold, so it rides the native toggle event instead of the
    // intercepted click.
    if (this.reducedMotion) {
      if (this.singleOpen) section.addEventListener('toggle', this.#handleToggle, true);
    } else {
      for (const item of this.items) {
        item.querySelector('.jci-faq-item-summary')?.addEventListener('click', this.#handleClick);
      }
    }
  }

  destroy() {
    this.input?.removeEventListener('input', this.#handleInput);
    this.clear?.removeEventListener('click', this.#handleClear);
    this.section.removeEventListener('toggle', this.#handleToggle, true);
    this.#widthObserver?.disconnect();

    for (const item of this.items) {
      item.querySelector('.jci-faq-item-summary')?.removeEventListener('click', this.#handleClick);
    }
  }

  /* -- Open and close ------------------------------------------------- */

  /**
   * The FAQ page has several topic groups, so the reserve belongs to their
   * shared wrapper rather than an individual list. One open answer consumes
   * that reserved space, leaving the following section in the same place.
   */
  #reserveHeight() {
    if (!this.groupsContainer || this.items.length === 0) return;
    if (this.input?.value) return;

    this.section.style.removeProperty('--jci-faq-groups-reserve');

    const wasOpen = this.items.map((item) => item.open);
    const heights = this.items.map((item) => {
      const answer = this.#answer(item);
      if (!answer) return 0;

      const animation = this.#animations.get(answer);
      animation?.cancel();
      this.#animations.delete(answer);

      item.open = true;
      const height = answer.scrollHeight;
      item.open = false;
      return height;
    });

    const closed = this.groupsContainer.getBoundingClientRect().height;

    this.items.forEach((item, index) => {
      item.open = wasOpen[index];
    });

    const answers = this.singleOpen ? Math.max(...heights, 0) : heights.reduce((total, height) => total + height, 0);
    const reserve = Math.ceil(closed + answers);
    if (reserve > 0) this.section.style.setProperty('--jci-faq-groups-reserve', `${reserve}px`);
  }

  #observeWidth() {
    if (typeof ResizeObserver === 'undefined' || !this.groupsContainer) return;

    this.#lastWidth = this.groupsContainer.getBoundingClientRect().width;
    this.#widthObserver = new ResizeObserver(() => {
      const width = this.groupsContainer.getBoundingClientRect().width;
      if (Math.abs(width - this.#lastWidth) < 1) return;

      this.#lastWidth = width;
      this.#reserveHeight();
    });
    this.#widthObserver.observe(this.groupsContainer);
  }

  #handleToggle = (event) => {
    const item = event.target;
    if (!item.open || !this.items.includes(item)) return;

    for (const other of this.items) {
      if (other !== item) other.open = false;
    }
  };

  #handleClick = (event) => {
    // The browser would toggle `open` immediately; the height animation needs
    // to drive that instead.
    event.preventDefault();

    const item = event.currentTarget.closest('[data-jci-faq-item]');
    if (!item) return;

    if (item.open) {
      this.#close(item);
      return;
    }

    if (this.singleOpen) {
      for (const other of this.items) {
        if (other !== item && other.open) this.#close(other);
      }
    }

    this.#open(item);
  };

  #answer(item) {
    return item.querySelector('.jci-faq-item-answer');
  }

  #padBottom(answer) {
    return getComputedStyle(answer).paddingBottom || '0px';
  }

  #open(item) {
    const answer = this.#answer(item);
    if (!answer) {
      item.open = true;
      return;
    }

    this.#animations.get(answer)?.cancel();
    item.open = true;

    const animation = answer.animate(
      {
        height: ['0px', `${answer.scrollHeight}px`],
        paddingBottom: ['0px', this.#padBottom(answer)],
        opacity: [0, 1],
      },
      { duration: this.duration, easing: EASING }
    );

    this.#settle(answer, animation, item, true);
  }

  #close(item) {
    const answer = this.#answer(item);
    if (!answer) {
      item.open = false;
      return;
    }

    this.#animations.get(answer)?.cancel();

    // Measured, not read off scrollHeight: a cancelled animation can leave an
    // inline height behind, and collapsing from the wrong start point is what
    // makes the row kick.
    const from = answer.getBoundingClientRect().height || answer.scrollHeight;

    const animation = answer.animate(
      {
        height: [`${from}px`, '0px'],
        paddingBottom: [this.#padBottom(answer), '0px'],
        opacity: [1, 0],
      },
      { duration: this.duration, easing: EASING }
    );

    // `open` comes off only once the answer has finished collapsing, so the
    // row never jumps ahead of the animation.
    this.#settle(answer, animation, item, false);
  }

  /**
   * Applies the intended `open` state once the animation lands, and only if
   * this animation is still the current one.
   */
  #settle(answer, animation, item, open) {
    this.#animations.set(answer, animation);

    animation.finished
      .then(() => {
        if (this.#animations.get(answer) !== animation) return;
        item.open = open;
      })
      .catch(() => {
        /* cancelled - whichever click replaced it owns the state now */
      })
      .finally(() => {
        if (this.#animations.get(answer) === animation) this.#animations.delete(answer);
      });
  }

  /* -- Search --------------------------------------------------------- */

  #handleInput = () => this.#filter(this.input.value);

  #handleClear = () => {
    this.input.value = '';
    this.#filter('');
    this.input.focus();
  };

  #filter(value) {
    const query = value.trim().toLowerCase();
    let matches = 0;

    // Search deliberately shows only matching rows, so its result should
    // remain compact rather than keeping the normal accordion reserve.
    if (query !== '') this.section.style.removeProperty('--jci-faq-groups-reserve');

    for (const { item, text } of this.#entries) {
      const hit = query === '' || text.includes(query);

      item.hidden = !hit;

      // A question left open while filtered would push the matches down the
      // page, so they all close — instantly, not animated, since the row is
      // about to be hidden anyway.
      if (query !== '' && item.open) {
        const answer = this.#answer(item);
        if (answer) {
          this.#animations.get(answer)?.cancel();
          this.#animations.delete(answer);
        }
        item.open = false;
      }

      if (hit) matches += 1;
    }

    for (const group of this.groups) {
      group.hidden = query !== '' && !group.querySelector('[data-jci-faq-item]:not([hidden])');
    }

    if (!this.empty) return;

    const template = this.empty.dataset.jciFaqEmptyTemplate ?? '';
    this.empty.hidden = matches > 0 || query === '';
    this.empty.textContent = query === '' ? '' : template.replace(QUERY_TOKEN, value.trim());

    if (query === '') this.#reserveHeight();
  }
}

const instances = new WeakMap();

function bind(root = document) {
  for (const section of root.querySelectorAll?.(SECTION) ?? []) {
    if (instances.has(section)) continue;
    instances.set(section, new JciFaq(section));
  }
}

bind();

document.addEventListener('shopify:section:load', (event) => bind(event.target));

document.addEventListener('shopify:section:unload', (event) => {
  const section = event.target.querySelector?.(SECTION);
  if (!section) return;

  instances.get(section)?.destroy();
  instances.delete(section);
});
