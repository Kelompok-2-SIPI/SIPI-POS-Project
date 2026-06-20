import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SIPI POS',
  description: 'Sistem Informasi POS & Inventaris untuk UMKM F&B',
  manifest: '/manifest.json',
  themeColor: '#16a34a',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f9fafb' }}>
        {children}
      </body>
    </html>
  );
}
