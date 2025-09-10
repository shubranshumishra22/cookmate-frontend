export async function apiFetch(path: string, opts: RequestInit = {}) {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
  return fetch(`${base}${path}`, opts);
}
