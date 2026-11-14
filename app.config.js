const { resolveApiConfig } = require('./src/config/runtime-url');

module.exports = ({ config }) => {
  const release = process.env.EAS_BUILD_PROFILE === 'production-apk' ||
    process.env.EXPO_PUBLIC_APP_ENV === 'production';
  if (release) resolveApiConfig(process.env.EXPO_PUBLIC_API_URL, true);
  return config;
};
