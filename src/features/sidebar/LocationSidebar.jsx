import LocationInfoCard from "../grid/LocationInfoCard";
import LightRedInfoCard from "../grid/LightRedInfoCard";
import LightRedButton from "../button/LightRedButton";

const LOCATION_DATA = {
  name: "Local selecionado",
  imageSrc: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
  imageAlt: "Local selecionado",
  coordinates: "—",
  elevation: "—",
  visibility: "—",
  historicalLog: "Sem informações adicionais.",
  weather: { temperature: "—", densityLabel: "—", densityPercent: 0 },
};

export default function LocationSidebar({ data, onClose, onAddVisit, isOpen = true, visitas = [] }) {
  const resolved = {
    ...LOCATION_DATA,
    ...(data || {}),
    weather: { ...LOCATION_DATA.weather, ...(data?.weather || {}) },
  };

  return (
    <aside style={{
      position: 'fixed', right: 0, top: 0, height: '100%', width: '22vw', minWidth: 300,
      background: 'var(--bg-1)', borderLeft: '1px solid var(--line)',
      display: 'flex', flexDirection: 'column', zIndex: 40,
      transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.3s ease',
      pointerEvents: isOpen ? 'auto' : 'none',
    }}>
      {/* Close button */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute', top: 18, right: 18, width: 30, height: 30,
            borderRadius: 8, background: 'rgba(20,27,54,0.6)',
            border: '1px solid var(--line)', color: 'var(--ink-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            zIndex: 2,
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }} className="sidebar-scroll">

        {/* Hero image */}
        <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 20, position: 'relative' }}>
          <img
            src={resolved.imageSrc}
            alt={resolved.imageAlt}
            style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(10,16,40,0.85) 0%, transparent 55%)',
          }} />
          <div style={{ position: 'absolute', bottom: 14, left: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--aqua)', display: 'inline-block' }} />
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                letterSpacing: 'var(--tracking)', color: 'var(--aqua)', textTransform: 'uppercase',
              }}>
                Live Status
              </span>
            </div>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: 'var(--ink)', margin: 0 }}>
              {resolved.name}
            </h3>
          </div>
        </div>

        {/* Coordinates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
          <LocationInfoCard colSpan={2} label="Coordenadas" value={resolved.coordinates} icon="radar" />
        </div>

        {/* Visits section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ width: 15, height: 15, color: 'var(--coral)' }}>
                <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7l3-7z" />
              </svg>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 16, color: 'var(--ink)' }}>
                Visitas
              </span>
            </div>
            <LightRedButton onClickFunction={onAddVisit} type="button">
              Adicionar Visita
            </LightRedButton>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {visitas.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--ink-3)', padding: '12px 0' }}>
                Nenhuma visita registrada.
              </div>
            ) : (
              visitas.map((visita, index) => (
                <LightRedInfoCard
                  key={visita.id ?? index}
                  data={new Date(visita.dataVisita).toLocaleDateString("pt-BR")}
                  reviewLabel={visita.comentario}
                  reviewNumber={visita.avaliacao}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '14px 20px', borderTop: '1px solid var(--line-soft)' }}>
        <button style={{
          width: '100%', padding: '12px 16px', borderRadius: 10,
          background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', color: 'var(--ink-2)',
        }}>
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block' }}>
              Traçar rota até
            </span>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{resolved.name}</span>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ width: 16, height: 16, color: 'var(--coral)' }}>
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
