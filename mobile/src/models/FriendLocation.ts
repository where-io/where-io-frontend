export interface FriendLocation {
  userId: string;
  latitude: number | null;
  longitude: number | null;
  presence: 'ONLINE' | 'OFFLINE';
  movement: 'WALKING' | 'DRIVING' | 'STOPPED' | 'STATIONARY' | null;
  timestamp: string;
}

export interface LocationPayload {
  latitude: number;
  longitude: number;
  movement: string;
  targetFriendIds: string[];
}
