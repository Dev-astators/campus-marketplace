const LOCAL_API_URL = "http://localhost:8080";
const AZURE_API_URL = "https://campus-marketplace-server.azurewebsites.net";

const removeTrailingSlash = (url) => url.replace(/\/+$/, "");

export const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;

  if (envUrl && typeof envUrl === "string" && envUrl.trim()) {
    return removeTrailingSlash(envUrl.trim());
  }

  if (typeof window !== "undefined") {
    const { hostname } = window.location;

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return LOCAL_API_URL;
    }
  }

  return AZURE_API_URL;
};

export const API_BASE_URL = getApiBaseUrl();
