import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono, Spline_Sans, Geist } from "next/font/google";
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

// Marketing site only: Geist for display headlines, Spline Sans for body.
const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const splineSans = Spline_Sans({
  variable: "--font-spline",
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
      className={`${plexSans.variable} ${plexMono.variable} ${geist.variable} ${splineSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
