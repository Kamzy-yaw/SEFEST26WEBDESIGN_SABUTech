"use client";

import { useEffect, useState } from "react";
import {
  acceptTransaction,
  cancelTransaction,
  completeTransaction,
  markTransactionShipping,
  subscribeToBuyerTransactions,
  subscribeToSellerTransactions,
} from "@/lib/transactions";
import type { Transaction } from "@/lib/types";

export function useTransactions(userId?: string) {
  const [sellerTransactions, setSellerTransactions] = useState<Transaction[]>([]);
  const [buyerTransactions, setBuyerTransactions] = useState<Transaction[]>([]);
  const [loadingSellerTransactions, setLoadingSellerTransactions] = useState(true);
  const [loadingBuyerTransactions, setLoadingBuyerTransactions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const unsubscribeSeller = subscribeToSellerTransactions(
      userId,
      (nextTransactions) => {
        setSellerTransactions(nextTransactions);
        setLoadingSellerTransactions(false);
      },
      (message) => {
        setError(message);
        setLoadingSellerTransactions(false);
      },
    );

    const unsubscribeBuyer = subscribeToBuyerTransactions(
      userId,
      (nextTransactions) => {
        setBuyerTransactions(nextTransactions);
        setLoadingBuyerTransactions(false);
      },
      (message) => {
        setError(message);
        setLoadingBuyerTransactions(false);
      },
    );

    return () => {
      unsubscribeSeller();
      unsubscribeBuyer();
    };
  }, [userId]);

  const runAction = async (transactionId: string, action: () => Promise<void>) => {
    setActionId(transactionId);
    setError(null);

    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui transaksi.");
    } finally {
      setActionId(null);
    }
  };

  return {
    sellerTransactions,
    buyerTransactions,
    loadingSellerTransactions,
    loadingBuyerTransactions,
    error,
    actionId,
    accept: (transaction: Transaction) =>
      runAction(transaction.id, () => acceptTransaction(transaction)),
    cancel: (transaction: Transaction) =>
      runAction(transaction.id, () => cancelTransaction(transaction)),
    complete: (transaction: Transaction) =>
      runAction(transaction.id, () => completeTransaction(transaction)),
    markShipping: (
      transaction: Transaction,
      input: {
        trackingNumber?: string;
        shippingNote?: string;
      },
    ) => runAction(transaction.id, () => markTransactionShipping(transaction, input)),
  };
}
