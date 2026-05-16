import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { getFirebaseServices } from "@/lib/firebase";
import { firebaseCollections } from "@/lib/firebase-collections";
import type {
  Product,
  ProductCategory,
  ProductCondition,
  ProductStatus,
  ProductSubcategory,
} from "@/lib/types";
import type { UserProfile } from "@/lib/users";

export type AuthSeller = {
  uid: string;
  name: string;
  avatar?: string;
  phoneNumber?: string | null;
  isPhoneVerified: boolean;
};

export type CreateProductInput = {
  name: string;
  year: number;
  price: number;
  description: string;
  condition: ProductCondition;
  conditionDetail?: string;
  imageUrls: string[];
  location: string;
  category: ProductCategory;
  subcategory: ProductSubcategory;
  seller: AuthSeller;
};

type FirestoreProduct = Omit<Product, "id" | "createdAt"> & {
  sellerId: string;
  city: string;
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  description?: string | null;
  minusDetail?: string | null;
  conditionDetail?: string | null;
  sellerAvatar?: string | null;
  sellerPhone?: string | null;
  sellerVerified?: boolean;
  status?: ProductStatus | null;
  createdAt?: Timestamp;
};

function toCity(value: string) {
  return value.split(",")[0].trim() || value.trim() || "Indonesia";
}

function toProduct(id: string, data: FirestoreProduct): Product {
  return {
    id,
    name: data.name,
    year: data.year,
    price: data.price,
    description: data.description ?? "",
    condition: data.condition,
    minusDetail: data.minusDetail ?? data.conditionDetail ?? undefined,
    conditionDetail: data.conditionDetail ?? data.minusDetail ?? undefined,
    imageUrl: data.imageUrl ?? data.imageUrls?.[0] ?? undefined,
    imageUrls: data.imageUrls ?? (data.imageUrl ? [data.imageUrl] : undefined),
    location: data.location,
    city: data.city || toCity(data.location),
    category: data.category,
    subcategory: data.subcategory,
    sellerId: data.sellerId,
    sellerName: data.sellerName,
    sellerAvatar: data.sellerAvatar ?? undefined,
    sellerPhone: data.sellerPhone ?? undefined,
    sellerVerified: data.sellerVerified ?? false,
    sellerContributionCount: data.sellerContributionCount ?? 1,
    sellerStatus: data.sellerStatus ?? "Penjual Eco",
    ecoSaved: data.ecoSaved ?? 1,
    status: data.status ?? undefined,
    createdAt: data.createdAt?.toDate().toISOString() ?? new Date().toISOString(),
  };
}

export async function getProductById(id: string) {
  const { db } = getFirebaseServices();
  const productRef = doc(db, firebaseCollections.products, id);
  const productSnapshot = await getDoc(productRef);

  if (!productSnapshot.exists()) {
    return null;
  }

  return toProduct(productSnapshot.id, productSnapshot.data() as FirestoreProduct);
}

export function subscribeToProducts(
  onProducts: (products: Product[]) => void,
  onError: (message: string) => void,
) {
  const { db } = getFirebaseServices();
  const productsQuery = query(
    collection(db, firebaseCollections.products),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(
    productsQuery,
    (snapshot) => {
      onProducts(
        snapshot.docs
          .map((productDoc) => toProduct(productDoc.id, productDoc.data() as FirestoreProduct))
          .filter((product) => !product.status || product.status === "active"),
      );
    },
    (error) => {
      onError(error.message);
    },
  );
}

export function subscribeToSellerProducts(
  sellerId: string,
  onProducts: (products: Product[]) => void,
  onError: (message: string) => void,
) {
  const { db } = getFirebaseServices();
  const productsQuery = query(
    collection(db, firebaseCollections.products),
    where("sellerId", "==", sellerId),
  );

  return onSnapshot(
    productsQuery,
    (snapshot) => {
      const products = snapshot.docs
        .map((productDoc) => toProduct(productDoc.id, productDoc.data() as FirestoreProduct))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      onProducts(products);
    },
    (error) => {
      onError(error.message);
    },
  );
}

export async function createProduct(input: CreateProductInput) {
  const { db } = getFirebaseServices();
  const imageUrls = input.imageUrls.slice(0, 2);
  const coverImageUrl = imageUrls[0] ?? null;

  if (imageUrls.length === 0) {
    throw new Error("Unggah minimal 1 foto produk.");
  }

  const userRef = doc(db, firebaseCollections.users, input.seller.uid);
  const userSnapshot = await getDoc(userRef);
  const userProfile = userSnapshot.data() as Partial<UserProfile> | undefined;
  const currentContributionCount =
    typeof userProfile?.contributionCount === "number"
      ? userProfile.contributionCount
      : 0;
  const nextContributionCount = currentContributionCount + 1;
  const sellerPhone = userProfile?.whatsappNumber ?? input.seller.phoneNumber ?? null;
  const sellerVerified = userProfile?.isWhatsappConnected ?? false;

  if (!sellerPhone || !sellerVerified) {
    throw new Error("Hubungkan WhatsApp terlebih dahulu sebelum menjual barang.");
  }

  const productRef = doc(collection(db, firebaseCollections.products));

  await setDoc(productRef, {
    id: productRef.id,
    name: input.name,
    year: input.year,
    price: input.price,
    description: input.description,
    condition: input.condition,
    minusDetail: input.conditionDetail ?? null,
    conditionDetail: input.conditionDetail ?? null,
    imageUrl: coverImageUrl,
    imageUrls,
    location: input.location,
    city: toCity(input.location),
    category: input.category,
    subcategory: input.subcategory,
    sellerId: input.seller.uid,
    sellerName: input.seller.name,
    sellerAvatar: input.seller.avatar ?? null,
    sellerPhone,
    sellerVerified,
    sellerContributionCount: nextContributionCount,
    sellerStatus: sellerVerified ? "WhatsApp Terhubung" : "Penjual Eco",
    ecoSaved: 1,
    status: "active",
    createdAt: serverTimestamp(),
  });

  await setDoc(
    userRef,
    {
      uid: input.seller.uid,
      displayName: input.seller.name,
      name: input.seller.name,
      photoURL: input.seller.avatar ?? null,
      whatsappNumber: sellerPhone,
      isWhatsappConnected: sellerVerified,
      contributionCount: nextContributionCount,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function deleteProduct(productId: string, userId: string) {
  const { db } = getFirebaseServices();
  const productRef = doc(db, firebaseCollections.products, productId);
  const productSnapshot = await getDoc(productRef);

  if (!productSnapshot.exists()) {
    throw new Error("Produk tidak ditemukan.");
  }

  const productData = productSnapshot.data() as FirestoreProduct;

  if (productData.sellerId !== userId) {
    throw new Error("Anda tidak memiliki izin untuk menghapus produk ini.");
  }

  await deleteDoc(productRef);

  const userRef = doc(db, firebaseCollections.users, userId);
  const userSnapshot = await getDoc(userRef);

  if (userSnapshot.exists()) {
    const userData = userSnapshot.data() as Partial<UserProfile> | undefined;
    const currentContributionCount =
      typeof userData?.contributionCount === "number" ? userData.contributionCount : 0;
    const nextContributionCount = Math.max(0, currentContributionCount - 1);

    await setDoc(
      userRef,
      {
        contributionCount: nextContributionCount,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }
}

export async function updateProductStatus(productId: string, status: ProductStatus) {
  const { db } = getFirebaseServices();

  await setDoc(
    doc(db, firebaseCollections.products, productId),
    {
      status,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
