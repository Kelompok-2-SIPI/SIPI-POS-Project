'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { canPromptInstall, isInstalled, promptInstall, subscribePwaInstall } from '@/lib/pwaInstall';

interface StoredUser {
  name: string;
  role: string;
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);

  const [pwaInstalled, setPwaInstalled] = useState(false);
  const [pwaPromptReady, setPwaPromptReady] = useState(false);
  const [pwaInstalling, setPwaInstalling] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('sipi_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }

    (async () => {
      try {
        const res = await apiFetch('/auth/me');
        if (res.ok) {
          const data = await res.json();
          setBusinessName(data.business?.name || null);
        }
      } catch {
        setBusinessName(null);
      }
    })();
  }, []);

  useEffect(() => {
    const syncPwaState = () => {
      setPwaInstalled(isInstalled());
      setPwaPromptReady(canPromptInstall());
    };
    syncPwaState();
    return subscribePwaInstall(syncPwaState);
  }, []);

  const handleInstallClick = async () => {
    setPwaInstalling(true);
    try {
      const outcome = await promptInstall();
      if (outcome === 'unavailable') {
        alert('Prompt instalasi belum tersedia dari browser. Coba buka menu browser dan pilih "Add to Home Screen" atau "Install App" secara manual.');
      }
    } finally {
      setPwaInstalling(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
      await apiFetch('/auth/logout', { method: 'POST' });
      localStorage.removeItem('sipi_token');
      localStorage.removeItem('sipi_logged_in');
      localStorage.removeItem('sipi_user');
      router.replace('/login');
    }
  };

  return (
    <div className="account-layout">
      <header className="account-header">
        <div>
          <h1>Akun</h1>
          <p>Informasi akun yang sedang masuk</p>
        </div>
      </header>

      <div className="card account-card">
        <div className="account-avatar" aria-hidden="true">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"/>
          </svg>
        </div>

        <div className="account-info-row">
          <span className="account-info-label">Nama</span>
          <span className="account-info-value">{user?.name || '-'}</span>
        </div>
        <div className="account-info-row">
          <span className="account-info-label">Nama Usaha</span>
          <span className="account-info-value">{businessName || '-'}</span>
        </div>

        <div className="account-pwa-box">
          {pwaInstalled ? (
            <p className="account-pwa-installed">
              <svg width="16" height="16" viewBox="0 -960 960 960" fill="currentColor" style={{ flexShrink: 0 }}>
                <path d="M382-233 154-461l57-57 171 171 367-367 57 57z"/>
              </svg>
              Aplikasi sudah terinstall di perangkat ini.
            </p>
          ) : (
            <>
              <p className="account-pwa-pitch">
                Jaringan sering tidak stabil? Download-lah PWA yang bisa menggunakan kasir secara Offline
              </p>
              {pwaPromptReady ? (
                <button
                  onClick={handleInstallClick}
                  disabled={pwaInstalling}
                  className="btn btn-primary account-pwa-btn"
                >
                  {pwaInstalling ? 'Memproses...' : 'Download Aplikasi (PWA)'}
                </button>
              ) : (
                <p className="account-pwa-manual">
                  Browser ini belum menawarkan instalasi otomatis. Buka menu browser (⋮ atau Share), lalu pilih
                  <strong> &quot;Add to Home Screen&quot;</strong> atau <strong>&quot;Install App&quot;</strong> secara manual.
                </p>
              )}
            </>
          )}
        </div>

        <button onClick={handleLogout} className="btn-logout account-logout-btn" title="Keluar">
          <svg viewBox="0 0 24 24" width="16" height="16" style={{ flexShrink: 0 }}>
            <path fill="currentColor" d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
          </svg>
          Keluar
        </button>
      </div>

      <style jsx>{`
        .account-layout {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .account-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 12px;
        }
        .account-header h1 {
          font-size: 24px;
        }
        .account-header p {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .account-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 32px 24px;
          max-width: 420px;
        }
        .account-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background-color: var(--color-surface-soft, var(--card-bg));
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }
        .account-info-row {
          width: 100%;
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid var(--border-color);
          font-size: 14px;
        }
        .account-info-row:last-of-type {
          border-bottom: none;
        }
        .account-info-label {
          color: var(--text-secondary);
        }
        .account-info-value {
          font-weight: 600;
        }
        .account-pwa-box {
          width: 100%;
          margin-top: 20px;
          padding: 16px;
          border-radius: var(--radius-md, 12px);
          background-color: var(--color-surface-soft, var(--card-bg));
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .account-pwa-pitch {
          font-size: 13px;
          line-height: 1.5;
          color: var(--text-secondary);
          margin: 0;
        }
        .account-pwa-btn {
          width: 100%;
          justify-content: center;
          padding: 12px;
          font-size: 14px;
        }
        .account-pwa-manual {
          font-size: 13px;
          line-height: 1.5;
          color: var(--text-secondary);
          margin: 0;
        }
        .account-pwa-installed {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: var(--success-color, #2ecc71);
          margin: 0;
        }
        .account-logout-btn {
          margin-top: 24px;
          width: 100%;
          justify-content: center;
          padding: 12px;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
