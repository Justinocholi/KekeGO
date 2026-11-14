"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiRequest, getStoredToken, setStoredToken, clearStoredToken } from "../lib/api";
import { UserRole } from "@kekego/shared";

export interface AppUser {
  id: string;
  phoneNumber: string;
  email?: string | null;
  firstName: string;
  lastName: string;
  role: UserRole;
  passengerProfile?: Record<string, unknown> | null;
  driverProfile?: Record<string, unknown> | null;
  partner?: Record<string, unknown> | null;
  wallet?: Record<string, unknown> | null;
}

interface AuthContextType {
  user: AppUser | null;
  isLoading: boolean;
  login: (token: string, user: AppUser) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
}

const PUBLIC_ROUTES = [
  "/",
  "/how-it-works",
  "/become-a-driver",
  "/login",
  "/register",
  "/driver/login",
  "/driver/register",
  "/admin/login",
  "/forgot-password",
];

export function getRoleDestination(user: AppUser): string {
  if (user.role === UserRole.ADMIN) return "/admin";
  if (user.role === UserRole.DRIVER) {
    const isPending =
      user.driverProfile &&
      (user.driverProfile as { verificationStatus?: string }).verificationStatus === "PENDING_REVIEW";
    return isPending ? "/driver/onboarding" : "/driver";
  }
  if (user.role === UserRole.PASSENGER) return "/passenger";
  if (user.role === UserRole.PARTNER) return "/partners";
  return "/";
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  const logout = useCallback(() => {
    clearStoredToken();
    setUser(null);
    router.push("/login");
  }, [router]);

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await apiRequest<AppUser>("/users/me");
      setUser(data);
    } catch {
      clearStoredToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (!isLoading) {
      const isPublic = PUBLIC_ROUTES.includes(pathname);
      const isAuthPage = [
        "/login",
        "/register",
        "/driver/login",
        "/driver/register",
        "/admin/login",
      ].includes(pathname);

      if (!user && !isPublic) {
        router.push("/login");
      } else if (user && isAuthPage) {
        router.push(getRoleDestination(user));
      } else if (user) {
        // Enforce role-based boundaries
        if (user.role === UserRole.PASSENGER) {
          const forbiddenPrefixes = [
            "/admin",
            "/driver",
            "/partners",
            "/finance",
            "/vehicles",
            "/pricing",
            "/service-areas",
          ];
          if (forbiddenPrefixes.some((p) => pathname.startsWith(p))) {
            router.push("/passenger");
          }
        } else if (user.role === UserRole.DRIVER) {
          const forbiddenPrefixes = [
            "/admin",
            "/users",
            "/finance",
            "/partners",
            "/pricing",
            "/service-areas",
          ];
          if (forbiddenPrefixes.some((p) => pathname.startsWith(p))) {
            router.push("/driver");
          }
        }
      }
    }
  }, [user, isLoading, pathname, router]);

  const login = (token: string, loggedInUser: AppUser) => {
    setStoredToken(token);
    setUser(loggedInUser);
    const dest = getRoleDestination(loggedInUser);
    router.push(dest);
  };

  const switchRole = async (targetRole: UserRole) => {
    let identifier = "admin@kekego.ng";
    if (targetRole === UserRole.PASSENGER) {
      identifier = "passenger.amina@gmail.com";
    } else if (targetRole === UserRole.DRIVER) {
      identifier = "driver.musa@kekego.ng";
    } else if (targetRole === UserRole.PARTNER) {
      identifier = "partner@karutransit.ng";
    }

    try {
      setIsLoading(true);
      const data = await apiRequest<{ user: AppUser; tokens: { accessToken: string } }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password: "Password123!" }),
      });
      setStoredToken(data.tokens.accessToken);
      setUser(data.user);
      const dest = getRoleDestination(data.user);
      router.push(dest);
    } catch {
      // Keep state
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        refreshUser,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
