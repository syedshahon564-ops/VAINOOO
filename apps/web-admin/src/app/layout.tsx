import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ThemeProvider } from '@/components/ThemeProvider';
import { LanguageProvider } from '@/components/LanguageProvider';
import AutoSchedulerRunner from '@/components/AutoSchedulerRunner';
import MobileInstallBanner from '@/components/MobileInstallBanner';

export const viewport: Viewport = {
  themeColor: '#dc2626',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'FF RIVAL TOUR BD - Bangladesh Free Fire Esports Tournament Arena',
  description:
    'Join daily Free Fire Battle Royale, Clash Squad, and 1v1 custom tournaments on FF RIVAL TOUR BD. Instant bKash and Nagad payouts with automated anti-cheat.',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-red-500 selection:text-white">
        <ThemeProvider>
          <LanguageProvider>
            <AutoSchedulerRunner />
            <Navbar />
            <div className="min-h-[calc(100vh-160px)]">{children}</div>
            <MobileInstallBanner />
            <Footer />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
