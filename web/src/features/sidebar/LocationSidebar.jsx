import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API_BASE_URL } from "../../service/apiClient";
import { LocaisService } from "../../service/LocaisService";
import { TagService } from "../../service/TagService";
import LocationInfoCard from "../grid/LocationInfoCard";
import LocalPhotosCarousel from "../grid/LocalPhotosCarousel";
import LightRedInfoCard from "../grid/LightRedInfoCard";
import LightRedButton from "../button/LightRedButton";

function formatTagsSummary(tags) {
  if (!Array.isArray(tags) || tags.length === 0) return "—";
  const names = tags.map((t) => t?.nome).filter(Boolean);
  if (names.length === 0) return `${tags.length} tag(s)`;
  const s = names.join(" · ");
  return s.length > 48 ? `${s.slice(0, 46)}…` : s;
}

function resolveTagColor(cor) {
  if (cor == null || String(cor).trim() === "") return "var(--coral)";
  const s = String(cor).trim();
  if (s.startsWith("#")) return s;
  if (/^[\dA-Fa-f]{3}$|^[\dA-Fa-f]{6}$|^[\dA-Fa-f]{8}$/i.test(s)) return `#${s}`;
  return s;
}

/** Igual à CollectionSidebar: fundo suave para chip ativo. */
function tagChipTint(corHex, alpha) {
  const c = resolveTagColor(corHex);
  if (typeof c !== "string" || !c.startsWith("#")) return "rgba(255,255,255,0.06)";
  const raw = c.slice(1);
  const hex =
    raw.length === 3
      ? raw
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : raw.length >= 6
        ? raw.slice(0, 6)
        : null;
  if (!hex || hex.length !== 6) return "rgba(255,255,255,0.06)";
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return "rgba(255,255,255,0.06)";
  return `rgba(${r},${g},${b},${alpha})`;
}

const LOCATION_DATA = {
  name: "Local selecionado",
  imageSrc: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
  imageAlt: "Local selecionado",
  coordinates: "—",
  address: "—",
  elevation: "—",
  visibility: "—",
  historicalLog: "Sem informações adicionais.",
  weather: { temperature: "—", densityLabel: "—", densityPercent: 0 },
};

export default function LocationSidebar({
  data,
  location,
  localId,
  onClose,
  onAddVisit,
  onTagsChanged,
  isOpen = true,
  visitas = [],
}) {
  const [localTags, setLocalTags] = useState([]);
  const [tagCatalog, setTagCatalog] = useState([]);
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [associatingTagId, setAssociatingTagId] = useState(null);
  const [removingTagId, setRemovingTagId] = useState(null);
  const tagPickerWrapRef = useRef(null);
  /** Pré-visualização local enquanto o upload está em andamento */
  const [previewObjectUrl, setPreviewObjectUrl] = useState(null);
  const [coverUploadBusy, setCoverUploadBusy] = useState(false);
  const [coverError, setCoverError] = useState(null);
  const [coverDragActive, setCoverDragActive] = useState(false);
  const heroFileInputRef = useRef(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [nameSaveBusy, setNameSaveBusy] = useState(false);

  const resolved = {
    ...LOCATION_DATA,
    ...(data || {}),
    weather: { ...LOCATION_DATA.weather, ...(data?.weather || {}) },
  };

  useEffect(() => {
    if (!localId) {
      setLocalTags([]);
      return undefined;
    }
    let cancelled = false;
    LocaisService.getTags(localId)
      .then((r) => (r.ok ? r.json() : []))
      .then((dataTags) => {
        if (!cancelled && Array.isArray(dataTags)) setLocalTags(dataTags);
      })
      .catch(() => {
        if (!cancelled) setLocalTags([]);
      });
    return () => {
      cancelled = true;
    };
  }, [localId]);

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;
    TagService.getAll()
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => {
        if (!cancelled && Array.isArray(list)) setTagCatalog(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!tagPickerOpen) return undefined;
    const onDocMouseDown = (e) => {
      const el = tagPickerWrapRef.current;
      if (el && !el.contains(e.target)) setTagPickerOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [tagPickerOpen]);

  useEffect(() => {
    if (!tagPickerOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setTagPickerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tagPickerOpen]);

  useEffect(() => {
    if (!isOpen) setTagPickerOpen(false);
  }, [isOpen]);

  useEffect(() => {
    if (!editingName) {
      setNameDraft(resolved.name);
    }
  }, [resolved.name, editingName]);

  useEffect(() => {
    if (!isOpen) setEditingName(false);
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    };
  }, [previewObjectUrl]);

  const displayImageSrc = useMemo(
    () => previewObjectUrl || resolved.imageSrc,
    [previewObjectUrl, resolved.imageSrc]
  );

  const buildLocalUpdatePayload = useCallback(
    (overrides = {}) => {
      if (!location?.endereco) return null;
      return {
        nome: location.nome,
        endereco: location.endereco,
        coordenadas: location.coordenadas ?? undefined,
        idTags: Array.isArray(location.idTags) ? location.idTags : [],
        ...(location.imagemUrl ? { imagemUrl: location.imagemUrl } : {}),
        ...overrides,
      };
    },
    [location]
  );

  const uploadAndAttachCover = useCallback(
    async (file) => {
      if (coverUploadBusy) return;
      if (!localId || !file || !file.type.startsWith("image/")) return;
      if (!location?.endereco) return;

      try {
        setCoverError(null);
        setCoverUploadBusy(true);
        setPreviewObjectUrl(URL.createObjectURL(file));

        const up = await LocaisService.uploadFile(file);
        if (!up.ok) {
          const t = await up.text().catch(() => "");
          throw new Error(t || `HTTP ${up.status}`);
        }
        const body = await up.json();
        const urlPath = body?.urlPath;
        if (!urlPath || typeof urlPath !== "string") throw new Error("Resposta inválida do servidor");

        const base = API_BASE_URL.replace(/\/$/, "");
        const path = urlPath.startsWith("/") ? urlPath : `/${urlPath}`;
        const fullUrl = `${base}${path}`;

        const payload = buildLocalUpdatePayload({ imagemUrl: fullUrl });
        const put = await LocaisService.update(localId, payload);
        if (!put.ok) throw new Error("Não foi possível associar a imagem ao local");

        setPreviewObjectUrl(null);
        onTagsChanged?.();
      } catch (e) {
        console.error(e);
        setCoverError("Não foi possível enviar a imagem. Tente novamente.");
        setPreviewObjectUrl(null);
      } finally {
        setCoverUploadBusy(false);
        if (heroFileInputRef.current) heroFileInputRef.current.value = "";
      }
    },
    [coverUploadBusy, localId, location, buildLocalUpdatePayload, onTagsChanged]
  );

  const clearStoredCover = useCallback(async () => {
    if (!localId || !location?.endereco || coverUploadBusy) return;
    setCoverError(null);
    setPreviewObjectUrl(null);
    setCoverUploadBusy(true);
    try {
      const payload = buildLocalUpdatePayload({ imagemUrl: "" });
      const put = await LocaisService.update(localId, payload);
      if (put.ok) onTagsChanged?.();
    } finally {
      setCoverUploadBusy(false);
      if (heroFileInputRef.current) heroFileInputRef.current.value = "";
    }
  }, [
    localId,
    location,
    coverUploadBusy,
    buildLocalUpdatePayload,
    onTagsChanged,
  ]);

  const showRestoreCover =
    Boolean(location?.imagemUrl) || Boolean(previewObjectUrl);

  const onHeroDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const types = e.dataTransfer?.types ? [...e.dataTransfer.types] : [];
    if (types.includes("Files")) setCoverDragActive(true);
  }, []);

  const onHeroDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const next = e.relatedTarget;
    if (!next || !e.currentTarget.contains(next)) setCoverDragActive(false);
  }, []);

  const onHeroDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
  }, []);

  const onHeroDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setCoverDragActive(false);
      const file = e.dataTransfer?.files?.[0];
      uploadAndAttachCover(file);
    },
    [uploadAndAttachCover]
  );

  const onHeroFileChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      uploadAndAttachCover(file);
    },
    [uploadAndAttachCover]
  );

  const isCoverDragActive = coverDragActive;

  const saveLocationName = useCallback(async () => {
    const trimmed = nameDraft.trim();
    if (!localId || !location?.endereco) return;
    if (!trimmed) return;
    if (trimmed === resolved.name) {
      setEditingName(false);
      return;
    }
    setNameSaveBusy(true);
    try {
      const payload = {
        nome: trimmed,
        endereco: location.endereco,
        coordenadas: location.coordenadas ?? undefined,
        idTags: Array.isArray(location.idTags) ? location.idTags : [],
        ...(location.imagemUrl ? { imagemUrl: location.imagemUrl } : {}),
      };
      const res = await LocaisService.update(localId, payload);
      if (res.ok) {
        setEditingName(false);
        onTagsChanged?.();
      }
    } finally {
      setNameSaveBusy(false);
    }
  }, [
    localId,
    location,
    nameDraft,
    resolved.name,
    onTagsChanged,
  ]);

  const tagsAvailableToAdd = useMemo(
    () =>
      tagCatalog.filter((t) => t?.id != null && !localTags.some((lt) => lt.id === t.id)),
    [tagCatalog, localTags]
  );

  const tagsSummary = useMemo(() => formatTagsSummary(localTags), [localTags]);

  const tagMutationBusy = associatingTagId != null || removingTagId != null;

  const associateTag = useCallback(
    (tag) => {
      if (!localId || !tag?.id || tagMutationBusy) return;
      setAssociatingTagId(tag.id);
      LocaisService.associateTag(localId, tag.id)
        .then(async (res) => {
          if (!res.ok) return;
          setTagPickerOpen(false);
          const r = await LocaisService.getTags(localId);
          const list = r.ok ? await r.json() : [];
          if (Array.isArray(list)) setLocalTags(list);
          onTagsChanged?.();
        })
        .finally(() => setAssociatingTagId(null));
    },
    [localId, onTagsChanged, tagMutationBusy]
  );

  const dissociateTag = useCallback(
    (tag) => {
      if (!localId || !tag?.id || tagMutationBusy) return;
      setRemovingTagId(tag.id);
      LocaisService.dissociateTag(localId, tag.id)
        .then(async (res) => {
          if (!res.ok) return;
          const r = await LocaisService.getTags(localId);
          const list = r.ok ? await r.json() : [];
          if (Array.isArray(list)) setLocalTags(list);
          onTagsChanged?.();
        })
        .finally(() => setRemovingTagId(null));
    },
    [localId, onTagsChanged, tagMutationBusy]
  );

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

        {/* Hero image — arraste uma imagem ou use o botão para substituir (pré-visualização local nesta sessão) */}
        <div
          role="presentation"
          onDragEnter={onHeroDragEnter}
          onDragLeave={onHeroDragLeave}
          onDragOver={onHeroDragOver}
          onDrop={onHeroDrop}
          style={{
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: 20,
            position: "relative",
            outline: isCoverDragActive ? "2px dashed rgba(94,224,200,0.85)" : "none",
            outlineOffset: 2,
            transition: "outline-color 0.15s ease",
            opacity: coverUploadBusy ? 0.92 : 1,
          }}
        >
          <input
            ref={heroFileInputRef}
            type="file"
            accept="image/*"
            aria-hidden
            tabIndex={-1}
            style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
            onChange={onHeroFileChange}
          />
          <img
            src={displayImageSrc}
            alt={resolved.imageAlt}
            style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }}
          />
          {isCoverDragActive && !coverUploadBusy && (
            <div
              role="status"
              aria-live="polite"
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(10,16,40,0.72)",
                pointerEvents: "none",
                border: "2px dashed rgba(94,224,200,0.55)",
                boxSizing: "border-box",
              }}
            >
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--aqua)",
                  textAlign: "center",
                  padding: "0 16px",
                }}
              >
                Solte para definir a foto
              </span>
            </div>
          )}
          {coverUploadBusy && (
            <div
              role="status"
              aria-live="polite"
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(10,16,40,0.55)",
                pointerEvents: "none",
              }}
            >
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--aqua)",
                }}
              >
                Enviando…
              </span>
            </div>
          )}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(10,16,40,0.85) 0%, transparent 55%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 14,
              right: 14,
              zIndex: 5,
              display: "flex",
              gap: 6,
              pointerEvents: "auto",
            }}
          >
            <button
              type="button"
              aria-label="Escolher imagem do disco"
              title="Escolher imagem"
              disabled={coverUploadBusy}
              onClick={(e) => {
                e.stopPropagation();
                heroFileInputRef.current?.click();
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 34,
                height: 34,
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(10,16,40,0.65)",
                color: "var(--ink)",
                cursor: coverUploadBusy ? "default" : "pointer",
                opacity: coverUploadBusy ? 0.6 : 1,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                add_photo_alternate
              </span>
            </button>
            {showRestoreCover ? (
              <button
                type="button"
                aria-label="Remover imagem do local"
                title="Remover imagem"
                disabled={coverUploadBusy}
                onClick={(e) => {
                  e.stopPropagation();
                  clearStoredCover();
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(10,16,40,0.65)",
                  color: "var(--ink-2)",
                  cursor: coverUploadBusy ? "default" : "pointer",
                  opacity: coverUploadBusy ? 0.6 : 1,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  restart_alt
                </span>
              </button>
            ) : null}
          </div>
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                maxWidth: "100%",
              }}
            >
              {editingName ? (
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  <input
                    type="text"
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveLocationName();
                      if (e.key === "Escape") {
                        setEditingName(false);
                        setNameDraft(resolved.name);
                      }
                    }}
                    disabled={nameSaveBusy}
                    autoFocus
                    aria-label="Novo nome do local"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid var(--line)",
                      background: "rgba(10,16,40,0.85)",
                      color: "var(--ink)",
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 16,
                      fontWeight: 600,
                      outline: "none",
                    }}
                  />
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      disabled={nameSaveBusy || !nameDraft.trim()}
                      onClick={saveLocationName}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: "1px solid rgba(94,224,200,0.35)",
                        background: "rgba(94,224,200,0.12)",
                        color: "var(--aqua)",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: nameSaveBusy ? "default" : "pointer",
                        opacity: nameSaveBusy ? 0.7 : 1,
                      }}
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      disabled={nameSaveBusy}
                      onClick={() => {
                        setEditingName(false);
                        setNameDraft(resolved.name);
                      }}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: "1px solid var(--line)",
                        background: "transparent",
                        color: "var(--ink-2)",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: nameSaveBusy ? "default" : "pointer",
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700,
                      fontSize: 20,
                      color: "var(--ink)",
                      margin: 0,
                      flex: 1,
                      minWidth: 0,
                      lineHeight: 1.25,
                      wordBreak: "break-word",
                    }}
                  >
                    {resolved.name}
                  </h3>
                  {localId && location?.endereco ? (
                    <button
                      type="button"
                      aria-label="Alterar nome do local"
                      title="Alterar nome"
                      onClick={() => {
                        setNameDraft(resolved.name);
                        setEditingName(true);
                      }}
                      style={{
                        flexShrink: 0,
                        alignSelf: "center",
                        padding: "2px",
                        margin: 0,
                        border: "none",
                        borderRadius: 6,
                        background: "transparent",
                        color: "var(--ink-3)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontSize: 20,
                        lineHeight: 1.25,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "var(--coral)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--ink-3)";
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: 20,
                          lineHeight: 1,
                          width: "1em",
                          height: "1em",
                          display: "block",
                        }}
                      >
                        edit
                      </span>
                    </button>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
        {coverError ? (
          <div
            style={{
              fontSize: 12,
              color: "var(--coral)",
              marginTop: -12,
              marginBottom: 16,
              lineHeight: 1.4,
            }}
          >
            {coverError}
          </div>
        ) : null}

        {/* Coordinates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
          <LocationInfoCard colSpan={2} label="Coordenadas" value={resolved.coordinates} icon="radar" />
          <LocalPhotosCarousel localId={localId} onPhotosChanged={onTagsChanged} />
          <LocationInfoCard
            colSpan={2}
            label="Endereço"
            value={resolved.address}
            icon="location_on"
            copyValue={resolved.address !== "—" ? resolved.address : undefined}
          />
          <div
            style={{
              gridColumn: "span 2",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 6,
            }}
            className="scrollbar-hide"
            aria-label={tagsSummary === "—" ? "Tags: nenhuma associada" : `Tags: ${tagsSummary}`}
          >
            {localTags.length === 0 ? (
              <span style={{ fontSize: 13, color: "var(--ink-3)", lineHeight: 1.4 }}>
                Nenhuma tag associada.
              </span>
            ) : (
              localTags.map((tag) => {
                const color = resolveTagColor(tag?.cor);
                const removingThis = removingTagId === tag.id;
                return (
                  <span
                    key={tag.id ?? tag.nome}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      padding: "5px 5px 5px 11px",
                      borderRadius: 999,
                      maxWidth: "100%",
                      background: tagChipTint(tag?.cor, 0.18),
                      color,
                      border: `1px solid ${color}`,
                      transition: "all 0.12s",
                      opacity: removingThis ? 0.65 : 1,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color, flexShrink: 0 }}>
                      label
                    </span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
                      {tag.nome || "Tag"}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remover tag ${tag.nome || ""}`}
                      disabled={!tag?.id || tagMutationBusy}
                      onClick={(e) => {
                        e.stopPropagation();
                        dissociateTag(tag);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 22,
                        height: 22,
                        flexShrink: 0,
                        marginLeft: 2,
                        padding: 0,
                        borderRadius: 6,
                        border: "none",
                        background: "transparent",
                        color: "var(--coral)",
                        cursor: tagMutationBusy ? "not-allowed" : "pointer",
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={(e) => {
                        if (!tagMutationBusy) e.currentTarget.style.background = "rgba(255,107,94,0.15)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ width: 11, height: 11 }}>
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                );
              })
            )}
            {localId && (
              <div ref={tagPickerWrapRef} style={{ position: "relative", display: "inline-flex" }}>
                <button
                  type="button"
                  aria-label="Adicionar tag"
                  aria-expanded={tagPickerOpen}
                  aria-haspopup="listbox"
                  disabled={
                    tagMutationBusy ||
                    tagsAvailableToAdd.length === 0 ||
                    tagCatalog.length === 0
                  }
                  onClick={() => {
                    if (tagsAvailableToAdd.length === 0) return;
                    setTagPickerOpen((o) => !o);
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    padding: "7px 11px",
                    borderRadius: 999,
                    whiteSpace: "nowrap",
                    background: "rgba(255,107,94,0.1)",
                    color: "var(--coral)",
                    border: "1px dashed rgba(255,107,94,0.45)",
                    cursor:
                      tagsAvailableToAdd.length === 0 || tagCatalog.length === 0
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      tagsAvailableToAdd.length === 0 || tagCatalog.length === 0 ? 0.45 : 1,
                    transition: "all 0.12s",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: "var(--coral)" }}>
                    add
                  </span>
                </button>
                {tagPickerOpen && tagsAvailableToAdd.length > 0 && (
                  <div
                    role="listbox"
                    aria-label="Tags disponíveis"
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      left: 0,
                      minWidth: "max(100%, 208px)",
                      maxHeight: 220,
                      overflowY: "auto",
                      background: "var(--bg-3)",
                      border: "1px solid var(--line)",
                      borderRadius: 10,
                      boxShadow: "0 14px 44px rgba(0,0,0,0.5)",
                      zIndex: 60,
                      padding: 6,
                    }}
                    className="sidebar-scroll"
                  >
                    {tagsAvailableToAdd.map((tag) => {
                      const color = resolveTagColor(tag?.cor);
                      const busy = associatingTagId === tag.id;
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          role="option"
                          disabled={busy || tagMutationBusy}
                          onClick={() => associateTag(tag)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            width: "100%",
                            textAlign: "left",
                            padding: "10px 12px",
                            borderRadius: 8,
                            border: "none",
                            background: "transparent",
                            cursor: busy ? "wait" : "pointer",
                            color: "var(--ink)",
                          }}
                          onMouseEnter={(e) => {
                            if (!busy && !tagMutationBusy)
                              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 999,
                              background: color,
                              flexShrink: 0,
                              boxShadow: `0 0 0 1px rgba(255,255,255,0.12)`,
                            }}
                          />
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 10,
                              letterSpacing: "0.12em",
                              textTransform: "uppercase",
                              color,
                            }}
                          >
                            {tag.nome || "Tag"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
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
