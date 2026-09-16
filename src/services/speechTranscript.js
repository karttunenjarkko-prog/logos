export function normalizeSpeech(value) {
  return value.replace(/\s+/g, ' ').trim();
}

export const STOP_COMMAND = /(?:^|\s)(?:tallenna|lopeta|siin[aä] kaikki)(?:\s+ja)?[.!?]?\s*$/i;

export function hasStopCommand(transcript) {
  return STOP_COMMAND.test(normalizeSpeech(transcript));
}

export function removeStopCommand(transcript) {
  return normalizeSpeech(transcript).replace(STOP_COMMAND, '').trim();
}

export function updateRecognitionResults(previousResults, event) {
  const nextResults = previousResults.slice(0, event.results.length);

  for (let index = event.resultIndex; index < event.results.length; index += 1) {
    const result = event.results[index];
    nextResults[index] = {
      transcript: normalizeSpeech(result[0]?.transcript ?? ''),
      isFinal: Boolean(result.isFinal),
    };
  }

  return nextResults;
}

export function composeRecognitionTranscript(committedTranscript, recognitionResults) {
  const sessionResults = selectSessionResults(recognitionResults);
  const finalParts = [];
  const interimParts = [];

  for (const result of sessionResults) {
    if (!result?.transcript) continue;

    if (result.isFinal) {
      finalParts.push(result.transcript);
    } else {
      interimParts.push(result.transcript);
    }
  }

  const finalTranscript = normalizeSpeech([committedTranscript, ...finalParts].filter(Boolean).join(' '));
  const interimTranscript = normalizeSpeech(interimParts.join(' '));

  return {
    finalTranscript,
    interimTranscript,
    combinedTranscript: normalizeSpeech(`${finalTranscript} ${interimTranscript}`),
  };
}

export function commitSessionResults(committedTranscript, recognitionResults) {
  return composeRecognitionTranscript(committedTranscript, recognitionResults).combinedTranscript;
}

function selectSessionResults(recognitionResults) {
  const populatedResults = recognitionResults.filter((result) => result?.transcript);
  if (populatedResults.length <= 1) return populatedResults;

  // A non-continuous recognition session represents one utterance. Android
  // Chrome can expose its growing partial hypotheses as multiple result slots
  // with the same finality. In that case the latest slot supersedes the older
  // hypotheses; they are not separate spoken segments.
  const firstFinality = populatedResults[0].isFinal;
  if (populatedResults.every((result) => result.isFinal === firstFinality)) {
    return [populatedResults.at(-1)];
  }

  return populatedResults.reduce((segments, result) => {
    const previous = segments.at(-1);
    if (previous && isGrowingHypothesis(previous.transcript, result.transcript)) {
      segments[segments.length - 1] = result;
    } else {
      segments.push(result);
    }
    return segments;
  }, []);
}

function isGrowingHypothesis(previousTranscript, currentTranscript) {
  const previous = normalizeSpeech(previousTranscript).toLocaleLowerCase('fi-FI');
  const current = normalizeSpeech(currentTranscript).toLocaleLowerCase('fi-FI');
  return current === previous || current.startsWith(`${previous} `);
}
