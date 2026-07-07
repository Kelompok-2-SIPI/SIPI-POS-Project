'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthShield({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('sipi_logged_in') === 'true';
    const isPublicRoute = pathname === '/login' || pathname === '/register';

    if (!isLoggedIn && !isPublicRoute) {
      setAuthorized(false);
      router.replace('/login');
    } else if (isLoggedIn && isPublicRoute) {
      setAuthorized(true);
      router.replace('/pos');
    } else {
      setAuthorized(true);
    }
    setLoading(false);
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="shield-loader">
        <div className="spinner"></div>
        <style jsx>{`
          .shield-loader {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background-color: #f9f6f0;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #e8e2d5;
            border-radius: 50%;
            border-top-color: hsl(24 90% 46%);
            animation: spin 1s ease-in-out infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // If not logged in and on a private route, don't render anything while redirecting
  if (!authorized && pathname !== '/login') {
    return null;
  }

  return <>{children}</>;
}
