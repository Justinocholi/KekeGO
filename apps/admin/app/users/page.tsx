"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Sidebar } from "../../src/components/Sidebar";
import { Header } from "../../src/components/Header";
import { StatusChip } from "../../src/components/StatusChip";
import { EmptyState } from "../../src/components/EmptyState";
import { apiRequest } from "../../src/lib/api";
import { RefreshCw } from "lucide-react";

interface UserRecord {
  id: string;
  phoneNumber: string;
  email?: string | null;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  driverProfile?: {
    id: string;
    verificationStatus: string;
    rating: number;
    totalTrips: number;
    isOnline: boolean;
  } | null;
  passengerProfile?: {
    id: string;
    rating: number;
    totalRides: number;
  } | null;
}

const ROLES = [
  { label: "All Users", value: "" },
  { label: "Passengers", value: "PASSENGER" },
  { label: "Drivers", value: "DRIVER" },
  { label: "Partners", value: "PARTNER" },
  { label: "Admins", value: "ADMIN" },
];

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = selectedRole
        ? `/admin/users?role=${selectedRole}`
        : "/admin/users";
      const data = await apiRequest<UserRecord[]>(endpoint);
      setUsers(data);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedRole]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />

      <div className="flex-1 ml-64 flex flex-col">
        <Header
          title="User Accounts & Identity"
          subtitle="Directory of passengers, verified operators, and administrative accounts"
          actions={
            <button
              onClick={() => void fetchUsers()}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs flex items-center space-x-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          }
        />

        <main className="flex-1 p-8 overflow-y-auto space-y-6">
          {/* Role Filters */}
          <div className="flex space-x-2 border-b border-slate-800 pb-4">
            {ROLES.map((role) => (
              <button
                key={role.value}
                onClick={() => setSelectedRole(role.value)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  selectedRole === role.value
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>

          {/* Users Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {loading ? (
              <div className="p-8 space-y-4 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 bg-slate-800/60 rounded-xl" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="No Users Found"
                  description="No user records match the specified role filter."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 uppercase font-semibold">
                      <th className="py-3.5 px-6">User Name</th>
                      <th className="py-3.5 px-6">Phone Number</th>
                      <th className="py-3.5 px-6">Email Address</th>
                      <th className="py-3.5 px-6">Platform Role</th>
                      <th className="py-3.5 px-6">Activity / Rating</th>
                      <th className="py-3.5 px-6">Registered At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-4 px-6 font-semibold text-white">
                          {user.firstName} {user.lastName}
                        </td>
                        <td className="py-4 px-6 font-mono text-slate-300">
                          {user.phoneNumber}
                        </td>
                        <td className="py-4 px-6 text-slate-400">
                          {user.email || <span className="italic text-slate-400">Not set</span>}
                        </td>
                        <td className="py-4 px-6">
                          <StatusChip status={user.role} />
                        </td>
                        <td className="py-4 px-6">
                          {user.driverProfile ? (
                            <span className="text-amber-400 font-mono">
                              ⭐ {Number(user.driverProfile.rating).toFixed(1)} ({user.driverProfile.totalTrips} trips)
                            </span>
                          ) : user.passengerProfile ? (
                            <span className="text-slate-300 font-mono">
                              {user.passengerProfile.totalRides} rides
                            </span>
                          ) : (
                            <span className="text-slate-400">Admin Staff</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-slate-400 font-mono text-[11px]">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
