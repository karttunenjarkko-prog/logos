const OPENAI_API_URL = 'https://api.openai.com/v1/responses';
const OPENAI_MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini';

const MODE_INSTRUCTIONS = {
  idea: 'Kirkasta idea: mikä siinä on kiinnostavaa, mikä on epäselvää ja miten sitä kannattaa kokeilla pienesti.',
  sparri: 'Tunnista yksi oletus tai looginen hyppy ja pakota käyttäjä perustelemaan se yhdellä terävällä kysymyksellä.',
  analyysi: 'Analysoi kokemus: erota havainnot, tulkinnat, opit ja toistuvat kaavat.',
  taito: 'Valmenna taitoa: yhdistä käyttäjän tilanne valittuun taitoon ja ehdota yhtä käytännöllistä harjoitusta.',
};

const CHALLENGE_TONES = {
  support: 'Ole erityisen tukeva ja selkeyttävä. Haasta pehmeästi.',
  balanced: 'Pidä tasapaino tuen ja vaatimisen välillä.',
  challenge: 'Ole suorempi ja vaativampi, mutta säilytä rauhallinen sävy.',
};

const LOGOS_SCHEMA = {
  type: 'object',
  properties: {
    summary: {
      type: 'string',
      description: 'One calm, concise Finnish summary of the user input.',
    },
    key_points: {
      type: 'array',
      description: 'Three to four concise Finnish bullet points. No more than four.',
      items: { type: 'string' },
    },
    challenge_question: {
      type: 'string',
      description: 'Exactly one slightly challenging Finnish question.',
    },
    next_action: {
      type: 'string',
      description: 'One concrete next action in Finnish.',
    },
  },
  required: ['summary', 'key_points', 'challenge_question', 'next_action'],
  additionalProperties: false,
};

const SPARRI_SCHEMA = {
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
  required: ['detected_assumption', 'why_it_matters', 'challenge_question'],
  additionalProperties: false,
};

const CHAT_SCHEMA = {
  type: 'object',
  properties: {
    observation: {
      type: 'string',
      description: 'Short Finnish observation. One to two sentences.',
    },
    question: {
      type: 'string',
      description: 'Exactly one focused Finnish question.',
    },
    structured: {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        insight: { type: 'string' },
        challenge: { type: 'string' },
        action: { type: 'string' },
      },
      required: ['summary', 'insight', 'challenge', 'action'],
      additionalProperties: false,
    },
  },
  required: ['observation', 'question', 'structured'],
  additionalProperties: false,
};

const INTAKE_SCHEMA = {
  type: 'object',
  properties: {
    mode: {
      type: 'string',
      enum: ['idea', 'sparri', 'analyysi', 'taito'],
      description: 'Best Logos mode for the input.',
    },
    title: {
      type: 'string',
      description: 'Short Finnish title, max 6 words.',
    },
    tags: {
      type: 'array',
      description: 'Zero to three concise Finnish lowercase tags.',
      items: { type: 'string' },
    },
  },
  required: ['mode', 'title', 'tags'],
  additionalProperties: false,
};

export async function prepareLogosSession(rawInput, context = {}) {
  const apiKey = context.apiKey || import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API-avain puuttuu. Lisää avain Asetukset-näkymässä.');
  }

  const response = await createOpenAIResponse(apiKey, {
    model: OPENAI_MODEL,
    input: [
      {
        role: 'system',
        content: [
          'Olet Logos Brainin sisäänotto.',
          'Tee sotkuisesta käyttäjän ajatuksesta kevyt metatieto jatkokäsittelyä varten.',
          'Valitse todennäköisin mode: idea, sparri, analyysi tai taito.',
          'Älä ylitulkitse. Jos kyse on uudesta ajatuksesta, valitse idea. Jos päätöksestä tai tilanteesta, valitse sparri. Jos kokemuksen purusta, valitse analyysi. Jos harjoittelusta tai kehittymisestä, valitse taito.',
          'Luo lyhyt, luonnollinen suomenkielinen otsikko ja enintään kolme tagia.',
        ].join(' '),
      },
      {
        role: 'user',
        content: JSON.stringify(
          {
            raw_input: rawInput,
            past_sessions: (context.pastSessions ?? []).slice(0, 5).map((session) => ({
              mode: session.mode,
              title: session.title,
              tags: session.tags,
            })),
          },
          null,
          2,
        ),
      },
    ],
    max_output_tokens: 220,
    text: {
      format: {
        type: 'json_schema',
        name: 'logos_intake',
        strict: true,
        schema: INTAKE_SCHEMA,
      },
    },
  });

  return normalizeIntake(JSON.parse(extractOutputText(response)));
}

export async function logosEngine(mode, input, context = {}) {
  const apiKey = context.apiKey || import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API-avain puuttuu. Lisää avain Asetukset-näkymässä.');
  }

  if (mode === 'sparri') {
    const data = await createOpenAIResponse(apiKey, {
      model: OPENAI_MODEL,
      input: [
        {
          role: 'system',
          content: buildSparriSystemPrompt(),
        },
        {
          role: 'user',
          content: JSON.stringify(buildUserPayload(mode, input, context), null, 2),
        },
      ],
      max_output_tokens: 360,
      text: {
        format: {
          type: 'json_schema',
          name: 'logos_sparri_challenge',
          strict: true,
          schema: SPARRI_SCHEMA,
        },
      },
    });

    return normalizeSparriOutput(JSON.parse(extractOutputText(data)));
  }

  const data = await createOpenAIResponse(apiKey, {
    model: OPENAI_MODEL,
    input: [
      {
        role: 'system',
        content: buildSystemPrompt(mode, context),
      },
      {
        role: 'user',
        content: JSON.stringify(buildUserPayload(mode, input, context), null, 2),
      },
    ],
    max_output_tokens: 700,
    text: {
      format: {
        type: 'json_schema',
        name: 'logos_brain_response',
        strict: true,
        schema: LOGOS_SCHEMA,
      },
    },
  });

  return normalizeLogosOutput(JSON.parse(extractOutputText(data)));
}

export async function logosChatTurn(input, context = {}) {
  const apiKey = context.apiKey || import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API-avain puuttuu. Lisää avain Asetukset-näkymässä.');
  }

  if (context.mode === 'sparri') {
    const data = await createOpenAIResponse(apiKey, {
      model: OPENAI_MODEL,
      input: [
        {
          role: 'system',
          content: buildSparriSystemPrompt(),
        },
        {
          role: 'user',
          content: JSON.stringify(
            {
              user_input: input,
              mode: context.mode,
              title: context.title,
              quick_intent: context.quickIntent ?? null,
              transcript: (context.transcript ?? []).slice(-8).map((message) => ({
                role: message.role,
                content:
                  message.content ??
                  message.observation ??
                  message.sparriChallenge?.detected_assumption ??
                  '',
                question: message.question ?? message.sparriChallenge?.challenge_question ?? '',
              })),
            },
            null,
            2,
          ),
        },
      ],
      max_output_tokens: 360,
      text: {
        format: {
          type: 'json_schema',
          name: 'logos_sparri_challenge',
          strict: true,
          schema: SPARRI_SCHEMA,
        },
      },
    });

    return normalizeSparriOutput(JSON.parse(extractOutputText(data)));
  }

  const data = await createOpenAIResponse(apiKey, {
    model: OPENAI_MODEL,
    input: [
      {
        role: 'system',
        content: buildChatSystemPrompt(context),
      },
      {
        role: 'user',
        content: JSON.stringify(
          {
            user_input: input,
            mode: context.mode,
            title: context.title,
            quick_intent: context.quickIntent ?? null,
            transcript: (context.transcript ?? []).slice(-8).map((message) => ({
              role: message.role,
              content: message.content ?? message.observation ?? '',
              question: message.question ?? '',
            })),
          },
          null,
          2,
        ),
      },
    ],
    max_output_tokens: 520,
    text: {
      format: {
        type: 'json_schema',
        name: 'logos_guided_chat_response',
        strict: true,
        schema: CHAT_SCHEMA,
      },
    },
  });

  return normalizeChatOutput(JSON.parse(extractOutputText(data)));
}

async function createOpenAIResponse(apiKey, body) {
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await readOpenAIError(response);
    throw new Error(message);
  }

  return response.json();
}

function buildSystemPrompt(mode, context) {
  const modeInstruction = MODE_INSTRUCTIONS[mode] ?? MODE_INSTRUCTIONS.idea;
  const challengeTone = CHALLENGE_TONES[context.challengeLevel] ?? CHALLENGE_TONES.balanced;

  return [
    'Olet Logos Brain, henkilökohtainen ajattelun valmentaja.',
    'Vastaa aina suomeksi.',
    'Sävy: rauhallinen, tiivis, ei saarnaava, hieman haastava.',
    'Älä diagnosoi, terapioi tai paisuttele. Auta käyttäjää ajattelemaan selkeämmin.',
    'Pidä key_points-lista enintään 3-4 kohdassa.',
    'Sisällytä aina yksi challenge_question.',
    modeInstruction,
    challengeTone,
  ].join(' ');
}

function buildChatSystemPrompt(context) {
  const modeInstruction = MODE_INSTRUCTIONS[context.mode] ?? MODE_INSTRUCTIONS.idea;

  return [
    'Olet Logos, henkilökohtainen ajattelun opas.',
    'Et ole yleinen chatbot etkä vastauskone.',
    'Tavoite on auttaa käyttäjää ajattelemaan paremmin, ei ratkaista kaikkea hänen puolestaan.',
    'Vastaa aina suomeksi.',
    'Pidä vastaus lyhyenä, rauhallisena, ei saarnaavana ja hieman haastavana.',
    'Rakenne: lyhyt observation, täsmälleen yksi question, ja vain tarvittaessa tiivis structured-blokki.',
    'Kysymyksen pitää viedä ajattelua eteenpäin, ei avata montaa uutta polkua.',
    'Jos quick_intent on deepen, mene syvemmälle yhteen kohtaan.',
    'Jos quick_intent on challenge, kyseenalaista yksi oletus rakentavasti.',
    'Jos quick_intent on action, muuta ajatus yhdeksi käytännön teoksi.',
    'Pidä structured-kentät tyhjinä, jos ne eivät lisää selkeyttä.',
    modeInstruction,
  ].join(' ');
}

function buildSparriSystemPrompt() {
  return [
    'Olet Logos SPARRI, terävä ajattelun haastaja.',
    'Et ole yleinen avustaja, neuvoja tai yhteenvetäjä.',
    'Vastaa aina suomeksi ja vain pyydetyssä rakenteessa.',
    'Älä sisällytä yhteenvetoa, pääkohtia, neuvoja tai seuraavaa tekoa.',
    'Älä aloita kehulla, myötäilyllä tai ymmärtämisellä.',
    'Älä käytä sanoja: hyvä, hieno, mielenkiintoinen, ymmärrän, totta, loistava.',
    'Nimeä täsmälleen yksi käyttäjän oletus tai looginen hyppy.',
    'Selitä yhdessä lauseessa, miksi juuri tällä oletuksella on väliä.',
    'Kysy täsmälleen yksi kysymys.',
    'Kysymys ei saa olla kyllä/ei-kysymys eikä alkaa muodolla onko, voiko, pitäisikö, oletko, haluatko, kannattaako tai olisiko.',
    'Kysymyksen pitää pakottaa käyttäjä perustelemaan, tarkentamaan tai kehystämään oletus uudelleen.',
    'Pidä koko vastaus lyhyenä ja hieman epämukavana mutta hyödyllisenä.',
  ].join(' ');
}

function buildUserPayload(mode, input, context) {
  return {
    mode,
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

function extractOutputText(data) {
  if (data.output_text) return data.output_text;

  const outputText = data.output
    ?.flatMap((item) => item.content ?? [])
    .find((content) => content.type === 'output_text')?.text;

  if (!outputText) {
    throw new Error('OpenAI ei palauttanut luettavaa Logos-vastausta.');
  }

  return outputText;
}

function normalizeLogosOutput(output) {
  return {
    summary: output.summary ?? '',
    key_points: Array.isArray(output.key_points) ? output.key_points.slice(0, 4) : [],
    challenge_question: output.challenge_question ?? '',
    next_action: output.next_action ?? '',
  };
}

function normalizeSparriOutput(output) {
  return {
    type: 'sparri_challenge',
    detected_assumption: stripBannedOpeners(output.detected_assumption ?? ''),
    why_it_matters: stripBannedOpeners(output.why_it_matters ?? ''),
    challenge_question: stripBannedOpeners(output.challenge_question ?? ''),
  };
}

function normalizeChatOutput(output) {
  return {
    observation: output.observation ?? '',
    question: output.question ?? '',
    structured: {
      summary: output.structured?.summary ?? '',
      insight: output.structured?.insight ?? '',
      challenge: output.structured?.challenge ?? '',
      action: output.structured?.action ?? '',
    },
  };
}

function normalizeIntake(output) {
  return {
    mode: ['idea', 'sparri', 'analyysi', 'taito'].includes(output.mode) ? output.mode : 'idea',
    title: output.title?.trim() || 'Nimeton ajatus',
    tags: Array.isArray(output.tags)
      ? output.tags
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean)
          .slice(0, 3)
      : [],
  };
}

function stripBannedOpeners(value) {
  return value
    .replace(/^(hyvä|hieno|mielenkiintoinen|ymmärrän|totta|loistava)[\s,!:.–-]*/i, '')
    .trim();
}

async function readOpenAIError(response) {
  const fallback = `OpenAI-kutsu epäonnistui (${response.status}).`;

  try {
    const data = await response.json();
    return data.error?.message ? `${fallback} ${data.error.message}` : fallback;
  } catch {
    return fallback;
  }
}
