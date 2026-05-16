import { Platform } from 'react-native';
import { apiFetch } from './apiClient';

export interface Tag {
  id: string;
  nome: string;
  cor: string;
}

export interface Coordenadas {
  latitude: number;
  longitude: number;
}

export interface Endereco {
  logradouro?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  pais?: string;
}

export interface Local {
  id: string;
  nome: string;
  descricao?: string;
  coordenadas: Coordenadas;
  endereco?: Endereco;
  imagemUrl?: string;
  elevacao?: string;
  temperatura?: string;
  densidadeLabel?: string;
  densidadePercent?: number;
  visibilidade?: string;
  tags: Tag[];
  idTags?: string[];
}

/** Alinhado ao `LocalDtoRequest` / payload web: tags novas sem id. */
export interface CategoriaPayload {
  id?: string;
  nome: string;
  cor: string;
}

export interface LocalPayload {
  nome: string;
  descricao?: string;
  coordenadas: Coordenadas;
  endereco?: Endereco;
  imagemUrl?: string;
  idTags?: string[];
  tags?: CategoriaPayload[];
}

export interface FotoResponse {
  fileName: string;
  urlPath: string;
}

export async function getAll(): Promise<Local[]> {
  const res = await apiFetch('/api/local/all');
  if (!res.ok) return [];
  return res.json();
}

/**
 * POST /api/local retorna o id do local como texto (ou eventualmente JSON).
 */
export async function create(payload: LocalPayload): Promise<string | null> {
  const res = await apiFetch('/api/local', {
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
    /* corpo é id em texto puro (Spring ResponseEntity body String) */
  }
  return text.replace(/^["']|["']$/g, '') || null;
}

export async function update(id: string, payload: Partial<LocalPayload>): Promise<Local | null> {
  const res = await apiFetch(`/api/local/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function remove(id: string): Promise<boolean> {
  const res = await apiFetch(`/api/local/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return res.ok;
}

export type UploadImageMeta = {
  fileName?: string | null;
  mimeType?: string | null;
};

export async function uploadFile(
  imageUri: string,
  idLocal?: string,
  meta?: UploadImageMeta,
): Promise<FotoResponse | null> {
  const formData = new FormData();

  const rawName =
    (meta?.fileName && String(meta.fileName).trim()) ||
    imageUri.split('/').pop()?.split('?')[0] ||
    'photo.jpg';
  const filename = rawName.includes('.') ? rawName : `${rawName}.jpg`;
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
  const type =
    (meta?.mimeType && String(meta.mimeType).trim()) ||
    (ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg');

  if (Platform.OS === 'web') {
    const blobRes = await fetch(imageUri);
    const blob = await blobRes.blob();
    const mime = blob.type && blob.type !== 'application/octet-stream' ? blob.type : type;
    const file = new File([blob], filename, { type: mime });
    formData.append('file', file);
  } else {
    formData.append('file', { uri: imageUri, name: filename, type } as any);
  }

  if (idLocal) formData.append('idLocal', idLocal);

  const res = await apiFetch('/api/files/upload', { method: 'POST', body: formData as any });
  if (!res.ok) return null;
  return res.json();
}

export async function listLocalFotos(localId: string): Promise<FotoResponse[]> {
  const res = await apiFetch(`/api/files/local/${encodeURIComponent(localId)}/fotos`);
  if (!res.ok) return [];
  return res.json();
}

export async function deleteLocalFoto(localId: string, fileName: string): Promise<boolean> {
  const res = await apiFetch(
    `/api/files/local/${encodeURIComponent(localId)}/fotos?fileName=${encodeURIComponent(fileName)}`,
    { method: 'DELETE' },
  );
  return res.ok;
}

export async function getTags(localId: string): Promise<Tag[]> {
  const res = await apiFetch(`/api/local/${encodeURIComponent(localId)}/tags`);
  if (!res.ok) return [];
  return res.json();
}

export async function associateTag(localId: string, tagId: string): Promise<boolean> {
  const res = await apiFetch(
    `/api/local/${encodeURIComponent(localId)}/tag/${encodeURIComponent(tagId)}`,
    { method: 'POST' },
  );
  return res.ok;
}

export async function dissociateTag(localId: string, tagId: string): Promise<boolean> {
  const res = await apiFetch(
    `/api/local/${encodeURIComponent(localId)}/tag/${encodeURIComponent(tagId)}`,
    { method: 'DELETE' },
  );
  return res.ok;
}
