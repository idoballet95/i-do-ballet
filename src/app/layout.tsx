import type { Metadata, Viewport } from 'next';
import './globals.css';
import BottomNav from '@/components/BottomNav';
import Sidebar from '@/components/Sidebar';
import { EventsProvider } from '@/lib/events-store';

export const metadata: Metadata = {
  title: 'i.do.ball.et',
  description: 'Futsal & Ballet personal tracker',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'i.do.ball.et',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#FFFFFF',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="bg-white lg:bg-gray-50">
        <EventsProvider>
          {/* ── Desktop layout ─────────────────────────── */}
          <div className="hidden lg:flex min-h-screen">
            <Sidebar />
            <main className="ml-56 flex-1 min-h-screen bg-white overflow-y-auto">
              <div className="max-w-3xl mx-auto">
                {children}
              </div>
            </main>
          </div>

          {/* ── Mobile layout ──────────────────────────── */}
          <div className="lg:hidden max-w-lg mx-auto min-h-dvh bg-white shadow-[0_0_60px_rgba(0,0,0,0.06)]">
            <main className="pb-24">
              {children}
            </main>
            <BottomNav />
          </div>
        </EventsProvider>
      </body>
    </html>
  );
}
