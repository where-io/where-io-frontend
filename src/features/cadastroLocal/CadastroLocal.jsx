import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useMapActions } from "../mapa/MapContext.jsx";
import FormSign from "../../components/navlink/Form/FormSign.jsx";
import FormField from "../../components/navlink/Form/FormField.jsx";
import { LocaisService } from "../../service/LocaisService";
import { TagService } from "../../service/TagService";

function useGooglePlaces() {
  const sessionTokenRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const { AutocompleteSessionToken } = await window.google.maps.importLibrary("places");
        sessionTokenRef.current = new AutocompleteSessionToken();
        setIsReady(true);
      } catch (err) {
        console.error("Google Maps não carregou:", err);
      }
    }
    if (window.google?.maps) {
      init();
    } else {
      window.addEventListener("load", init);
      return () => window.removeEventListener("load", init);
    }
  }, []);

  const fetchSuggestions = useCallback(async (query) => {
    if (!isReady || query.length <= 3) return [];
    try {
      const { AutocompleteSuggestion } = await window.google.maps.importLibrary("places");
      const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: query,
        sessionToken: sessionTokenRef.current,
        includedRegionCodes: ["br"],
      });
      return suggestions || [];
    } catch (err) {
      console.error("Erro no autocomplete:", err);
      return [];
    }
  }, [isReady]);

  const fetchPlaceDetails = useCallback(async (placeId) => {
    try {
      const { Place, AutocompleteSessionToken } = await window.google.maps.importLibrary("places");
      const place = new Place({ id: placeId, requestedLanguage: "pt-BR" });
      await place.fetchFields({ fields: ["location", "displayName", "formattedAddress", "addressComponents"] });
      sessionTokenRef.current = new AutocompleteSessionToken();
      return {
        address: place.formattedAddress,
        coords: `${place.location.lat()}, ${place.location.lng()}`,
        name: place.displayName,
      };
    } catch (err) {
      console.error("Erro ao buscar detalhes:", err);
      return null;
    }
  }, []);

  return { fetchSuggestions, fetchPlaceDetails, isReady };
}

function SuggestionsList({ suggestions, onSelect }) {
  if (suggestions.length === 0) return null;
  return (
    <div style={{
      position: 'absolute', zIndex: 50, width: '100%', marginTop: 4,
      borderRadius: 10, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      background: 'var(--bg-3)', border: '1px solid var(--line)',
    }}>
      {suggestions.map(suggestion => {
        const p = suggestion.placePrediction;
        return (
          <div
            key={p.placeId}
            onClick={() => onSelect(p.placeId)}
            style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--line-soft)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = ''}
          >
            <strong style={{ color: 'var(--ink)', display: 'block', fontSize: 13 }}>{p.mainText.text}</strong>
            <small style={{ color: 'var(--ink-3)', fontSize: 11 }}>{p.secondaryText.text}</small>
          </div>
        );
      })}
    </div>
  );
}

const inputStyle = {
  width: '100%', background: 'var(--bg-4)', border: '1px solid transparent',
  borderRadius: 10, padding: '12px 14px', color: 'var(--ink-2)', fontSize: 13,
  outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
  fontFamily: "'Inter', sans-serif",
};

const TAG_PALETTE = [
  { name: "Coral", value: "#FF6B5E" },
  { name: "Aqua", value: "#4DE1C1" },
  { name: "Violet", value: "#8B7CFF" },
  { name: "Amber", value: "#FFB84D" },
  { name: "Lime", value: "#7CFF6B" },
  { name: "Sky", value: "#5EBBFF" },
];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mql) return;
    const onChange = () => setReduced(Boolean(mql.matches));
    onChange();
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

function resolveTagHex(cor) {
  if (cor == null || String(cor).trim() === "") return "#FF6B5E";
  const s = String(cor).trim();
  if (s.startsWith("#")) {
    const body = s.slice(1);
    if (body.length === 3 || body.length === 6) return `#${body}`;
    return s;
  }
  if (/^[\dA-Fa-f]{3}$|^[\dA-Fa-f]{6}$/i.test(s)) return `#${s}`;
  return s.startsWith("rgb") ? s : "#FF6B5E";
}

function hexToRgba(hex, alpha) {
  const normalized = resolveTagHex(hex);
  if (!normalized.startsWith("#")) return `rgba(255,255,255,${alpha})`;
  const clean = normalized.replace("#", "").trim();
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  if (full.length !== 6) return `rgba(255,255,255,${alpha})`;
  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function StyledInput({ value, onChange, placeholder, type = "text", readOnly, style }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      style={{
        ...inputStyle,
        ...(focused ? {
          borderColor: 'var(--coral)',
          boxShadow: '0 0 0 3px rgba(255,107,94,0.12)',
          color: 'var(--ink)',
        } : {}),
        ...style,
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

export default function CadastroLocal({ onClose, onSaved }) {
  const ignoreNextQueryRef = useRef(false);
  const { flyTo } = useMapActions();
  const prefersReducedMotion = usePrefersReducedMotion();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [registeredTags, setRegisteredTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [tagsLoadError, setTagsLoadError] = useState(false);
  const [tagDraftOpen, setTagDraftOpen] = useState(false);
  const [tagNameDraft, setTagNameDraft] = useState("");
  const [tagColorDraft, setTagColorDraft] = useState("#8B7CFF");
  const [pulseTagKey, setPulseTagKey] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { fetchSuggestions, fetchPlaceDetails } = useGooglePlaces();

  const selectedTagIds = useMemo(
    () => new Set(selectedTags.filter((t) => t?.id).map((t) => t.id)),
    [selectedTags],
  );

  useEffect(() => {
    let mounted = true;
    setTagsLoading(true);
    setTagsLoadError(false);
    TagService.getAll()
      .then((r) => {
        if (!r.ok) throw new Error("tags");
        return r.json();
      })
      .then((data) => {
        if (!mounted || !Array.isArray(data)) return;
        setRegisteredTags(data);
      })
      .catch(() => {
        if (mounted) setTagsLoadError(true);
      })
      .finally(() => {
        if (mounted) setTagsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (ignoreNextQueryRef.current) { ignoreNextQueryRef.current = false; return; }
    if (query.length > 3) {
      fetchSuggestions(query).then(setSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [query, fetchSuggestions]);

  async function handleSelectPlace(placeId) {
    const details = await fetchPlaceDetails(placeId);
    if (details) {
      setAddress(details.address);
      setCoords(details.coords);
      ignoreNextQueryRef.current = true;
      setQuery(details.address);
      setSuggestions([]);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    const enderecoParsed = parseEndereco(address);
    const payload = {
      nome: name,
      endereco: {
        logradouro: enderecoParsed.rua, bairro: enderecoParsed.bairro,
        cidade: enderecoParsed.cidade, estado: enderecoParsed.estado,
        cep: enderecoParsed.cep, pais: "Brasil",
      },
      coordenadas: {
        latitude: coords.split(",")[0]?.trim(),
        longitude: coords.split(",")[1]?.trim(),
      },
      idTags: selectedTags.map((t) => (t.id && String(t.id).trim()) || (t.nome && t.nome.trim())).filter(Boolean),
      tags: selectedTags.map(({ id, nome, cor }) => ({
        ...(id ? { id } : {}),
        nome,
        cor: resolveTagHex(cor),
      })),
    };
    const response = await LocaisService.create(payload);
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Falha ao salvar local (${response.status}): ${errorBody}`);
    }
    if (onSaved) onSaved();
    if (onClose) onClose();
    setIsSubmitting(false);
    if (coords && coords.includes(",")) {
      const [lat, lng] = coords.split(",").map(c => parseFloat(c.trim()));
      flyTo([lat, lng], 17);
    }
  }

  function parseEndereco(enderecoCompleto) {
    const semBrasil = enderecoCompleto.replace(/, Brasil\.?$/, "").trim();
    const cepMatch = semBrasil.match(/(\d{5}-\d{3})/);
    const cep = cepMatch ? cepMatch[1] : null;
    const semCep = semBrasil.replace(/,?\s*\d{5}-\d{3}/, "").trim();
    const partes = semCep.split(" - ");
    const primeiraParte = partes[0];
    const [rua, numero] = primeiraParte.split(",").map(s => s.trim());
    const numeroLimpo = numero && /^\d+/.test(numero) ? numero : null;
    const estado = partes[partes.length - 1].trim();
    const meioRaw = partes.slice(1, partes.length - 1).join(" - ");
    const meioParts = meioRaw.split(",").map(s => s.trim());
    return {
      rua: rua || null, numero: numeroLimpo,
      bairro: meioParts[0] || null, cidade: meioParts[1] || null,
      estado: estado || null, cep: cep || null,
    };
  }

  function handleDiscard() {
    setQuery(""); setAddress(""); setCoords(""); setSuggestions([]);
    setSelectedTags([]);
    setTagDraftOpen(false);
    setTagNameDraft("");
    setTagColorDraft("#8B7CFF");
    if (onClose) onClose();
  }

  function addTagFromDraft() {
    const nome = tagNameDraft.trim();
    if (!nome) return;
    const lower = nome.toLowerCase();
    const existsInSelection = selectedTags.some(
      (t) => (t?.nome || "").trim().toLowerCase() === lower,
    );
    const existsInCatalog = registeredTags.some(
      (t) => (t?.nome || "").trim().toLowerCase() === lower,
    );
    if (existsInSelection || existsInCatalog) return;
    const newTag = { nome, cor: resolveTagHex(tagColorDraft) };
    setSelectedTags((prev) => [...prev, newTag]);
    setTagNameDraft("");
    setTagDraftOpen(false);
    setPulseTagKey(nome.toLowerCase());
    if (!prefersReducedMotion) {
      window.setTimeout(() => setPulseTagKey(null), 220);
    } else {
      setPulseTagKey(null);
    }
  }

  function removeTag(tag) {
    const id = tag?.id;
    const normalized = (tag?.nome || "").trim().toLowerCase();
    setSelectedTags((prev) =>
      prev.filter((t) => {
        if (id && t.id) return t.id !== id;
        return (t?.nome || "").trim().toLowerCase() !== normalized;
      }),
    );
  }

  function toggleRegisteredTag(apiTag) {
    if (!apiTag?.id) return;
    setSelectedTags((prev) => {
      const on = prev.some((t) => t.id === apiTag.id);
      if (on) {
        return prev.filter((t) => t.id !== apiTag.id);
      }
      return [
        ...prev,
        {
          id: apiTag.id,
          nome: apiTag.nome,
          cor: resolveTagHex(apiTag.cor),
        },
      ];
    });
    setPulseTagKey(apiTag.id);
    if (!prefersReducedMotion) {
      window.setTimeout(() => setPulseTagKey(null), 220);
    } else {
      setPulseTagKey(null);
    }
  }

  return (
    <FormSign>
      <div style={{ position: 'relative' }}>
        {/* Modal */}
        <div style={{
          width: 860, maxWidth: 'calc(100vw - 80px)',
          background: 'var(--bg-2)', border: '1px solid var(--line)',
          borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 40px 100px rgba(0,0,0,0.55)', display: 'flex',
        }}>
          {/* Left aside */}
          <div style={{
            width: '38%', background: 'var(--bg-3)', padding: 32,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            minHeight: 480,
          }}>
            <div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                letterSpacing: 'var(--tracking)', color: 'var(--coral)',
                textTransform: 'uppercase', marginBottom: 10,
              }}>
                // new protocol
              </div>
              <h2 style={{
                fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 32,
                lineHeight: 1.05, letterSpacing: '-0.02em', margin: '0 0 14px',
                color: 'var(--ink)',
              }}>
                Create<br />Location
              </h2>
              <p style={{ color: 'var(--ink-3)', fontSize: 13, lineHeight: 1.55, margin: 0 }}>
                Estabelece um novo ponto de referência no atlas. Defina coordenadas e metadados para sincronizar com seus mapas.
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
          <div style={{ flex: 1, minWidth: 0, padding: '28px clamp(20px, 4vw, 32px) 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <h3 style={{
                margin: 0, fontSize: 16, lineHeight: 1.2, fontWeight: 600,
                color: 'var(--ink)', fontFamily: "'Inter', sans-serif",
              }}>
                Dados do local
              </h3>
              <p style={{ margin: 0, color: 'var(--ink-3)', fontSize: 12, lineHeight: 1.45 }}>
                Preencha os campos para registrar o ponto com precisao no mapa.
              </p>
            </div>

            <form onSubmit={handleSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 14 }}>
              <div>
                <FormField label="Nome">
                  <StyledInput
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Nome do local..."
                  />
                </FormField>
              </div>

              <div>
                <FormField label="Endereço">
                  <div style={{ position: 'relative' }}>
                    <StyledInput
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder="Buscar endereço..."
                    />
                    <SuggestionsList suggestions={suggestions} onSelect={handleSelectPlace} />
                  </div>
                </FormField>
              </div>

              <div>
                <FormField label="Coordenadas" icon="location_searching">
                  <StyledInput
                    value={coords}
                    onChange={e => setCoords(e.target.value)}
                    placeholder="Aguardando seleção..."
                    readOnly
                    style={{ paddingLeft: 40 }}
                  />
                </FormField>
              </div>

              <div>
                <FormField label="Tags">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {tagsLoading && (
                      <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Carregando tags…</span>
                    )}
                    {tagsLoadError && (
                      <span style={{ fontSize: 12, color: 'var(--rose)' }}>
                        Não foi possível carregar as tags. Você ainda pode usar + Nova.
                      </span>
                    )}
                    {!tagsLoading && !tagsLoadError && registeredTags.length === 0 && (
                      <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                        Nenhuma tag cadastrada ainda. Crie uma com + Nova ou cadastre tags no sistema.
                      </span>
                    )}

                    {!tagsLoading && registeredTags.length > 0 && (
                      <div>
                        <div style={{
                          fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                          letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-4)',
                          marginBottom: 8,
                        }}>
                          Tags cadastradas
                        </div>
                        <div style={{
                          display: 'flex', flexWrap: 'wrap', gap: 8,
                          padding: 12, borderRadius: 12,
                          background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line-soft)',
                        }}>
                          {registeredTags.map((apiTag) => {
                            const selected = selectedTagIds.has(apiTag.id);
                            const baseColor = resolveTagHex(apiTag.cor);
                            const pulse = !prefersReducedMotion && pulseTagKey === apiTag.id;
                            return (
                              <button
                                key={apiTag.id}
                                type="button"
                                onClick={() => toggleRegisteredTag(apiTag)}
                                title={selected ? 'Remover tag' : 'Adicionar tag'}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  borderRadius: 999,
                                  border: `1px solid ${selected ? hexToRgba(baseColor, 0.45) : hexToRgba(baseColor, 0.22)}`,
                                  background: selected ? hexToRgba(baseColor, 0.2) : 'rgba(255,255,255,0.02)',
                                  color: 'var(--ink)',
                                  padding: '7px 12px',
                                  fontSize: 12,
                                  lineHeight: 1.2,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transform: pulse ? 'scale(1.03)' : 'scale(1)',
                                  boxShadow: pulse ? `0 10px 26px -14px ${hexToRgba(baseColor, 0.45)}` : 'none',
                                  transition: prefersReducedMotion ? 'none' : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 220ms cubic-bezier(0.22, 1, 0.36, 1), border-color 160ms ease, background 160ms ease',
                                }}
                              >
                                <span style={{
                                  width: 8, height: 8, borderRadius: 99,
                                  background: baseColor,
                                  boxShadow: `0 0 0 2px ${hexToRgba(baseColor, 0.2)}`,
                                  flexShrink: 0,
                                }} />
                                <span style={{ whiteSpace: 'nowrap' }}>{apiTag.nome}</span>
                                {selected && (
                                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: baseColor }}>
                                    check
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {selectedTags.some((t) => !t.id) && (
                      <div>
                        <div style={{
                          fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                          letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-4)',
                          marginBottom: 8,
                        }}>
                          Tags novas
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {selectedTags.filter((t) => !t.id).map((t) => {
                            const key = (t?.nome || "").trim().toLowerCase();
                            const pulse = !prefersReducedMotion && pulseTagKey === key;
                            const baseColor = resolveTagHex(t?.cor);
                            return (
                              <button
                                key={`custom-${key}`}
                                type="button"
                                onClick={() => removeTag(t)}
                                title="Remover"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  borderRadius: 999,
                                  border: `1px solid ${hexToRgba(baseColor, 0.28)}`,
                                  background: hexToRgba(baseColor, 0.16),
                                  color: 'var(--ink)',
                                  padding: '8px 10px',
                                  fontSize: 12,
                                  lineHeight: 1.1,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transform: pulse ? 'scale(1.03)' : 'scale(1)',
                                  boxShadow: pulse ? `0 10px 26px -14px ${hexToRgba(baseColor, 0.55)}` : 'none',
                                  transition: prefersReducedMotion ? 'none' : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 220ms cubic-bezier(0.22, 1, 0.36, 1)',
                                }}
                              >
                                <span style={{
                                  width: 10, height: 10, borderRadius: 99,
                                  background: baseColor,
                                  boxShadow: `0 0 0 2px ${hexToRgba(baseColor, 0.18)}`,
                                  flexShrink: 0,
                                }} />
                                <span style={{ whiteSpace: 'nowrap' }}>{t?.nome}</span>
                                <span style={{
                                  marginLeft: 2,
                                  width: 16, height: 16,
                                  borderRadius: 99,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'var(--ink-2)',
                                  background: 'rgba(0,0,0,0.14)',
                                  fontSize: 12,
                                  lineHeight: 1,
                                  flexShrink: 0,
                                }}>
                                  ×
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setTagDraftOpen(v => !v)}
                        style={{
                          borderRadius: 999,
                          border: '1px dashed rgba(255,255,255,0.18)',
                          background: 'transparent',
                          color: 'var(--ink-3)',
                          padding: '8px 12px',
                          fontSize: 12,
                          lineHeight: 1.2,
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: prefersReducedMotion ? 'none' : 'transform 160ms cubic-bezier(0.22, 1, 0.36, 1), background 160ms cubic-bezier(0.22, 1, 0.36, 1)',
                        }}
                        onMouseEnter={(e) => { if (!prefersReducedMotion) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                        onMouseLeave={(e) => { if (!prefersReducedMotion) e.currentTarget.style.background = 'transparent'; }}
                      >
                        + Nova
                      </button>
                      {selectedTags.length > 0 && (
                        <span style={{ fontSize: 11, color: 'var(--ink-3)', marginLeft: 'auto' }}>
                          {selectedTags.length} selecionada{selectedTags.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        overflow: 'hidden',
                        maxHeight: tagDraftOpen ? 140 : 0,
                        opacity: tagDraftOpen ? 1 : 0,
                        transform: tagDraftOpen ? 'translateY(0)' : 'translateY(-6px)',
                        transition: prefersReducedMotion ? 'none' : 'max-height 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 160ms cubic-bezier(0.22, 1, 0.36, 1), transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
                      }}
                      aria-hidden={!tagDraftOpen}
                    >
                      <div style={{
                        marginTop: 2,
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--line-soft)',
                        borderRadius: 12,
                        padding: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center' }}>
                          <input
                            value={tagNameDraft}
                            onChange={(e) => setTagNameDraft(e.target.value)}
                            placeholder="Nome da categoria..."
                            style={{
                              ...inputStyle,
                              padding: '10px 12px',
                              fontSize: 12,
                              background: 'var(--bg-4)',
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addTagFromDraft();
                              }
                            }}
                          />
                          <input
                            type="color"
                            value={tagColorDraft}
                            onChange={(e) => setTagColorDraft(e.target.value)}
                            aria-label="Cor"
                            style={{
                              width: 44,
                              height: 38,
                              borderRadius: 10,
                              border: '1px solid var(--line)',
                              background: 'var(--bg-4)',
                              padding: 0,
                              cursor: 'pointer',
                            }}
                          />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                            {TAG_PALETTE.map((c) => {
                              const active = tagColorDraft.toLowerCase() === c.value.toLowerCase();
                              return (
                                <button
                                  key={c.value}
                                  type="button"
                                  onClick={() => setTagColorDraft(c.value)}
                                  title={c.name}
                                  style={{
                                    width: 18,
                                    height: 18,
                                    borderRadius: 99,
                                    background: c.value,
                                    border: active ? `2px solid ${hexToRgba(c.value, 0.75)}` : '1px solid rgba(255,255,255,0.12)',
                                    boxShadow: active ? `0 0 0 3px ${hexToRgba(c.value, 0.18)}` : 'none',
                                    cursor: 'pointer',
                                    transition: prefersReducedMotion ? 'none' : 'box-shadow 160ms cubic-bezier(0.22, 1, 0.36, 1), transform 160ms cubic-bezier(0.22, 1, 0.36, 1)',
                                  }}
                                />
                              );
                            })}
                          </div>

                          <button
                            type="button"
                            onClick={addTagFromDraft}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 999,
                              border: '1px solid rgba(255,107,94,0.22)',
                              background: 'rgba(255,107,94,0.12)',
                              color: 'var(--coral)',
                              padding: '8px 12px',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: prefersReducedMotion ? 'none' : 'transform 120ms cubic-bezier(0.22, 1, 0.36, 1)',
                            }}
                            onMouseDown={(e) => { if (!prefersReducedMotion) e.currentTarget.style.transform = 'scale(0.98)'; }}
                            onMouseUp={(e) => { if (!prefersReducedMotion) e.currentTarget.style.transform = 'scale(1)'; }}
                            onMouseLeave={(e) => { if (!prefersReducedMotion) e.currentTarget.style.transform = 'scale(1)'; }}
                          >
                            Adicionar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </FormField>
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--line-soft)', flexWrap: 'wrap',
              }}>
                <button
                  type="button"
                  onClick={handleDiscard}
                  style={{
                    background: 'transparent', color: 'var(--ink-2)',
                    border: '1px solid var(--line)', padding: '11px 18px',
                    borderRadius: 999, fontSize: 13, cursor: 'pointer', fontWeight: 500, minWidth: 98,
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
                    boxShadow: '0 8px 22px -6px var(--coral-glow), inset 0 1px 0 rgba(255,255,255,0.28)', minWidth: 148,
                  }}
                >
                  {isSubmitting ? "Salvando..." : "Registrar Local"}
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
