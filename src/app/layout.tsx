import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { MaintenanceGate } from "@/components/MaintenanceGate";
import "../styles/theme.global.scss";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "App",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.variable}>
        <MaintenanceGate>{children}</MaintenanceGate>
      </body>
    </html>
  );
}
