import type { UserRole } from "@kekego/database";

export interface TokenPayload {
  userId: string;
  role?: UserRole;
  phoneNumber?: string;
  partnerId?: string | null;
  driverId?: string | null;
  passengerId?: string | null;
  tokenType?: "access" | "refresh";
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: TokenPayload;
    user: TokenPayload;
  }
}
