import { create } from "zustand";

interface User {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "VENDOR" | "ADMIN";
}

interface AuthStore {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,

  setAuth: (user, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    set({ user, token });
  },

  clearAuth: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ user: null, token: null });
  },

  initAuth: () => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    console.log("[AuthStore] initAuth called. Token exists:", !!token, "User exists:", !!userStr);
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log("[AuthStore] User loaded from localStorage:", user);
        set({ user, token });
      } catch (error) {
        console.error("[AuthStore] Failed to parse user from localStorage:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    } else {
      console.log("[AuthStore] No token or user in localStorage");
    }
  },
}));