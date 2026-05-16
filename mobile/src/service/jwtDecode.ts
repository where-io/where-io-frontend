export interface JwtClaims {
  userId: string | null;
  email: string | null;
}

function base64Decode(input: string): string {
  if (typeof globalThis.atob === 'function') {
    return globalThis.atob(input);
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const str = input.replace(/=+$/, '');
  let output = '';
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < str.length; i++) {
    const value = chars.indexOf(str[i]);
    if (value < 0) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return output;
}

/** Decodifica o payload do JWT (sem validar assinatura) — apenas para exibir dados na UI. */
export function decodeJwtPayload(accessToken: string | null | undefined): JwtClaims | null {
  if (!accessToken || typeof accessToken !== 'string') return null;
  try {
    const segment = accessToken.split('.')[1];
    if (!segment) return null;
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const binary = base64Decode(padded);
    const json = decodeURIComponent(
      binary
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    const parsed = JSON.parse(json);
    return {
      userId: typeof parsed.sub === 'string' ? parsed.sub : null,
      email: typeof parsed.email === 'string' ? parsed.email : null,
    };
  } catch {
    return null;
  }
}

export function displayNameFromJwtClaims(claims: JwtClaims | null | undefined): string {
  if (!claims?.email) return 'Usuário';
  const local = claims.email.split('@')[0];
  if (!local) return claims.email;
  return local
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

export function initialsFromUser(displayName: string, email?: string | null): string {
  const n = (displayName || '').trim();
  if (n.length >= 2) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  }
  if (email && email.length >= 2) return email.slice(0, 2).toUpperCase();
  return '??';
}
