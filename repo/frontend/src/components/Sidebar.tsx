'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'POS',
      href: '/pos',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
          <path d="M19 6H17V5C17 3.34 15.66 2 14 2H10C8.34 2 7 3.34 7 5V6H5C3.34 6 2 7.34 2 9V19C2 20.66 3.34 22 5 22H19C20.66 22 22 20.66 22 19V9C22 7.34 20.66 6 19 6ZM9 5C9 4.45 9.45 4 10 4H14C14.55 4 15 4.45 15 5V6H9V5ZM20 19C20 19.55 19.55 20 19 20H5C4.45 20 4 19.55 4 19V9C4 8.45 4.45 8 5 8H19C19.55 8 20 8.45 20 9V19Z"/>
          <path d="M12 11C10.34 11 9 12.34 9 14C9 15.66 10.34 17 12 17C13.66 17 15 15.66 15 14C15 12.34 13.66 11 12 11ZM12 15.5C11.17 15.5 10.5 14.83 10.5 14C10.5 13.17 11.17 12.5 12 12.5C12.83 12.5 13.5 13.17 13.5 14C13.5 14.83 12.83 15.5 12 15.5Z"/>
        </svg>
      )
    },
    {
      label: 'Inventaris',
      href: '/inventory',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
          <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z"/>
        </svg>
      )
    },
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
          <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM9 17H7V10H9V17ZM13 17H11V7H13V17ZM17 17H15V12H17V17Z"/>
        </svg>
      )
    },
    {
      label: 'Lainnya',
      href: '#', // placeholder
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
          <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
        </svg>
      )
    }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-logo-row">
          <div className="brand-icon" aria-hidden="true">
            <img src="/icons/brand-icon.png" alt="SIPI" />
          </div>
          <h1 className="brand-name">SIPI</h1>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href) && item.href !== '#';
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              <span className="sidebar-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <style jsx global>{`
        /* Menggunakan :global untuk memastikan <a> tag bawaan next/link 
           serta SVG menerima styling tanpa isu CSS Module scoping */
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 280px;
          background-color: var(--color-canvas);
          border-right: 1px solid var(--color-outline);
          display: flex;
          flex-direction: column;
          z-index: 1000;
        }
        
        .sidebar-header {
          padding: 32px 24px 24px;
        }
        
        .sidebar .brand-logo-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .sidebar .brand-icon {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 100, 224, 0.25);
          flex-shrink: 0;
        }
        .sidebar .brand-icon img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        
        .sidebar .brand-name {
          font-family: var(--font-jakarta);
          font-size: 28px;
          font-weight: 700;
          color: var(--color-primary);
          letter-spacing: -0.02em;
          margin: 0;
          background: transparent;
        }
        
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 0 16px;
        }
        
        /* Memaksa Link (a tag) untuk tidak punya default link style (seperti garis bawah & ungu) */
        a.sidebar-nav-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          text-decoration: none !important;
          transition: background-color var(--transition-fast), color var(--transition-fast);
        }
        
        a.sidebar-nav-item:hover:not(.active) {
          background-color: var(--color-surface-soft);
          color: var(--text-primary);
        }
        
        a.sidebar-nav-item.active {
          background-color: var(--color-primary) !important;
          color: #fff !important;
          box-shadow: 0 2px 8px rgba(0, 100, 224, 0.2);
        }
        
        .sidebar-nav-label {
          font-family: var(--font-jakarta);
          font-size: var(--font-size-body);
          font-weight: 600;
        }
      `}</style>
    </aside>
  );
}
