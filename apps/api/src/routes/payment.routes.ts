import type { FastifyPluginAsync } from "fastify";
import { UserRole } from "@kekego/database";
import {
  initializePaymentSchema,
  verifyPaymentSchema,
  confirmCashPaymentSchema,
  walletTopupSchema,
  refundPaymentSchema,
  driverPayoutSchema,
  ledgerQuerySchema,
} from "@kekego/validation";
import { PaymentService } from "../services/payment.service.js";

export const paymentRoutes: FastifyPluginAsync = async (app) => {
  const paymentService = new PaymentService();

  // --------------------------------------------------------------------------
  // 1. Payment Initialization & Verification
  // --------------------------------------------------------------------------

  app.post(
    "/payments/initialize",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const input = initializePaymentSchema.parse(request.body);
      const user = request.user as { userId: string; phoneNumber?: string };

      const result = await paymentService.initializePayment(
        input,
        user.userId,
        input.email || `${user.userId}@kekego.ng`
      );

      return reply.status(200).send({
        success: true,
        data: result,
      });
    }
  );

  app.get(
    "/payments/verify/:reference",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { reference } = verifyPaymentSchema.parse(request.params);
      const result = await paymentService.verifyPayment(reference);

      return reply.status(200).send({
        success: true,
        data: result,
      });
    }
  );

  app.post(
    "/payments/cash/confirm",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const input = confirmCashPaymentSchema.parse(request.body);
      const result = await paymentService.confirmCashPayment(input);

      return reply.status(200).send({
        success: true,
        data: result,
      });
    }
  );

  app.get(
    "/payments/ride/:rideId",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { rideId } = request.params as { rideId: string };
      const payment = await paymentService.getPaymentByRideId(rideId);

      if (!payment) {
        return reply.status(404).send({
          success: false,
          error: {
            code: "PAYMENT_NOT_FOUND",
            message: "No payment record found for this ride",
          },
        });
      }

      return reply.status(200).send({
        success: true,
        data: payment,
      });
    }
  );

  // --------------------------------------------------------------------------
  // 2. Paystack Webhook Handler
  // --------------------------------------------------------------------------

  app.post("/payments/webhook", async (request, reply) => {
    const signature = request.headers["x-paystack-signature"] as string | undefined;

    // Fastify provides raw body if captured or JSON stringified payload
    const rawBody = (request as any).rawBody || JSON.stringify(request.body);
    const payload = request.body as { event: string; data: Record<string, any> };

    const result = await paymentService.handleWebhook(signature, rawBody, payload);

    return reply.status(200).send({
      success: true,
      data: result,
    });
  });

  // --------------------------------------------------------------------------
  // 3. Digital Wallet Endpoints
  // --------------------------------------------------------------------------

  app.get(
    "/wallet/balance",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = request.user as { userId: string; role: UserRole };

      const params =
        user.role === UserRole.DRIVER
          ? { driverId: user.userId }
          : { userId: user.userId };

      const balance = await paymentService.getWalletBalance(params);

      return reply.status(200).send({
        success: true,
        data: balance,
      });
    }
  );

  app.post(
    "/wallet/topup",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const input = walletTopupSchema.parse(request.body);
      const user = request.user as { userId: string; phoneNumber?: string };

      const result = await paymentService.initializeWalletTopup(
        user.userId,
        input,
        `${user.userId}@kekego.ng`
      );

      return reply.status(200).send({
        success: true,
        data: result,
      });
    }
  );

  app.post(
    "/wallet/topup/complete",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { reference } = verifyPaymentSchema.parse(request.body);
      const user = request.user as { userId: string };

      const result = await paymentService.completeWalletTopup(user.userId, reference);

      return reply.status(200).send({
        success: true,
        data: result,
      });
    }
  );

  app.post(
    "/driver/payout",
    { preHandler: [app.authenticate, app.authorize([UserRole.DRIVER, UserRole.ADMIN])] },
    async (request, reply) => {
      const input = driverPayoutSchema.parse(request.body);
      const user = request.user as { userId: string };

      const result = await paymentService.requestDriverPayout(user.userId, input);

      return reply.status(200).send({
        success: true,
        data: result,
      });
    }
  );

  // --------------------------------------------------------------------------
  // 4. Admin Financial Reconciliation & Ledger
  // --------------------------------------------------------------------------

  app.get(
    "/admin/finance/summary",
    { preHandler: [app.authenticate, app.authorize([UserRole.ADMIN])] },
    async (_request, reply) => {
      const summary = await paymentService.getFinancialSummary();

      return reply.status(200).send({
        success: true,
        data: summary,
      });
    }
  );

  app.get(
    "/admin/ledger",
    { preHandler: [app.authenticate, app.authorize([UserRole.ADMIN])] },
    async (request, reply) => {
      const query = ledgerQuerySchema.parse(request.query);
      const ledger = await paymentService.getLedgerEntries(query);

      return reply.status(200).send({
        success: true,
        data: ledger,
      });
    }
  );

  app.post(
    "/admin/payments/:id/refund",
    { preHandler: [app.authenticate, app.authorize([UserRole.ADMIN])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = refundPaymentSchema.parse({
        paymentId: id,
        ...(request.body as object),
      });
      const admin = request.user as { userId: string };

      const result = await paymentService.processRefund(admin.userId, body);

      return reply.status(200).send({
        success: true,
        data: result,
      });
    }
  );
};
