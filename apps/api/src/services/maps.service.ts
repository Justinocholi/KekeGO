import { env } from "../config/env.js";
import type {
  MapsAutocompleteQueryInput,
  MapsPlaceDetailsQueryInput,
  MapsGeocodeQueryInput,
  MapsReverseGeocodeQueryInput,
  MapsRouteComputeInput,
  PlacePrediction,
  ComputedRouteResult,
} from "@kekego/validation";
import { calculateDistanceMeters } from "./ride.service.js";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export interface GazettedLandmark {
  id: string;
  name: string;
  secondary: string;
  latitude: number;
  longitude: number;
  city: "Lafia" | "Keffi" | "Karu" | "Akwanga" | "Doma";
}

/**
 * Authoritative Nasarawa State Commercial Corridors Gazetteer
 */
export const NASARAWA_GAZETTEER: GazettedLandmark[] = [
  // Lafia Urban Corridor
  {
    id: "gaz-laf-01",
    name: "Lafia Modern Market",
    secondary: "Makurdi-Jos Road, Lafia Central, Nasarawa",
    latitude: 8.4932,
    longitude: 8.5158,
    city: "Lafia",
  },
  {
    id: "gaz-laf-02",
    name: "Federal University of Lafia (Permanent Site)",
    secondary: "Doma Road, Lafia, Nasarawa",
    latitude: 8.5305,
    longitude: 8.528,
    city: "Lafia",
  },
  {
    id: "gaz-laf-03",
    name: "Isa Mustapha Agwai I Polytechnic",
    secondary: "Jos Road, Lafia, Nasarawa",
    latitude: 8.5085,
    longitude: 8.522,
    city: "Lafia",
  },
  {
    id: "gaz-laf-04",
    name: "Dalhatu Araf Specialist Hospital (DASH)",
    secondary: "Hospital Road, Lafia Central, Nasarawa",
    latitude: 8.498,
    longitude: 8.518,
    city: "Lafia",
  },
  {
    id: "gaz-laf-05",
    name: "Government House Lafia",
    secondary: "Shendam Road, Lafia, Nasarawa",
    latitude: 8.4875,
    longitude: 8.5142,
    city: "Lafia",
  },
  // Keffi Commercial Zone
  {
    id: "gaz-kef-01",
    name: "Nasarawa State University Keffi (NSUK)",
    secondary: "Abuja-Keffi Expressway, Keffi, Nasarawa",
    latitude: 8.832,
    longitude: 7.881,
    city: "Keffi",
  },
  {
    id: "gaz-kef-02",
    name: "Keffi Total Roundabout",
    secondary: "Central Commercial Roundabout, Keffi, Nasarawa",
    latitude: 8.8475,
    longitude: 7.8732,
    city: "Keffi",
  },
  {
    id: "gaz-kef-03",
    name: "Federal Medical Centre (FMC) Keffi",
    secondary: "Old Akwanga Road, Keffi, Nasarawa",
    latitude: 8.855,
    longitude: 7.865,
    city: "Keffi",
  },
  // Karu / Mararaba Metropolitan Corridor
  {
    id: "gaz-kar-01",
    name: "Mararaba Orange Market",
    secondary: "Abuja-Keffi Expressway, Mararaba, Karu, Nasarawa",
    latitude: 9.0285,
    longitude: 7.6012,
    city: "Karu",
  },
  {
    id: "gaz-kar-02",
    name: "Karu International Market",
    secondary: "Karu Urban Center, Nasarawa",
    latitude: 9.0142,
    longitude: 7.5891,
    city: "Karu",
  },
  {
    id: "gaz-kar-03",
    name: "Nyanya-Mararaba Bridge Park",
    secondary: "Boundary Corridor, Karu, Nasarawa",
    latitude: 9.0321,
    longitude: 7.5945,
    city: "Karu",
  },
  // Akwanga Transit Hub
  {
    id: "gaz-akw-01",
    name: "Akwanga Central Roundabout",
    secondary: "Jos-Keffi Junction, Akwanga, Nasarawa",
    latitude: 8.907,
    longitude: 8.406,
    city: "Akwanga",
  },
  {
    id: "gaz-akw-02",
    name: "College of Education Akwanga",
    secondary: "Keffi Road, Akwanga, Nasarawa",
    latitude: 8.915,
    longitude: 8.412,
    city: "Akwanga",
  },
  // Doma Agricultural Hub
  {
    id: "gaz-dom-01",
    name: "Doma Central Market",
    secondary: "Main Market Road, Doma, Nasarawa",
    latitude: 8.391,
    longitude: 8.354,
    city: "Doma",
  },
];

export class GoogleMapsService {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly defaultTtlMs = 1000 * 60 * 30; // 30 minutes cache

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  private setCached<T>(key: string, data: T, ttlMs = this.defaultTtlMs): void {
    this.cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  private isKeyConfigured(): boolean {
    const key = env.GOOGLE_MAPS_API_KEY;
    return Boolean(
      key &&
      key.trim() !== "" &&
      !key.includes("placeholder") &&
      key !== "YOUR_API_KEY"
    );
  }

  /**
   * Search address autocomplete with Places API (New / Legacy Autocomplete)
   */
  async autocomplete(
    query: MapsAutocompleteQueryInput
  ): Promise<{ predictions: PlacePrediction[]; source: string }> {
    const normalized = query.input.trim().toLowerCase();
    const cacheKey = `ac_${normalized}_${query.latitude ?? ""}_${query.longitude ?? ""}`;
    const cached = this.getCached<{ predictions: PlacePrediction[]; source: string }>(cacheKey);
    if (cached) return cached;

    if (this.isKeyConfigured()) {
      try {
        const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
        url.searchParams.set("input", query.input);
        url.searchParams.set("key", env.GOOGLE_MAPS_API_KEY);
        url.searchParams.set("components", "country:ng");

        if (query.latitude && query.longitude) {
          url.searchParams.set("location", `${query.latitude},${query.longitude}`);
          url.searchParams.set("radius", String(query.radius || 30000));
        } else {
          // Default bias towards Lafia / Nasarawa State (approx 8.5N, 8.5E)
          url.searchParams.set("location", "8.5000,8.5000");
          url.searchParams.set("radius", "50000");
        }

        const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const json = (await res.json()) as {
            status: string;
            predictions?: Array<{
              place_id: string;
              description: string;
              structured_formatting?: {
                main_text: string;
                secondary_text?: string;
              };
            }>;
          };

          if (json.status === "OK" && Array.isArray(json.predictions) && json.predictions.length > 0) {
            const predictions: PlacePrediction[] = json.predictions.map((p) => ({
              placeId: p.place_id,
              primaryText: p.structured_formatting?.main_text || p.description,
              secondaryText: p.structured_formatting?.secondary_text || "Nasarawa, Nigeria",
              fullText: p.description,
            }));

            const result = { predictions, source: "google_places_api" };
            this.setCached(cacheKey, result);
            return result;
          }
        }
      } catch (err) {
        // Fallback to gazetteer on network or API failures
      }
    }

    // Resilient Fallback to Nasarawa Gazetteer
    const searchTerms = normalized.split(/\s+/).filter(Boolean);
    const matches = NASARAWA_GAZETTEER.filter((item) => {
      const full = `${item.name} ${item.secondary} ${item.city}`.toLowerCase();
      return searchTerms.some((t) => full.includes(t));
    });

    const predictions: PlacePrediction[] = matches.map((m) => ({
      placeId: m.id,
      primaryText: m.name,
      secondaryText: m.secondary,
      fullText: `${m.name}, ${m.secondary}`,
      latitude: m.latitude,
      longitude: m.longitude,
    }));

    const result = { predictions, source: "nasarawa_gazetteer_fallback" };
    this.setCached(cacheKey, result);
    return result;
  }

  /**
   * Fetch Place Details & Coordinates
   */
  async getPlaceDetails(input: MapsPlaceDetailsQueryInput): Promise<{
    placeId: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    source: string;
  }> {
    const cacheKey = `pd_${input.placeId}`;
    const cached = this.getCached<{
      placeId: string;
      name: string;
      address: string;
      latitude: number;
      longitude: number;
      source: string;
    }>(cacheKey);
    if (cached) return cached;

    // Check gazetteer first if it matches gazetteer ID
    const gazetteerMatch = NASARAWA_GAZETTEER.find((g) => g.id === input.placeId);
    if (gazetteerMatch) {
      const result = {
        placeId: gazetteerMatch.id,
        name: gazetteerMatch.name,
        address: gazetteerMatch.secondary,
        latitude: gazetteerMatch.latitude,
        longitude: gazetteerMatch.longitude,
        source: "nasarawa_gazetteer",
      };
      this.setCached(cacheKey, result);
      return result;
    }

    if (this.isKeyConfigured()) {
      try {
        const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
        url.searchParams.set("place_id", input.placeId);
        url.searchParams.set("fields", "place_id,name,formatted_address,geometry");
        url.searchParams.set("key", env.GOOGLE_MAPS_API_KEY);

        const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const json = (await res.json()) as {
            status: string;
            result?: {
              place_id: string;
              name: string;
              formatted_address: string;
              geometry?: { location: { lat: number; lng: number } };
            };
          };

          if (json.status === "OK" && json.result?.geometry?.location) {
            const result = {
              placeId: json.result.place_id,
              name: json.result.name,
              address: json.result.formatted_address,
              latitude: json.result.geometry.location.lat,
              longitude: json.result.geometry.location.lng,
              source: "google_place_details",
            };
            this.setCached(cacheKey, result);
            return result;
          }
        }
      } catch {
        // Fallback below
      }
    }

    // Default to center of Lafia if unresolvable
    return {
      placeId: input.placeId,
      name: "Lafia Central",
      address: "Lafia, Nasarawa State, Nigeria",
      latitude: 8.498,
      longitude: 8.518,
      source: "fallback_default",
    };
  }

  /**
   * Geocode Address to Coordinates
   */
  async geocode(input: MapsGeocodeQueryInput): Promise<{
    address: string;
    latitude: number;
    longitude: number;
    source: string;
  }> {
    const cacheKey = `geo_${input.address.trim().toLowerCase()}`;
    const cached = this.getCached<{
      address: string;
      latitude: number;
      longitude: number;
      source: string;
    }>(cacheKey);
    if (cached) return cached;

    if (this.isKeyConfigured()) {
      try {
        const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
        url.searchParams.set("address", `${input.address}, Nigeria`);
        url.searchParams.set("key", env.GOOGLE_MAPS_API_KEY);

        const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const json = (await res.json()) as {
            status: string;
            results?: Array<{
              formatted_address: string;
              geometry: { location: { lat: number; lng: number } };
            }>;
          };

          if (json.status === "OK" && json.results?.[0]?.geometry?.location) {
            const top = json.results[0];
            const result = {
              address: top.formatted_address,
              latitude: top.geometry.location.lat,
              longitude: top.geometry.location.lng,
              source: "google_geocode",
            };
            this.setCached(cacheKey, result);
            return result;
          }
        }
      } catch {
        // Fallback
      }
    }

    // Fallback: search gazetteer
    const normalized = input.address.toLowerCase();
    const match = NASARAWA_GAZETTEER.find(
      (g) => normalized.includes(g.name.toLowerCase()) || normalized.includes(g.city.toLowerCase())
    ) || NASARAWA_GAZETTEER[0]!;

    const result = {
      address: `${match.name}, ${match.secondary}`,
      latitude: match.latitude,
      longitude: match.longitude,
      source: "nasarawa_gazetteer_fallback",
    };
    this.setCached(cacheKey, result);
    return result;
  }

  /**
   * Reverse Geocode Coordinates to Address
   */
  async reverseGeocode(input: MapsReverseGeocodeQueryInput): Promise<{
    address: string;
    primaryText: string;
    secondaryText: string;
    source: string;
  }> {
    const cacheKey = `rgeo_${input.latitude.toFixed(4)}_${input.longitude.toFixed(4)}`;
    const cached = this.getCached<{
      address: string;
      primaryText: string;
      secondaryText: string;
      source: string;
    }>(cacheKey);
    if (cached) return cached;

    if (this.isKeyConfigured()) {
      try {
        const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
        url.searchParams.set("latlng", `${input.latitude},${input.longitude}`);
        url.searchParams.set("key", env.GOOGLE_MAPS_API_KEY);

        const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const json = (await res.json()) as {
            status: string;
            results?: Array<{
              formatted_address: string;
              address_components?: Array<{ long_name: string; types: string[] }>;
            }>;
          };

          if (json.status === "OK" && json.results?.[0]) {
            const first = json.results[0];
            const parts = first.formatted_address.split(",");
            const primaryText = parts[0]?.trim() || "Current Location";
            const secondaryText = parts.slice(1).join(",").trim() || "Nasarawa, Nigeria";

            const result = {
              address: first.formatted_address,
              primaryText,
              secondaryText,
              source: "google_reverse_geocode",
            };
            this.setCached(cacheKey, result);
            return result;
          }
        }
      } catch {
        // Fallback
      }
    }

    // Fallback: find closest landmark in Nasarawa Gazetteer
    let closest = NASARAWA_GAZETTEER[0]!;
    let minDist = Infinity;

    for (const g of NASARAWA_GAZETTEER) {
      const d = calculateDistanceMeters(input.latitude, input.longitude, g.latitude, g.longitude);
      if (d < minDist) {
        minDist = d;
        closest = g;
      }
    }

    const primaryText = minDist < 3000 ? `Near ${closest.name}` : `Nasarawa Commercial Zone (${closest.city})`;
    const secondaryText = closest.secondary;

    const result = {
      address: `${primaryText}, ${secondaryText}`,
      primaryText,
      secondaryText,
      source: "nasarawa_gazetteer_proximity",
    };
    this.setCached(cacheKey, result);
    return result;
  }

  /**
   * Compute Turn-by-Turn Route and Distance via Google Routes API v2
   */
  async computeRoute(input: MapsRouteComputeInput): Promise<ComputedRouteResult> {
    const cacheKey = `route_${input.origin.latitude.toFixed(4)}_${input.origin.longitude.toFixed(
      4
    )}_${input.destination.latitude.toFixed(4)}_${input.destination.longitude.toFixed(4)}_${input.travelMode}`;
    const cached = this.getCached<ComputedRouteResult>(cacheKey);
    if (cached) return cached;

    if (this.isKeyConfigured()) {
      try {
        const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": env.GOOGLE_MAPS_API_KEY,
            "X-Goog-FieldMask":
              "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs",
          },
          body: JSON.stringify({
            origin: {
              location: {
                latLng: {
                  latitude: input.origin.latitude,
                  longitude: input.origin.longitude,
                },
              },
            },
            destination: {
              location: {
                latLng: {
                  latitude: input.destination.latitude,
                  longitude: input.destination.longitude,
                },
              },
            },
            travelMode: input.travelMode === "TWO_WHEELER" ? "TWO_WHEELER" : "DRIVE",
            routingPreference: "TRAFFIC_AWARE",
            computeAlternativeRoutes: false,
            routeModifiers: {
              avoidTolls: input.avoidTolls,
            },
          }),
          signal: AbortSignal.timeout(6000),
        });

        if (res.ok) {
          const json = (await res.json()) as {
            routes?: Array<{
              distanceMeters?: number;
              duration?: string; // e.g. "820s"
              polyline?: { encodedPolyline?: string };
              legs?: Array<{
                distanceMeters?: number;
                duration?: string;
                startLocation?: { latLng: { latitude: number; longitude: number } };
                endLocation?: { latLng: { latitude: number; longitude: number } };
              }>;
            }>;
          };

          const route = json.routes?.[0];
          if (route && route.distanceMeters !== undefined) {
            const rawDuration = route.duration ? parseInt(route.duration.replace("s", ""), 10) : 600;
            const result: ComputedRouteResult = {
              distanceMeters: route.distanceMeters,
              durationSeconds: isNaN(rawDuration) ? 600 : rawDuration,
              polyline: route.polyline?.encodedPolyline || "",
              source: "google_routes_api",
              legs: route.legs?.map((leg) => ({
                distanceMeters: leg.distanceMeters || 0,
                durationSeconds: leg.duration ? parseInt(leg.duration.replace("s", ""), 10) : 0,
                startLocation: {
                  latitude: leg.startLocation?.latLng.latitude || input.origin.latitude,
                  longitude: leg.startLocation?.latLng.longitude || input.origin.longitude,
                },
                endLocation: {
                  latitude: leg.endLocation?.latLng.latitude || input.destination.latitude,
                  longitude: leg.endLocation?.latLng.longitude || input.destination.longitude,
                },
              })),
            };
            this.setCached(cacheKey, result);
            return result;
          }
        }
      } catch {
        // Fallback below
      }
    }

    // Resilient Fallback: Haversine distance with urban tricycle speed estimate (25 km/h)
    const distanceMeters = calculateDistanceMeters(
      input.origin.latitude,
      input.origin.longitude,
      input.destination.latitude,
      input.destination.longitude
    );
    const distanceKm = distanceMeters / 1000;
    const durationMinutes = Math.max(2, Math.round((distanceKm / 25) * 60));
    const durationSeconds = durationMinutes * 60;

    const result: ComputedRouteResult = {
      distanceMeters,
      durationSeconds,
      polyline: "", // Encoded polyline blank on offline fallback
      source: "fallback_haversine",
    };
    this.setCached(cacheKey, result);
    return result;
  }
}

export const googleMapsService = new GoogleMapsService();
