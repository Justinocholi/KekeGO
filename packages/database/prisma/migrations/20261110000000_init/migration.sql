-- =========================================================================
-- KEKEGO DATABASE FOUNDATION MIGRATION
-- PostgreSQL 14+ with PostGIS 3+
-- Migration: 20261110000000_init
-- =========================================================================

-- Enable PostGIS & UUID extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Enums
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'DRIVER', 'PASSENGER', 'PARTNER');
CREATE TYPE "DriverVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED', 'SUSPENDED');
CREATE TYPE "DriverAvailabilityStatus" AS ENUM ('OFFLINE', 'ONLINE', 'BUSY');
CREATE TYPE "VehicleType" AS ENUM ('KEKE_NAPEP');
CREATE TYPE "PartnerMemberRole" AS ENUM ('OWNER', 'MANAGER', 'DISPATCHER');
CREATE TYPE "RideTier" AS ENUM ('STANDARD', 'CHARTER', 'CARGO');
CREATE TYPE "RideStatus" AS ENUM ('REQUESTED', 'SEARCHING', 'DRIVER_ASSIGNED', 'DRIVER_EN_ROUTE', 'DRIVER_ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_DRIVER_FOUND');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'WALLET', 'CARD', 'BANK_TRANSFER');
CREATE TYPE "LedgerEntryType" AS ENUM ('CREDIT', 'DEBIT');
CREATE TYPE "LedgerCategory" AS ENUM ('TRIP_FARE', 'PLATFORM_COMMISSION', 'PARTNER_COMMISSION', 'CANCELLATION_FEE', 'PAYOUT', 'REFUND', 'WALLET_TOPUP');
CREATE TYPE "NotificationType" AS ENUM ('RIDE_UPDATE', 'DRIVER_VERIFICATION', 'PAYMENT', 'SYSTEM_ANNOUNCEMENT', 'SOS_ALERT');
CREATE TYPE "SupportCategory" AS ENUM ('FARE_DISPUTE', 'LOST_ITEM', 'DRIVER_BEHAVIOR', 'VEHICLE_CONDITION', 'SAFETY_INCIDENT', 'ACCOUNT_ISSUE');
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED');
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT_SOS');

-- 1. Users Table
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "phone_number" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255),
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PASSENGER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "users_phone_number_key" UNIQUE ("phone_number"),
    CONSTRAINT "users_email_key" UNIQUE ("email")
);

CREATE INDEX "users_phone_number_idx" ON "users"("phone_number");
CREATE INDEX "users_role_is_active_idx" ON "users"("role", "is_active");

-- 2. Passenger Profiles Table
CREATE TABLE "passenger_profiles" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "emergency_contact_name" VARCHAR(100),
    "emergency_contact_phone" VARCHAR(20),
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 5.00,
    "total_rides" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "passenger_profiles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "passenger_profiles_user_id_key" UNIQUE ("user_id"),
    CONSTRAINT "passenger_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 3. Partners Table (Fleet Tenant Isolation)
CREATE TABLE "partners" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(150) NOT NULL,
    "company_registration_number" VARCHAR(50),
    "contact_email" VARCHAR(255) NOT NULL,
    "contact_phone" VARCHAR(20) NOT NULL,
    "address" TEXT,
    "city" VARCHAR(100),
    "state" VARCHAR(100) NOT NULL DEFAULT 'Nasarawa',
    "commission_rate_percent" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "partners_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "partners_company_registration_number_key" UNIQUE ("company_registration_number")
);

-- 4. Partner Memberships Table
CREATE TABLE "partner_memberships" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "partner_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "PartnerMemberRole" NOT NULL DEFAULT 'MANAGER',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "partner_memberships_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "partner_memberships_partner_id_user_id_key" UNIQUE ("partner_id", "user_id"),
    CONSTRAINT "partner_memberships_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "partner_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 5. Driver Profiles Table
CREATE TABLE "driver_profiles" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "partner_id" UUID,
    "verification_status" "DriverVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "availability_status" "DriverAvailabilityStatus" NOT NULL DEFAULT 'OFFLINE',
    "license_number" VARCHAR(50),
    "license_expiry" DATE,
    "license_image_url" TEXT,
    "profile_photo_url" TEXT,
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 5.00,
    "total_trips" INTEGER NOT NULL DEFAULT 0,
    "acceptance_rate" DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    "cancellation_rate" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "last_active_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "driver_profiles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "driver_profiles_user_id_key" UNIQUE ("user_id"),
    CONSTRAINT "driver_profiles_license_number_key" UNIQUE ("license_number"),
    CONSTRAINT "driver_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "driver_profiles_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "driver_profiles_partner_id_idx" ON "driver_profiles"("partner_id");
CREATE INDEX "driver_profiles_verification_availability_idx" ON "driver_profiles"("verification_status", "availability_status");
CREATE INDEX "driver_profiles_online_availability_idx" ON "driver_profiles"("is_online", "availability_status");

-- 6. Vehicles Table
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "driver_id" UUID NOT NULL,
    "partner_id" UUID,
    "type" "VehicleType" NOT NULL DEFAULT 'KEKE_NAPEP',
    "plate_number" VARCHAR(20) NOT NULL,
    "make" VARCHAR(50) NOT NULL DEFAULT 'Bajaj',
    "model" VARCHAR(50) NOT NULL DEFAULT 'RE 4S',
    "year" INTEGER,
    "color" VARCHAR(30) NOT NULL DEFAULT 'Yellow',
    "insurance_expiry" DATE,
    "inspection_expiry" DATE,
    "insurance_image_url" TEXT,
    "vehicle_image_url" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "vehicles_plate_number_key" UNIQUE ("plate_number"),
    CONSTRAINT "vehicles_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "driver_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "vehicles_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "vehicles_driver_id_idx" ON "vehicles"("driver_id");
CREATE INDEX "vehicles_partner_id_idx" ON "vehicles"("partner_id");

-- 7. Service Areas Table (PostGIS Geofencing)
CREATE TABLE "service_areas" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL DEFAULT 'Nasarawa',
    "country" VARCHAR(100) NOT NULL DEFAULT 'Nigeria',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "boundary_geojson" JSONB NOT NULL,
    "boundary_geometry" geometry(Polygon, 4326),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "service_areas_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "service_areas_boundary_gist_idx" ON "service_areas" USING GIST ("boundary_geometry");

-- 8. Fare Rules Table
CREATE TABLE "fare_rules" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "service_area_id" UUID,
    "tier" "RideTier" NOT NULL DEFAULT 'STANDARD',
    "base_fare_kobo" INTEGER NOT NULL,
    "distance_fare_per_km_kobo" INTEGER NOT NULL,
    "time_fare_per_min_kobo" INTEGER NOT NULL,
    "minimum_fare_kobo" INTEGER NOT NULL,
    "cancellation_fee_kobo" INTEGER NOT NULL DEFAULT 10000,
    "platform_commission_percent" DECIMAL(5,2) NOT NULL DEFAULT 15.00,
    "partner_commission_percent" DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    "surge_multiplier" DECIMAL(3,2) NOT NULL DEFAULT 1.00,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fare_rules_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "fare_rules_service_area_id_fkey" FOREIGN KEY ("service_area_id") REFERENCES "service_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "fare_rules_service_area_tier_idx" ON "fare_rules"("service_area_id", "tier", "is_active");

-- 9. Rides Table
CREATE TABLE "rides" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ride_number" VARCHAR(30) NOT NULL,
    "passenger_id" UUID NOT NULL,
    "driver_id" UUID,
    "vehicle_id" UUID,
    "service_area_id" UUID,
    "fare_rule_id" UUID,
    "tier" "RideTier" NOT NULL DEFAULT 'STANDARD',
    "status" "RideStatus" NOT NULL DEFAULT 'REQUESTED',
    "pickup_address" TEXT NOT NULL,
    "pickup_latitude" DECIMAL(10,7) NOT NULL,
    "pickup_longitude" DECIMAL(10,7) NOT NULL,
    "destination_address" TEXT NOT NULL,
    "destination_latitude" DECIMAL(10,7) NOT NULL,
    "destination_longitude" DECIMAL(10,7) NOT NULL,
    "start_otp" VARCHAR(6) NOT NULL,
    "estimated_distance_meters" INTEGER NOT NULL,
    "estimated_duration_seconds" INTEGER NOT NULL,
    "actual_distance_meters" INTEGER,
    "actual_duration_seconds" INTEGER,
    "estimated_fare_kobo" INTEGER NOT NULL,
    "final_fare_kobo" INTEGER,
    "cancellation_reason" TEXT,
    "cancelled_by" "UserRole",
    "payment_method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_at" TIMESTAMPTZ,
    "arrived_at" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "cancelled_at" TIMESTAMPTZ,
    CONSTRAINT "rides_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "rides_ride_number_key" UNIQUE ("ride_number"),
    CONSTRAINT "rides_passenger_id_fkey" FOREIGN KEY ("passenger_id") REFERENCES "passenger_profiles"("id") ON UPDATE CASCADE,
    CONSTRAINT "rides_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "driver_profiles"("id") ON UPDATE CASCADE,
    CONSTRAINT "rides_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON UPDATE CASCADE,
    CONSTRAINT "rides_service_area_id_fkey" FOREIGN KEY ("service_area_id") REFERENCES "service_areas"("id") ON UPDATE CASCADE,
    CONSTRAINT "rides_fare_rule_id_fkey" FOREIGN KEY ("fare_rule_id") REFERENCES "fare_rules"("id") ON UPDATE CASCADE
);

CREATE INDEX "rides_passenger_id_idx" ON "rides"("passenger_id");
CREATE INDEX "rides_driver_id_idx" ON "rides"("driver_id");
CREATE INDEX "rides_status_idx" ON "rides"("status");
CREATE INDEX "rides_requested_at_idx" ON "rides"("requested_at");

-- 10. Ride Events Table
CREATE TABLE "ride_events" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ride_id" UUID NOT NULL,
    "previous_status" "RideStatus",
    "new_status" "RideStatus" NOT NULL,
    "actor_id" UUID,
    "actor_role" "UserRole" NOT NULL,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ride_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ride_events_ride_id_fkey" FOREIGN KEY ("ride_id") REFERENCES "rides"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ride_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "ride_events_ride_id_idx" ON "ride_events"("ride_id");

-- 11. Ride Fare Breakdowns Table
CREATE TABLE "ride_fare_breakdowns" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ride_id" UUID NOT NULL,
    "fare_rule_id" UUID,
    "fare_rule_version" INTEGER NOT NULL DEFAULT 1,
    "currency" VARCHAR(5) NOT NULL DEFAULT 'NGN',
    "base_fare_kobo" INTEGER NOT NULL,
    "distance_charge_kobo" INTEGER NOT NULL,
    "time_charge_kobo" INTEGER NOT NULL,
    "cancellation_fee_kobo" INTEGER NOT NULL DEFAULT 0,
    "surge_multiplier" DECIMAL(3,2) NOT NULL DEFAULT 1.00,
    "discount_kobo" INTEGER NOT NULL DEFAULT 0,
    "subtotal_kobo" INTEGER NOT NULL,
    "total_fare_kobo" INTEGER NOT NULL,
    "platform_commission_kobo" INTEGER NOT NULL,
    "partner_commission_kobo" INTEGER NOT NULL DEFAULT 0,
    "driver_earnings_kobo" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ride_fare_breakdowns_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ride_fare_breakdowns_ride_id_key" UNIQUE ("ride_id"),
    CONSTRAINT "ride_fare_breakdowns_ride_id_fkey" FOREIGN KEY ("ride_id") REFERENCES "rides"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ride_fare_breakdowns_fare_rule_id_fkey" FOREIGN KEY ("fare_rule_id") REFERENCES "fare_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 12. Driver Locations Table (PostGIS Tracking)
CREATE TABLE "driver_locations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "driver_id" UUID NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "heading" REAL,
    "speed" REAL,
    "accuracy" REAL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "location_point" geometry(Point, 4326),
    "recorded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "driver_locations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "driver_locations_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "driver_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "driver_locations_driver_id_recorded_at_idx" ON "driver_locations"("driver_id", "recorded_at" DESC);
CREATE INDEX "driver_locations_point_gist_idx" ON "driver_locations" USING GIST ("location_point");

-- 13. Wallets Table
CREATE TABLE "wallets" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID,
    "driver_id" UUID,
    "partner_id" UUID,
    "balance_kobo" BIGINT NOT NULL DEFAULT 0,
    "currency" VARCHAR(5) NOT NULL DEFAULT 'NGN',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "wallets_user_id_key" UNIQUE ("user_id"),
    CONSTRAINT "wallets_driver_id_key" UNIQUE ("driver_id"),
    CONSTRAINT "wallets_partner_id_key" UNIQUE ("partner_id"),
    CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "wallets_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "driver_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "wallets_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 14. Payments Table
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ride_id" UUID NOT NULL,
    "amount_kobo" INTEGER NOT NULL,
    "currency" VARCHAR(5) NOT NULL DEFAULT 'NGN',
    "method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paystack_reference" VARCHAR(100),
    "paystack_transaction_id" VARCHAR(100),
    "paystack_status" VARCHAR(50),
    "paystack_channel" VARCHAR(50),
    "paid_at" TIMESTAMPTZ,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "payments_ride_id_key" UNIQUE ("ride_id"),
    CONSTRAINT "payments_paystack_reference_key" UNIQUE ("paystack_reference"),
    CONSTRAINT "payments_ride_id_fkey" FOREIGN KEY ("ride_id") REFERENCES "rides"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "payments_status_idx" ON "payments"("status");

-- 15. Ledger Entries Table
CREATE TABLE "ledger_entries" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "wallet_id" UUID,
    "partner_id" UUID,
    "ride_id" UUID,
    "entry_type" "LedgerEntryType" NOT NULL,
    "category" "LedgerCategory" NOT NULL,
    "amount_kobo" INTEGER NOT NULL,
    "balance_after_kobo" BIGINT NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "idempotency_key" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ledger_entries_idempotency_key_key" UNIQUE ("idempotency_key"),
    CONSTRAINT "ledger_entries_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON UPDATE CASCADE,
    CONSTRAINT "ledger_entries_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON UPDATE CASCADE
);

CREATE INDEX "ledger_entries_wallet_id_created_at_idx" ON "ledger_entries"("wallet_id", "created_at");
CREATE INDEX "ledger_entries_partner_id_created_at_idx" ON "ledger_entries"("partner_id", "created_at");

-- 16. Ratings Table
CREATE TABLE "ratings" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ride_id" UUID NOT NULL,
    "passenger_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "score" SMALLINT NOT NULL CHECK (score >= 1 AND score <= 5),
    "comment" TEXT,
    "tags" TEXT[] NOT NULL DEFAULT '{}',
    "rated_by" "UserRole" NOT NULL DEFAULT 'PASSENGER',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ratings_ride_id_key" UNIQUE ("ride_id"),
    CONSTRAINT "ratings_ride_id_fkey" FOREIGN KEY ("ride_id") REFERENCES "rides"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ratings_passenger_id_fkey" FOREIGN KEY ("passenger_id") REFERENCES "passenger_profiles"("id") ON UPDATE CASCADE,
    CONSTRAINT "ratings_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "driver_profiles"("id") ON UPDATE CASCADE
);

CREATE INDEX "ratings_driver_id_idx" ON "ratings"("driver_id");
CREATE INDEX "ratings_passenger_id_idx" ON "ratings"("passenger_id");

-- 17. Notifications Table
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'RIDE_UPDATE',
    "metadata" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- 18. Support Tickets Table
CREATE TABLE "support_tickets" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ticket_number" VARCHAR(30) NOT NULL,
    "user_id" UUID NOT NULL,
    "ride_id" UUID,
    "category" "SupportCategory" NOT NULL DEFAULT 'ACCOUNT_ISSUE',
    "subject" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "resolved_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "support_tickets_ticket_number_key" UNIQUE ("ticket_number"),
    CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE CASCADE,
    CONSTRAINT "support_tickets_ride_id_fkey" FOREIGN KEY ("ride_id") REFERENCES "rides"("id") ON UPDATE CASCADE
);

CREATE INDEX "support_tickets_user_id_idx" ON "support_tickets"("user_id");
CREATE INDEX "support_tickets_status_idx" ON "support_tickets"("status");

-- 19. Audit Logs Table
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "actor_id" UUID,
    "actor_role" "UserRole" NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" VARCHAR(100) NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- Spatial sync trigger for driver locations
CREATE OR REPLACE FUNCTION sync_driver_location_point()
RETURNS TRIGGER AS $$
BEGIN
    NEW.location_point := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_driver_location_point ON "driver_locations";
CREATE TRIGGER trg_sync_driver_location_point
BEFORE INSERT OR UPDATE OF "latitude", "longitude" ON "driver_locations"
FOR EACH ROW EXECUTE FUNCTION sync_driver_location_point();
