import type { Metadata } from "next";
import { Inter, Pangolin, Rubik_Dirt } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const pangolin = Pangolin({
  weight: "400",
  variable: "--font-pangolin",
  subsets: ["latin"],
});

const rubikDirt = Rubik_Dirt({
  weight: "400",
  variable: "--font-rubik-dirt",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bloom - AI Voice Assistant for Elderly Care",
  description:
    "AI-powered voice companion that detects cognitive decline, provides companionship, and helps with daily tasks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${pangolin.variable} ${rubikDirt.variable} antialiased font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
