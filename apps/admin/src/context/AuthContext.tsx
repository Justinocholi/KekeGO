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
      const isLoginPage = pathname === "/login";
      if (!user && !isLoginPage) {
        router.push("/login");
      } else if (user && isLoginPage) {
        if (user.role === UserRole.PASSENGER) {
          router.push("/passenger");
        } else if (user.role === UserRole.DRIVER) {
          router.push("/driver");
        } else {
          router.push("/");
        }
      }
    }
  }, [user, isLoading, pathname, router]);

  const login = (token: string, loggedInUser: AppUser) => {
    setStoredToken(token);
    setUser(loggedInUser);
    if (loggedInUser.role === UserRole.PASSENGER) {
      router.push("/passenger");
    } else if (loggedInUser.role === UserRole.DRIVER) {
      router.push("/driver");
    } else {
      router.push("/");
    }
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
      if (targetRole === UserRole.PASSENGER) {
        router.push("/passenger");
      } else if (targetRole === UserRole.DRIVER) {
        router.push("/driver");
      } else {
        router.push("/");
      }
    } catch (e) {
      console.error("Role switch failed", e);
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
