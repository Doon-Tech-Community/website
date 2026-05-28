import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import Nav from "@/components/Nav";
import SoundProvider from "@/components/SoundProvider";
import PokedexTilt from "@/components/PokedexTilt";
import DeviceControls from "@/components/DeviceControls";
import PowerButton from "@/components/PowerButton";
import Link from "next/link";
import { Suspense } from "react";

const press = Press_Start_2P({ subsets: ["latin"], weight: "400", variable: "--font-press" });
const vt = VT323({ subsets: ["latin"], weight: "400", variable: "--font-vt" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Doon Tech Community Pokedex",
    template: "%s · DTC Pokedex"
  },
  description: "A collectible attendee index for every face in the Doon Tech Community.",
  applicationName: "DTC Pokedex",
  openGraph: {
    type: "website",
    siteName: "Doon Tech Community Pokedex",
    title: "Doon Tech Community Pokedex",
    description: "A collectible attendee index for every face in the Doon Tech Community.",
    images: [{ url: "/og", width: 1200, height: 630, alt: "Doon Tech Community Pokedex" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Doon Tech Community Pokedex",
    description: "A collectible attendee index for every face in the Doon Tech Community.",
    images: ["/og"]
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }]
  },
  robots: { index: true, follow: true }
};

export const viewport: Viewport = {
  themeColor: "#F26B6F",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${press.variable} ${vt.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-[var(--led-yel)] focus:text-[var(--shell-ink)] focus:px-3 focus:py-2"
        >
          Skip to content
        </a>

        <div className="mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 dex-stage">
          <div className="dex-shell">
            <div className="device-topbar flex items-center gap-4 mb-4">
              <Link href="/" aria-label="Back to landing" className="shrink-0">
                <div className="led-lens" aria-hidden />
              </Link>
              <div className="flex items-center gap-2" aria-hidden>
                <span className="led led-red" />
                <span className="led led-yel" />
                <span className="led led-grn" />
              </div>
              <a
                href="/community"
                target="_blank"
                rel="noopener noreferrer"
                className="community-chip chip chip-success ml-auto"
                style={{ fontSize: "0.6rem", padding: "0.5rem 0.7rem" }}
                aria-label="Join the Doon Tech Community on WhatsApp"
                title="Join the Doon Tech Community on WhatsApp"
              >
                <span className="led led-grn" aria-hidden style={{ width: 8, height: 8 }} />
                JOIN COMMUNITY
              </a>
            </div>

            <div className="device-divider dex-divider mb-4" aria-hidden />

            <Suspense fallback={<div style={{ minHeight: 44 }} />}>
              <Nav />
            </Suspense>

            <div className="device-screen lcd-panel crt mt-4">
              <main id="main" className="min-h-[60vh] relative z-[1]">
                {children}
              </main>
            </div>

            <Suspense fallback={<div className="device-controls mt-5" style={{ minHeight: 84 }} />}>
              <DeviceControls />
            </Suspense>

            <div className="device-divider device-divider--bottom dex-divider mt-4" aria-hidden />

            <footer
              className="device-footer flex items-center justify-between gap-4 mt-3 text-xs sm:text-sm text-white"
              style={{ textShadow: "0 1px 0 rgba(0,0,0,0.35)" }}
            >
              <PowerButton />
              <div className="device-footer__place text-center">v1 · Dehradun</div>
              <a
                href="https://github.com/Doon-Tech-Community/website"
                target="_blank"
                rel="noopener noreferrer"
                className="device-github-link chip"
                style={{ fontSize: "0.55rem", padding: "0.45rem 0.65rem" }}
                aria-label="View source on GitHub"
                title="View source on GitHub"
              >
                GITHUB ↗
              </a>
            </footer>
          </div>
        </div>
        <SoundProvider />
        <PokedexTilt />
      </body>
    </html>
  );
}
