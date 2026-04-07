import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useMapActions } from './MapContext';

// Importante: Corrigir ícones do Leaflet que as vezes quebram no build do React
import L from 'leaflet';

let DefaultIcon = L.icon({
  // URL de um marcador vermelho padrão hospedado
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',

  iconSize: [28, 45],
  iconAnchor: [12, 41],   // A metade da largura e o total da altura para a ponta ficar no local certo
  popupAnchor: [1, -50],    // Ajusta onde o balão do popup aparece
  shadowSize: [45, 45]      // Aumenta a sombra também para combinar
});
L.Marker.prototype.options.icon = DefaultIcon;

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

const Map = ({ locations = [], onLocationSelect }) => {
  const { flyTo } = useMapActions();

  const position = [-23.51584714949877, -46.78674290051228];

  const [mapUrl, setMapUrl] = useState("");
  const [mapSubdomains, setMapSubdomains] = useState("");
  const [mapAttribution, setMapAttribution] = useState("");

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
        {/* <TileLayer
          url="https://{s}.google.com/vt/lyrs=r&x={x}&y={y}&z={z}"
          subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
          attribution='&copy; Google Maps'
        /> */}
        {/* <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap &copy; CARTO"
        /> */}
        {/* <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        /> */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri"
        />

        {/* Agora sim, apenas expressão dentro do JSX */}
        {locations.map((loc) => {
          const latLng = getLatLng(loc);

          if (!latLng) return null;

          return (
            <Marker
              key={loc.id}
              position={latLng}
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

export default Map;