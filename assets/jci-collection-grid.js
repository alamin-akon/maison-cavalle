/**
 * Maison Cavallé — collection grid.
 *
 * Prototype source: maison-cavalle-main/app.js → the filter / sort dropdown
 * handlers and loadMoreCollection.
 *
 * Two jobs:
 *
 * 1. The filter and sort dropdowns: open on the trigger, close on a second
 *    click, a click outside, or Escape (which hands focus back to the trigger).
 *    Their items are plain links, so choosing one is a normal page load.
 *
 * 2. "Load more pieces". The link already points at Shopify's next page; this
 *    fetches that page through the Section Rendering API, appends its cards and
 *    moves the link on to the page after, or removes it on the last page.
 *    Horizon's <product-card> and quick-add elements upgrade themselves once
 *    they land in the document.
 */
const ROOT = '[data-jci-collection-grid]';

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

  /* -- Dropdowns --------------------------------------------------------- */

  #handleClick = (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const trigger = target.closest('[data-jci-dropdown-trigger]');
    if (trigger) {
      const dropdown = trigger.closest('[data-jci-dropdown]');
      this.#setOpen(dropdown, trigger.getAttribute('aria-expanded') !== 'true');
      return;
    }

    const more = target.closest('[data-jci-collection-grid-more-link]');
    if (more) {
      event.preventDefault();
      this.#loadMore(more);
    }
  };

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

    try {
      const url = new URL(link.href, window.location.origin);
      url.searchParams.set('section_id', this.sectionId);

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const html = new DOMParser().parseFromString(await response.text(), 'text/html');
      const nextList = html.querySelector('[data-jci-collection-grid-list]');
      const nextLink = html.querySelector('[data-jci-collection-grid-more-link]');

      this.list.append(...(nextList?.children ?? []));

      if (nextLink) {
        link.href = nextLink.getAttribute('href');
      } else {
        link.closest('[data-jci-collection-grid-more]')?.remove();
      }
    } catch {
      // The link still points at the next page, so a failed fetch falls back
      // to a normal page load.
      window.location.href = link.href;
    } finally {
      this.#loading = false;
      link.removeAttribute('aria-busy');
    }
  }
}

const instances = new WeakMap();

function bind(scope = document) {
  for (const root of scope.querySelectorAll?.(ROOT) ?? []) {
    if (instances.has(root)) continue;
    instances.set(root, new JciCollectionGrid(root));
  }
}

bind();

document.addEventListener('shopify:section:load', (event) => bind(event.target));

document.addEventListener('shopify:section:unload', (event) => {
  for (const root of event.target.querySelectorAll?.(ROOT) ?? []) {
    instances.get(root)?.destroy();
    instances.delete(root);
  }
});
