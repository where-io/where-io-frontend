/**
 * Base da API. REACT_APP_API_URL precisa ser URL absoluta (com https://).
 * Sem protocolo, o browser resolve como path relativo ao localhost:3000.
 */
// function normalizeApiBaseUrl(raw) {
//   const fallback = "http://localhost:8080";
//   let url = (raw && String(raw).trim()) || fallback;
//   if (!/^https?:\/\//i.test(url)) {
//     url = `https://${url}`;
//   }
//   return url.replace(/\/+$/, "");
// }

// export const API_BASE_URL = normalizeApiBaseUrl(
//   typeof process !== "undefined" ? process.env.REACT_APP_API_URL : undefined,
// );

export const API_BASE_URL = "https://where-io-backend-production.up.railway.app"
