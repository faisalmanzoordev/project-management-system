import axios from "axios";
import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";

function normalizeBaseUrl(url: string): string {
    const trimmed = url.trim();
    return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}

const baseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

if (!baseUrl) {
    throw new Error(
        "VITE_API_BASE_URL is missing. Add it to your .env file (e.g. VITE_API_BASE_URL=https://taskapis.devforhealth.com/api/)."
    );
}

const axiosInstance: AxiosInstance = axios.create({
    baseURL: normalizeBaseUrl(baseUrl),
    headers: { "Content-Type": "application/json" },
});

axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem("token");

        config.headers = config.headers ?? {};

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            // ensure we don't send a stale header
            delete (config.headers as any).Authorization;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

export default axiosInstance;