const fs = require('fs');
const path = require('path');
const { products } = require('./catalog-data.js');

const IMAGE_BASE = (process.argv[2] || '__IMAGE_BASE__').replace(/\/+$/, '');
const VENDOR = 'Maison Cavallé';

// Order the mockup collection grid renders them in, then the two catalogue
// products the grid filter leaves out.
const ORDER = [
  'msfc003-womens-long-sleeve',
  'msfwx008-sleeveless-shirt',
  'msfd003-womens-short-sleeve',
  'msfd007-womens-short-sleeve',
  'msfd008-womens-short-sleeve',
  'msfc009-womens-long-sleeve',
  'active-turtleneck-top',
  'lux-jacket',
  'pro-skin-performance-tights',
  'kids-performance-tights',
  'kids-baselayer-short-sleeve',
  'elite-baselayer-short-sleeve',
  'airflex-baselayer-dusty-rose',
  'girls-reinfeel-pro-gloves',
  'crest-cap',
  'deluxe-grooming-kit',
  'groomi-horse-shedder',
];

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
  'msfc009-womens-long-sleeve': {
    skuBase: 'MSFC009', type: 'Long-sleeve contrast-panel jersey · Four colourways',
    gCategory: TOPS_CAT, grams: 240, tags: ['Base Layers', 'Women', 'Long Sleeve', 'New'],
    fabric: '82% recycled polyamide, 18% elastane jersey with a woven bib front.',
    features: ['Clean white body with a curved contrast bib front', 'High collar with a concealed snap closure', 'Traditional show lines in a modern stretch fabric', 'Set-in sleeves cut for full rein movement'],
  },
  'active-turtleneck-top': {
    skuBase: 'MC-ATT', type: 'Performance stretch jersey · Cocoa',
    gCategory: TOPS_CAT, grams: 230, tags: ['Tops', 'Women', 'Long Sleeve', 'New'],
    fabric: '85% recycled polyamide, 15% elastane stretch jersey.',
    features: ['Softly gathered high neck', 'Close-fitting cut made for movement', 'Maison Cavallé crest embroidered at the chest', 'Smooth flat seams with no rub points'],
  },
  'lux-jacket': {
    skuBase: 'MC-LXJ', type: 'Performance softshell · Powder blue',
    gCategory: 'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets', grams: 620,
    tags: ['Jackets', 'Women', 'Outerwear', 'New'],
    fabric: 'Bonded three-layer softshell: 92% recycled polyester, 8% elastane with a brushed inner face.',
    features: ['High collar with a soft chin guard', 'Articulated seams shaped through the body', 'Two secure zipped hand pockets', 'Water-repellent finish and wind-resistant membrane', 'Signature Maison Cavallé branding at the chest and sleeve'],
    care: 'Machine wash cold on a gentle cycle. Do not tumble dry, iron or dry clean. Reproof as required.',
  },
  'pro-skin-performance-tights': {
    skuBase: 'MC-PST', type: 'Full-seat technical stretch · Ink',
    gCategory: 'Apparel & Accessories > Clothing > Pants', grams: 320,
    tags: ['Tights', 'Women', 'Full Seat', 'New'],
    fabric: '78% recycled polyamide, 22% elastane compression stretch with a silicone full seat.',
    features: ['Smooth high-rise waistband that stays put in the saddle', 'Full-seat silicone grip for a confident position', 'Secure side pocket sized for a phone', 'Flat, chafe-free seams and a clean ankle cuff'],
  },
  'kids-performance-tights': {
    skuBase: 'MC-KPT', type: 'Full-seat technical stretch · Navy',
    gCategory: 'Apparel & Accessories > Clothing > Pants', grams: 250,
    tags: ['Tights', 'Kids', 'Full Seat', 'New'],
    fabric: '78% recycled polyamide, 22% elastane stretch with a silicone full seat.',
    features: ['Soft high-rise waistband for growing riders', 'Full-seat grip that builds a secure position', 'Practical side pocket', 'Hard-wearing fabric made for everyday lessons'],
  },
  'kids-baselayer-short-sleeve': {
    skuBase: 'MC-KBL', type: 'Lightweight performance jersey · Stone',
    gCategory: TOPS_CAT, grams: 150, tags: ['Base Layers', 'Kids', 'Short Sleeve', 'New'],
    fabric: '86% recycled polyester, 14% elastane lightweight jersey.',
    features: ['Neat stand collar with a short zip', 'Easy movement through the shoulders', 'Light, breathable and quick-drying', 'Soft flat seams for sensitive skin'],
  },
  'elite-baselayer-short-sleeve': {
    skuBase: 'MC-EBL', type: 'Technical performance jersey · Ink',
    gCategory: TOPS_CAT, grams: 190, tags: ['Base Layers', 'Women', 'Short Sleeve', 'New'],
    fabric: '84% recycled polyamide, 16% elastane technical jersey.',
    features: ['Discreet half zip with an inner storm flap', 'Close competition fit with flat seams', 'Moisture-wicking and fast-drying', 'Holds its shape wash after wash'],
  },
  'airflex-baselayer-dusty-rose': {
    skuBase: 'MC-ABL', type: 'Breathable stretch jersey · Dusty Rose Pink',
    gCategory: TOPS_CAT, grams: 185, tags: ['Base Layers', 'Women', 'Short Sleeve', 'New'],
    fabric: '86% recycled polyamide, 14% elastane airflow-knit jersey.',
    features: ['Neat half zip with a soft inner facing', 'Open airflow knit through the back panel', 'Smooth flat seams and a clean hem', 'Light enough for warm-up, polished enough for the day'],
  },
  'girls-reinfeel-pro-gloves': {
    skuBase: 'MC-GRG', type: 'Technical mesh & rein grip · Black',
    gCategory: 'Apparel & Accessories > Clothing Accessories > Gloves & Mittens', grams: 90,
    tags: ['Accessories', 'Kids', 'Gloves', 'New'],
    fabric: 'Breathable technical mesh with synthetic grip palm and silicone rein panels.',
    features: ['Reinforced grip panels for steady rein contact', 'Breathable mesh back with four-way stretch', 'Secure hook-and-loop wrist closure', 'Touchscreen-friendly index finger'],
    care: 'Hand wash cold and air dry flat. Do not tumble dry or iron.',
  },
  'crest-cap': {
    skuBase: 'MC-CAP', type: 'Cotton twill · Ink',
    gCategory: 'Apparel & Accessories > Clothing Accessories > Hats', grams: 140,
    tags: ['Accessories', 'Unisex', 'Caps', 'New'],
    fabric: '100% cotton twill with a cotton sweatband.',
    features: ['Classic six-panel crown with brass eyelets', 'Maison Cavallé crest embroidered at the front', 'Pre-curved peak', 'Adjustable metal clasp at the back'],
    care: 'Spot clean only. Do not machine wash, tumble dry or bleach.',
  },
  'deluxe-grooming-kit': {
    skuBase: 'MC-DGK', type: 'Handcrafted brushes & accessories · Chestnut',
    gCategory: 'Animals & Pet Supplies > Pet Supplies > Pet Grooming Supplies', grams: 2400,
    tags: ['Accessories', 'Grooming', 'Gifting', 'New'],
    fabric: 'Beechwood brush bodies, natural and synthetic bristle, chestnut coated-canvas bag.',
    features: ['Body brush, dandy brush and face brush', 'Mane and tail comb with a hoof pick', 'Rubber curry comb for everyday use', 'Presented in a structured chestnut grooming bag'],
    care: 'Rinse bristles in cool water and dry flat. Wipe the bag clean with a damp cloth.',
  },
  'groomi-horse-shedder': {
    skuBase: 'MC-GHS', type: 'Textured grooming tool · Pink / Blue / Black',
    gCategory: 'Animals & Pet Supplies > Pet Supplies > Pet Grooming Supplies', grams: 180,
    tags: ['Grooming', 'Stable', 'New'],
    fabric: 'Moulded polymer body with a textured shedding face.',
    features: ['Textured face lifts loose coat in a few passes', 'Easy-grip shape for wet or gloved hands', 'Safe on the body, shoulder and hindquarter', 'Rinses clean in seconds'],
    care: 'Rinse under running water after use and air dry.',
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

// "Pink · S 5 / M 5 / L 5 / XL 4" -> { Pink: { S: 5, M: 5, L: 5, XL: 4 } }
function parseStock(lines) {
  const map = {};
  (lines || []).forEach((line) => {
    const [colour, rest] = line.split('·').map((s) => s.trim());
    if (!rest) return;
    map[colour] = {};
    rest.split('/').forEach((pair) => {
      const m = pair.trim().match(/^(.+?)\s+(\d+)$/);
      if (m) map[colour][m[1].trim()] = Number(m[2]);
    });
  });
  return map;
}

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

ORDER.forEach((id) => {
  const p = products.find((x) => x.id === id);
  if (!p) throw new Error(`missing product ${id}`);
  const d = DETAILS[id];
  if (!d) throw new Error(`missing details for ${id}`);

  const stock = parseStock(p.stockBreakdown);
  const gallery = [...new Set(p.images.map(assetUrl))];
  const audience = p.audience || 'adult';
  const tags = [...d.tags, VENDOR].join(', ');
  const swatches = p.colours.map((c) => `${c.name}:${c.hex}`).join(' | ');

  const variants = [];
  p.colours.forEach((colour) => {
    const sizes = colour.sizes || p.sizes;
    sizes.forEach((size) => {
      const qty = (stock[colour.name] && stock[colour.name][size]) ?? 25;
      variants.push({
        colour: colour.name,
        size,
        qty,
        sku: sizeCode(size) === 'OS' && p.colours.length === 1
          ? d.skuBase
          : `${d.skuBase}-${colourCode(colour.name)}-${sizeCode(size)}`,
        image: assetUrl(colour.image),
      });
    });
  });

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
      Status: first ? 'active' : '',
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
console.log(`${out}: ${lines.length - 1} rows, ${ORDER.length} products`);
