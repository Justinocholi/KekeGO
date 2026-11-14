import { z } from "zod";

export const mapsAutocompleteQuerySchema = z.object({
  input: z.string().min(1, "Search query is required").max(200),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().positive().max(50000).optional(),
});

export type MapsAutocompleteQueryInput = z.infer<typeof mapsAutocompleteQuerySchema>;

export const mapsPlaceDetailsQuerySchema = z.object({
  placeId: z.string().min(1, "Place ID is required"),
});

export type MapsPlaceDetailsQueryInput = z.infer<typeof mapsPlaceDetailsQuerySchema>;

export const mapsGeocodeQuerySchema = z.object({
  address: z.string().min(1, "Address is required").max(300),
});

export type MapsGeocodeQueryInput = z.infer<typeof mapsGeocodeQuerySchema>;

export const mapsReverseGeocodeQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

export type MapsReverseGeocodeQueryInput = z.infer<typeof mapsReverseGeocodeQuerySchema>;

export const mapsRouteComputeSchema = z.object({
  origin: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().optional(),
  }),
  destination: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().optional(),
  }),
  travelMode: z.enum(["TWO_WHEELER", "DRIVE"]).default("DRIVE"),
  avoidTolls: z.boolean().default(false),
});

export type MapsRouteComputeInput = z.infer<typeof mapsRouteComputeSchema>;

export interface PlacePrediction {
  placeId: string;
  primaryText: string;
  secondaryText: string;
  fullText: string;
  latitude?: number;
  longitude?: number;
}

export interface ComputedRouteResult {
  distanceMeters: number;
  durationSeconds: number;
  polyline: string;
  source: "google_routes_api" | "fallback_haversine";
  legs?: Array<{
    distanceMeters: number;
    durationSeconds: number;
    startLocation: { latitude: number; longitude: number };
    endLocation: { latitude: number; longitude: number };
  }>;
}
