// Global site settings. Change SITE_URL once the domain is purchased.
export const site = {
  name: 'Guidesync Services',
  shortName: 'Guidesync',
  url: 'https://guidesync.net', // <-- update if the purchased domain differs
  email: 'contact@guidesync.net',
  tagline: 'Complex payments, simplified.',
  description:
    'Guidesync Services connects high-risk and complex businesses with merchant processing partners. Get a free statement review and a call with a payments specialist.',
  // Cloudflare Turnstile public site key. Replace with your own from the Cloudflare dashboard.
  // The value below is Cloudflare's official always-passes TEST key so the form works in development.
  turnstileSiteKey: '1x00000000000000000000AA',
  // Google Analytics 4 measurement ID (e.g. 'G-XXXXXXX'). Leave empty to disable.
  ga4Id: '',
  // Google Ads conversion ID + label (e.g. 'AW-123456789/AbC-dEfGhIj'). Leave empty to disable.
  adsConversion: '',
  disclosure:
    'Guidesync Services connects businesses with processing partners. Guidesync is not a bank, acquirer, or payment processor. All applications are subject to underwriting and approval by our processing partners and their sponsor banks.',
};

export const industryNavOrder = [
  'peptides',
  'nutraceuticals',
  'subscription-billing',
  'high-ticket-coaching',
  'ecommerce',
  'travel',
  'med-spas',
  'moving-logistics',
  'event-ticketing',
  'b2b-wholesale',
];

export const solutionNavOrder = [
  'high-risk-merchant-accounts',
  'credit-card-processing',
  'ach-echeck-processing',
  'recurring-billing',
  'statement-review-rate-reduction',
];
