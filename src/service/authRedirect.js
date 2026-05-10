/**
 * Redireciona para login quando a sessão não pode ser renovada (ex.: refresh expirado).
 * Evita loop se já estiver em /login.
 */
export function redirectToLogin() {
  if (typeof window === "undefined") return;
  const path = window.location.pathname || "";
  if (path.startsWith("/login")) return;
  window.location.assign("/login");
}
