import type { Product } from "@/lib/types";

export {
  isValidWhatsAppNumber,
  normalizeWhatsAppNumber,
  updateUserWhatsApp,
} from "@/lib/users";

type WhatsAppOtpResponse = {
  success?: boolean;
  message?: string;
  error?: string;
};

async function parseOtpResponse(response: Response) {
  const data = (await response.json().catch(() => ({}))) as WhatsAppOtpResponse;

  if (!response.ok || !data.success) {
    throw new Error(data.error || "Permintaan verifikasi WhatsApp gagal.");
  }

  return data.message || "Berhasil.";
}

export async function requestWhatsAppOtp(idToken: string, phone: string) {
  const response = await fetch("/api/whatsapp/request-code", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ phone }),
  });

  return parseOtpResponse(response);
}

export async function verifyWhatsAppOtp(idToken: string, code: string) {
  const response = await fetch("/api/whatsapp/verify-code", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ code }),
  });

  return parseOtpResponse(response);
}

export function createWhatsAppProductUrl(product: Product, whatsappNumber?: string | null) {
  const sellerPhone = whatsappNumber?.replace(/[^\d]/g, "");
  const message = `Halo, saya tertarik dengan produk ${product.name} yang Anda jual di Eco Market.`;

  return sellerPhone ? `https://wa.me/${sellerPhone}?text=${encodeURIComponent(message)}` : "#";
}
