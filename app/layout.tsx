import type {
  Metadata,
  Viewport,
} from "next";

import "./globals.css";

import AppShell from "@/components/app-shell";
import PWARegister from "@/components/pwa-register";

export const metadata: Metadata = {
  title: {
    default: "CreatorOps",
    template: "%s | CreatorOps",
  },
  description:
    "Cloud-based content planning, approval and analytics SaaS",
  applicationName: "CreatorOps",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CreatorOps",
  },
  icons: {
    icon: [
      {
        url: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <PWARegister />

        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}