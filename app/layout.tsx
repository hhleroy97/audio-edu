import type { Metadata } from "next";
import { Share_Tech_Mono } from "next/font/google";
import "./globals.css";

const shareTechMono = Share_Tech_Mono({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-module",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Synthesis Learning Lab",
  description:
    "Interactive sound-synthesis experiments — make invisible systems visible.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={shareTechMono.variable}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
