'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registeredBusinessName, setRegisteredBusinessName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!businessName.trim() || !name.trim() || !password || !confirmPassword) {
      setError('Semua field wajib diisi.');
      return;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), password, businessName: businessName.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Auto-login — token registrasi sudah berupa sesi valid, tidak perlu login ulang.
        localStorage.setItem('sipi_token', data.token);
        localStorage.setItem('sipi_logged_in', 'true');
        localStorage.setItem('sipi_user', JSON.stringify(data.user));
        setRegisteredBusinessName(data.business?.name || businessName.trim());
      } else {
        setError(data.error || 'Registrasi gagal. Silakan coba lagi.');
      }
    } catch (err) {
      setError('Tidak bisa terhubung ke server. Periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success state — tampil setelah registrasi + auto-login berhasil ──────────
  if (registeredBusinessName) {
    return (
      <>
        <div className="bg-blob-wrapper" aria-hidden="true">
          <div className="bg-blob bg-blob--top-left" />
          <div className="bg-blob bg-blob--bottom-right" />
        </div>
        <div className="login-page">
          <main className="login-card-wrapper">
            <div className="login-card">
              <div className="success-icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" width="32" height="32">
                  <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
                </svg>
              </div>
              <header className="login-brand">
                <h1 className="success-title">Akun &amp; Bisnis Berhasil Dibuat</h1>
                <p className="brand-tagline">
                  <strong>{registeredBusinessName}</strong> sudah terdaftar dan Anda otomatis masuk ke akun baru ini.
                </p>
              </header>

              <div className="info-box" role="status">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" width="18" height="18" aria-hidden="true" className="info-icon">
                  <path d="M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z" />
                </svg>
                <span>
                  Data bisnis Anda masih <strong>kosong</strong> — belum ada Menu maupun Bahan Baku. Sebelum bisa memakai
                  Kasir (POS), lengkapi dulu <strong>Bahan Baku</strong> dan <strong>Menu &amp; Resep</strong> di halaman Inventaris.
                </span>
              </div>

              <button type="button" className="btn-login" onClick={() => router.replace('/inventory')}>
                Lanjut ke Inventaris
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" width="20" height="20" aria-hidden="true">
                  <path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z" />
                </svg>
              </button>
            </div>
          </main>
        </div>
        <style jsx>{`
          :global(body) {
            padding-bottom: 0;
          }
          .bg-blob-wrapper {
            position: fixed;
            inset: 0;
            z-index: -1;
            overflow: hidden;
            pointer-events: none;
            opacity: 0.35;
          }
          .bg-blob {
            position: absolute;
            width: 50%;
            height: 50%;
            border-radius: 50%;
            filter: blur(120px);
          }
          .bg-blob--top-left {
            top: -15%;
            left: -15%;
            background: rgba(0, 100, 224, 0.15);
          }
          .bg-blob--bottom-right {
            bottom: -15%;
            right: -15%;
            background: rgba(0, 100, 224, 0.08);
          }
          .login-page {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100dvh;
            padding: 24px 16px;
            background-color: var(--color-surface-soft);
          }
          .login-card-wrapper {
            width: 100%;
            max-width: 440px;
            animation: card-enter 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
          }
          @keyframes card-enter {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .login-card {
            background: var(--color-canvas);
            border-radius: var(--radius-lg);
            border: 1px solid var(--color-outline);
            box-shadow: 0 4px 60px rgba(0, 0, 0, 0.06), 0 2px 10px rgba(0, 0, 0, 0.03);
            padding: 40px 32px 32px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
            isolation: isolate;
            text-align: center;
          }
          .success-icon {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background-color: var(--color-success-light);
            color: var(--color-success);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .login-brand {
            width: 100%;
          }
          .success-title {
            font-family: var(--font-jakarta);
            font-size: 22px;
            font-weight: 700;
            color: var(--color-ink-deep);
            margin: 0 0 8px;
          }
          .brand-tagline {
            font-size: var(--font-size-body-sm);
            color: var(--text-secondary);
            margin: 0;
            line-height: 1.5;
          }
          .info-box {
            width: 100%;
            display: flex;
            align-items: flex-start;
            gap: 10px;
            background-color: rgba(0, 100, 224, 0.06);
            color: var(--color-ink);
            border: 1px solid rgba(0, 100, 224, 0.2);
            border-radius: var(--radius-sm);
            padding: 14px;
            font-size: var(--font-size-body-sm);
            line-height: 1.5;
            text-align: left;
          }
          .info-icon {
            flex-shrink: 0;
            color: var(--color-primary);
            margin-top: 1px;
          }
          .btn-login {
            width: 100%;
            height: 52px;
            background-color: var(--color-primary);
            color: #fff;
            font-family: var(--font-jakarta);
            font-size: var(--font-size-body-sm);
            font-weight: 700;
            border: none;
            border-radius: var(--radius-pill);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            box-shadow: 0 4px 20px rgba(0, 100, 224, 0.25);
            transition: background-color var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast);
          }
          .btn-login:hover {
            background-color: var(--color-primary-deep);
            transform: translateY(-1px);
            box-shadow: 0 6px 24px rgba(0, 100, 224, 0.3);
          }
          .btn-login:active {
            transform: scale(0.98) translateY(0);
            box-shadow: 0 2px 10px rgba(0, 100, 224, 0.2);
          }
        `}</style>
      </>
    );
  }

  return (
    <>
      {/* Background blobs atmosferik (konsisten dengan halaman login) */}
      <div className="bg-blob-wrapper" aria-hidden="true">
        <div className="bg-blob bg-blob--top-left" />
        <div className="bg-blob bg-blob--bottom-right" />
      </div>

      <div className="login-page">
        <main className="login-card-wrapper">
          <div className="login-card">

            {/* ── Brand Header ──────────────────────────────────────────────── */}
            <header className="login-brand">
              <div className="brand-logo-row">
                <div className="brand-icon" aria-hidden="true">
                  <img src="/icons/brand-icon.png" alt="SIPI" />
                </div>
                <h1 className="brand-name">SIPI</h1>
              </div>
              <p className="brand-tagline">Daftarkan bisnis baru Anda</p>
            </header>

            {/* ── Error Alert ───────────────────────────────────────────────── */}
            {error && (
              <div className="error-alert" role="alert">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true" className="alert-icon">
                  <path d="M1 21 12 2l11 19H1Zm11-3q.425 0 .713-.288T13 17q0-.425-.288-.712T12 16q-.425 0-.712.287T11 17q0 .425.288.713T12 18Zm-1-3h2v-5h-2v5Z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* ── Form Registrasi ───────────────────────────────────────────── */}
            <form onSubmit={handleSubmit} className="login-form" noValidate>

              {/* Nama Usaha */}
              <div className="field-group">
                <label className="field-label" htmlFor="businessName">Nama Usaha</label>
                <div className="input-wrapper">
                  <span className="input-icon" aria-hidden="true">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" width="20" height="20">
                      <path d="M160-120v-480l320-240 320 240v480H560v-280H400v280H160Z" />
                    </svg>
                  </span>
                  <input
                    id="businessName"
                    type="text"
                    className="input-field"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Contoh: Ayam Geprek Bu Yuli"
                    autoComplete="organization"
                    required
                  />
                </div>
              </div>

              {/* Username */}
              <div className="field-group">
                <label className="field-label" htmlFor="username">Username</label>
                <div className="input-wrapper">
                  <span className="input-icon" aria-hidden="true">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" width="20" height="20">
                      <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 129-46.5T480-440q66 0 133 15.5T742-378q29 15 46.5 43.5T806-272v112H160Z" />
                    </svg>
                  </span>
                  <input
                    id="username"
                    type="text"
                    className="input-field"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masukkan username"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="field-group">
                <label className="field-label" htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <span className="input-icon" aria-hidden="true">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" width="20" height="20">
                      <path d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm240-200q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80Z" />
                    </svg>
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="input-field input-field--padded-right"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="input-eye-btn"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" width="20" height="20">
                        <path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-134 0-244.5-72T61-462q-5-8-7.5-16.5T51-500q0-9 2.5-17.5T61-534q64-118 174.5-192T480-800q134 0 244.5 72T899-534q5 8 7.5 16.5T909-500q0 9-2.5 17.5T899-466q-64 118-174.5 192T480-200Z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" width="20" height="20">
                        <path d="m644-428-58-58q9-47-27-88t-93-32l-58-58q17-8 34.5-12t37.5-4q75 0 127.5 52.5T660-500q0 20-4 37.5T644-428Zm128 126-58-56q38-29 67.5-63.5T832-500q-50-101-143.5-160.5T480-720q-29 0-57 4t-55 12l-62-62q41-17 84-25.5t90-8.5q134 0 244.5 72T899-534q5 8 7.5 16.5T909-500q0 9-2.5 17.5T899-466q-32 60-77.5 107.5T772-302Zm20 246L624-222q-35 11-70.5 16.5T480-200q-134 0-244.5-72T61-466q-5-8-7.5-16.5T51-500q0-9 2.5-17.5T61-534q32-60 77.5-107T248-730L80-896l56-56 736 736-80 80ZM304-656l58 58q-11 8-21.5 18.5T322-556q-20 41-20 56t20 56q50 101 143.5 160.5T480-220q13 0 27-1.5t27-3.5l54 54q-26 7-53.5 11T480-156q-134 0-244.5-72T61-534q-5-8-7.5-16.5T51-568q0-9 2.5-17.5T61-602q30-56 70-101.5T304-656Z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Konfirmasi Password */}
              <div className="field-group">
                <label className="field-label" htmlFor="confirmPassword">Konfirmasi Password</label>
                <div className="input-wrapper">
                  <span className="input-icon" aria-hidden="true">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" width="20" height="20">
                      <path d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm240-200q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80Z" />
                    </svg>
                  </span>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="input-field input-field--padded-right"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="input-eye-btn"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" width="20" height="20">
                        <path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-134 0-244.5-72T61-462q-5-8-7.5-16.5T51-500q0-9 2.5-17.5T61-534q64-118 174.5-192T480-800q134 0 244.5 72T899-534q5 8 7.5 16.5T909-500q0 9-2.5 17.5T899-466q-64 118-174.5 192T480-200Z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" width="20" height="20">
                        <path d="m644-428-58-58q9-47-27-88t-93-32l-58-58q17-8 34.5-12t37.5-4q75 0 127.5 52.5T660-500q0 20-4 37.5T644-428Zm128 126-58-56q38-29 67.5-63.5T832-500q-50-101-143.5-160.5T480-720q-29 0-57 4t-55 12l-62-62q41-17 84-25.5t90-8.5q134 0 244.5 72T899-534q5 8 7.5 16.5T909-500q0 9-2.5 17.5T899-466q-32 60-77.5 107.5T772-302Zm20 246L624-222q-35 11-70.5 16.5T480-200q-134 0-244.5-72T61-466q-5-8-7.5-16.5T51-500q0-9 2.5-17.5T61-534q32-60 77.5-101T304-656Z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="btn-login"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    Memproses...
                  </>
                ) : (
                  <>
                    Daftar &amp; Buat Bisnis
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" width="20" height="20" aria-hidden="true">
                      <path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* ── Footer ────────────────────────────────────────────────────── */}
            <footer className="login-footer">
              <div className="divider-row">
                <span className="divider-line" />
                <span className="divider-label">Sudah punya akun?</span>
                <span className="divider-line" />
              </div>
              <p className="footer-hint">
                <Link href="/login" className="footer-link">Masuk ke akun yang sudah ada</Link>
              </p>
            </footer>
          </div>
        </main>
      </div>

      <style jsx>{`
        /* ── Reset body padding untuk halaman register ── */
        :global(body) {
          padding-bottom: 0;
        }

        /* ── Background blobs atmosferik ── */
        .bg-blob-wrapper {
          position: fixed;
          inset: 0;
          z-index: -1;
          overflow: hidden;
          pointer-events: none;
          opacity: 0.35;
        }
        .bg-blob {
          position: absolute;
          width: 50%;
          height: 50%;
          border-radius: 50%;
          filter: blur(120px);
        }
        .bg-blob--top-left {
          top: -15%;
          left: -15%;
          background: rgba(0, 100, 224, 0.15);
        }
        .bg-blob--bottom-right {
          bottom: -15%;
          right: -15%;
          background: rgba(0, 100, 224, 0.08);
        }

        /* ── Page shell ── */
        .login-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100dvh;
          padding: 24px 16px;
          background-color: var(--color-surface-soft);
        }

        /* ── Card wrapper — animasi masuk ── */
        .login-card-wrapper {
          width: 100%;
          max-width: 440px;
          animation: card-enter 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes card-enter {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Card utama ── */
        .login-card {
          background: var(--color-canvas);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-outline);
          box-shadow: 0 4px 60px rgba(0, 0, 0, 0.06), 0 2px 10px rgba(0, 0, 0, 0.03);
          padding: 40px 32px 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          isolation: isolate;
        }

        /* ── Brand header ── */
        .login-brand {
          text-align: center;
          width: 100%;
        }
        .brand-logo-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        .brand-icon {
          width: 52px;
          height: 52px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0, 100, 224, 0.3);
          flex-shrink: 0;
        }
        .brand-icon img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .brand-name {
          font-family: var(--font-jakarta);
          font-size: 36px;
          font-weight: 700;
          color: var(--color-primary);
          letter-spacing: -0.02em;
          line-height: 1;
          margin: 0;
          background: transparent;
          -webkit-text-fill-color: var(--color-primary);
        }
        .brand-tagline {
          font-size: var(--font-size-body-sm);
          color: var(--text-secondary);
          margin: 0;
        }

        /* ── Error alert ── */
        .error-alert {
          width: 100%;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          background-color: var(--color-danger-light);
          color: var(--color-danger);
          border: 1px solid rgba(228, 30, 63, 0.25);
          border-radius: var(--radius-sm);
          padding: 12px 14px;
          font-size: var(--font-size-body-sm);
          font-weight: 500;
          line-height: 1.4;
          animation: shake 0.35s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
        .alert-icon {
          flex-shrink: 0;
          margin-top: 1px;
        }
        @keyframes shake {
          10%, 90% { transform: translateX(-2px); }
          20%, 80% { transform: translateX(3px); }
          30%, 50%, 70% { transform: translateX(-3px); }
          40%, 60% { transform: translateX(3px); }
        }

        /* ── Form ── */
        .login-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .field-label {
          font-size: var(--font-size-label);
          font-weight: 700;
          color: var(--text-secondary);
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        /* ── Input wrapper dengan ikon ── */
        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 14px;
          color: var(--text-tertiary);
          display: flex;
          align-items: center;
          pointer-events: none;
          transition: color var(--transition-fast);
        }
        .input-field {
          font-family: var(--font-jakarta);
          font-size: var(--font-size-body-sm);
          width: 100%;
          height: 52px;
          padding: 0 16px 0 46px;
          background-color: var(--color-surface-soft);
          border: 1.5px solid var(--color-outline);
          border-radius: var(--radius-sm);
          color: var(--color-ink);
          outline: none;
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast), background-color var(--transition-fast);
        }
        .input-field::placeholder {
          color: var(--text-tertiary);
        }
        .input-field:focus {
          border-color: var(--color-primary);
          background-color: var(--color-canvas);
          box-shadow: 0 0 0 4px rgba(0, 100, 224, 0.1);
        }
        .input-wrapper:focus-within .input-icon {
          color: var(--color-primary);
        }
        .input-field:-webkit-autofill,
        .input-field:-webkit-autofill:hover,
        .input-field:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 40px var(--color-canvas) inset !important;
          -webkit-text-fill-color: var(--color-ink) !important;
        }
        .input-field--padded-right {
          padding-right: 48px;
        }

        /* ── Toggle visibility password ── */
        .input-eye-btn {
          position: absolute;
          right: 12px;
          background: transparent;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: var(--text-tertiary);
          display: flex;
          align-items: center;
          border-radius: 4px;
          transition: color var(--transition-fast);
        }
        .input-eye-btn:hover {
          color: var(--color-ink);
        }

        /* ── Tombol submit — pill-shaped, cobalt ── */
        .btn-login {
          width: 100%;
          height: 52px;
          background-color: var(--color-primary);
          color: #fff;
          font-family: var(--font-jakarta);
          font-size: var(--font-size-body-sm);
          font-weight: 700;
          border: none;
          border-radius: var(--radius-pill);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 20px rgba(0, 100, 224, 0.25);
          transition: background-color var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast);
          margin-top: 4px;
        }
        .btn-login:hover:not(:disabled) {
          background-color: var(--color-primary-deep);
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(0, 100, 224, 0.3);
        }
        .btn-login:active:not(:disabled) {
          transform: scale(0.98) translateY(0);
          box-shadow: 0 2px 10px rgba(0, 100, 224, 0.2);
        }
        .btn-login:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        /* ── Spinner loading ── */
        .spinner {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 2.5px solid rgba(255, 255, 255, 0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ── Footer ── */
        .login-footer {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .divider-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .divider-line {
          flex: 1;
          height: 1px;
          background-color: var(--color-outline);
        }
        .divider-label {
          font-size: 11px;
          color: var(--text-tertiary);
          white-space: nowrap;
        }
        .footer-hint {
          font-size: var(--font-size-body-sm);
          text-align: center;
          margin: 0;
        }
        .footer-link {
          color: var(--color-primary);
          font-weight: 600;
          text-decoration: none;
        }
        .footer-link:hover {
          text-decoration: underline;
        }

        /* ── Responsivitas ── */
        @media (max-width: 480px) {
          .login-card {
            padding: 32px 20px 24px;
            border-radius: 24px;
          }
          .brand-name {
            font-size: 28px;
          }
        }
      `}</style>
    </>
  );
}
