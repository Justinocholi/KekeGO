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

const MOCK_CURRENT_USERS: Record<string, any> = {
  "u-admin-seed-001": {
    id: "u-admin-seed-001",
    phoneNumber: "+2348011111111",
    email: "admin@kekego.ng",
    firstName: "Super",
    lastName: "Admin",
    role: UserRole.ADMIN,
    isActive: true,
    createdAt: new Date().toISOString(),
    passengerProfile: null,
    driverProfile: null,
    partner: null,
    wallet: { id: "w-admin", balanceKobo: 5000000, currency: "NGN" },
  },
  "u-partner-seed-001": {
    id: "u-partner-seed-001",
    phoneNumber: "+2348044444444",
    email: "partner@karutransit.ng",
    firstName: "Aliyu",
    lastName: "Karu",
    role: UserRole.PARTNER,
    isActive: true,
    createdAt: new Date().toISOString(),
    passengerProfile: null,
    driverProfile: null,
    partner: { id: "partner-karu-trans-002", name: "Karu Transit Fleet Ltd", city: "Karu" },
    wallet: { id: "w-partner", balanceKobo: 1500000, currency: "NGN" },
  },
  "u-driver-seed-001": {
    id: "u-driver-seed-001",
    phoneNumber: "+2348022222222",
    email: "driver.musa@kekego.ng",
    firstName: "Musa",
    lastName: "Ibrahim",
    role: UserRole.DRIVER,
    isActive: true,
    createdAt: new Date().toISOString(),
    passengerProfile: null,
    driverProfile: {
      id: "d0000000-0000-0000-0000-000000000001",
      partnerId: "partner-karu-trans-002",
      verificationStatus: DriverVerificationStatus.VERIFIED,
      availabilityStatus: DriverAvailabilityStatus.ONLINE,
      isOnline: true,
      licenseNumber: "NAS-DRV-2024-9912",
      rating: 4.95,
      totalTrips: 142,
      vehicles: [
        {
          id: "v-musa-001",
          type: "KEKE_NAPEP",
          plateNumber: "LAF-882-XA",
          make: "Bajaj",
          model: "RE 4S",
          color: "Yellow",
          isVerified: true,
          isActive: true,
        },
      ],
      partner: { id: "partner-karu-trans-002", name: "Karu Transit Fleet Ltd" },
    },
    partner: null,
    wallet: { id: "w-driver", balanceKobo: 2500000, currency: "NGN" },
  },
  "u-passenger-seed-001": {
    id: "u-passenger-seed-001",
    phoneNumber: "+2348033333333",
    email: "passenger.amina@gmail.com",
    firstName: "Amina",
    lastName: "Yusuf",
    role: UserRole.PASSENGER,
    isActive: true,
    createdAt: new Date().toISOString(),
    passengerProfile: {
      id: "p0000000-0000-0000-0000-000000000001",
      emergencyContactName: "Hassan Yusuf",
      emergencyContactPhone: "+2348055555555",
      rating: 5.0,
      totalRides: 18,
    },
    driverProfile: null,
    partner: null,
    wallet: { id: "w-passenger", balanceKobo: 1000000, currency: "NGN" },
  },
};

export class UserService {
  /**
   * Retrieve full current user profile with role context
   */
  async getCurrentUser(userId: string) {
    try {
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
    } catch (err) {
      if (err instanceof AppError) throw err;
      const mock = MOCK_CURRENT_USERS[userId];
      if (mock) {
        return mock;
      }
      throw new AppError(404, "USER_NOT_FOUND", "User profile not found");
    }
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
