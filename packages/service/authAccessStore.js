/**
 * accessToken só em memória (perde ao recarregar a página até novo refresh/login).
 * useSyncExternalStore permite ao React re-renderizar quando o token muda (ex.: refresh em apiFetch).
 */

let accessToken = null;
const listeners = new Set();

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token ?? null;
  listeners.forEach((fn) => fn());
}

export function subscribeAccessToken(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAccessTokenSnapshot() {
  return accessToken;
}
