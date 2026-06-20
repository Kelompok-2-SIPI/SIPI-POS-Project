export default function HomePage() {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
      <h1 style={{ fontSize: '2rem', color: '#16a34a', marginBottom: '0.5rem' }}>SIPI POS</h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Sistem Informasi POS & Inventaris F&B</p>
      <div style={{ display: 'grid', gap: '1rem', width: '100%', maxWidth: '360px' }}>
        <a href="/pos" style={cardStyle}>🧾 Kasir / POS</a>
        <a href="/inventaris" style={cardStyle}>📦 Inventaris</a>
        <a href="/dashboard" style={cardStyle}>📊 Dashboard Owner</a>
      </div>
      <p style={{ marginTop: '3rem', fontSize: '0.75rem', color: '#9ca3af' }}>
        Backend: {process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}
      </p>
    </main>
  );
}

const cardStyle: React.CSSProperties = {
  display: 'block',
  padding: '1rem 1.5rem',
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '0.75rem',
  textDecoration: 'none',
  color: '#111827',
  fontWeight: 600,
  fontSize: '1rem',
  textAlign: 'center',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
};
