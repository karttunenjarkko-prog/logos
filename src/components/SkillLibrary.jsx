import React from 'react';
import { INITIAL_SKILLS } from '../data/skills.js';

export default function SkillLibrary({ onStartSkill }) {
  return (
    <section className="view" aria-labelledby="skills-heading">
      <div className="view-header compact-header">
        <p className="eyebrow">Taidot</p>
        <h1 id="skills-heading">Taitokirjasto</h1>
        <p className="lead">Valitse harjoittelun kohde tai käytä kysymyksiä seuraavan session sytykkeenä.</p>
      </div>

      <div className="skill-grid">
        {INITIAL_SKILLS.map((skill) => (
          <article className="skill-card" key={skill.id}>
            <div>
              <h2>{skill.name}</h2>
              <p>{skill.summary}</p>
            </div>
            <ul>
              {skill.prompts.map((prompt) => (
                <li key={prompt}>{prompt}</li>
              ))}
            </ul>
            <button className="secondary-button" type="button" onClick={() => onStartSkill(skill)}>
              Harjoittele
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
