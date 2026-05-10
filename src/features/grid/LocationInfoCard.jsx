export default function LocationInfoCard({
  label,
  value,
  suffix,
  icon,
  colSpan = 1,
  onClick,
  /** Texto enviado ao clipboard; se omitido, não exibe o botão copiar. */
  copyValue,
}) {
  const interactive = typeof onClick === "function";
  const copySource =
    copyValue != null && String(copyValue).trim() !== "" && String(copyValue).trim() !== "—"
      ? String(copyValue)
      : null;

  const handleCopy = async (e) => {
    e.stopPropagation();
    if (!copySource) return;
    try {
      await navigator.clipboard.writeText(copySource);
    } catch {
      /* clipboard pode falhar fora de HTTPS ou sem permissão */
    }
  };

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick(e);
              }
            }
          : undefined
      }
      style={{
        position: 'relative',
        background: 'var(--bg-4)', borderRadius: 10, padding: '10px 14px',
        gridColumn: colSpan === 2 ? 'span 2' : undefined,
        cursor: interactive ? 'pointer' : undefined,
        outline: interactive ? 'none' : undefined,
        transition: interactive ? 'background 0.12s, box-shadow 0.12s' : undefined,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
      onMouseEnter={interactive ? (e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; } : undefined}
      onMouseLeave={interactive ? (e) => { e.currentTarget.style.background = 'var(--bg-4)'; } : undefined}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
          letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-3)',
        }}>
          {label}
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginTop: 3,
        }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: 'var(--ink)',
            minWidth: 0, flex: 1, wordBreak: 'break-word',
          }}>
            {value}
            {suffix && (
              <span style={{ fontSize: 11, color: 'var(--ink-3)', marginLeft: 4 }}>{suffix}</span>
            )}
          </span>
          {icon && (
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--coral)', opacity: 0.5, flexShrink: 0 }}>
              {icon}
            </span>
          )}
        </div>
      </div>
      {copySource != null && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 10,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            aria-label="Copiar endereço"
            title="Copiar para a área de transferência"
            onClick={handleCopy}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 30,
              height: 30,
              padding: 0,
              borderRadius: 8,
              border: '1px solid transparent',
              background: 'transparent',
              color: 'var(--coral)',
              cursor: 'pointer',
              transition: 'background 0.12s, border-color 0.12s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,107,94,0.12)';
              e.currentTarget.style.borderColor = 'rgba(255,107,94,0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              content_copy
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
