import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavProvider } from "@/context/NavContext";
import { AuthProvider } from "@/context/AuthContext";
import { AppShell } from "@/components/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Murtazim Academy SMS",
  description: "School Management System for Murtazim Academy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex bg-[#f3f4f6] min-h-screen overflow-x-hidden`}
      >
        <AuthProvider>
          <NavProvider>
            <AppShell>
              {children}
            </AppShell>
          </NavProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
