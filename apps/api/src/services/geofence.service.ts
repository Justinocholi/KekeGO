import { prisma, RideTier } from "@kekego/database";
import type {
  CreateServiceAreaInput,
  UpdateServiceAreaInput,
  GeoJsonPolygon,
} from "@kekego/validation";
import { AppError } from "../utils/errors.js";

/**
 * Standard ray-casting algorithm to test whether a coordinate (lng, lat)
 * lies inside a polygon ring [[lng, lat], ...]
 */
export function isPointInPolygon(
  point: [number, number], // [longitude, latitude]
  polygonRing: [number, number][]
): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygonRing.length - 1; i < polygonRing.length; j = i++) {
    const p1 = polygonRing[i];
    const p2 = polygonRing[j];
    if (!p1 || !p2) continue;
    const [xi, yi] = p1;
    const [xj, yj] = p2;
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Authoritative Nasarawa GeoJSON Boundary Definitions
 * Format: GeoJSON coordinates are strictly [longitude, latitude]
 * Order: Specific high-density zones and border extension are checked
 * prior to the statewide perimeter fallback.
 */
export const AUTHORITATIVE_SERVICE_AREAS: Array<{
  id: string;
  name: string;
  state: string;
  country: string;
  isActive: boolean;
  isCharterBorderExtension: boolean;
  boundaryGeoJson: GeoJsonPolygon;
}> = [
  // 1. High-Density Urban Zone: Lafia Metropolis
  {
    id: "a0000000-0000-0000-0000-000000000002",
    name: "Lafia Urban Operational Zone",
    state: "Nasarawa",
    country: "Nigeria",
    isActive: true,
    isCharterBorderExtension: false,
    boundaryGeoJson: {
      type: "Polygon",
      coordinates: [
        [
          [8.46, 8.44],
          [8.57, 8.44],
          [8.57, 8.56],
          [8.46, 8.56],
          [8.46, 8.44],
        ],
      ],
    },
  },
  // 2. High-Density Corridor: Keffi University & Commercial Axis
  {
    id: "a0000000-0000-0000-0000-000000000003",
    name: "Keffi Commercial Corridor",
    state: "Nasarawa",
    country: "Nigeria",
    isActive: true,
    isCharterBorderExtension: false,
    boundaryGeoJson: {
      type: "Polygon",
      coordinates: [
        [
          [7.82, 8.8],
          [7.93, 8.8],
          [7.93, 8.9],
          [7.82, 8.9],
          [7.82, 8.8],
        ],
      ],
    },
  },
  // 3. High-Density Axis: Karu-Mararaba Commercial Hub
  {
    id: "a0000000-0000-0000-0000-000000000004",
    name: "Karu-Mararaba Commercial Axis",
    state: "Nasarawa",
    country: "Nigeria",
    isActive: true,
    isCharterBorderExtension: false,
    boundaryGeoJson: {
      type: "Polygon",
      coordinates: [
        [
          [7.56, 8.98],
          [7.65, 8.98],
          [7.65, 9.07],
          [7.56, 9.07],
          [7.56, 8.98],
        ],
      ],
    },
  },
  // 4. Permitted Outbound Extension for Keke Charter: FCT-Abuja Border Zone
  // (Pickups strictly prohibited; Charter drop-offs permitted)
  {
    id: "a0000000-0000-0000-0000-000000000005",
    name: "FCT-Abuja Border Extension Corridor",
    state: "FCT/Abuja Border",
    country: "Nigeria",
    isActive: true,
    isCharterBorderExtension: true,
    boundaryGeoJson: {
      type: "Polygon",
      coordinates: [
        [
          [7.45, 8.98],
          [7.56, 8.98],
          [7.56, 9.07],
          [7.45, 9.07],
          [7.45, 8.98],
        ],
      ],
    },
  },
  // 5. Statewide Perimeter covering all 13 Nasarawa LGAs (Intra-Nasarawa fallback)
  {
    id: "a0000000-0000-0000-0000-000000000001",
    name: "Nasarawa Statewide Perimeter",
    state: "Nasarawa",
    country: "Nigeria",
    isActive: true,
    isCharterBorderExtension: false,
    boundaryGeoJson: {
      type: "Polygon",
      coordinates: [
        [
          [7.56, 7.8],
          [9.4, 7.8],
          [9.4, 9.4],
          [7.56, 9.4],
          [7.56, 7.8],
        ],
      ],
    },
  },
];

export interface PointValidationResult {
  isInside: boolean;
  zoneName?: string;
  serviceAreaId?: string;
  isCharterBorderExtension: boolean;
}

export interface TripValidationResult {
  isValid: boolean;
  isCrossBoundary: boolean;
  pickupZone: string;
  destinationZone: string;
  allowedTiers: RideTier[];
  policyNotice?: string;
}

export class GeofenceService {
  /**
   * Retrieves active service areas from PostgreSQL / PostGIS or fallback memory cache
   */
  async getActiveServiceAreas() {
    try {
      if (process.env.DATABASE_URL) {
        const dbAreas = await prisma.serviceArea.findMany({
          where: { isActive: true },
        });

        if (dbAreas.length > 0) {
          return dbAreas.map((area) => {
            const boundary = area.boundaryGeoJson as unknown as GeoJsonPolygon;
            const isCharterBorderExtension =
              area.name.toLowerCase().includes("border") ||
              area.name.toLowerCase().includes("fct");

            return {
              id: area.id,
              name: area.name,
              state: area.state,
              country: area.country,
              isActive: area.isActive,
              isCharterBorderExtension,
              boundaryGeoJson: boundary,
            };
          });
        }
      }
    } catch {
      // Fallback to authoritative baseline
    }

    return AUTHORITATIVE_SERVICE_AREAS.filter((a) => a.isActive);
  }

  /**
   * Validate whether a single coordinate (latitude, longitude) is inside an active service area
   */
  async validatePoint(
    latitude: number,
    longitude: number
  ): Promise<PointValidationResult> {
    const areas = await this.getActiveServiceAreas();

    for (const area of areas) {
      const ring = area.boundaryGeoJson.coordinates[0];
      if (ring && isPointInPolygon([longitude, latitude], ring)) {
        return {
          isInside: true,
          zoneName: area.name,
          serviceAreaId: area.id,
          isCharterBorderExtension: area.isCharterBorderExtension,
        };
      }
    }

    return {
      isInside: false,
      isCharterBorderExtension: false,
    };
  }

  /**
   * Enforce Kekego's operating policy for trips across boundaries:
   * 1. Pickup MUST be within active Nasarawa territory (not in border extension or outside).
   * 2. Destination:
   *    - Inside Nasarawa: ALLOWED for STANDARD, CHARTER, CARGO.
   *    - Inside FCT-Abuja border extension: ALLOWED ONLY for CHARTER.
   *    - Outside both: REJECTED with OUT_OF_SERVICE_AREA.
   */
  async validateTrip(
    pickup: { latitude: number; longitude: number; address?: string },
    destination: { latitude: number; longitude: number; address?: string },
    requestedTier: RideTier = RideTier.STANDARD
  ): Promise<TripValidationResult> {
    const [pickupResult, destResult] = await Promise.all([
      this.validatePoint(pickup.latitude, pickup.longitude),
      this.validatePoint(destination.latitude, destination.longitude),
    ]);

    // Rule 1: Pickup must be inside Nasarawa State
    if (!pickupResult.isInside || pickupResult.isCharterBorderExtension) {
      throw new AppError(
        422,
        "OUT_OF_SERVICE_AREA",
        "Pickup location is outside Kekego's operating territory in Nasarawa State. Commercial tricycles are only dispatched within verified service zones.",
        {
          pickupCoordinates: {
            latitude: pickup.latitude,
            longitude: pickup.longitude,
          },
        }
      );
    }

    // Rule 2: Destination check
    if (!destResult.isInside) {
      throw new AppError(
        422,
        "OUT_OF_SERVICE_AREA",
        "Destination is outside Kekego's operational boundaries. Trips cannot be booked to unserviced locations.",
        {
          destinationCoordinates: {
            latitude: destination.latitude,
            longitude: destination.longitude,
          },
        }
      );
    }

    // Rule 3: Cross-Boundary Trip Policy to FCT/Abuja Border
    if (destResult.isCharterBorderExtension) {
      if (requestedTier !== RideTier.CHARTER) {
        throw new AppError(
          422,
          "CROSS_BOUNDARY_RESTRICTED",
          "Cross-boundary trips into FCT/Abuja border areas are only permitted for Keke Charter service. Standard and Cargo tricycles are restricted to intra-Nasarawa routes.",
          {
            destinationZone: destResult.zoneName,
            allowedTier: RideTier.CHARTER,
          }
        );
      }

      return {
        isValid: true,
        isCrossBoundary: true,
        pickupZone: pickupResult.zoneName || "Nasarawa Service Zone",
        destinationZone: destResult.zoneName || "FCT-Abuja Border Extension",
        allowedTiers: [RideTier.CHARTER],
        policyNotice:
          "Outbound Charter trip to FCT-Abuja border approved. Standard intra-state tricycles cannot service this route.",
      };
    }

    // Standard intra-Nasarawa trip
    return {
      isValid: true,
      isCrossBoundary: false,
      pickupZone: pickupResult.zoneName || "Nasarawa Service Zone",
      destinationZone: destResult.zoneName || "Nasarawa Service Zone",
      allowedTiers: [RideTier.STANDARD, RideTier.CHARTER, RideTier.CARGO],
    };
  }

  /**
   * Verifies driver GPS location before allowing online availability
   */
  async validateDriverLocation(
    latitude: number,
    longitude: number
  ): Promise<{ isEligible: boolean; zoneName?: string }> {
    const point = await this.validatePoint(latitude, longitude);

    if (!point.isInside || point.isCharterBorderExtension) {
      return { isEligible: false };
    }

    return {
      isEligible: true,
      zoneName: point.zoneName,
    };
  }

  // --------------------------------------------------------------------------
  // Admin Service-Area Management
  // --------------------------------------------------------------------------

  async getAllServiceAreas() {
    try {
      if (process.env.DATABASE_URL) {
        const areas = await prisma.serviceArea.findMany({
          orderBy: { createdAt: "desc" },
          include: {
            fareRules: true,
            _count: { select: { rides: true } },
          },
        });

        if (areas.length > 0) {
          return areas.map((a) => ({
            id: a.id,
            name: a.name,
            state: a.state,
            country: a.country,
            isActive: a.isActive,
            boundaryGeoJson: a.boundaryGeoJson as unknown as GeoJsonPolygon,
            ridesCount: a._count.rides,
            fareRulesCount: a.fareRules.length,
            createdAt: a.createdAt,
            updatedAt: a.updatedAt,
          }));
        }
      }
    } catch {
      // Fallback
    }

    return AUTHORITATIVE_SERVICE_AREAS.map((a) => ({
      id: a.id,
      name: a.name,
      state: a.state,
      country: a.country,
      isActive: a.isActive,
      boundaryGeoJson: a.boundaryGeoJson,
      ridesCount: 0,
      fareRulesCount: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  async getServiceAreaById(id: string) {
    const areas = await this.getAllServiceAreas();
    const found = areas.find((a) => a.id === id);

    if (!found) {
      throw new AppError(404, "SERVICE_AREA_NOT_FOUND", "Service area not found");
    }

    return found;
  }

  async createServiceArea(input: CreateServiceAreaInput) {
    try {
      if (process.env.DATABASE_URL) {
        const created = await prisma.serviceArea.create({
          data: {
            name: input.name,
            state: input.state,
            country: input.country,
            isActive: input.isActive,
            boundaryGeoJson: input.boundaryGeoJson,
          },
        });

        return {
          id: created.id,
          name: created.name,
          state: created.state,
          country: created.country,
          isActive: created.isActive,
          boundaryGeoJson: created.boundaryGeoJson,
        };
      }
    } catch {
      // Offline fallback
    }

    const newId = `a0000000-0000-0000-0000-${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    const created = {
      id: newId,
      name: input.name,
      state: input.state,
      country: input.country,
      isActive: input.isActive,
      isCharterBorderExtension: input.isCharterBorderExtension,
      boundaryGeoJson: input.boundaryGeoJson,
    };
    AUTHORITATIVE_SERVICE_AREAS.push(created);
    return created;
  }

  async updateServiceArea(id: string, input: UpdateServiceAreaInput) {
    try {
      if (process.env.DATABASE_URL) {
        const updated = await prisma.serviceArea.update({
          where: { id },
          data: {
            name: input.name,
            state: input.state,
            isActive: input.isActive,
            boundaryGeoJson: input.boundaryGeoJson,
          },
        });

        return updated;
      }
    } catch {
      // Offline fallback
    }

    const found = AUTHORITATIVE_SERVICE_AREAS.find((a) => a.id === id);
    if (!found) {
      throw new AppError(404, "SERVICE_AREA_NOT_FOUND", "Service area not found");
    }

    if (input.name) found.name = input.name;
    if (input.state) found.state = input.state;
    if (input.isActive !== undefined) found.isActive = input.isActive;
    if (input.boundaryGeoJson) found.boundaryGeoJson = input.boundaryGeoJson;
    if (input.isCharterBorderExtension !== undefined)
      found.isCharterBorderExtension = input.isCharterBorderExtension;

    return found;
  }

  async toggleServiceArea(id: string, activeState?: boolean) {
    const existing = await this.getServiceAreaById(id);
    const nextState = activeState !== undefined ? activeState : !existing.isActive;

    return this.updateServiceArea(id, { isActive: nextState });
  }
}
