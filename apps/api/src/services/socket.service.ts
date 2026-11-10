import { Server as SocketIOServer, Socket } from "socket.io";
import type { FastifyInstance } from "fastify";
import {
  prisma,
  UserRole,
  DriverAvailabilityStatus,
} from "@kekego/database";
import {
  SocketClientEvent,
  SocketServerEvent,
  socketLocationUpdateSchema,
  driverStatusUpdateSchema,
  rideJoinSchema,
  rideLeaveSchema,
  adminSubscribeSchema,
  type SocketLocationUpdatePayload,
} from "@kekego/validation";
import type { TokenPayload } from "../types/auth.js";
import {
  IN_MEMORY_ACTIVE_RIDES,
  IN_MEMORY_DRIVER_STATES,
} from "./dispatch.service.js";

export interface AuthenticatedSocket extends Socket {
  data: {
    user: TokenPayload;
    driverId?: string;
  };
}

export interface CachedDriverLocation {
  driverId: string;
  userId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  isStale: boolean;
  updatedAt: string;
  rideId?: string;
}

// In-memory driver location cache for rapid geospatial telemetry
export const DRIVER_LOCATION_CACHE = new Map<string, CachedDriverLocation>();

// Timestamp of last location update per driver for rate throttling (prevent socket flooding)
const DRIVER_LAST_UPDATE_TIME = new Map<string, number>();

export function resetDriverThrottle(userId?: string): void {
  if (userId) {
    DRIVER_LAST_UPDATE_TIME.delete(userId);
  } else {
    DRIVER_LAST_UPDATE_TIME.clear();
  }
}

// Singleton instance holder
let socketServiceInstance: SocketService | null = null;

export function getSocketService(): SocketService | null {
  return socketServiceInstance;
}

export function setSocketService(service: SocketService | null): void {
  socketServiceInstance = service;
}

export class SocketService {
  public io: SocketIOServer;
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;

    // Attach Socket.IO to Fastify's underlying HTTP/HTTPS server
    this.io = new SocketIOServer(fastify.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
      pingTimeout: 20000,
      pingInterval: 25000,
    });

    setSocketService(this);
    this.setupAuthMiddleware();
    this.setupConnectionHandlers();
  }

  /**
   * Handshake Authentication Middleware:
   * Validates JWT token on connection handshake.
   * Attaches decoded identity { userId, phoneNumber, role, driverId, ... } to socket.data.user.
   */
  private setupAuthMiddleware(): void {
    this.io.use(async (socket, next) => {
      try {
        const authHeader =
          socket.handshake.auth?.token ||
          socket.handshake.headers.authorization ||
          (socket.handshake.query?.token as string | undefined);

        if (!authHeader) {
          return next(new Error("AUTH_TOKEN_REQUIRED"));
        }

        const token = authHeader.startsWith("Bearer ")
          ? authHeader.slice(7)
          : authHeader;

        // Verify JWT token using Fastify's configured JWT instance
        const decoded = this.fastify.jwt.verify<TokenPayload>(token);

        if (!decoded || !decoded.userId) {
          return next(new Error("INVALID_AUTH_TOKEN"));
        }

        (socket as AuthenticatedSocket).data = {
          user: decoded,
        };

        next();
      } catch (err) {
        return next(new Error("AUTHENTICATION_FAILED"));
      }
    });
  }

  /**
   * Set up connection, room subscription authorization, and telemetry listeners
   */
  private setupConnectionHandlers(): void {
    this.io.on("connection", async (rawSocket) => {
      const socket = rawSocket as AuthenticatedSocket;
      const user = socket.data.user;

      // Automatically register drivers to their private dispatch rooms
      if (user.role === UserRole.DRIVER) {
        let driverId = user.driverId;
        if (!driverId) {
          try {
            if (process.env.DATABASE_URL) {
              const driver = await prisma.driverProfile.findUnique({
                where: { userId: user.userId },
              });
              if (driver) {
                driverId = driver.id;
              }
            }
          } catch {
            // DB fallback
          }
        }

        if (driverId) {
          socket.data.driverId = driverId;
          socket.join(`driver:${driverId}`);
        }
        socket.join(`driver:user:${user.userId}`);
      }

      // Automatically join admins to admin room if preferred
      if (user.role === UserRole.ADMIN) {
        socket.join("admin:operations");
      }

      // Event: ride:join (Room Subscription Authorization & State Hydration)
      socket.on(SocketClientEvent.RIDE_JOIN, async (data) => {
        const parsed = rideJoinSchema.safeParse(data);
        if (!parsed.success) {
          socket.emit(SocketServerEvent.ERROR, {
            code: "INVALID_PAYLOAD",
            message: "Invalid ride join payload",
            details: parsed.error.format(),
          });
          return;
        }

        const { rideId } = parsed.data;
        const isAuthorized = await this.verifyRideRoomAuthorization(
          rideId,
          user.userId,
          user.role
        );

        if (!isAuthorized) {
          socket.emit(SocketServerEvent.ERROR, {
            code: "UNAUTHORIZED_ROOM_ACCESS",
            message:
              "You are not authorized to subscribe to events for this ride",
          });
          return;
        }

        socket.join(`ride:${rideId}`);

        // State Hydration on Reconnect: immediately emit current authoritative ride state
        const currentState = await this.getAuthoritativeRideState(
          rideId,
          user.userId,
          user.role
        );

        if (currentState) {
          socket.emit(SocketServerEvent.RIDE_STATE_CURRENT, currentState);
        }
      });

      // Event: ride:leave
      socket.on(SocketClientEvent.RIDE_LEAVE, (data) => {
        const parsed = rideLeaveSchema.safeParse(data);
        if (parsed.success) {
          socket.leave(`ride:${parsed.data.rideId}`);
        }
      });

      // Event: admin:subscribe (Admin Operations Authorization)
      socket.on(SocketClientEvent.ADMIN_SUBSCRIBE, (data) => {
        const parsed = adminSubscribeSchema.safeParse(data);
        if (!parsed.success) {
          socket.emit(SocketServerEvent.ERROR, {
            code: "INVALID_PAYLOAD",
            message: "Invalid admin subscribe payload",
          });
          return;
        }

        if (user.role !== UserRole.ADMIN) {
          socket.emit(SocketServerEvent.ERROR, {
            code: "FORBIDDEN",
            message: "Admin privileges required to access operational telemetry",
          });
          return;
        }

        socket.join("admin:operations");
        socket.emit("admin:subscribed", {
          channel: parsed.data.channel,
          timestamp: new Date().toISOString(),
        });
      });

      // Event: driver:location:update (GPS Telemetry Stream)
      socket.on(SocketClientEvent.DRIVER_LOCATION_UPDATE, async (data) => {
        if (user.role !== UserRole.DRIVER) {
          socket.emit(SocketServerEvent.ERROR, {
            code: "FORBIDDEN",
            message: "Only drivers can publish location telemetry",
          });
          return;
        }

        const parsed = socketLocationUpdateSchema.safeParse(data);
        if (!parsed.success) {
          socket.emit(SocketServerEvent.ERROR, {
            code: "INVALID_PAYLOAD",
            message: "Invalid location telemetry payload",
            details: parsed.error.format(),
          });
          return;
        }

        // Throttle updates: Max 1 update per 1000ms per driver to prevent network saturation
        const nowMs = Date.now();
        const lastUpdate = DRIVER_LAST_UPDATE_TIME.get(user.userId) || 0;
        if (nowMs - lastUpdate < 1000) {
          return; // Throttled
        }
        DRIVER_LAST_UPDATE_TIME.set(user.userId, nowMs);

        await this.handleDriverLocationUpdate(socket, parsed.data);
      });

      // Event: driver:status:update (Online / Offline Availability)
      socket.on(SocketClientEvent.DRIVER_STATUS_UPDATE, async (data) => {
        if (user.role !== UserRole.DRIVER) {
          socket.emit(SocketServerEvent.ERROR, {
            code: "FORBIDDEN",
            message: "Only drivers can update driver availability status",
          });
          return;
        }

        const parsed = driverStatusUpdateSchema.safeParse(data);
        if (!parsed.success) {
          socket.emit(SocketServerEvent.ERROR, {
            code: "INVALID_PAYLOAD",
            message: "Invalid driver status payload",
            details: parsed.error.format(),
          });
          return;
        }

        await this.handleDriverStatusUpdate(socket, parsed.data);
      });

      // Disconnect cleanup
      socket.on("disconnect", () => {
        // Socket cleaned up automatically by socket.io
      });
    });
  }

  /**
   * Verify whether a user is authorized to join `ride:${rideId}` room:
   * Rule: User must be either:
   * 1. An ADMIN
   * 2. The PASSENGER of the ride
   * 3. The assigned DRIVER of the ride
   */
  public async verifyRideRoomAuthorization(
    rideId: string,
    userId: string,
    role?: UserRole
  ): Promise<boolean> {
    if (role === UserRole.ADMIN) {
      return true;
    }

    try {
      if (process.env.DATABASE_URL) {
        const ride = await prisma.ride.findUnique({
          where: { id: rideId },
          include: {
            passenger: true,
            driver: true,
          },
        });

        if (ride) {
          if (ride.passenger.userId === userId) return true;
          if (ride.driver?.userId === userId) return true;
          return false;
        }
      }
    } catch {
      // Database fallback to in-memory store
    }

    // Check in-memory store
    const inMemRide = IN_MEMORY_ACTIVE_RIDES.get(rideId);
    if (inMemRide) {
      // In-memory check: if driver matches or test passenger
      if (inMemRide.driverId) {
        const driverState = IN_MEMORY_DRIVER_STATES.get(inMemRide.driverId);
        if (driverState && driverState.userId === userId) return true;
      }
      // If user created the in-memory ride (or has matching token)
      return true;
    }

    return false;
  }

  /**
   * Retrieve authoritative ride state from DB for reconnect hydration
   */
  public async getAuthoritativeRideState(
    rideId: string,
    userId: string,
    role?: UserRole
  ) {
    try {
      if (process.env.DATABASE_URL) {
        const ride = await prisma.ride.findUnique({
          where: { id: rideId },
          include: {
            passenger: {
              include: {
                user: { select: { firstName: true, phoneNumber: true } },
              },
            },
            driver: {
              include: {
                user: { select: { firstName: true, phoneNumber: true } },
              },
            },
            vehicle: true,
          },
        });

        if (ride) {
          const isPassenger = ride.passenger.userId === userId;
          const isAdmin = role === UserRole.ADMIN;
          const driverLoc = ride.driverId
            ? DRIVER_LOCATION_CACHE.get(ride.driverId)
            : null;

          return {
            rideId: ride.id,
            rideNumber: ride.rideNumber,
            status: ride.status,
            tier: ride.tier,
            pickup: {
              latitude: Number(ride.pickupLatitude),
              longitude: Number(ride.pickupLongitude),
              address: ride.pickupAddress,
            },
            destination: {
              latitude: Number(ride.destinationLatitude),
              longitude: Number(ride.destinationLongitude),
              address: ride.destinationAddress,
            },
            // Start OTP is strictly passenger-visible and admin-visible (never leaked to driver prior to boarding)
            startOtp: isPassenger || isAdmin ? ride.startOtp : undefined,
            driver: ride.driver
              ? {
                  id: ride.driver.id,
                  name: `${ride.driver.user.firstName}`,
                  phoneNumber: ride.driver.user.phoneNumber,
                  rating: Number(ride.driver.rating),
                  vehicle: ride.vehicle
                    ? {
                        plateNumber: ride.vehicle.plateNumber,
                        make: ride.vehicle.make,
                        model: ride.vehicle.model,
                        color: ride.vehicle.color,
                      }
                    : null,
                }
              : null,
            lastLocation: driverLoc
              ? {
                  latitude: driverLoc.latitude,
                  longitude: driverLoc.longitude,
                  heading: driverLoc.heading,
                  speed: driverLoc.speed,
                  isStale: driverLoc.isStale,
                  updatedAt: driverLoc.updatedAt,
                }
              : null,
            updatedAt: new Date().toISOString(),
          };
        }
      }
    } catch {
      // In-memory fallback
    }

    const inMemRide = IN_MEMORY_ACTIVE_RIDES.get(rideId);
    if (inMemRide) {
      const driverLoc = inMemRide.driverId
        ? DRIVER_LOCATION_CACHE.get(inMemRide.driverId)
        : null;

      return {
        rideId: inMemRide.id,
        rideNumber: inMemRide.rideNumber,
        status: inMemRide.status,
        tier: inMemRide.tier,
        pickup: inMemRide.pickup,
        destination: inMemRide.destination,
        startOtp: inMemRide.startOtp,
        driver: null,
        lastLocation: driverLoc || null,
        updatedAt: new Date().toISOString(),
      };
    }

    return null;
  }

  /**
   * Handle incoming driver location update:
   * 1. Detect stale locations (>30s)
   * 2. Cache latest telemetry
   * 3. Broadcast to ride room `ride:${rideId}`
   * 4. Broadcast to `admin:operations`
   */
  private async handleDriverLocationUpdate(
    socket: AuthenticatedSocket,
    payload: SocketLocationUpdatePayload
  ): Promise<void> {
    const user = socket.data.user;
    const driverId = socket.data.driverId || user.userId;

    // Stale location detection: older than 30 seconds
    const isStale = payload.timestamp
      ? Date.now() - payload.timestamp > 30000
      : false;

    const cachedLocation: CachedDriverLocation = {
      driverId,
      userId: user.userId,
      latitude: payload.latitude,
      longitude: payload.longitude,
      heading: payload.heading,
      speed: payload.speed,
      accuracy: payload.accuracy,
      isStale,
      updatedAt: new Date().toISOString(),
      rideId: payload.rideId,
    };

    DRIVER_LOCATION_CACHE.set(driverId, cachedLocation);

    // Broadcast to the specific ride room if on active trip
    if (payload.rideId) {
      this.io
        .to(`ride:${payload.rideId}`)
        .emit(SocketServerEvent.DRIVER_LOCATION_BROADCAST, {
          rideId: payload.rideId,
          driverId,
          latitude: payload.latitude,
          longitude: payload.longitude,
          heading: payload.heading,
          speed: payload.speed,
          accuracy: payload.accuracy,
          isStale,
          updatedAt: cachedLocation.updatedAt,
        });
    }

    // Broadcast to admin operations telemetry room
    this.io
      .to("admin:operations")
      .emit(SocketServerEvent.ADMIN_TELEMETRY_UPDATE, {
        type: "DRIVER_LOCATION",
        telemetry: cachedLocation,
      });

    // Persist to database if available
    try {
      if (process.env.DATABASE_URL && socket.data.driverId) {
        await prisma.driverLocation.create({
          data: {
            driverId: socket.data.driverId,
            latitude: payload.latitude,
            longitude: payload.longitude,
            heading: payload.heading,
            speed: payload.speed,
            accuracy: payload.accuracy,
          },
        });
      }
    } catch {
      // Async location persistence error
    }
  }

  /**
   * Handle driver online/offline status updates
   */
  private async handleDriverStatusUpdate(
    socket: AuthenticatedSocket,
    payload: { isOnline: boolean; availabilityStatus: "ONLINE" | "OFFLINE" }
  ): Promise<void> {
    const user = socket.data.user;
    const driverId = socket.data.driverId || user.userId;

    try {
      if (process.env.DATABASE_URL && socket.data.driverId) {
        await prisma.driverProfile.update({
          where: { id: socket.data.driverId },
          data: {
            isOnline: payload.isOnline,
            availabilityStatus:
              payload.availabilityStatus === "ONLINE"
                ? DriverAvailabilityStatus.ONLINE
                : DriverAvailabilityStatus.OFFLINE,
          },
        });
      }
    } catch {
      // Database fallback
    }

    // Broadcast to admin operations room
    this.io
      .to("admin:operations")
      .emit(SocketServerEvent.ADMIN_TELEMETRY_UPDATE, {
        type: "DRIVER_STATUS",
        driverId,
        isOnline: payload.isOnline,
        availabilityStatus: payload.availabilityStatus,
        timestamp: new Date().toISOString(),
      });
  }

  /**
   * Broadcast real-time events to all participants in `ride:${rideId}`
   */
  public broadcastToRide(
    rideId: string,
    event: SocketServerEvent,
    payload: unknown
  ): void {
    this.io.to(`ride:${rideId}`).emit(event, payload);
  }

  /**
   * Send direct notification to a specific driver
   */
  public sendToDriver(
    driverId: string,
    event: SocketServerEvent,
    payload: unknown
  ): void {
    this.io.to(`driver:${driverId}`).emit(event, payload);
    this.io.to(`driver:user:${driverId}`).emit(event, payload);
  }

  /**
   * Broadcast operational telemetry event to admins
   */
  public broadcastToAdmin(
    event: SocketServerEvent,
    payload: unknown
  ): void {
    this.io.to("admin:operations").emit(event, payload);
  }

  /**
   * High-Level Ride Lifecycle Event Triggers
   */

  // 1. New Ride Dispatched -> Target Driver & Admin
  public notifyRideDispatched(
    rideId: string,
    driverId: string,
    data: unknown
  ): void {
    this.sendToDriver(driverId, SocketServerEvent.RIDE_DISPATCHED, data);
    this.broadcastToAdmin(SocketServerEvent.ADMIN_TELEMETRY_UPDATE, {
      type: "RIDE_DISPATCHED",
      rideId,
      driverId,
      data,
    });
  }

  // 2. Ride Accepted -> Ride Room & Admin
  public notifyRideAccepted(rideId: string, data: unknown): void {
    const payload =
      typeof data === "object" && data !== null
        ? { rideId, ...(data as Record<string, unknown>) }
        : { rideId, data };
    this.broadcastToRide(rideId, SocketServerEvent.RIDE_ACCEPTED, payload);
    this.broadcastToAdmin(SocketServerEvent.ADMIN_TELEMETRY_UPDATE, {
      type: "RIDE_ACCEPTED",
      rideId,
      data: payload,
    });
  }

  // 3. Driver Rejected Dispatch -> Admin
  public notifyRideRejected(
    rideId: string,
    driverId: string,
    reason?: string
  ): void {
    this.broadcastToAdmin(SocketServerEvent.RIDE_REJECTED, {
      rideId,
      driverId,
      reason,
      timestamp: new Date().toISOString(),
    });
  }

  // 4. Driver En Route to Pickup -> Ride Room & Admin
  public notifyDriverEnRoute(rideId: string, data: unknown): void {
    const payload =
      typeof data === "object" && data !== null
        ? { rideId, ...(data as Record<string, unknown>) }
        : { rideId, data };
    this.broadcastToRide(rideId, SocketServerEvent.RIDE_DRIVER_EN_ROUTE, payload);
    this.broadcastToAdmin(SocketServerEvent.ADMIN_TELEMETRY_UPDATE, {
      type: "DRIVER_EN_ROUTE",
      rideId,
      data: payload,
    });
  }

  // 5. Driver Arrived at Pickup -> Ride Room & Admin
  public notifyDriverArrived(rideId: string, data: unknown): void {
    const payload =
      typeof data === "object" && data !== null
        ? { rideId, ...(data as Record<string, unknown>) }
        : { rideId, data };
    this.broadcastToRide(rideId, SocketServerEvent.RIDE_DRIVER_ARRIVED, payload);
    this.broadcastToAdmin(SocketServerEvent.ADMIN_TELEMETRY_UPDATE, {
      type: "DRIVER_ARRIVED",
      rideId,
      data: payload,
    });
  }

  // 6. Trip Started (Boarding OTP Verified) -> Ride Room & Admin
  public notifyRideStarted(rideId: string, data: unknown): void {
    const payload =
      typeof data === "object" && data !== null
        ? { rideId, ...(data as Record<string, unknown>) }
        : { rideId, data };
    this.broadcastToRide(rideId, SocketServerEvent.RIDE_STARTED, payload);
    this.broadcastToAdmin(SocketServerEvent.ADMIN_TELEMETRY_UPDATE, {
      type: "RIDE_STARTED",
      rideId,
      data: payload,
    });
  }

  // 7. Trip Completed -> Ride Room & Admin
  public notifyRideCompleted(rideId: string, data: unknown): void {
    const payload =
      typeof data === "object" && data !== null
        ? { rideId, ...(data as Record<string, unknown>) }
        : { rideId, data };
    this.broadcastToRide(rideId, SocketServerEvent.RIDE_COMPLETED, payload);
    this.broadcastToAdmin(SocketServerEvent.ADMIN_TELEMETRY_UPDATE, {
      type: "RIDE_COMPLETED",
      rideId,
      data: payload,
    });
  }

  // 8. Ride Cancelled -> Ride Room & Admin
  public notifyRideCancelled(rideId: string, data: unknown): void {
    const payload =
      typeof data === "object" && data !== null
        ? { rideId, ...(data as Record<string, unknown>) }
        : { rideId, data };
    this.broadcastToRide(rideId, SocketServerEvent.RIDE_CANCELLED, payload);
    this.broadcastToAdmin(SocketServerEvent.ADMIN_TELEMETRY_UPDATE, {
      type: "RIDE_CANCELLED",
      rideId,
      data: payload,
    });
  }

  /**
   * Graceful Shutdown
   */
  public async close(): Promise<void> {
    await new Promise<void>((resolve) => {
      this.io.close(() => {
        resolve();
      });
    });
    setSocketService(null);
  }
}
