"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiRequest, getStoredToken, setStoredToken, clearStoredToken } from "../lib/api";
import { UserRole } from "@kekego/shared";

interface AdminUser {
  id: string;
  phoneNumber: string;
  email?: string | null;
  firstName: string;
  lastName: string;
  role: UserRole;
}

interface AuthContextType {
  user: AdminUser | null;
  isLoading: boolean;
  login: (token: string, user: AdminUser) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
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
      const data = await apiRequest<AdminUser>("/users/me");
      if (data.role !== UserRole.ADMIN) {
        // Only ADMINs are allowed in the Back-office Admin portal
        clearStoredToken();
        setUser(null);
        router.push("/login?error=unauthorized_role");
        return;
      }
      setUser(data);
    } catch {
      clearStoredToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (!isLoading) {
      const isLoginPage = pathname === "/login";
      if (!user && !isLoginPage) {
        router.push("/login");
      } else if (user && isLoginPage) {
        router.push("/");
      }
    }
  }, [user, isLoading, pathname, router]);

  const login = (token: string, loggedInUser: AdminUser) => {
    setStoredToken(token);
    setUser(loggedInUser);
    router.push("/");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        refreshUser,
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
