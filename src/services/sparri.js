// SPARRI Challenge Engine — pure module, no Vite/Node-specific imports.
// Shared by the browser-side engine (logosEngine.js) and the Node-side
// runner script (scripts/run-sparri-golden.mjs).

import { BANNED_OPENERS, SPARRI_OUTPUT_KEYS } from './doctrine.js';

export const SPARRI_SCHEMA = {
  type: 'object',
  properties: {
    detected_assumption: {
      type: 'string',
      description: 'Exactly one concrete assumption or logical jump from the user input, in Finnish.',
    },
    why_it_matters: {
      type: 'string',
      description: 'One Finnish sentence explaining why this assumption changes the interpretation or response.',
    },
    challenge_question: {
      type: 'string',
      description: 'Exactly one sharp Finnish question that is not a yes/no question.',
    },
  },
  required: SPARRI_OUTPUT_KEYS,
  additionalProperties: false,
};

export function buildSparriSystemPrompt() {
  return [
    'Olet Logos SPARRI, terävä ajattelun haastaja.',
    'Et ole yleinen avustaja, neuvoja tai yhteenvetäjä.',
    'Vastaa aina suomeksi ja vain pyydetyssä rakenteessa.',
    'Älä sisällytä yhteenvetoa, pääkohtia, neuvoja tai seuraavaa tekoa.',
    'Älä aloita kehulla, myötäilyllä tai ymmärtämisellä.',
    `Älä käytä sanoja: ${BANNED_OPENERS.join(', ')}.`,
    'Nimeä täsmälleen yksi käyttäjän oletus tai looginen hyppy.',
    'Selitä yhdessä lauseessa, miksi juuri tällä oletuksella on väliä.',
    'Kysy täsmälleen yksi kysymys.',
    'Kysymys ei saa olla kyllä/ei-kysymys eikä alkaa muodolla onko, voiko, pitäisikö, oletko, haluatko, kannattaako tai olisiko.',
    'Kysymyksen pitää pakottaa käyttäjä perustelemaan, tarkentamaan tai kehystämään oletus uudelleen.',
    'Pidä koko vastaus lyhyenä ja hieman epämukavana mutta hyödyllisenä.',
  ].join(' ');
}

export function buildSparriUserPayload(input, context = {}) {
  return {
    mode: 'sparri',
    input,
    context: {
      selected_skill: context.selectedSkill
        ? {
            name: context.selectedSkill.name,
            summary: context.selectedSkill.summary,
          }
        : null,
      past_sessions: (context.pastSessions ?? []).slice(0, 5).map((session) => ({
        mode: session.mode,
        title: session.title,
        tags: session.tags,
        summary: session.output?.summary ?? '',
      })),
    },
  };
}

const BANNED_OPENER_PATTERN = new RegExp(
  `^(${BANNED_OPENERS.join('|')})[\\s,!:.–-]*`,
  'i',
);

export function stripBannedOpeners(value) {
  return value.replace(BANNED_OPENER_PATTERN, '').trim();
}

export function normalizeSparriOutput(output) {
  return {
    type: 'sparri_challenge',
    detected_assumption: stripBannedOpeners(output.detected_assumption ?? ''),
    why_it_matters: stripBannedOpeners(output.why_it_matters ?? ''),
    challenge_question: stripBannedOpeners(output.challenge_question ?? ''),
  };
}

export function extractOutputText(data) {
  if (data.output_text) return data.output_text;

  const outputText = data.output
    ?.flatMap((item) => item.content ?? [])
    .find((content) => content.type === 'output_text')?.text;

  if (!outputText) {
    throw new Error('OpenAI ei palauttanut luettavaa Logos-vastausta.');
  }

  return outputText;
}
