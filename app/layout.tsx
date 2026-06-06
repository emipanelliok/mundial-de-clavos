import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  variable: "--font-bebas",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mundial de Clavos 2026",
  description: "El torneo definitivo del auto más clavo de la historia argentina. Nominá, votá, y elegí al Gran Campeón.",
  openGraph: {
    title: "Mundial de Clavos 2026",
    description: "El torneo definitivo del auto más clavo de la historia argentina.",
    type: "website",
    url: "https://mundial-de-clavos.vercel.app",
    images: [{ url: "/og.png", width: 1600, height: 900, alt: "Mundial de Clavos 2026" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mundial de Clavos 2026",
    description: "El torneo definitivo del auto más clavo de la historia argentina.",
    images: ["/og.png"],
  },
  metadataBase: new URL("https://mundial-de-clavos.vercel.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${bebasNeue.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
      <GoogleAnalytics gaId="G-SD895EQ7MB" />
    </html>
  );
}
