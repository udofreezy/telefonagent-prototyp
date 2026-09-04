import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clickfabrik – KI-Telefonassistent",
  description:
    "Intelligenter Telefonassistent für Clickfabrik – Anrufe entgegennehmen, Leads qualifizieren und Erstgespräche automatisch vereinbaren.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${inter.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background">
        <Header />
        <main className="flex-1 bg-grid">{children}</main>
        <footer className="py-2 text-center text-[10px] text-muted-foreground/50">
          Deploy-Test: 2026-09-05
        </footer>
      </body>
    </html>
  );
}
