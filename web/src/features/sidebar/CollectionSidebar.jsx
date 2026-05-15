import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LocaisService } from "../../../../packages/service/LocaisService";
import { TagService } from "../../../../packages/service/TagService";
import { useMapActions } from "../mapa/MapContext.jsx";

function resolveTagColor(cor) {
  if (cor == null || String(cor).trim() === "") return "var(--coral)";
  const s = String(cor).trim();
  if (s.startsWith("#")) return s;
  if (/^[\dA-Fa-f]{3}$|^[\dA-Fa-f]{6}$|^[\dA-Fa-f]{8}$/i.test(s)) return `#${s}`;
  return s;
}

/** Fundo suave para chip ativo; só expande hex #RRGGBB com alpha. */
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

function placeHasTag(place, tagId) {
  if (!tagId) return true;
  const ids = place?.idTags;
  if (Array.isArray(ids) && ids.some((id) => id === tagId)) return true;
  const tags = place?.tags;
  if (!Array.isArray(tags)) return false;
  return tags.some((t) => t && (t.id === tagId));
}

function PlaceItem({ place, active, onClick, onRemove, exiting, onExitAnimationEnd }) {
  const displayName = place.name || place.nome || "Local sem nome";
  const displayAddr =
    place.subtitle ||
    [place?.endereco?.logradouro, place?.endereco?.cidade]
      .filter(Boolean)
      .join(' · ');

  return (
    <div
      className={exiting ? "collection-place-item-wrap--exit" : undefined}
      onAnimationEnd={(e) => {
        if (!exiting) return;
        if (e.target !== e.currentTarget) return;
        if (!String(e.animationName || "").includes("collection-place-exit")) return;
        onExitAnimationEnd?.();
      }}
      style={{ borderRadius: 10 }}
    >
    <div
      onClick={exiting ? undefined : onClick}
      style={{
        display: 'grid', gridTemplateColumns: '30px 1fr auto', alignItems: 'center',
        gap: 10, padding: active ? '10px 12px 10px 9px' : '10px 12px',
        borderRadius: 10, cursor: exiting ? 'default' : 'pointer', position: 'relative',
        background: active ? 'rgba(255,107,94,0.08)' : 'transparent',
        borderLeft: active ? '3px solid var(--coral)' : '3px solid transparent',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { if (!active && !exiting) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
      onMouseLeave={e => { if (!active && !exiting) e.currentTarget.style.background = ''; }}
    >
      <div style={{
        width: 26, height: 26, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${active ? 'var(--coral)' : 'var(--line)'}`,
        color: active ? 'var(--coral)' : 'var(--ink-3)', flexShrink: 0,
      }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}>
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 1 }}>
          {displayName}
        </div>
      <div style={{
        fontSize: 11, color: 'var(--ink-3)', whiteSpace: 'nowrap',
        overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180,
      }}>
          {displayAddr || 'Endereço não informado'}
        </div>
      </div>
      <button
        type="button"
        aria-label="Remover da coleção"
        disabled={exiting}
        onClick={(e) => {
          e.stopPropagation();
          if (exiting) return;
          onRemove?.(place);
        }}
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: 'transparent',
          border: '1px solid transparent',
          color: 'var(--coral)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: exiting ? 'not-allowed' : 'pointer',
          flexShrink: 0,
          opacity: exiting ? 0.5 : 1,
          transition: 'background 0.12s, border-color 0.12s, opacity 0.15s ease-out',
        }}
        onMouseEnter={(e) => {
          if (exiting) return;
          e.currentTarget.style.background = 'rgba(255,107,94,0.12)';
          e.currentTarget.style.borderColor = 'rgba(255,107,94,0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'transparent';
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}>
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
    </div>
  );
}

export default function CollectionSidebar({
  /** Quando definido (ex.: estado do Home), a lista espelha esse array e atualiza ao refetch do pai. */
  places: placesProp,
  onClose,
  isOpen = false,
  onPlaceSelect,
  onPlaceRemoved,
  selectedPlaceId = null,
}) {
  const [activeTagId, setActiveTagId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [placesInternal, setPlacesInternal] = useState([]);
  const [tags, setTags] = useState([]);
  const [removingPlaceId, setRemovingPlaceId] = useState(null);
  const removalFinalizeGuardRef = useRef(null);
  const { flyTo } = useMapActions();

  const parentFeedsPlaces = placesProp !== undefined;
  const places = parentFeedsPlaces ? placesProp : placesInternal;

  const activePlace = useMemo(
    () => selectedPlaceId ?? places[0]?.id ?? null,
    [places, selectedPlaceId]
  );

  useEffect(() => {
    if (parentFeedsPlaces) return undefined;
    let mounted = true;
    LocaisService.getAll()
      .then(r => r.json())
      .then(data => {
        if (!mounted || !Array.isArray(data)) return;
        setPlacesInternal(data);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [parentFeedsPlaces]);

  useEffect(() => {
    let mounted = true;
    TagService.getAll()
      .then((r) => {
        if (!r.ok) return [];
        return r.json();
      })
      .then((data) => {
        if (!mounted || !Array.isArray(data)) return;
        setTags(data);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const filteredPlaces = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let list = places.filter((place) => placeHasTag(place, activeTagId));

    if (!query) return list;

    return list.filter((place) => {
      const name = (place?.name || place?.nome || "").toLowerCase();
      const street = (place?.endereco?.logradouro || "").toLowerCase();
      const city = (place?.endereco?.cidade || "").toLowerCase();
      const subtitle = (place?.subtitle || "").toLowerCase();
      return (
        name.includes(query) ||
        street.includes(query) ||
        city.includes(query) ||
        subtitle.includes(query)
      );
    });
  }, [places, searchQuery, activeTagId]);

  const handlePlaceClick = (place) => {
    if (removingPlaceId) return;
    const latitude = Number.parseFloat(place?.coordenadas?.latitude);
    const longitude = Number.parseFloat(place?.coordenadas?.longitude);

    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      flyTo([latitude, longitude], 17);
    }

    onPlaceSelect?.(place);
  };

  const finalizePlaceRemoval = useCallback(
    (place) => {
      const id = place?.id;
      if (!id) return;
      if (removalFinalizeGuardRef.current === id) return;
      removalFinalizeGuardRef.current = id;
      setRemovingPlaceId(null);
      if (!parentFeedsPlaces) {
        setPlacesInternal((prev) => prev.filter((p) => p.id !== id));
      }
      onPlaceRemoved?.(place);
    },
    [onPlaceRemoved, parentFeedsPlaces]
  );

  const handleRemovePlace = (place) => {
    const id = place?.id;
    if (!id || removingPlaceId) return;
    removalFinalizeGuardRef.current = null;
    LocaisService.delete(id)
      .then((res) => {
        if (!res.ok) return;
        const reduceMotion =
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduceMotion) {
          finalizePlaceRemoval(place);
          return;
        }
        setRemovingPlaceId(id);
        window.setTimeout(() => finalizePlaceRemoval(place), 420);
      })
      .catch(() => {});
  };

  return (
    <div style={{
      position: 'fixed', top: 18, left: 274, width: 320,
      maxHeight: 'calc(100vh - 140px)',
      background: 'var(--bg-2)', border: '1px solid var(--line)',
      borderRadius: 16, display: 'flex', flexDirection: 'column',
      overflow: 'hidden', zIndex: 35,
      boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
      transform: isOpen ? 'translateX(0) scale(1)' : 'translateX(-16px) scale(0.97)',
      opacity: isOpen ? 1 : 0,
      pointerEvents: isOpen ? 'auto' : 'none',
      transition: 'transform 0.2s ease, opacity 0.2s ease',
    }}>
      {/* Header */}
      <div style={{
        padding: '18px 20px 14px', display: 'flex', alignItems: 'center',
        gap: 10, borderBottom: '1px solid var(--line-soft)',
      }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ width: 16, height: 16, color: 'var(--coral)', flexShrink: 0 }}>
          <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
        </svg>
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 17,
          flex: 1, color: 'var(--ink)',
        }}>
          Saved Places
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--ink-3)' }}>
          {filteredPlaces.length}
        </span>
        <button
          onClick={onClose}
          style={{
            width: 28, height: 28, borderRadius: 8, background: 'transparent',
            border: '1px solid var(--line)', color: 'var(--ink-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tag filters from API */}
      <div style={{
        display: 'flex', gap: 4, padding: '12px 14px',
        borderBottom: '1px solid var(--line-soft)', overflowX: 'auto',
      }} className="scrollbar-hide">
        <span
          role="button"
          tabIndex={0}
          onClick={() => setActiveTagId(null)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setActiveTagId(null);
            }
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            padding: "7px 11px",
            borderRadius: 999,
            cursor: "pointer",
            whiteSpace: "nowrap",
            background: activeTagId == null ? "rgba(255,255,255,0.06)" : "transparent",
            color: activeTagId == null ? "var(--ink)" : "var(--ink-3)",
            border: activeTagId == null ? "1px solid var(--line)" : "1px solid transparent",
            transition: "all 0.12s",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14, color: "var(--ink-2)" }}>
            grid_view
          </span>
          Todos
        </span>
        {tags.map((tag) => {
          const color = resolveTagColor(tag?.cor);
          const active = activeTagId === tag.id;
          return (
            <span
              key={tag.id}
              role="button"
              tabIndex={0}
              onClick={() => setActiveTagId(tag.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveTagId(tag.id);
                }
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "7px 11px",
                borderRadius: 999,
                cursor: "pointer",
                whiteSpace: "nowrap",
                background: active ? tagChipTint(tag?.cor, 0.18) : "transparent",
                color: active ? color : "var(--ink-3)",
                border: active ? `1px solid ${color}` : "1px solid transparent",
                transition: "all 0.12s",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14, color }}>
                label
              </span>
              {tag.nome || "Tag"}
            </span>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--line-soft)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px',
          background: 'var(--bg-4)', borderRadius: 10, color: 'var(--ink-3)', fontSize: 12,
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ width: 13, height: 13, flexShrink: 0 }}>
            <path d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
          </svg>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar nas coleções..."
            style={{
              border: 0,
              outline: "none",
              background: "transparent",
              color: "var(--ink)",
              fontSize: 12,
              width: "100%",
            }}
          />
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }} className="sidebar-scroll">
        {filteredPlaces.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '32px 16px',
            color: 'var(--ink-3)', fontSize: 13,
          }}>
            {places.length === 0 ? "Nenhum local salvo" : "Nenhum resultado encontrado"}
          </div>
        ) : (
          filteredPlaces.map(place => (
            <PlaceItem
              key={place.id}
              place={place}
              active={activePlace === place.id}
              exiting={removingPlaceId === place.id}
              onExitAnimationEnd={() => finalizePlaceRemoval(place)}
              onClick={() => handlePlaceClick(place)}
              onRemove={handleRemovePlace}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 14px', borderTop: '1px solid var(--line-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
          borderRadius: 999, background: 'rgba(255,107,94,0.12)',
          border: '1px solid rgba(255,107,94,0.18)', color: 'var(--coral)',
          fontSize: 12, cursor: 'pointer',
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
            style={{ width: 11, height: 11 }}>
            <path d="M12 5v14M5 12h14" />
          </svg>
          New list
        </button>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--ink-3)' }}>
          Sorted · nome ↓
        </span>
      </div>
    </div>
  );
}
