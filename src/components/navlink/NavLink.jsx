export default function NavLink({ icon, label, active = false, onClick, badge }) {
  const base = {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '11px 14px', borderRadius: 10, fontSize: 14, fontWeight: 500,
    cursor: 'pointer', textDecoration: 'none', border: '1px solid transparent',
    transition: 'background 0.15s, color 0.15s',
  };

  return (
    <a
      href="#"
      onClick={e => { if (onClick) { e.preventDefault(); onClick(); } else e.preventDefault(); }}
      style={active ? {
        ...base,
        background: 'linear-gradient(180deg, var(--coral-soft), var(--coral))',
        color: 'white',
        boxShadow: '0 6px 18px -8px var(--coral-glow), inset 0 1px 0 rgba(255,255,255,0.25)',
      } : { ...base, color: 'var(--ink-2)' }}
      onMouseEnter={e => { if (!active) Object.assign(e.currentTarget.style, { background: 'rgba(255,255,255,0.03)', color: 'var(--ink)' }); }}
      onMouseLeave={e => { if (!active) Object.assign(e.currentTarget.style, { background: '', color: 'var(--ink-2)' }); }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{icon}</span>
      <span>{label}</span>
      {badge && (
        <span style={{
          marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10, letterSpacing: '0.1em', opacity: 0.7,
        }}>
          {badge}
        </span>
      )}
    </a>
  );
}
