// app/layout.tsx
import type { Metadata } from "next";
import {
  Space_Grotesk,
  IBM_Plex_Sans,
  IBM_Plex_Mono,
  Geist,
} from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import ClientLayout from "@/components/layout/layout-client";
import { ThemeProvider } from "next-themes";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aura – AI Space Weather Intelligence",
  description:
    "Real‑time aurora forecasts, solar storm tracking, and space weather insights powered by AI.",
  icons: {
    icon: "/logo-black.svg",
    apple: "/logo-black.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(
        spaceGrotesk.variable,
        ibmPlexSans.variable,
        ibmPlexMono.variable,
        "font-sans",
        geist.variable,
      )}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen bg-void-navy font-body text-starlight antialiased" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <ClientLayout>{children}</ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
