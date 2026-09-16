# Maison Cavallé — full-site QA

**Date:** 16 September 2026
**Scope:** every `jci-*` section and snippet, every template, the layout and
the shared CSS, checked against `MAISON-CAVALLE-SPEC.md` and the prototype at
`~/Downloads/maison-cavalle-main`.

**Nothing in this report has been fixed.** It is a findings list only.

| | |
|---|---|
| Sections | 33 `jci-*` |
| Snippets | 9 `jci-*` |
| Templates | 17 |
| Authored Liquid | ~19,900 lines |
| `shopify theme check` | **0 errors, 8 warnings** |

---

## Verdict

The build is in good shape. There are **no errors**, no broken schemas, and the
layout architecture now matches the prototype exactly. Everything below is
either a small cleanup, a documentation gap, or a decision waiting on you.

Nothing here blocks a launch except **§1.1 (git hygiene)**, which should be
done before the next commit.

---

## 1. Blocking

### 1.1 No `.gitignore`, and junk is tracked

| | |
|---|---|
| `.gitignore` | **missing** |
| Tracked `.DS_Store` | **3** (root, `shopify-import/`, `shopify-import/images/`) |
| Tracked `.mp4` | **18** |
| `.git` size | **108 MB** (`assets/` alone is 50 MB) |

The video files are the bulk of it — `jci-hero-everyday.mp4` is 8.5 MB on its
own. The spec's own §Video note says a Shopify **Files** upload is the default
path for clips, precisely so they do not travel in the repo. Once committed
they stay in history forever; every clone pays for them.

**Suggested:** add a `.gitignore` (`.DS_Store`, `.shopify/`), untrack the three
`.DS_Store` files, and decide whether the clips belong in `assets/` at all.

---

## 2. Rule violations

Checked against the spec's hard bans. **Three findings, all small.**

### 2.1 `line-height: normal` in the testimonials section

`sections/jci-testimonials.liquid:168`

§0 names this exact case:

> *normal* means **the declaration is absent from our CSS**, not written out as
> `normal`.

Deleting the line changes **nothing** visually — the computed value is
identical. It is the only remaining `line-height` outside the six approved
hero titles.

### 2.2 Four hardcoded hex values in CSS

| File | Line (in the stylesheet block) | Value |
|---|---|---|
| `jci-hero.liquid` | 169 | `#e1e0d7` |
| `jci-hero.liquid` | 385 | `#dce2c7` |
| `jci-collection-hero.liquid` | 99 | `#252a25` |
| `jci-contact.liquid` | 338 | `#f7f7f7` |

§7 requires a palette reference or an opacity step off one. Two of these
(`#dce2c7`, `#252a25`) carry a comment explaining the derivation, so the intent
is known — they just were not converted. `jci-contact.liquid:338` also has a
stray double space in its indentation.

> Every *other* hex in the theme (~18 of them) sits in a comment documenting a
> derivation, e.g. `/* #757a6d is ink at 60% on paper. */`. That is good
> practice and is **not** counted as a violation.

### 2.3 Bare tag selectors — 17 places

§1: *"No bare tag styling. If it has a style, it has a `jci-` class."*

| File | Count | Examples |
|---|---|---|
| `jci-hero.liquid` | 9 | `.jci-hero-moment-line i`, `.jci-hero-cta span`, `.jci-hero-fit-card-link b` |
| `jci-header.liquid` | 6 | `.jci-header-icon-button svg`, `.jci-header-menu-icon i` |
| `jci-story-heritage.liquid` | 2 | `.jci-story-heritage-text p` |

`jci-story-heritage`'s two are the least avoidable — the text comes from a
richtext setting, so the `<p>` has no class to give it. The other 15 are
authored markup and could carry a class.

### 2.4 One real `:nth-child`

`sections/jci-review-carousel.liquid:256` —
`.junip-review-carousel-item:nth-child(odd):not(:first-child)`.

This styles **Junip's** markup, which we do not author and cannot add classes
to, so the ban does not really apply. Worth a one-line note in the file so it
does not read as an oversight. Every other `nth-child` hit in the codebase is
in a comment explaining why it was *avoided*.

---

## 3. Clean — verified, no action

| Check | Result |
|---|---|
| Schema JSON valid | **33/33 sections** |
| Range settings vs the four server rules | **307 ranges, 0 failing** |
| `letter-spacing` anywhere | **none** ✓ |
| `font:` shorthand carrying leading | **none** ✓ (only `font: inherit` on a form reset) |
| Container overrides | **none** — every section uses the shared container ✓ |
| Breakpoints | **900 / 680 only** across all sections ✓ |
| Upload beats asset filename | **all 16 pairs correct** ✓ |
| `<img>` without `alt` | **0 of 27** ✓ |
| Full-bleed sections | `jci-hero`, `jci-marquee`, `jci-newsletter` — matches the prototype exactly ✓ |

> `jci-product.liquid` also uses `100vw`, but inside `@media (max-width: 680px)`
> for the mobile gallery, mirroring the prototype's `.product-gallery` at
> `styles.css:1701`. Correct.

### Layout architecture — confirmed against the prototype

Measured in a browser at a 2560px viewport, both sides:

| | Prototype | This theme |
|---|---|---|
| Page column | `#app` → L=480 R=2080 **w=1600** | `.jci-page` → L=480 R=2080 **w=1600** |
| Content | 1464px, 68px gutter | 1464px, 68px gutter |
| `--content-max` | 1600px | 1600px |
| `--page-pad` | `clamp(1.25rem, 4vw, 4.25rem)` | identical |

Section **backgrounds** cap at 1600px on both, which is the part that only
shows above a 1600px screen.

---

## 4. Consistency gaps

### 4.1 Page hero padding is the odd one out

Every content section ships **100 / 100**. Every page hero ships **76 / 100**.

```
collection    hero 100/100 · grid 100/100 · best-sellers 100/100 · note 100/100 · newsletter 96/96
index         story 100/100 · products 100/100 · faq 100/100 · social 100/100 · newsletter 96/96
contact       hero  76/100 · contact 100/100
faq           hero 100/100 · faq 100/100 · assurance 100/100
journal       hero  76/100 · index 100/100 · quote 100/100
our-story     hero  76/100 · chapter 100/0 · heritage 100/0 · chapter 100/100 · quote 100/100
size-guide    hero  76/100 · guide 100/100 · help 0/0
product       product 56/100 · reviews 100/100 · related 100/100 · newsletter 96/96
```

Three further one-offs: `newsletter` 96/96 everywhere, `review-carousel`
100/**0**, and on our-story `chapter`/`heritage` now ship **100/0**.

You said you would handle the heroes yourself, so this is recorded, not
flagged. The FAQ hero at 100/100 is the only hero that does *not* follow the
76/100 pattern — worth a look either way.

### 4.2 Four page heroes are near-duplicates

`jci-story-hero`, `jci-contact-hero`, `jci-size-guide-hero`, `jci-journal-hero`
are the same component with a handful of tuned values. The prototype does this
with **one** `.journal-hero` base plus a per-page modifier class.

Already written into the spec as *"One component per job"*: no fifth hero gets
added, and the four should fold into a single `jci-page-hero` when there is
room to test all four pages together.

### 4.3 Small-label type has four sizes

`10px` (the `.jci-eyebrow` utility), `11px`, `12px` (most), `14px`. The spec's
"one type scale" rule covers container, section padding, heading and body — not
labels — so this is not a violation, but four sizes for one role is drift.

### 4.4 Two sections exceed Shopify's settings limit

| Section | Settings | Limit |
|---|---|---|
| `jci-story` | **53** | 40 |
| `jci-header` | **42** | 40 |

These are 2 of the 8 theme-check warnings. It is a warning, not an error — the
sections upload and work. The spec says *"It must stay at zero offenses"*, so
either split the schemas with headers or amend that line.

> The other 6 warnings: `sections/header.liquid` (same count issue) and 5
> `UnusedDocParam` in `snippets/divider.liquid` — both Horizon files, not ours.

---

## 5. Unfinished work

### 5.1 `jci-testimonials` is built but never renders

`templates/index.json` has it with `"disabled": true`. The prototype's homepage
**does** have a testimonials section (measured: 120/120 padding).

It looks deliberately replaced by the Junip review carousel. If so, fine — but
a complete, disabled section is worth either re-enabling or deleting, because
right now it reads as an accident. §0: *"a `jci-*` section no template renders
has not shipped."*

### 5.2 Shipping & returns page

`templates/page.shipping.json` and `templates/page.returns.json` do **not
exist**. The prototype has a `#shipping` route. Spec §8 step 10e is still
`not started`.

### 5.3 Third-party dependency is undocumented

Junip app blocks are hardcoded into `templates/index.json` and
`templates/product.json`:

```
shopify://apps/junip/blocks/junip-product-review/dc14f5a8-…
```

That UUID is store-specific. The spec does not mention Junip at all. If the app
is ever uninstalled, or the theme is moved to another store, those blocks break
with nothing to explain why.

**Suggested:** a short §9 in the spec — what Junip provides, which blocks use
it, what the fallback is.

### 5.4 Five sections have no padding settings

`jci-announcement-bar`, `jci-editorial-banner`, `jci-header`, `jci-hero`,
`jci-marquee`.

§5 says every section exposes Padding top / bottom so it is tunable without
touching code. For the header and announcement bar that is arguably fine. For
`jci-editorial-banner` it is a gap.

---

## 6. Repository state

- **3 files uncommitted** at the time of this report.
- Commit messages: 51 of ~82 use a `feat:` prefix, the rest none — and `feat:`
  is applied to pure-styling and fix commits too. Several messages are generic
  enough to be uninformative (`"Refactor code structure for improved
  readability and maintainability"`, twice, once across 13 files).
- Commit bodies are rare, but the ones that exist are genuinely good — bulleted
  and explaining *why*. Worth making that the standard.

---

## Suggested order

| | Item | Effort |
|---|---|---|
| 1 | `.gitignore` + untrack `.DS_Store` (§1.1) | 2 min |
| 2 | Delete `line-height: normal` (§2.1) | 1 min, zero visual change |
| 3 | Convert 4 hardcoded hex to palette steps (§2.2) | 15 min |
| 4 | Decide on `jci-testimonials` — enable or delete (§5.1) | decision |
| 5 | Document Junip in the spec (§5.3) | 20 min |
| 6 | Shipping & returns page (§5.2) | a build |
| 7 | Bare tag selectors (§2.3) | 30 min, cosmetic |
| 8 | Fold the four page heroes into one (§4.2) | a refactor, needs testing |

---

## How this was checked

- `shopify theme check` across 405 files.
- Every section's schema parsed and its `range` settings validated against the
  four server rules (step divisible by 0.1, unit ≤ 3 chars, 3–101 steps,
  default on the step grid).
- CSS scanned per section for `letter-spacing`, `line-height`, the `font:`
  shorthand, hardcoded hex, `nth-child`, bare tag selectors, and breakpoints.
- Every template parsed for section order, `disabled` flags and padding values.
- The prototype served locally and measured in headless Chrome at 1600px and
  2560px viewports, comparing section boxes and content widths against the same
  measurements taken from this theme.

**Not covered:** the theme was not rendered on the live store, so this checks
the code and the geometry, not the running site. Visual confirmation at all
three breakpoints exists only for the sections built in this session
(`jci-story-chapter`, `jci-journal-hero`, `jci-journal-index`). A pass with
`shopify theme dev` would close that gap.
