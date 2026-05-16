import { apiFetch } from './apiClient';
import { Tag } from './LocaisService';

export async function getAll(): Promise<Tag[]> {
  const res = await apiFetch('/api/tag/all');
  if (!res.ok) return [];
  return res.json();
}
