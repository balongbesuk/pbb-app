export const normalizeServerUrl = (serverUrl: string, defaultToHttps = false) => {
  let url = serverUrl.trim();

  // If no protocol is present, add the default one
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    const protocol = defaultToHttps ? 'https://' : 'http://';
    url = `${protocol}${url}`;
  }

  return url.replace(/\/+$/, '');
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

export const formatCurrency = (amount: number) => {
  return 'Rp ' + Number(amount || 0).toLocaleString('id-ID');
};

