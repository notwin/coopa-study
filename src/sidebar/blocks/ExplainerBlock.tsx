import type { ExplainerBlock as Block } from '../../types';

interface Props { block: Block; }

export function ExplainerBlock({ block }: Props) {
  return (
    <article class="coopa-block coopa-block--explainer">
      <h3>{block.title}</h3>
      <p>{block.body}</p>
    </article>
  );
}
