import { apiFetch } from './apiClient';

export interface Amigo {
  id: string;
  nome: string;
  nomeUsuario: string;
  email?: string;
  online?: boolean;
}

export interface Convite {
  id: string;
  nome: string;
  nomeUsuario?: string;
  email?: string;
  statusConvite?: string;
}

export async function listFriends(): Promise<Amigo[]> {
  const res = await apiFetch('/api/amigos');
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function listConvitesRecebidos(): Promise<Convite[]> {
  const res = await apiFetch('/api/amigos/convites/recebidos');
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function listConvitesEnviados(): Promise<Convite[]> {
  const res = await apiFetch('/api/amigos/convites/enviados');
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function enviarConvite(nomeUsuarioDestino: string): Promise<boolean> {
  const res = await apiFetch('/api/amigos/convites', {
    method: 'POST',
    body: JSON.stringify({ nomeUsuarioDestino }),
  });
  return res.ok;
}

export async function aceitarConvite(id: string): Promise<boolean> {
  const res = await apiFetch(`/api/amigos/convites/${encodeURIComponent(id)}/aceitar`, {
    method: 'POST',
  });
  return res.ok;
}

export async function cancelarOuRecusarConvite(id: string): Promise<boolean> {
  const res = await apiFetch(`/api/amigos/convites/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return res.ok;
}

export async function removerAmigo(id: string): Promise<boolean> {
  const res = await apiFetch(`/api/amigos/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return res.ok;
}
