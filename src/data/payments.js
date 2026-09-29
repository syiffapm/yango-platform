/**
 * Payment methods offered at checkout. Each one declares how it is actually
 * completed, so the checkout can show the right thing: a QR to scan, a virtual
 * account to transfer to, or a card form.
 *
 * YPS is the fare system already in use on YBS lines — a stored-value card
 * read by an onboard POS, and a QR paid from the MPyps+ app. Both are cheaper
 * than the cash fare, which is why they carry a discount here.
 */
export const paymentMethods = [
  {
    id: 'yps',
    name: 'YPS Card',
    kind: 'card-tap',
    short: 'YPS',
    bg: '#0e7490',
    fg: '#ffffff',
    note: 'Tap on the onboard POS · 100 MMK cheaper',
    discount: 100,
  },
  {
    id: 'ypsqr',
    name: 'YPS QR (MPyps+)',
    kind: 'qr',
    short: 'QR',
    bg: '#0369a1',
    fg: '#ffffff',
    note: 'Scan with MPyps+ · 100 MMK cheaper',
    discount: 100,
  },
  {
    id: 'cash',
    name: 'Cash on board',
    kind: 'cash',
    short: 'K',
    bg: '#57534e',
    fg: '#ffffff',
    note: 'Pay the conductor · exact fare helps',
  },
  {
    id: 'wallet',
    name: 'YanGo wallet',
    kind: 'wallet',
    short: 'YG',
    bg: '#2d5130',
    fg: '#ffffff',
    note: 'Instant, no fee',
  },
  {
    id: 'kbzpay',
    name: 'KBZPay',
    kind: 'qr',
    short: 'KBZ',
    bg: '#0b5cab',
    fg: '#ffffff',
    note: 'Scan with the KBZPay app',
  },
  {
    id: 'wave',
    name: 'Wave Money',
    kind: 'qr',
    short: 'WM',
    bg: '#f0b000',
    fg: '#1f2937',
    note: 'Scan with Wave Money',
  },
  { id: 'ayapay', name: 'AYA Pay', kind: 'qr', short: 'AYA', bg: '#c8102e', fg: '#ffffff', note: 'Scan with AYA Pay' },
  { id: 'cbpay', name: 'CB Pay', kind: 'qr', short: 'CB', bg: '#5b2d8e', fg: '#ffffff', note: 'Scan with CB Pay' },
  {
    id: 'va',
    name: 'Bank transfer',
    kind: 'va',
    short: 'VA',
    bg: '#0f766e',
    fg: '#ffffff',
    note: 'Virtual account · KBZ, AYA, CB, Yoma',
  },
  {
    id: 'card',
    name: 'Card',
    kind: 'card',
    short: '💳',
    bg: '#1f2937',
    fg: '#ffffff',
    note: 'MPU · Visa · Mastercard · JCB',
  },
]

export const methodById = (id) => paymentMethods.find((m) => m.id === id) || paymentMethods[0]

export const VA_BANKS = [
  { code: 'KBZ', name: 'KBZ Bank', prefix: '8820' },
  { code: 'AYA', name: 'AYA Bank', prefix: '7710' },
  { code: 'CB', name: 'CB Bank', prefix: '6640' },
  { code: 'YOMA', name: 'Yoma Bank', prefix: '5530' },
]
