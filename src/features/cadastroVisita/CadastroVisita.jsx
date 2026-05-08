import { useState } from "react";
import FormSign from "../../components/navlink/Form/FormSign.jsx";
import FormField from "../../components/navlink/Form/FormField.jsx";
import { VisitaService } from "../../service/VisitaService";

const inputStyle = {
  width: '100%', background: 'var(--bg-4)', border: '1px solid transparent',
  borderRadius: 10, padding: '12px 14px', color: 'var(--ink-2)', fontSize: 13,
  outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
  fontFamily: "'Inter', sans-serif",
};

function StyledInput({ value, onChange, type = "text" }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      style={{
        ...inputStyle,
        ...(focused ? { borderColor: 'var(--coral)', boxShadow: '0 0 0 3px rgba(255,107,94,0.12)', color: 'var(--ink)' } : {}),
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function StyledTextarea({ value, onChange, placeholder, rows }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      style={{
        ...inputStyle, resize: 'none', minHeight: 100,
        ...(focused ? { borderColor: 'var(--coral)', boxShadow: '0 0 0 3px rgba(255,107,94,0.12)', color: 'var(--ink)' } : {}),
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

export default function CadastroVisita({ idLocalVar, onClose, onSaved }) {
  const [data, setData] = useState("");
  const [avaliacao, setAvaliacao] = useState(0);
  const [comentario, setComentario] = useState("");
  const [hoverAvaliacao, setHoverAvaliacao] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleDiscard() { if (onClose) onClose(); }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = { dataVisita: data, avaliacao, comentario, idLocal: idLocalVar };
    const response = await VisitaService.create(payload);
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Falha ao salvar visita (${response.status}): ${errorBody}`);
    }
    if (onSaved) onSaved(idLocalVar);
    if (onClose) onClose();
    setIsSubmitting(false);
  }

  return (
    <FormSign>
      <div style={{ position: 'relative' }}>
        {/* Modal */}
        <div style={{
          width: 760, maxWidth: 'calc(100vw - 80px)',
          background: 'var(--bg-2)', border: '1px solid var(--line)',
          borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 40px 100px rgba(0,0,0,0.55)', display: 'flex',
        }}>
          {/* Left aside */}
          <div style={{
            width: '38%', background: 'var(--bg-3)', padding: 32,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            minHeight: 440,
          }}>
            <div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                letterSpacing: 'var(--tracking)', color: 'var(--coral)',
                textTransform: 'uppercase', marginBottom: 10,
              }}>
                // visita
              </div>
              <h2 style={{
                fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 30,
                lineHeight: 1.05, letterSpacing: '-0.02em', margin: '0 0 14px',
                color: 'var(--ink)',
              }}>
                Registrar<br />Visita
              </h2>
              <p style={{ color: 'var(--ink-3)', fontSize: 13, lineHeight: 1.55, margin: 0 }}>
                Preencha os detalhes da visita. Sua avaliação e comentário ajudarão a registrar a experiência neste local.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ width: 12, height: 12, color: 'var(--aqua)', flexShrink: 0 }}>
                <path d="M12 2l9 4v6c0 5-4 9-9 10C7 21 3 17 3 12V6l9-4z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--ink-3)' }}>
                Sessão verificada
              </span>
            </div>
          </div>

          {/* Right body */}
          <div style={{ flex: 1, padding: 32, display: 'flex', flexDirection: 'column' }}>
            <form onSubmit={handleSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <FormField label="Data" icon="date_range">
                <StyledInput
                  type="date"
                  value={data}
                  onChange={e => setData(e.target.value)}
                />
              </FormField>

              <FormField label="Avaliação">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} role="radiogroup">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setAvaliacao(star)}
                      onMouseEnter={() => setHoverAvaliacao(star)}
                      onMouseLeave={() => setHoverAvaliacao(0)}
                      style={{
                        fontSize: 28, background: 'none', border: 0, cursor: 'pointer', padding: '2px 1px',
                        color: star <= (hoverAvaliacao || avaliacao) ? 'var(--coral)' : 'var(--bg-4)',
                        transition: 'color 0.15s',
                        WebkitTextStroke: star <= (hoverAvaliacao || avaliacao) ? '0' : '1px var(--ink-4)',
                      }}
                      role="radio"
                      aria-checked={avaliacao === star}
                      aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </FormField>

              <FormField label="Comentário">
                <StyledTextarea
                  value={comentario}
                  onChange={e => setComentario(e.target.value)}
                  placeholder="Digite seu comentário..."
                  rows={4}
                />
              </FormField>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 8 }}>
                <button
                  type="button"
                  onClick={handleDiscard}
                  style={{
                    background: 'transparent', color: 'var(--ink-2)',
                    border: '1px solid var(--line)', padding: '11px 18px',
                    borderRadius: 999, fontSize: 13, cursor: 'pointer', fontWeight: 500,
                  }}
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: 'linear-gradient(180deg, var(--coral-soft), var(--coral))',
                    color: 'white', border: 0, padding: '11px 18px', borderRadius: 999,
                    fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    boxShadow: '0 8px 22px -6px var(--coral-glow), inset 0 1px 0 rgba(255,255,255,0.28)',
                  }}
                >
                  {isSubmitting ? "Salvando..." : "Registrar Visita"}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ width: 13, height: 13 }}>
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 18, right: 18, width: 30, height: 30,
            borderRadius: 8, background: 'rgba(20,27,54,0.6)',
            border: '1px solid var(--line)', color: 'var(--ink-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </FormSign>
  );
}
