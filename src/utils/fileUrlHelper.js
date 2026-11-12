import API_CONFIG from '../config/api.config';

/**
 * Convert relative file URL to absolute URL
 * @param {string} fileUrl - File URL (can be relative or absolute)
 * @returns {string} - Absolute file URL
 */
export const getAbsoluteFileUrl = (fileUrl) => {
  if (!fileUrl) return '';
  
  // If already absolute, return as is
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  
  // If relative URL like /uploads/..., construct absolute URL
  if (fileUrl.startsWith('/')) {
    // Extract base URL without /api path
    const baseUrl = API_CONFIG.BASE_URL.replace('/api', '');
    return `${baseUrl}${fileUrl}`;
  }
  
  return fileUrl;
};

// Only attach credentials to the configured backend's private file routes.
export const isPrivateFileUrl = (fileUrl) => {
  try {
    const url = new URL(getAbsoluteFileUrl(fileUrl));
    const api = new URL(API_CONFIG.BASE_URL);
    return url.origin === api.origin && !url.username && !url.password &&
      /^\/(uploads|api\/files)\/[^/]+$/.test(url.pathname);
  } catch { return false; }
};

export const getAuthenticatedFileUrl = (fileUrl, token) => {
  const absolute = getAbsoluteFileUrl(fileUrl);
  if (!isPrivateFileUrl(absolute)) return absolute;
  if (!token) return ''; // Do not issue anonymous previews while storage is loading.
  const url = new URL(absolute);
  url.searchParams.set('access_token', token);
  return url.toString();
};
