import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { FriendLocation, LocationPayload } from '../models/FriendLocation';
import { wsService } from '../service/WebSocketService';
import { getAccessToken, setOnTokenRefreshedCallback } from '../service/authTokenStore';
import { useAuth } from './AuthContext';

interface LocationSharingContextValue {
  friendLocations: Record<string, FriendLocation>;
  isConnected: boolean;
  sendLocation: (payload: LocationPayload) => void;
}

const LocationSharingContext = createContext<LocationSharingContextValue | null>(null);

export function LocationSharingProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authReady } = useAuth();
  const [friendLocations, setFriendLocations] = useState<Record<string, FriendLocation>>({});
  const [isConnected, setIsConnected] = useState(false);

  // Connect WebSocket only after auth is ready and user is authenticated
  useEffect(() => {
    if (!authReady || !isAuthenticated) {
      if (!isAuthenticated && authReady) {
        wsService.disconnect();
        setIsConnected(false);
      }
      return;
    }

    wsService.connect(getAccessToken, (location: FriendLocation) => {
      console.log('[WS] Localização recebida:', location);
      setFriendLocations((prev) => ({ ...prev, [location.userId]: location }));
      setIsConnected(true);
    });

    setIsConnected(wsService.isConnected);

    setOnTokenRefreshedCallback(() => wsService.reconnect());

    return () => {
      setOnTokenRefreshedCallback(null);
      wsService.disconnect();
      setIsConnected(false);
    };
  }, [authReady, isAuthenticated]);

  const sendLocation = useCallback((payload: LocationPayload) => {
    wsService.sendLocation(payload);
  }, []);

  return (
    <LocationSharingContext.Provider value={{
      friendLocations,
      isConnected,
      sendLocation,
    }}>
      {children}
    </LocationSharingContext.Provider>
  );
}

export function useLocationSharing(): LocationSharingContextValue {
  const ctx = useContext(LocationSharingContext);
  if (!ctx) throw new Error('useLocationSharing must be used inside LocationSharingProvider');
  return ctx;
}
