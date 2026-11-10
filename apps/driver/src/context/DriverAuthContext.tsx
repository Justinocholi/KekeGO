import React, { createContext, useContext, useState, useEffect } from "react";
import {
  driverApi,
  setDriverAuthToken,
  type DriverUser,
} from "../services/api";
import {
  DriverVerificationStatus,
  DriverAvailabilityStatus,
} from "@kekego/shared";
import type { RegisterDriverInput } from "@kekego/validation";

interface DriverAuthContextType {
  user: DriverUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnline: boolean;
  verificationStatus: DriverVerificationStatus;
  login: (phoneNumber: string, password: string) => Promise<void>;
  register: (input: RegisterDriverInput) => Promise<void>;
  toggleAvailability: (shouldBeOnline: boolean) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const DriverAuthContext = createContext<DriverAuthContextType | undefined>(
  undefined
);

export const DriverAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<DriverUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const init = async () => {
      try {
        if (token) {
          const profile = await driverApi.getMe();
          setUser(profile);
        }
      } catch {
        setToken(null);
        setDriverAuthToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [token]);

  const login = async (phoneNumber: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await driverApi.login(phoneNumber, password);
      setToken(result.tokens.accessToken);
      setUser(result.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (input: RegisterDriverInput) => {
    setIsLoading(true);
    try {
      const result = await driverApi.register(input);
      setToken(result.tokens.accessToken);
      setUser(result.user);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAvailability = async (shouldBeOnline: boolean) => {
    const nextStatus = shouldBeOnline
      ? DriverAvailabilityStatus.ONLINE
      : DriverAvailabilityStatus.OFFLINE;

    const res = await driverApi.setAvailability(nextStatus);

    if (user && user.driverProfile) {
      setUser({
        ...user,
        driverProfile: {
          ...user.driverProfile,
          availabilityStatus: res.availabilityStatus,
          isOnline: res.isOnline,
        },
      });
    }
  };

  const logout = () => {
    setToken(null);
    setDriverAuthToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const profile = await driverApi.getMe();
      setUser(profile);
    } catch (err) {
      console.warn("Failed to refresh driver profile:", err);
    }
  };

  const verificationStatus =
    user?.driverProfile?.verificationStatus ??
    DriverVerificationStatus.UNVERIFIED;

  const isOnline =
    user?.driverProfile?.isOnline ??
    user?.driverProfile?.availabilityStatus === DriverAvailabilityStatus.ONLINE;

  return (
    <DriverAuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        isOnline,
        verificationStatus,
        login,
        register,
        toggleAvailability,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </DriverAuthContext.Provider>
  );
};

export const useDriverAuth = () => {
  const context = useContext(DriverAuthContext);
  if (!context) {
    throw new Error(
      "useDriverAuth must be used within a DriverAuthProvider"
    );
  }
  return context;
};
