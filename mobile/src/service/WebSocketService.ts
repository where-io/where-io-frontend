import { Client } from '@stomp/stompjs';
import { FriendLocation, LocationPayload } from '../models/FriendLocation';
import { WEBSOCKET_URL } from './config';
import { performTokenRefresh } from './refreshCoordinator';

type LocationCallback = (location: FriendLocation) => void;
type TokenProvider = () => string | null;

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

class WebSocketService {
  private client: Client | null = null;
  private reconnectDelay = 5000;

  connect(getToken: TokenProvider, onLocation: LocationCallback): void {
    if (this.client?.active) return;

    this.client = new Client({
      brokerURL: WEBSOCKET_URL,
      reconnectDelay: this.reconnectDelay,

      // Called before every connection attempt (including reconnects).
      // Refreshes an expired token silently before attempting the handshake.
      beforeConnect: async () => {
        try {
          let token = getToken();
          if (!token) {
            this.client?.deactivate().catch(() => {});
            return;
          }
          if (isTokenExpired(token)) {
            // notify=false: skip triggerTokenRefreshed to avoid circular reconnect call
            const ok = await performTokenRefresh(false);
            token = getToken();
            if (!ok || !token) {
              this.client?.deactivate().catch(() => {});
              return;
            }
          }
          this.client!.brokerURL = `${WEBSOCKET_URL}?token=${encodeURIComponent(token)}`;
          this.client!.connectHeaders = { token };
        } catch (e) {
          console.warn('[WS] beforeConnect error:', e);
        }
      },

      onConnect: () => {
        this.client?.subscribe('/user/queue/location', (message) => {
          try {
            const data: FriendLocation = JSON.parse(message.body);
            onLocation(data);
          } catch {}
        });
      },

      onStompError: (frame) => {
        console.warn('[WS] STOMP error:', frame.headers?.message);
      },

      onWebSocketError: (evt) => {
        console.warn('[WS] WebSocket error:', evt);
      },

      onDisconnect: () => {
        console.log('[WS] Disconnected');
      },
    });

    this.client.activate();
  }

  reconnect(): void {
    const client = this.client;
    if (!client) return;
    client.deactivate()
      .then(() => client.activate())
      .catch((e) => console.warn('[WS] reconnect error:', e));
  }

  sendLocation(payload: LocationPayload): void {
    if (!this.client?.connected) return;
    this.client.publish({
      destination: '/app/location',
      body: JSON.stringify(payload),
    });
  }

  disconnect(): void {
    this.client?.deactivate();
    this.client = null;
  }

  get isConnected(): boolean {
    return this.client?.connected ?? false;
  }
}

export const wsService = new WebSocketService();
