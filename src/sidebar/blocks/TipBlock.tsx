import type { TipBlock as Block } from '../../types';

interface Props { block: Block; }

export function TipBlock({ block }: Props) {
  return (
    <aside class="coopa-block coopa-block--tip">
      <p>{block.body}</p>
    </aside>
  );
}
