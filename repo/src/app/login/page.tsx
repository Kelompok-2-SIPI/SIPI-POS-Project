'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('sipi_logged_in', 'true');
        localStorage.setItem('sipi_user', JSON.stringify(data.user));
        router.replace('/pos');
      } else {
        setError(data.error || 'Login gagal. Silakan coba lagi.');
      }
    } catch (err) {
      // Offline fallback: check hardcoded credentials
      if (name === 'admin' && password === 'sipi123') {
        localStorage.setItem('sipi_logged_in', 'true');
        localStorage.setItem('sipi_user', JSON.stringify({ name: 'admin', role: 'owner' }));
        router.replace('/pos');
      } else {
        setError('Login offline gagal. Pastikan username/password benar.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-placeholder">SIPI</div>
          <h1>SIPI POS</h1>
          <p>Sistem Informasi POS & Inventaris F&B</p>
        </div>

        {error && <div className="error-alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan username"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Masuk...' : 'Masuk ke Aplikasi'}
          </button>
        </form>
      </div>

      <style jsx>{`
        .login-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 80vh;
        }
        .login-card {
          width: 100%;
          max-width: 400px;
          background: white;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-lg);
          padding: 32px 24px;
        }
        .login-header {
          text-align: center;
          margin-bottom: 24px;
        }
        .logo-placeholder {
          width: 60px;
          height: 60px;
          background-color: var(--primary-color);
          color: white;
          font-family: var(--font-outfit);
          font-weight: 700;
          font-size: 20px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px auto;
          box-shadow: 0 4px 12px hsl(24 90% 46% / 20%);
        }
        .login-header h1 {
          font-size: 24px;
          margin-bottom: 4px;
        }
        .login-header p {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .error-alert {
          background-color: var(--danger-light);
          color: var(--danger-color);
          border: 1px solid rgba(239, 68, 68, 0.2);
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 20px;
          text-align: center;
        }
        .w-full {
          width: 100%;
          margin-top: 8px;
        }
      `}</style>
    </div>
  );
}
