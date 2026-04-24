import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "TrafficSim Demo",
  description: "Standalone traffic simulation demo with mock data",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Navbar />
        <main style={{ padding: "1.5rem", paddingTop: "5rem", maxWidth: "1280px", margin: "0 auto" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
