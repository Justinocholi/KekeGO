import { PrismaClient, UserRole, DriverVerificationStatus, DriverAvailabilityStatus, RideTier, VehicleType } from "@prisma/client";

const prisma = new PrismaClient();

// Deterministic mock password hash (e.g. bcrypt hash of "Kekego@2026")
const DEFAULT_PASSWORD_HASH = "$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdPoG2tqKuIQ6CE.";

// Nasarawa State core metropolitan boundary polygon (covering Lafia, Keffi, Karu, Akwanga)
const NASARAWA_SERVICE_AREA_GEOJSON = {
  type: "Polygon",
  coordinates: [
    [
      [7.5000, 8.3000],
      [8.0000, 8.3000],
      [8.7000, 8.5000],
      [8.9000, 9.0000],
      [8.2000, 9.2000],
      [7.5000, 9.1000],
      [7.5000, 8.3000],
    ],
  ],
};

async function seed(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log("🌱 Starting Kekego database seed...");

  // 1. Super Admin User
  const admin = await prisma.user.upsert({
    where: { phoneNumber: "+2348011111111" },
    update: {},
    create: {
      phoneNumber: "+2348011111111",
      email: "admin@kekego.ng",
      passwordHash: DEFAULT_PASSWORD_HASH,
      firstName: "Super",
      lastName: "Admin",
      role: UserRole.ADMIN,
      isActive: true,
    },
  });
  // eslint-disable-next-line no-console
  console.log(`👤 Admin created: ${admin.email}`);

  // 2. Service Area (Nasarawa State Launch Zone)
  const serviceArea = await prisma.serviceArea.upsert({
    where: { id: "a0000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "a0000000-0000-0000-0000-000000000001",
      name: "Nasarawa State Launch Zone",
      state: "Nasarawa",
      country: "Nigeria",
      isActive: true,
      boundaryGeoJson: NASARAWA_SERVICE_AREA_GEOJSON,
    },
  });
  // eslint-disable-next-line no-console
  console.log(`🗺️ Service area created: ${serviceArea.name}`);

  // 3. Fare Rules
  const standardFare = await prisma.fareRule.upsert({
    where: { id: "f0000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "f0000000-0000-0000-0000-000000000001",
      serviceAreaId: serviceArea.id,
      tier: RideTier.STANDARD,
      baseFareKobo: 20000,         // 200 NGN
      distanceFarePerKmKobo: 7000, // 70 NGN / km
      timeFarePerMinKobo: 1500,    // 15 NGN / min
      minimumFareKobo: 25000,      // 250 NGN min
      cancellationFeeKobo: 10000,  // 100 NGN
      platformCommissionPercent: 15.00,
      partnerCommissionPercent: 5.00,
      surgeMultiplier: 1.00,
      isActive: true,
      version: 1,
    },
  });

  await prisma.fareRule.upsert({
    where: { id: "f0000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "f0000000-0000-0000-0000-000000000002",
      serviceAreaId: serviceArea.id,
      tier: RideTier.CHARTER,
      baseFareKobo: 50000,          // 500 NGN
      distanceFarePerKmKobo: 12000, // 120 NGN / km
      timeFarePerMinKobo: 3000,     // 30 NGN / min
      minimumFareKobo: 60000,       // 600 NGN min
      cancellationFeeKobo: 20000,   // 200 NGN
      platformCommissionPercent: 15.00,
      partnerCommissionPercent: 5.00,
      surgeMultiplier: 1.00,
      isActive: true,
      version: 1,
    },
  });

  await prisma.fareRule.upsert({
    where: { id: "f0000000-0000-0000-0000-000000000003" },
    update: {},
    create: {
      id: "f0000000-0000-0000-0000-000000000003",
      serviceAreaId: serviceArea.id,
      tier: RideTier.CARGO,
      baseFareKobo: 35000,          // 350 NGN
      distanceFarePerKmKobo: 9000,  // 90 NGN / km
      timeFarePerMinKobo: 2000,     // 20 NGN / min
      minimumFareKobo: 40000,       // 400 NGN min
      cancellationFeeKobo: 15000,   // 150 NGN
      platformCommissionPercent: 15.00,
      partnerCommissionPercent: 5.00,
      surgeMultiplier: 1.00,
      isActive: true,
      version: 1,
    },
  });
  // eslint-disable-next-line no-console
  console.log(`💰 Fare rules initialized: Standard (${standardFare.baseFareKobo / 100} NGN base)`);

  // 4. Sample Fleet Partner
  const partnerUser = await prisma.user.upsert({
    where: { phoneNumber: "+2348044444444" },
    update: {},
    create: {
      phoneNumber: "+2348044444444",
      email: "partner@karutransit.ng",
      passwordHash: DEFAULT_PASSWORD_HASH,
      firstName: "Aliyu",
      lastName: "Karu",
      role: UserRole.PARTNER,
      isActive: true,
    },
  });

  const partner = await prisma.partner.upsert({
    where: { companyRegistrationNumber: "RC-1294829" },
    update: {},
    create: {
      name: "Karu Transit Fleet Ltd",
      companyRegistrationNumber: "RC-1294829",
      contactEmail: "partner@karutransit.ng",
      contactPhone: "+2348044444444",
      city: "Karu",
      state: "Nasarawa",
      commissionRatePercent: 10.00,
      isActive: true,
      memberships: {
        create: {
          userId: partnerUser.id,
          role: "OWNER",
        },
      },
    },
  });
  // eslint-disable-next-line no-console
  console.log(`🏢 Partner fleet created: ${partner.name}`);

  // 5. Sample Driver Partner & Vehicle
  const driverUser = await prisma.user.upsert({
    where: { phoneNumber: "+2348022222222" },
    update: {},
    create: {
      phoneNumber: "+2348022222222",
      email: "driver.musa@kekego.ng",
      passwordHash: DEFAULT_PASSWORD_HASH,
      firstName: "Musa",
      lastName: "Ibrahim",
      role: UserRole.DRIVER,
      isActive: true,
      driverProfile: {
        create: {
          partnerId: partner.id,
          verificationStatus: DriverVerificationStatus.VERIFIED,
          availabilityStatus: DriverAvailabilityStatus.ONLINE,
          isOnline: true,
          licenseNumber: "NAS-DRV-2024-9912",
          rating: 4.95,
          totalTrips: 142,
          vehicles: {
            create: {
              partnerId: partner.id,
              type: VehicleType.KEKE_NAPEP,
              plateNumber: "LAF-882-XA",
              make: "Bajaj",
              model: "RE 4S",
              color: "Yellow",
              isVerified: true,
              isActive: true,
            },
          },
          wallet: {
            create: {
              balanceKobo: 2500000, // 25,000 NGN
            },
          },
        },
      },
    },
  });
  // eslint-disable-next-line no-console
  console.log(`🛺 Verified Driver created: ${driverUser.firstName} ${driverUser.lastName}`);

  // 6. Sample Passenger
  const passengerUser = await prisma.user.upsert({
    where: { phoneNumber: "+2348033333333" },
    update: {},
    create: {
      phoneNumber: "+2348033333333",
      email: "passenger.amina@gmail.com",
      passwordHash: DEFAULT_PASSWORD_HASH,
      firstName: "Amina",
      lastName: "Yusuf",
      role: UserRole.PASSENGER,
      isActive: true,
      passengerProfile: {
        create: {
          emergencyContactName: "Hassan Yusuf",
          emergencyContactPhone: "+2348055555555",
          rating: 5.00,
          totalRides: 18,
        },
      },
      wallet: {
        create: {
          balanceKobo: 1000000, // 10,000 NGN
        },
      },
    },
  });
  // eslint-disable-next-line no-console
  console.log(`🧍 Passenger created: ${passengerUser.firstName} ${passengerUser.lastName}`);

  // eslint-disable-next-line no-console
  console.log("✅ Seed completed successfully!");
}

seed()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
