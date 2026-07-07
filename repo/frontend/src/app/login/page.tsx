'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Pesan sukses dari halaman registrasi (dititipkan lewat sessionStorage, bukan
  // auto-login) — dibaca sekali lalu dihapus supaya tidak muncul lagi di kunjungan berikutnya.
  useEffect(() => {
    const registeredBusiness = sessionStorage.getItem('sipi_register_success');
    if (registeredBusiness) {
      setSuccessMessage(`Akun & bisnis "${registeredBusiness}" berhasil dibuat! Silakan login untuk melanjutkan. Data masih kosong — lengkapi Bahan Baku dan Menu & Resep dulu di Inventaris sebelum memakai Kasir (POS).`);
      sessionStorage.removeItem('sipi_register_success');
    }
  }, []);

  // ── Logic TIDAK berubah ─────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('sipi_token', data.token);
        localStorage.setItem('sipi_logged_in', 'true');
        localStorage.setItem('sipi_user', JSON.stringify(data.user));
        router.replace('/pos');
      } else {
        setError(data.error || 'Login gagal. Silakan coba lagi.');
      }
    } catch (err) {
      setError('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
    }
  };
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Background blobs atmosferik (dari mockup desktop Stitch) */}
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
              <p className="brand-tagline">Sistem Informasi POS &amp; Inventaris F&amp;B</p>
            </header>

            {/* ── Success Alert (dari halaman registrasi) ─────────────────────── */}
            {successMessage && (
              <div className="success-alert" role="status">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" width="16" height="16" aria-hidden="true" className="alert-icon">
                  <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
                </svg>
                <span>{successMessage}</span>
              </div>
            )}

            {/* ── Error Alert ───────────────────────────────────────────────── */}
            {error && (
              <div className="error-alert" role="alert">
                {/* Ikon segitiga ⚠ (WCAG — tidak hanya warna) */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true" className="alert-icon">
                  <path d="M1 21 12 2l11 19H1Zm11-3q.425 0 .713-.288T13 17q0-.425-.288-.712T12 16q-.425 0-.712.287T11 17q0 .425.288.713T12 18Zm-1-3h2v-5h-2v5Z"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* ── Form Login ────────────────────────────────────────────────── */}
            <form onSubmit={handleSubmit} className="login-form" noValidate>

              {/* Username */}
              <div className="field-group">
                <label className="field-label" htmlFor="username">Username</label>
                <div className="input-wrapper">
                  <span className="input-icon" aria-hidden="true">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" width="20" height="20">
                      <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 129-46.5T480-440q66 0 133 15.5T742-378q29 15 46.5 43.5T806-272v112H160Z"/>
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
                <div className="field-label-row">
                  <label className="field-label" htmlFor="password">Password</label>
                </div>
                <div className="input-wrapper">
                  <span className="input-icon" aria-hidden="true">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" width="20" height="20">
                      <path d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm240-200q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80Z"/>
                    </svg>
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="input-field input-field--padded-right"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="input-eye-btn"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? (
                      /* visibility icon */
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" width="20" height="20">
                        <path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-134 0-244.5-72T61-462q-5-8-7.5-16.5T51-500q0-9 2.5-17.5T61-534q64-118 174.5-192T480-800q134 0 244.5 72T899-534q5 8 7.5 16.5T909-500q0 9-2.5 17.5T899-466q-64 118-174.5 192T480-200Z"/>
                      </svg>
                    ) : (
                      /* visibility_off icon */
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" width="20" height="20">
                        <path d="m644-428-58-58q9-47-27-88t-93-32l-58-58q17-8 34.5-12t37.5-4q75 0 127.5 52.5T660-500q0 20-4 37.5T644-428Zm128 126-58-56q38-29 67.5-63.5T832-500q-50-101-143.5-160.5T480-720q-29 0-57 4t-55 12l-62-62q41-17 84-25.5t90-8.5q134 0 244.5 72T899-534q5 8 7.5 16.5T909-500q0 9-2.5 17.5T899-466q-32 60-77.5 107.5T772-302Zm20 246L624-222q-35 11-70.5 16.5T480-200q-134 0-244.5-72T61-466q-5-8-7.5-16.5T51-500q0-9 2.5-17.5T61-534q32-60 77.5-107T248-730L80-896l56-56 736 736-80 80ZM304-656l58 58q-11 8-21.5 18.5T322-556q-20 41-20 56t20 56q50 101 143.5 160.5T480-220q13 0 27-1.5t27-3.5l54 54q-26 7-53.5 11T480-156q-134 0-244.5-72T61-534q-5-8-7.5-16.5T51-568q0-9 2.5-17.5T61-602q30-56 70-101.5T304-656Z"/>
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
                    Masuk ke Aplikasi
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" width="20" height="20" aria-hidden="true">
                      <path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* ── Footer ────────────────────────────────────────────────────── */}
            <footer className="login-footer">
              <p className="footer-hint">
                Bisnis baru? <Link href="/register" className="footer-link">Daftar di sini</Link>
              </p>
            </footer>
          </div>
        </main>
      </div>

      <style jsx>{`
        /* ── Reset body padding untuk halaman login ── */
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
          border-radius: var(--radius-lg); /* 32px — feature card */
          border: 1px solid var(--color-outline);
          box-shadow: 0 4px 60px rgba(0, 0, 0, 0.06), 0 2px 10px rgba(0, 0, 0, 0.03);
          padding: 40px 32px 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          isolation: isolate; /* buat stacking context sendiri, cegah background leak dari body */
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
          border-radius: var(--radius-md); /* 16px */
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
          /* override global h1 margin & pastikan background transparan di semua breakpoint */
          margin: 0;
          background: transparent;
          -webkit-text-fill-color: var(--color-primary); /* cegah override warna teks dari WebKit autofill/inherited */
        }
        .brand-tagline {
          font-size: var(--font-size-body-sm); /* 14px */
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
          border-radius: var(--radius-sm); /* 8px */
          padding: 12px 14px;
          font-size: var(--font-size-body-sm); /* 14px */
          font-weight: 500;
          line-height: 1.4;
          animation: shake 0.35s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
        .success-alert {
          width: 100%;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          background-color: var(--color-success-light);
          color: var(--color-success);
          border: 1px solid rgba(49, 162, 76, 0.25);
          border-radius: var(--radius-sm); /* 8px */
          padding: 12px 14px;
          font-size: var(--font-size-body-sm); /* 14px */
          font-weight: 500;
          line-height: 1.4;
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
          gap: 20px;
        }
        .field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .field-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .field-label {
          font-size: var(--font-size-label); /* 12px */
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
          font-size: var(--font-size-body-sm); /* 14px */
          width: 100%;
          height: 52px; /* ≥44px tap target */
          padding: 0 16px 0 46px;
          background-color: var(--color-surface-soft);
          border: 1.5px solid var(--color-outline);
          border-radius: var(--radius-sm); /* 8px — input field */
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
        /* Ketika input fokus, ikon ikut biru */
        .input-wrapper:focus-within .input-icon {
          color: var(--color-primary);
        }
        /* Prevent webkit autofill yellow */
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
          font-size: 14px;
          font-weight: 400;
        }
        .input-eye-btn:hover {
          color: var(--color-ink);
        }

        /* ── Tombol Masuk — pill-shaped, cobalt ── */
        .btn-login {
          width: 100%;
          height: 52px;
          background-color: var(--color-primary);
          color: #fff;
          font-family: var(--font-jakarta);
          font-size: var(--font-size-body-sm); /* 14px */
          font-weight: 700;
          border: none;
          border-radius: var(--radius-pill); /* 9999px */
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

        /* ── Footer hint ── */
        .login-footer {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .footer-hint {
          font-size: 12px;
          color: var(--text-tertiary);
          text-align: center;
          line-height: 1.5;
        }
        .footer-hint strong {
          color: var(--text-secondary);
          font-weight: 600;
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
