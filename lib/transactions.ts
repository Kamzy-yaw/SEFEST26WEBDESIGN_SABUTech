import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  type Timestamp,
} from "firebase/firestore";
import { firebaseCollections } from "@/lib/firebase-collections";
import { getFirebaseServices } from "@/lib/firebase";
import type { Transaction, TransactionStatus } from "@/lib/types";

type FirestoreTransaction = Omit<Transaction, "id" | "createdAt"> & {
  createdAt?: Timestamp;
};

export type CreateTransactionInput = {
  productId: string;
  productName: string;
  buyerId: string;
  sellerId: string;
  status?: TransactionStatus;
  message?: string;
};

function toTransaction(id: string, data: FirestoreTransaction): Transaction {
  return {
    id,
    productId: data.productId,
    productName: data.productName,
    buyerId: data.buyerId,
    sellerId: data.sellerId,
    status: data.status,
    message: data.message,
    createdAt: data.createdAt?.toDate().toISOString() ?? new Date().toISOString(),
  };
}

export async function createTransaction(input: CreateTransactionInput) {
  const { db } = getFirebaseServices();

  await addDoc(collection(db, firebaseCollections.transactions), {
    productId: input.productId,
    productName: input.productName,
    buyerId: input.buyerId,
    sellerId: input.sellerId,
    status: input.status ?? "interested",
    message: input.message ?? null,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToSellerTransactions(
  sellerId: string,
  onTransactions: (transactions: Transaction[]) => void,
  onError: (message: string) => void,
) {
  const { db } = getFirebaseServices();
  const transactionsQuery = query(
    collection(db, firebaseCollections.transactions),
    where("sellerId", "==", sellerId),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(
    transactionsQuery,
    (snapshot) => {
      onTransactions(
        snapshot.docs.map((transactionDoc) =>
          toTransaction(transactionDoc.id, transactionDoc.data() as FirestoreTransaction),
        ),
      );
    },
    (error) => onError(error.message),
  );
}
