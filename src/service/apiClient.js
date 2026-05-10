import { getAccessToken } from "./authAccessStore";
import { API_BASE_URL } from "./apiBaseUrl.js";
import { redirectToLogin } from "./authRedirect.js";
import { clearAuthTokens } from "./authTokens.js";
import { performTokenRefresh } from "./refreshCoordinator.js";

export { API_BASE_URL } from "./apiBaseUrl.js";

/**
 * Fetch para rotas da API Where-IO: envia Bearer e renova access em 401 quando possível.
 * @param {string} path - Caminho começando com /api/...
 * @param {RequestInit & { skipAuth?: boolean, _retry?: boolean }} [options]
 */
export async function apiFetch(path, options = {}) {
  const url = path.startsWith("http")
    ? path
    : `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const { skipAuth, _retry, ...rest } = options;
  const headers = new Headers(rest.headers || {});

  if (
    rest.body &&
    typeof rest.body === "string" &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const res = await fetch(url, { ...rest, headers });

  if (
    res.status === 401 &&
    !_retry &&
    typeof path === "string" &&
    !path.includes("/api/auth/")
  ) {
    const refreshed = await performTokenRefresh();
    if (refreshed) {
      return apiFetch(path, { ...options, _retry: true });
    }
    clearAuthTokens();
    redirectToLogin();
  }

  return res;
}
