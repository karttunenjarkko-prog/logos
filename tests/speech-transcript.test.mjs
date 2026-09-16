import assert from 'node:assert/strict';
import test from 'node:test';
import {
  commitFinalResults,
  composeRecognitionTranscript,
  updateRecognitionResults,
} from '../src/services/speechTranscript.js';

function result(transcript, isFinal = false) {
  return { 0: { transcript }, isFinal, length: 1 };
}

function event(resultIndex, results) {
  return { resultIndex, results };
}

test('progressive interim hypotheses replace the same result index', () => {
  let state = [];
  state = updateRecognitionResults(state, event(0, [result('podcastissa')]));
  assert.equal(composeRecognitionTranscript('', state).combinedTranscript, 'podcastissa');

  state = updateRecognitionResults(state, event(0, [result('podcastissa oli todella')]));
  assert.equal(composeRecognitionTranscript('', state).combinedTranscript, 'podcastissa oli todella');

  state = updateRecognitionResults(
    state,
    event(0, [result('podcastissa oli todella hyvä kohta mitä haluan miettiä tarkemmin.', true)]),
  );
  assert.equal(
    composeRecognitionTranscript('', state).finalTranscript,
    'podcastissa oli todella hyvä kohta mitä haluan miettiä tarkemmin.',
  );
});

test('short pauses do not append previously returned final results again', () => {
  let state = updateRecognitionResults([], event(0, [result('Tämä', true)]));
  state = updateRecognitionResults(state, event(1, [result('Tämä', true), result('on ajatus')]));
  state = updateRecognitionResults(
    state,
    event(0, [result('Tämä', true), result('on ajatus jota haluan kehittää.', true)]),
  );

  assert.equal(composeRecognitionTranscript('', state).finalTranscript, 'Tämä on ajatus jota haluan kehittää.');
});

test('intentional repeated words are preserved', () => {
  const state = updateRecognitionResults([], event(0, [result('Tämä oli todella todella hyvä.', true)]));
  assert.equal(composeRecognitionTranscript('', state).finalTranscript, 'Tämä oli todella todella hyvä.');
});

test('long recognition sessions keep each indexed final result exactly once', () => {
  let state = [];
  const expectedParts = [];

  for (let index = 0; index < 120; index += 1) {
    expectedParts.push(`osuus-${index}`);
    const fullSnapshot = expectedParts.map((part) => result(part, true));
    state = updateRecognitionResults(state, event(0, fullSnapshot));
  }

  assert.equal(composeRecognitionTranscript('', state).finalTranscript, expectedParts.join(' '));
});

test('a new capture starts without the previous capture transcript', () => {
  const previousState = updateRecognitionResults([], event(0, [result('Ensimmäinen ajatus.', true)]));
  assert.equal(composeRecognitionTranscript('', previousState).finalTranscript, 'Ensimmäinen ajatus.');

  const newState = updateRecognitionResults([], event(0, [result('Toinen ajatus.', true)]));
  assert.equal(composeRecognitionTranscript('', newState).finalTranscript, 'Toinen ajatus.');
});

test('automatic restart commits prior finals once and resets result indexes', () => {
  const firstSession = updateRecognitionResults([], event(0, [result('Ensimmäinen osuus.', true)]));
  const committed = commitFinalResults('', firstSession);

  let restartedSession = updateRecognitionResults([], event(0, [result('Toinen')]));
  assert.equal(
    composeRecognitionTranscript(committed, restartedSession).combinedTranscript,
    'Ensimmäinen osuus. Toinen',
  );

  restartedSession = updateRecognitionResults(restartedSession, event(0, [result('Toinen osuus.', true)]));
  assert.equal(
    composeRecognitionTranscript(committed, restartedSession).finalTranscript,
    'Ensimmäinen osuus. Toinen osuus.',
  );
});
