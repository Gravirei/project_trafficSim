import type { Metadata, Viewport } from 'next';
import './globals.css';
import { RootShell } from '@/components/layout/RootShell';

export const metadata: Metadata = {
  title: 'GREENWAVE — Traffic Signal Control Simulation',
  description:
    'A traffic signal is the most safety-critical machine most people touch every day. GREENWAVE models the controllers behind that decision across a network of four very different junctions.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  themeColor: '#101114',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Overpass:wght@400;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
        />
      </head>
      <body>
        <RootShell>{children}</RootShell>
        {/*
          Lucide UMD bundle — defer so it loads after parsing, not blocking
          first paint. Icons render once `window.lucide` is available
          (handled by useLucideRefresh in each view).
        */}
        <script
          src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"
          defer
        />
      </body>
    </html>
  );
}
