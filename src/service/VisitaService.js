import { apiFetch } from "./apiClient";

export class VisitaService {
  static async create(payload) {
    return apiFetch("/api/visita", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  static async getById(localId) {
    return apiFetch(`/api/visita/${encodeURIComponent(localId)}`, {
      method: "GET",
    });
  }
}
