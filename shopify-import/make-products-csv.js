const fs = require('fs');
const path = require('path');
const { products } = require('./catalog-data.js');
const { packingList } = require('./packing-list-data.js');

const IMAGE_BASE = (process.argv[2] || '__IMAGE_BASE__').replace(/\/+$/, '');
const VENDOR = 'Maison Cavallé';

// The packing list decides which products are imported, in its order, with
// its colours, sizes and stock (packing-list-data.js). Everything else about a
// product comes from the mockup (catalog-data.js) or, for the one packed item
// the mockup does not have, from NEW_PRODUCTS below.
const ORDER = packingList.map((entry) => entry.id);

const TOPS_CAT = 'Apparel & Accessories > Clothing > Shirts & Tops';
const DETAILS = {
  'msfc003-womens-long-sleeve': {
    skuBase: 'MSFC003', type: 'Long-sleeve technical jersey · Five colourways',
    gCategory: TOPS_CAT, grams: 220, tags: ['Base Layers', 'Women', 'Long Sleeve', 'New'],
    fabric: '82% recycled polyamide, 18% elastane technical jersey.',
    features: ['Smooth mock neck with a clean bound edge', 'Close, second-skin fit through the body and sleeve', 'Flatlocked seams that sit quietly under a jacket', 'Breathable four-way stretch with moisture management'],
  },
  'msfwx008-sleeveless-shirt': {
    skuBase: 'MSFWX008', type: 'Sleeveless performance jersey · Four colourways',
    gCategory: TOPS_CAT, grams: 180, tags: ['Tops', 'Women', 'Sleeveless', 'New'],
    fabric: '80% recycled polyamide, 20% elastane performance jersey.',
    features: ['Refined high neck with a soft inner facing', 'Sleeveless cut shaped through the waist', 'Quick-drying, breathable hand feel for warm weather', 'Clean armhole binding that stays flat under a jacket'],
  },
  'msfd003-womens-short-sleeve': {
    skuBase: 'MSFD003', type: 'Short-sleeve performance jersey · Five colourways',
    gCategory: TOPS_CAT, grams: 200, tags: ['Tops', 'Women', 'Short Sleeve', 'Polo', 'New'],
    fabric: '88% recycled polyester, 12% elastane piqué-backed jersey.',
    features: ['Softly structured collar that holds its shape', 'Three-button placket with tonal branding', 'Neat athletic lines through the shoulder and sleeve', 'Breathable, quick-drying and easy to layer'],
  },
  'msfd007-womens-short-sleeve': {
    skuBase: 'MSFD007', type: 'Short-sleeve technical polo · Black / Navy Blue',
    gCategory: TOPS_CAT, grams: 205, tags: ['Tops', 'Women', 'Short Sleeve', 'Polo', 'New'],
    fabric: '88% recycled polyester, 12% elastane technical piqué.',
    features: ['Crisp contrast collar and clean placket', 'Tailored finish for training and show preparation', 'Moisture-wicking, breathable technical piqué', 'Reinforced shoulder seams for daily wear'],
  },
  'msfd008-womens-short-sleeve': {
    skuBase: 'MSFD008', type: 'Short-sleeve technical jersey · Navy / Light Blue / Black / White',
    gCategory: TOPS_CAT, grams: 195, tags: ['Tops', 'Women', 'Short Sleeve', 'New'],
    fabric: '84% recycled polyamide, 16% elastane technical jersey.',
    features: ['Low-profile collar with a short concealed zip', 'Subtle seam lines that follow the body', 'Smooth, layer-friendly finish under a jacket', 'Four-way stretch with a dry, cool hand feel'],
  },
  'msfd008-colour-block-short-sleeve': {
    skuBase: 'MSFD008-CB', type: 'Short-sleeve colour-block jersey · Navy / Light Blue / Black / White',
    gCategory: TOPS_CAT, grams: 200, tags: ['Tops', 'Women', 'Short Sleeve', 'Show Shirt', 'New'],
    fabric: '84% recycled polyamide, 16% elastane technical jersey.',
    features: ['White stand collar with a concealed front zip', 'Contrast chest panel framed by clean white shoulders and sleeves', 'Traditional show lines in a four-way stretch jersey', 'Breathable, quick-drying and easy to care for'],
  },
  'msfc009-womens-long-sleeve': {
    skuBase: 'MSFC009', type: 'Long-sleeve contrast-panel jersey · Four colourways',
    gCategory: TOPS_CAT, grams: 240, tags: ['Base Layers', 'Women', 'Long Sleeve', 'New'],
    fabric: '82% recycled polyamide, 18% elastane jersey with a woven bib front.',
    features: ['Clean white body with a curved contrast bib front', 'High collar with a concealed snap closure', 'Traditional show lines in a modern stretch fabric', 'Set-in sleeves cut for full rein movement'],
  },
};

// Packed items with no mockup product. Written for the store, priced beside
// their nearest mockup pieces (MSFD007 polo 129, MSFC009 long sleeve 159).
const NEW_PRODUCTS = {
  'msfd008-colour-block-short-sleeve': {
    id: 'msfd008-colour-block-short-sleeve',
    name: 'Colour Block Short Sleeve Show Shirt',
    audience: 'adult',
    price: 129,
    subtitle: 'Short-sleeve colour-block jersey · Four colourways',
    description: 'A crisp short-sleeve show shirt with a white stand collar, clean white shoulders and a contrast chest panel. The warm-weather companion to our bib front long sleeve, it brings a polished competition look to training days and show season alike.',
    colours: products.find((x) => x.id === 'msfd008-womens-short-sleeve').colours,
    images: [],
  },
};

const DEFAULT_CARE = 'Machine wash cold on a gentle cycle with like colours. Do not tumble dry, bleach or iron. Dry flat in the shade.';

const COLOUR_CODES = { 'Light Blue': 'LTB', 'Navy Blue': 'NVB', 'Navy': 'NAV', 'Powder Blue': 'PWB', 'Dusty Rose Pink': 'DRP' };
const colourCode = (name) =>
  COLOUR_CODES[name] || name.replace(/[^A-Za-z ]/g, '').split(/\s+/).map((w, i, a) => (a.length > 1 ? w[0] : w.slice(0, 3))).join('').toUpperCase();
const sizeCode = (size) => (size.toLowerCase() === 'one size' ? 'OS' : size.toUpperCase());

// Prototype PNG path -> theme asset filename, e.g.
// assets/products/msfc003-.../msfc003-front.png -> jci-msfc003-front.webp
const assetUrl = (protoPath) => `${IMAGE_BASE}/jci-${path.basename(protoPath, '.png')}.webp`;

// These six product images were generated from the matching packing-list
// photographs. They are kept in shopify-import/images/ so they can be
// uploaded to Shopify Files before this CSV is imported. Each product gets
// one accurate, premium primary image; the existing mockup gallery remains
// available after it.
const PRIMARY_IMAGE_FILENAMES = {
  'msfc003-womens-long-sleeve': 'jci-msfc003-womens-long-sleeve.webp',
  'msfwx008-sleeveless-shirt': 'jci-msfwx008-womens-sleeveless-shirt.webp',
  'msfd003-womens-short-sleeve': 'jci-msfd003-womens-short-sleeve.webp',
  'msfd008-womens-short-sleeve': 'jci-msfd008-womens-short-sleeve.webp',
  'msfd008-colour-block-short-sleeve': 'jci-msfd008-colour-block-short-sleeve.webp',
  'msfc009-womens-long-sleeve': 'jci-msfc009-womens-long-sleeve.webp',
};
const primaryImageUrl = (id) => {
  const filename = PRIMARY_IMAGE_FILENAMES[id];
  return filename ? `${IMAGE_BASE}/${filename}` : '';
};

function bodyHtml(product, d) {
  const features = (d.features || []).map((f) => `<li>${f}</li>`).join('');
  return [
    `<p>${product.description}</p>`,
    features ? `<ul>${features}</ul>` : '',
    d.fabric ? `<p><strong>Fabric</strong><br>${d.fabric}</p>` : '',
    `<p><strong>Care</strong><br>${d.care || DEFAULT_CARE}</p>`,
  ].filter(Boolean).join('\n');
}

const HEADERS = [
  'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Product Category', 'Type', 'Tags', 'Published',
  'Option1 Name', 'Option1 Value', 'Option2 Name', 'Option2 Value', 'Option3 Name', 'Option3 Value',
  'Variant SKU', 'Variant Grams', 'Variant Inventory Tracker', 'Variant Inventory Qty',
  'Variant Inventory Policy', 'Variant Fulfillment Service', 'Variant Price', 'Variant Compare At Price',
  'Variant Requires Shipping', 'Variant Taxable', 'Variant Barcode',
  'Image Src', 'Image Position', 'Image Alt Text', 'Gift Card',
  'SEO Title', 'SEO Description', 'Google Shopping / Google Product Category', 'Google Shopping / Gender',
  'Google Shopping / Age Group', 'Google Shopping / MPN', 'Google Shopping / Condition',
  'Google Shopping / Custom Product', 'Variant Image', 'Variant Weight Unit', 'Variant Tax Code',
  'Cost per item', 'Status',
  'Subtitle (product.metafields.custom.subtitle)',
  'Colour swatches (product.metafields.custom.colour_swatches)',
];

const esc = (v) => {
  const s = v === undefined || v === null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const row = (obj) => HEADERS.map((h) => esc(obj[h])).join(',');

const GENDER = { Women: 'female', Kids: 'unisex', Unisex: 'unisex' };
const AGE = { adult: 'adult', kids: 'kids', all: 'adult' };

const lines = [HEADERS.join(',')];

packingList.forEach((entry) => {
  const { id } = entry;
  const p = NEW_PRODUCTS[id] || products.find((x) => x.id === id);
  if (!p) throw new Error(`missing product ${id}`);
  const d = DETAILS[id];
  if (!d) throw new Error(`missing details for ${id}`);

  const primaryImage = primaryImageUrl(id);
  const gallery = [...new Set([primaryImage, ...p.images.map(assetUrl)].filter(Boolean))];
  const audience = p.audience || 'adult';
  const tags = [...d.tags, VENDOR].join(', ');

  // "front" -> the gallery photo named msfc003-front.png
  const photo = (name) => {
    if (!name) return '';
    const match = p.images.find((src) => path.basename(src, '.png').endsWith(`-${name}`));
    if (!match) throw new Error(`${id}: no mockup photo "${name}"`);
    return assetUrl(match);
  };

  const hexOf = (colour) => {
    const found = p.colours.find((c) => c.name === colour.mockupColour);
    if (!found) throw new Error(`${id}: no mockup colour "${colour.mockupColour}"`);
    return found.hex;
  };
  const swatches = entry.colours.map((c) => `${c.name}:${hexOf(c)}`).join(' | ');

  const variants = [];
  entry.colours.forEach((colour) => {
    Object.entries(colour.stock).forEach(([size, qty]) => {
      variants.push({
        colour: colour.name,
        size,
        qty,
        sku: `${d.skuBase}-${colourCode(colour.name)}-${sizeCode(size)}`,
        // The colour-block MSFD008 has no mockup gallery. Its generated
        // primary image is therefore also its variant image.
        image: photo(colour.image) || primaryImage,
      });
    });
  });

  // Shopify orders option values by first appearance in the file. Rows go
  // size first, so the size picker always reads XS S M L XL even when the
  // first colour is not packed in every size.
  const SIZE_RANK = ['XS', 'S', 'M', 'L', 'XL'];
  const colourRank = (name) => entry.colours.findIndex((c) => c.name === name);
  variants.sort((a, b) => SIZE_RANK.indexOf(a.size) - SIZE_RANK.indexOf(b.size) || colourRank(a.colour) - colourRank(b.colour));

  variants.forEach((v, i) => {
    const first = i === 0;
    lines.push(row({
      Handle: p.id,
      Title: first ? p.name : '',
      'Body (HTML)': first ? bodyHtml(p, d) : '',
      Vendor: first ? VENDOR : '',
      'Product Category': first ? d.gCategory : '',
      Type: first ? d.type : '',
      Tags: first ? tags : '',
      Published: first ? 'TRUE' : '',
      'Option1 Name': first ? 'Color' : '',
      'Option1 Value': v.colour,
      'Option2 Name': first ? 'Size' : '',
      'Option2 Value': v.size,
      'Variant SKU': v.sku,
      'Variant Grams': d.grams,
      'Variant Inventory Tracker': 'shopify',
      'Variant Inventory Qty': v.qty,
      'Variant Inventory Policy': 'deny',
      'Variant Fulfillment Service': 'manual',
      'Variant Price': p.price.toFixed(2),
      'Variant Requires Shipping': 'TRUE',
      'Variant Taxable': 'TRUE',
      'Image Src': first ? gallery[0] : '',
      'Image Position': first ? 1 : '',
      'Image Alt Text': first ? p.name : '',
      'Gift Card': first ? 'FALSE' : '',
      'SEO Title': first ? `${p.name} | ${VENDOR}` : '',
      'SEO Description': first ? `${p.subtitle}. ${p.description}`.slice(0, 320) : '',
      'Google Shopping / Google Product Category': first ? d.gCategory : '',
      'Google Shopping / Gender': first ? (GENDER[d.tags.find((t) => GENDER[t])] || 'unisex') : '',
      'Google Shopping / Age Group': first ? AGE[audience] : '',
      'Google Shopping / MPN': v.sku,
      'Google Shopping / Condition': first ? 'new' : '',
      'Google Shopping / Custom Product': first ? 'FALSE' : '',
      'Variant Image': v.image,
      'Variant Weight Unit': 'g',
      Status: first ? (d.status || 'active') : '',
      'Subtitle (product.metafields.custom.subtitle)': first ? p.subtitle : '',
      'Colour swatches (product.metafields.custom.colour_swatches)': first ? swatches : '',
    }));
  });

  gallery.slice(1).forEach((src, i) => {
    lines.push(row({
      Handle: p.id,
      'Image Src': src,
      'Image Position': i + 2,
      'Image Alt Text': p.name,
    }));
  });
});

const out = process.argv[3] || 'maison-cavalle-products.csv';
fs.writeFileSync(out, lines.join('\n') + '\n');
const units = packingList.reduce((sum, e) => sum + e.colours.reduce((s, c) => s + Object.values(c.stock).reduce((a, b) => a + b, 0), 0), 0);
console.log(`${out}: ${lines.length - 1} rows, ${ORDER.length} products, ${units} units`);
