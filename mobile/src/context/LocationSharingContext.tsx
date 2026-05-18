import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FriendLocation, LocationPayload } from '../models/FriendLocation';
import { wsService } from '../service/WebSocketService';
import { getAccessToken, setOnTokenRefreshedCallback } from '../service/authTokenStore';
import { useAuth } from './AuthContext';

const TOGGLES_KEY = '@whereio/location_toggles';

interface LocationSharingContextValue {
  toggles: Record<string, boolean>;
  friendLocations: Record<string, FriendLocation>;
  isConnected: boolean;
  setToggle: (friendId: string, active: boolean) => void;
  sendLocation: (payload: LocationPayload) => void;
  activeFriendIds: string[];
}

const LocationSharingContext = createContext<LocationSharingContextValue | null>(null);

export function LocationSharingProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authReady } = useAuth();
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const [friendLocations, setFriendLocations] = useState<Record<string, FriendLocation>>({});
  const [isConnected, setIsConnected] = useState(false);

  // Load persisted toggles on mount
  useEffect(() => {
    AsyncStorage.getItem(TOGGLES_KEY).then((raw) => {
      if (raw) {
        try { setToggles(JSON.parse(raw)); } catch {}
      }
    });
  }, []);

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

  const setToggle = useCallback((friendId: string, active: boolean) => {
    setToggles((prev) => {
      const next = { ...prev, [friendId]: active };
      AsyncStorage.setItem(TOGGLES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const sendLocation = useCallback((payload: LocationPayload) => {
    wsService.sendLocation(payload);
  }, []);

  const activeFriendIds = Object.entries(toggles)
    .filter(([, active]) => active)
    .map(([id]) => id);

  return (
    <LocationSharingContext.Provider value={{
      toggles,
      friendLocations,
      isConnected,
      setToggle,
      sendLocation,
      activeFriendIds,
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
