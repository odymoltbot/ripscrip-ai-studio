import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RIPscrip AI Studio",
  description: "AI-powered revival of 1990s BBS vector graphics. Generate retro RIPscrip art using Gemini AI.",
  keywords: ["RIPscrip", "BBS", "retro graphics", "vector art", "AI", "Gemini", "EGA"],
  openGraph: {
    title: "RIPscrip AI Studio",
    description: "AI-powered revival of 1990s BBS vector graphics",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
