# Maison Cavalle typography consistency audit

**Date:** 2026-09-16  
**Scope:** all theme template types in `templates/`, their active Maison Cavalle sections, shared typography tokens, and the loaded CSS cascade. No theme code was changed during this audit.

## Verdict

| Item | Result | Finding |
| --- | --- | --- |
| Main titles | PASS | Hero, section and product title systems are internally consistent. |
| Text above a main title (eyebrow / kicker) | FAIL for a 12px rule | The shared default is 14px; only two active reference locations render at 12px, and their font weight is not identical. |
| Font family and title weight | PASS | Maison titles use the display family and weight 500 consistently in their primary tiers. |
| All page/template coverage | PASS (source audit) | All template types and their active custom sections were inspected. |

## Main title system - OK

The central title hierarchy is already in good shape:

- **Hero title:** `--jci-hero-title-size` = `clamp(4rem, 6.5vw, 9rem)` on desktop, using Playfair Display / `--jci-font-display`, weight `500`.
- **Section title:** `--jci-section-title-size` = `clamp(2.4rem, 5vw, 4.5rem)`, same display family and weight `500`.
- **Product title:** has its intentionally separate product scale, while retaining the same display family and weight `500`.
- Responsive tokens reduce hero and section titles together at 900px and 680px, so this remains consistent on tablet and mobile.

Evidence: `assets/jci-base.css` defines the shared sizes and `config/settings_data.json` sets Playfair Display n5 as the heading face. The active hero and section components consume these same tokens rather than re-declaring different main-title rules.

The smaller titles found in cards, featured panels, quote blocks and form areas are secondary content levels, not primary section titles. They should remain separate; forcing them to the main section-title size would break hierarchy.

## The 12px eyebrow rule - not yet consistent

The requested rule is: **the primary text immediately above a main title should be 12px and should share the same label family, style, weight and uppercase treatment.**

Current shared rule:

- `.jci-eyebrow` is **14px**, Work Sans subheading family, weight `500`, uppercase (`assets/jci-base.css:122`).
- Most primary eyebrow text uses that class directly, so it currently renders at 14px.

The two existing 12px candidates are not a fully matching reference pair:

| Reference location | Current size | Family | Weight | Treatment | Match status |
| --- | ---: | --- | ---: | --- | --- |
| Story page - “Chapter 02 · The name” | 12px | shared label family | 500, inherited from `.jci-eyebrow` | uppercase | Correct candidate |
| Product page - “Reviews” | 12px | label family | 400, inherited from body | uppercase with rule | Size matches, but weight differs |

So, the two sections do **not** currently use exactly the same font-size + weight style. The story eyebrow is the closer reference for a 12px / medium primary label.

## Pages currently affected by the 14px default

These primary title-above labels currently inherit the 14px shared eyebrow rule:

| Page/template | Affected active sections |
| --- | --- |
| Home | Hero, Story, Product section, Home FAQ, Editorial banner, Best sellers, Testimonials, Review carousel, Social media, Newsletter |
| Collection | Collection hero, Best sellers, Collection note, Newsletter |
| Product | Product title, Related product section, Newsletter |
| Our story | Story hero, Chapter 01, Chapter 03 |
| FAQ | FAQ hero, FAQ, FAQ assurance |
| Size guide | Size guide hero, Size guide, Size help |
| Contact | Contact hero, Contact section, Contact form card |

This scope excludes supporting metadata such as product-card labels, table headers, navigation labels, captions and quote attributions. They are not text directly above a primary section title, and should keep their own hierarchy.

## Recommended implementation direction (not applied)

1. Make `.jci-eyebrow` the single primary-label source of truth at **12px**, label family, **weight 500**, uppercase.
2. Change the Home Story custom `.jci-story-kicker` from 14px to the same shared 12px rule, because it is also immediately above that section's main title but bypasses `.jci-eyebrow`.
3. Give `.jci-product-reviews-kicker` explicit `font-weight: 500` (or use the common eyebrow class) so the two 12px reference sections actually match.
4. Keep the existing main-title tokens as they are. No title-size or title-weight normalization is required.
5. After applying, inspect desktop, tablet and mobile on Home, Collection, Product, Our story, FAQ, Size guide and Contact. The global change will cover the other templates automatically.

## Audit coverage and validation

- Inspected template types: Home, collection, product, product quick-add, FAQ, contact, size guide, our story, journal/general page, blog, article, cart, search, collection list, 404, password and gift card.
- `shopify theme check` completed across 402 files: **0 errors**, 8 pre-existing warnings. The warnings are schema documentation/settings-count warnings and do not concern typography or rendering.
- The provided localhost preview was not reachable from this audit environment, so the conclusion is a complete source-and-cascade audit rather than a pixel screenshot comparison.

## Key source references

- `assets/jci-base.css:52` - shared hero and section title tokens.
- `assets/jci-base.css:122` - shared eyebrow is currently 14px / 500 / uppercase.
- `sections/jci-story-heritage.liquid:245` - 12px Story eyebrow reference.
- `sections/jci-product-reviews.liquid:118` - 12px Reviews kicker, currently without explicit 500 weight.
- `sections/jci-story.liquid:304` - Home Story's standalone 14px kicker which must be included in a full 12px rollout.
