import { API_URL } from './config';
import { getAccessToken, setAccessToken } from './authTokenStore';
import { clearRefreshToken } from './authStorage';
import { performTokenRefresh } from './refreshCoordinator';

interface Options extends RequestInit {
  skipAuth?: boolean;
  _retry?: boolean;
}

export async function apiFetch(path: string, options: Options = {}): Promise<Response> {
  const { skipAuth, _retry, ...rest } = options;

  const headers: Record<string, string> = {
    ...((rest.headers as Record<string, string>) ?? {}),
  };

  const isFormData = rest.body instanceof FormData;
  if (!isFormData && rest.body) {
    headers['Content-Type'] = 'application/json';
  }
  if (!skipAuth) {
    const token = getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...rest, headers });

  if (res.status === 401 && !_retry && !path.startsWith('/api/auth/')) {
    const refreshed = await performTokenRefresh();
    if (refreshed) {
      return apiFetch(path, { ...options, _retry: true });
    }
    setAccessToken(null);
    await clearRefreshToken();
  }

  return res;
}
