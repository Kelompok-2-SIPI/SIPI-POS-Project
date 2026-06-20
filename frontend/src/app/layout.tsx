import type { Metadata } from 'next';
import './globals.css';
import PwaRegister from '@/components/PwaRegister';
import BottomNav from '@/components/BottomNav';
import AuthShield from '@/components/AuthShield';

export const metadata: Metadata = {
  title: 'SIPI - Sistem Informasi POS & Inventaris Stok',
  description: 'PWA POS & Inventaris F&B UMKM',
  manifest: '/manifest.json',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  themeColor: '#d35400',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SIPI',
  },
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
          <div className="main-wrapper">
            {children}
          </div>
          <BottomNav />
        </AuthShield>
      </body>
    </html>
  );
}
