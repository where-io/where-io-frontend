export default function LocationInfoCard({ label, value, suffix, icon, colSpan = 1 }) {
  return (
    <div
      style={{
        background: 'var(--bg-4)', borderRadius: 10, padding: '10px 14px',
        gridColumn: colSpan === 2 ? 'span 2' : undefined,
      }}
    >
      <div style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
        letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-3)',
      }}>
        {label}
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 3,
      }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: 'var(--ink)' }}>
          {value}
          {suffix && (
            <span style={{ fontSize: 11, color: 'var(--ink-3)', marginLeft: 4 }}>{suffix}</span>
          )}
        </span>
        {icon && (
          <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--coral)', opacity: 0.5 }}>
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}
