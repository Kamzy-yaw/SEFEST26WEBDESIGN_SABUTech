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
  type Timestamp,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
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
  condition: ProductCondition;
  conditionDetail?: string;
  imageFile?: File;
  location: string;
  category: ProductCategory;
  subcategory: ProductSubcategory;
  seller: AuthSeller;
};

type FirestoreProduct = Omit<Product, "id" | "createdAt"> & {
  sellerId: string;
  city: string;
  imageUrl?: string | null;
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
    condition: data.condition,
    minusDetail: data.minusDetail ?? data.conditionDetail ?? undefined,
    conditionDetail: data.conditionDetail ?? data.minusDetail ?? undefined,
    imageUrl: data.imageUrl ?? undefined,
    location: data.location,
    city: data.city || toCity(data.location),
    category: data.category,
    subcategory: data.subcategory,
    sellerId: data.sellerId,
    sellerName: data.sellerName,
    sellerAvatar: data.sellerAvatar ?? undefined,
    sellerPhone: data.sellerPhone ?? undefined,
    sellerVerified: data.sellerVerified ?? false,
    sellerContributionCount: data.sellerContributionCount,
    sellerStatus: data.sellerStatus,
    ecoSaved: data.ecoSaved,
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

export async function uploadProductImage(file: File, sellerId: string) {
  const { storage } = getFirebaseServices();
  const extension = file.name.split(".").pop() || "jpg";
  const storageRef = ref(storage, `products/${sellerId}/${crypto.randomUUID()}.${extension}`);
  const snapshot = await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(snapshot.ref);
}

export async function createProduct(input: CreateProductInput) {
  const { db } = getFirebaseServices();
  const imageUrl = input.imageFile
    ? await uploadProductImage(input.imageFile, input.seller.uid)
    : undefined;
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
    condition: input.condition,
    minusDetail: input.conditionDetail ?? null,
    conditionDetail: input.conditionDetail ?? null,
    imageUrl: imageUrl ?? null,
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
  const { db, storage } = getFirebaseServices();

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

  // Delete image from storage if exists
  if (productData.imageUrl) {
    try {
      // Parse the image URL to extract the storage path
      const imageRef = ref(storage, productData.imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      // Log but don't throw - image deletion failure shouldn't block product deletion
      console.warn("Gagal menghapus gambar dari Storage:", error);
    }
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
