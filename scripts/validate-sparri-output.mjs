import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const goldenPath = path.join(root, 'tests/sparri/golden-set.json');
const bannedOpeners = ['hyvä', 'hieno', 'mielenkiintoinen', 'ymmärrän', 'totta', 'loistava'];
const bannedAdvice = ['kannattaa', 'voisit', 'tee', 'seuraavaksi', 'suosittelen'];
const yesNoQuestionOpeners = ['onko', 'voiko', 'pitäisikö', 'oletko', 'haluatko', 'kannattaako', 'olisiko'];
const allowedOutputKeys = ['detected_assumption', 'why_it_matters', 'challenge_question'];
const scoreKeys = ['assumption', 'single_question', 'no_sycophancy_or_advice', 'cognitive_force'];

main();

function main() {
  const args = process.argv.slice(2);
  const golden = readJson(goldenPath);

  validateGoldenSet(golden);

  if (args.includes('--golden-only')) {
    console.log(`SPARRI golden set OK: ${golden.length} cases`);
    return;
  }

  const responsePath = args[0];
  if (!responsePath) {
    console.log('Usage: npm run validate:sparri -- tests/sparri/results.json');
    console.log('Tip: run npm run validate:sparri:golden to validate only the golden set.');
    return;
  }

  const payload = readJson(path.resolve(root, responsePath));
  const results = Array.isArray(payload) ? payload : payload.results;

  if (!Array.isArray(results) || results.length === 0) {
    fail('Response file must contain a non-empty results array.');
  }

  validateResults(golden, results);
}

function validateGoldenSet(golden) {
  if (!Array.isArray(golden) || golden.length < 10) {
    fail('Golden set must contain at least 10 cases.');
  }

  const ids = new Set();

  for (const item of golden) {
    requireString(item.id, 'golden.id');
    requireString(item.category, `${item.id}.category`);
    requireString(item.input, `${item.id}.input`);
    requireString(item.expected_assumption_type, `${item.id}.expected_assumption_type`);
    requireString(item.expected_challenge_direction, `${item.id}.expected_challenge_direction`);

    if (ids.has(item.id)) fail(`Duplicate golden id: ${item.id}`);
    ids.add(item.id);
  }
}

function validateResults(golden, results) {
  const goldenById = new Map(golden.map((item) => [item.id, item]));
  const errors = [];
  const scoredResults = [];

  for (const result of results) {
    if (!goldenById.has(result.id)) {
      errors.push(`${result.id ?? '(missing id)'}: unknown golden id`);
      continue;
    }

    const output = result.output;
    const prefix = result.id;

    if (!output || typeof output !== 'object' || Array.isArray(output)) {
      errors.push(`${prefix}: output must be an object`);
      continue;
    }

    errors.push(...validateOutputShape(prefix, output));
    errors.push(...validateLanguageRules(prefix, output));

    if (result.manual_scores) {
      const score = validateManualScores(prefix, result.manual_scores, errors);
      if (score !== null) scoredResults.push({ id: result.id, score });
    }
  }

  if (errors.length > 0) {
    console.error('SPARRI validation failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log(`SPARRI structure validation OK: ${results.length} responses`);

  if (scoredResults.length > 0) {
    const passing = scoredResults.filter((item) => item.score >= 7).length;
    const target = Math.ceil(scoredResults.length * 0.8);

    for (const item of scoredResults) {
      console.log(`${item.id}: ${item.score}/8`);
    }

    if (passing < target) {
      fail(`Quality target missed: ${passing}/${scoredResults.length} responses scored at least 7/8; target is ${target}.`);
    }

    console.log(`SPARRI quality target OK: ${passing}/${scoredResults.length} responses scored at least 7/8`);
  } else {
    console.log('No manual_scores found; qualitative 0-8 scoring was not evaluated.');
  }
}

function validateOutputShape(prefix, output) {
  const errors = [];
  const keys = Object.keys(output);

  for (const key of keys) {
    if (!allowedOutputKeys.includes(key)) {
      errors.push(`${prefix}: unexpected output key "${key}"`);
    }
  }

  for (const key of allowedOutputKeys) {
    if (typeof output[key] !== 'string' || output[key].trim() === '') {
      errors.push(`${prefix}: ${key} must be a non-empty string`);
    }
  }

  return errors;
}

function validateLanguageRules(prefix, output) {
  const errors = [];
  const fullText = allowedOutputKeys.map((key) => output[key] ?? '').join('\n').toLowerCase();
  const opener = (output.detected_assumption ?? '').trim().toLowerCase();
  const question = (output.challenge_question ?? '').trim();
  const questionLower = question.toLowerCase();
  const questionMarks = (fullText.match(/\?/g) ?? []).length;

  if (questionMarks !== 1) {
    errors.push(`${prefix}: expected exactly one question mark, found ${questionMarks}`);
  }

  if (!question.endsWith('?')) {
    errors.push(`${prefix}: challenge_question must end with a question mark`);
  }

  if (yesNoQuestionOpeners.some((word) => questionLower.startsWith(`${word} `))) {
    errors.push(`${prefix}: challenge_question appears to be a yes/no question`);
  }

  for (const banned of bannedOpeners) {
    if (opener.startsWith(banned)) {
      errors.push(`${prefix}: detected_assumption starts with banned agreeable opener "${banned}"`);
    }
  }

  for (const banned of bannedAdvice) {
    const pattern = new RegExp(`(^|\\s)${escapeRegExp(banned)}(\\s|[,.!?;:]|$)`, 'i');
    if (pattern.test(fullText)) {
      errors.push(`${prefix}: contains banned advice phrase "${banned}"`);
    }
  }

  return errors;
}

function validateManualScores(prefix, scores, errors) {
  let total = 0;

  for (const key of scoreKeys) {
    const value = scores[key];

    if (!Number.isInteger(value) || value < 0 || value > 2) {
      errors.push(`${prefix}: manual_scores.${key} must be an integer from 0 to 2`);
      return null;
    }

    total += value;
  }

  return total;
}

function requireString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    fail(`${label} must be a non-empty string.`);
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
