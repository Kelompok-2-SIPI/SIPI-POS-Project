const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

// Base URL tanpa suffix /api/v1 — dipakai untuk resolve asset statis (mis. /uploads/menus/...)
// yang di-serve backend di luar prefix API.
const ASSET_BASE_URL = API_URL.replace(/\/api\/v1\/?$/, '');

export function resolveAssetUrl(path?: string | null): string | null {
  if (!path) return null;
  // URL absolut (mis. dari Cloudinary) dipakai apa adanya — hanya path lokal lama
  // (mis. /uploads/menus/...) yang perlu digabung dengan ASSET_BASE_URL.
  if (/^https?:\/\//i.test(path)) return path;
  return `${ASSET_BASE_URL}${path}`;
}

function getHeaders(isFormData: boolean, extra?: HeadersInit): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('sipi_token') : null;
  return {
    // Saat body-nya FormData, JANGAN set Content-Type manual — browser yang menentukan
    // boundary multipart-nya sendiri secara otomatis.
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...getHeaders(isFormData), ...(options.headers as object) },
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
