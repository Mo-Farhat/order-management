import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono, Spline_Sans, Geist, Poppins, Fraunces, Nunito } from "next/font/google";
import "./globals.css";
import { APP_NAME } from "@/lib/constants";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Marketing site: Geist for the shorter wordmark-style labels (`.mkt-serif` —
// auth headlines, price display), Poppins for the actual page h1/h2s (matches
// the logo, which is set in Poppins Bold), Spline Sans for body.
const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

const splineSans = Spline_Sans({
  variable: "--font-spline",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Public storefront only: curated optional families, scoped to `.sf-theme`
// via `data-sf-font` in globals.css.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `${APP_NAME} — take orders from your DMs`,
  description:
    "A mini storefront plus an order desk for sellers on Instagram and WhatsApp. Customers browse and send their order straight to your DMs; you track it to delivery.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexMono.variable} ${geist.variable} ${poppins.variable} ${splineSans.variable} ${fraunces.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
