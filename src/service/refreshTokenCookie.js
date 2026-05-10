/**
 * Refresh token em cookie (First-Party). Para HttpOnly seguro, o backend precisaria emitir Set-Cookie.
 */

const RT_NAME = "whereio_rt";
const REMEMBER_NAME = "whereio_auth_remember";

function secureSuffix() {
  return typeof window !== "undefined" && window.location.protocol === "https:"
    ? "; Secure"
    : "";
}

/** @param {string} name */
export function getCookie(name) {
  if (typeof document === "undefined") return null;
  const prefix = `; ${name}=`;
  const dc = `; ${document.cookie}`;
  const idx = dc.indexOf(prefix);
  if (idx === -1) return null;
  const start = idx + prefix.length;
  const end = dc.indexOf("; ", start);
  const raw = end === -1 ? dc.slice(start) : dc.slice(start, end);
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * @param {string} refreshToken
 * @param {boolean} remember — se true, cookie de refresh com Max-Age (~30d) + flag de lembrar
 */
export function saveRefreshToken(refreshToken, remember) {
  const secure = secureSuffix();
  const enc = encodeURIComponent(refreshToken);
  if (remember) {
    const rememberAge = 60 * 60 * 24 * 400;
    const rtAge = 60 * 60 * 24 * 30;
    document.cookie = `${REMEMBER_NAME}=1; Path=/; Max-Age=${rememberAge}; SameSite=Lax${secure}`;
    document.cookie = `${RT_NAME}=${enc}; Path=/; Max-Age=${rtAge}; SameSite=Lax${secure}`;
  } else {
    document.cookie = `${REMEMBER_NAME}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
    document.cookie = `${RT_NAME}=${enc}; Path=/; SameSite=Lax${secure}`;
  }
}

export function readRefreshToken() {
  const v = getCookie(RT_NAME);
  return v && v.length > 0 ? v : null;
}

/** Preferência usada ao rotacionar refresh após /api/auth/refresh */
export function readRememberFlag() {
  return getCookie(REMEMBER_NAME) === "1";
}

export function eraseRefreshToken() {
  const secure = secureSuffix();
  document.cookie = `${RT_NAME}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
  document.cookie = `${REMEMBER_NAME}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}
