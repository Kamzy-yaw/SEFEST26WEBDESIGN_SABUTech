"use client";

import { useEffect, useState } from "react";
import { subscribeToSellerTransactions } from "@/lib/transactions";
import type { Transaction } from "@/lib/types";

export function useTransactions(sellerId?: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sellerId) return;

    const unsubscribe = subscribeToSellerTransactions(
      sellerId,
      (nextTransactions) => {
        setTransactions(nextTransactions);
        setError(null);
        setLoading(false);
      },
      (message) => {
        setError(message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [sellerId]);

  return {
    transactions,
    loading,
    error,
  };
}
