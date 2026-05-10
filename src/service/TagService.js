import { apiFetch } from "./apiClient";

export class TagService {
  static getAll() {
    return apiFetch("/api/tag/all", {
      method: "GET",
    });
  }
}
