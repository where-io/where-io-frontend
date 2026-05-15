import { apiFetch } from "./apiClient";

export class AmigosService {
  static listFriends() {
    return apiFetch("/api/amigos", { method: "GET" });
  }

  static listConvitesRecebidos() {
    return apiFetch("/api/amigos/convites/recebidos", { method: "GET" });
  }

  static listConvitesEnviados() {
    return apiFetch("/api/amigos/convites/enviados", { method: "GET" });
  }

  /** @param {string} nomeUsuarioDestino */
  static enviarConvite(nomeUsuarioDestino) {
    return apiFetch("/api/amigos/convites", {
      method: "POST",
      body: JSON.stringify({ nomeUsuarioDestino }),
    });
  }

  static aceitarConvite(id) {
    return apiFetch(`/api/amigos/convites/${encodeURIComponent(id)}/aceitar`, {
      method: "POST",
    });
  }

  static cancelarOuRecusarConvite(id) {
    return apiFetch(`/api/amigos/convites/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }
}
