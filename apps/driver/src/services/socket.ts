import {
  SocketClientEvent,
  SocketServerEvent,
  type SocketLocationUpdatePayload,
  type DriverStatusUpdatePayload,
} from "@kekego/validation";

export type SocketEventHandler<T = unknown> = (data: T) => void;

export class DriverSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string | null = null;
  private eventHandlers: Map<string, Set<SocketEventHandler<any>>> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isExplicitDisconnect = false;

  constructor(serverUrl = "http://localhost:4000") {
    this.url = serverUrl.replace(/^http/, "ws");
  }

  public connect(token: string): void {
    this.token = token;
    this.isExplicitDisconnect = false;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const wsUrl = `${this.url}/socket.io/?EIO=4&transport=websocket&token=${encodeURIComponent(token)}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        // Connected! Server auto-joins driver to driver private room
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

  /**
   * Transmit live GPS location telemetry
   */
  public updateLocation(coords: SocketLocationUpdatePayload): void {
    this.emit(SocketClientEvent.DRIVER_LOCATION_UPDATE, coords);
  }

  /**
   * Toggle Online/Offline status
   */
  public updateStatus(status: DriverStatusUpdatePayload): void {
    this.emit(SocketClientEvent.DRIVER_STATUS_UPDATE, status);
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
      this.ws.send(`42${JSON.stringify([event, data])}`);
    }
  }

  private handleMessage(raw: unknown): void {
    if (typeof raw !== "string") return;

    if (raw.startsWith("40")) return;

    if (raw === "2") {
      this.ws?.send("3");
      return;
    }

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
  }
}
