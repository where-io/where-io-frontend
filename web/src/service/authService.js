import { API_BASE_URL } from "./apiBaseUrl.js";

async function parseBody(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function loginRequest(email, password) {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), password }),
  });
  const data = await parseBody(res);
  return { ok: res.ok, status: res.status, data };
}

/** Troca refresh por novo par de tokens (sem Bearer). */
export async function refreshTokensRequest(refreshToken) {
  const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  const data = await parseBody(res);
  return { ok: res.ok, status: res.status, data };
}

export async function registerRequest(email, password, nome) {
  const body = {
    email: email.trim(),
    password,
  };
  if (nome?.trim()) body.nome = nome.trim();

  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseBody(res);
  return { ok: res.ok, status: res.status, data };
}

export function formatAuthError(data) {
  if (!data) return "Não foi possível conectar ao servidor.";
  if (typeof data === "string") return data;
  if (typeof data.message === "string") return data.message;
  if (data.fieldErrors && typeof data.fieldErrors === "object") {
    return Object.entries(data.fieldErrors)
      .map(([field, msg]) => `${field}: ${msg}`)
      .join(" · ");
  }
  return "Não foi possível completar a operação.";
}
