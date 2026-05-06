import axios from "axios";

// ✅ إصلاح: baseUrl ديناميكي بدل hardcoded localhost
const getApiEndPoint = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  if (typeof window !== "undefined") {
    const isLocalDev =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (!isLocalDev) {
      const devPort = window.location.port && window.location.port !== "3000";
      return devPort
        ? `${window.location.protocol}//${window.location.hostname}:3000`
        : `${window.location.protocol}//${window.location.host}`;
    }
  }
  return "http://localhost:3000";
};

export const baseUrl = getApiEndPoint();

export const authInstance = axios.create({
  baseURL: baseUrl,
  timeout: 30000,
});

const apiInstance = axios.create({
  baseURL: baseUrl,
  timeout: 30000,
});

apiInstance.interceptors.request.use(
  (config: any) => {
    const requestUrl = typeof config.url === "string" ? config.url : "";
    const isAuthRequest = ["/login", "/signup"].some((path) =>
      requestUrl.endsWith(path),
    );

    if (isAuthRequest || typeof localStorage === "undefined") {
      return config;
    }

    const user = localStorage.getItem("user");
    if (user) {
      try {
        const { token } = JSON.parse(user);
        if (token) {
          if (String(token).length > 8000) {
            localStorage.removeItem("user");
            return config;
          }
          config.headers = config.headers || {};
          (config.headers as any).Authorization = `Bearer ${token}`;
        }
      } catch {
        localStorage.removeItem("user");
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ auto-logout إذا انتهى الـ token
apiInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const hadUser =
        typeof localStorage !== "undefined" &&
        Boolean(localStorage.getItem("user"));
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem("user");
      }
      if (hadUser && typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  }
);

export default apiInstance;
