// Shared by Expo app config and the mobile runtime; contains no secrets.
function resolveApiConfig(value, production = true) {
  const input = typeof value === 'string' ? value.trim() : '';
  if (!input && production) throw new Error('EXPO_PUBLIC_API_URL is required for release builds');
  let url;
  try { url = new URL(input || 'http://10.0.2.2:3000'); }
  catch { throw new Error('EXPO_PUBLIC_API_URL must be a valid absolute URL'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash)
    throw new Error('API URL must use HTTP(S) without credentials, query or fragment');
  const pathname = url.pathname.replace(/\/+$/, '');
  if (pathname && pathname !== '/api') throw new Error('API URL path must be empty or /api');
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  const local = !host.includes('.') || host.endsWith('.local') || host.endsWith('.localhost') ||
    host.startsWith('[') || /^\d+\.\d+\.\d+\.\d+$/.test(host);
  if (production && (url.protocol !== 'https:' || local))
    throw new Error('Release API URL must use HTTPS and a public DNS hostname');
  return { BASE_URL: url.origin + '/api', ORIGIN: url.origin, TIMEOUT: 30000 };
}
module.exports = { resolveApiConfig };
