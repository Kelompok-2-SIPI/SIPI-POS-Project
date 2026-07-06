import type { Metadata, Viewport } from 'next';
import './globals.css';
import PwaRegister from '@/components/PwaRegister';
import AuthShield from '@/components/AuthShield';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'SIPI - Sistem Informasi POS & Inventaris Stok',
  description: 'PWA POS & Inventaris F&B UMKM',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SIPI',
  },
};

// viewport & themeColor wajib dipisah dari `metadata` (bukan lagi didukung di sana
// sejak Next.js versi ini) — sebelumnya themeColor lama (#d35400) tidak pernah benar-benar
// ter-render sebagai <meta name="theme-color"> karena salah tempat.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0064E0',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/icons/icon-192x192.png" />
      </head>
      <body>
        <PwaRegister />
        <AuthShield>
          <AppShell>
            {children}
          </AppShell>
        </AuthShield>
      </body>
    </html>
  );
}
