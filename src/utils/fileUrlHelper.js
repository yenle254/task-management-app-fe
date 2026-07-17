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
