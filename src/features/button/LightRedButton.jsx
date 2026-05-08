export default function LightRedButton({ type, onClickFunction, children }) {
  return (
    <button
      type={type}
      onClick={onClickFunction}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'linear-gradient(180deg, var(--coral-soft), var(--coral))',
        color: 'white', border: 0, padding: '11px 18px', borderRadius: 999,
        fontSize: 13, fontWeight: 500, cursor: 'pointer',
        boxShadow: '0 8px 22px -6px var(--coral-glow), inset 0 1px 0 rgba(255,255,255,0.28)',
      }}
    >
      {children}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ width: 13, height: 13 }}>
        <path d="M5 12h14M13 5l7 7-7 7" />
      </svg>
    </button>
  );
}
