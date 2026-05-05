// Logos doctrine invariants — single source of truth.
// Imported by both the engine (browser) and validation scripts (Node).
// When you change a value here, also update DOCTRINE.md.

export const LOGOS_MODES = ['idea', 'sparri', 'analyysi', 'kehitys'];

export const BANNED_OPENERS = [
  'hyvä',
  'hieno',
  'mielenkiintoinen',
  'ymmärrän',
  'totta',
  'loistava',
];

export const BANNED_ADVICE = [
  'kannattaa',
  'voisit',
  'tee',
  'seuraavaksi',
  'suosittelen',
];

export const YES_NO_QUESTION_OPENERS = [
  'onko',
  'voiko',
  'pitäisikö',
  'oletko',
  'haluatko',
  'kannattaako',
  'olisiko',
];

export const SPARRI_OUTPUT_KEYS = [
  'detected_assumption',
  'why_it_matters',
  'challenge_question',
];
