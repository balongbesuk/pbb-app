export const normalizeServerUrl = (serverUrl: string, isHttps = false) => {
  const protocol = isHttps ? 'https://' : 'http://';
  const cleanUrl = serverUrl.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
  return `${protocol}${cleanUrl}`;
};

export const joinServerUrl = (serverUrl: string, path: string) => {
  const baseUrl = serverUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};

export const buildVillageHost = (villageCode: string, baseDomain: string) => {
  const normalizedVillageCode = villageCode
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const normalizedBaseDomain = baseDomain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '');

  return normalizedVillageCode && normalizedBaseDomain
    ? `${normalizedVillageCode}.${normalizedBaseDomain}`
    : '';
};
