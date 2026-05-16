import React, { useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Local } from '../service/LocaisService';
import { API_URL } from '../service/config';
import { MapThemeId, MAP_TILE_THEMES } from '../context/MapThemeContext';

interface UserLocation {
  lat: number;
  lng: number;
}

interface Props {
  locations: Local[];
  mapTheme?: MapThemeId;
  selectedLocationId?: string | null;
  onLocationSelect?: (location: Local) => void;
  flyToCoords?: UserLocation | null;
  /** Posição real do usuário — atualiza o marcador de avatar no mapa. */
  userLocation?: UserLocation | null;
  /** Iniciais do usuário exibidas dentro do marcador de avatar. */
  userInitials?: string;
  /** Incrementar para acionar voo animado até a posição do usuário. */
  centerOnUserTrigger?: number;
  onMapPress?: () => void;
}

function buildHtml(apiUrl: string, initialTheme: MapThemeId): string {
  const themesJson = JSON.stringify(MAP_TILE_THEMES);
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#0A1028; }
  #map { width:100vw; height:100vh; }
  .leaflet-control-zoom a {
    background:#1B2244 !important; color:#F2F4FF !important;
    border-color:rgba(255,255,255,0.08) !important;
  }
  .leaflet-control-zoom a:hover { background:#242C55 !important; }
  .leaflet-control-attribution { display:none !important; }
  .leaflet-bar {
    border:1px solid rgba(255,255,255,0.08) !important;
    border-radius:10px !important;
    overflow:hidden;
  }

  /* ── User marker pulse rings ── */
  @keyframes userPulse {
    0%   { transform:scale(1);   opacity:0.75; }
    70%  { transform:scale(1.7); opacity:0;    }
    100% { transform:scale(1.7); opacity:0;    }
  }
  .user-pulse-a {
    position:absolute;
    inset:-9px;
    border-radius:50%;
    border:2px solid rgba(140,123,255,0.65);
    animation:userPulse 2.2s ease-out infinite;
    pointer-events:none;
  }
  .user-pulse-b {
    position:absolute;
    inset:-4px;
    border-radius:50%;
    border:1.5px solid rgba(140,123,255,0.4);
    animation:userPulse 2.2s ease-out 0.55s infinite;
    pointer-events:none;
  }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var API_URL = '${apiUrl}';
var MAP_TILE_THEMES = ${themesJson};
var map = L.map('map', { zoomControl: false });
var tileLayer = null;

/* ── Map theme ── */
function applyMapTheme(theme) {
  var t = MAP_TILE_THEMES[theme] || MAP_TILE_THEMES.satellite;
  if (tileLayer) map.removeLayer(tileLayer);
  var opts = { maxZoom: 20 };
  if (t.subdomains) opts.subdomains = t.subdomains.split(' ');
  tileLayer = L.tileLayer(t.url, opts).addTo(map);
}

applyMapTheme('${initialTheme}');
map.setView([-23.5505, -46.6333], 12);

/* ── Location pins ── */
var markers = {};
var _locations = {};

function normalizeColor(c) {
  if (!c) return '#FF6B5E';
  return c.startsWith('#') ? c : '#' + c;
}

function pinSvg(color, visited) {
  if (visited) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="34" viewBox="0 0 32 42" fill="none">'
      + '<path d="M16 41s13-13.5 13-25A13 13 0 1 0 3 16c0 11.5 13 25 13 25z"'
      + ' fill="' + color + '" stroke="rgba(255,255,255,0.6)" stroke-width="1"/>'
      + '<path d="M11 15.5l3.5 3.5L21 12.5" stroke="#0A1028" stroke-width="2.6"'
      + ' stroke-linecap="round" stroke-linejoin="round" fill="none"/>'
      + '</svg>';
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="34" viewBox="0 0 32 42" fill="none">'
    + '<path d="M16 41s13-13.5 13-25A13 13 0 1 0 3 16c0 11.5 13 25 13 25z"'
    + ' fill="rgba(10,16,40,0.65)" stroke="' + color + '" stroke-width="1.6" stroke-dasharray="3 2.5"/>'
    + '<circle cx="16" cy="16" r="2.5" fill="' + color + '" fill-opacity="0.55"/>'
    + '</svg>';
}

function updateLocations(locs) {
  Object.values(markers).forEach(function(m) { map.removeLayer(m); });
  markers = {};
  _locations = {};

  locs.forEach(function(loc) {
    if (!loc.coordenadas) return;
    _locations[loc.id] = loc;

    var color = '#FF6B5E';
    if (loc.tags && loc.tags.length === 1) color = normalizeColor(loc.tags[0].cor);
    var visited = !!(loc.visitas && loc.visitas.length > 0);

    var icon = L.divIcon({
      html: pinSvg(color, visited),
      iconSize: [26, 34],
      iconAnchor: [13, 34],
      className: '',
    });

    var m = L.marker([loc.coordenadas.latitude, loc.coordenadas.longitude], { icon: icon });
    m.on('click', function() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({ type: 'locationSelected', locationId: loc.id })
        );
      }
    });
    m.addTo(map);
    markers[loc.id] = m;
  });
}

/* ── User avatar marker ── */
var userMarker = null;

function buildUserMarkerHtml(initials) {
  var label = (initials && initials.length > 0) ? initials.slice(0,2).toUpperCase() : 'EU';
  return '<div style="'
    + 'width:40px;height:40px;border-radius:50%;'
    + 'background:linear-gradient(135deg,#8C7BFF,#FF6B5E);'
    + 'display:flex;align-items:center;justify-content:center;'
    + 'border:2.5px solid white;'
    + 'box-shadow:0 4px 14px rgba(0,0,0,0.5),0 0 0 1px rgba(255,255,255,0.08);'
    + 'position:relative;">'
    + '<div class="user-pulse-a"></div>'
    + '<div class="user-pulse-b"></div>'
    + '<span style="'
    + 'color:white;font-size:13px;font-weight:700;'
    + 'font-family:sans-serif;letter-spacing:-0.3px;'
    + 'position:relative;z-index:1;user-select:none;">'
    + label
    + '</span>'
    + '</div>';
}

/**
 * Cria ou move o marcador do usuário.
 * flyTo=true → voa até a posição (usado apenas na primeira fix de GPS).
 */
function updateUserLocation(lat, lng, initials, flyTo) {
  if (!userMarker) {
    var icon = L.divIcon({
      html: buildUserMarkerHtml(initials),
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      className: '',
    });
    userMarker = L.marker([lat, lng], { icon: icon, zIndexOffset: -500 }).addTo(map);
  } else {
    userMarker.setLatLng([lat, lng]);
  }

  if (flyTo) {
    // setView é instantâneo — sem animação no posicionamento inicial
    map.setView([lat, lng], 15);
  }
}

/* ── Fly to coords ── */
function flyToLocation(lat, lng) {
  map.flyTo([lat, lng], 16, { animate: true, duration: 1.5, easeLinearity: 0.25 });
}

/* ── Map tap (dismiss selection) ── */
map.on('click', function() {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapClicked' }));
  }
});

/* ── Message handler ── */
function handleMessage(data) {
  try {
    var msg = JSON.parse(data);
    if (msg.type === 'updateLocations') updateLocations(msg.locations);
    if (msg.type === 'flyTo') flyToLocation(msg.lat, msg.lng);
    if (msg.type === 'setMapTheme') applyMapTheme(msg.theme);
    if (msg.type === 'setUserLocation') {
      updateUserLocation(msg.lat, msg.lng, msg.initials, msg.flyTo);
    }
  } catch(e) {}
}

document.addEventListener('message', function(e) { handleMessage(e.data); });
window.addEventListener('message',   function(e) { handleMessage(e.data); });
</script>
</body>
</html>`;
}

export function LeafletMap({
  locations,
  mapTheme = 'satellite',
  selectedLocationId,
  onLocationSelect,
  flyToCoords,
  userLocation,
  userInitials = 'EU',
  centerOnUserTrigger = 0,
  onMapPress,
}: Props) {
  const webViewRef = useRef<WebView>(null);
  const loadedRef = useRef(false);
  const pendingLocationsRef = useRef<Local[]>([]);
  const flyToCoordsRef = useRef(flyToCoords ?? null);
  flyToCoordsRef.current = flyToCoords ?? null;

  // HTML gerado UMA VEZ com o tema inicial.
  // Mudanças de tema posteriores são aplicadas via injectJavaScript,
  // evitando que o WebView recarregue e perca o marcador do usuário.
  const htmlRef = useRef<string | null>(null);
  if (!htmlRef.current) htmlRef.current = buildHtml(API_URL, mapTheme);

  // Ref do tema atual para que handleLoad possa aplicar
  // o tema correto caso ele tenha mudado durante o carregamento.
  const mapThemeRef = useRef(mapTheme);
  mapThemeRef.current = mapTheme;

  // Keep latest user location / initials in refs so handleLoad can read them
  const userLocationRef = useRef<UserLocation | null>(userLocation ?? null);
  const userInitialsRef = useRef(userInitials);
  userLocationRef.current = userLocation ?? null;
  userInitialsRef.current = userInitials;

  // Track whether we've already sent the first user location (= fly to it once)
  const userLocationSentRef = useRef(false);

  /* ── helpers ── */
  const injectUserLocation = useCallback((loc: UserLocation, fly: boolean) => {
    if (!webViewRef.current) return;
    const { lat, lng } = loc;
    const initials = userInitialsRef.current;
    webViewRef.current.injectJavaScript(
      `updateUserLocation(${lat},${lng},${JSON.stringify(initials)},${fly}); true;`
    );
  }, []);

  const sendLocations = useCallback((locs: Local[]) => {
    if (!loadedRef.current || !webViewRef.current) {
      pendingLocationsRef.current = locs;
      return;
    }
    webViewRef.current.injectJavaScript(`updateLocations(${JSON.stringify(locs)}); true;`);
  }, []);

  /* ── Effects ── */

  // Sync location pins
  useEffect(() => { sendLocations(locations); }, [locations, sendLocations]);

  // Fly to selected location pin
  useEffect(() => {
    if (!selectedLocationId || !loadedRef.current || !webViewRef.current) return;
    const loc = locations.find(l => l.id === selectedLocationId);
    if (loc?.coordenadas) {
      webViewRef.current.injectJavaScript(
        `flyToLocation(${loc.coordenadas.latitude},${loc.coordenadas.longitude}); true;`
      );
    }
  }, [selectedLocationId, locations]);

  // Fly to explicit coords (e.g. newly created location)
  useEffect(() => {
    if (!flyToCoords || !loadedRef.current || !webViewRef.current) return;
    webViewRef.current.injectJavaScript(
      `flyToLocation(${flyToCoords.lat},${flyToCoords.lng}); true;`
    );
  }, [flyToCoords]);

  // Map theme
  useEffect(() => {
    if (!loadedRef.current || !webViewRef.current) return;
    webViewRef.current.injectJavaScript(`applyMapTheme('${mapTheme}'); true;`);
  }, [mapTheme]);

  // User location — move avatar marker; fly only on first fix
  useEffect(() => {
    if (!userLocation || !loadedRef.current || !webViewRef.current) return;
    const fly = !userLocationSentRef.current;
    userLocationSentRef.current = true;
    injectUserLocation(userLocation, fly);
  }, [userLocation, injectUserLocation]);

  // Center on user — triggered by button press in parent
  useEffect(() => {
    if (!centerOnUserTrigger || !loadedRef.current || !webViewRef.current) return;
    const loc = userLocationRef.current;
    if (!loc) return;
    webViewRef.current.injectJavaScript(`flyToLocation(${loc.lat},${loc.lng}); true;`);
  }, [centerOnUserTrigger]);

  /* ── WebView callbacks ── */

  const handleLoad = useCallback(() => {
    loadedRef.current = true;

    // Garante que o tema atual está aplicado (pode ter mudado durante o carregamento)
    webViewRef.current?.injectJavaScript(`applyMapTheme('${mapThemeRef.current}'); true;`);

    // Flush pending location pins
    if (pendingLocationsRef.current.length > 0) {
      sendLocations(pendingLocationsRef.current);
      pendingLocationsRef.current = [];
    }

    // Fly to coords queued before load
    const fly = flyToCoordsRef.current;
    if (fly && webViewRef.current) {
      webViewRef.current.injectJavaScript(`flyToLocation(${fly.lat},${fly.lng}); true;`);
    }

    // Send user location if already known (map loaded after GPS fix)
    const ul = userLocationRef.current;
    if (ul && !userLocationSentRef.current) {
      userLocationSentRef.current = true;
      injectUserLocation(ul, true);
    }
  }, [sendLocations, injectUserLocation]);

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'locationSelected' && onLocationSelect) {
        const loc = locations.find(l => l.id === msg.locationId);
        if (loc) onLocationSelect(loc);
      }
      if (msg.type === 'mapClicked') {
        onMapPress?.();
      }
    } catch {}
  }, [locations, onLocationSelect, onMapPress]);

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlRef.current! }}
        javaScriptEnabled
        domStorageEnabled
        onLoadEnd={handleLoad}
        onMessage={handleMessage}
        style={StyleSheet.absoluteFillObject}
        scrollEnabled={false}
      />
    </View>
  );
}
