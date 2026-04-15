import { useEffect, useState } from 'preact/hooks';
import { render } from 'preact';
import type { CompanionPack } from '../types';
import { CollapseHandle } from './CollapseHandle';
import { Header } from './Header';
import { ChapterTabs } from './ChapterTabs';
import { ChapterView } from './ChapterView';
import { readCollapsed, writeCollapsed } from './storage';

interface Props {
  pack: CompanionPack;
  initialCollapsed?: boolean;
}

export function App({ pack, initialCollapsed }: Props) {
  const [collapsed, setCollapsed] = useState(
    initialCollapsed !== undefined ? initialCollapsed : readCollapsed()
  );
  const [currentChapterId, setCurrentChapterId] = useState(pack.chapters[0]!.id);

  useEffect(() => {
    if (initialCollapsed === undefined) writeCollapsed(collapsed);
  }, [collapsed, initialCollapsed]);

  if (collapsed) {
    return <CollapseHandle onExpand={() => setCollapsed(false)}/>;
  }
  return (
    <aside class="coopa-sidebar">
      <Header title={pack.questTitle} onCollapse={() => setCollapsed(true)}/>
      <ChapterTabs
        chapters={pack.chapters}
        currentId={currentChapterId}
        onChange={setCurrentChapterId}
      />
      <ChapterView
        chapter={pack.chapters.find(c => c.id === currentChapterId) ?? pack.chapters[0]!}
      />
    </aside>
  );
}

export async function mountApp(root: Element) {
  const pack = (await import('../companion-packs/flood-forecasting.json')).default;
  render(<App pack={pack as CompanionPack}/>, root);
}
