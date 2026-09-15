// Client packing list — "Packing Listing 2026.8.26.pdf", 5 cartons, 518 units.
//
// Source of truth for which products are imported and, for each one, its
// colours, sizes and stock. Colour and size names are the packing list's,
// title-cased. A colour packed in two cartons is summed into one variant set.
//
// Name, price, description, subtitle, swatch hex and gallery still come from
// the mockup (catalog-data.js), matched by comparing the packing-list photo of
// each item to the mockup's product photos. `image` names the mockup photo
// that shows that colour; colours the mockup never photographs alone point at
// the studio flat-lay, which shows every colourway.
//
// MSFD008 is packed as two different garments under one item number. The
// solid shirt matches the mockup's msfd008 photos; the colour-block shirt has
// no mockup product or photos, so it is its own product with invented details
// (see make-products-csv.js) and imports as a draft until photos are added.

const stock = (pairs) => Object.fromEntries(pairs.split(' ').map((p) => p.split('=')).map(([s, q]) => [s, Number(q)]));

const packingList = [
  {
    id: 'msfd007-womens-short-sleeve',
    item: 'MSFD007',
    cartons: '1',
    colours: [
      { name: 'Black', mockupColour: 'Black', image: 'riding', stock: stock('S=5 M=5 L=5') },
      { name: 'Navy Blue', mockupColour: 'Navy Blue', image: 'back', stock: stock('XS=5 S=5 M=5 L=5 XL=5') },
    ],
  },
  {
    id: 'msfc003-womens-long-sleeve',
    item: 'MSFC003',
    cartons: '1, 2',
    colours: [
      { name: 'Pink', mockupColour: 'Pink', image: 'front', stock: stock('S=5 M=5 L=5 XL=5') },
      { name: 'Light Blue', mockupColour: 'Light Blue', image: 'back', stock: stock('S=5 M=5 L=5 XL=5') },
      { name: 'White', mockupColour: 'White', image: 'riding', stock: stock('S=5 M=5 L=5 XL=5') },
      { name: 'Navy', mockupColour: 'Navy', image: 'studio', stock: stock('S=5 M=5 L=5 XL=5') },
      { name: 'Black', mockupColour: 'Black', image: 'studio', stock: stock('S=5 M=5 L=5 XL=5') },
    ],
  },
  {
    id: 'msfwx008-sleeveless-shirt',
    item: 'MSFWX008',
    cartons: '1, 5',
    colours: [
      { name: 'Black', mockupColour: 'Black', image: 'rider', stock: stock('XS=5 S=5 M=5 L=5 XL=5') },
      { name: 'Navy', mockupColour: 'Navy', image: 'back', stock: stock('XS=5 S=5 M=5') },
      // Carton 1: M=5 L=5 XL=3 · carton 5: XS=5 XL=2
      { name: 'White', mockupColour: 'White', image: 'studio', stock: stock('XS=5 M=5 L=5 XL=5') },
      // Carton 1: XS=5 S=5 XL=1 · carton 5: M=5 L=1
      { name: 'Burgundy', mockupColour: 'Burgundy', image: 'studio', stock: stock('XS=5 S=5 M=5 L=1 XL=1') },
    ],
  },
  {
    id: 'msfd003-womens-short-sleeve',
    item: 'MSFD003',
    cartons: '3',
    colours: [
      { name: 'Pink', mockupColour: 'Pink', image: 'front', stock: stock('S=5 M=5 L=5 XL=4') },
      { name: 'Light Blue', mockupColour: 'Light Blue', image: 'back', stock: stock('S=5 M=5 L=5 XL=3') },
      { name: 'Navy Blue', mockupColour: 'Navy Blue', image: 'studio', stock: stock('S=5 M=5 L=5 XL=5') },
      { name: 'White', mockupColour: 'White', image: 'studio', stock: stock('S=5 M=5 L=4') },
      { name: 'Black', mockupColour: 'Black', image: 'studio', stock: stock('S=5 M=5 L=5 XL=5') },
    ],
  },
  {
    id: 'msfd008-womens-short-sleeve',
    item: 'MSFD008',
    cartons: '3, 4',
    colours: [
      { name: 'Black', mockupColour: 'Black', image: 'studio', stock: stock('XS=5 S=5 M=5 L=5 XL=5') },
      { name: 'Navy', mockupColour: 'Navy', image: 'front', stock: stock('XS=5 S=5 M=5 L=5 XL=5') },
      { name: 'White', mockupColour: 'White', image: 'studio', stock: stock('XS=5 S=5 M=5 L=5 XL=5') },
      { name: 'Light Blue', mockupColour: 'Light Blue', image: 'back', stock: stock('XS=5 S=5 M=5 L=5 XL=5') },
    ],
  },
  {
    id: 'msfd008-colour-block-short-sleeve',
    item: 'MSFD008',
    cartons: '4',
    notInMockup: true,
    colours: [
      { name: 'Navy', mockupColour: 'Navy', stock: stock('XS=4') },
      { name: 'Light Blue', mockupColour: 'Light Blue', stock: stock('L=5 XL=5') },
      { name: 'Black', mockupColour: 'Black', stock: stock('XS=5 S=3 L=5 XL=3') },
      { name: 'White', mockupColour: 'White', stock: stock('S=3 M=5 XL=3') },
    ],
  },
  {
    id: 'msfc009-womens-long-sleeve',
    item: 'MSFC009',
    cartons: '5',
    colours: [
      { name: 'Navy', mockupColour: 'Navy', image: 'front', stock: stock('S=1 M=1 L=5 XL=3') },
      { name: 'Light Blue', mockupColour: 'Light Blue', image: 'studio', stock: stock('S=5 M=5 L=5 XL=5') },
      { name: 'Black', mockupColour: 'Black', image: 'studio', stock: stock('XS=5 S=5 M=5 L=5 XL=5') },
      { name: 'White', mockupColour: 'White', image: 'studio', stock: stock('M=5 L=5 XL=4') },
    ],
  },
];

module.exports = { packingList };
