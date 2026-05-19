import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import { AuthProvider } from "@/context/AuthContext";

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
          <Navbar />
          <main style={{ padding: "2rem", paddingTop: "5rem", maxWidth: "1440px", margin: "0 auto" }}>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
