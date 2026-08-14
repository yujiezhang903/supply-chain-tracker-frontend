const DEFAULT_API_BASE_URL = 'http://localhost:3001';

// NEXT_PUBLIC_* values are embedded by Next.js at build time. Read each key
// directly so the framework can replace it in browser bundles.
const configuredApiUrl =
  process.env.NEXT_PUBLIC_API_URL?.trim() ||
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  DEFAULT_API_BASE_URL;

export const API_BASE_URL = configuredApiUrl.replace(/\/+$/, '');

/**
 * Build a backend URL from the public API origin. Centralizing this step keeps
 * every page aligned with NEXT_PUBLIC_API_URL and avoids duplicate slashes.
 */
export function apiUrl(path: string): string {
  const normalizedPath = path.trim().replace(/^\/+/, '');

  return normalizedPath
    ? API_BASE_URL + '/' + normalizedPath
    : API_BASE_URL;
}
