import type { Chapter, Block } from '../types';
import { ExplainerBlock } from './blocks/ExplainerBlock';
import { TermBlock } from './blocks/TermBlock';
import { TipBlock } from './blocks/TipBlock';

interface Props {
  chapter: Chapter;
}

function renderBlock(block: Block, idx: number) {
  switch (block.type) {
    case 'explainer': return <ExplainerBlock key={idx} block={block}/>;
    case 'term': return <TermBlock key={idx} block={block}/>;
    case 'tip': return <TipBlock key={idx} block={block}/>;
  }
}

export function ChapterView({ chapter }: Props) {
  return (
    <section class="coopa-chapter-view" role="tabpanel">
      <h2 class="coopa-chapter-title">{chapter.title}</h2>
      <p class="coopa-chapter-summary">{chapter.summary}</p>
      <div class="coopa-blocks">
        {chapter.blocks.map(renderBlock)}
      </div>
    </section>
  );
}
