import { apiFetch } from './apiClient';
import { Tag } from './LocaisService';

export interface TagPayload {
  nome: string;
  cor: string;
}

export async function getAll(): Promise<Tag[]> {
  const res = await apiFetch('/api/tag/all');
  if (!res.ok) return [];
  return res.json();
}

export async function create(payload: TagPayload): Promise<string | null> {
  const res = await apiFetch('/api/tag', {
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
    /* id em texto puro */
  }
  return text.replace(/^["']|["']$/g, '') || null;
}

export async function update(id: string, payload: TagPayload): Promise<boolean> {
  const res = await apiFetch(`/api/tag/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return res.ok;
}

export async function remove(id: string): Promise<boolean> {
  const res = await apiFetch(`/api/tag/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return res.ok;
}
