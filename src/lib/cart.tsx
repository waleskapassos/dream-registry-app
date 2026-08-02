import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type CartItem = {
  giftId: string;
  title: string;
  priceCents: number;
  imageUrl: string | null;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  totalCents: number;
  count: number;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (giftId: string, quantity: number) => void;
  remove: (giftId: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "wedding-cart-v1";
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const add = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((entry) => entry.giftId === item.giftId);
      if (existing) {
        return prev.map((entry) =>
          entry.giftId === item.giftId
            ? { ...entry, quantity: entry.quantity + quantity }
            : entry,
        );
      }
      return [...prev, { ...item, quantity }];
    });
  }, []);

  const setQuantity = useCallback((giftId: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((entry) => entry.giftId !== giftId)
        : prev.map((entry) => (entry.giftId === giftId ? { ...entry, quantity } : entry)),
    );
  }, []);

  const remove = useCallback((giftId: string) => {
    setItems((prev) => prev.filter((entry) => entry.giftId !== giftId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const totalCents = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    return { items, totalCents, count, add, setQuantity, remove, clear };
  }, [items, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart precisa estar dentro de <CartProvider>");
  return context;
}
