import {
  SocketClientEvent,
  SocketServerEvent,
  type SocketLocationUpdatePayload,
} from "@kekego/validation";

export type SocketEventHandler<T = unknown> = (data: T) => void;

export interface PassengerRideState {
  rideId: string;
  rideNumber: string;
  status: string;
  tier: string;
  pickup: { latitude: number; longitude: number; address: string };
  destination: { latitude: number; longitude: number; address: string };
  startOtp?: string;
  driver?: {
    id: string;
    name: string;
    phoneNumber: string;
    rating: number;
    vehicle?: {
      plateNumber: string;
      make: string;
      model: string;
      color: string;
    } | null;
  } | null;
  lastLocation?: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    isStale: boolean;
    updatedAt: string;
  } | null;
  updatedAt: string;
}

export class PassengerSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string | null = null;
  private currentRideId: string | null = null;
  private eventHandlers: Map<string, Set<SocketEventHandler<any>>> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isExplicitDisconnect = false;

  constructor(serverUrl = "http://localhost:4000") {
    // Convert HTTP URL to WS URL
    this.url = serverUrl.replace(/^http/, "ws");
  }

  public connect(token: string): void {
    this.token = token;
    this.isExplicitDisconnect = false;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      // Connect to Socket.IO WebSocket transport with token handshake query
      const wsUrl = `${this.url}/socket.io/?EIO=4&transport=websocket&token=${encodeURIComponent(token)}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        // Connected! Re-join active ride room if exists (State Hydration on Reconnect)
        if (this.currentRideId) {
          this.joinRide(this.currentRideId);
        }
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = () => {
        if (!this.isExplicitDisconnect) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        // Handled on close
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  public joinRide(rideId: string): void {
    this.currentRideId = rideId;
    this.emit(SocketClientEvent.RIDE_JOIN, { rideId });
  }

  public leaveRide(rideId: string): void {
    if (this.currentRideId === rideId) {
      this.currentRideId = null;
    }
    this.emit(SocketClientEvent.RIDE_LEAVE, { rideId });
  }

  public on<T = unknown>(event: SocketServerEvent | string, handler: SocketEventHandler<T>): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);

    return () => {
      this.eventHandlers.get(event)?.delete(handler);
    };
  }

  public emit(event: string, data: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Socket.IO wire protocol frame: 42["event", data]
      this.ws.send(`42${JSON.stringify([event, data])}`);
    }
  }

  private handleMessage(raw: unknown): void {
    if (typeof raw !== "string") return;

    // Socket.IO handshake probe response: 40
    if (raw.startsWith("40")) {
      return;
    }

    // Socket.IO heartbeat ping: 2 -> respond with pong 3
    if (raw === "2") {
      this.ws?.send("3");
      return;
    }

    // Socket.IO event frame: 42["event", payload]
    if (raw.startsWith("42")) {
      try {
        const parsed = JSON.parse(raw.slice(2));
        if (Array.isArray(parsed) && parsed.length >= 2) {
          const [event, payload] = parsed;
          const handlers = this.eventHandlers.get(event);
          if (handlers) {
            for (const handler of handlers) {
              handler(payload);
            }
          }
        }
      } catch {
        // Parse error
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.token && !this.isExplicitDisconnect) {
        this.connect(this.token);
      }
    }, 3000);
  }

  public disconnect(): void {
    this.isExplicitDisconnect = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.currentRideId = null;
  }
}
