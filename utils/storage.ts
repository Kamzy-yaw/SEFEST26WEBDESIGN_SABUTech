import type { ProductCondition } from "@/lib/types";

const PRODUCT_DRAFT_KEY = "eco-market:product-draft";

export type ProductDraft = {
  productName: string;
  year: string;
  condition: ProductCondition;
  minusDetail: string;
  estimatedPrice: string;
  updatedAt: string;
};

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function parseEstimatedPrice(value: string) {
  return value.replace(/[^0-9]/g, "");
}

export function getProductDraft(): ProductDraft | null {
  if (!canUseLocalStorage()) return null;

  try {
    const rawDraft = window.localStorage.getItem(PRODUCT_DRAFT_KEY);
    return rawDraft ? (JSON.parse(rawDraft) as ProductDraft) : null;
  } catch {
    return null;
  }
}

export function setProductDraft(draft: ProductDraft) {
  if (!canUseLocalStorage()) return;
  window.localStorage.setItem(PRODUCT_DRAFT_KEY, JSON.stringify(draft));
}

export function clearProductDraft() {
  if (!canUseLocalStorage()) return;
  window.localStorage.removeItem(PRODUCT_DRAFT_KEY);
}
