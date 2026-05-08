import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const MapActionsContext = createContext(null);

const MAP_THEME_STORAGE_KEY = "whereio_map_theme";
const VALID_MAP_THEMES = ["satellite", "terrain", "dark"];

function readStoredMapTheme() {
  try {
    const v = localStorage.getItem(MAP_THEME_STORAGE_KEY);
    if (v && VALID_MAP_THEMES.includes(v)) return v;
  } catch {
    /* ignore */
  }
  return "satellite";
}

export function MapActionsProvider({ children }) {
  const [flyTo, setFlyTo] = useState(() => () => {});
  const [mapTheme, setMapThemeState] = useState(readStoredMapTheme);

  const setMapTheme = useCallback((theme) => {
    if (!VALID_MAP_THEMES.includes(theme)) return;
    setMapThemeState(theme);
    try {
      localStorage.setItem(MAP_THEME_STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ flyTo, setFlyTo, mapTheme, setMapTheme }),
    [flyTo, mapTheme, setMapTheme],
  );

  return (
    <MapActionsContext.Provider value={value}>
      {children}
    </MapActionsContext.Provider>
  );
}

export function useMapActions() {
  const context = useContext(MapActionsContext);

  if (!context) {
    throw new Error("useMapActions must be used within MapActionsProvider");
  }

  return context;
}
