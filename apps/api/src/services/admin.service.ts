import { prisma, DriverVerificationStatus, RideStatus } from "@kekego/database";

export class AdminService {
  /**
   * System Overview Operational Statistics (Real Data from PostgreSQL)
   */
  async getDashboardStats() {
    const [
      totalUsers,
      totalPassengers,
      totalDrivers,
      verifiedDrivers,
      onlineDrivers,
      pendingDrivers,
      totalVehicles,
      totalPartners,
      totalRides,
      activeRides,
      completedRides,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.passengerProfile.count(),
      prisma.driverProfile.count(),
      prisma.driverProfile.count({
        where: { verificationStatus: DriverVerificationStatus.VERIFIED },
      }),
      prisma.driverProfile.count({
        where: { isOnline: true },
      }),
      prisma.driverProfile.count({
        where: { verificationStatus: DriverVerificationStatus.PENDING_REVIEW },
      }),
      prisma.vehicle.count(),
      prisma.partner.count(),
      prisma.ride.count(),
      prisma.ride.count({
        where: {
          status: {
            in: [
              RideStatus.REQUESTED,
              RideStatus.SEARCHING,
              RideStatus.DRIVER_ASSIGNED,
              RideStatus.DRIVER_EN_ROUTE,
              RideStatus.DRIVER_ARRIVED,
              RideStatus.IN_PROGRESS,
            ],
          },
        },
      }),
      prisma.ride.count({
        where: { status: RideStatus.COMPLETED },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        passengers: totalPassengers,
        drivers: totalDrivers,
        partners: totalPartners,
      },
      fleet: {
        totalVehicles,
        verifiedDrivers,
        onlineDrivers,
        pendingVerificationDrivers: pendingDrivers,
      },
      rides: {
        total: totalRides,
        active: activeRides,
        completed: completedRides,
      },
      serviceArea: {
        activeState: "Nasarawa",
        status: "OPERATIONAL",
      },
    };
  }

  /**
   * List drivers with filtering by verification status
   */
  async listDrivers(params: {
    status?: DriverVerificationStatus;
    page: number;
    limit: number;
  }) {
    const skip = (params.page - 1) * params.limit;
    const where = params.status ? { verificationStatus: params.status } : {};

    const [total, drivers] = await Promise.all([
      prisma.driverProfile.count({ where }),
      prisma.driverProfile.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
              email: true,
              isActive: true,
            },
          },
          vehicles: true,
          partner: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    return {
      drivers: drivers.map((d) => ({
        id: d.id,
        userId: d.userId,
        name: `${d.user.firstName} ${d.user.lastName}`,
        phoneNumber: d.user.phoneNumber,
        email: d.user.email,
        licenseNumber: d.licenseNumber,
        verificationStatus: d.verificationStatus,
        availabilityStatus: d.availabilityStatus,
        isOnline: d.isOnline,
        rating: Number(d.rating),
        totalTrips: d.totalTrips,
        partner: d.partner?.name ?? "Independent",
        vehicles: d.vehicles.map((v) => ({
          id: v.id,
          plateNumber: v.plateNumber,
          make: v.make,
          model: v.model,
          color: v.color,
          isVerified: v.isVerified,
        })),
        createdAt: d.createdAt,
      })),
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    };
  }

  /**
   * List registered vehicles
   */
  async listVehicles(params: { page: number; limit: number }) {
    const skip = (params.page - 1) * params.limit;

    const [total, vehicles] = await Promise.all([
      prisma.vehicle.count(),
      prisma.vehicle.findMany({
        skip,
        take: params.limit,
        orderBy: { createdAt: "desc" },
        include: {
          driver: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  phoneNumber: true,
                },
              },
            },
          },
          partner: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    return {
      vehicles: vehicles.map((v) => ({
        id: v.id,
        plateNumber: v.plateNumber,
        make: v.make,
        model: v.model,
        year: v.year,
        color: v.color,
        type: v.type,
        isVerified: v.isVerified,
        isActive: v.isActive,
        driverName: `${v.driver.user.firstName} ${v.driver.user.lastName}`,
        driverPhone: v.driver.user.phoneNumber,
        partnerName: v.partner?.name ?? "Independent",
        createdAt: v.createdAt,
      })),
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    };
  }

  /**
   * List fleet partners
   */
  async listPartners() {
    const partners = await prisma.partner.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            drivers: true,
            vehicles: true,
          },
        },
      },
    });

    return partners.map((p) => ({
      id: p.id,
      name: p.name,
      companyRegistrationNumber: p.companyRegistrationNumber,
      contactEmail: p.contactEmail,
      contactPhone: p.contactPhone,
      city: p.city,
      state: p.state,
      commissionRatePercent: Number(p.commissionRatePercent),
      isActive: p.isActive,
      totalDrivers: p._count.drivers,
      totalVehicles: p._count.vehicles,
      createdAt: p.createdAt,
    }));
  }

  /**
   * List rides for monitoring
   */
  async listRides(params: { status?: RideStatus; page: number; limit: number }) {
    const skip = (params.page - 1) * params.limit;
    const where = params.status ? { status: params.status } : {};

    const [total, rides] = await Promise.all([
      prisma.ride.count({ where }),
      prisma.ride.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { requestedAt: "desc" },
        include: {
          passenger: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  phoneNumber: true,
                },
              },
            },
          },
          driver: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  phoneNumber: true,
                },
              },
            },
          },
          vehicle: {
            select: {
              plateNumber: true,
              color: true,
            },
          },
        },
      }),
    ]);

    return {
      rides: rides.map((r) => ({
        id: r.id,
        rideNumber: r.rideNumber,
        tier: r.tier,
        status: r.status,
        pickupAddress: r.pickupAddress,
        destinationAddress: r.destinationAddress,
        estimatedFareKobo: r.estimatedFareKobo,
        finalFareKobo: r.finalFareKobo,
        paymentMethod: r.paymentMethod,
        paymentStatus: r.paymentStatus,
        passengerName: `${r.passenger.user.firstName} ${r.passenger.user.lastName}`,
        passengerPhone: r.passenger.user.phoneNumber,
        driverName: r.driver ? `${r.driver.user.firstName} ${r.driver.user.lastName}` : null,
        driverPhone: r.driver?.user.phoneNumber ?? null,
        vehiclePlate: r.vehicle?.plateNumber ?? null,
        requestedAt: r.requestedAt,
        completedAt: r.completedAt,
      })),
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    };
  }
}
