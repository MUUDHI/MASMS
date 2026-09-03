import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { NavProvider } from "@/context/NavContext";

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
        <NavProvider>
          <Sidebar />
          <div className="flex-1 lg:ml-64 flex flex-col min-h-screen min-w-0">
            <Header />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
              {children}
            </main>
          </div>
        </NavProvider>
      </body>
    </html>
  );
}
