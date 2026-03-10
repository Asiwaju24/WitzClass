import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api'
});

API.interceptors.request.use(config => {
  const token = localStorage.getItem('access');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

API.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config || {};

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;

      const refresh = localStorage.getItem('refresh');

      if (refresh) {
        try {
          const { data } = await axios.post(
            `${process.env.REACT_APP_API_URL || '/api'}/auth/refresh/`,
            { refresh }
          );

          localStorage.setItem('access', data.access);

          original.headers = {
            ...original.headers,
            Authorization: `Bearer ${data.access}`
          };

          return API(original);
        } catch (err) {
          console.error("Refresh failed", err);
          localStorage.clear();
        }
      }
    }

    return Promise.reject(err);
  }
);

export default API;
