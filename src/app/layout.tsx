import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Playfair_Display, Caveat } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SiteIntro } from "@/components/brand/site-intro";
import { SITE } from "@/lib/config";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-jb",
  display: "swap",
});

// High-contrast Didone serif — the editorial "luxury business card" voice used
// for the wordmark, headlines and broadcast chyrons.
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

// The red handwritten accent — echoes the "every Thursday" note on their header.
const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-hand",
  display: "swap",
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} — Community Headquarters`,
    template: `%s · ${SITE.short}`,
  },
  description: SITE.tagline,
  applicationName: SITE.name,
};

export const viewport: Viewport = {
  themeColor: "#0a0c12",
  width: "device-width",
  initialScale: 1,
};

// Applies the saved theme before paint so there's no flash. Light by default.
const themeInit = `(function(){try{if(localStorage.getItem('mb-theme')==='dark'){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrains.variable} ${playfair.variable} ${caveat.variable}`}
    >
      <body className="min-h-screen font-sans">
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <Providers>{children}</Providers>
        <SiteIntro />
      </body>
    </html>
  );
}
