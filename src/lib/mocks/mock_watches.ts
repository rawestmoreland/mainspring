import type { Watch } from '#/types';
import { placeholderImg } from '#/lib/helpers';

export const MOCK_WATCHES: Watch[] = [
  {
    id: 1, make: 'Seiko', model: 'SKX007', reference: 'SKX007J1', year: 1998,
    status: 'sold', condition_bought: 'worn',
    bought_price: 120, sold_price: 310, parts_cost: 38, hours_spent: 6.5,
    bought_date: '2024-10-12', sold_date: '2024-11-03',
    notes: 'Replaced crown, polished bracelet, new crystal.',
    photos: [
      { id: 1, stage: 'before',  caption: 'Arrived with heavy scratches on case',    url: placeholderImg('skx-b1') },
      { id: 2, stage: 'before',  caption: 'Worn crown and corroded caseback',         url: placeholderImg('skx-b2') },
      { id: 3, stage: 'during',  caption: 'Movement out, cleaned and lubed',          url: placeholderImg('skx-d1') },
      { id: 4, stage: 'after',   caption: 'Case polished, new crystal installed',     url: placeholderImg('skx-a1') },
      { id: 5, stage: 'listing', caption: 'eBay listing hero shot',                   url: placeholderImg('skx-l1') },
    ],
  },
  {
    id: 2, make: 'Omega', model: 'Seamaster', reference: '166.032', year: 1969,
    status: 'in_progress', condition_bought: 'parts_only',
    bought_price: 280, sold_price: null, parts_cost: 95, hours_spent: 12,
    bought_date: '2024-12-01', sold_date: null,
    notes: 'Movement needs a full service. Dial is beautiful.',
    photos: [
      { id: 6, stage: 'before', caption: 'Parts lot as received',  url: placeholderImg('omega-b1') },
      { id: 7, stage: 'during', caption: 'Movement disassembled',  url: placeholderImg('omega-d1') },
    ],
  },
  {
    id: 3, make: 'Tissot', model: 'PR516', reference: '44651', year: 1972,
    status: 'listed', condition_bought: 'good',
    bought_price: 95, sold_price: null, parts_cost: 12, hours_spent: 2,
    bought_date: '2025-01-08', sold_date: null,
    notes: 'Quick clean and service. Listed on eBay.',
    photos: [
      { id: 8,  stage: 'before',  caption: 'As bought',                 url: placeholderImg('tissot-b') },
      { id: 9,  stage: 'after',   caption: 'Cleaned and regulated',     url: placeholderImg('tissot-a') },
      { id: 10, stage: 'listing', caption: 'Listing shot on grey card', url: placeholderImg('tissot-l') },
    ],
  },
  {
    id: 4, make: 'Longines', model: 'Conquest', reference: '7942-2', year: 1961,
    status: 'sold', condition_bought: 'fair',
    bought_price: 210, sold_price: 520, parts_cost: 55, hours_spent: 9,
    bought_date: '2024-08-19', sold_date: '2024-09-30',
    notes: 'Full service, new strap. Stunning piece.',
    photos: [
      { id: 11, stage: 'before',  caption: 'Arrived with dusty dial',  url: placeholderImg('longines-b1') },
      { id: 12, stage: 'before',  caption: 'Worn leather strap',       url: placeholderImg('longines-b2') },
      { id: 13, stage: 'during',  caption: 'Calibre 290 service',      url: placeholderImg('longines-d1') },
      { id: 14, stage: 'after',   caption: 'New Hirsch strap fitted',  url: placeholderImg('longines-a1') },
      { id: 15, stage: 'listing', caption: 'Studio shot for listing',  url: placeholderImg('longines-l1') },
    ],
  },
  {
    id: 5, make: 'Tudor', model: 'Submariner', reference: '7922', year: 1958,
    status: 'in_progress', condition_bought: 'poor',
    bought_price: 850, sold_price: null, parts_cost: 180, hours_spent: 18,
    bought_date: '2025-02-14', sold_date: null,
    notes: 'Project piece. Hunting for correct bezel insert.',
    photos: [
      { id: 16, stage: 'before', caption: 'Heavy corrosion on case flanks', url: placeholderImg('tudor-b1') },
      { id: 17, stage: 'during', caption: 'Bezel removed, insert damaged',  url: placeholderImg('tudor-d1') },
    ],
  },
];
