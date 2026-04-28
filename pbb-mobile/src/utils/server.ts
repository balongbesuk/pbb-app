import AsyncStorage from '@react-native-async-storage/async-storage';

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

export const getAuthHeaders = async (headers: HeadersInit = {}) => {
  const token = await AsyncStorage.getItem('@admin_magic_token');
  return {
    ...headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const authenticatedFetch = async (
  serverUrl: string,
  path: string,
  init: RequestInit = {}
) => {
  const headers = await getAuthHeaders(init.headers || {});
  return fetch(joinServerUrl(serverUrl, path), {
    ...init,
    headers,
  });
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
