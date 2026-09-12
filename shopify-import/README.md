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

Shopify admin → **Products → Import** → upload
`maison-cavalle-products.csv`. Leave *Overwrite products with the same handle*
on if you are re-running the import.

### Regenerating against a different store

```sh
node make-products-csv.js "https://YOUR-STORE.myshopify.com/cdn/shop/files" maison-cavalle-products.csv
```

Upload `images/` to that store's Files first, so every filename resolves.

## After the import

- **Colour swatches.** The CSV cannot carry hex values, so each colour's hex is
  parked in the `custom.colour_swatches` metafield (`Pink:#d49ca3 | Navy:#1f2d49`).
  Set the real swatches under **Settings → Custom data → Metaobjects → Color**,
  or link the `Color` option to the Shopify taxonomy so swatches come through
  automatically. The product card reads swatches from the option named `Color`
  (`sections/jci-product-section.liquid` → *Swatch option name*).
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
