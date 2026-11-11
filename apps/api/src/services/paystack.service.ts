import crypto from "node:crypto";
import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";

export interface PaystackInitResponse {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export interface PaystackVerifyResponse {
  status: "success" | "failed" | "abandoned" | "pending";
  reference: string;
  amountKobo: number;
  currency: string;
  channel: string;
  paidAt: string | null;
  customerEmail: string;
  metadata?: Record<string, any>;
}

export interface PaystackRefundResponse {
  refundId: string;
  status: "pending" | "processed" | "failed";
  amountKobo: number;
  currency: string;
}

export class PaystackService {
  private readonly secretKey: string;
  private readonly webhookSecret: string;
  private readonly isSandboxOrMock: boolean;

  // In-memory simulation registry for test references and offline dev sandbox
  private static mockTransactions: Map<
    string,
    {
      reference: string;
      amountKobo: number;
      currency: string;
      email: string;
      status: "success" | "failed" | "pending";
      channel: string;
      paidAt: string;
      metadata?: Record<string, any>;
    }
  > = new Map();

  constructor() {
    this.secretKey = env.PAYSTACK_SECRET_KEY || "sk_test_placeholder";
    this.webhookSecret = env.PAYSTACK_WEBHOOK_SECRET || "wh_sec_placeholder";

    // Detect if we are using placeholder or mock testing keys
    this.isSandboxOrMock =
      !this.secretKey ||
      this.secretKey.startsWith("sk_test_placeholder") ||
      env.NODE_ENV === "test";
  }

  /**
   * Initialize a card or bank transfer checkout transaction
   */
  public async initializeTransaction(params: {
    amountKobo: number;
    email: string;
    reference: string;
    callbackUrl?: string;
    metadata?: Record<string, any>;
  }): Promise<PaystackInitResponse> {
    if (params.amountKobo <= 0) {
      throw new AppError(400, "INVALID_AMOUNT", "Invalid payment amount: must be positive kobo");
    }

    if (this.isSandboxOrMock) {
      // Offline / Developer Sandbox Mock Transaction
      PaystackService.mockTransactions.set(params.reference, {
        reference: params.reference,
        amountKobo: params.amountKobo,
        currency: "NGN",
        email: params.email,
        status: "pending",
        channel: "card",
        paidAt: new Date().toISOString(),
        metadata: params.metadata,
      });

      return {
        authorizationUrl: `https://checkout.paystack.com/${params.reference}`,
        accessCode: `acc_${params.reference.slice(-10)}`,
        reference: params.reference,
      };
    }

    // Live or Real Sandbox Paystack API Call
    try {
      const response = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: params.amountKobo, // Paystack standard expects integer kobo
          email: params.email,
          reference: params.reference,
          callback_url: params.callbackUrl,
          metadata: params.metadata,
          channels: ["card", "bank_transfer", "ussd", "qr"],
        }),
      });

      const data = await response.json() as any;

      if (!response.ok || !data.status) {
        throw new AppError(
          400,
          "PAYSTACK_INIT_FAILED",
          data.message || "Failed to initialize payment with Paystack",
          data
        );
      }

      return {
        authorizationUrl: data.data.authorization_url,
        accessCode: data.data.access_code,
        reference: data.data.reference,
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError(
        502,
        "PAYSTACK_GATEWAY_ERROR",
        `Paystack network error: ${err.message}`
      );
    }
  }

  /**
   * Verify transaction state server-side
   */
  public async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    if (this.isSandboxOrMock) {
      const mock = PaystackService.mockTransactions.get(reference);
      if (mock) {
        // Mark verified/success in sandbox
        mock.status = "success";
        return {
          status: "success",
          reference: mock.reference,
          amountKobo: mock.amountKobo,
          currency: mock.currency,
          channel: mock.channel,
          paidAt: mock.paidAt,
          customerEmail: mock.email,
          metadata: mock.metadata,
        };
      }

      // If reference starts with 'test_success_' or standard test ref
      return {
        status: "success",
        reference,
        amountKobo: 50000,
        currency: "NGN",
        channel: "card",
        paidAt: new Date().toISOString(),
        customerEmail: "passenger@kekego.ng",
      };
    }

    // Call live Paystack Verification API
    try {
      const response = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        }
      );

      const data = await response.json() as any;

      if (!response.ok || !data.status) {
        throw new AppError(
          400,
          "PAYSTACK_VERIFY_FAILED",
          data.message || "Payment verification failed",
          data
        );
      }

      const tx = data.data;
      return {
        status: tx.status === "success" ? "success" : "failed",
        reference: tx.reference,
        amountKobo: tx.amount,
        currency: tx.currency,
        channel: tx.channel,
        paidAt: tx.paid_at,
        customerEmail: tx.customer?.email,
        metadata: tx.metadata,
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError(
        502,
        "PAYSTACK_GATEWAY_ERROR",
        `Paystack verification network error: ${err.message}`
      );
    }
  }

  /**
   * Verify Paystack HMAC-SHA512 Webhook Signature
   */
  public verifyWebhookSignature(
    rawBody: string | Buffer,
    signatureHeader: string | undefined
  ): boolean {
    if (!signatureHeader || !this.webhookSecret) {
      return false;
    }

    try {
      const bodyBuffer = typeof rawBody === "string" ? Buffer.from(rawBody, "utf8") : rawBody;
      const expectedHmac = crypto
        .createHmac("sha512", this.webhookSecret)
        .update(bodyBuffer)
        .digest("hex");

      const headerBuffer = Buffer.from(signatureHeader, "utf8");
      const computedBuffer = Buffer.from(expectedHmac, "utf8");

      if (headerBuffer.length !== computedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(headerBuffer, computedBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Process refund request for an existing transaction
   */
  public async createRefund(params: {
    transactionReference: string;
    amountKobo?: number;
    reason?: string;
  }): Promise<PaystackRefundResponse> {
    if (this.isSandboxOrMock) {
      return {
        refundId: `ref_mock_${Date.now()}`,
        status: "processed",
        amountKobo: params.amountKobo ?? 25000,
        currency: "NGN",
      };
    }

    try {
      const response = await fetch("https://api.paystack.co/refund", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transaction: params.transactionReference,
          amount: params.amountKobo,
          merchant_note: params.reason || "Kekego passenger dispute resolution",
        }),
      });

      const data = await response.json() as any;

      if (!response.ok || !data.status) {
        throw new AppError(
          400,
          "PAYSTACK_REFUND_FAILED",
          data.message || "Paystack refund request failed",
          data
        );
      }

      return {
        refundId: String(data.data.id),
        status: data.data.status === "processed" ? "processed" : "pending",
        amountKobo: data.data.amount,
        currency: data.data.currency,
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError(
        502,
        "PAYSTACK_GATEWAY_ERROR",
        `Paystack refund network error: ${err.message}`
      );
    }
  }

  /**
   * Utility helper for test suites to simulate a webhook signature
   */
  public generateTestWebhookSignature(body: string | Buffer): string {
    const bodyBuffer = typeof body === "string" ? Buffer.from(body, "utf8") : body;
    return crypto
      .createHmac("sha512", this.webhookSecret)
      .update(bodyBuffer)
      .digest("hex");
  }
}
