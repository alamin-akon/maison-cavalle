/**
 * Maison Cavallé — collection grid.
 *
 * Prototype source: maison-cavalle-main/app.js → the [data-filter] / [data-sort]
 * click handlers, setFilterMenuOpen, setSortMenuOpen, loadMoreCollection.
 *
 * Three jobs:
 *
 * 1. The filter and sort dropdowns: open on the trigger, close on a second
 *    click, a click outside, or Escape (which hands focus back to the trigger).
 *
 * 2. Filter and sort without a page load. The prototype re-renders the
 *    collection in place; here the chosen link's URL is fetched through the
 *    Section Rendering API and only this section is swapped, together with the
 *    collection hero when it is on the page, since the prototype's hero title
 *    follows the category too. The address bar follows with pushState, so the
 *    URL stays shareable and Back / Forward step through the choices.
 *
 * 3. "Load more pieces" fetches Shopify's next page the same way, appends its
 *    cards and moves the link on to the page after, or removes it on the last.
 *
 * Every link keeps a real href, so with no JS - or when a fetch fails - each
 * one is an ordinary page load. Horizon's <product-card> and quick-add
 * elements upgrade themselves once they land in the document.
 */
const ROOT = '[data-jci-collection-grid]';
const HERO = '.jci-collection-hero';
const HISTORY_KEY = 'jciCollectionGrid';

const instances = new WeakMap();
let controller = null;

class JciCollectionGrid {
  #loading = false;

  constructor(root) {
    this.root = root;
    this.sectionId = root.dataset.sectionId;
    this.list = root.querySelector('[data-jci-collection-grid-list]');
    this.dropdowns = [...root.querySelectorAll('[data-jci-dropdown]')];

    root.addEventListener('click', this.#handleClick);
    root.addEventListener('keydown', this.#handleKeydown);
    document.addEventListener('click', this.#handleOutsideClick);
  }

  destroy() {
    this.root.removeEventListener('click', this.#handleClick);
    this.root.removeEventListener('keydown', this.#handleKeydown);
    document.removeEventListener('click', this.#handleOutsideClick);
  }

  #handleClick = (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const trigger = target.closest('[data-jci-dropdown-trigger]');
    if (trigger) {
      this.#setOpen(trigger.closest('[data-jci-dropdown]'), trigger.getAttribute('aria-expanded') !== 'true');
      return;
    }

    const more = target.closest('[data-jci-collection-grid-more-link]');
    if (more) {
      event.preventDefault();
      this.#loadMore(more);
      return;
    }

    const link = target.closest('[data-jci-collection-grid-link]');
    if (link && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();

      // Read before the menu closes: hiding it drops focus to <body>.
      const dropdown = link.closest('[data-jci-dropdown]');
      const hadFocus = this.root.contains(document.activeElement);
      this.#setOpen(dropdown, false);

      let focus = null;
      if (hadFocus) focus = dropdown ? { dropdown: this.dropdowns.indexOf(dropdown) } : { filter: true };

      navigate(link.href, { push: true, focus });
    }
  };

  /* -- Dropdowns --------------------------------------------------------- */

  #handleOutsideClick = (event) => {
    for (const dropdown of this.dropdowns) {
      if (!dropdown.contains(event.target)) this.#setOpen(dropdown, false);
    }
  };

  #handleKeydown = (event) => {
    if (event.key !== 'Escape') return;

    const dropdown = event.target instanceof Element ? event.target.closest('[data-jci-dropdown]') : null;
    if (!dropdown) return;

    this.#setOpen(dropdown, false);
    dropdown.querySelector('[data-jci-dropdown-trigger]')?.focus();
  };

  #setOpen(dropdown, open) {
    const trigger = dropdown?.querySelector('[data-jci-dropdown-trigger]');
    const menu = dropdown?.querySelector('[data-jci-dropdown-menu]');
    if (!trigger || !menu) return;

    // Only one menu at a time, as in the prototype.
    if (open) {
      for (const other of this.dropdowns) {
        if (other !== dropdown) this.#setOpen(other, false);
      }
    }

    trigger.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
  }

  /* -- Load more --------------------------------------------------------- */

  async #loadMore(link) {
    if (this.#loading || !this.list) return;
    this.#loading = true;
    link.setAttribute('aria-busy', 'true');
    this.list.setAttribute('aria-busy', 'true');

    try {
      const html = await fetchSections(link.href, [this.sectionId]);
      const next = parseSection(html[this.sectionId]);
      const nextList = next?.querySelector('[data-jci-collection-grid-list]');
      if (!nextList) throw new Error('Section missing from response');

      const nextLink = next.querySelector('[data-jci-collection-grid-more-link]');
      this.list.append(...nextList.children);

      if (nextLink) {
        link.href = nextLink.getAttribute('href');
      } else {
        link.closest('[data-jci-collection-grid-more]')?.remove();
      }
    } catch {
      window.location.href = link.href;
    } finally {
      this.#loading = false;
      link.removeAttribute('aria-busy');
      this.list.removeAttribute('aria-busy');
    }
  }
}

/* -- Section Rendering API ------------------------------------------------ */

function sectionIdOf(element) {
  return element?.closest('.shopify-section')?.id.replace(/^shopify-section-/, '') ?? null;
}

async function fetchSections(url, ids, signal) {
  const request = new URL(url, window.location.origin);
  request.searchParams.set('sections', ids.join(','));

  const response = await fetch(request, { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

/** The API returns each section inside its `shopify-section` wrapper. */
function parseSection(markup) {
  if (typeof markup !== 'string') return null;
  return new DOMParser().parseFromString(markup, 'text/html').querySelector('.shopify-section');
}

/**
 * Swaps the grid (and the hero, when present) for the version at `url`.
 * A newer choice aborts an older one still on its way, so a quick second
 * click can never be overwritten by the first click's late response.
 */
async function navigate(url, { push = false, focus = null } = {}) {
  const root = document.querySelector(ROOT);
  const gridId = root?.dataset.sectionId;
  if (!root || !gridId) {
    window.location.href = url;
    return;
  }

  const hero = document.querySelector(HERO);
  const heroId = sectionIdOf(hero);
  const ids = heroId ? [gridId, heroId] : [gridId];

  controller?.abort();
  controller = new AbortController();
  const { signal } = controller;

  const list = root.querySelector('[data-jci-collection-grid-list]');
  list?.setAttribute('aria-busy', 'true');

  let html;
  try {
    html = await fetchSections(url, ids, signal);
  } catch (error) {
    if (error.name === 'AbortError') return;
    window.location.href = url;
    return;
  }

  const nextGrid = parseSection(html[gridId]);
  if (!nextGrid?.querySelector(ROOT)) {
    window.location.href = url;
    return;
  }

  instances.get(root)?.destroy();
  instances.delete(root);
  root.closest('.shopify-section').replaceChildren(...nextGrid.children);

  const nextHero = heroId ? parseSection(html[heroId]) : null;
  if (nextHero) hero.closest('.shopify-section').replaceChildren(...nextHero.children);

  if (push) history.pushState({ ...history.state, [HISTORY_KEY]: true }, '', url);

  const fresh = document.querySelector(ROOT);
  bind(fresh.parentElement);

  if (focus) restoreFocus(fresh, focus);
}

/** The element that was clicked no longer exists, so its successor takes focus. */
function restoreFocus(root, focus) {
  let target = null;

  if (focus.dropdown >= 0) {
    target = root.querySelectorAll('[data-jci-dropdown-trigger]')[focus.dropdown];
  } else if (focus.filter) {
    target = root.querySelector('[data-jci-collection-grid-link][aria-current="page"]');
  }

  target?.focus({ preventScroll: true });
}

/* -- Wiring --------------------------------------------------------------- */

function bind(scope = document) {
  for (const root of scope.querySelectorAll?.(ROOT) ?? []) {
    if (instances.has(root)) continue;
    instances.set(root, new JciCollectionGrid(root));
  }
}

bind();

if (document.querySelector(ROOT)) {
  // Marks the entry the shopper landed on, so Back from a filtered view knows
  // it is ours to restore rather than a full navigation.
  history.replaceState({ ...history.state, [HISTORY_KEY]: true }, '', window.location.href);
}

window.addEventListener('popstate', (event) => {
  if (!event.state?.[HISTORY_KEY] || !document.querySelector(ROOT)) return;
  navigate(window.location.href);
});

document.addEventListener('shopify:section:load', (event) => bind(event.target));

document.addEventListener('shopify:section:unload', (event) => {
  for (const root of event.target.querySelectorAll?.(ROOT) ?? []) {
    instances.get(root)?.destroy();
    instances.delete(root);
  }
});
