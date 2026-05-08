import { useEffect } from "react";
import FormSign from "../../components/navlink/Form/FormSign.jsx";
import { useMapActions } from "../mapa/MapContext.jsx";
import { MAP_THEME_ORDER } from "../mapa/Mapa.jsx";

const MAP_THEME_LABELS = {
  satellite: "Satellite",
  terrain: "Terrain",
  dark: "Dark",
};

export default function SettingsModal({ isOpen, onClose }) {
  const { mapTheme, setMapTheme } = useMapActions();
  useEffect(() => {
    if (!isOpen) return undefined;
    const onEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <FormSign>
      <div style={{ position: "relative" }}>
        <div
          className="modal"
          style={{
            width: 760,
            maxWidth: "calc(100vw - 80px)",
            background: "var(--bg-2)",
            border: "1px solid var(--line)",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 40px 100px rgba(0,0,0,0.55)",
            display: "flex",
          }}
        >
          <div
            style={{
              width: "38%",
              background: "var(--bg-3)",
              padding: 32,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: 440,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  letterSpacing: "var(--tracking)",
                  color: "var(--coral)",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                // settings
              </div>
              <h2
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 600,
                  fontSize: 30,
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                  margin: "0 0 14px",
                  color: "var(--ink)",
                }}
              >
                Map
                <br />
                Settings
              </h2>
              <p style={{ color: "var(--ink-3)", fontSize: 13, lineHeight: 1.55, margin: 0 }}>
                Ajuste o estilo de tiles, marcadores e elementos da interface.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 18 }}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ width: 12, height: 12, color: "var(--aqua)", flexShrink: 0 }}
              >
                <path d="M12 2l9 4v6c0 5-4 9-9 10C7 21 3 17 3 12V6l9-4z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: "var(--ink-3)",
                }}
              >
                Sessão verificada
              </span>
            </div>
          </div>

          <div style={{ flex: 1, padding: 32, display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                letterSpacing: "0.08em",
                color: "var(--ink-2)",
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <span>ACCOUNT</span>
              <span>Perfil</span>
              <span>Privacidade</span>
              <span>Plano</span>
              <span>MAP</span>
              <span>Aparência</span>
              <span>Idioma & unidades</span>
              <span>Notificações</span>
              <span>DATA</span>
              <span>Exportar</span>
            </div>

            <div style={{ borderTop: "1px solid var(--line-soft)", paddingTop: 14 }}>
              <h3 style={{ margin: 0, fontSize: 18, color: "var(--ink)" }}>Aparência do mapa</h3>
              <p style={{ margin: "8px 0 0", color: "var(--ink-2)", fontSize: 13, lineHeight: 1.5 }}>
                Ajuste o estilo de tiles, marcadores e elementos da interface.
              </p>
            </div>

            <label style={{ fontSize: 13, color: "var(--ink-2)" }}>
              Tema do mapa
              <select
                value={mapTheme}
                onChange={(e) => setMapTheme(e.target.value)}
                style={{
                  marginTop: 8,
                  width: "100%",
                  border: "1px solid var(--line)",
                  borderRadius: 10,
                  background: "var(--bg-4)",
                  color: "var(--ink)",
                  padding: "11px 12px",
                  outline: "none",
                }}
              >
                {MAP_THEME_ORDER.map((key) => (
                  <option key={key} value={key}>
                    {MAP_THEME_LABELS[key]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 18,
            right: 18,
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "rgba(20,27,54,0.6)",
            border: "1px solid var(--line)",
            color: "var(--ink-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ width: 14, height: 14 }}
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </FormSign>
  );
}
