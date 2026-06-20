'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function PwaRegister() {
  const [isOffline, setIsOffline] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    // 1. Register Service Worker
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
          },
          (err) => {
            console.log('ServiceWorker registration failed: ', err);
          }
        );
      });
    }

    // 2. Network Status Monitoring
    const handleOnline = () => {
      setIsOffline(false);
      triggerOfflineSync();
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOffline(!navigator.onLine);

    if (navigator.onLine) {
      triggerOfflineSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerOfflineSync = async () => {
    try {
      const stored = localStorage.getItem('sipi_offline_transactions');
      if (!stored) return;

      const transactions = JSON.parse(stored);
      if (!Array.isArray(transactions) || transactions.length === 0) return;

      setSyncing(true);
      setSyncMessage(`Menghubungkan... Mensinkronisasi ${transactions.length} transaksi offline.`);

      const res = await apiFetch('/transactions/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.removeItem('sipi_offline_transactions');
        setSyncMessage(`Sukses! ${data.syncedCount} transaksi offline tersinkronisasi.`);
        
        // Dispatch custom event to refresh sales data in views
        window.dispatchEvent(new Event('sipi_sync_completed'));

        setTimeout(() => {
          setSyncMessage('');
          setSyncing(false);
        }, 4000);
      } else {
        throw new Error(data.error || 'Sinkronisasi gagal');
      }
    } catch (err: any) {
      console.error('Offline sync error:', err);
      setSyncMessage('Gagal mensinkronisasi transaksi offline. Akan dicoba lagi nanti.');
      setTimeout(() => {
        setSyncing(false);
      }, 5000);
    }
  };

  return (
    <>
      {isOffline && (
        <div className="offline-banner">
          <span className="offline-dot"></span>
          Anda sedang offline. Mode Kasir tetap aktif secara lokal.
        </div>
      )}
      {syncing && syncMessage && (
        <div className="sync-banner">
          <span className="sync-spinner"></span>
          {syncMessage}
        </div>
      )}
      <style jsx global>{`
        .offline-banner {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background-color: var(--danger-color, #e74c3c);
          color: white;
          text-align: center;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .offline-dot {
          width: 8px;
          height: 8px;
          background-color: white;
          border-radius: 50%;
          display: inline-block;
          animation: pulse 1.5s infinite;
        }
        .sync-banner {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background-color: var(--success-color, #2ecc71);
          color: white;
          text-align: center;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .sync-spinner {
          width: 12px;
          height: 12px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
        }
        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
