import { useState } from 'preact/hooks';
import type { TermBlock as Block } from '../../types';

interface Props { block: Block; }

export function TermBlock({ block }: Props) {
  const [flipped, setFlipped] = useState(false);
  return (
    <article class={`coopa-block coopa-block--term${flipped ? ' is-flipped' : ''}`}>
      <button class="coopa-term-front" onClick={() => setFlipped(true)} aria-expanded={flipped}>
        <strong>{block.term}</strong>
        <span class="coopa-term-en">{block.en}</span>
      </button>
      {flipped && (
        <div class="coopa-term-back" onClick={() => setFlipped(false)}>
          <p>{block.definition}</p>
          <p class="coopa-term-analogy">{block.analogy}</p>
        </div>
      )}
    </article>
  );
}
