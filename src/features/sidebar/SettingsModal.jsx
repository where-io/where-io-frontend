import { useEffect, useState } from "react";
import FormSign from "../../components/navlink/Form/FormSign.jsx";
import { useMapActions } from "../mapa/MapContext.jsx";
import { MAP_THEME_ORDER } from "../mapa/Mapa.jsx";

const MAP_THEME_LABELS = {
  satellite: "Satellite",
  terrain: "Terrain",
  dark: "Dark",
};

const SETTINGS_SECTIONS = [
  {
    id: "account",
    title: "ACCOUNT",
    items: [
      { id: "profile", label: "Perfil" },
      { id: "privacy", label: "Privacidade" },
      { id: "plan", label: "Plano" },
    ],
  },
  {
    id: "map",
    title: "MAP",
    items: [
      { id: "appearance", label: "Aparência" },
      { id: "locale", label: "Idioma & unidades" },
      { id: "notifications", label: "Notificações" },
    ],
  },
  {
    id: "data",
    title: "DATA",
    items: [{ id: "export", label: "Exportar" }],
  },
];

function PlaceholderPanel({ title, body }) {
  return (
    <div style={{ paddingTop: 4 }}>
      <h3 style={{ margin: 0, fontSize: 18, color: "var(--ink)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>
        {title}
      </h3>
      <p style={{ margin: "12px 0 0", color: "var(--ink-3)", fontSize: 13, lineHeight: 1.55 }}>
        {body}
      </p>
    </div>
  );
}

export default function SettingsModal({ isOpen, onClose }) {
  const { mapTheme, setMapTheme } = useMapActions();
  const [activeNavId, setActiveNavId] = useState("appearance");

  useEffect(() => {
    if (!isOpen) return undefined;
    const onEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) setActiveNavId("appearance");
  }, [isOpen]);

  if (!isOpen) return null;

  let rightPanel = null;
  if (activeNavId === "appearance") {
    rightPanel = (
      <>
        <div style={{ borderBottom: "1px solid var(--line-soft)", paddingBottom: 18, marginBottom: 22 }}>
          <h3
            style={{
              margin: 0,
              fontSize: 20,
              color: "var(--ink)",
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
            }}
          >
            Aparência do mapa
          </h3>
          <p style={{ margin: "10px 0 0", color: "var(--ink-3)", fontSize: 13, lineHeight: 1.5 }}>
            Ajuste o estilo de tiles, marcadores e elementos da interface.
          </p>
        </div>
        <label style={{ fontSize: 13, color: "var(--ink-2)", display: "block" }}>
          Tema do mapa
          <select
            value={mapTheme}
            onChange={(e) => setMapTheme(e.target.value)}
            style={{
              marginTop: 10,
              width: "100%",
              maxWidth: 360,
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
      </>
    );
  } else if (activeNavId === "profile") {
    rightPanel = <PlaceholderPanel title="Perfil" body="Em breve você poderá editar nome, foto e preferências básicas da conta." />;
  } else if (activeNavId === "privacy") {
    rightPanel = <PlaceholderPanel title="Privacidade" body="Em breve: controles de visibilidade de locais e dados." />;
  } else if (activeNavId === "plan") {
    rightPanel = <PlaceholderPanel title="Plano" body="Em breve: informações sobre uso e limites." />;
  } else if (activeNavId === "locale") {
    rightPanel = <PlaceholderPanel title="Idioma & unidades" body="Em breve: idioma da interface e formato de datas." />;
  } else if (activeNavId === "notifications") {
    rightPanel = <PlaceholderPanel title="Notificações" body="Em breve: preferências de alertas." />;
  } else if (activeNavId === "export") {
    rightPanel = <PlaceholderPanel title="Exportar dados" body="Em breve: exportação dos seus locais e visitas." />;
  }

  return (
    <FormSign>
      <div style={{ position: "relative" }}>
        <div
          className="modal"
          style={{
            width: 820,
            maxWidth: "calc(100vw - 48px)",
            background: "var(--bg-2)",
            border: "1px solid var(--line)",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 40px 100px rgba(0,0,0,0.55)",
            display: "flex",
            minHeight: 440,
            maxHeight: "min(520px, calc(100vh - 120px))",
          }}
        >
          <aside
            style={{
              width: 252,
              flexShrink: 0,
              background: "var(--bg-3)",
              borderRight: "1px solid var(--line-soft)",
              display: "flex",
              flexDirection: "column",
              padding: "24px 18px 20px",
              overflowY: "auto",
            }}
            className="sidebar-scroll"
          >
            <div style={{ marginBottom: 22 }}>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  letterSpacing: "var(--tracking)",
                  color: "var(--coral)",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                // settings
              </div>
              <h2
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 600,
                  fontSize: 22,
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                  margin: 0,
                  color: "var(--ink)",
                }}
              >
                Configurações
              </h2>
              <p style={{ color: "var(--ink-3)", fontSize: 12, lineHeight: 1.45, margin: "10px 0 0" }}>
                Escolha uma área ao lado para editar.
              </p>
            </div>

            <nav aria-label="Seções de configurações" style={{ flex: 1 }}>
              {SETTINGS_SECTIONS.map((section, sectionIdx) => (
                <div key={section.id} style={{ marginTop: sectionIdx === 0 ? 0 : 20 }}>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      letterSpacing: "0.14em",
                      color: "var(--ink-4)",
                      textTransform: "uppercase",
                      marginBottom: 8,
                      paddingLeft: 4,
                    }}
                  >
                    {section.title}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {section.items.map((item) => {
                      const active = activeNavId === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveNavId(item.id)}
                          style={{
                            textAlign: "left",
                            padding: "10px 12px",
                            borderRadius: 10,
                            border: active ? "1px solid rgba(255,107,94,0.28)" : "1px solid transparent",
                            background: active ? "rgba(255,107,94,0.1)" : "transparent",
                            color: active ? "var(--ink)" : "var(--ink-2)",
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 11,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                            transition: "background 0.15s ease-out, border-color 0.15s ease-out, color 0.15s ease-out",
                          }}
                          onMouseEnter={(e) => {
                            if (!active) {
                              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                              e.currentTarget.style.color = "var(--ink)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!active) {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.color = "var(--ink-2)";
                            }
                          }}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 20,
                paddingTop: 16,
                borderTop: "1px solid var(--line-soft)",
              }}
            >
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
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--ink-3)" }}>
                Sessão verificada
              </span>
            </div>
          </aside>

          <div
            style={{
              flex: 1,
              minWidth: 0,
              padding: "28px 32px 32px",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
            }}
            className="sidebar-scroll"
          >
            {rightPanel}
          </div>
        </div>

        <button
          type="button"
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </FormSign>
  );
}
