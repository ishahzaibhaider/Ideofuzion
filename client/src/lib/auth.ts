import { apiRequest } from "./queryClient";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const auth = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiRequest("POST", "/api/auth/login", { email, password });
    const data = await response.json();
    
    // Store token in localStorage
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    
    return data;
  },

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const response = await apiRequest("POST", "/api/auth/register", { name, email, password });
    const data = await response.json();
    
    // Store token in localStorage
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    
    return data;
  },

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getToken(): string | null {
    return localStorage.getItem("token");
  },

  getUser(): User | null {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};

// Add auth header to all API requests
const originalApiRequest = apiRequest;
export const authenticatedApiRequest = async (
  method: string,
  url: string,
  data?: unknown
): Promise<Response> => {
  const token = auth.getToken();
  
  const response = await fetch(url, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!response.ok) {
    const text = (await response.text()) || response.statusText;
    throw new Error(`${response.status}: ${text}`);
  }

  return response;
};
