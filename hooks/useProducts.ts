"use client";

import { useEffect, useMemo, useState } from "react";
import { isFirebaseConfigured } from "@/lib/firebase";
import { subscribeToProducts } from "@/lib/products";
import type { Product, ProductCategory, ProductSubcategory } from "@/lib/types";
import { getSubcategories } from "@/app/login/market/_data/categories";

export function useProducts() {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | "all">("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<ProductSubcategory | "all">("all");
  const [locationQuery, setLocationQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      window.setTimeout(() => {
        setError("Konfigurasi Firebase belum lengkap. Isi NEXT_PUBLIC_FIREBASE_* di .env.local.");
        setLoading(false);
      }, 0);
      return;
    }

    const unsubscribe = subscribeToProducts(
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
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const categoryMatch = selectedCategory === "all" || product.category === selectedCategory;
      const subcategoryMatch =
        selectedSubcategory === "all" || product.subcategory === selectedSubcategory;
      const normalizedLocationQuery = locationQuery.toLowerCase().trim();
      const locationMatch =
        product.location.toLowerCase().includes(normalizedLocationQuery) ||
        product.city.toLowerCase().includes(normalizedLocationQuery);

      return categoryMatch && subcategoryMatch && locationMatch;
    });
  }, [locationQuery, products, selectedCategory, selectedSubcategory]);

  const subcategoryOptions = useMemo(() => {
    return selectedCategory === "all" ? [] : getSubcategories(selectedCategory);
  }, [selectedCategory]);

  const totalSaved = useMemo(() => {
    return products.reduce((acc, product) => acc + (product.ecoSaved || 1), 0);
  }, [products]);

  const resetFilters = () => {
    setSelectedCategory("all");
    setSelectedSubcategory("all");
    setLocationQuery("");
  };

  return {
    products,
    filteredProducts,
    loading,
    error,
    selectedCategory,
    setSelectedCategory,
    selectedSubcategory,
    setSelectedSubcategory,
    locationQuery,
    setLocationQuery,
    subcategoryOptions,
    totalSaved,
    resetFilters,
  };
}
