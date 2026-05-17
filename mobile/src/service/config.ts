import Constants from 'expo-constants';

// export const API_URL = 'http://192.168.15.7:8080';
export const API_URL = 'https://where-io-backend-production.up.railway.app';
// export const API_URL = 'http://localhost:8080';

export const WEBSOCKET_URL: string =
  (Constants.expoConfig?.extra?.websocketUrl as string) ?? 'wss://websocket-production-95df.up.railway.app/ws';

/**
 * Autocomplete e Place Details vêm do backend (`/api/local/buscar-local`, `/api/local/place-details/...`),
 * usando `google.map.api.key` no servidor — não é necessário expor chave no app.
 */
