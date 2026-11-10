import { z } from "zod";

/**
 * Socket.IO client-to-server event names
 */
export const SocketClientEvent = {
  DRIVER_LOCATION_UPDATE: "driver:location:update",
  DRIVER_STATUS_UPDATE: "driver:status:update",
  RIDE_JOIN: "ride:join",
  RIDE_LEAVE: "ride:leave",
  ADMIN_SUBSCRIBE: "admin:subscribe",
} as const;

export type SocketClientEvent =
  (typeof SocketClientEvent)[keyof typeof SocketClientEvent];

/**
 * Socket.IO server-to-client event names
 */
export const SocketServerEvent = {
  RIDE_DISPATCHED: "ride:dispatched",
  RIDE_ACCEPTED: "ride:accepted",
  RIDE_REJECTED: "ride:rejected",
  RIDE_DRIVER_EN_ROUTE: "ride:driver:en_route",
  RIDE_DRIVER_ARRIVED: "ride:driver:arrived",
  RIDE_STARTED: "ride:started",
  RIDE_COMPLETED: "ride:completed",
  RIDE_CANCELLED: "ride:cancelled",
  RIDE_STATE_CURRENT: "ride:state:current",
  DRIVER_LOCATION_BROADCAST: "driver:location:broadcast",
  ADMIN_TELEMETRY_UPDATE: "admin:telemetry:update",
  ERROR: "error",
} as const;

export type SocketServerEvent =
  (typeof SocketServerEvent)[keyof typeof SocketServerEvent];

/**
 * Real-time driver GPS location telemetry update schema
 */
export const socketLocationUpdateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().min(0).max(120).optional(), // max 120 km/h for commercial tricycle
  accuracy: z.number().min(0).optional(),
  timestamp: z.number().positive().optional(),
  rideId: z.string().optional(),
});

export type SocketLocationUpdatePayload = z.infer<
  typeof socketLocationUpdateSchema
>;

/**
 * Driver online/offline status update schema
 */
export const driverStatusUpdateSchema = z.object({
  isOnline: z.boolean(),
  availabilityStatus: z.enum(["ONLINE", "OFFLINE"]),
});

export type DriverStatusUpdatePayload = z.infer<
  typeof driverStatusUpdateSchema
>;

/**
 * Room subscription schemas
 */
export const rideJoinSchema = z.object({
  rideId: z.string().min(1, "rideId is required"),
});

export type RideJoinPayload = z.infer<typeof rideJoinSchema>;

export const rideLeaveSchema = z.object({
  rideId: z.string().min(1, "rideId is required"),
});

export type RideLeavePayload = z.infer<typeof rideLeaveSchema>;

export const adminSubscribeSchema = z.object({
  channel: z.enum(["telemetry", "dispatches", "all"]).default("all"),
});

export type AdminSubscribePayload = z.infer<typeof adminSubscribeSchema>;

/**
 * Socket Error payload schema
 */
export const socketErrorPayloadSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
});

export type SocketErrorPayload = z.infer<typeof socketErrorPayloadSchema>;
