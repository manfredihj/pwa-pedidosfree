import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PedidosFree",
  description: "Pedidos online para tu restaurante",
};

export const viewport: Viewport = {
  themeColor: "#d32f2f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={geistSans.variable}>
      <head>
        <script
          src={`https://maps.googleapis.com/maps/api/js?v=3&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=geometry,places`}
          async
          defer
        />
      </head>
      <body>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <CssBaseline />
          {children}
          <ServiceWorkerRegister />
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
