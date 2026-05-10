/**
 * Decodifica o payload do JWT (sem validar assinatura) — apenas para exibir dados na UI.
 * @param {string | undefined | null} accessToken
 * @returns {{ userId: string | null, email: string | null } | null}
 */
export function decodeJwtPayload(accessToken) {
  if (!accessToken || typeof accessToken !== "string") return null;
  try {
    const segment = accessToken.split(".")[1];
    if (!segment) return null;
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = JSON.parse(atob(padded));
    return {
      userId: typeof json.sub === "string" ? json.sub : null,
      email: typeof json.email === "string" ? json.email : null,
    };
  } catch {
    return null;
  }
}

export function displayNameFromJwtClaims(claims) {
  if (!claims?.email) return "Explorador";
  const local = claims.email.split("@")[0];
  if (!local) return claims.email;
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export function initialsFromUser(displayName, email) {
  const n = (displayName || "").trim();
  if (n.length >= 2) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  }
  if (email && email.length >= 2) return email.slice(0, 2).toUpperCase();
  return "?";
}
