import type { ProductCategory, ProductSubcategory } from "@/lib/types";

export type CategoryDefinition = {
  label: ProductCategory;
  subcategories: ProductSubcategory[];
};

export const categoryDefinitions: CategoryDefinition[] = [
  {
    label: "Elektronik",
    subcategories: ["Laptop", "Handphone", "Earphone", "Aksesoris"],
  },
  {
    label: "Buku & Edukasi",
    subcategories: ["Buku Pelajaran", "Novel", "Modul", "Alat Tulis"],
  },
  {
    label: "Fashion",
    subcategories: ["Baju", "Sepatu", "Tas", "Aksesoris"],
  },
  {
    label: "Perabot Rumah",
    subcategories: ["Meja", "Kursi", "Lemari", "Dekorasi"],
  },
];

export const categoryOptions: Array<{
  label: string;
  value: ProductCategory | "all";
}> = [
  { label: "Semua kategori", value: "all" },
  ...categoryDefinitions.map((category) => ({
    label: category.label,
    value: category.label,
  })),
];

export function getSubcategories(category: ProductCategory): ProductSubcategory[] {
  return categoryDefinitions.find((item) => item.label === category)?.subcategories ?? [];
}

export function isProductCategory(value: unknown): value is ProductCategory {
  return categoryDefinitions.some((category) => category.label === value);
}

export function isProductSubcategory(
  category: ProductCategory,
  value: unknown,
): value is ProductSubcategory {
  return getSubcategories(category).some((subcategory) => subcategory === value);
}
