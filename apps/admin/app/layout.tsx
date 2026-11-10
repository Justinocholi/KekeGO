import type { Metadata } from "next";
import { AuthProvider } from "../src/context/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kekego — Operations & Admin Portal",
  description: "Administrative control center for Kekego mobility platform in Nasarawa State, Nigeria",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
