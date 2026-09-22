import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PakSeekers",
    template: "%s | PakSeekers",
  },
  description:
    "PakSeekers — Pakistan's scalable test-preparation platform for university entry tests and job assessments.",
  keywords: ["PakSeekers", "test preparation", "entry test", "NAT", "NTS", "Pakistan education"],
  authors: [{ name: "PakSeekers" }],
  robots: "noindex, nofollow", // development — update before production launch
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
