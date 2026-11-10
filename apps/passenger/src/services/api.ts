import type {
  CreateRideRequest,
  RideEstimateRequest,
  CreateRatingInput,
} from "@kekego/validation";
import { RideTier, PaymentMethod } from "@kekego/shared";

// Default to localhost API server. Can be overridden if needed.
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

export interface UserProfile {
  id: string;
  phoneNumber: string;
  role: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  passengerProfile?: {
    id: string;
    rating: number;
    totalRides: number;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
  } | null;
  wallet?: {
    id: string;
    balanceKobo: number;
    currency: string;
  } | null;
}

export interface RideEstimateItem {
  tier: RideTier;
  estimatedDistanceMeters: number;
  estimatedDurationSeconds: number;
  estimatedDurationMinutes: number;
  fareBreakdown: {
    currency: "NGN";
    baseFareKobo: number;
    distanceChargeKobo: number;
    timeChargeKobo: number;
    minimumFareKobo: number;
    discountKobo: number;
    surgeMultiplier: number;
    totalFareKobo: number;
  };
}

export interface ActiveRide {
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
  finalFareKobo?: number | null;
  paymentMethod: PaymentMethod;
  paymentStatus?: string;
  driver?: {
    name: string;
    phoneNumber: string;
    rating: number;
    totalTrips: number;
    vehicle?: {
      plateNumber: string;
      make: string;
      model: string;
      color: string;
    } | null;
  } | null;
  rating?: {
    score: number;
    comment?: string | null;
    tags?: string[];
  } | null;
  requestedAt: string;
  completedAt?: string | null;
}

export interface RideHistoryItem {
  id: string;
  rideNumber: string;
  tier: RideTier;
  status: string;
  pickupAddress: string;
  destinationAddress: string;
  fareKobo: number;
  paymentMethod: PaymentMethod;
  driverName?: string | null;
  vehiclePlate?: string | null;
  vehicleColor?: string | null;
  rating?: { score: number; comment?: string | null } | null;
  requestedAt: string;
  completedAt?: string | null;
}

let authToken: string | null = null;

export const setApiAuthToken = (token: string | null) => {
  authToken = token;
};

export const getApiAuthToken = () => authToken;

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

export const api = {
  // Auth
  async login(phoneNumber: string, password: string) {
    const data = await request<{
      user: UserProfile;
      tokens: { accessToken: string; expiresIn: number };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ phoneNumber, password }),
    });
    setApiAuthToken(data.tokens.accessToken);
    return data;
  },

  async register(
    phoneNumber: string,
    password: string,
    firstName: string,
    lastName: string
  ) {
    const data = await request<{
      user: UserProfile;
      tokens: { accessToken: string; expiresIn: number };
    }>("/auth/register/passenger", {
      method: "POST",
      body: JSON.stringify({ phoneNumber, password, firstName, lastName }),
    });
    setApiAuthToken(data.tokens.accessToken);
    return data;
  },

  async getMe() {
    return request<UserProfile>("/users/me");
  },

  // Rides
  async estimateFare(input: RideEstimateRequest) {
    return request<{
      pickup: { latitude: number; longitude: number };
      destination: { latitude: number; longitude: number };
      estimates: RideEstimateItem[];
    }>("/rides/estimate", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async createRide(input: CreateRideRequest) {
    return request<ActiveRide>("/rides", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async getRide(rideId: string) {
    return request<ActiveRide>(`/rides/${rideId}`);
  },

  async cancelRide(rideId: string, reason?: string) {
    return request<{ id: string; status: string; cancelledAt: string }>(
      `/rides/${rideId}/cancel`,
      {
        method: "POST",
        body: JSON.stringify({ reason }),
      }
    );
  },

  async rateRide(rideId: string, input: CreateRatingInput) {
    return request<{
      ratingId: string;
      score: number;
      comment?: string;
      tags: string[];
    }>(`/rides/${rideId}/rating`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async getRideHistory(page = 1, limit = 20) {
    return request<RideHistoryItem[]>(`/rides/history?page=${page}&limit=${limit}`);
  },
};
