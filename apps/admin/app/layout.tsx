import type { Metadata } from "next";
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
      <body className="antialiased bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
