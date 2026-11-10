export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("kekego_admin_token");
}

export function setStoredToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("kekego_admin_token", token);
}

export function clearStoredToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("kekego_admin_token");
  localStorage.removeItem("kekego_admin_user");
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      `Unable to connect to Kekego API at ${API_URL}. Please check your connection.`
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      clearStoredToken();
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    const errorObj = data.error || {};
    throw new ApiError(
      response.status,
      errorObj.code || "REQUEST_FAILED",
      errorObj.message || "An unexpected error occurred",
      errorObj.details
    );
  }

  return (data.data !== undefined ? data.data : data) as T;
}
