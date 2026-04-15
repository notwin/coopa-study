interface Props {
  title: string;
  onCollapse: () => void;
}

export function Header({ title, onCollapse }: Props) {
  return (
    <header class="coopa-header">
      <h1>中文伴读 · {title}</h1>
      <button
        class="coopa-collapse-btn"
        aria-label="收起伴读"
        onClick={onCollapse}
      >×</button>
    </header>
  );
}
