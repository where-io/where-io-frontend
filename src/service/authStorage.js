/**
 * Compat: fluxo antigo usava localStorage. Tokens agora: refresh em cookie + access em memória ({@link ./authAccessStore.js}).
 */

export {
  applyAuthTokens as saveAuth,
  clearAuthTokens as clearAuth,
  readRefreshToken,
} from "./authTokens";

/** @deprecated usar readRefreshToken + access só na store — formato antigo removido */
export function loadAuth() {
  return null;
}
