import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';

export type MapThemeId = 'satellite' | 'terrain' | 'dark';

export const MAP_THEME_ORDER: MapThemeId[] = ['satellite', 'terrain', 'dark'];

export const MAP_THEME_LABELS: Record<MapThemeId, string> = {
  satellite: 'Satellite',
  terrain: 'Terrain',
  dark: 'Dark',
};

export const MAP_THEME_SUB: Record<MapThemeId, string> = {
  satellite: 'Esri World Imagery',
  terrain: 'Google Maps terrain',
  dark: 'Carto Dark Matter',
};

export const MAP_TILE_THEMES: Record<
  MapThemeId,
  { url: string; subdomains: string }
> = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    subdomains: '',
  },
  terrain: {
    url: 'https://{s}.google.com/vt/lyrs=t&x={x}&y={y}&z={z}',
    subdomains: 'mt0 mt1 mt2 mt3',
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    subdomains: 'abcd',
  },
};

const STORAGE_KEY = 'whereio_map_theme';

function readStoredTheme(): MapThemeId {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') {
    return 'satellite';
  }
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && MAP_THEME_ORDER.includes(v as MapThemeId)) return v as MapThemeId;
  } catch {
    /* ignore */
  }
  return 'satellite';
}

type MapThemeContextValue = {
  mapTheme: MapThemeId;
  setMapTheme: (theme: MapThemeId) => void;
};

const MapThemeContext = createContext<MapThemeContextValue | null>(null);

export function MapThemeProvider({ children }: { children: React.ReactNode }) {
  const [mapTheme, setMapThemeState] = useState<MapThemeId>(readStoredTheme);

  const setMapTheme = useCallback((theme: MapThemeId) => {
    if (!MAP_THEME_ORDER.includes(theme)) return;
    setMapThemeState(theme);
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, mapTheme);
      } catch {
        /* ignore */
      }
    }
  }, [mapTheme]);

  const value = useMemo(
    () => ({ mapTheme, setMapTheme }),
    [mapTheme, setMapTheme],
  );

  return (
    <MapThemeContext.Provider value={value}>{children}</MapThemeContext.Provider>
  );
}

export function useMapTheme(): MapThemeContextValue {
  const ctx = useContext(MapThemeContext);
  if (!ctx) {
    throw new Error('useMapTheme must be used within MapThemeProvider');
  }
  return ctx;
}
