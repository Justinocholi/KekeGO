import {
  prisma,
  UserRole,
  DriverVerificationStatus,
  DriverAvailabilityStatus,
  VehicleType,
} from "@kekego/database";
import type {
  RegisterPassengerInput,
  RegisterDriverInput,
  LoginInput,
  ProvisionAdminInput,
} from "@kekego/validation";
import type { FastifyInstance } from "fastify";
import { hashPassword, comparePassword } from "../utils/password.js";
import { AppError } from "../utils/errors.js";
import type { TokenPayload, AuthTokens } from "../types/auth.js";
import { env } from "../config/env.js";

export class AuthService {
  constructor(private readonly fastify: FastifyInstance) {}

  /**
   * Issue signed access & refresh token pair
   */
  generateTokens(payload: TokenPayload): AuthTokens {
    const accessToken = this.fastify.jwt.sign(payload, {
      expiresIn: env.JWT_ACCESS_EXPIRY,
    });

    const refreshToken = this.fastify.jwt.sign(
      { userId: payload.userId, tokenType: "refresh" },
      { expiresIn: env.JWT_REFRESH_EXPIRY }
    );

    return {
      accessToken,
      refreshToken,
      expiresInSeconds: 15 * 60, // 15 minutes
    };
  }

  /**
   * Register a new Passenger
   */
  async registerPassenger(input: RegisterPassengerInput) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { phoneNumber: input.phoneNumber },
          ...(input.email ? [{ email: input.email }] : []),
        ],
      },
    });

    if (existing) {
      throw new AppError(
        409,
        "USER_ALREADY_EXISTS",
        "An account with this phone number or email already exists"
      );
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        phoneNumber: input.phoneNumber,
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: UserRole.PASSENGER,
        passengerProfile: {
          create: {
            emergencyContactName: input.emergencyContactName,
            emergencyContactPhone: input.emergencyContactPhone,
          },
        },
        wallet: {
          create: {
            balanceKobo: 0,
          },
        },
      },
      include: {
        passengerProfile: true,
      },
    });

    const tokens = this.generateTokens({
      userId: user.id,
      role: user.role,
      phoneNumber: user.phoneNumber,
      passengerId: user.passengerProfile?.id,
    });

    return {
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        passengerProfile: user.passengerProfile,
      },
      tokens,
    };
  }

  /**
   * Register a new Driver Partner with initial Vehicle
   */
  async registerDriver(input: RegisterDriverInput) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phoneNumber: input.phoneNumber },
          ...(input.email ? [{ email: input.email }] : []),
        ],
      },
    });

    if (existingUser) {
      throw new AppError(
        409,
        "USER_ALREADY_EXISTS",
        "An account with this phone number or email already exists"
      );
    }

    const existingLicense = await prisma.driverProfile.findUnique({
      where: { licenseNumber: input.licenseNumber },
    });
    if (existingLicense) {
      throw new AppError(
        409,
        "LICENSE_ALREADY_EXISTS",
        "A driver with this license number is already registered"
      );
    }

    const existingPlate = await prisma.vehicle.findUnique({
      where: { plateNumber: input.vehicle.plateNumber },
    });
    if (existingPlate) {
      throw new AppError(
        409,
        "PLATE_ALREADY_EXISTS",
        "A vehicle with this plate number is already registered"
      );
    }

    if (input.partnerId) {
      const partner = await prisma.partner.findUnique({
        where: { id: input.partnerId },
      });
      if (!partner) {
        throw new AppError(
          404,
          "PARTNER_NOT_FOUND",
          "Specified fleet partner does not exist"
        );
      }
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        phoneNumber: input.phoneNumber,
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: UserRole.DRIVER,
        driverProfile: {
          create: {
            partnerId: input.partnerId,
            verificationStatus: DriverVerificationStatus.PENDING_REVIEW,
            availabilityStatus: DriverAvailabilityStatus.OFFLINE,
            licenseNumber: input.licenseNumber,
            licenseExpiry: input.licenseExpiry ? new Date(input.licenseExpiry) : null,
            vehicles: {
              create: {
                partnerId: input.partnerId,
                type: input.vehicle.type as VehicleType,
                plateNumber: input.vehicle.plateNumber,
                make: input.vehicle.make,
                model: input.vehicle.model,
                color: input.vehicle.color,
                year: input.vehicle.year,
                isVerified: false,
              },
            },
            wallet: {
              create: {
                balanceKobo: 0,
              },
            },
          },
        },
      },
      include: {
        driverProfile: {
          include: {
            vehicles: true,
          },
        },
      },
    });

    const tokens = this.generateTokens({
      userId: user.id,
      role: user.role,
      phoneNumber: user.phoneNumber,
      driverId: user.driverProfile?.id,
      partnerId: user.driverProfile?.partnerId,
    });

    return {
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        driverProfile: user.driverProfile,
      },
      tokens,
    };
  }

  /**
   * Unified Authentication (Login for all roles)
   */
  async login(input: LoginInput) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phoneNumber: input.identifier },
          { email: input.identifier.toLowerCase() },
        ],
      },
      include: {
        passengerProfile: true,
        driverProfile: {
          include: {
            vehicles: true,
          },
        },
        partnerMemberships: {
          include: {
            partner: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError(
        401,
        "INVALID_CREDENTIALS",
        "Invalid phone number/email or password"
      );
    }

    if (!user.isActive) {
      throw new AppError(
        403,
        "ACCOUNT_SUSPENDED",
        "Your account is currently suspended. Please contact Kekego support"
      );
    }

    const passwordMatch = await comparePassword(input.password, user.passwordHash);
    if (!passwordMatch) {
      throw new AppError(
        401,
        "INVALID_CREDENTIALS",
        "Invalid phone number/email or password"
      );
    }

    const partnerId =
      user.driverProfile?.partnerId ??
      user.partnerMemberships[0]?.partnerId ??
      null;

    const tokens = this.generateTokens({
      userId: user.id,
      role: user.role,
      phoneNumber: user.phoneNumber,
      passengerId: user.passengerProfile?.id,
      driverId: user.driverProfile?.id,
      partnerId,
    });

    return {
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        passengerProfile: user.passengerProfile,
        driverProfile: user.driverProfile,
        partner: user.partnerMemberships[0]?.partner,
      },
      tokens,
    };
  }

  /**
   * Refresh Token exchange
   */
  async refreshToken(token: string) {
    try {
      const decoded = this.fastify.jwt.verify<{ userId: string; tokenType: string }>(token);
      if (decoded.tokenType !== "refresh") {
        throw new Error("Invalid token type");
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          passengerProfile: true,
          driverProfile: true,
          partnerMemberships: true,
        },
      });

      if (!user || !user.isActive) {
        throw new AppError(
          401,
          "INVALID_REFRESH_TOKEN",
          "User account inactive or not found"
        );
      }

      const partnerId =
        user.driverProfile?.partnerId ??
        user.partnerMemberships[0]?.partnerId ??
        null;

      const tokens = this.generateTokens({
        userId: user.id,
        role: user.role,
        phoneNumber: user.phoneNumber,
        passengerId: user.passengerProfile?.id,
        driverId: user.driverProfile?.id,
        partnerId,
      });

      return { tokens };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(
        401,
        "INVALID_REFRESH_TOKEN",
        "Refresh token is invalid or has expired"
      );
    }
  }

  /**
   * Secure Bootstrap Admin Provisioning
   */
  async provisionAdmin(input: ProvisionAdminInput) {
    const expectedSecret = env.JWT_ACCESS_SECRET;
    if (input.bootstrapSecret !== expectedSecret) {
      throw new AppError(
        403,
        "FORBIDDEN",
        "Invalid bootstrap authorization secret"
      );
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ phoneNumber: input.phoneNumber }, { email: input.email }],
      },
    });

    if (existing) {
      throw new AppError(
        409,
        "USER_ALREADY_EXISTS",
        "An account with this phone number or email already exists"
      );
    }

    const passwordHash = await hashPassword(input.password);

    const admin = await prisma.user.create({
      data: {
        phoneNumber: input.phoneNumber,
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: UserRole.ADMIN,
        isActive: true,
      },
    });

    const tokens = this.generateTokens({
      userId: admin.id,
      role: admin.role,
      phoneNumber: admin.phoneNumber,
    });

    return {
      admin: {
        id: admin.id,
        phoneNumber: admin.phoneNumber,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
      },
      tokens,
    };
  }
}
