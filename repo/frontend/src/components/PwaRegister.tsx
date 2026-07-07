'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface SyncConflictIngredient {
  ingredientId: string;
  ingredientName: string;
  totalNeeded: number;
  txCount: number;
}

interface SyncConflictInfo {
  conflictedCount: number;
  ingredients: SyncConflictIngredient[];
}

export default function PwaRegister() {
  const [isOffline, setIsOffline] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [conflictInfo, setConflictInfo] = useState<SyncConflictInfo | null>(null);

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

        // Konflik stok (butuh review manual Owner) TIDAK dimasukkan ke sync-banner yang
        // auto-dismiss di atas — dipisah ke modal sendiri yang cuma bisa ditutup manual,
        // supaya tidak gampang terlewat begitu saja.
        if (data.hasConflicts) {
          const conflictedResults = (data.syncedResults || []).filter((r: any) => r.hasConflict);
          const byIngredient = new Map<string, SyncConflictIngredient>();
          for (const result of conflictedResults) {
            for (const c of result.conflicts || []) {
              const existing = byIngredient.get(c.ingredientId);
              if (existing) {
                existing.totalNeeded += c.needed;
                existing.txCount += 1;
              } else {
                byIngredient.set(c.ingredientId, {
                  ingredientId: c.ingredientId,
                  ingredientName: c.ingredientName,
                  totalNeeded: c.needed,
                  txCount: 1,
                });
              }
            }
          }
          setConflictInfo({
            conflictedCount: data.conflictedCount || conflictedResults.length,
            ingredients: Array.from(byIngredient.values()),
          });
        }
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
      {conflictInfo && (
        <div className="bottom-sheet-backdrop sync-conflict-backdrop">
          <div className="bottom-sheet sync-conflict-sheet">
            <div className="bottom-sheet-handle"></div>
            <div className="sync-conflict-header">
              <span className="sync-conflict-icon">⚠️</span>
              <h2>Konflik Stok Saat Sinkronisasi</h2>
            </div>
            <p className="sync-conflict-desc">
              {conflictInfo.conflictedCount} transaksi offline tetap tercatat (uang sudah diterima), tapi stok bahan baku berikut sudah tidak cukup saat disinkronkan dan di-set ke 0. Mohon cek &amp; sesuaikan stok bahan baku ini secara manual:
            </p>
            <ul className="sync-conflict-list">
              {conflictInfo.ingredients.map((ing) => (
                <li key={ing.ingredientId} className="sync-conflict-item">
                  <span className="sync-conflict-name">{ing.ingredientName}</span>
                  <span className="sync-conflict-meta">
                    Kurang {ing.totalNeeded.toFixed(2)} (di {ing.txCount} transaksi)
                  </span>
                </li>
              ))}
            </ul>
            <button onClick={() => setConflictInfo(null)} className="btn btn-primary w-full mt-6">
              Mengerti, saya akan cek stok
            </button>
          </div>
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
        .sync-conflict-backdrop {
          z-index: 10000;
        }
        .sync-conflict-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }
        .sync-conflict-icon {
          font-size: 22px;
          line-height: 1;
        }
        .sync-conflict-header h2 {
          font-size: 18px;
          font-weight: 700;
          color: var(--color-danger, var(--danger-color, #E41E3F));
          margin: 0;
        }
        .sync-conflict-desc {
          font-size: 14px;
          line-height: 1.5;
          color: var(--text-secondary, #555);
          margin: 0 0 16px 0;
        }
        .sync-conflict-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 240px;
          overflow-y: auto;
        }
        .sync-conflict-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: var(--radius-sm, 8px);
          background-color: var(--color-danger-light, var(--danger-light, #FFF0F2));
        }
        .sync-conflict-name {
          font-weight: 600;
          color: var(--text-primary, #1a1a1a);
        }
        .sync-conflict-meta {
          font-size: 13px;
          color: var(--color-danger, var(--danger-color, #E41E3F));
          white-space: nowrap;
        }
      `}</style>
    </>
  );
}
