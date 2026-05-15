export default function LightRedInfoCard({ reviewNumber, reviewLabel, data }) {
  const porcentagem = (reviewNumber / 5) * 100;

  return (
    <div style={{
      background: 'rgba(255,107,94,0.06)', borderRadius: 10, padding: '14px 16px',
      border: '1px solid rgba(255,107,94,0.15)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
          color: 'var(--ink-3)', letterSpacing: '0.1em',
        }}>
          {data}
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ width: 13, height: 13, color: 'var(--coral)', flexShrink: 0 }}>
          <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7l3-7z" />
        </svg>
      </div>

      <div style={{ position: 'relative', display: 'inline-block', fontSize: 18, marginBottom: 6 }}>
        <div style={{ color: 'var(--ink-4)' }}>{'★'.repeat(5)}</div>
        <div style={{
          position: 'absolute', top: 0, left: 0, overflow: 'hidden',
          color: 'var(--coral)', width: `${porcentagem}%`, transition: 'width 0.4s',
        }}>
          {'★'.repeat(5)}
        </div>
      </div>

      {reviewLabel && (
        <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 2 }}>{reviewLabel}</div>
      )}
    </div>
  );
}
