import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../../service/apiClient";
import { LocaisService } from "../../service/LocaisService";

/** Altura máxima da pré-visualização (viewport); imagem inteira com `object-fit: contain`. */
const MEDIA_STRIP_HEIGHT = "27vh";
/** Mesmo raio na moldura e na imagem (px). */
const MEDIA_FRAME_RADIUS = 8;

function buildImageSrc(item) {
  const path =
    item?.urlPath ||
    (item?.fileName ? `/media/${item.fileName}` : "");
  if (!path) return "";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}

/**
 * Card no mesmo estilo de {@link LocationInfoCard}: galeria em carrossel + anexo para upload.
 */
export default function LocalPhotosCarousel({
  localId,
  /** Chamado após upload bem-sucedido (ex.: refetch de `/api/local/all`). */
  onPhotosChanged,
}) {
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const load = useCallback(async () => {
    if (!localId) {
      setItems([]);
      setIndex(0);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await LocaisService.listLocalFotos(localId);
      if (!res.ok) {
        setItems([]);
        setError("Não foi possível carregar as fotos.");
        return;
      }
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
      setIndex(0);
    } catch {
      setItems([]);
      setError("Não foi possível carregar as fotos.");
    } finally {
      setLoading(false);
    }
  }, [localId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setIndex((i) => {
      const n = items.length;
      if (n === 0) return 0;
      return Math.min(i, n - 1);
    });
  }, [items.length]);

  const count = items.length;
  const safeIndex = count === 0 ? 0 : Math.min(index, count - 1);
  const current = count > 0 ? items[safeIndex] : null;
  const src = current ? buildImageSrc(current) : "";

  const goPrev = () => {
    if (count <= 1) return;
    setIndex((i) => (i - 1 + count) % count);
  };

  const goNext = () => {
    if (count <= 1) return;
    setIndex((i) => (i + 1) % count);
  };

  const handlePickAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !localId) return;
    setUploadBusy(true);
    setError(null);
    try {
      const res = await LocaisService.uploadFile(file, localId);
      if (!res.ok) {
        setError("Falha ao enviar a foto. Tente novamente.");
        return;
      }
      await load();
      onPhotosChanged?.();
    } catch {
      setError("Falha ao enviar a foto. Tente novamente.");
    } finally {
      setUploadBusy(false);
    }
  };

  if (!localId) {
    return null;
  }

  return (
    <div
      style={{
        position: "relative",
        background: "var(--bg-4)",
        borderRadius: 10,
        padding: "12px 14px 14px",
        gridColumn: "span 2",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
            }}
          >
            Fotos
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <button
            type="button"
            aria-label="Anexar foto"
            title="Adicionar foto"
            disabled={uploadBusy}
            onClick={handlePickAttachment}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              padding: 0,
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)",
              color: "var(--coral)",
              cursor: uploadBusy ? "not-allowed" : "pointer",
              opacity: uploadBusy ? 0.5 : 1,
              transition: "background 0.12s, border-color 0.12s",
            }}
            onMouseEnter={(e) => {
              if (!uploadBusy) {
                e.currentTarget.style.background = "rgba(255,107,94,0.12)";
                e.currentTarget.style.borderColor = "rgba(255,107,94,0.25)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, lineHeight: 1 }}
            >
              attach_file
            </span>
          </button>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: MEDIA_STRIP_HEIGHT,
          minHeight: MEDIA_STRIP_HEIGHT,
          maxHeight: MEDIA_STRIP_HEIGHT,
          boxSizing: "border-box",
          flexShrink: 0,
        }}
      >
        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              width: "100%",
              boxSizing: "border-box",
              borderRadius: MEDIA_FRAME_RADIUS,
              overflow: "hidden",
              background: "rgba(0,0,0,0.25)",
              color: "var(--ink-3)",
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
              textAlign: "center",
            }}
          >
            Carregando…
          </div>
        ) : count === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              width: "100%",
              boxSizing: "border-box",
              padding: "14px 20px",
              borderRadius: MEDIA_FRAME_RADIUS,
              overflow: "hidden",
              background: "rgba(0,0,0,0.25)",
              color: "var(--ink-3)",
              fontSize: 12,
              lineHeight: 1.5,
              fontFamily: "'JetBrains Mono', monospace",
              textAlign: "center",
            }}
          >
            <span style={{ maxWidth: 200, margin: "0 auto" }}>
              Nenhuma foto ainda.
              <br />
              Toque no ícone de anexo para adicionar.
            </span>
          </div>
        ) : (
          <>
            {/* Área fixa: imagem centralizada com contain; controles ancorados na faixa, não no frame da img */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box",
                borderRadius: MEDIA_FRAME_RADIUS,
                overflow: "hidden",
                background: "rgba(0,0,0,0.25)",
              }}
            >
              <img
                src={src}
                alt=""
                style={{
                  display: "block",
                  maxHeight: "100%",
                  maxWidth: "100%",
                  width: "auto",
                  height: "auto",
                  objectFit: "contain",
                  objectPosition: "center",
                  borderRadius: MEDIA_FRAME_RADIUS,
                }}
              />
            </div>
            {count > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Foto anterior"
                  onClick={goPrev}
                  style={{
                    position: "absolute",
                    left: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 2,
                    width: 30,
                    height: 30,
                    borderRadius: MEDIA_FRAME_RADIUS,
                    border: "none",
                    background: "rgba(0,0,0,0.45)",
                    color: "var(--ink)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 18 }}
                  >
                    chevron_left
                  </span>
                </button>
                <button
                  type="button"
                  aria-label="Próxima foto"
                  onClick={goNext}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 2,
                    width: 30,
                    height: 30,
                    borderRadius: MEDIA_FRAME_RADIUS,
                    border: "none",
                    background: "rgba(0,0,0,0.45)",
                    color: "var(--ink)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 18 }}
                  >
                    chevron_right
                  </span>
                </button>
                <div
                  style={{
                    position: "absolute",
                    bottom: 8,
                    left: 0,
                    right: 0,
                    zIndex: 2,
                    display: "flex",
                    justifyContent: "center",
                    gap: 4,
                    pointerEvents: "none",
                  }}
                >
                  {items.map((_, i) => (
                    <span
                      key={i}
                      style={{
                        width: i === safeIndex ? 8 : 5,
                        height: 5,
                        borderRadius: 999,
                        background:
                          i === safeIndex
                            ? "var(--coral)"
                            : "rgba(255,255,255,0.35)",
                        transition: "width 0.15s, background 0.15s",
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {error ? (
        <div style={{ fontSize: 11, color: "var(--coral)", lineHeight: 1.3 }}>
          {error}
        </div>
      ) : null}
    </div>
  );
}
