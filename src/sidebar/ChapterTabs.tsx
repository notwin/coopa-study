import type { Chapter } from '../types';

interface Props {
  chapters: Chapter[];
  currentId: string;
  onChange: (id: string) => void;
}

export function ChapterTabs({ chapters, currentId, onChange }: Props) {
  return (
    <nav class="coopa-chapter-tabs" role="tablist">
      {chapters.map(c => (
        <button
          key={c.id}
          role="tab"
          aria-selected={c.id === currentId}
          class={`coopa-chapter-tab${c.id === currentId ? ' is-current' : ''}`}
          onClick={() => onChange(c.id)}
        >
          {c.title}
        </button>
      ))}
    </nav>
  );
}
