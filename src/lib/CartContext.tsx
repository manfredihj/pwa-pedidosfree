"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { calculateTotal, type OrderDetailGroup } from "./cart";
import type { Product } from "./api";

export interface CartDetailItem {
  idproduct: number;
  nameproduct: string;
  product: Product;
  orderdetailgroups: OrderDetailGroup[];
  quantity: number;
  price: number;
  note: string;
  totaloption: number;
  totaldetail: number;
}

export type ServiceType = "DELIVERY" | "TAKE-AWAY";

interface CartContextValue {
  items: CartDetailItem[];
  itemCount: number;
  total: number;
  serviceType: ServiceType;
  setServiceType: (type: ServiceType) => void;
  addOrderDetail: (product: Product, quantity: number, note: string, groupsdetail: OrderDetailGroup[]) => void;
  removeItem: (index: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

interface CartProviderProps {
  children: ReactNode;
  defaultServiceType?: ServiceType;
}

export function CartProvider({ children, defaultServiceType = "DELIVERY" }: CartProviderProps) {
  const [items, setItems] = useState<CartDetailItem[]>([]);
  const [serviceType, setServiceType] = useState<ServiceType>(defaultServiceType);

  const addOrderDetail = useCallback(
    (product: Product, quantity: number, note: string, groupsdetail: OrderDetailGroup[]) => {
      let totaloption = 0;
      let price = product.price;

      for (const detailgroup of groupsdetail) {
        for (const option of detailgroup.orderdetailproductoptions) {
          if (option.price !== 0) {
            if (option.modifiedtotal) {
              price = option.price;
            } else {
              totaloption += option.price * option.quantity;
            }
          }
        }
      }

      const totaldetail = (price + totaloption) * quantity;

      const item: CartDetailItem = {
        idproduct: product.idproduct,
        nameproduct: product.name,
        product,
        orderdetailgroups: groupsdetail,
        quantity,
        price,
        note,
        totaloption,
        totaldetail,
      };

      setItems((prev) => [...prev, item]);
    },
    [],
  );

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.totaldetail, 0);

  return (
    <CartContext value={{ items, itemCount, total, serviceType, setServiceType, addOrderDetail, removeItem, clearCart }}>
      {children}
    </CartContext>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
