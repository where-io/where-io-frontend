import { useEffect, useRef, useState } from 'react';

const DURATION = 4200;

const TYPE = {
  success: {
    color: '#4DE1C1',
    bg: 'rgba(77,225,193,0.10)',
    border: 'rgba(77,225,193,0.28)',
    defaultTitle: 'Acesso autorizado',
    prefix: 'AUTH',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
        style={{ width: 14, height: 14 }}>
        <path d="M12 2l9 4v6c0 5-4 9-9 10C7 21 3 17 3 12V6l9-4z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  location: {
    color: '#FF6B5E',
    bg: 'rgba(255,107,94,0.10)',
    border: 'rgba(255,107,94,0.28)',
    defaultTitle: 'Local registrado',
    prefix: 'MAP',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
        style={{ width: 14, height: 14 }}>
        <path d="M12 22s-8-7.5-8-13A8 8 0 1120 9c0 5.5-8 13-8 13z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
    ),
  },
  error: {
    color: '#FF3B3B',
    bg: 'rgba(255,59,59,0.10)',
    border: 'rgba(255,59,59,0.28)',
    defaultTitle: 'Erro na requisição',
    prefix: 'HTTP',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
        style={{ width: 14, height: 14 }}>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <circle cx="12" cy="16" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
};

function ToastItem({ toast, onDismiss }) {
  const cfg = TYPE[toast.type] ?? TYPE.error;
  const [progress, setProgress] = useState(100);
  const startRef = useRef(Date.now());
  const rafRef = useRef(null);

  useEffect(() => {
    function tick() {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.max(0, 100 - (elapsed / DURATION) * 100);
      setProgress(pct);
      if (pct > 0) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const statusChip = toast.statusCode != null
    ? `// ${cfg.prefix} ${toast.statusCode}`
    : null;

  return (
    <div
      className="toast-item"
      style={{
        position: 'relative',
        display: 'flex',
        overflow: 'hidden',
        width: 340,
        background: 'rgba(14,19,44,0.97)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${cfg.border}`,
        borderRadius: 14,
        boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.35)',
      }}
    >
      {/* Left accent bar */}
      <div style={{
        width: 3,
        alignSelf: 'stretch',
        background: cfg.color,
        flexShrink: 0,
        borderRadius: '2px 0 0 2px',
      }} />

      {/* Body */}
      <div style={{ flex: 1, padding: '14px 14px 18px 14px', minWidth: 0 }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}>
          {/* Icon circle */}
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: cfg.bg,
            border: `1px solid ${cfg.border}`,
            color: cfg.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {cfg.icon}
          </div>

          {/* Title */}
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 600, fontSize: 13.5, color: 'var(--ink)',
            letterSpacing: '-0.008em', flex: 1, minWidth: 0,
          }}>
            {toast.title ?? cfg.defaultTitle}
          </span>

          {/* Dismiss button */}
          <button
            onClick={() => onDismiss(toast.id)}
            style={{
              background: 'transparent', border: 0, padding: '2px 2px',
              cursor: 'pointer', color: 'var(--ink-4)', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 6, transition: 'color .12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--ink-2)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-4)'; }}
            aria-label="Fechar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
              style={{ width: 13, height: 13 }}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Message */}
        <p style={{
          margin: 0,
          fontFamily: "'Inter', sans-serif",
          fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.5,
        }}>
          {toast.message}
        </p>

        {/* Status chip */}
        {statusChip && (
          <div style={{
            marginTop: 8,
            display: 'inline-block',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, letterSpacing: '0.12em',
            color: cfg.color, opacity: 0.8,
          }}>
            {statusChip}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 3, right: 0, height: 2,
        background: `${cfg.color}20`,
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: cfg.color,
          borderRadius: 1,
          transition: 'width 100ms linear',
        }} />
      </div>
    </div>
  );
}

export default function ToastStack({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;
  return (
    <>
      <style>{`
        @keyframes toast-slide-in {
          from { opacity: 0; transform: translateX(20px) scale(0.97); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        .toast-item {
          animation: toast-slide-in 240ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>
      <div style={{
        position: 'fixed', bottom: 24, right: 24,
        zIndex: 99999,
        display: 'flex', flexDirection: 'column', gap: 10,
        alignItems: 'flex-end',
        pointerEvents: 'none',
      }}>
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem toast={t} onDismiss={onDismiss} />
          </div>
        ))}
      </div>
    </>
  );
}
