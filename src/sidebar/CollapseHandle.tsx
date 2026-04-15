interface Props {
  onExpand: () => void;
}

export function CollapseHandle({ onExpand }: Props) {
  return (
    <button
      class="coopa-collapse-handle"
      aria-label="展开伴读"
      onClick={onExpand}
    >
      <span aria-hidden="true">伴</span>
    </button>
  );
}
