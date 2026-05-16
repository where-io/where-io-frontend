import { API_URL } from './config';

interface AuthResult {
  ok: boolean;
  status: number;
  data: any;
}

async function rawPost(path: string, body: object): Promise<AuthResult> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    let data: any = {};
    try { data = await res.json(); } catch {}
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { message: 'Erro de conexão com o servidor' } };
  }
}

export function loginRequest(email: string, password: string) {
  return rawPost('/api/auth/login', { email: email.trim(), password });
}

export function registerRequest(email: string, password: string, nome: string) {
  const body: Record<string, string> = { email: email.trim(), password };
  if (nome && nome.trim()) body.nome = nome.trim();
  return rawPost('/api/auth/register', body);
}

export function refreshTokensRequest(refreshToken: string) {
  return rawPost('/api/auth/refresh', { refreshToken });
}

export function formatAuthError(data: any): string {
  if (!data) return 'Erro desconhecido';
  if (data.fieldErrors && typeof data.fieldErrors === 'object') {
    return Object.entries(data.fieldErrors)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' · ');
  }
  if (data.message) return String(data.message);
  if (typeof data === 'string') return data;
  return 'Erro desconhecido';
}
