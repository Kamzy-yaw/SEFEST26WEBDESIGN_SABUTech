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
import type { Product, ProductCategory, ProductCondition, ProductSubcategory } from "@/lib/types";
import type { UserProfile } from "@/lib/auth";

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
    sellerStatus: data.sellerStatus ?? "Eco Seller",
    ecoSaved: data.ecoSaved ?? 1,
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
        snapshot.docs.map((productDoc) =>
          toProduct(productDoc.id, productDoc.data() as FirestoreProduct),
        ),
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
    throw new Error("Upload minimal 1 foto produk.");
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
    sellerStatus: sellerVerified ? "WhatsApp Connected" : "Eco Seller",
    ecoSaved: 1,
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

  // Get product to verify ownership
  const productRef = doc(db, firebaseCollections.products, productId);
  const productSnapshot = await getDoc(productRef);

  if (!productSnapshot.exists()) {
    throw new Error("Produk tidak ditemukan.");
  }

  const productData = productSnapshot.data() as FirestoreProduct;

  // Check if user is the product owner
  if (productData.sellerId !== userId) {
    throw new Error("Anda tidak memiliki izin untuk menghapus produk ini.");
  }

  // Delete product from Firestore
  await deleteDoc(productRef);

  // Update user's contribution count (decrement by 1)
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
