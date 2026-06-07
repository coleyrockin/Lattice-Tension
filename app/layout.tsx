import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Aether",
  description: "A WebGPU tension field — luminous filament architectures under procedural strain and release.",
  metadataBase: new URL("https://aether.vercel.app"),
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Aether",
    description: "Immersive procedural art — a vast field of counter-rotating helical filaments under tension.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#000000] text-[#f8f4ff] overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
