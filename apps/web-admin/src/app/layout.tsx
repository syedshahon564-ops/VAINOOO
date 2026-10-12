import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ThemeProvider } from '@/components/ThemeProvider';
import { LanguageProvider } from '@/components/LanguageProvider';
import AutoSchedulerRunner from '@/components/AutoSchedulerRunner';
import AppUpdateModal from '@/components/AppUpdateModal';
import NotificationPermissionModal from '@/components/NotificationPermissionModal';
import AndroidBackHandler from '@/components/AndroidBackHandler';

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
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var CURRENT_VERSION = '4.0.0';
                  var storedVer = localStorage.getItem('ff_app_build_version');

                  // Register production Service Worker for Push Notifications
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.register('/sw.js').catch(function() {});
                  }

                  // Clean up stale CacheStorage on major version bump
                  if (storedVer !== CURRENT_VERSION && 'caches' in window) {
                    caches.keys().then(function(keys) {
                      for (var j = 0; j < keys.length; j++) {
                        if (keys[j] !== 'ff-rivals-v4') {
                          caches.delete(keys[j]);
                        }
                      }
                    });
                  }

                  // Force instant reload if running on older build version
                  if (storedVer !== CURRENT_VERSION) {
                    localStorage.setItem('ff_app_build_version', CURRENT_VERSION);
                    if (!sessionStorage.getItem('ff_auto_updated_v4')) {
                      sessionStorage.setItem('ff_auto_updated_v4', 'true');
                      window.location.reload();
                    }
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased selection:bg-red-500 selection:text-white">
        <ThemeProvider>
          <LanguageProvider>
            <AndroidBackHandler />
            <AutoSchedulerRunner />
            <NotificationPermissionModal />
            <Navbar />
            <div className="min-h-[calc(100vh-160px)]">{children}</div>
            <AppUpdateModal />
            <Footer />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
