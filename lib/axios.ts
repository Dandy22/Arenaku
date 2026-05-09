import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

// Auto attach token ke setiap request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auto redirect kalau 401, tapi lebih hati-hati
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        // Jangan langsung clear auth, beri kesempatan untuk retry
        // atau cek apakah ini memang invalid token
        const token = localStorage.getItem("token");
        if (token) {
          // Coba validasi token sekali lagi sebelum logout
          console.warn("[Axios] 401 received, checking token validity...");
          // Untuk sekarang, tetap logout tapi dengan delay kecil
          setTimeout(() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login";
          }, 100);
        } else {
          // Tidak ada token, langsung redirect
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
