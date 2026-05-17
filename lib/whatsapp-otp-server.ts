import { randomInt } from "crypto";
import { firebaseCollections } from "@/lib/firebase-collections";
import { getFirebaseAdminServices } from "@/lib/firebase-admin";
import { isValidWhatsAppNumber, normalizeWhatsAppNumber } from "@/lib/whatsapp";

export type VerifiedFirebaseUser = {
  uid: string;
  email?: string | null;
  name?: string | null;
  photoURL?: string | null;
};

export type WhatsAppVerification = {
  uid: string;
  phone: string;
  code: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
  createdAt: number;
  status: "pending" | "sent" | "verified" | "expired";
};

const OTP_EXPIRY_MS = 5 * 60 * 1000;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Login Google diperlukan terlebih dahulu.");
  }

  return authHeader.slice("Bearer ".length);
}

export async function requireFirebaseUser(request: Request) {
  const idToken = getBearerToken(request);
  const { adminAuth } = getFirebaseAdminServices();
  const decodedToken = await adminAuth.verifyIdToken(idToken);

  if (!decodedToken.uid) {
    throw new Error("Sesi login tidak valid. Silakan login ulang.");
  }

  return {
    user: {
      uid: decodedToken.uid,
      email: decodedToken.email ?? null,
      name: decodedToken.name ?? null,
      photoURL: decodedToken.picture ?? null,
    } satisfies VerifiedFirebaseUser,
  };
}

export function normalizeAndValidateWhatsApp(phone: unknown) {
  if (typeof phone !== "string" || !phone.trim()) {
    throw new Error("Masukkan nomor WhatsApp.");
  }

  if (!isValidWhatsAppNumber(phone)) {
    throw new Error("Format nomor tidak valid. Gunakan 08xxxx, 628xxxx, atau +628xxxx.");
  }

  return normalizeWhatsAppNumber(phone);
}

export function generateOtpCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function createVerification(uid: string, phone: string, code: string): WhatsAppVerification {
  const now = Date.now();

  return {
    uid,
    phone,
    code,
    expiresAt: now + OTP_EXPIRY_MS,
    attempts: 0,
    lastSentAt: now,
    createdAt: now,
    status: "pending",
  };
}

export async function getWhatsappVerification(uid: string) {
  const { adminDb } = getFirebaseAdminServices();
  const snapshot = await adminDb
    .collection(firebaseCollections.whatsappVerifications)
    .doc(uid)
    .get();

  return snapshot.exists ? (snapshot.data() as WhatsAppVerification) : null;
}

export async function saveWhatsappVerification(verification: WhatsAppVerification) {
  const { adminDb } = getFirebaseAdminServices();
  await adminDb
    .collection(firebaseCollections.whatsappVerifications)
    .doc(verification.uid)
    .set(verification, { merge: true });
}

export async function markUserWhatsappVerified(uid: string, phone: string) {
  const { adminDb } = getFirebaseAdminServices();
  await adminDb.collection(firebaseCollections.users).doc(uid).set(
    {
      uid,
      whatsappNumber: phone,
      isWhatsappConnected: true,
      updatedAt: Date.now(),
    },
    { merge: true },
  );
}

export async function sendOtpToBot(phone: string, code: string) {
  const endpoint = process.env.BOT_OTP_ENDPOINT;
  const secret = process.env.BOT_OTP_SECRET;

  if (!endpoint || !secret) {
    throw new Error("Konfigurasi BOT_OTP_ENDPOINT atau BOT_OTP_SECRET belum tersedia.");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret,
      phone,
      code,
    }),
  });

  if (!response.ok) {
    throw new Error("Bot WhatsApp gagal mengirim kode. Coba lagi nanti.");
  }
}
