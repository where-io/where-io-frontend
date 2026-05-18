import { refreshTokensRequest } from './authService';
import { getRefreshToken, saveRefreshToken, clearRefreshToken } from './authStorage';
import { setAccessToken, triggerTokenRefreshed } from './authTokenStore';

let _pending: Promise<boolean> | null = null;

export async function performTokenRefresh(): Promise<boolean> {
  if (_pending) return _pending;
  _pending = _doRefresh().finally(() => { _pending = null; });
  return _pending;
}

async function _doRefresh(): Promise<boolean> {
  const token = await getRefreshToken();
  if (!token) return false;

  const result = await refreshTokensRequest(token);
  if (result.ok && result.data?.accessToken && result.data?.refreshToken) {
    setAccessToken(result.data.accessToken);
    await saveRefreshToken(result.data.refreshToken);
    triggerTokenRefreshed();
    return true;
  }

  setAccessToken(null);
  await clearRefreshToken();
  return false;
}
