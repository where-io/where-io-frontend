export default function FormField({ label, icon, children }) {
  return (
    <>
      <label style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
        letterSpacing: '0.14em', color: 'var(--ink-3)',
        textTransform: 'uppercase', display: 'block', marginBottom: 8,
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        {icon && (
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              fontSize: 14, color: 'var(--ink-3)', pointerEvents: 'none',
            }}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        {children}
      </div>
    </>
  );
}
