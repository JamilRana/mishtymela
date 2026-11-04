import { create } from "zustand";

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  stockQty: number;
  unit: string;
}

export type PaymentMethod = "Cash" | "bKash" | "Bank";

interface CartState {
  items: CartItem[];
  discount: number;
  paid: number | null; // null means full payment
  accountId: string | null;
  paymentMethod: PaymentMethod;
  customerName: string;
  notes: string;
  
  // Actions
  addItem: (product: {
    id: string;
    name: string;
    sku: string;
    sellingPrice: number;
    stockQty: number;
    unit?: string;
  }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updatePrice: (productId: string, unitPrice: number) => void;
  setDiscount: (discount: number) => void;
  setPaid: (paid: number | null) => void;
  setAccountId: (accountId: string | null) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setCustomerName: (name: string) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;

  // Computed helpers
  subtotal: () => number;
  total: () => number;
  due: () => number;
  change: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  discount: 0,
  paid: null,
  accountId: null,
  paymentMethod: "Cash",
  customerName: "",
  notes: "",

  addItem: (product) => {
    set((state) => {
      const existing = state.items.find((i) => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQty) {
          return state; // Cannot add more than current stock
        }
        return {
          items: state.items.map((i) =>
            i.productId === product.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      if (product.stockQty <= 0) return state;
      return {
        items: [
          ...state.items,
          {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            unitPrice: product.sellingPrice,
            quantity: 1,
            stockQty: product.stockQty,
            unit: product.unit ?? "pcs",
          },
        ],
      };
    });
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    }));
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) => {
        if (i.productId === productId) {
          const clamped = Math.min(quantity, i.stockQty);
          return { ...i, quantity: clamped };
        }
        return i;
      }),
    }));
  },

  updatePrice: (productId, unitPrice) => {
    if (unitPrice < 0) return;
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId ? { ...i, unitPrice } : i
      ),
    }));
  },

  setDiscount: (discount) => set({ discount: Math.max(0, discount) }),
  setPaid: (paid) => set({ paid: paid !== null ? Math.max(0, paid) : null }),
  setAccountId: (accountId) => set({ accountId }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setCustomerName: (customerName) => set({ customerName }),
  setNotes: (notes) => set({ notes }),

  clearCart: () =>
    set({
      items: [],
      discount: 0,
      paid: null,
      customerName: "",
      notes: "",
    }),

  subtotal: () => {
    return get().items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  },

  total: () => {
    const sub = get().subtotal();
    return Math.max(0, sub - get().discount);
  },

  due: () => {
    const tot = get().total();
    const paid = get().paid ?? tot;
    return paid < tot ? tot - paid : 0;
  },

  change: () => {
    const tot = get().total();
    const paid = get().paid ?? tot;
    return paid > tot ? paid - tot : 0;
  },
}));
