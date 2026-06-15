import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
