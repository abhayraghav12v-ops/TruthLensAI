import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tl-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    console.error('[API Error]', error?.message);
    return Promise.reject(error);
  },
);

export default api;

/**
 * Upload media for Sightengine-backed verification.
 * Kept name `mockVerifyMedia` so existing imports keep working.
 */
export async function mockVerifyMedia(file) {
  const form = new FormData();
  form.append('file', file);

  const { data } = await api.post('/verify', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 180000,
  });
  return data;
}

/** Same function names as before — now hit the real backend. */
export const mockApi = {
  getDashboardStats: async () => {
    const { data } = await api.get('/dashboard-stats');
    return data;
  },
  getVerifications: async () => {
    const { data } = await api.get('/verifications');
    return data;
  },
    deleteVerification: async (id) => {
    const { data } = await api.delete(`/verifications/${id}`);
    return data;
  },
  getNotifications: async () => {
    const { data } = await api.get('/notifications');
    return data;
  },
  getActivity: async () => {
    const { data } = await api.get('/activity');
    return data;
  },
};
