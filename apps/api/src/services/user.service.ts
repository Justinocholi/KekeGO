import {
  prisma,
  UserRole,
  DriverVerificationStatus,
  DriverAvailabilityStatus,
} from "@kekego/database";
import type {
  UpdateProfileInput,
  UpdateDriverAvailabilityInput,
  VerifyDriverInput,
} from "@kekego/validation";
import { AppError } from "../utils/errors.js";

export class UserService {
  /**
   * Retrieve full current user profile with role context
   */
  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        passengerProfile: true,
        driverProfile: {
          include: {
            vehicles: true,
            partner: true,
          },
        },
        partnerMemberships: {
          include: {
            partner: true,
          },
        },
        wallet: true,
      },
    });

    if (!user) {
      throw new AppError(404, "USER_NOT_FOUND", "User profile not found");
    }

    return {
      id: user.id,
      phoneNumber: user.phoneNumber,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      passengerProfile: user.passengerProfile,
      driverProfile: user.driverProfile,
      partner: user.partnerMemberships[0]?.partner,
      wallet: user.wallet
        ? {
            id: user.wallet.id,
            balanceKobo: Number(user.wallet.balanceKobo),
            currency: user.wallet.currency,
          }
        : null,
    };
  }

  /**
   * Update profile details (Name, emergency contact)
   */
  async updateUserProfile(userId: string, input: UpdateProfileInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { passengerProfile: true },
    });

    if (!user) {
      throw new AppError(404, "USER_NOT_FOUND", "User not found");
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: input.firstName ?? undefined,
        lastName: input.lastName ?? undefined,
        email: input.email !== undefined ? input.email : undefined,
        passengerProfile:
          user.passengerProfile && (input.emergencyContactName || input.emergencyContactPhone)
            ? {
                update: {
                  emergencyContactName: input.emergencyContactName ?? undefined,
                  emergencyContactPhone: input.emergencyContactPhone ?? undefined,
                },
              }
            : undefined,
      },
      include: {
        passengerProfile: true,
      },
    });

    return {
      id: updated.id,
      firstName: updated.firstName,
      lastName: updated.lastName,
      email: updated.email,
      passengerProfile: updated.passengerProfile,
    };
  }

  /**
   * Update Driver availability status (ONLINE / OFFLINE)
   * Verification Rule: Unverified or suspended drivers must NOT be able to go online!
   */
  async updateDriverAvailability(driverId: string, input: UpdateDriverAvailabilityInput) {
    const driver = await prisma.driverProfile.findUnique({
      where: { id: driverId },
    });

    if (!driver) {
      throw new AppError(404, "DRIVER_NOT_FOUND", "Driver profile not found");
    }

    // Strict Backend Rule: Driver MUST be VERIFIED to go ONLINE
    if (
      input.availabilityStatus === DriverAvailabilityStatus.ONLINE &&
      driver.verificationStatus !== DriverVerificationStatus.VERIFIED
    ) {
      throw new AppError(
        403,
        "DRIVER_NOT_VERIFIED",
        `Driver cannot go online because account verification status is ${driver.verificationStatus}. Approval from Kekego administration is required`
      );
    }

    const isOnline = input.availabilityStatus === DriverAvailabilityStatus.ONLINE;

    const updated = await prisma.driverProfile.update({
      where: { id: driverId },
      data: {
        availabilityStatus: input.availabilityStatus,
        isOnline,
        lastActiveAt: new Date(),
      },
    });

    return {
      driverId: updated.id,
      availabilityStatus: updated.availabilityStatus,
      isOnline: updated.isOnline,
      lastActiveAt: updated.lastActiveAt,
    };
  }

  /**
   * Admin: Verify / Approve / Reject / Suspend a Driver Partner
   */
  async verifyDriver(adminId: string, driverId: string, input: VerifyDriverInput) {
    const driver = await prisma.driverProfile.findUnique({
      where: { id: driverId },
      include: { user: true },
    });

    if (!driver) {
      throw new AppError(404, "DRIVER_NOT_FOUND", "Driver profile not found");
    }

    const updated = await prisma.driverProfile.update({
      where: { id: driverId },
      data: {
        verificationStatus: input.verificationStatus,
        // If rejected or suspended, force driver offline
        isOnline:
          input.verificationStatus === DriverVerificationStatus.VERIFIED
            ? driver.isOnline
            : false,
        availabilityStatus:
          input.verificationStatus === DriverVerificationStatus.VERIFIED
            ? driver.availabilityStatus
            : DriverAvailabilityStatus.OFFLINE,
      },
      include: {
        user: true,
        vehicles: true,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        actorRole: UserRole.ADMIN,
        action: `DRIVER_VERIFICATION_${input.verificationStatus}`,
        entityType: "driver_profile",
        entityId: driverId,
        oldValues: { verificationStatus: driver.verificationStatus },
        newValues: {
          verificationStatus: input.verificationStatus,
          reason: input.reason ?? null,
        },
      },
    });

    return {
      driverId: updated.id,
      driverName: `${updated.user.firstName} ${updated.user.lastName}`,
      verificationStatus: updated.verificationStatus,
      isOnline: updated.isOnline,
    };
  }

  /**
   * Admin: List users with pagination and role filters
   */
  async listUsers(params: { page: number; limit: number; role?: UserRole }) {
    const skip = (params.page - 1) * params.limit;
    const where = params.role ? { role: params.role } : {};

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          phoneNumber: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          driverProfile: {
            select: {
              id: true,
              verificationStatus: true,
              rating: true,
              totalTrips: true,
              isOnline: true,
            },
          },
          passengerProfile: {
            select: {
              id: true,
              rating: true,
              totalRides: true,
            },
          },
        },
      }),
    ]);

    return {
      users,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    };
  }
}
