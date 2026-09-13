/**
 * Maison Cavallé — FAQ questions.
 *
 * Filters the questions as you type, hides a topic once none of its questions
 * match, and shows the no-results line. Mirrors the prototype's behaviour
 * (app.js → FAQ search): an open question closes while filtering, so the list
 * reads as a list of matches rather than a half-expanded one.
 *
 * The message copy is a section setting, passed in on the element rather than
 * written here, so it stays editable and translatable.
 */
const SECTION = 'section.jci-faq';
const QUERY_TOKEN = '[query]';

class JciFaq {
  #items = [];

  constructor(section) {
    this.section = section;
    this.input = section.querySelector('[data-jci-faq-search]');
    this.clear = section.querySelector('[data-jci-faq-clear]');
    this.groups = [...section.querySelectorAll('[data-jci-faq-group]')];
    this.empty = section.querySelector('[data-jci-faq-empty]');

    // The haystack is built once. Reading textContent per keystroke would
    // walk every answer on every character.
    this.#items = [...section.querySelectorAll('[data-jci-faq-item]')].map((item) => ({
      item,
      text: item.textContent.toLowerCase().replace(/\s+/g, ' '),
    }));

    if (!this.input) return;

    this.input.addEventListener('input', this.#handleInput);
    this.clear?.addEventListener('click', this.#handleClear);
    this.bound = true;
  }

  destroy() {
    if (!this.bound) return;

    this.input.removeEventListener('input', this.#handleInput);
    this.clear?.removeEventListener('click', this.#handleClear);
  }

  #handleInput = () => this.#filter(this.input.value);

  #handleClear = () => {
    this.input.value = '';
    this.#filter('');
    this.input.focus();
  };

  #filter(value) {
    const query = value.trim().toLowerCase();
    let matches = 0;

    for (const { item, text } of this.#items) {
      const hit = query === '' || text.includes(query);

      item.hidden = !hit;

      // A question left open while filtered would push the matches down the
      // page; the prototype closes them all as soon as a query is typed.
      if (query !== '' && item.open) item.open = false;
      if (hit) matches += 1;
    }

    for (const group of this.groups) {
      group.hidden = query !== '' && !group.querySelector('[data-jci-faq-item]:not([hidden])');
    }

    if (!this.empty) return;

    const template = this.empty.dataset.jciFaqEmptyTemplate ?? '';
    this.empty.hidden = matches > 0 || query === '';
    this.empty.textContent = query === '' ? '' : template.replace(QUERY_TOKEN, value.trim());
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
