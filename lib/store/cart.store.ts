import { create } from "zustand";
import api from "@/lib/axios";

interface CartItem {
  id: string;
  fieldId?: string;
  eventId?: string;
  ticketTierId?: string;
  ticketPrice?: number;
  field?: any;
  event?: any;
  ticketTier?: any;
  date: string;
  startHour: number;
  endHour: number;
  quantity?: number;
}

interface CartStore {
  items: CartItem[];
  loading: boolean;
  fetchCart: () => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>((set) => ({
  items: [],
  loading: false,

  fetchCart: async () => {
    set({ loading: true });
    try {
      const res = await api.get("/cart");
      set({ items: res.data || [] });
    } catch {
      set({ items: [] });
    } finally {
      set({ loading: false });
    }
  },

  removeItem: async (id: string) => {
    await api.delete(`/cart/${id}`);
    set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
  },

  clearCart: () => set({ items: [] }),
}));
