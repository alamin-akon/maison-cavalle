# Maison Cavallé — Theme Build Spec

Single source of truth for how the Horizon theme is built from the
`maison-cavalle-main` prototype.

**Source of design truth:** `~/Downloads/maison-cavalle-main/`
(`styles.css` `:root` block + `.superdesign/init/theme.md`)

**Where it runs:** the build happens directly on the client's store. There is
no intermediate development store and no theme transfer step, so a Shopify
**Files** upload is as durable as anything committed to `assets/`.

**Hard rule:** nothing in this file gets hardcoded into a section.
Colours, fonts, radii and button styling live in **global theme settings**
(`config/settings_data.json` / `settings_schema.json`) so the client can
change them from the Theme Editor. Sections read them via CSS custom
properties only.

---

## 0. Authority — who decides what

Three sources, in strict priority order. Higher always wins.

| # | Source | Governs |
|---|---|---|
| 1 | **The developer's instruction** | Overrides everything. If the prototype has a bug, an inconsistency, or a layout that does not work, the fix is whatever the developer specifies — never an improvised one. |
| 2 | **The prototype** (`maison-cavalle-main`) | The visual result. Cloned 1:1. |
| 3 | **Horizon defaults** | Only fills gaps the prototype does not cover. |

### 1:1 clone means 1:1

The prototype is not a reference or a mood board. It is the target. Every
spacing value, font size, letter-spacing, border width, transition duration,
hover state, breakpoint behaviour and animation timing is reproduced exactly
as authored in `styles.css`.

**No unrequested improvement.** Not "cleaner", not "more accessible", not
"more modern", not "better on mobile" — none of it, unless asked for.

### When the prototype has a problem

Do **not** silently fix it. Do **not** silently copy it either.

1. Build the rest of the section.
2. Report the problem: what it is, where it is, what it breaks.
3. Wait for the developer's decision.
4. Implement exactly that decision.

The one exception is a value that Horizon structurally cannot express
(§3 line-heights, §5 content width). Those are already resolved in this
document and need no re-approval.

### When the prototype overrides itself

`styles.css` re-declares the same property for the same element in several
places — a later rule, a higher-specificity selector, a media query. The value
we clone is **the one that wins the cascade**, never the first declaration a
search happens to land on. Resolve the property the way the browser does, then
copy the winner.

### Letter-spacing and line-height are not authored

Standing developer instruction, and by §0 #1 it outranks the prototype:
**we never write `letter-spacing` or `line-height`.**

Whatever the mockup declares for either property — negative tracking, sub-1
leading, a tuned body measure — is not reproduced. Both are left at their
normal value, and *normal* means **the declaration is absent from our CSS**,
not written out as `normal`.

The rule covers:

- every `jci-*` section, snippet and `assets/jci-base.css`;
- the `font:` shorthand, which smuggles line-height in as `14px/1.2` — use
  `font-size` and `font-weight` separately instead;
- Horizon's own `--line-height--*` and `--letter-spacing--*` tokens, which are
  left at their defaults rather than retuned.

This is the one place the clone is deliberately not 1:1, so it needs no
per-instance report under §0. Everything else about the type — family, size,
weight, case — is still cloned exactly.

#### The one exception: page hero titles

Standing developer instruction, later than the rule above and outranking it:
**the page hero titles carry `line-height: 100%`.**

At `--jci-hero-title-size` (64 → 144px) normal leading opens the two lines of a
hero headline far enough apart that they stop reading as one block. These six
set it, and nothing else does:

| Section | Title class |
|---|---|
| `jci-story-hero` | `.jci-story-hero-title` |
| `jci-contact-hero` | `.jci-contact-hero-title` |
| `jci-size-guide-hero` | `.jci-size-guide-hero-title` |
| `jci-journal-hero` | `.jci-journal-hero-title` |
| `jci-collection-hero` | `.jci-collection-hero-title` |
| `jci-faq-hero` | `.jci-faq-hero-title` |

**The homepage hero (`jci-hero`) is excluded** and keeps normal leading.

The exception is this list and nothing more: not the feature/overlay titles
inside those heroes, not section headings, not body copy. `letter-spacing`
stays banned everywhere, with no exception.

### A section ships complete, or not at all

Standing developer instruction, and by §0 #1 it outranks everything below:
**a section is built in one pass, from the mockup, responsive included.**

Every section is authored against the mockup in a single sitting — markup,
CSS, both breakpoints, settings, and the template entry that renders it. The
desktop layout and the 900px / 680px behaviour are the same piece of work, not
two.

Responsive is **not** a follow-up task. There is no pass where the section is
"finished on desktop" and mobile is left for later. Open the mockup at all
three widths first, then write the section once.

A section is **done** only when all five are true:

| # | Condition |
|---|---|
| 1 | Renders correctly at desktop, 900px and 680px, matching the mockup at each |
| 2 | Every string, colour, image and spacing value is a setting — nothing hardcoded (§7) |
| 3 | Placed in its template (`templates/*.json` or a `*-group.json`) and rendering |
| 4 | `shopify theme check` clean |
| 5 | Range settings pass the four server rules (§1) |

These do **not** count as done:

- desktop built, responsive deferred;
- a `sections/jci-*.liquid` file that exists but no template renders;
- a section that only works with its default settings.

Condition 3 is not paperwork. A section that no template renders has not
shipped, however complete the file looks — so it is not marked done in §8.

### One container, one rhythm, one type scale

Standing developer instruction, and by §0 #1 it outranks the prototype:
**every section shares the same container, the same vertical padding and the
same heading and body sizes — whatever the mockup does per section.**

The prototype tunes these page by page: a 1280px measure on the FAQ against
1600px elsewhere, a different padding on each band, a heading that is 48px in
one place and 72px in another. None of that carries over. The mockup is still
cloned 1:1 for everything else; these four properties come from one place
instead.

| Property | Single source | Never |
|---|---|---|
| Container width and gutter | `jci-base.css` container defaults — `--jci-content-max`, `--jci-page-pad` | A per-section max-width |
| Section padding top / bottom | One `--jci-section-pad-*` step (§5) | A per-section clamp or a one-off value |
| Section heading size | `--jci-section-title-size` | A per-section `clamp()` |
| Body copy size | `--jci-subtitle-size` | A per-section font-size |

Page heroes keep `--jci-hero-title-size` (§3) — a hero headline is not a
section heading, and all heroes share that one token too.

**Settings still exist.** §5's per-section Padding top / Padding bottom ranges
stay, because a section has to be tunable without touching code. What this rule
fixes is their **defaults**: every section starts from the same number, so the
page is even until someone deliberately changes one. A setting that ships with
a different default to its neighbours is the thing being banned, not the
setting itself.

When a section genuinely needs a different width, it sets
`--jci-container-width` on its root (§1) rather than restyling its container —
but it starts from the shared value, not from whatever the mockup had.

**The prototype's own per-section caps are not cloned.** It narrows four places
below the shared measure — story chapter 03 and both size-guide sections to
1180px (`styles.css:687, 781, 797`), the contact section to 1180px, and the FAQ
head to 1280px (`:1004`) — while chapter 01 right beside it runs the full
measure (`:1293`). Those are inconsistencies in the prototype, not a system.
Standing developer instruction: **every section takes the shared container**,
and the prototype's narrower caps are dropped.

This is the one place the container rule is deliberately not 1:1, so it needs
no per-instance report under §0.

### Uploads beat filenames

Standing developer instruction: **whatever the merchant chooses in the Theme
Editor wins.** A `*_asset` text setting naming a file in `assets/` is the
*fallback*, used only when the picker is empty — never the other way round.

Every media pair follows this: check the `image_picker` / `video` setting
first, fall back to the asset filename. The setting's `info` says so too
("Used only when no image is chosen"), because a merchant who uploads an image
and sees nothing change has no way to work out why.

### One component per job

Four page heroes (`jci-story-hero`, `jci-contact-hero`, `jci-size-guide-hero`,
`jci-journal-hero`) are near-duplicates of the prototype's single
`.journal-hero` base, which it varies with a per-page modifier class. Each of
ours carries the same settings and differs only in a handful of tuned values.

They stay separate for now — consolidating them touches four live pages — but
**no fifth page hero gets added**. A new page reuses one of these four, and the
four should be folded into a single `jci-page-hero` when there is room to test
all four pages together.

### Structure is not design

The clone rule applies to the **visual output only**. The prototype's
internal code structure is discarded — its markup, hash routing, cart, search
and `app.js` state carry no authority. Liquid file layout, class naming and
container structure follow §1 and nothing else.

---

## 1. Section & class naming convention

Every custom section follows the same two-level shape:

```liquid
<section class="jci-{name}" ...>
  <div class="jci-{name}-container">
    <!-- content / blocks -->
  </div>
</section>
```

- `jci-{name}` — the **outer** element. Full-bleed. Owns background colour,
  vertical padding, `overflow`, `isolation`.
- `jci-{name}-container` — the **inner** element. Owns max-width and
  horizontal padding. Never sets its own background.

### Every element carries `jci-`

Not just the section root and the container — **every element we author gets a
`jci-` class**, down to the leaf nodes. Nothing is styled by tag selector,
descendant chain, or `:nth-child`. If it has a style, it has a `jci-` class.

```
jci-hero                             section root, full-bleed
  jci-hero-media                     video layer
    jci-hero-video
    jci-hero-grain
  jci-hero-container                 constrained wrapper
    jci-hero-topline
      jci-hero-eyebrow
      jci-hero-meta
    jci-hero-grid
      jci-hero-copy
        jci-hero-title
          jci-hero-title-word
        jci-hero-text
        jci-hero-cta
      jci-hero-side-note
    jci-hero-bottomline
      jci-hero-scroll
      jci-hero-moment-nav
        jci-hero-moment
          jci-hero-moment-number
          jci-hero-moment-label
          jci-hero-moment-line
      jci-hero-index
```

Naming is mechanical: `jci-{section}-{element}-{part}`. No abbreviations, no
BEM `__` / `--`, no invented prefixes.

State classes use `is-` after the `jci-` name, matching the prototype:
`jci-hero-moment is-active`, `jci-hero-copy is-changing`.

Prototype class → theme class is a direct rename, so any prototype rule
transfers one-to-one:

| Prototype | Theme |
|---|---|
| `.hero-copy` | `.jci-hero-copy` |
| `.hero-moment-label` | `.jci-hero-moment-label` |
| `.eyebrow` | `.jci-eyebrow` |
| `.button` | `.jci-button` |
| `.product-card` | `.jci-product-card` |

### Rules

| Rule | Detail |
|---|---|
| Prefix | Every authored class starts `jci-`. No exceptions, at any depth. |
| No bare tag styling | `.jci-hero-container h1 { }` is wrong. Give the h1 `class="jci-hero-title"`. |
| No structural selectors | No `:nth-child`, `>` chains, or descendant-only rules for styling. One class, one rule. |
| One container per section | Nested containers are not allowed. Full-bleed children break out with the `100vw` pattern (§5). |
| No class after `-container` | `[class$="-container"]` matches the **whole class attribute**, so `class="jci-x-container jci-x-container--full"` silently loses every container default. A section that needs a different width, offset or gutter sets `--jci-container-width` / `--jci-container-offset` / `--jci-container-pad` on its root instead. |
| No Horizon class overrides | Never restyle `.section`, `.page-width-*`, `.button` etc. globally. Scope everything under `jci-*`. |
| File naming | `sections/jci-hero.liquid` → root class `jci-hero` → `assets/jci-hero.css`. All three names match. |
| CSS location | One file per section: `assets/jci-hero.css`, loaded via the section schema's `stylesheet` attribute. Shared tokens/utilities live in `assets/jci-base.css`. |
| Snippets | `snippets/jci-product-card.liquid`, root class `jci-product-card`. |
| Custom properties | Section-scoped vars are also `jci-` prefixed: `--jci-hero-min-height`. |
| No inline `style=` | Except for Liquid-driven per-instance values, passed as CSS custom properties: `style="--jci-hero-min-height: {{ section.settings.height }}px"`. |
| JS hooks | Behaviour targets `data-jci-*` attributes, never a `jci-` class. Classes are for styling only. |
| Modified Horizon sections | When a Horizon section is modified rather than replaced (e.g. `header.liquid`), add `jci-{name}` to its root and reach its internal classes only through that scope: `.jci-header .menu-list__link`. Never restyle `.menu-list__link` on its own. |
| Dynamic values | `{% stylesheet %}` blocks do not run Liquid. Every setting-driven value passes through an inline `style="--jci-*: …"` on the section root. |
| Ranges | Five server rules, only the first of which `theme check` catches: `step` divisible by `0.1`; `unit` at most **3 characters**; at most **101 steps** (`(max - min) / step + 1`); at least **3 steps**; `default` on the step grid. For fractional values use whole numbers with a `%` unit and divide by 100 in Liquid. |
| Validate before pushing | `theme check` does not enforce the schema rules above — the server rejects the upload instead, and a section that fails to upload makes `header-group.json` fail too ("does not refer to an existing section file"). Run the schema validator as well as `theme check`. |
| Pushing JSON | `shopify theme dev` does **not** re-sync `sections/*-group.json`, `templates/*.json` or `config/settings_data.json` after it starts — it protects Theme Editor edits. Changes to those files need `shopify theme push`, or a restart of `theme dev`. Liquid and assets hot-sync normally. |
| Translations | Only use locale keys that already exist. A new key must be added to all 33 locale files or theme check fails. |

### Container defaults (`assets/jci-base.css`)

```css
[class^="jci-"][class$="-container"],
[class*=" jci-"][class$="-container"] {
  width: min(100%, var(--jci-content-max));
  margin-inline: auto;
  padding-inline: var(--jci-page-pad);
}
```

Every `jci-*-container` inherits this. A section only overrides it when the
prototype genuinely differs.

---

## 2. Colour palette → global settings

The prototype defines **9 colours**. All 9 go into Horizon's
**Theme settings → Color palette** (the `+` button adds slots beyond the
default 4). Sections reference palette entries, never hex values.

| Prototype token | Hex | Horizon palette slot | Role |
|---|---|---|---|
| `--paper` | `#fbfaf7` | `background` | Page background |
| `--ink` | `#1e211d` | `foreground` | Body text, primary button bg, borders |
| `--ink-soft` | `#353830` | `color1` | Secondary text, input text |
| `--sand` | `#ded8ca` | `color2` | Borders, dividers, input/drawer/popover borders |
| `--cream` | `#f3f0e8` | `color3` | Alternate section background (story section) |
| `--stone` | `#b0aa9e` | `color4` | Muted metadata |
| `--olive` | `#737960` | `color5` | Italic accent text, editorial banner background |
| `--rust` | `#98634b` | `color6` | Sale / highlight accent |
| `--hero-accent` | `#cbd2ad` | `color7` | Hero italic word, progress bar fill |

`--line` (`rgba(30,33,29,.16)`) is **not** a palette entry — it is derived:

```css
--jci-line: rgb(var(--color-foreground-rgb) / 0.16);
```

### `settings_data.json` patch

```json
"color_palette": {
  "background": "#fbfaf7",
  "foreground": "#1e211d",
  "color1": "#353830",
  "color2": "#ded8ca",
  "color3": "#f3f0e8",
  "color4": "#b0aa9e",
  "color5": "#737960",
  "color6": "#98634b",
  "color7": "#cbd2ad"
}
```

> Verify in the Theme Editor that the palette accepts 7 extra slots. If it
> caps lower, drop `color4` (stone) and `color6` (rust) first — they are the
> least referenced — and derive them as opacity steps off `foreground`.

Everything else already binds to the palette by reference and needs no change:

```json
"page_background_color": "{{ settings.color_palette.background }}",
"page_text_color":       "{{ settings.color_palette.foreground }}",
"drawer_border_color":   "{{ settings.color_palette.color2 }}",
"palette_input_border":  "{{ settings.color_palette.color2 }}"
```

Change the palette → the whole theme follows. That is the point.

---

## 3. Typography → global settings

**Two families. Not three.**

The prototype aliases its label face to the body face:

```css
--display: "Playfair Display";
--sans:    "Work Sans";
--mono:    var(--sans);
```

An earlier revision used DM Mono for eyebrows, labels, badges and buttons. It is
gone — only Playfair Display and Work Sans are used.

| Family | Styles | Role |
|---|---|---|
| Playfair Display | 500 normal, 500 italic | Display headlines; italic for accent words |
| Work Sans | 400, 500 | Body copy; 500 uppercase for labels and buttons |

### Horizon's four slots

| Horizon slot | Family | Used by |
|---|---|---|
| Body | Work Sans 400 | Paragraphs, product copy |
| Subheading | Work Sans 500 | h5/h6, eyebrows, labels, buttons, badges |
| Heading | Playfair Display 500 | h1–h4 |
| Accent | Playfair Display 500 *italic* | Accent words inside headlines |

```json
"type_body_font":       "work_sans_n4",
"type_subheading_font": "work_sans_n5",
"type_heading_font":    "playfair_display_n5",
"type_accent_font":     "playfair_display_i5"
```

Because Accent is a real italic variant, Horizon downloads the italic face —
the h1/h2 "Font: Heading | Accent" toggle switches roman to italic with no CSS.

### The label face

Uppercase metadata (eyebrows, buttons, action labels, badges, prices) reads one
token, so the whole set moves together if the decision changes again:

```css
:root {
  --jci-font-label: var(--font-subheading--family);   /* Work Sans 500 */
  --jci-font-display: var(--font-heading--family);    /* Playfair Display */
  --jci-font-sans: var(--font-body--family);          /* Work Sans */
}
```

Nothing is self-hosted. Both families come from Shopify's font picker, so no
`@font-face`, no `.woff2` in `assets/`, and no licence question.

> Weight note: the prototype loads Playfair Display 500, 600 and 500 italic, and
> Work Sans 400, 500 and 600. A Horizon font slot carries one weight, plus the
> bold and italic variants it derives with `font_modify`. The 600 weight appears
> only on the oversized "MC" watermarks, where the browser resolves it to the
> bold face — invisible at that size and opacity. Everything else maps exactly.

### Type scale

```json
"type_size_paragraph":        "14",
"type_line_height_paragraph": "body-loose",

"type_font_h1": "heading", "type_size_h1": "152",
"type_line_height_h1": "display-tight",
"type_letter_spacing_h1": "heading-tight", "type_case_h1": "none",

"type_font_h2": "heading", "type_size_h2": "72",
"type_line_height_h2": "display-tight",
"type_letter_spacing_h2": "heading-tight", "type_case_h2": "none",

"type_font_h3": "heading", "type_size_h3": "32",
"type_line_height_h3": "display-normal",
"type_letter_spacing_h3": "heading-tight", "type_case_h3": "none",

"type_font_h4": "heading", "type_size_h4": "24",
"type_line_height_h4": "display-tight",

"type_font_h5": "subheading", "type_size_h5": "14",
"type_line_height_h5": "display-loose", "type_case_h5": "uppercase",

"type_font_h6": "subheading", "type_size_h6": "12",
"type_line_height_h6": "display-loose", "type_case_h6": "uppercase"
```

### Exact prototype sizes

Every size below is taken verbatim from `styles.css`. These are the target.

| Role | Prototype value | Resolves to | Horizon setting |
|---|---|---|---|
| Body / `p` | `14px` / `1.55` | 14px | `14` — **exact** |
| Page hero `h1` | `clamp(4rem, 6.5vw, 9rem)` | 64 → **144px** | `152` — nearest, CSS override |
| Section title `h2` | `clamp(2.4rem, 5vw, 4.5rem)` | 38.4 → **72px** | `72` — **exact** |
| Product title | `clamp(36px, 4vw, 56px)` | 36 → 56px | own class, not global h1 |
| `h3` | `32px` | 32px | `32` — exact |
| `h4` | `24px` | 24px | `24` — exact |
| `h5` / label | `14px` | 14px | `14` — exact |
| `h6` / eyebrow | `10–12px` | 12px | `12` — exact |
| Eyebrow | `500 14px/1.2` mono, `.14em` | 14px | `.jci-eyebrow` utility |
| Button | `14px/1` mono, `.13em` | 14px | `--jci-button-size` |
| Text link | `14px` mono, `.12em` | 14px | `.jci-text-link` |

All page heroes — home, collection, story, journal, faq — share
`--hero-title-size`. Only the product page differs, so it gets
`.jci-product-title` instead of relying on the global `h1`.

**`144px` is not in Horizon's dropdown** (options jump `120 → 152`). The
setting is `152` so the Theme Editor preview stays close, and the real value
comes from the token override below.

Horizon also auto-generates the clamp *minimum* from the next smaller
configured size, which does not match the prototype either:

| | Horizon would produce | Prototype wants |
|---|---|---|
| `h1` | `clamp(72px, …, 152px)` | `clamp(64px, 8vw, 144px)` |
| `h2` | `clamp(36px, …, 72px)` | `clamp(38.4px, 5vw, 72px)` |

Both are pinned exactly in `assets/jci-base.css`:

```css
:root {
  --jci-hero-title-size:    clamp(4rem, 6.5vw, 9rem);      /* 64 → 144 */
  --jci-section-title-size: clamp(2.4rem, 5vw, 4.5rem);  /* 38.4 → 72 */
  --font-h1--size: var(--jci-hero-title-size);
  --font-h2--size: var(--jci-section-title-size);
}
```

> Confirm the token name Horizon emits for each preset before relying on it;
> if it differs, set the size on `.jci-*-title` classes instead.

### Values Horizon's dropdowns cannot express

**Void.** This section used to pin the prototype's hero/section leading and
tracking onto Horizon's tokens. Per §0 those values are no longer authored at
all — `--line-height--display-tight`, `--letter-spacing--heading-tight` and
`--line-height--body-loose` keep their Horizon defaults, and no section
re-declares them.

The prototype's `.84` / `.92` leading and `-.04em` / `-.055em` tracking are
recorded in the size table above for reference only. They are not implemented.

### Eyebrow / label utility

Used everywhere. Define once, never re-declare:

```css
.jci-eyebrow {
  font-family: var(--jci-font-label);
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
}
```

No `letter-spacing`, and no `font:` shorthand — the shorthand would carry the
prototype's `1.2` leading. See §0.

---

## 4. Buttons

Prototype `.button`:

```css
min-height: 46px;
padding: .9rem 1.35rem;      /* 14.4px 21.6px */
border: 1px solid var(--ink);
font: 10px/1 var(--mono);    /* size + family cloned, the `/1` leading is not */
letter-spacing: .13em;       /* not cloned — §0 */
text-transform: uppercase;
border-radius: 0;            /* sharp corners */
```

### Settings changes

| Setting | Horizon now | Set to | Reason |
|---|---|---|---|
| `button_border_radius_primary` | `14` | `0` | Sharp corners |
| `primary_button_border_width` | `0` | `1` | 1px border on hover-out |
| `button_text_case_primary` | — | `uppercase` | |
| `button_border_radius_secondary` | `14` | `0` | |
| `secondary_button_border_width` | `1` | `1` | already correct |
| `button_text_case_secondary` | — | `uppercase` | |
| `pills_border_radius` | `40` | `0` | |

Colours already bind correctly and need no change:

```json
"palette_primary_button_background": "{{ settings.color_palette.foreground }}",
"palette_primary_button_text":       "{{ settings.color_palette.background }}",
"palette_primary_button_border":     "{{ settings.color_palette.foreground }}",
"palette_secondary_button_background": "rgba(0,0,0,0)",
"palette_secondary_button_text":     "{{ settings.color_palette.foreground }}",
"palette_secondary_button_border":   "{{ settings.color_palette.foreground }}"
```

### Button font

`type_font_button_primary` only offers `body` / `accent` — neither is DM Mono.
Override the token in `assets/jci-base.css`:

```css
:root {
  --button-font-family-primary:   var(--jci-font-label);
  --button-font-family-secondary: var(--jci-font-label);
  --jci-button-min-height: 46px;
  --jci-button-padding:    0.9rem 1.35rem;
  --jci-button-size:       10px;
}
```

`--jci-button-tracking` is gone with the rest of the tracking (§0).

### Three variants

| Prototype | Horizon equivalent |
|---|---|
| `.button` (ink bg, paper text) | primary |
| `.button-outline` (transparent, ink border) | secondary |
| `.button-light` (paper bg, ink text) | secondary + `jci-button-light` modifier for dark sections |

---

## 5. Layout & spacing

### Content width

Prototype `--content-max` is **1600px** (`100rem`). Horizon's presets:
`narrow` 90rem / `normal` 120rem / `wide` 150rem — none match.

Keep `"page_width": "narrow"` and retune the token:

```css
:root {
  --narrow-page-width: 100rem;   /* 1600px */
  --jci-content-max:   var(--narrow-page-width);
}
```

### The page column

The prototype wraps the whole page in `#app` (`styles.css:32`):

```css
#app { width: min(100%, var(--content-max)); margin-inline: auto; }
```

That is not just a content measure — it caps **every section's background too**.
Past 1600px the dark hero, the cream chapter and the olive quote all stop at
1600px with paper down both sides. A theme that only caps the inner container
looks identical up to 1600px and wrong on every screen wider than that.

Reproduced on `main` and the footer:

```css
.jci-page {
  width: min(100%, var(--jci-content-max));
  margin-inline: auto;
}
```

`layout/theme.liquid` puts `jci-page` on `<main class="content-for-layout">`
and on `<footer>`. The announcement bar and header sit outside it and stay
full-bleed, as they do in the prototype.

### Page padding

```css
:root {
  --jci-page-pad:         clamp(1.25rem, 4vw, 4.25rem);
  --jci-editorial-gutter: calc(var(--jci-page-pad) + clamp(0rem, 4vw, 4rem));
}
```

### Section vertical rhythm

Prototype `.section` = `clamp(4.5rem, 9vw, 8.5rem)`. Standardise on three steps:

```css
:root {
  --jci-section-pad-sm: clamp(3rem, 6vw, 5.5rem);
  --jci-section-pad:    clamp(4.5rem, 9vw, 8.5rem);
  --jci-section-pad-lg: clamp(4.5rem, 8vw, 8rem);
}
.jci-section { padding-block: var(--jci-section-pad); }
```

These three remain the defaults a new section starts from. Since sections must
be tunable without touching code, each one also exposes **Padding top**,
**Padding bottom** and their mobile counterparts as `range` settings, seeded
with the prototype's values (100px desktop, 50px mobile). The token is the
starting point; the setting is what ships.

### Full-bleed breakout

**Exactly three sections break out of the page column**, and the prototype
names them: `.home-hero` and the `.marquee-band` under it (`styles.css:125`),
and `.newsletter-section` (`:413`). Nothing else on any page is full-bleed.

```css
.jci-hero {
  width: 100vw;
  margin-left: calc(50% - 50vw);
}
```

So: `jci-hero`, `jci-marquee`, `jci-newsletter` — and no others. A fourth
section wanting to "go full width" is a design change, not a clone.

A section that only needs to fill the column edge to edge uses the column, not
the viewport — past 1600px `100vw` escapes the page:

```css
--jci-container-width:  var(--jci-page-column);
--jci-container-offset: calc(50% - var(--jci-page-column) / 2);
```

`jci-product`'s mobile gallery also uses `100vw`, matching `.product-gallery`
at `:1701`, which is likewise inside a media query.

> The prototype clips the horizontal axis on `html, body` (`:30-31`). That clip
> is **not** copied — it cuts the product gallery's captions. See the note in
> `sections/jci-product.liquid`.

### Breakpoints

Two only, matching the prototype. Do not introduce a third.

```css
@media (max-width: 900px) { /* tablet */ }
@media (max-width: 680px) { /* mobile */ }
```

### Motion

```css
:root { --jci-ease: cubic-bezier(.22, .61, .36, 1); }
@media (prefers-reduced-motion: reduce) { /* disable all transitions/autoplay */ }
```

---

## 6. Global corner-radius reset

The prototype has **zero rounded corners** except colour swatches. Horizon
ships rounded defaults everywhere, so every radius setting must be zeroed:

```json
"badge_corner_radius":           0,
"button_border_radius_primary":  0,
"button_border_radius_secondary":0,
"pills_border_radius":           0,
"inputs_border_radius":          0,
"popover_border_radius":         0,
"card_corner_radius":            0,
"product_corner_radius":         0,
"variant_button_radius":         0,
"cart_thumbnail_border_radius":  0
```

**Exception — colour swatches stay circular** (`border-radius: 50%` in the
prototype, 25px on the product page):

```json
"variant_swatch_radius": 100,
"variant_swatch_width":  26,
"variant_swatch_height": 26,
"variant_swatch_border_style": "solid",
"variant_swatch_border_width": 1,
"variant_swatch_border_opacity": 25
```

Other border widths:

```json
"input_border_width":         1,
"popover_border_width":       1,
"variant_button_border_width":1,
"badge_font_family":          "subheading",
"badge_text_transform":       "uppercase"
```

---

## 7. What is NOT allowed

| ✗ Don't | ✓ Do |
|---|---|
| Hex value inside a section's CSS | `var(--color-foreground)` / palette reference |
| `font-family: "Playfair Display"` in a section | `var(--font-heading--family)` |
| A new clamp for section padding | One of the three `--jci-section-pad-*` steps |
| A 4th font family | The 3 approved families only |
| A colour not in the palette | Opacity step off an existing palette colour |
| Restyling `.button` globally | `jci-*` scoped modifier |
| A third breakpoint | 900px / 680px only |
| A class without the `jci-` prefix | `jci-` on every authored element |
| `.jci-hero-container h1 { }` | `.jci-hero-title { }` |
| `:nth-child`, `>` chains for styling | One class, one rule |
| "Improving" the prototype unasked | Clone it, report the issue, wait (§0) |
| Silently copying a prototype bug | Report it, then apply the decision (§0) |
| Rounding a prototype value | Exact value from `styles.css` |
| `letter-spacing:` anywhere | Omit the property — normal tracking (§0) |
| `line-height:` anywhere | Omit the property — normal leading (§0) |
| `font: 500 14px/1.2 …` shorthand | `font-size` + `font-weight` separately, no leading |
| Retuning `--line-height--*` / `--letter-spacing--*` | Leave Horizon's defaults alone |
| Copying the first matching rule in `styles.css` | Copy the value that wins the cascade (§0) |
| Editing `settings_data.json` by hand for values the editor owns | Change in Theme Editor, then `shopify theme pull` |
| Desktop now, responsive in a later pass | Both breakpoints in the same pass (§0) |
| A `jci-*` section no template renders | Place it in its template before calling it done (§0) |
| Marking a section done before it is checked at 900px and 680px | All five conditions in §0, or it is not done |
| A per-section container width, padding, heading or body size | The shared token — one container, one rhythm, one type scale (§0) |
| Cloning the mockup's per-page measure or heading size | Clone everything else 1:1; these four come from one place (§0) |

---

## 8. Build order

| # | Step | Status |
|---|---|---|
| 1 | `git init` + clean Horizon baseline | done |
| 2 | `assets/jci-base.css` + `snippets/jci-tokens.liquid` | done |
| 3 | `config/settings_data.json` — palette, typography, buttons, radii (§2, §3, §4, §6) | done |
| 4 | `sections/jci-announcement-bar.liquid` | done |
| 5 | `sections/jci-header.liquid` — own section, 44 settings; Horizon's `header.liquid` left untouched | done |
| 6 | Homepage sections, in prototype order | in progress |
| 6a | `sections/jci-hero.liquid` — three moments, video per moment | done |
| 6b | `sections/jci-marquee.liquid` — phrase blocks | done |
| 6c | `sections/jci-story.liquid` — copy + tilted film, all strings as settings | done |
| 6d | `sections/jci-product-section.liquid` + `snippets/jci-product-card.liquid` | done |
| 6e | `sections/jci-editorial-banner.liquid` — slide blocks, crossfade carousel | done |
| 6f | `sections/jci-home-faq.liquid` — question blocks, accordion + side card | done |
| 6g | `sections/jci-newsletter.liquid` — Shopify customer form, ink panel | done |
| 6h | `sections/jci-best-sellers.liquid` — piece blocks, scroll-dealt card stack | done |
| 6i | `sections/jci-testimonials.liquid` — quote blocks, drag rail | done |
| 6j | `sections/jci-social-media.liquid` — film card blocks, drifting drag band | done |
| 7 | Verify in Theme Editor that every value round-trips | pending |
| 8 | `sections/jci-footer.liquid` — menu-backed link columns, journal sign-off | done |
| 9 | Product + collection templates | not started |
| 10 | Content pages | in progress — see below |
| 10a | FAQ page — `jci-faq-hero`, `jci-faq`, `jci-faq-assurance` | done |
| 10b | Contact page — `jci-contact-hero`, `jci-contact` | done |
| 10c | Story page | not started |
| 10d | Journal page — `jci-journal-hero` done; note index and cards still to build | in progress |
| 10e | Shipping & returns page | not started |
| 10f | Size guide page | not started |
| 11 | `sections/header.liquid` — Horizon's header carrying the prototype's design | done |

### Where the build stands

**Homepage — done.** `templates/index.json` renders all ten sections in
prototype order: hero, marquee, story, product section, editorial banner, best
sellers, testimonials, home FAQ, social media, newsletter.

**Header — done, and it is Horizon's own section.** `jci-header` was replaced
by `sections/header.liquid` customised in place: the prototype's three action
icons and labels, nav links with the rust dot and underline wipe, the scroll
shrink (86 → 72px, logo 78 → 64px) and the frosted background all live in
Horizon's classes. `sections/jci-header.liquid` stays on disk, disabled, as a
fallback. The cart drawer overlays the page instead of pushing it.

**FAQ page — done.** `templates/page.faq.json` renders the hero, the question
groups with search and topic nav, and the assurance cards. Horizon's
`main-page` is switched off.

**Contact page — done.** `templates/page.contact.json` renders the hero and the
details/form section. The form is Shopify's own `{% form 'contact' %}`, so
messages reach the shop inbox.

**Not started:** product and collection templates (step 9), and the story,
journal, shipping and size-guide pages. Those four page templates exist and
return 200, but still render Horizon's stock `main-page`.

**Shared behaviour:** `assets/jci-tilt.js` carries the pointer tilt for both
the FAQ hero film and the contact feature — one file, two sections.


**Status in this table follows §0.** `done` means all five conditions are
met — including that a template actually renders the section. A section whose
file is complete but which no template renders is `built, not placed`, and the
remaining work is to place it, not to write it.

### Video

Because the build runs on the client store, a Shopify **Files** upload is the
default path for every clip: no size cap, CDN-served, nothing to re-encode.
Every section that carries a clip still accepts an `assets/` filename as a
fallback, and the Files upload wins when both are set.

Anything that does land in `assets/` is capped at **20 MB per file**, so the
prototype's 4K/1440p clips are re-encoded first: H.264, capped at 1920px wide,
CRF 30, audio stripped, `+faststart`. The four homepage clips go
76 MB → 17.7 MB.

Steps 2–3 come before any section work. Sections are written against tokens
that must already exist.

Run `shopify theme check` after every step. It must stay at zero offenses.
