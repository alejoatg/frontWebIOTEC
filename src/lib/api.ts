/**
 * URL base de la API (backend). Usar para auth y demás endpoints.
 */
const getApiUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    return "http://localhost:3001";
  }
  return url.replace(/\/$/, "");
};

export const API_URL = getApiUrl();

export const authEndpoints = {
  me: `${getApiUrl()}/api/auth/me`,
  google: `${getApiUrl()}/api/auth/google`,
  logout: `${getApiUrl()}/api/auth/logout`,
} as const;
