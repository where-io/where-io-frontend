import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  getAccessTokenSnapshot,
  subscribeAccessToken,
} from "../../../packages/service/authAccessStore";
import { applyAuthTokens, clearAuthTokens } from "../../../packages/service/authTokens";
import {
  formatAuthError,
  loginRequest,
  registerRequest,
} from "../../../packages/service/authService";
import { redirectToLogin } from "../../../packages/service/authRedirect.js";
import { performTokenRefresh } from "../../../packages/service/refreshCoordinator.js";
import { readRefreshToken } from "../../../packages/service/refreshTokenCookie";

const AuthContext = createContext(null);

function useAccessTokenExternal() {
  return useSyncExternalStore(
    subscribeAccessToken,
    getAccessTokenSnapshot,
    () => null
  );
}

export function AuthProvider({ children }) {
  const accessToken = useAccessTokenExternal();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const rt = readRefreshToken();
      if (!rt) {
        if (!cancelled) setAuthReady(true);
        return;
      }

      try {
        const ok = await performTokenRefresh();
        if (!cancelled && !ok) {
          clearAuthTokens();
          redirectToLogin();
        }
      } catch {
        if (!cancelled) {
          clearAuthTokens();
          redirectToLogin();
        }
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const auth = useMemo(() => ({ accessToken }), [accessToken]);

  const applyTokens = useCallback((tokenBody, remember) => {
    applyAuthTokens(tokenBody, remember);
  }, []);

  const login = useCallback(async (email, password, remember) => {
    const r = await loginRequest(email, password);
    if (r.ok && r.data?.accessToken && r.data?.refreshToken) {
      applyTokens(r.data, remember);
      return { ok: true };
    }
    return { ok: false, message: formatAuthError(r.data) };
  }, [applyTokens]);

  const register = useCallback(async (email, password, nome, remember) => {
    const r = await registerRequest(email, password, nome);
    if (r.ok && r.data?.accessToken && r.data?.refreshToken) {
      applyTokens(r.data, remember);
      return { ok: true };
    }
    return { ok: false, message: formatAuthError(r.data) };
  }, [applyTokens]);

  const logout = useCallback(() => {
    clearAuthTokens();
  }, []);

  const value = useMemo(
    () => ({
      auth,
      authReady,
      isAuthenticated: !!accessToken,
      login,
      register,
      logout,
    }),
    [auth, authReady, accessToken, login, register, logout]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return ctx;
}
