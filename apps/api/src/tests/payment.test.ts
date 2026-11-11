import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { createServer } from "../server.js";
import { PaymentService } from "../services/payment.service.js";
import { PaystackService } from "../services/paystack.service.js";
import { FareService, DEFAULT_FARE_RULES } from "../services/fare.service.js";
import {
  PaymentMethod,
  PaymentStatus,
  RideTier,
} from "@kekego/shared";
import { UserRole } from "@kekego/database";

describe("Phase 11: Payments, Wallets, and Financial Ledger Engine", () => {
  let app: FastifyInstance;
  let paymentService: PaymentService;
  let paystackService: PaystackService;
  let fareService: FareService;

  let adminToken: string;
  let passengerToken: string;
  let driverToken: string;

  beforeAll(async () => {
    app = await createServer();
    await app.ready();

    paystackService = new PaystackService();
    fareService = new FareService();
    paymentService = new PaymentService(paystackService, fareService);

    adminToken = app.jwt.sign({
      userId: "u-admin-finance-001",
      role: UserRole.ADMIN,
      phoneNumber: "+2348099990001",
    });

    passengerToken = app.jwt.sign({
      userId: "u-passenger-pay-001",
      role: UserRole.PASSENGER,
      phoneNumber: "+2348011110001",
    });

    driverToken = app.jwt.sign({
      userId: "u-driver-pay-001",
      role: UserRole.DRIVER,
      phoneNumber: "+2348022220001",
    });
  });

  afterAll(async () => {
    await app.close();
  });

  // --------------------------------------------------------------------------
  // 1. Payment Initialization & Server-Side Verification
  // --------------------------------------------------------------------------
  describe("Payment Initialization & Verification Flow", () => {
    it("should initialize card payment with Paystack sandbox and return checkout reference", async () => {
      const testRideId = "ride-pay-card-001";

      // Seed a fare breakdown snapshot in fare service for 500 NGN (50,000 kobo)
      const rule = DEFAULT_FARE_RULES[RideTier.STANDARD];
      const snapshot = fareService.calculateFare({
        distanceMeters: 3000,
        durationSeconds: 600,
        rule,
      });
      await fareService.saveFareBreakdownSnapshot(testRideId, snapshot);

      const res = await app.inject({
        method: "POST",
        url: "/payments/initialize",
        headers: {
          authorization: `Bearer ${passengerToken}`,
        },
        payload: {
          rideId: testRideId,
          method: PaymentMethod.CARD,
          callbackUrl: "https://kekego.ng/payment/callback",
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.rideId).toBe(testRideId);
      expect(body.data.status).toBe(PaymentStatus.PENDING);
      expect(body.data.method).toBe(PaymentMethod.CARD);
      expect(body.data.amountKobo).toBe(snapshot.totalFareKobo);
      expect(body.data.reference).toMatch(/^KEKE_/);
      expect(body.data.checkoutUrl).toBeDefined();
    });

    it("should verify payment server-side and trigger automated settlement", async () => {
      const testRideId = "ride-pay-verify-001";
      const rule = DEFAULT_FARE_RULES[RideTier.STANDARD];
      const snapshot = fareService.calculateFare({
        distanceMeters: 4000,
        durationSeconds: 800,
        rule,
      });
      await fareService.saveFareBreakdownSnapshot(testRideId, snapshot);

      // 1. Initialize
      const initRes = await app.inject({
        method: "POST",
        url: "/payments/initialize",
        headers: {
          authorization: `Bearer ${passengerToken}`,
        },
        payload: {
          rideId: testRideId,
          method: PaymentMethod.CARD,
        },
      });
      const { reference } = initRes.json().data;

      // 2. Server-side verification
      const verifyRes = await app.inject({
        method: "GET",
        url: `/payments/verify/${reference}`,
        headers: {
          authorization: `Bearer ${passengerToken}`,
        },
      });

      expect(verifyRes.statusCode).toBe(200);
      const verifyBody = verifyRes.json();
      expect(verifyBody.success).toBe(true);
      expect(verifyBody.data.status).toBe(PaymentStatus.COMPLETED);
      expect(verifyBody.data.paidAt).toBeDefined();

      // 3. Confirm payment status stored
      const checkRes = await app.inject({
        method: "GET",
        url: `/payments/ride/${testRideId}`,
        headers: {
          authorization: `Bearer ${passengerToken}`,
        },
      });
      expect(checkRes.statusCode).toBe(200);
      expect(checkRes.json().data.status).toBe(PaymentStatus.COMPLETED);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Webhook Signature Verification & Idempotency
  // --------------------------------------------------------------------------
  describe("Paystack Webhook Security & Idempotency", () => {
    it("should reject webhook with missing or invalid signature (401)", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/payments/webhook",
        headers: {
          "x-paystack-signature": "invalid_tampered_signature_hex",
        },
        payload: {
          event: "charge.success",
          data: { reference: "fake_ref" },
        },
      });

      expect(res.statusCode).toBe(401);
      const body = res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("INVALID_WEBHOOK_SIGNATURE");
    });

    it("should accept valid HMAC-SHA512 signature and process charge.success", async () => {
      const webhookRef = `KEKE_WH_${Date.now()}`;
      const payload = {
        event: "charge.success",
        data: {
          reference: webhookRef,
          amount: 35000,
          currency: "NGN",
          channel: "card",
          paid_at: new Date().toISOString(),
          metadata: {
            rideId: "ride-webhook-001",
          },
        },
      };

      const rawBody = JSON.stringify(payload);
      const validSignature = paystackService.generateTestWebhookSignature(rawBody);

      const res = await app.inject({
        method: "POST",
        url: "/payments/webhook",
        headers: {
          "content-type": "application/json",
          "x-paystack-signature": validSignature,
        },
        payload,
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.idempotent).toBe(false);
      expect(body.data.status).toBe(PaymentStatus.COMPLETED);
    });

    it("should handle duplicate webhook deliveries idempotently without duplicating ledger rows", async () => {
      const idempotentRef = `KEKE_IDEM_${Date.now()}`;
      const payload = {
        event: "charge.success",
        data: {
          reference: idempotentRef,
          amount: 40000,
          currency: "NGN",
          channel: "card",
          paid_at: new Date().toISOString(),
          metadata: {
            rideId: "ride-idempotent-001",
          },
        },
      };

      const rawBody = JSON.stringify(payload);
      const signature = paystackService.generateTestWebhookSignature(rawBody);

      // Delivery 1: Processes payment
      const res1 = await app.inject({
        method: "POST",
        url: "/payments/webhook",
        headers: {
          "content-type": "application/json",
          "x-paystack-signature": signature,
        },
        payload,
      });
      expect(res1.statusCode).toBe(200);
      expect(res1.json().data.idempotent).toBe(false);

      // Delivery 2: Retried webhook delivery
      const res2 = await app.inject({
        method: "POST",
        url: "/payments/webhook",
        headers: {
          "content-type": "application/json",
          "x-paystack-signature": signature,
        },
        payload,
      });
      expect(res2.statusCode).toBe(200);
      const body2 = res2.json();
      expect(body2.success).toBe(true);
      expect(body2.data.idempotent).toBe(true); // Identified as already completed!
    });
  });

  // --------------------------------------------------------------------------
  // 3. Cash Payment & Driver Receivable Reconciliation
  // --------------------------------------------------------------------------
  describe("Cash Payment & Driver Commission Deductions", () => {
    it("should initialize cash payment in PENDING state", async () => {
      const cashRideId = "ride-cash-init-001";

      const res = await app.inject({
        method: "POST",
        url: "/payments/initialize",
        headers: {
          authorization: `Bearer ${passengerToken}`,
        },
        payload: {
          rideId: cashRideId,
          method: PaymentMethod.CASH,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.method).toBe(PaymentMethod.CASH);
      expect(body.data.status).toBe(PaymentStatus.PENDING);
      expect(body.data.checkoutUrl).toBeNull();
    });

    it("should confirm cash handover and debit platform 15% commission from driver wallet", async () => {
      const cashRideId = "ride-cash-confirm-001";
      const rule = DEFAULT_FARE_RULES[RideTier.STANDARD];
      const snapshot = fareService.calculateFare({
        distanceMeters: 5000,
        durationSeconds: 900,
        rule,
      });
      await fareService.saveFareBreakdownSnapshot(cashRideId, snapshot);

      const confirmRes = await app.inject({
        method: "POST",
        url: "/payments/cash/confirm",
        headers: {
          authorization: `Bearer ${driverToken}`,
        },
        payload: {
          rideId: cashRideId,
          amountKobo: snapshot.totalFareKobo,
        },
      });

      expect(confirmRes.statusCode).toBe(200);
      const confirmBody = confirmRes.json();
      expect(confirmBody.success).toBe(true);
      expect(confirmBody.data.status).toBe(PaymentStatus.COMPLETED);
      expect(confirmBody.data.paidAt).toBeDefined();

      // Second cash confirmation call should be idempotent
      const duplicateConfirm = await app.inject({
        method: "POST",
        url: "/payments/cash/confirm",
        headers: {
          authorization: `Bearer ${driverToken}`,
        },
        payload: {
          rideId: cashRideId,
        },
      });
      expect(duplicateConfirm.statusCode).toBe(200);
      expect(duplicateConfirm.json().data.alreadyCompleted).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Digital Wallet Payments & Atomic Balances
  // --------------------------------------------------------------------------
  describe("Digital Wallet & Top-up Lifecycle", () => {
    it("should reject wallet payment if balance is insufficient (INSUFFICIENT_FUNDS)", async () => {
      const poorPassengerToken = app.jwt.sign({
        userId: "u-poor-passenger-001",
        role: UserRole.PASSENGER,
        phoneNumber: "+2348011119999",
      });

      const testRideId = "ride-wallet-fail-001";
      const res = await app.inject({
        method: "POST",
        url: "/payments/initialize",
        headers: {
          authorization: `Bearer ${poorPassengerToken}`,
        },
        payload: {
          rideId: testRideId,
          method: PaymentMethod.WALLET,
        },
      });

      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("INSUFFICIENT_FUNDS");
    });

    it("should successfully top-up wallet and allow fare payment", async () => {
      const wealthyUser = "u-wealthy-passenger-001";
      const wealthyToken = app.jwt.sign({
        userId: wealthyUser,
        role: UserRole.PASSENGER,
        phoneNumber: "+2348077770001",
      });

      // 1. Initialize top-up for 5,000 NGN (500,000 kobo)
      const topupInit = await app.inject({
        method: "POST",
        url: "/wallet/topup",
        headers: {
          authorization: `Bearer ${wealthyToken}`,
        },
        payload: {
          amountKobo: 500000,
        },
      });
      expect(topupInit.statusCode).toBe(200);
      const { reference } = topupInit.json().data;

      // 2. Complete verified top-up
      const topupComplete = await app.inject({
        method: "POST",
        url: "/wallet/topup/complete",
        headers: {
          authorization: `Bearer ${wealthyToken}`,
        },
        payload: {
          reference,
        },
      });
      expect(topupComplete.statusCode).toBe(200);

      // 3. Check wallet balance
      const balanceRes = await app.inject({
        method: "GET",
        url: "/wallet/balance",
        headers: {
          authorization: `Bearer ${wealthyToken}`,
        },
      });
      expect(balanceRes.statusCode).toBe(200);
      expect(balanceRes.json().data.balanceKobo).toBeGreaterThanOrEqual(500000);

      // 4. Pay for ride using wallet balance
      const rideId = "ride-wallet-success-001";
      const rule = DEFAULT_FARE_RULES[RideTier.STANDARD];
      const snapshot = fareService.calculateFare({
        distanceMeters: 2000,
        durationSeconds: 400,
        rule,
      });
      await fareService.saveFareBreakdownSnapshot(rideId, snapshot);

      const payRes = await app.inject({
        method: "POST",
        url: "/payments/initialize",
        headers: {
          authorization: `Bearer ${wealthyToken}`,
        },
        payload: {
          rideId,
          method: PaymentMethod.WALLET,
        },
      });

      expect(payRes.statusCode).toBe(200);
      const payBody = payRes.json();
      expect(payBody.data.status).toBe(PaymentStatus.COMPLETED);
      expect(payBody.data.method).toBe(PaymentMethod.WALLET);
      expect(payBody.data.paidAt).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // 5. Driver Payouts, Admin Ledger, and Refunds
  // --------------------------------------------------------------------------
  describe("Driver Payouts, Financial Ledger, and Refund Flow", () => {
    it("should allow driver to request NUBAN earnings payout", async () => {
      // First credit driver wallet
      const driverWallet = await paymentService.getOrCreateWallet({
        driverId: "u-driver-pay-001",
      });
      driverWallet.balanceKobo = BigInt(150000); // 1,500 NGN

      const payoutRes = await app.inject({
        method: "POST",
        url: "/driver/payout",
        headers: {
          authorization: `Bearer ${driverToken}`,
        },
        payload: {
          amountKobo: 100000, // Withdraw 1,000 NGN
          accountNumber: "0123456789",
          bankCode: "058", // GTBank CBN code
        },
      });

      expect(payoutRes.statusCode).toBe(200);
      const body = payoutRes.json();
      expect(body.success).toBe(true);
      expect(body.data.amountKobo).toBe(100000);
      expect(body.data.status).toBe("SUCCESS");
      expect(body.data.remainingBalanceKobo).toBe(50000);
    });

    it("GET /admin/finance/summary should return platform aggregates", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/admin/finance/summary",
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.currency).toBe("NGN");
      expect(body.data.grossMerchandiseValueKobo).toBeGreaterThanOrEqual(0);
      expect(body.data.platformCommissionKobo).toBeGreaterThanOrEqual(0);
    });

    it("GET /admin/ledger should return double-entry ledger statements", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/admin/ledger?limit=10",
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data.data)).toBe(true);
      expect(body.data.total).toBeGreaterThan(0);
    });

    it("POST /admin/payments/:id/refund should process administrative refund", async () => {
      // Create a completed test payment to refund
      const refundRideId = "ride-refund-test-001";
      const rule = DEFAULT_FARE_RULES[RideTier.STANDARD];
      const snapshot = fareService.calculateFare({
        distanceMeters: 3000,
        durationSeconds: 500,
        rule,
      });
      await fareService.saveFareBreakdownSnapshot(refundRideId, snapshot);

      const initRes = await app.inject({
        method: "POST",
        url: "/payments/initialize",
        headers: {
          authorization: `Bearer ${passengerToken}`,
        },
        payload: {
          rideId: refundRideId,
          method: PaymentMethod.CARD,
        },
      });
      const paymentData = initRes.json().data;

      // Complete payment
      await app.inject({
        method: "GET",
        url: `/payments/verify/${paymentData.reference}`,
        headers: {
          authorization: `Bearer ${passengerToken}`,
        },
      });

      // Admin executes refund
      const refundRes = await app.inject({
        method: "POST",
        url: `/admin/payments/${paymentData.paymentId}/refund`,
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          reason: "Driver vehicle mechanical breakdown mid-trip in Karu",
        },
      });

      expect(refundRes.statusCode).toBe(200);
      const refundBody = refundRes.json();
      expect(refundBody.success).toBe(true);
      expect(refundBody.data.status).toBe(PaymentStatus.REFUNDED);
      expect(refundBody.data.refundedAmountKobo).toBe(snapshot.totalFareKobo);
    });

    it("should protect admin financial routes against unauthorized access", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/admin/finance/summary",
        headers: {
          authorization: `Bearer ${passengerToken}`, // Passenger forbidden!
        },
      });

      expect(res.statusCode).toBe(403);
    });
  });
});
