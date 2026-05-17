import { apiFetch } from "./apiClient";

export class LocaisService {
  static getAll(page = 0, size = 200) {
    const qs = new URLSearchParams({ page, size });
    return apiFetch(`/api/local/all?${qs}`, { method: "GET" });
  }

  static async create(payload) {
    return apiFetch("/api/local", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  static update(id, payload) {
    return apiFetch(`/api/local/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  /** Multipart upload; resposta JSON: `{ fileName, urlPath }` (urlPath ex.: `/media/...`). */
  static uploadFile(file, idLocal) {
    const formData = new FormData();
    formData.append("file", file);
    if (idLocal) {
      formData.append("idLocal", idLocal);
    }
    return apiFetch("/api/files/upload", {
      method: "POST",
      body: formData,
    });
  }

  /** Lista fotos do local (`GET /api/files/local/{id}/fotos`). */
  static listLocalFotos(localId) {
    return apiFetch(`/api/files/local/${encodeURIComponent(localId)}/fotos`, {
      method: "GET",
    });
  }

  /** Remove foto do local e do disco (`DELETE ... ?fileName=`). */
  static deleteLocalFoto(localId, fileName) {
    const qs = new URLSearchParams({ fileName });
    return apiFetch(
      `/api/files/local/${encodeURIComponent(localId)}/fotos?${qs.toString()}`,
      { method: "DELETE" }
    );
  }

  static delete(id) {
    return apiFetch(`/api/local/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  static getTags(localId) {
    return apiFetch(`/api/local/${encodeURIComponent(localId)}/tags`, {
      method: "GET",
    });
  }

  static associateTag(localId, tagId) {
    return apiFetch(
      `/api/local/${encodeURIComponent(localId)}/tag/${encodeURIComponent(tagId)}`,
      {
        method: "POST",
      }
    );
  }

  static dissociateTag(localId, tagId) {
    return apiFetch(
      `/api/local/${encodeURIComponent(localId)}/tag/${encodeURIComponent(tagId)}`,
      {
        method: "DELETE",
      }
    );
  }
}
