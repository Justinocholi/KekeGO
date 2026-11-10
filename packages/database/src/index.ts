import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

export * from "@prisma/client";

/**
 * Spatial Helper: Verify if a coordinate (lat, lng) falls inside an active Service Area
 */
export async function isPointInsideServiceArea(
  latitude: number,
  longitude: number
): Promise<{ inside: boolean; serviceAreaId?: string; serviceAreaName?: string }> {
  const result = await prisma.$queryRaw<
    Array<{ id: string; name: string }>
  >`
    SELECT id, name
    FROM "service_areas"
    WHERE "is_active" = true
      AND ST_Contains(
        "boundary_geometry",
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
      )
    LIMIT 1;
  `;

  if (result.length > 0 && result[0]) {
    return {
      inside: true,
      serviceAreaId: result[0].id,
      serviceAreaName: result[0].name,
    };
  }

  return { inside: false };
}

/**
 * Spatial Helper: Find nearby online and verified drivers within radius
 */
export async function findNearbyDrivers(params: {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  limit?: number;
}): Promise<
  Array<{
    driverId: string;
    userId: string;
    firstName: string;
    lastName: string;
    rating: number;
    distanceMeters: number;
    latitude: number;
    longitude: number;
    heading: number | null;
  }>
> {
  const limit = params.limit ?? 10;

  const drivers = await prisma.$queryRaw<
    Array<{
      driver_id: string;
      user_id: string;
      first_name: string;
      last_name: string;
      rating: string;
      distance_meters: number;
      latitude: string;
      longitude: string;
      heading: number | null;
    }>
  >`
    WITH LatestLocations AS (
      SELECT DISTINCT ON ("driver_id")
        "driver_id",
        "latitude",
        "longitude",
        "location_point",
        "heading",
        "recorded_at"
      FROM "driver_locations"
      ORDER BY "driver_id", "recorded_at" DESC
    )
    SELECT
      d.id AS driver_id,
      u.id AS user_id,
      u.first_name,
      u.last_name,
      d.rating::text AS rating,
      loc.latitude::text AS latitude,
      loc.longitude::text AS longitude,
      loc.heading,
      ST_Distance(
        loc.location_point::geography,
        ST_SetSRID(ST_MakePoint(${params.longitude}, ${params.latitude}), 4326)::geography
      ) AS distance_meters
    FROM LatestLocations loc
    JOIN "driver_profiles" d ON d.id = loc.driver_id
    JOIN "users" u ON u.id = d.user_id
    WHERE d.verification_status = 'VERIFIED'
      AND d.availability_status = 'ONLINE'
      AND d.is_online = true
      AND ST_DWithin(
        loc.location_point::geography,
        ST_SetSRID(ST_MakePoint(${params.longitude}, ${params.latitude}), 4326)::geography,
        ${params.radiusMeters}
      )
    ORDER BY distance_meters ASC
    LIMIT ${limit};
  `;

  return drivers.map((d) => ({
    driverId: d.driver_id,
    userId: d.user_id,
    firstName: d.first_name,
    lastName: d.last_name,
    rating: parseFloat(d.rating),
    distanceMeters: Math.round(d.distance_meters),
    latitude: parseFloat(d.latitude),
    longitude: parseFloat(d.longitude),
    heading: d.heading,
  }));
}
