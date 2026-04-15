import { useState } from 'preact/hooks';
import { render } from 'preact';
import type { CompanionPack } from '../types';
import { CollapseHandle } from './CollapseHandle';
import { Header } from './Header';

interface Props {
  pack: CompanionPack;
  initialCollapsed?: boolean;
}

export function App({ pack, initialCollapsed = true }: Props) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  if (collapsed) {
    return <CollapseHandle onExpand={() => setCollapsed(false)}/>;
  }
  return (
    <aside class="coopa-sidebar">
      <Header title={pack.questTitle} onCollapse={() => setCollapsed(true)}/>
      {/* ChapterTabs + ChapterView 由后续 task 补 */}
    </aside>
  );
}

export async function mountApp(root: Element) {
  const pack = (await import('../companion-packs/flood-forecasting.json')).default;
  render(<App pack={pack as CompanionPack}/>, root);
}
