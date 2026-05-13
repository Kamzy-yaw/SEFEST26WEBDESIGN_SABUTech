import type { ProductCategory, ProductSubcategory } from "./types";

/**
 * Detects product category and subcategory from name (simple heuristic)
 */
export function detectCategory(name: string): {
  category: ProductCategory;
  subcategory: ProductSubcategory;
} {
  const lowerName = name.toLowerCase();

  if (
    lowerName.includes("laptop") ||
    lowerName.includes("notebook") ||
    lowerName.includes("asus") ||
    lowerName.includes("macbook") ||
    lowerName.includes("lenovo") ||
    lowerName.includes("hp") ||
    lowerName.includes("dell")
  ) {
    return { category: "Elektronik", subcategory: "Laptop" };
  }

  if (
    lowerName.includes("iphone") ||
    lowerName.includes("samsung") ||
    lowerName.includes("galaxy") ||
    lowerName.includes("xiaomi") ||
    lowerName.includes("oppo") ||
    lowerName.includes("vivo") ||
    lowerName.includes("pixel") ||
    lowerName.includes("phone") ||
    lowerName.includes("smartphone")
  ) {
    return { category: "Elektronik", subcategory: "Handphone" };
  }

  if (
    lowerName.includes("earphone") ||
    lowerName.includes("airpods") ||
    lowerName.includes("headset") ||
    lowerName.includes("headphone")
  ) {
    return { category: "Elektronik", subcategory: "Earphone" };
  }

  if (lowerName.includes("buku") || lowerName.includes("novel") || lowerName.includes("modul")) {
    return { category: "Buku & Edukasi", subcategory: "Buku Pelajaran" };
  }

  if (lowerName.includes("baju") || lowerName.includes("sepatu") || lowerName.includes("tas")) {
    return { category: "Fashion", subcategory: "Baju" };
  }

  if (lowerName.includes("meja") || lowerName.includes("kursi") || lowerName.includes("lemari")) {
    return { category: "Perabot Rumah", subcategory: "Meja" };
  }

  return { category: "Elektronik", subcategory: "Aksesoris" };
}

/**
 * Calculates ecoSaved (items saved from waste) - setiap barang = 1
 */
export function calculateEcoSaved(): number {
  return 1;
}

/**
 * Formats number to Indonesian locale (with thousand separator)
 */
export function formatIDN(num: number): string {
  return new Intl.NumberFormat("id-ID").format(num);
}

/**
 * Formats price in Indonesian Rupiah format
 */
export function formatPrice(price: number): string {
  return `Rp${formatIDN(price)}`;
}
