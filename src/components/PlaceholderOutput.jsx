import React from 'react';

export default function PlaceholderOutput({ output, title = 'Luonnosvastaukset' }) {
  if (output?.type === 'sparri_challenge') {
    return <SparriOutput output={output} title={title} />;
  }

  const content = output ?? {
    summary: 'Yhteenveto ilmestyy tähän, kun tekoälyintegraatio lisätään.',
    key_points: [
      'Logos Brain tiivistää olennaisen.',
      'Vastaus rajataan 3-4 pääkohtaan.',
      'Mukana on aina yksi haastava kysymys.',
    ],
    challenge_question: 'Mikä olisi seuraava rehellinen mutta riittävän pieni askel?',
    next_action: 'Lisää OpenAI API-avain ja tallenna sessio.',
  };
  const keyPoints = content.key_points ?? (content.keyInsight ? [content.keyInsight] : []);
  const challengeQuestion = content.challenge_question ?? content.challengeQuestion;
  const nextAction = content.next_action ?? content.nextAction;

  return (
    <aside className="output-panel" aria-labelledby="output-heading">
      <h2 id="output-heading">{title}</h2>
      <OutputBlock label="Yhteenveto" value={content.summary} />
      <OutputList label="Pääkohdat" items={keyPoints} />
      <OutputBlock label="Haastava kysymys" value={challengeQuestion} />
      <OutputBlock label="Ehdotettu seuraava teko" value={nextAction} />
    </aside>
  );
}

function SparriOutput({ output, title }) {
  return (
    <aside className="output-panel sparri-output-panel" aria-labelledby="output-heading">
      <h2 id="output-heading">{title}</h2>
      <OutputBlock label="Tunnistettu oletus" value={output.detected_assumption} />
      <OutputBlock label="Miksi sillä on väliä" value={output.why_it_matters} />
      <OutputBlock label="Logoksen kysymys" value={output.challenge_question} />
    </aside>
  );
}

function OutputBlock({ label, value }) {
  return (
    <div className="output-block">
      <h3>{label}</h3>
      <p>{value}</p>
    </div>
  );
}

function OutputList({ label, items }) {
  return (
    <div className="output-block">
      <h3>{label}</h3>
      <ul className="output-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
