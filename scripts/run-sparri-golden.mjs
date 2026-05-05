// Runs the SPARRI golden set through OpenAI and writes results.json.
// Closes the SPARRI Quality Audit loop: golden-set.json → engine → results.json.
//
// Usage:
//   OPENAI_API_KEY=sk-... npm run sparri:run
//   OPENAI_API_KEY=sk-... npm run sparri:run -- tests/sparri/results.json
//
// Environment:
//   OPENAI_API_KEY  — required (also accepts VITE_OPENAI_API_KEY)
//   OPENAI_MODEL    — optional, defaults to gpt-4o-mini (also accepts VITE_OPENAI_MODEL)

import fs from 'node:fs';
import path from 'node:path';
import {
  SPARRI_SCHEMA,
  buildSparriSystemPrompt,
  buildSparriUserPayload,
  extractOutputText,
  normalizeSparriOutput,
} from '../src/services/sparri.js';
import { SPARRI_OUTPUT_KEYS } from '../src/services/doctrine.js';

const OPENAI_API_URL = 'https://api.openai.com/v1/responses';
const root = process.cwd();
const goldenPath = path.join(root, 'tests/sparri/golden-set.json');

main();

async function main() {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    fail('OPENAI_API_KEY missing. Set OPENAI_API_KEY (or VITE_OPENAI_API_KEY) in the environment.');
  }

  const model = process.env.OPENAI_MODEL ?? process.env.VITE_OPENAI_MODEL ?? 'gpt-4o-mini';
  const outputArg = process.argv[2];
  const outputPath = path.resolve(root, outputArg ?? 'tests/sparri/results.json');

  const golden = readJson(goldenPath);
  if (!Array.isArray(golden) || golden.length === 0) {
    fail('Golden set is empty.');
  }

  console.log(`Running ${golden.length} SPARRI golden cases against ${model}...`);

  const results = [];
  const errors = [];

  for (const item of golden) {
    process.stdout.write(`- ${item.id} ... `);
    try {
      const output = await runOne(apiKey, model, item.input);
      results.push({ id: item.id, input: item.input, output });
      console.log('ok');
    } catch (error) {
      errors.push({ id: item.id, message: error.message });
      console.log(`FAIL: ${error.message}`);
    }
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify({ model, generated_at: new Date().toISOString(), results }, null, 2)}\n`);

  console.log(`\nWrote ${results.length}/${golden.length} results to ${path.relative(root, outputPath)}`);

  if (errors.length > 0) {
    console.error('\nErrors:');
    for (const e of errors) console.error(`- ${e.id}: ${e.message}`);
    process.exit(1);
  }

  console.log('\nNext: npm run validate:sparri -- ' + path.relative(root, outputPath));
}

async function runOne(apiKey, model, input) {
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: [
        { role: 'system', content: buildSparriSystemPrompt() },
        { role: 'user', content: JSON.stringify(buildSparriUserPayload(input), null, 2) },
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
    }),
  });

  if (!response.ok) {
    const detail = await readError(response);
    throw new Error(`OpenAI ${response.status}: ${detail}`);
  }

  const data = await response.json();
  const normalized = normalizeSparriOutput(JSON.parse(extractOutputText(data)));
  return Object.fromEntries(SPARRI_OUTPUT_KEYS.map((key) => [key, normalized[key]]));
}

async function readError(response) {
  try {
    const data = await response.json();
    return data.error?.message ?? `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`Could not read JSON from ${filePath}: ${error.message}`);
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
