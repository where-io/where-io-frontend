import { Client } from '@stomp/stompjs';
import { FriendLocation, LocationPayload } from '../models/FriendLocation';
import { WEBSOCKET_URL } from './config';

type LocationCallback = (location: FriendLocation) => void;
type TokenProvider = () => string | null;

class WebSocketService {
  private client: Client | null = null;
  private reconnectDelay = 5000;

  connect(getToken: TokenProvider, onLocation: LocationCallback): void {
    if (this.client?.active) return;

    this.client = new Client({
      brokerURL: WEBSOCKET_URL,
      reconnectDelay: this.reconnectDelay,

      // Called before every connection attempt (including reconnects)
      // Ensures the latest token is always used, even after expiry
      beforeConnect: () => {
        const token = getToken();
        if (!token) {
          this.client?.deactivate();
          return;
        }
        this.client!.brokerURL = `${WEBSOCKET_URL}?token=${encodeURIComponent(token)}`;
        this.client!.connectHeaders = { token };
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
