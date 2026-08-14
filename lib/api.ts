const configuredApiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://localhost:3001';

export const API_BASE_URL = configuredApiUrl.replace(/\/+$/, '');

/**
 * Build a backend URL from the public API origin. Centralizing this step keeps
 * every page aligned with NEXT_PUBLIC_API_URL and avoids duplicate slashes.
 */
export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : '/' + path;
  return API_BASE_URL + normalizedPath;
}

