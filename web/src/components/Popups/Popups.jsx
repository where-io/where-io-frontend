import './Popups.css';

function LoginPopup({ phase, data }) {
  const now = new Date();
  const sessionCode = `BR-${String(now.getMonth() + 1).padStart(2, '0')}${now.getFullYear().toString().slice(2)}-A${now.getHours()}`;

  return (
    <div className={`whereio-popup pop-login${phase === 'show' ? ' show' : phase === 'hiding' ? ' hide' : ''}`}>
      <div className="ring-stack">
        <div className="ring r1" />
        <div className="ring r2" />
        <div className="ring r3" />
        <div className="badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7" />
          </svg>
        </div>
        <div className="pin-mini">
          <svg width="20" height="26" viewBox="0 0 32 42">
            <path d="M16 41s13-13.5 13-25A13 13 0 1 0 3 16c0 11.5 13 25 13 25z" fill="#5EE0C8" />
            <circle cx="16" cy="16" r="4.5" fill="#0A1028" />
          </svg>
        </div>
      </div>

      <div className="eyebrow">// handshake completo</div>
      <h2>{data.isSignup ? 'Conta criada' : 'Atlas conectado'}</h2>
      <p>
        {data.isSignup
          ? 'Seu atlas foi criado. Comece marcando seu primeiro lugar no mapa.'
          : 'Bem-vindo de volta. Seus lugares estão sincronizados e prontos para explorar.'}
      </p>

      <div className="coords">
        <span className="k">Sessão</span>
        <span className="v">{sessionCode}</span>
        <span className="k" style={{ marginLeft: 'auto' }}>Status</span>
        <span className="v">autenticado</span>
      </div>

      <div className="progress" />

      <div className="footer-row">
        <span>// redirecionando</span>
        <span className="ok">› atlas/home</span>
      </div>
    </div>
  );
}

function LocationPopup({ phase, data, onHide }) {
  const lat = data.lat || (data.coords ? data.coords.split(',')[0]?.trim() : null);

  return (
    <div className={`whereio-popup pop-local${phase === 'show' ? ' show' : phase === 'hiding' ? ' hide' : ''}`}>
      <div className="mini-map">
        <svg className="r" viewBox="0 0 108 108" preserveAspectRatio="none">
          <path d="M-10 30 Q 30 40 60 50 T 120 70" stroke="rgba(255,255,255,0.18)" strokeWidth="2" fill="none" />
          <path d="M-10 70 Q 40 60 70 75 T 120 85" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" fill="none" />
          <path d="M30 -10 Q 35 40 50 70 T 60 120" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" fill="none" />
        </svg>
        <div className="pulse" />
        <div className="pin">
          <svg width="22" height="28" viewBox="0 0 32 42">
            <path d="M16 41s13-13.5 13-25A13 13 0 1 0 3 16c0 11.5 13 25 13 25z"
              fill="#8C7BFF" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
            <circle cx="16" cy="16" r="4.5" fill="white" />
          </svg>
        </div>
      </div>

      <div className="body">
        <div className="eyebrow">// novo pino · atlas</div>
        <h3>{data.name}</h3>
        <div className="meta">{data.address}</div>
        <div className="coords-line">
          {lat && <span>{lat}</span>}
          <span className="dash" />
          <span className="v">salvo</span>
        </div>
        <div className="auto-bar" />
      </div>

      <div className="actions">
        <button className="primary" onClick={onHide}>Ver no mapa</button>
        <button onClick={onHide}>Dispensar</button>
      </div>
    </div>
  );
}

function ErrorPopup({ phase, data, onHide }) {
  const codeDisplay = data.code ? `HTTP ${data.code}` : 'ERR_NET_TIMEOUT';

  function handleCopy() {
    navigator.clipboard?.writeText(codeDisplay).catch(() => {});
  }

  return (
    <div className={`whereio-popup pop-error${phase === 'show' ? ' show' : phase === 'hiding' ? ' hide' : ''}`}>
      <div className="icon-wrap">
        <div className="ring" />
        <div className="badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
            <path className="x1" d="M7 7l10 10" />
            <path className="x2" d="M17 7L7 17" />
          </svg>
        </div>
      </div>

      <div className="eyebrow">// erro de requisição</div>
      <h2>Não foi possível sincronizar</h2>
      <p>{data.message || 'Verifique sua conexão e tente novamente em alguns instantes.'}</p>

      <div className="err-code">
        <span className="k">Cód</span>
        <span className="v">{codeDisplay}</span>
        <button className="copy" onClick={handleCopy}>⧉ copiar</button>
      </div>

      <div className="row">
        <button className="pop-btn" onClick={onHide}>Cancelar</button>
        <button className="pop-btn primary" onClick={onHide}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 11-3-6.7L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

export default function Popups({ active, phase, onHide }) {
  if (!active) return null;

  const isModal = active.type === 'login' || active.type === 'error';
  const tint = active.type === 'login' ? 'tint-aqua' : active.type === 'error' ? 'tint-coral' : '';

  return (
    <>
      {isModal && (
        <div className={`whereio-backdrop ${tint}`} onClick={onHide} />
      )}
      {active.type === 'login' && (
        <LoginPopup key={active.key} phase={phase} data={active.data} onHide={onHide} />
      )}
      {active.type === 'location' && (
        <LocationPopup key={active.key} phase={phase} data={active.data} onHide={onHide} />
      )}
      {active.type === 'error' && (
        <ErrorPopup key={active.key} phase={phase} data={active.data} onHide={onHide} />
      )}
    </>
  );
}
