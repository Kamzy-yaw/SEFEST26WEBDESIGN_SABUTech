"use client";

import { useEffect, useMemo, useState } from "react";
import { deleteProduct, subscribeToSellerProducts } from "@/lib/products";
import type { Product } from "@/lib/types";

export function useSellerProducts(userId?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToSellerProducts(
      userId,
      (nextProducts) => {
        setProducts(nextProducts);
        setError(null);
        setLoading(false);
      },
      (message) => {
        setError(message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [userId]);

  const stats = useMemo(() => {
    return {
      activeProducts: products.length,
      totalEcoSaved: products.reduce((total, product) => total + (product.ecoSaved || 0), 0),
      totalValue: products.reduce((total, product) => total + (product.price || 0), 0),
    };
  }, [products]);

  const removeProduct = async (productId: string) => {
    if (!userId) return;

    setDeletingId(productId);
    setError(null);

    try {
      await deleteProduct(productId, userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus produk.");
    } finally {
      setDeletingId(null);
    }
  };

  return {
    products,
    loading,
    error,
    deletingId,
    stats,
    removeProduct,
  };
}
