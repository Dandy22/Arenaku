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

    // Fetch cart otomatis setelah login (hanya CUSTOMER)
    if (user.role === "CUSTOMER") {
      import("./cart.store").then(({ useCartStore }) => {
        useCartStore.getState().fetchCart();
      });
    }
  },

  clearAuth: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ user: null, token: null });

    // Bersihkan cart saat logout
    import("./cart.store").then(({ useCartStore }) => {
      useCartStore.getState().clearCart();
    });
  },

  initAuth: () => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token });

        // Restore cart saat halaman di-refresh (hanya CUSTOMER)
        if (user.role === "CUSTOMER") {
          import("@/lib/store/cart.store").then(({ useCartStore }) => {
            useCartStore.getState().fetchCart();
          });
        }
      } catch (error) {
        console.error("[AuthStore] Failed to parse user:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  },
}));