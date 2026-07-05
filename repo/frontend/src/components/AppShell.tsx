'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Hide shell on login page
  if (pathname === '/login') {
    return (
      <div className="main-wrapper">
        {children}
      </div>
    );
  }

  return (
    <>
      <div className="desktop-sidebar">
        <Sidebar />
      </div>
      
      <div className="app-main-content">
        <div className="main-wrapper">
          {children}
        </div>
      </div>
      
      <div className="mobile-bottom-nav">
        <BottomNav />
      </div>

      <style jsx global>{`
        .desktop-sidebar {
          display: none;
        }
        .mobile-bottom-nav {
          display: block;
        }

        @media (min-width: 1024px) {
          .desktop-sidebar {
            display: block;
          }
          .mobile-bottom-nav {
            display: none;
          }
          .app-main-content {
            margin-left: 280px;
          }
          /* Adjust main-wrapper behavior on desktop when sidebar is present */
          body {
             padding-bottom: 0; /* Remove bottom nav offset */
          }
          .main-wrapper {
            max-width: 1200px; /* Use more space on desktop */
            margin: 0; /* Remove auto centering when there's a sidebar */
            padding: 32px 40px;
          }
        }
      `}</style>
    </>
  );
}
