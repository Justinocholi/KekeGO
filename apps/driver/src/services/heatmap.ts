export interface DemandHotspot {
  id: string;
  name: string;
  city: "Lafia" | "Keffi" | "Karu";
  demandLevel: "SURGE_HIGH" | "BUSY" | "NORMAL";
  surgeMultiplier: number;
  latitude: number;
  longitude: number;
  activeRidersWaiting: number;
}

export const NASARAWA_DEMAND_HOTSPOTS: DemandHotspot[] = [
  {
    id: "lafia-market-hub",
    name: "Lafia Modern Market (Makurdi-Jos Rd)",
    city: "Lafia",
    demandLevel: "SURGE_HIGH",
    surgeMultiplier: 1.4,
    latitude: 8.4932,
    longitude: 8.5158,
    activeRidersWaiting: 18,
  },
  {
    id: "unilafia-junction",
    name: "Federal University of Lafia (Permanent Site)",
    city: "Lafia",
    demandLevel: "BUSY",
    surgeMultiplier: 1.2,
    latitude: 8.5305,
    longitude: 8.528,
    activeRidersWaiting: 11,
  },
  {
    id: "mararaba-market-hub",
    name: "Mararaba Orange Market Hub",
    city: "Karu",
    demandLevel: "SURGE_HIGH",
    surgeMultiplier: 1.5,
    latitude: 9.0285,
    longitude: 7.6012,
    activeRidersWaiting: 24,
  },
  {
    id: "nsuk-roundabout",
    name: "NSUK Keffi Total Roundabout",
    city: "Keffi",
    demandLevel: "BUSY",
    surgeMultiplier: 1.25,
    latitude: 8.8475,
    longitude: 7.8732,
    activeRidersWaiting: 14,
  },
];
