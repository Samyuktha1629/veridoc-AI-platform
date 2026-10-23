const configuredApiBase = process.env.REACT_APP_API_URL;

const defaultApiBase = (() => {
  if (typeof window !== "undefined" && window.location?.hostname) {
    return `http://${window.location.hostname}:8000`;
  }
  return "http://localhost:8000";
})();

export const API_BASE =
  configuredApiBase ||
  (process.env.NODE_ENV === "development" ? defaultApiBase : "");

const TOKEN_KEY = "veridoc.accessToken";

export function getAccessToken() {
  return window.sessionStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token) {
  window.sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken() {
  window.sessionStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    clearAccessToken();
    window.dispatchEvent(new Event("veridoc:unauthorized"));
  }
  return response;
}
