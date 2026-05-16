import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  loginRequest,
  registerRequest,
  formatAuthError,
} from '../service/authService';
import {
  getRefreshToken,
  saveRefreshToken,
  clearRefreshToken,
} from '../service/authStorage';
import { getAccessToken, setAccessToken, setOnExpiredCallback } from '../service/authTokenStore';
import { performTokenRefresh } from '../service/refreshCoordinator';
import { decodeJwtPayload, type JwtClaims } from '../service/jwtDecode';

type User = JwtClaims;

interface AuthResult {
  ok: boolean;
  message?: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  authReady: boolean;
  user: User | null;
  login: (email: string, password: string, remember: boolean) => Promise<AuthResult>;
  register: (email: string, password: string, nome: string, remember: boolean) => Promise<AuthResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const applyTokens = useCallback((accessToken: string, refreshToken: string, remember: boolean) => {
    setAccessToken(accessToken);
    setUser(decodeJwtPayload(accessToken));
    setIsAuthenticated(true);
    if (remember) {
      saveRefreshToken(refreshToken);
    }
  }, []);

  // Reacts when token expires (e.g. after failed 401 refresh)
  useEffect(() => {
    setOnExpiredCallback(() => {
      setIsAuthenticated(false);
      setUser(null);
      clearRefreshToken();
    });
    return () => setOnExpiredCallback(null);
  }, []);

  // Bootstrap: try to restore session from stored refresh token
  useEffect(() => {
    (async () => {
      try {
        const storedRefresh = await getRefreshToken();
        if (storedRefresh) {
          const ok = await performTokenRefresh();
          if (ok) {
            const token = getAccessToken();
            if (token) {
              setUser(decodeJwtPayload(token));
              setIsAuthenticated(true);
            }
          }
        }
      } finally {
        setAuthReady(true);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string, remember: boolean): Promise<AuthResult> => {
    const result = await loginRequest(email, password);
    if (result.ok && result.data?.accessToken && result.data?.refreshToken) {
      applyTokens(result.data.accessToken, result.data.refreshToken, remember);
      return { ok: true };
    }
    return { ok: false, message: formatAuthError(result.data) };
  }, [applyTokens]);

  const register = useCallback(async (email: string, password: string, nome: string, remember: boolean): Promise<AuthResult> => {
    const result = await registerRequest(email, password, nome);
    if (result.ok && result.data?.accessToken && result.data?.refreshToken) {
      applyTokens(result.data.accessToken, result.data.refreshToken, remember);
      return { ok: true };
    }
    return { ok: false, message: formatAuthError(result.data) };
  }, [applyTokens]);

  const logout = useCallback(() => {
    setAccessToken(null);
    setIsAuthenticated(false);
    setUser(null);
    clearRefreshToken();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, authReady, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
