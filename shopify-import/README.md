# Maison Cavallé — demo product import

Demo catalogue for the Shopify store, built from the prototype catalogue in
`maison-cavalle-main/app.js` so the storefront matches the mockup exactly.

- **17 products** — the 15 in the mockup collection grid, plus Deluxe Grooming
  Kit and The Groomi Horse Shedder, which the grid's category filter hides.
- **144 variants** — `Color` × `Size`, using each colourway's own size run.
- **93 images** — the theme's `jci-*.webp` files, collected in `images/`.

## Files

| File | What it is |
|---|---|
| `maison-cavalle-products.csv` | The Shopify product import file. |
| `images/` | Every image the CSV references, ready to bulk-upload. |
| `make-products-csv.js` | Regenerates the CSV. |
| `catalog-data.js` | Product data lifted from the prototype's `app.js`. |

## How to import

The images are already uploaded to **Content → Files** on
`maison-cavalle-2.myshopify.com`, and the CSV already points at them:

```
https://maison-cavalle-2.myshopify.com/cdn/shop/files/jci-msfc003-front.webp
```

All 93 URLs were checked and return `200`, so the file is ready as it is.

### 1. Create the two metafield definitions first

**The import silently drops metafield columns when no definition exists.** This
is what made the colour swatches and subtitles come through empty: the values
were in the file, but the store had nowhere to put them.

Shopify admin → **Settings → Custom data → Products → Add definition**:

| Name | Namespace and key | Type |
|---|---|---|
| Subtitle | `custom.subtitle` | Single line text |
| Colour swatches | `custom.colour_swatches` | Single line text |

The namespace and key must match exactly — the CSV column headers are
`Subtitle (product.metafields.custom.subtitle)` and
`Colour swatches (product.metafields.custom.colour_swatches)`, which is the
header format Shopify's own product export uses.

### 2. Import

Shopify admin → **Products → Import** → upload
`maison-cavalle-products.csv`. Leave *Overwrite products with the same handle*
on if you are re-running the import.

### Regenerating against a different store

```sh
node make-products-csv.js "https://YOUR-STORE.myshopify.com/cdn/shop/files" maison-cavalle-products.csv
```

Regenerating overwrites the file, so any hand-edits in the CSV are lost. The
generator writes `Color` as the option name and prices to two decimals; edit
`catalog-data.js` or the generator rather than the CSV if a change needs to
survive.

Upload `images/` to that store's Files first, so every filename resolves.

## After the import

- **Colour swatches.** The CSV cannot carry a native Shopify swatch, so each
  colour's hex is parked in the `custom.colour_swatches` metafield
  (`Pink:#d49ca3 | Navy:#1f2d49`). `snippets/jci-product-card.liquid` reads the
  native option-value swatch first and falls back to this metafield, so the
  cards render as soon as the definition above exists and the import has run.

  The fallback only dresses our own cards. Shopify's own variant picker and
  collection filters still show plain text buttons until real swatches exist —
  set those under **Settings → Custom data → Metaobjects → Color**, or link the
  colour option to the Shopify taxonomy. Doing that needs no theme change: the
  card prefers a native swatch wherever it finds one.

  The option name is matched case-insensitively, so `color` and `Color` both
  work against the section's *Swatch option name*
  (`sections/jci-product-section.liquid`).
- **Subtitle.** The mockup's line under the title ("Long-sleeve technical jersey ·
  Five colourways") ships as the `custom.subtitle` metafield, which is the
  section's default *Subtitle metafield*. It is also written to the product Type
  as a fallback.
- **Badge.** The mockup's "New" badge is a section setting, not product data —
  set *Show badge* to `always` with badge text `New`.
- **Collections.** Products are tagged (`Base Layers`, `Tights`, `Kids`,
  `Accessories`, `Women`, `New` …) so automated collections can be built from
  tags without touching the products again.

## Invented data

The prototype supplied names, prices, subtitles, descriptions, colourways,
size runs, images and — where the packing list existed — real stock counts.
Everything else is written for the demo: fabric composition, feature bullets,
care instructions, SKUs, weights, Google Shopping category, SEO title and
description, and a flat 25-unit stock level for variants with no packing-list
figure.
