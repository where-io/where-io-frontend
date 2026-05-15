import { setAccessToken } from "./authAccessStore";
import {
  eraseRefreshToken,
  readRememberFlag,
  readRefreshToken,
  saveRefreshToken,
} from "./refreshTokenCookie";

/**
 * @param {{ accessToken: string, refreshToken: string }} body
 * @param {boolean} remember
 */
export function applyAuthTokens(body, remember) {
  if (!body?.accessToken || !body?.refreshToken) return;
  saveRefreshToken(body.refreshToken, remember);
  setAccessToken(body.accessToken);
}

/** Após refresh: mantém política de cookie (session vs persistente) da última sessão. */
export function applyRefreshedTokens(body) {
  if (!body?.accessToken || !body?.refreshToken) return false;
  saveRefreshToken(body.refreshToken, readRememberFlag());
  setAccessToken(body.accessToken);
  return true;
}

export function clearAuthTokens() {
  eraseRefreshToken();
  setAccessToken(null);
}

export { readRefreshToken };
