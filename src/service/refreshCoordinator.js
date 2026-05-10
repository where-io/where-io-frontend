import { refreshTokensRequest } from "./authService.js";
import { applyRefreshedTokens } from "./authTokens.js";
import { readRefreshToken } from "./refreshTokenCookie.js";

/** Evita refresh simultâneo (bootstrap + apiFetch após 401). */
let pending = null;

export async function performTokenRefresh() {
  const rt = readRefreshToken();
  if (!rt) return false;
  if (pending) return pending;

  pending = (async () => {
    try {
      const { ok, data } = await refreshTokensRequest(rt);
      if (!ok || !data?.accessToken || !data?.refreshToken) return false;
      return applyRefreshedTokens(data);
    } catch {
      return false;
    } finally {
      pending = null;
    }
  })();

  return pending;
}
