"use client";

import { io, type Socket } from "socket.io-client";
import { API_URL, getStoredToken } from "./api";
import {
  SocketClientEvent,
  SocketServerEvent,
} from "@kekego/validation";

let adminSocket: Socket | null = null;

export function getAdminSocket(): Socket | null {
  if (typeof window === "undefined") return null;

  const token = getStoredToken();
  if (!token) {
    if (adminSocket) {
      adminSocket.disconnect();
      adminSocket = null;
    }
    return null;
  }

  if (adminSocket && adminSocket.connected) {
    return adminSocket;
  }

  if (!adminSocket) {
    adminSocket = io(API_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    adminSocket.on("connect", () => {
      // Auto-subscribe to admin operations telemetry room
      adminSocket?.emit(SocketClientEvent.ADMIN_SUBSCRIBE, { channel: "all" });
    });

    adminSocket.on("disconnect", () => {
      // Auto reconnect handled by Socket.IO
    });
  }

  return adminSocket;
}

export function disconnectAdminSocket(): void {
  if (adminSocket) {
    adminSocket.disconnect();
    adminSocket = null;
  }
}
