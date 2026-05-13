import type { Product } from "@/lib/types";

export {
  isValidWhatsAppNumber,
  normalizeWhatsAppNumber,
  updateUserWhatsApp,
} from "@/lib/users";

export function createWhatsAppProductUrl(product: Product, whatsappNumber?: string | null) {
  const sellerPhone = whatsappNumber?.replace(/[^\d]/g, "");
  const message = `Halo, saya tertarik dengan produk ${product.name} yang Anda jual di Eco Market.`;

  return sellerPhone ? `https://wa.me/${sellerPhone}?text=${encodeURIComponent(message)}` : "#";
}
