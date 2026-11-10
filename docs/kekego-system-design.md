# KEKEGO — System Design & Technical Specification

**Product:** Kekego  
**Category:** Ride-hailing and mobility platform  
**Initial launch territory:** Nasarawa State, Nigeria  
**Document type:** Consolidated MVP system design  
**Status:** Working specification

## 1. Project overview
Kekego connects passengers with drivers, supports ride requests and dispatch, tracks trips in real time, calculates fares, processes payments, and provides an administrative control panel.

Initial launch territory: Nasarawa State, Nigeria.

The system is designed for future expansion to other states and supports external fleet partners without requiring a major architectural rewrite.

The platform consists of:
1. Passenger mobile application.
2. Driver mobile application.
3. Admin web dashboard.
4. Backend API and real-time services.

## 2. Technical Stack Baseline
- Admin dashboard: Next.js + Tailwind CSS
- Passenger app: React Native + Expo
- Driver app: React Native + Expo
- Language: TypeScript (strict mode)
- Backend: Node.js (Fastify modular monolith)
- API: REST
- Database: PostgreSQL + PostGIS
- ORM: Prisma
- Real-time: Socket.IO
- Cache / Ephemeral State: Redis
- Payment Provider: Paystack
- Maps: Google Maps / Mapbox

## 3. Brand Identity & Visual System
- Primary Brand Color: Tricycle Amber/Yellow (`#F59E0B`, hover `#D97706`, active `#B45309`)
- Secondary / Trust Accent: Deep Transit Emerald (`#0F766E`, hover `#115E59`)
- Dark Neutrals: Background Canvas `#090D16`, Elevated `#131B2E`, High-contrast `#0F172A`
- Light Neutrals: Background `#F8FAFC`, Border `#E2E8F0`, Muted Text `#64748B`
- Status Semantics: Active/Success `#10B981`, Warning/Surge `#F97316`, Error/SOS `#EF4444`, Info `#0284C7`
