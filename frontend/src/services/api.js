import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem("access");
  console.log('🔐 Request Interceptor:', {
    url: config.url,
    method: config.method,
    hasToken: !!token,
    tokenPreview: token ? token.substring(0, 20) + '...' : 'null'
  });
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn('⚠️ No token found in localStorage! Keys:', Object.keys(localStorage));
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      console.error('❌ 401 Unauthorized - Token may be invalid or expired');
      console.log('Token in localStorage:', localStorage.getItem('access') ? '✅ Present' : '❌ Missing');
    }
    return Promise.reject(error);
  }
);

export { api };
export default api;
