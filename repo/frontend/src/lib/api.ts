const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function getHeaders(extra?: HeadersInit): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('sipi_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...(options.headers as object) },
  });

  // Global 401 handler
  if (res.status === 401 && typeof window !== 'undefined' && window.location.pathname !== '/login') {
    localStorage.removeItem('sipi_token');
    localStorage.removeItem('sipi_logged_in');
    localStorage.removeItem('sipi_user');
    window.location.href = '/login';
  }

  return res;
}
