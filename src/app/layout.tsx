import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pakseekers.com"),
  title: {
    default: "PakSeekers — Premier Entrance Examination Preparation Platform",
    template: "%s | PakSeekers",
  },
  description:
    "Prepare. Achieve. Lead. PakSeekers is Pakistan's premier entrance test preparation platform for MDCAT, ECAT, NUST NET, FAST, and GIKI with syllabus-mapped MCQs, diagnostic tests, and real-time performance analytics.",
  keywords: [
    "PakSeekers",
    "MDCAT preparation",
    "ECAT entry test",
    "NUST NET",
    "FAST entry test",
    "GIKI entry test",
    "Pakistan university admissions",
    "medical college entry test",
    "engineering test prep",
    "MCQ practice Pakistan",
  ],
  authors: [{ name: "PakSeekers Engineering Team" }],
  creator: "PakSeekers",
  publisher: "PakSeekers",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/logo-icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: "https://pakseekers.com",
    title: "PakSeekers — Premier Entrance Examination Preparation Platform",
    description:
      "Prepare. Achieve. Lead. Master MDCAT, ECAT, and NUST NET with syllabus-mapped practice tests, diagnostic simulations, and verified explanations.",
    siteName: "PakSeekers",
    images: [
      {
        url: "/logo.png",
        width: 1080,
        height: 1080,
        alt: "PakSeekers — Prepare • Achieve • Lead",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PakSeekers — Premier Entrance Examination Preparation Platform",
    description:
      "Prepare. Achieve. Lead. Master MDCAT, ECAT, and NUST NET with syllabus-mapped practice tests.",
    images: ["/logo.png"],
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  themeColor: "#011640",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full ${inter.variable}`} suppressHydrationWarning>
      <body
        className={`h-full font-sans antialiased bg-background text-text-primary`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
