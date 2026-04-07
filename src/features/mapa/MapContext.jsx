import React, { createContext, useContext, useMemo, useState } from "react";

const MapActionsContext = createContext(null);

export function MapActionsProvider({ children }) {
  const [flyTo, setFlyTo] = useState(() => () => {});

  const value = useMemo(() => ({ flyTo, setFlyTo }), [flyTo]);

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
