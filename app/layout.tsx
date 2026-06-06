import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LATTICE",
  description:
    "A sacred digital observatory of unseen geometry, light, and the beauty of continuing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}