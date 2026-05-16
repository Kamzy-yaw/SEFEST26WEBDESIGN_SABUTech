import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { firebaseCollections } from "@/lib/firebase-collections";
import { getFirebaseServices } from "@/lib/firebase";
import { updateProductStatus } from "@/lib/products";
import type { Product, Transaction, TransactionMethod, TransactionStatus } from "@/lib/types";

type FirestoreTransaction = Omit<Transaction, "id" | "createdAt" | "updatedAt"> & {
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type CreateTransactionInput = {
  product: Product;
  buyerId: string;
  buyerName: string;
  buyerAvatar?: string | null;
  buyerWhatsapp?: string | null;
  method: TransactionMethod;
};

function toTransaction(id: string, data: FirestoreTransaction): Transaction {
  return {
    id,
    productId: data.productId,
    productName: data.productName,
    productImage: data.productImage ?? null,
    productPrice: data.productPrice,
    sellerId: data.sellerId,
    buyerId: data.buyerId,
    buyerName: data.buyerName,
    buyerAvatar: data.buyerAvatar ?? null,
    buyerWhatsapp: data.buyerWhatsapp ?? null,
    method: data.method,
    status: data.status,
    trackingNumber: data.trackingNumber ?? null,
    shippingNote: data.shippingNote ?? null,
    createdAt: data.createdAt?.toDate().toISOString() ?? new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate().toISOString(),
  };
}

function sortByCreatedAt(transactions: Transaction[]) {
  return transactions.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

async function findOpenBuyerTransaction(productId: string, buyerId: string) {
  const { db } = getFirebaseServices();
  const transactionQuery = query(
    collection(db, firebaseCollections.transactions),
    where("productId", "==", productId),
  );
  const snapshot = await getDocs(transactionQuery);

  return snapshot.docs
    .map((transactionDoc) =>
      toTransaction(transactionDoc.id, transactionDoc.data() as FirestoreTransaction),
    )
    .find(
      (transaction) =>
        transaction.buyerId === buyerId &&
        transaction.status !== "completed" &&
        transaction.status !== "cancelled",
    );
}

export async function createInterestTransaction(input: CreateTransactionInput) {
  const { db } = getFirebaseServices();
  const productStatus = input.product.status ?? "active";

  if (productStatus !== "active") {
    throw new Error("Produk ini sedang tidak tersedia untuk transaksi baru.");
  }

  if (!input.buyerWhatsapp) {
    throw new Error("Hubungkan WhatsApp terlebih dahulu sebelum memulai transaksi.");
  }

  const existingTransaction = await findOpenBuyerTransaction(input.product.id, input.buyerId);
  if (existingTransaction) {
    return existingTransaction;
  }

  const transactionRef = await addDoc(collection(db, firebaseCollections.transactions), {
    productId: input.product.id,
    productName: input.product.name,
    productImage: input.product.imageUrls?.[0] ?? input.product.imageUrl ?? null,
    productPrice: input.product.price,
    sellerId: input.product.sellerId,
    buyerId: input.buyerId,
    buyerName: input.buyerName,
    buyerAvatar: input.buyerAvatar ?? null,
    buyerWhatsapp: input.buyerWhatsapp ?? null,
    method: input.method,
    status: "interested",
    trackingNumber: null,
    shippingNote: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    id: transactionRef.id,
    productId: input.product.id,
    productName: input.product.name,
    productImage: input.product.imageUrls?.[0] ?? input.product.imageUrl ?? null,
    productPrice: input.product.price,
    sellerId: input.product.sellerId,
    buyerId: input.buyerId,
    buyerName: input.buyerName,
    buyerAvatar: input.buyerAvatar ?? null,
    buyerWhatsapp: input.buyerWhatsapp ?? null,
    method: input.method,
    status: "interested" as TransactionStatus,
    createdAt: new Date().toISOString(),
  };
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
  );

  return onSnapshot(
    transactionsQuery,
    (snapshot) => {
      onTransactions(
        sortByCreatedAt(
          snapshot.docs.map((transactionDoc) =>
            toTransaction(transactionDoc.id, transactionDoc.data() as FirestoreTransaction),
          ),
        ),
      );
    },
    (error) => onError(error.message),
  );
}

export function subscribeToBuyerTransactions(
  buyerId: string,
  onTransactions: (transactions: Transaction[]) => void,
  onError: (message: string) => void,
) {
  const { db } = getFirebaseServices();
  const transactionsQuery = query(
    collection(db, firebaseCollections.transactions),
    where("buyerId", "==", buyerId),
  );

  return onSnapshot(
    transactionsQuery,
    (snapshot) => {
      onTransactions(
        sortByCreatedAt(
          snapshot.docs.map((transactionDoc) =>
            toTransaction(transactionDoc.id, transactionDoc.data() as FirestoreTransaction),
          ),
        ),
      );
    },
    (error) => onError(error.message),
  );
}

export async function updateTransactionStatus(
  transaction: Transaction,
  status: TransactionStatus,
  input?: {
    trackingNumber?: string;
    shippingNote?: string;
  },
) {
  const { db } = getFirebaseServices();

  await setDoc(
    doc(db, firebaseCollections.transactions, transaction.id),
    {
      status,
      trackingNumber: input?.trackingNumber ?? transaction.trackingNumber ?? null,
      shippingNote: input?.shippingNote ?? transaction.shippingNote ?? null,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  if (status === "accepted" || status === "shipping") {
    await updateProductStatus(transaction.productId, "reserved");
  }

  if (status === "completed") {
    await updateProductStatus(transaction.productId, "sold");
  }
}

export async function acceptTransaction(transaction: Transaction) {
  await updateTransactionStatus(transaction, "accepted");
}

export async function cancelTransaction(transaction: Transaction) {
  await updateTransactionStatus(transaction, "cancelled");
}

export async function completeTransaction(transaction: Transaction) {
  await updateTransactionStatus(transaction, "completed");
}

export async function markTransactionShipping(
  transaction: Transaction,
  input: {
    trackingNumber?: string;
    shippingNote?: string;
  },
) {
  await updateTransactionStatus(transaction, "shipping", input);
}
