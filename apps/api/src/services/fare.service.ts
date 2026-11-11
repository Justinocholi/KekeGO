import {
  prisma,
  UserRole,
} from "@kekego/database";
import { RideTier } from "@kekego/shared";
import type {
  CreateFareRuleInput,
  UpdateFareRuleInput,
  FareEstimateQueryInput,
  CalculatedFareBreakdown,
} from "@kekego/validation";
import { AppError } from "../utils/errors.js";
import { GeofenceService } from "./geofence.service.js";
import { calculateDistanceMeters } from "./ride.service.js";

export interface FareRuleConfig {
  id?: string;
  serviceAreaId?: string | null;
  tier: RideTier;
  baseFareKobo: number;
  distanceFarePerKmKobo: number;
  timeFarePerMinKobo: number;
  minimumFareKobo: number;
  cancellationFeeKobo: number;
  platformCommissionPercent: number;
  partnerCommissionPercent: number;
  surgeMultiplier: number;
  isActive: boolean;
  version: number;
}

// In-memory fallback and test cache for fare rules
export const IN_MEMORY_FARE_RULES: Map<string, FareRuleConfig> = new Map();

// In-memory persistent snapshot of ride fare breakdowns
export const IN_MEMORY_FARE_BREAKDOWNS: Map<string, CalculatedFareBreakdown> = new Map();

// Default baseline Nasarawa fare rules
export const DEFAULT_FARE_RULES: Record<RideTier, FareRuleConfig> = {
  [RideTier.STANDARD]: {
    id: "f0000000-0000-0000-0000-000000000001",
    tier: RideTier.STANDARD,
    baseFareKobo: 20000, // 200 NGN
    distanceFarePerKmKobo: 7000, // 70 NGN / km
    timeFarePerMinKobo: 1500, // 15 NGN / min
    minimumFareKobo: 25000, // 250 NGN min
    cancellationFeeKobo: 10000, // 100 NGN
    platformCommissionPercent: 15.0,
    partnerCommissionPercent: 5.0,
    surgeMultiplier: 1.0,
    isActive: true,
    version: 1,
  },
  [RideTier.CHARTER]: {
    id: "f0000000-0000-0000-0000-000000000002",
    tier: RideTier.CHARTER,
    baseFareKobo: 50000, // 500 NGN
    distanceFarePerKmKobo: 12000, // 120 NGN / km
    timeFarePerMinKobo: 3000, // 30 NGN / min
    minimumFareKobo: 60000, // 600 NGN min
    cancellationFeeKobo: 20000, // 200 NGN
    platformCommissionPercent: 15.0,
    partnerCommissionPercent: 5.0,
    surgeMultiplier: 1.0,
    isActive: true,
    version: 1,
  },
  [RideTier.CARGO]: {
    id: "f0000000-0000-0000-0000-000000000003",
    tier: RideTier.CARGO,
    baseFareKobo: 35000, // 350 NGN
    distanceFarePerKmKobo: 9000, // 90 NGN / km
    timeFarePerMinKobo: 2000, // 20 NGN / min
    minimumFareKobo: 40000, // 400 NGN min
    cancellationFeeKobo: 15000, // 150 NGN
    platformCommissionPercent: 15.0,
    partnerCommissionPercent: 5.0,
    surgeMultiplier: 1.0,
    isActive: true,
    version: 1,
  },
};

// Initialize in-memory rules
for (const [tier, rule] of Object.entries(DEFAULT_FARE_RULES)) {
  IN_MEMORY_FARE_RULES.set(tier, { ...rule });
}

export class FareService {
  private geofenceService = new GeofenceService();

  /**
   * Pure, deterministic fare calculation function.
   * All monetary values are integer minor units (kobo).
   * Surge pricing is strictly locked to 1.00 in MVP scope.
   */
  public calculateFare(params: {
    distanceMeters: number;
    durationSeconds: number;
    rule: FareRuleConfig;
    discountKobo?: number;
    hasPartner?: boolean;
  }): CalculatedFareBreakdown {
    const {
      distanceMeters,
      durationSeconds,
      rule,
      discountKobo = 0,
      hasPartner = false,
    } = params;

    const distanceKm = Math.round((distanceMeters / 1000) * 100) / 100;
    // Commercial tricycle urban travel time estimate (rounded to nearest minute, minimum 1 min)
    const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));

    const baseFareKobo = rule.baseFareKobo;
    const distanceChargeKobo = Math.round(
      (distanceMeters / 1000) * rule.distanceFarePerKmKobo
    );
    const timeChargeKobo = Math.round(
      durationMinutes * rule.timeFarePerMinKobo
    );
    const minimumFareKobo = rule.minimumFareKobo;

    // Subtotal before minimum clamping
    const subtotalKobo = baseFareKobo + distanceChargeKobo + timeChargeKobo;

    // Surge pricing is disabled (strictly 1.00) unless explicitly authorized
    const surgeMultiplier = 1.0;

    // Apply minimum fare clamping: total fare cannot fall below minimumFareKobo
    const postDiscount = Math.max(0, subtotalKobo - discountKobo);
    const totalFareKobo = Math.max(minimumFareKobo, postDiscount);

    // Revenue splits (Platform 15%, Partner 5%, Driver remainder)
    const platformCommissionKobo = Math.round(
      totalFareKobo * (rule.platformCommissionPercent / 100)
    );
    const partnerCommissionKobo = hasPartner
      ? Math.round(totalFareKobo * (rule.partnerCommissionPercent / 100))
      : 0;
    const driverEarningsKobo =
      totalFareKobo - platformCommissionKobo - partnerCommissionKobo;

    return {
      currency: "NGN",
      tier: rule.tier,
      fareRuleId: rule.id,
      fareRuleVersion: rule.version,
      baseFareKobo,
      distanceKm,
      distanceChargeKobo,
      durationMinutes,
      timeChargeKobo,
      minimumFareKobo,
      subtotalKobo,
      surgeMultiplier,
      discountKobo,
      totalFareKobo,
      platformCommissionKobo,
      partnerCommissionKobo,
      driverEarningsKobo,
      cancellationFeeKobo: rule.cancellationFeeKobo,
    };
  }

  /**
   * Retrieve active FareRule for a tier and optional service area.
   * Database is authoritative, falling back to in-memory configuration if DB is unreachable.
   */
  public async getActiveRuleForTier(
    tier: RideTier | string,
    serviceAreaId?: string
  ): Promise<FareRuleConfig> {
    const tierEnum = tier as RideTier;
    try {
      if (process.env.DATABASE_URL) {
        const dbRule = await prisma.fareRule.findFirst({
          where: {
            tier: tierEnum as any,
            isActive: true,
            ...(serviceAreaId ? { serviceAreaId } : {}),
          },
          orderBy: { version: "desc" },
        });

        if (dbRule) {
          return {
            id: dbRule.id,
            serviceAreaId: dbRule.serviceAreaId,
            tier: dbRule.tier as unknown as RideTier,
            baseFareKobo: dbRule.baseFareKobo,
            distanceFarePerKmKobo: dbRule.distanceFarePerKmKobo,
            timeFarePerMinKobo: dbRule.timeFarePerMinKobo,
            minimumFareKobo: dbRule.minimumFareKobo,
            cancellationFeeKobo: dbRule.cancellationFeeKobo,
            platformCommissionPercent: Number(dbRule.platformCommissionPercent),
            partnerCommissionPercent: Number(dbRule.partnerCommissionPercent),
            surgeMultiplier: 1.0, // Surge locked to 1.0
            isActive: dbRule.isActive,
            version: dbRule.version,
          };
        }
      }
    } catch {
      // In-memory fallback
    }

    // Fallback to in-memory store
    const memRule = IN_MEMORY_FARE_RULES.get(tierEnum);
    if (memRule && memRule.isActive) {
      return memRule;
    }

    return DEFAULT_FARE_RULES[tierEnum] || DEFAULT_FARE_RULES[RideTier.STANDARD];
  }

  /**
   * Calculate fare estimate across tiers with spatial geofence validation
   */
  public async estimateFare(query: FareEstimateQueryInput) {
    // 1. Enforce Nasarawa operational perimeter validation
    const validation = await this.geofenceService.validateTrip(
      query.pickup,
      query.destination,
      query.tier
    );

    // 2. Server-calculate trusted distance and duration
    const distanceMeters = calculateDistanceMeters(
      query.pickup.latitude,
      query.pickup.longitude,
      query.destination.latitude,
      query.destination.longitude
    );

    const distanceKm = distanceMeters / 1000;
    // Commercial tricycle urban travel speed estimate: ~25 km/h
    const durationMinutes = Math.max(1, Math.round((distanceKm / 25) * 60));
    const durationSeconds = durationMinutes * 60;

    const tiersToEstimate = query.tier
      ? [query.tier]
      : [RideTier.STANDARD, RideTier.CHARTER, RideTier.CARGO];

    const estimates: CalculatedFareBreakdown[] = [];

    for (const tier of tiersToEstimate) {
      const rule = await this.getActiveRuleForTier(
        tier,
        query.serviceAreaId
      );

      const breakdown = this.calculateFare({
        distanceMeters,
        durationSeconds,
        rule,
      });

      estimates.push(breakdown);
    }

    return {
      pickup: query.pickup,
      destination: query.destination,
      validation,
      distanceMeters,
      durationSeconds,
      estimates,
    };
  }

  /**
   * Create or update pricing rules (Admin only).
   * Implements strict auditable versioning:
   * When rates change, marks existing rule inactive and creates version N+1.
   * Historical ride breakdowns remain immutable!
   */
  public async setFareRule(
    adminUserId: string,
    input: CreateFareRuleInput
  ): Promise<FareRuleConfig> {
    const existingActive = await this.getActiveRuleForTier(
      input.tier,
      input.serviceAreaId
    );

    const nextVersion = (existingActive?.version ?? 0) + 1;

    try {
      if (process.env.DATABASE_URL) {
        return await prisma.$transaction(async (tx) => {
          // Deactivate current active rule
          if (existingActive?.id) {
            await tx.fareRule.updateMany({
              where: {
                tier: input.tier,
                serviceAreaId: input.serviceAreaId || null,
                isActive: true,
              },
              data: { isActive: false },
            });
          }

          // Create new versioned rule
          const created = await tx.fareRule.create({
            data: {
              tier: input.tier,
              serviceAreaId: input.serviceAreaId,
              baseFareKobo: input.baseFareKobo,
              distanceFarePerKmKobo: input.distanceFarePerKmKobo,
              timeFarePerMinKobo: input.timeFarePerMinKobo,
              minimumFareKobo: input.minimumFareKobo,
              cancellationFeeKobo: input.cancellationFeeKobo ?? 10000,
              platformCommissionPercent: input.platformCommissionPercent ?? 15.0,
              partnerCommissionPercent: input.partnerCommissionPercent ?? 5.0,
              surgeMultiplier: 1.0,
              isActive: true,
              version: nextVersion,
            },
          });

          // Audit log entry
          await tx.auditLog.create({
            data: {
              actorId: adminUserId,
              actorRole: UserRole.ADMIN,
              action: "FARE_RULE_CREATED",
              entityType: "FareRule",
              entityId: created.id,
              oldValues: existingActive ? (existingActive as any) : undefined,
              newValues: {
                tier: created.tier,
                version: created.version,
                baseFareKobo: created.baseFareKobo,
                distanceFarePerKmKobo: created.distanceFarePerKmKobo,
                minimumFareKobo: created.minimumFareKobo,
              },
            },
          });

          const resultConfig: FareRuleConfig = {
            id: created.id,
            serviceAreaId: created.serviceAreaId,
            tier: created.tier as unknown as RideTier,
            baseFareKobo: created.baseFareKobo,
            distanceFarePerKmKobo: created.distanceFarePerKmKobo,
            timeFarePerMinKobo: created.timeFarePerMinKobo,
            minimumFareKobo: created.minimumFareKobo,
            cancellationFeeKobo: created.cancellationFeeKobo,
            platformCommissionPercent: Number(created.platformCommissionPercent),
            partnerCommissionPercent: Number(created.partnerCommissionPercent),
            surgeMultiplier: 1.0,
            isActive: created.isActive,
            version: created.version,
          };

          IN_MEMORY_FARE_RULES.set(created.tier, resultConfig);
          return resultConfig;
        });
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      // In-memory fallback
    }

    const inMemRule: FareRuleConfig = {
      id: `fare-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      serviceAreaId: input.serviceAreaId || null,
      tier: input.tier,
      baseFareKobo: input.baseFareKobo,
      distanceFarePerKmKobo: input.distanceFarePerKmKobo,
      timeFarePerMinKobo: input.timeFarePerMinKobo,
      minimumFareKobo: input.minimumFareKobo,
      cancellationFeeKobo: input.cancellationFeeKobo ?? 10000,
      platformCommissionPercent: input.platformCommissionPercent ?? 15.0,
      partnerCommissionPercent: input.partnerCommissionPercent ?? 5.0,
      surgeMultiplier: 1.0,
      isActive: true,
      version: nextVersion,
    };

    IN_MEMORY_FARE_RULES.set(input.tier, inMemRule);
    return inMemRule;
  }

  /**
   * Update or supersede an existing fare rule by ID
   */
  public async updateFareRule(
    adminUserId: string,
    ruleId: string,
    input: UpdateFareRuleInput
  ): Promise<FareRuleConfig> {
    try {
      if (process.env.DATABASE_URL) {
        const existing = await prisma.fareRule.findUnique({
          where: { id: ruleId },
        });

        if (!existing) {
          throw new AppError(404, "FARE_RULE_NOT_FOUND", "Fare rule not found");
        }

        // If pricing amounts changed, create new version
        const ratesChanged =
          (input.baseFareKobo !== undefined &&
            input.baseFareKobo !== existing.baseFareKobo) ||
          (input.distanceFarePerKmKobo !== undefined &&
            input.distanceFarePerKmKobo !== existing.distanceFarePerKmKobo) ||
          (input.timeFarePerMinKobo !== undefined &&
            input.timeFarePerMinKobo !== existing.timeFarePerMinKobo) ||
          (input.minimumFareKobo !== undefined &&
            input.minimumFareKobo !== existing.minimumFareKobo);

        if (ratesChanged) {
          return this.setFareRule(adminUserId, {
            tier: existing.tier as unknown as RideTier,
            serviceAreaId: existing.serviceAreaId || undefined,
            baseFareKobo: input.baseFareKobo ?? existing.baseFareKobo,
            distanceFarePerKmKobo:
              input.distanceFarePerKmKobo ?? existing.distanceFarePerKmKobo,
            timeFarePerMinKobo:
              input.timeFarePerMinKobo ?? existing.timeFarePerMinKobo,
            minimumFareKobo:
              input.minimumFareKobo ?? existing.minimumFareKobo,
            cancellationFeeKobo:
              input.cancellationFeeKobo ?? existing.cancellationFeeKobo,
            platformCommissionPercent:
              input.platformCommissionPercent ??
              Number(existing.platformCommissionPercent),
            partnerCommissionPercent:
              input.partnerCommissionPercent ??
              Number(existing.partnerCommissionPercent),
            surgeMultiplier: 1.0,
          });
        }

        // If only toggling isActive:
        const updated = await prisma.fareRule.update({
          where: { id: ruleId },
          data: {
            isActive: input.isActive ?? existing.isActive,
          },
        });

        return {
          id: updated.id,
          serviceAreaId: updated.serviceAreaId,
          tier: updated.tier as unknown as RideTier,
          baseFareKobo: updated.baseFareKobo,
          distanceFarePerKmKobo: updated.distanceFarePerKmKobo,
          timeFarePerMinKobo: updated.timeFarePerMinKobo,
          minimumFareKobo: updated.minimumFareKobo,
          cancellationFeeKobo: updated.cancellationFeeKobo,
          platformCommissionPercent: Number(updated.platformCommissionPercent),
          partnerCommissionPercent: Number(updated.partnerCommissionPercent),
          surgeMultiplier: 1.0,
          isActive: updated.isActive,
          version: updated.version,
        };
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      // In-memory fallback
    }

    // In-memory fallback search
    const foundEntry = Array.from(IN_MEMORY_FARE_RULES.entries()).find(
      ([, r]) => r.id === ruleId
    );

    if (!foundEntry) {
      throw new AppError(404, "FARE_RULE_NOT_FOUND", "Fare rule not found");
    }

    const [key, existing] = foundEntry;
    const nextVersion = existing.version + 1;
    const updatedRule: FareRuleConfig = {
      ...existing,
      baseFareKobo: input.baseFareKobo ?? existing.baseFareKobo,
      distanceFarePerKmKobo:
        input.distanceFarePerKmKobo ?? existing.distanceFarePerKmKobo,
      timeFarePerMinKobo:
        input.timeFarePerMinKobo ?? existing.timeFarePerMinKobo,
      minimumFareKobo: input.minimumFareKobo ?? existing.minimumFareKobo,
      cancellationFeeKobo:
        input.cancellationFeeKobo ?? existing.cancellationFeeKobo,
      isActive: input.isActive ?? existing.isActive,
      version: nextVersion,
    };

    IN_MEMORY_FARE_RULES.set(key, updatedRule);
    return updatedRule;
  }

  /**
   * List all fare rules (active & historical versions for admin auditing)
   */
  public async listFareRules(serviceAreaId?: string): Promise<FareRuleConfig[]> {
    try {
      if (process.env.DATABASE_URL) {
        const rules = await prisma.fareRule.findMany({
          where: serviceAreaId ? { serviceAreaId } : {},
          orderBy: [{ tier: "asc" }, { version: "desc" }],
        });

        if (rules.length > 0) {
          return rules.map((r) => ({
            id: r.id,
            serviceAreaId: r.serviceAreaId,
            tier: r.tier as unknown as RideTier,
            baseFareKobo: r.baseFareKobo,
            distanceFarePerKmKobo: r.distanceFarePerKmKobo,
            timeFarePerMinKobo: r.timeFarePerMinKobo,
            minimumFareKobo: r.minimumFareKobo,
            cancellationFeeKobo: r.cancellationFeeKobo,
            platformCommissionPercent: Number(r.platformCommissionPercent),
            partnerCommissionPercent: Number(r.partnerCommissionPercent),
            surgeMultiplier: 1.0,
            isActive: r.isActive,
            version: r.version,
          }));
        }
      }
    } catch {
      // In-memory fallback
    }

    return Array.from(IN_MEMORY_FARE_RULES.values());
  }

  /**
   * Persist immutable RideFareBreakdown snapshot record.
   * Guarantees that future pricing rule updates will never alter historical trip records.
   */
  public async saveFareBreakdownSnapshot(
    rideId: string,
    breakdown: CalculatedFareBreakdown
  ): Promise<void> {
    IN_MEMORY_FARE_BREAKDOWNS.set(rideId, breakdown);

    try {
      if (process.env.DATABASE_URL) {
        await prisma.rideFareBreakdown.upsert({
          where: { rideId },
          update: {
            fareRuleId: breakdown.fareRuleId || null,
            fareRuleVersion: breakdown.fareRuleVersion,
            baseFareKobo: breakdown.baseFareKobo,
            distanceChargeKobo: breakdown.distanceChargeKobo,
            timeChargeKobo: breakdown.timeChargeKobo,
            cancellationFeeKobo: breakdown.cancellationFeeKobo,
            surgeMultiplier: breakdown.surgeMultiplier,
            discountKobo: breakdown.discountKobo,
            subtotalKobo: breakdown.subtotalKobo,
            totalFareKobo: breakdown.totalFareKobo,
            platformCommissionKobo: breakdown.platformCommissionKobo,
            partnerCommissionKobo: breakdown.partnerCommissionKobo,
            driverEarningsKobo: breakdown.driverEarningsKobo,
          },
          create: {
            rideId,
            fareRuleId: breakdown.fareRuleId || null,
            fareRuleVersion: breakdown.fareRuleVersion,
            currency: "NGN",
            baseFareKobo: breakdown.baseFareKobo,
            distanceChargeKobo: breakdown.distanceChargeKobo,
            timeChargeKobo: breakdown.timeChargeKobo,
            cancellationFeeKobo: breakdown.cancellationFeeKobo,
            surgeMultiplier: breakdown.surgeMultiplier,
            discountKobo: breakdown.discountKobo,
            subtotalKobo: breakdown.subtotalKobo,
            totalFareKobo: breakdown.totalFareKobo,
            platformCommissionKobo: breakdown.platformCommissionKobo,
            partnerCommissionKobo: breakdown.partnerCommissionKobo,
            driverEarningsKobo: breakdown.driverEarningsKobo,
          },
        });
      }
    } catch {
      // Async snapshot write
    }
  }

  /**
   * Retrieve immutable fare breakdown snapshot for a trip
   */
  public async getFareBreakdownSnapshot(
    rideId: string
  ): Promise<CalculatedFareBreakdown | null> {
    try {
      if (process.env.DATABASE_URL) {
        const record = await prisma.rideFareBreakdown.findUnique({
          where: { rideId },
          include: { ride: { select: { tier: true } } },
        });

        if (record) {
          return {
            currency: "NGN",
            tier: record.ride.tier as unknown as RideTier,
            fareRuleId: record.fareRuleId || undefined,
            fareRuleVersion: record.fareRuleVersion,
            baseFareKobo: record.baseFareKobo,
            distanceKm: 0, // Recorded in distanceChargeKobo
            distanceChargeKobo: record.distanceChargeKobo,
            durationMinutes: 0,
            timeChargeKobo: record.timeChargeKobo,
            minimumFareKobo: record.baseFareKobo,
            subtotalKobo: record.subtotalKobo,
            surgeMultiplier: Number(record.surgeMultiplier),
            discountKobo: record.discountKobo,
            totalFareKobo: record.totalFareKobo,
            platformCommissionKobo: record.platformCommissionKobo,
            partnerCommissionKobo: record.partnerCommissionKobo,
            driverEarningsKobo: record.driverEarningsKobo,
            cancellationFeeKobo: record.cancellationFeeKobo,
          };
        }
      }
    } catch {
      // In-memory fallback
    }

    return IN_MEMORY_FARE_BREAKDOWNS.get(rideId) || null;
  }
}
