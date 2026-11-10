export interface LandmarkLocation {
  id: string;
  name: string;
  category: "market" | "campus" | "hospital" | "transport" | "commercial";
  city: "Lafia" | "Keffi" | "Karu";
  latitude: number;
  longitude: number;
  address: string;
}

export const NASARAWA_LANDMARKS: LandmarkLocation[] = [
  // Lafia Urban Operational Zone
  {
    id: "lafia-market",
    name: "Lafia Modern Market",
    category: "market",
    city: "Lafia",
    latitude: 8.4932,
    longitude: 8.5158,
    address: "Makurdi-Jos Road, Lafia Central, Nasarawa",
  },
  {
    id: "unilafia-perm",
    name: "Federal University of Lafia (Permanent Site)",
    category: "campus",
    city: "Lafia",
    latitude: 8.5305,
    longitude: 8.528,
    address: "Doma Road, Lafia, Nasarawa",
  },
  {
    id: "polytechnic-lafia",
    name: "Isa Mustapha Agwai I Polytechnic",
    category: "campus",
    city: "Lafia",
    latitude: 8.5085,
    longitude: 8.522,
    address: "Jos Road, Lafia, Nasarawa",
  },
  {
    id: "taal-school",
    name: "Ta'al Model School",
    category: "campus",
    city: "Lafia",
    latitude: 8.482,
    longitude: 8.511,
    address: "Shendam Road, Lafia, Nasarawa",
  },
  {
    id: "dalhatu-hospital",
    name: "Dalhatu Araf Specialist Hospital (DASH)",
    category: "hospital",
    city: "Lafia",
    latitude: 8.498,
    longitude: 8.518,
    address: "Hospital Road, Lafia, Nasarawa",
  },
  // Keffi Operational Zone
  {
    id: "nsuk-main",
    name: "Nasarawa State University Keffi (NSUK)",
    category: "campus",
    city: "Keffi",
    latitude: 8.832,
    longitude: 7.881,
    address: "Abuja-Keffi Expressway, Keffi, Nasarawa",
  },
  {
    id: "keffi-roundabout",
    name: "Keffi Total Roundabout",
    category: "transport",
    city: "Keffi",
    latitude: 8.8475,
    longitude: 7.8732,
    address: "Central Roundabout, Keffi, Nasarawa",
  },
  {
    id: "fmc-keffi",
    name: "Federal Medical Centre (FMC) Keffi",
    category: "hospital",
    city: "Keffi",
    latitude: 8.855,
    longitude: 7.865,
    address: "Old Akwanga Road, Keffi, Nasarawa",
  },
  // Karu / Mararaba Corridor
  {
    id: "mararaba-orange",
    name: "Mararaba Orange Market",
    category: "market",
    city: "Karu",
    latitude: 9.0285,
    longitude: 7.6012,
    address: "Abuja-Keffi Road, Mararaba, Karu, Nasarawa",
  },
  {
    id: "karu-intl-market",
    name: "Karu International Market",
    category: "market",
    city: "Karu",
    latitude: 9.0142,
    longitude: 7.5891,
    address: "Karu Urban Area, Nasarawa",
  },
];

export interface ServiceAreaValidation {
  isSupported: boolean;
  zoneName: string;
  message: string;
}

/**
 * Validates whether coordinates lie within supported Nasarawa commercial operating zones
 */
export function validateServiceArea(latitude: number, longitude: number): ServiceAreaValidation {
  // Lafia Urban Zone: ~8.45 - 8.56 N, 8.48 - 8.56 E
  const inLafia = latitude >= 8.45 && latitude <= 8.56 && longitude >= 8.48 && longitude <= 8.56;
  if (inLafia) {
    return {
      isSupported: true,
      zoneName: "Lafia Urban Zone",
      message: "Within active service zone. Commercial tricycles available nearby.",
    };
  }

  // Keffi University Corridor: ~8.80 - 8.88 N, 7.83 - 7.91 E
  const inKeffi = latitude >= 8.80 && latitude <= 8.88 && longitude >= 7.83 && longitude <= 7.91;
  if (inKeffi) {
    return {
      isSupported: true,
      zoneName: "Keffi Commercial Zone",
      message: "Within active service zone. Commercial tricycles available nearby.",
    };
  }

  // Karu / Mararaba Axis: ~8.98 - 9.05 N, 7.55 - 7.63 E
  const inKaru = latitude >= 8.98 && latitude <= 9.05 && longitude >= 7.55 && longitude <= 7.63;
  if (inKaru) {
    return {
      isSupported: true,
      zoneName: "Karu-Mararaba Axis",
      message: "Within active service zone. Commercial tricycles available nearby.",
    };
  }

  return {
    isSupported: false,
    zoneName: "Outside Coverage",
    message: "This location is currently outside Kekego's active operational zones in Nasarawa State.",
  };
}

export interface NearbyKekeMarker {
  id: string;
  callSign: string;
  latitude: number;
  longitude: number;
  headingDegrees: number;
  status: "ONLINE" | "BUSY";
}

/**
 * Returns nearby real-time simulated tricycles around the user's location
 */
export function getNearbyTricycles(centerLat: number, centerLon: number): NearbyKekeMarker[] {
  return [
    {
      id: "keke-1",
      callSign: "KEKE-402",
      latitude: centerLat + 0.0032,
      longitude: centerLon - 0.0028,
      headingDegrees: 45,
      status: "ONLINE",
    },
    {
      id: "keke-2",
      callSign: "KEKE-118",
      latitude: centerLat - 0.0041,
      longitude: centerLon + 0.0035,
      headingDegrees: 120,
      status: "ONLINE",
    },
    {
      id: "keke-3",
      callSign: "KEKE-891",
      latitude: centerLat + 0.0019,
      longitude: centerLon + 0.0052,
      headingDegrees: 280,
      status: "ONLINE",
    },
    {
      id: "keke-4",
      callSign: "KEKE-235",
      latitude: centerLat - 0.0025,
      longitude: centerLon - 0.0044,
      headingDegrees: 190,
      status: "ONLINE",
    },
  ];
}
