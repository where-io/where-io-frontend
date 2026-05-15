import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { usePopup } from '../context/PopupContext.jsx';

// ── Sub-components ──────────────────────────────────────────────

function OAuthButton({ children }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
        background: hovered ? 'var(--bg-2)' : 'var(--bg-3)',
        border: `1px solid ${hovered ? 'var(--ink-4)' : 'var(--line)'}`,
        color: 'var(--ink-2)', padding: '12px 14px', borderRadius: 11,
        fontSize: 13, fontWeight: 500, cursor: 'pointer',
        fontFamily: "'Inter', sans-serif", transition: 'all .15s',
      }}
    >
      {children}
    </button>
  );
}

const PINS = [
  { x: '30%', y: '32%', fill: '#FF6B5E', delay: '0.1s',  size: 32, check: false },
  { x: '55%', y: '24%', fill: '#8C7BFF', delay: '0.25s', size: 28, check: false },
  { x: '70%', y: '42%', fill: '#F2B95C', delay: '0.4s',  size: 28, check: false },
  { x: '38%', y: '62%', fill: '#5EE0C8', delay: '0.55s', size: 28, check: true  },
  { x: '62%', y: '62%', fill: '#FF6B9D', delay: '0.7s',  size: 28, check: false },
];

function VisualPane() {
  return (
    <aside style={{
      position: 'relative', overflow: 'hidden',
      background: `
        radial-gradient(circle at 25% 30%, #2d3a2a 0%, transparent 35%),
        radial-gradient(circle at 70% 70%, #3a2d28 0%, transparent 40%),
        radial-gradient(circle at 50% 50%, #2a2520 0%, transparent 50%),
        linear-gradient(135deg, #1f2620 0%, #2a2520 50%, #20201f 100%)
      `,
    }}>
      {/* Grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)',
        backgroundSize: '32px 32px',
      }} />

      {/* Roads */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 1200 900" preserveAspectRatio="none">
        <path d="M-50 200 Q 200 240 480 280 T 1250 380" stroke="rgba(255,255,255,0.06)" strokeWidth="3" fill="none"/>
        <path d="M-50 480 Q 250 460 540 510 T 1250 580" stroke="rgba(255,255,255,0.05)" strokeWidth="2.5" fill="none"/>
        <path d="M-50 700 Q 300 680 600 700 T 1250 780" stroke="rgba(255,255,255,0.05)" strokeWidth="2" fill="none"/>
        <path d="M180 -20 Q 220 200 260 450 T 320 920" stroke="rgba(255,255,255,0.05)" strokeWidth="2" fill="none"/>
        <path d="M620 -20 Q 580 250 540 500 T 480 920" stroke="rgba(255,255,255,0.05)" strokeWidth="2" fill="none"/>
        <path d="M900 -20 Q 940 250 980 500 T 1020 920" stroke="rgba(255,255,255,0.05)" strokeWidth="2" fill="none"/>
      </svg>

      {/* Edge gradient */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(110deg,rgba(10,16,40,0.55) 0%,transparent 30%,transparent 70%,rgba(10,16,40,0.4) 100%)',
      }} />

      {/* Live pill */}
      <div style={{
        position: 'absolute', top: 32, left: 32, zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '9px 14px', borderRadius: 999,
        background: 'rgba(94,224,200,0.12)', border: '1px solid rgba(94,224,200,0.25)',
        fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--aqua)',
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: 3, background: 'var(--aqua)',
          animation: 'loginPulse 1.6s ease-in-out infinite',
        }} />
        SP · -23.5505 · -46.6333 · Z14
      </div>

      {/* Stats */}
      <div style={{ position: 'absolute', top: 32, right: 32, display: 'flex', gap: 8, zIndex: 10 }}>
        {[['USERS', '2.4k'], ['PINS', '38k']].map(([k, v]) => (
          <span key={k} style={{
            padding: '7px 12px', borderRadius: 10,
            background: 'rgba(20,27,54,0.85)', backdropFilter: 'blur(12px)',
            border: '1px solid var(--line)',
            fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--ink-2)', letterSpacing: '0.04em',
          }}>
            <span style={{ color: 'var(--ink-3)', marginRight: 6, letterSpacing: '0.16em', textTransform: 'uppercase' }}>{k}</span>
            {v}
          </span>
        ))}
      </div>

      {/* Map pins */}
      {PINS.map((pin, i) => (
        <div key={i} style={{
          position: 'absolute', left: pin.x, top: pin.y,
          transform: 'translate(-50%,-100%)',
          filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.5))', zIndex: 5,
        }}>
          <svg
            width={pin.size} height={Math.round(pin.size * 1.3125)}
            viewBox="0 0 32 42" fill="none"
            style={{ display: 'block', animation: `pinDrop .6s cubic-bezier(.2,.9,.3,1.4) ${pin.delay} backwards` }}
          >
            <path d="M16 41s13-13.5 13-25A13 13 0 1 0 3 16c0 11.5 13 25 13 25z" fill={pin.fill} stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
            {pin.check
              ? <path d="M11 16l3.5 3.5L21 13" stroke="#0A1028" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
              : <circle cx="16" cy="16" r="4.5" fill="white"/>
            }
          </svg>
        </div>
      ))}

      {/* Quote */}
      <div style={{ position: 'absolute', top: '46%', right: 32, width: 280, zIndex: 8 }}>
        <div style={{
          fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
          letterSpacing: '0.18em', color: 'var(--coral)', textTransform: 'uppercase',
        }}>// your atlas</div>
        <h3 style={{
          fontFamily: "'Space Grotesk',sans-serif", fontWeight: 500,
          fontSize: 24, lineHeight: 1.18, letterSpacing: '-0.012em',
          margin: '10px 0 0', color: 'var(--ink)',
        }}>
          Cada lugar marcado<br />é uma história<br />que você escreve.
        </h3>
      </div>

      {/* Preview card */}
      <div style={{
        position: 'absolute', bottom: 32, left: 32, right: 108,
        padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14,
        background: 'rgba(20,27,54,0.85)', backdropFilter: 'blur(20px)',
        border: '1px solid var(--line)', borderRadius: 14, zIndex: 10,
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
          border: '1.5px solid var(--rose)', color: 'var(--rose)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
            <path d="M3 7h18l-2 13H5L3 7z"/>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 16, letterSpacing: '-0.01em' }}>
            Mocotó da Silva
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 3 }}>
            R. Aroaba · São Paulo · adicionado por você
          </div>
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
          color: 'var(--coral)', letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'right',
        }}>
          <span style={{ color: 'var(--aqua)', fontSize: 14, display: 'block', marginBottom: 2, letterSpacing: '0.04em' }}>1.2km</span>
          recente
        </div>
      </div>

      {/* Compass */}
      <div style={{
        position: 'absolute', bottom: 32, right: 32,
        width: 54, height: 54, borderRadius: '50%', zIndex: 10,
        border: '1px solid var(--line)',
        background: 'rgba(20,27,54,0.85)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--coral)',
      }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 22, height: 22 }}>
          <circle cx="12" cy="12" r="10"/>
          <path d="M14.7 9.3l-2.4 5.4-5.4 2.4 2.4-5.4 5.4-2.4z"/>
        </svg>
      </div>
    </aside>
  );
}

// ── Main page ────────────────────────────────────────────────────

const LABEL_STYLE = {
  fontFamily: "'JetBrains Mono',monospace",
  fontSize: 10, letterSpacing: '0.14em', color: 'var(--ink-3)',
  textTransform: 'uppercase', display: 'flex',
  justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
};

const INPUT_STYLE = {
  flex: 1, background: 'transparent', border: 0, outline: 'none',
  color: 'var(--ink)', fontSize: 14, padding: '13px 14px',
  fontFamily: "'Inter',sans-serif",
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated, authReady } = useAuth();
  const { showPopup } = usePopup();
  const [mode, setMode] = useState('signin');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [btnState, setBtnState] = useState('idle'); // 'idle' | 'loading' | 'done'
  const [focused, setFocused] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [error, setError] = useState('');

  const isSignup = mode === 'signup';

  useEffect(() => {
    if (!authReady || !isAuthenticated) return;
    const target = location.state?.from?.pathname || '/';
    navigate(target, { replace: true });
  }, [authReady, isAuthenticated, navigate, location.state]);

  function focus(name) {
    return { onFocus: () => setFocused(name), onBlur: () => setFocused(null) };
  }

  function wrapStyle(name) {
    const active = focused === name;
    return {
      position: 'relative', display: 'flex', alignItems: 'center',
      background: active ? 'var(--bg-2)' : 'var(--bg-3)',
      border: `1px solid ${active ? 'var(--coral)' : 'var(--line)'}`,
      borderRadius: 11,
      boxShadow: active ? '0 0 0 3px rgba(255,107,94,0.12)' : 'none',
      transition: 'border-color .15s,box-shadow .15s,background .15s',
    };
  }

  function leadIcon(name) {
    return {
      marginLeft: 14, width: 14, height: 14, flexShrink: 0,
      color: focused === name ? 'var(--coral)' : 'var(--ink-3)',
      transition: 'color .15s',
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBtnState('loading');
    try {
      const result = isSignup
        ? await register(email, password, nome, remember)
        : await login(email, password, remember);

      if (!result.ok) {
        setError(result.message || 'Não foi possível entrar.');
        setBtnState('idle');
        return;
      }

      setBtnState('done');
      showPopup('login', { isSignup });
      const target = location.state?.from?.pathname || '/';
      setTimeout(() => navigate(target, { replace: true }), 500);
    } catch (err) {
      setError(err?.message || 'Erro de rede. Verifique se a API está no ar.');
      setBtnState('idle');
    }
  }

  const btnLabel = btnState === 'done'
    ? '✓ Atlas pronto'
    : btnState === 'loading'
    ? 'Conectando…'
    : isSignup ? 'Criar conta' : 'Entrar no atlas';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(440px,1fr) 1.05fr',
      height: '100vh', background: 'var(--bg-0)',
    }}>
      {/* ── Left: form pane ── */}
      <section style={{
        background: 'var(--bg-1)', padding: '36px 56px',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 22, letterSpacing: '-0.01em' }}>
            WHERE<span style={{ color: 'var(--coral)' }}>·io</span>
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.18em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>
            // navigation system
          </div>
        </div>

        {/* Form area */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', maxWidth: 380, width: '100%', alignSelf: 'center',
        }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, letterSpacing: '0.18em', color: 'var(--coral)', textTransform: 'uppercase' }}>
            {isSignup ? '// new explorer' : '// secure handshake'}
          </div>

          <h1 style={{
            fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600,
            fontSize: 38, lineHeight: 1.05, letterSpacing: '-0.02em',
            margin: '14px 0 12px', color: 'var(--ink)',
          }}>
            {isSignup ? <>Crie seu<br />atlas.</> : <>Bem-vindo<br />de volta.</>}
          </h1>

          <p style={{ color: 'var(--ink-3)', fontSize: 13.5, lineHeight: 1.55, margin: '0 0 28px' }}>
            {isSignup
              ? 'Comece a marcar lugares, compartilhar rotas com amigos e construir o seu mapa pessoal.'
              : 'Acesse seu atlas pessoal — seus lugares, rotas e amigos esperam por você.'}
          </p>

          {/* Tab switcher — sliding coral pill */}
          <div style={{
            display: 'inline-flex', position: 'relative',
            background: 'var(--bg-3)',
            border: '1px solid var(--line)', borderRadius: 999,
            padding: 3, marginBottom: 24, alignSelf: 'flex-start',
          }}>
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: 3,
                bottom: 3,
                left: 3,
                width: 'calc((100% - 6px) / 2)',
                borderRadius: 999,
                background: 'var(--coral)',
                boxShadow: '0 4px 12px -4px var(--coral-glow)',
                transform: isSignup ? 'translateX(100%)' : 'translateX(0)',
                transition: 'transform 0.32s cubic-bezier(0.34, 1.34, 0.64, 1)',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(''); }}
              style={{
                position: 'relative', zIndex: 1, flex: 1,
                padding: '7px 16px', borderRadius: 999, border: 0,
                background: 'transparent',
                fontSize: 12, fontWeight: 500, cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                color: !isSignup ? 'white' : 'var(--ink-3)',
                transition: 'color 0.22s ease',
              }}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); }}
              style={{
                position: 'relative', zIndex: 1, flex: 1,
                padding: '7px 16px', borderRadius: 999, border: 0,
                background: 'transparent',
                fontSize: 12, fontWeight: 500, cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                color: isSignup ? 'white' : 'var(--ink-3)',
                transition: 'color 0.22s ease',
              }}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} autoComplete="off">
            {/* Name – signup only */}
            {isSignup && (
              <div style={{ marginBottom: 14 }}>
                <label style={LABEL_STYLE}>Nome</label>
                <div style={wrapStyle('name')} {...focus('name')}>
                  <svg style={leadIcon('name')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>
                  </svg>
                  <input type="text" placeholder="Seu nome" style={INPUT_STYLE} value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" />
                </div>
              </div>
            )}

            {/* Email */}
            <div style={{ marginBottom: 14 }}>
              <label style={LABEL_STYLE}>Usuário ou e-mail</label>
              <div style={wrapStyle('email')} {...focus('email')}>
                <svg style={leadIcon('email')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>
                </svg>
                <input type="email" placeholder="voce@email.com" style={INPUT_STYLE} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 14 }}>
              <label style={LABEL_STYLE}>
                Senha
                {!isSignup && (
                  <a href="#" style={{ textTransform: 'none', letterSpacing: 0, fontFamily: "'Inter',sans-serif", color: 'var(--coral)', fontSize: 11, textDecoration: 'none', fontWeight: 400 }}>
                    Esqueci a senha
                  </a>
                )}
              </label>
              <div style={wrapStyle('pw')} {...focus('pw')}>
                <svg style={leadIcon('pw')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>
                </svg>
                <input type={showPw ? 'text' : 'password'} placeholder="Mínimo 8 caracteres" style={INPUT_STYLE} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={isSignup ? 'new-password' : 'current-password'} />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{
                  background: 'transparent', border: 0, color: 'var(--ink-3)',
                  padding: '0 14px', height: '100%', display: 'flex', alignItems: 'center', cursor: 'pointer',
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                    {showPw
                      ? <><path d="M17.94 17.94A10 10 0 0112 20c-7 0-11-8-11-8a18 18 0 015.06-5.94"/><path d="M9.9 4.24A9 9 0 0112 4c7 0 11 8 11 8a18 18 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                      : <><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></>
                    }
                  </svg>
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '6px 0 22px' }}>
              <div onClick={() => setRemember(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', color: 'var(--ink-2)', fontSize: 12.5 }}>
                <span style={{
                  width: 16, height: 16, borderRadius: 5, flexShrink: 0,
                  border: `1.5px solid ${remember ? 'var(--coral)' : 'var(--line)'}`,
                  background: remember ? 'var(--coral)' : 'var(--bg-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s',
                }}>
                  {remember && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" style={{ width: 10, height: 10 }}>
                      <path d="M5 13l4 4 10-10"/>
                    </svg>
                  )}
                </span>
                Manter sessão ativa
              </div>
            </div>

            {error ? (
              <div style={{
                marginBottom: 14, padding: '10px 12px', borderRadius: 10,
                background: 'rgba(255,107,94,0.12)', border: '1px solid rgba(255,107,94,0.35)',
                color: 'var(--coral)', fontSize: 13, lineHeight: 1.45,
              }}>
                {error}
              </div>
            ) : null}

            {/* Submit button */}
            <button
              type="submit"
              disabled={btnState !== 'idle'}
              onMouseEnter={e => { if (btnState === 'idle') e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                width: '100%', border: 0, padding: '14px 18px', borderRadius: 12,
                background: 'linear-gradient(180deg,var(--coral-soft),var(--coral))',
                color: 'white', fontSize: 14, fontWeight: 600, cursor: btnState === 'idle' ? 'pointer' : 'default',
                fontFamily: "'Inter',sans-serif", transition: 'transform .15s',
                boxShadow: '0 8px 22px -6px var(--coral-glow),inset 0 1px 0 rgba(255,255,255,0.28)',
                opacity: btnState === 'loading' ? 0.85 : 1,
              }}
            >
              <span>{btnLabel}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" style={{ width: 14, height: 14 }}>
                <path d="M5 12h14M13 5l7 7-7 7"/>
              </svg>
            </button>

            {/* Divider */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, margin: '22px 0',
              fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
              letterSpacing: '0.18em', color: 'var(--ink-4)', textTransform: 'uppercase',
            }}>
              <span style={{ flex: 1, height: 1, background: 'var(--line)', display: 'block' }} />
              // ou continuar com
              <span style={{ flex: 1, height: 1, background: 'var(--line)', display: 'block' }} />
            </div>

            {/* OAuth */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <OAuthButton>
                <svg viewBox="0 0 24 24" style={{ width: 15, height: 15, flexShrink: 0 }}>
                  <path fill="#FFC107" d="M21.8 10.2H12v3.9h5.6c-.5 2.6-2.7 4.1-5.6 4.1a6.2 6.2 0 110-12.4c1.6 0 3 .6 4.1 1.5l2.8-2.8A10 10 0 1012 22a9.7 9.7 0 009.9-10c0-.7 0-1.2-.1-1.8z"/>
                </svg>
                Google
              </OAuthButton>
              <OAuthButton>
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 15, height: 15, flexShrink: 0 }}>
                  <path d="M16.4 12.4a4.3 4.3 0 012.1-3.6 4.5 4.5 0 00-3.5-1.9c-1.5-.2-2.9.9-3.7.9-.8 0-2-.9-3.2-.8a4.7 4.7 0 00-4 2.4c-1.7 3-.4 7.3 1.2 9.7.8 1.1 1.7 2.4 3 2.4s1.7-.8 3.2-.8 1.9.8 3.2.8 2.2-1.2 3-2.3a10 10 0 001.4-2.8 4.2 4.2 0 01-2.7-3.9zM14 4.6a4.3 4.3 0 001-3.1 4.4 4.4 0 00-2.8 1.5 4 4 0 00-1 3 3.6 3.6 0 002.8-1.4z"/>
                </svg>
                Apple
              </OAuthButton>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 'auto', paddingTop: 24, fontSize: 12.5, color: 'var(--ink-3)' }}>
          {isSignup ? 'Já tem conta? ' : 'Não tem conta? '}
          <a
            href="#"
            onClick={e => { e.preventDefault(); setMode(isSignup ? 'signin' : 'signup'); setError(''); }}
            style={{ color: 'var(--coral)', textDecoration: 'none', fontWeight: 500 }}
          >
            {isSignup ? 'Fazer login' : 'Criar uma agora'}
          </a>
          <div style={{
            fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, letterSpacing: '0.14em',
            color: 'var(--ink-4)', marginTop: 18, textTransform: 'uppercase', display: 'flex', gap: 14,
          }}>
            {['// Termos', '// Privacidade', '// Status'].map(t => (
              <a key={t} href="#" style={{ color: 'var(--ink-3)', textDecoration: 'none' }}>{t}</a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Right: visual pane ── */}
      <VisualPane />

      <style>{`
        @keyframes pinDrop {
          from { opacity: 0; transform: translateY(-30px) scale(0.9); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes loginPulse {
          0%,100% { box-shadow: 0 0 0 4px rgba(94,224,200,0.18); }
          50%      { box-shadow: 0 0 0 8px rgba(94,224,200,0.05); }
        }
      `}</style>
    </div>
  );
}
