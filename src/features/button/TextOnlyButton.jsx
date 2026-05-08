export default function TextOnlyButton({ onClickFunction, children }) {
  return (
    <button
      type="button"
      onClick={onClickFunction}
      style={{
        background: 'transparent', color: 'var(--ink-2)',
        border: '1px solid var(--line)', padding: '11px 18px',
        borderRadius: 999, fontSize: 13, cursor: 'pointer', fontWeight: 500,
      }}
    >
      {children}
    </button>
  );
}
