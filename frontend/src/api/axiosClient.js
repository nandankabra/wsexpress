import axios from 'axios';
import { toast } from 'sonner';

const ACCESS_TOKEN_KEY = 'shiptrack_access_token';
const REFRESH_TOKEN_KEY = 'shiptrack_refresh_token';
const USER_KEY = 'shiptrack_user';

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function storeSession({ accessToken, refreshToken, user }) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

const apiClient = axios.create({ baseURL: '/api/v1', timeout: 60000 });

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    if (config.headers?.set) {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token available');
  const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken });
  storeSession(data);
  return data.accessToken;
}

apiClient.interceptors.response.use(
  (response) => {
    try {
      toast.dismiss('render-cold-start');
    } catch (_) {}
    return response;
  },
  async (error) => {
    const { config, response } = error;

    // Automatic retry for Render cold starts / hibernate rate limiting (HTTP 429 & 503)
    const isColdStart =
      response?.status === 429 ||
      response?.status === 503 ||
      error.code === 'ECONNABORTED' ||
      !response;

    const maxRetries = 8;
    if (isColdStart && config && (config._retryCount || 0) < maxRetries) {
      config._retryCount = (config._retryCount || 0) + 1;

      try {
        if (config._retryCount === 1) {
          toast.loading('Server instance waking up from standby, please wait...', {
            id: 'render-cold-start',
            duration: 40000,
          });
        }
      } catch (_) {}

      // Progressive backoff: 2s, 3s, 4s, 5s...
      const delay = Math.min(1800 + config._retryCount * 800, 5000);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return apiClient(config);
    }

    try {
      toast.dismiss('render-cold-start');
    } catch (_) {}

    if (response?.status === 401 && !config._retried && getRefreshToken()) {
      config._retried = true;
      try {
        refreshPromise = refreshPromise || refreshAccessToken();
        const newToken = await refreshPromise;
        refreshPromise = null;
        if (config.headers?.set) {
          config.headers.set('Authorization', `Bearer ${newToken}`);
        } else {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${newToken}`;
        }
        return apiClient(config);
      } catch (refreshError) {
        refreshPromise = null;
        clearSession();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

// Keepalive ping every 3 minutes while browser is open
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiClient.get('/health', { timeout: 10000 }).catch(() => {});
  }, 3 * 60 * 1000);
}

export default apiClient;
