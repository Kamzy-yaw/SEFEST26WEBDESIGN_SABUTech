export type ProductCondition = "like_new" | "good" | "minus";
export type ProductStatus = "active" | "reserved" | "sold";

export type ProductCategory = "Elektronik" | "Buku & Edukasi" | "Fashion" | "Perabot Rumah";

export type ProductSubcategory =
  | "Laptop"
  | "Handphone"
  | "Earphone"
  | "Aksesoris"
  | "Buku Pelajaran"
  | "Novel"
  | "Modul"
  | "Alat Tulis"
  | "Baju"
  | "Sepatu"
  | "Tas"
  | "Meja"
  | "Kursi"
  | "Lemari"
  | "Dekorasi";

export type Product = {
  id: string;
  name: string;
  year: number;
  price: number;
  description: string;
  condition: ProductCondition;
  minusDetail?: string;
  conditionDetail?: string;
  imageUrl?: string;
  imageUrls?: string[];
  location: string;
  city: string;
  category: ProductCategory;
  subcategory: ProductSubcategory;
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string;
  sellerPhone?: string;
  sellerVerified: boolean;
  sellerContributionCount: number;
  sellerStatus?: string;
  ecoSaved: number;
  status?: ProductStatus;
  createdAt: string;
};

export type TransactionMethod = "cod" | "shipping";
export type TransactionStatus = "interested" | "accepted" | "shipping" | "completed" | "cancelled";

export type Transaction = {
  id: string;
  productId: string;
  productName: string;
  productImage?: string | null;
  productPrice: number;
  sellerId: string;
  buyerId: string;
  buyerName: string;
  buyerAvatar?: string | null;
  buyerWhatsapp?: string | null;
  method: TransactionMethod;
  status: TransactionStatus;
  trackingNumber?: string | null;
  shippingNote?: string | null;
  createdAt: string;
  updatedAt?: string;
};
