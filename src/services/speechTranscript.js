export function normalizeSpeech(value) {
  return value.replace(/\s+/g, ' ').trim();
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
  const finalParts = [];
  const interimParts = [];

  for (const result of recognitionResults) {
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

export function commitFinalResults(committedTranscript, recognitionResults) {
  return composeRecognitionTranscript(committedTranscript, recognitionResults).finalTranscript;
}
