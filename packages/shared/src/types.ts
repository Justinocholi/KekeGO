import {
  UserRole,
  DriverVerificationStatus,
  DriverAvailabilityStatus,
  RideTier,
  RideStatus,
  PaymentStatus,
  PaymentMethod,
  VehicleType,
} from "./enums.js";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeoLocationPoint extends Coordinates {
  address?: string;
  landmark?: string;
}

export interface UserSummary {
  id: string;
  phoneNumber: string;
  email?: string | null;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface PassengerProfileSummary {
  id: string;
  userId: string;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  rating: number;
  totalRides: number;
}

export interface DriverProfileSummary {
  id: string;
  userId: string;
  verificationStatus: DriverVerificationStatus;
  availabilityStatus: DriverAvailabilityStatus;
  currentLocation?: Coordinates | null;
  rating: number;
  totalTrips: number;
  walletBalanceKobo: number; // minor unit: kobo
}

export interface VehicleSummary {
  id: string;
  driverId: string;
  type: VehicleType;
  plateNumber: string;
  color: string;
  modelYear?: string | null;
  isVerified: boolean;
}

export interface FareBreakdown {
  currency: "NGN";
  baseFareKobo: number;
  distanceChargeKobo: number;
  timeChargeKobo: number;
  cancellationFeeKobo?: number;
  discountKobo: number;
  surgeMultiplier: number;
  totalFareKobo: number; // exact integer in kobo (100 kobo = 1 Naira)
}

export interface RideEstimate {
  tier: RideTier;
  pickup: GeoLocationPoint;
  destination: GeoLocationPoint;
  estimatedDistanceMeters: number;
  estimatedDurationSeconds: number;
  fareBreakdown: FareBreakdown;
}

export interface RideSummary {
  id: string;
  passengerId: string;
  driverId?: string | null;
  tier: RideTier;
  status: RideStatus;
  pickup: GeoLocationPoint;
  destination: GeoLocationPoint;
  startOtpCode: string; // 4-digit PIN for passenger verification
  fare: FareBreakdown;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
