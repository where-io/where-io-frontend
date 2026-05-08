import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useMapActions } from './MapContext';

// Pin SVG alinhado ao design system (cor coral, borda clara)
import L from 'leaflet';

const WHERE_IO_MARKER_PATH =
  "M16 41s13-13.5 13-25A13 13 0 1 0 3 16c0 11.5 13 25 13 25z";

/** Cor padrão do pin (--coral) quando há 0 ou mais de uma tag */
const DEFAULT_PIN_FILL = "#FF6B5E";

const markerIconByFill = new Map();

function resolveFillFromTagCor(cor) {
  if (cor == null || String(cor).trim() === "") return DEFAULT_PIN_FILL;
  const s = String(cor).trim();
  if (s.startsWith("#")) {
    const body = s.slice(1);
    if (body.length === 3 || body.length === 6 || body.length === 8) return `#${body}`;
    return DEFAULT_PIN_FILL;
  }
  if (/^[\dA-Fa-f]{3}$|^[\dA-Fa-f]{6}$|^[\dA-Fa-f]{8}$/i.test(s)) return `#${s}`;
  return DEFAULT_PIN_FILL;
}

/** Uma tag no local → cor do pin igual à da tag; várias ou nenhuma → padrão */
function pinFillForLocation(loc) {
  const tags = loc?.tags;
  if (!Array.isArray(tags) || tags.length !== 1) return DEFAULT_PIN_FILL;
  return resolveFillFromTagCor(tags[0]?.cor);
}

function createWhereIoMarkerIcon(fillHex) {
  const safeFill =
    typeof fillHex === "string" && /^#[\dA-Fa-f]{3,8}$/.test(fillHex)
      ? fillHex
      : DEFAULT_PIN_FILL;
  return L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42" aria-hidden="true"><path d="${WHERE_IO_MARKER_PATH}" fill="${safeFill}" stroke="rgba(255,255,255,0.6)" stroke-width="1"/><circle cx="16" cy="16" r="6.8" fill="#ffffff"/></svg>`,
    className: "leaflet-div-icon where-io-map-marker",
    iconSize: [32, 42],
    iconAnchor: [16, 41],
    popupAnchor: [0, -38],
  });
}

function getMarkerIconForLocation(loc) {
  const fill = pinFillForLocation(loc);
  if (markerIconByFill.has(fill)) return markerIconByFill.get(fill);
  const icon = createWhereIoMarkerIcon(fill);
  markerIconByFill.set(fill, icon);
  return icon;
}

/**
 * Temas alinhados aos TileLayers comentados neste arquivo.
 * satellite: Esri World Imagery
 * terrain: Google Maps terrain (lyrs=t)
 * dark: Carto Dark Matter
 */
export const MAP_THEMES = {
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
  },
  terrain: {
    url: "https://{s}.google.com/vt/lyrs=t&x={x}&y={y}&z={z}",
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    attribution: "&copy; Google Maps",
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    subdomains: ["a", "b", "c", "d"],
    attribution: "&copy; OpenStreetMap &copy; CARTO",
  },
};

export const MAP_THEME_ORDER = ["satellite", "terrain", "dark"];

function FlyToLocation({ center, zoom }) {
  const map = useMap();
  const { setFlyTo } = useMapActions();

  useEffect(() => {
    setFlyTo(() => (nextCenter, nextZoom) => {
      if (!nextCenter) return;
      const validZoom = nextZoom || map.getZoom();
      map.flyTo(nextCenter, validZoom, {
        duration: 2,
        easeLinearity: 0.25,
      });
    });

    return () => setFlyTo(() => () => { });
  }, [map, setFlyTo]);

  return null;
}

const Mapa = ({ locations = [], onLocationSelect }) => {
  const { flyTo, mapTheme } = useMapActions();

  const position = [-23.51584714949877, -46.78674290051228];

  const tile = MAP_THEMES[mapTheme] || MAP_THEMES.satellite;

  const getLatLng = (loc) => {
    const latRaw = loc?.coordenadas?.latitude;
    const lngRaw = loc?.coordenadas?.longitude;
    const lat = typeof latRaw === "number" ? latRaw : parseFloat(latRaw);
    const lng = typeof lngRaw === "number" ? lngRaw : parseFloat(lngRaw);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return [lat, lng];
  };

  const handleLocationClick = (loc, latLng) => {
    if (latLng) {
      flyTo(latLng, 16);
    }

    if (onLocationSelect) {
      onLocationSelect(loc);
    }
  };

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: "100%", width: "100%", zIndex: "0" }}
      >
        <FlyToLocation />
        {/*
          Referência de temas (rodízio via MAP_THEMES / mapTheme no contexto):
          Google roadmap: lyrs=r — https://{s}.google.com/vt/lyrs=r&x={x}&y={y}&z={z}
          OSM: https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
        */}
        <TileLayer
          key={mapTheme}
          url={tile.url}
          attribution={tile.attribution}
          {...(tile.subdomains ? { subdomains: tile.subdomains } : {})}
        />

        {/* Agora sim, apenas expressão dentro do JSX */}
        {locations.map((loc) => {
          const latLng = getLatLng(loc);

          if (!latLng) return null;

          return (
            <Marker
              key={loc.id}
              position={latLng}
              icon={getMarkerIconForLocation(loc)}
              eventHandlers={{
                click: () => handleLocationClick(loc, latLng),
              }}
            >
              {/* <Popup>{loc.nome}</Popup> */}
            </Marker>
          );
        })}

        {/* <Marker position={position}>
          <Popup>Olá! Isso é um mapa do Google dentro do React.</Popup>
        </Marker> */}
      </MapContainer>
    </div>
  );
};

export default Mapa;