import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import AuthLayoutWrapper from "@/components/layout/AuthLayoutWrapper";

export const metadata: Metadata = {
  title: "Traffic Simulation",
  description: "Real-time AI Traffic Simulation & Queue Modeling",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <AuthLayoutWrapper>
            {children}
          </AuthLayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
