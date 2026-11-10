import type {
  RegisterDriverInput,
  UpdateRideStatusInput,
} from "@kekego/validation";
import {
  RideTier,
  DriverVerificationStatus,
  DriverAvailabilityStatus,
} from "@kekego/shared";

const API_BASE_URL = "http://localhost:4000";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  meta?: unknown;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface DriverUser {
  id: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  role: string;
  driverProfile?: {
    id: string;
    licenseNumber: string;
    verificationStatus: DriverVerificationStatus;
    availabilityStatus: DriverAvailabilityStatus;
    isOnline: boolean;
    rating: number;
    totalTrips: number;
    acceptanceRate?: number;
    vehicles?: Array<{
      id: string;
      plateNumber: string;
      make: string;
      model: string;
      color: string;
    }>;
  } | null;
  wallet?: {
    id: string;
    balanceKobo: number;
    currency: string;
  } | null;
}

export interface DispatchItem {
  id: string;
  rideNumber: string;
  tier: RideTier;
  pickupAddress: string;
  destinationAddress: string;
  estimatedDistanceMeters: number;
  estimatedDurationSeconds: number;
  estimatedFareKobo: number;
  estimatedEarningsKobo: number;
  paymentMethod: string;
  passengerRating: number;
  passengerTotalRides: number;
  requestedAt: string;
}

export interface DriverActiveRide {
  id: string;
  rideNumber: string;
  status: string;
  tier: RideTier;
  startOtp: string;
  pickup: {
    latitude: number;
    longitude: number;
    address: string;
  };
  destination: {
    latitude: number;
    longitude: number;
    address: string;
  };
  estimatedDistanceMeters: number;
  estimatedDurationSeconds: number;
  estimatedFareKobo: number;
  paymentMethod: string;
  passenger: {
    name: string;
    phoneNumber: string;
    rating: number;
  };
  vehicle?: {
    plateNumber: string;
    make: string;
    model: string;
    color: string;
  } | null;
  requestedAt: string;
  startedAt?: string | null;
}

export interface DriverEarningsSummary {
  today: {
    completedTrips: number;
    grossEarningsKobo: number;
    commissionKobo: number;
    netEarningsKobo: number;
  };
  metrics: {
    acceptanceRatePercent: number;
    rating: number;
    totalTripsLifetime: number;
  };
  wallet: {
    balanceKobo: number;
    currency: string;
  };
  verificationStatus: DriverVerificationStatus;
  availabilityStatus: DriverAvailabilityStatus;
  isOnline: boolean;
}

export interface DriverHistoryItem {
  id: string;
  rideNumber: string;
  tier: RideTier;
  status: string;
  pickupAddress: string;
  destinationAddress: string;
  fareKobo: number;
  commissionKobo: number;
  netEarningsKobo: number;
  paymentMethod: string;
  rating?: { score: number; comment?: string | null } | null;
  requestedAt: string;
  completedAt?: string | null;
}

let authToken: string | null = null;

export const setDriverAuthToken = (token: string | null) => {
  authToken = token;
};

export const getDriverAuthToken = () => authToken;

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const json: ApiResponse<T> = await response.json();

  if (!response.ok || !json.success) {
    const errorMsg = json.error?.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    (err as unknown as { code?: string; details?: unknown }).code = json.error?.code;
    (err as unknown as { code?: string; details?: unknown }).details = json.error?.details;
    throw err;
  }

  return json.data as T;
}

export const driverApi = {
  // Auth & Onboarding
  async login(phoneNumber: string, password: string) {
    const data = await request<{
      user: DriverUser;
      tokens: { accessToken: string; expiresIn: number };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier: phoneNumber, password }),
    });
    setDriverAuthToken(data.tokens.accessToken);
    return data;
  },

  async register(input: RegisterDriverInput) {
    const data = await request<{
      user: DriverUser;
      tokens: { accessToken: string; expiresIn: number };
    }>("/auth/register/driver", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setDriverAuthToken(data.tokens.accessToken);
    return data;
  },

  async getMe() {
    return request<DriverUser>("/users/me");
  },

  // Availability
  async setAvailability(status: DriverAvailabilityStatus) {
    return request<{
      driverId: string;
      availabilityStatus: DriverAvailabilityStatus;
      isOnline: boolean;
    }>("/users/driver/availability", {
      method: "PATCH",
      body: JSON.stringify({ availabilityStatus: status }),
    });
  },

  // Dispatches & Rides
  async getDispatches() {
    return request<DispatchItem[]>("/rides/driver/dispatches");
  },

  async acceptRide(rideId: string) {
    return request<DriverActiveRide>(`/rides/${rideId}/accept`, {
      method: "POST",
    });
  },

  async updateRideStatus(rideId: string, input: UpdateRideStatusInput) {
    return request<{
      id: string;
      rideNumber: string;
      status: string;
      startedAt?: string;
      completedAt?: string;
    }>(`/rides/${rideId}/status`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  async getActiveRide() {
    return request<DriverActiveRide | null>("/rides/driver/active");
  },

  async getHistory(page = 1, limit = 20) {
    return request<DriverHistoryItem[]>(`/rides/driver/history?page=${page}&limit=${limit}`);
  },

  async getEarningsSummary() {
    return request<DriverEarningsSummary>("/rides/driver/earnings");
  },
};
