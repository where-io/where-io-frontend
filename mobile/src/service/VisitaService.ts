import { apiFetch } from './apiClient';

export interface Visita {
  id: string;
  idLocal: string;
  dataVisita: string;
  avaliacao: number;
  comentario?: string;
  criadoEm?: string;
}

export interface VisitaPayload {
  idLocal: string;
  dataVisita: string;
  avaliacao: number;
  comentario?: string;
}

/** POST /api/visita retorna o id da visita como texto (Spring `ResponseEntity<String>`). */
export async function create(payload: VisitaPayload): Promise<string | null> {
  const res = await apiFetch('/api/visita', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) return null;
  const text = (await res.text()).trim();
  if (!text) return null;
  try {
    const parsed = JSON.parse(text) as unknown;
    if (typeof parsed === 'string') return parsed;
    if (parsed && typeof parsed === 'object' && 'id' in parsed) {
      return String((parsed as { id: unknown }).id);
    }
  } catch {
    /* corpo é id em texto puro */
  }
  return text.replace(/^["']|["']$/g, '') || null;
}

export async function getByLocalId(localId: string): Promise<Visita[]> {
  const res = await apiFetch(`/api/visita/${encodeURIComponent(localId)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function update(id: string, payload: VisitaPayload): Promise<boolean> {
  const res = await apiFetch(`/api/visita/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return res.ok;
}

export async function remove(id: string): Promise<boolean> {
  const res = await apiFetch(`/api/visita/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return res.ok;
}
