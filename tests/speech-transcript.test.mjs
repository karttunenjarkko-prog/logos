import assert from 'node:assert/strict';
import test from 'node:test';
import {
  commitSessionResults,
  composeRecognitionTranscript,
  hasStopCommand,
  removeStopCommand,
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

  state = updateRecognitionResults(state, event(0, [result('podcastissa oli')]));
  assert.equal(composeRecognitionTranscript('', state).combinedTranscript, 'podcastissa oli');

  state = updateRecognitionResults(state, event(0, [result('podcastissa oli todella')]));
  assert.equal(composeRecognitionTranscript('', state).combinedTranscript, 'podcastissa oli todella');

  state = updateRecognitionResults(
    state,
    event(0, [result('podcastissa oli todella hyvä kohta', true)]),
  );
  assert.equal(composeRecognitionTranscript('', state).finalTranscript, 'podcastissa oli todella hyvä kohta');
});

test('a later interim result index replaces its earlier hypothesis', () => {
  let state = updateRecognitionResults(
    [],
    event(0, [result('podcastissa oli todella hyvä kohta', true), result('jota')]),
  );
  assert.equal(
    composeRecognitionTranscript('', state).combinedTranscript,
    'podcastissa oli todella hyvä kohta jota',
  );

  state = updateRecognitionResults(
    state,
    event(1, [result('podcastissa oli todella hyvä kohta', true), result('jota haluan miettiä')]),
  );
  assert.equal(
    composeRecognitionTranscript('', state).combinedTranscript,
    'podcastissa oli todella hyvä kohta jota haluan miettiä',
  );
});

test('intentional repeated words are preserved', () => {
  const state = updateRecognitionResults([], event(0, [result('Tämä oli todella todella hyvä.', true)]));
  assert.equal(composeRecognitionTranscript('', state).finalTranscript, 'Tämä oli todella todella hyvä.');
});

test('Android cumulative final slots resolve to the latest session hypothesis', () => {
  let state = updateRecognitionResults([], event(0, [result('podcastissa', true)]));
  state = updateRecognitionResults(
    state,
    event(1, [result('podcastissa', true), result('podcastissa oli', true)]),
  );
  state = updateRecognitionResults(
    state,
    event(2, [
      result('podcastissa', true),
      result('podcastissa oli', true),
      result('podcastissa oli todella', true),
    ]),
  );

  assert.equal(composeRecognitionTranscript('', state).combinedTranscript, 'podcastissa oli todella');
});

test('long capture commits each non-continuous recognition session once', () => {
  let committed = '';
  const expectedParts = [];

  for (let index = 0; index < 120; index += 1) {
    expectedParts.push(`osuus-${index}`);
    const session = updateRecognitionResults([], event(0, [result(`osuus-${index}`, true)]));
    committed = commitSessionResults(committed, session);
  }

  assert.equal(committed, expectedParts.join(' '));
});

test('a new capture starts without the previous capture transcript', () => {
  const previousState = updateRecognitionResults([], event(0, [result('Ensimmäinen ajatus.', true)]));
  assert.equal(composeRecognitionTranscript('', previousState).finalTranscript, 'Ensimmäinen ajatus.');

  const newState = updateRecognitionResults([], event(0, [result('Toinen ajatus.', true)]));
  assert.equal(composeRecognitionTranscript('', newState).finalTranscript, 'Toinen ajatus.');
});

test('automatic restart commits prior finals once and resets result indexes', () => {
  const firstSession = updateRecognitionResults([], event(0, [result('Ensimmäinen osuus.', true)]));
  const committed = commitSessionResults('', firstSession);

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

test('voice command is detected once and removed from saved thought', () => {
  const commandSession = updateRecognitionResults(
    [],
    event(0, [result('opeta', true), result('opeta ja', true), result('Lopeta ja', true)]),
  );
  const transcript = composeRecognitionTranscript(
    'Podcastissa oli todella hyvä kohta.',
    commandSession,
  ).combinedTranscript;

  assert.equal(transcript, 'Podcastissa oli todella hyvä kohta. Lopeta ja');
  assert.equal(hasStopCommand(transcript), true);
  assert.equal(removeStopCommand(transcript), 'Podcastissa oli todella hyvä kohta.');
});
