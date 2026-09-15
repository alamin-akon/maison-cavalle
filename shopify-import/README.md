# Maison Cavallé — product import

The store's product file, built from the client's packing list
(`Packing Listing 2026.8.26.pdf`) and dressed with the mockup's product details.

- **7 products, 518 units** — exactly what the packing list ships, across 5
  cartons. Colours and sizes are the packing list's; a colour packed in two
  cartons is summed into one set of variants.
- **Name, price, description, subtitle and photos come from the mockup**
  (`maison-cavalle-main/app.js`), matched by comparing each packing-list photo
  with the mockup's product photos.
- **36 images** — the mockup photos already uploaded to Content → Files.

The mockup's other products (Active Turtleneck Top, Lux Jacket, Pro-Skin and
Kids tights, Kids / Elite / AirFlex base layers, gloves, Crest Cap, Deluxe
Grooming Kit, Groomi Horse Shedder) are not in the packing list, so they are no
longer in the file. Importing does not delete them from the store.

## Files

| File | What it is |
|---|---|
| `maison-cavalle-products.csv` | The Shopify product import file. |
| `packing-list-data.js` | The packing list: products, colours, sizes, stock, and which mockup photo shows each colour. |
| `catalog-data.js` | Product data lifted from the prototype's `app.js`. |
| `make-products-csv.js` | Regenerates the CSV from the two data files. |

## Missing from the mockup

| Packed item | What is missing |
|---|---|
| **MSFD008 colour-block short sleeve** (carton 4 — white shoulders and sleeves, contrast chest panel; Navy, Light Blue, Black, White; 41 units) | The whole product. The packing list uses MSFD008 for two different shirts; the solid one matches the mockup's MSFD008, this one has no mockup product or photos. It is imported as its own product, **Colour Block Short Sleeve Show Shirt**, with written details, a $129 price and no images, as a **draft** so it stays off the storefront until photos are added. SKUs are `MSFD008-CB-…`. |

These colours have no photo of their own in the mockup, so their variant image
is the studio flat-lay that shows every colourway:

| Product | Colours shown only in the studio flat-lay |
|---|---|
| MSFC003 Classic Long Sleeve Base Layer | Navy, Black |
| MSFWX008 Sleeveless High Neck Riding Shirt | White, Burgundy |
| MSFD003 Soft Collar Riding Polo | Navy Blue, White, Black |
| MSFD008 Contour Short Sleeve Riding Top | Black, White |
| MSFC009 Bib Front Long Sleeve Riding Top | Light Blue, Black, White |

## How to import

The images are already uploaded to **Content → Files** on
`maison-cavalle-2.myshopify.com`, and the CSV already points at them:

```
https://maison-cavalle-2.myshopify.com/cdn/shop/files/jci-msfc003-front.webp
```

All 36 URLs were checked and return `200`, so the file is ready as it is.

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
- **Collections.** Products are tagged (`Tops`, `Base Layers`, `Women`,
  `Short Sleeve`, `Long Sleeve`, `New` …) so automated collections can be built from
  tags without touching the products again.

## Invented data

The packing list supplied item numbers, colours, sizes and stock. The mockup
supplied names, prices, subtitles, descriptions and photos. Everything else is
written for the store: fabric composition, feature bullets, care instructions,
SKUs, weights, Google Shopping category, SEO title and description — and, for
the MSFD008 colour-block shirt, its name, price, subtitle and description too.
