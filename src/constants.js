export const MODES = [
  {
    id: 'idea',
    label: 'IDEA',
    title: 'Idea',
    description: 'Tallenna ajatus, havainto tai mahdollisuus jatkokehitystä varten.',
  },
  {
    id: 'sparri',
    label: 'SPARRI',
    title: 'Sparri',
    description: 'Jäsennä tilanne, valinta tai keskustelu ennen seuraavaa liikettä.',
  },
  {
    id: 'analyysi',
    label: 'ANALYYSI',
    title: 'Analyysi',
    description: 'Pura kokemus, päätös tai tapahtuma ymmärrettäviin osiin.',
  },
  {
    id: 'kehitys',
    label: 'KEHITYS',
    title: 'Kehitys',
    description: 'Tunnista toistuva teema ajattelussasi ja kehitä tapaa, jolla lähestyt sitä.',
  },
];

export const FREEFORM_EXAMPLES = [
  'Mikä on pyörinyt mielessä viime aikoina?',
  'Onko jokin tilanne jäänyt vaivaamaan?',
  'Mitä haluaisit tehdä paremmin tällä viikolla?',
  'Tuli ajatus lenkillä...',
  'Kuuntelin podcastin ja mietin...',
];

export const STARTER_PROMPTS = [
  'Mikä asia on tällä viikolla jäänyt pyörimään mieleen?',
  'Missä tilanteessa huomasit ettet saanut ajatusta vietyä perille?',
  'Mikä keskustelu olisi voinut mennä paremmin?',
  'Mitä taitoa haluaisit kehittää, mutta et ole vielä aloittanut?',
];

export const CHALLENGE_LEVELS = [
  { id: 'support', label: 'Tuki' },
  { id: 'balanced', label: 'Tasapaino' },
  { id: 'challenge', label: 'Haaste' },
];

export const EMPTY_SESSION = {
  mode: 'idea',
  title: '',
  body: '',
  tags: '',
  challengeLevel: 'balanced',
  selectedSkill: null,
};
