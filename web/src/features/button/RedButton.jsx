export default function RedButton({ onClickFunction, children }) {
  return (
    <button
      onClick={onClickFunction}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '13px 14px', borderRadius: 12, width: '100%',
        background: 'linear-gradient(180deg, var(--coral-soft), var(--coral))',
        color: 'white', fontWeight: 600, fontSize: 14, border: 0, cursor: 'pointer',
        boxShadow: '0 8px 22px -6px var(--coral-glow), inset 0 1px 0 rgba(255,255,255,0.28)',
        transition: 'transform 0.15s',
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" style={{ width: 14, height: 14, flexShrink: 0 }}>
        <path d="M12 5v14M5 12h14" />
      </svg>
      <span>{children}</span>
    </button>
  );
}
