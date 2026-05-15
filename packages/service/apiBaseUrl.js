export const API_BASE_URL =
  (typeof process !== "undefined" && process.env.REACT_APP_API_URL) ||
  "http://localhost:8080";
