let _accessToken: string | null = null;
let _onExpired: (() => void) | null = null;
let _onTokenRefreshed: (() => void) | null = null;

export function getAccessToken(): string | null {
  return _accessToken;
}

export function setAccessToken(token: string | null): void {
  const wasAuthenticated = _accessToken !== null;
  _accessToken = token;
  if (wasAuthenticated && !token && _onExpired) {
    _onExpired();
  }
}

export function setOnExpiredCallback(cb: (() => void) | null): void {
  _onExpired = cb;
}

export function setOnTokenRefreshedCallback(cb: (() => void) | null): void {
  _onTokenRefreshed = cb;
}

export function triggerTokenRefreshed(): void {
  _onTokenRefreshed?.();
}
