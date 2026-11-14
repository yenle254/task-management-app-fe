import { resolveApiConfig } from './runtime-url';

// Expo replaces this direct EXPO_PUBLIC reference when building the JS bundle.
const production = !__DEV__ || process.env.EXPO_PUBLIC_APP_ENV === 'production';
const API_CONFIG = resolveApiConfig(process.env.EXPO_PUBLIC_API_URL, production);
export const API_URL = API_CONFIG.BASE_URL;
export const SOCKET_URL = API_CONFIG.ORIGIN;
export default API_CONFIG;
