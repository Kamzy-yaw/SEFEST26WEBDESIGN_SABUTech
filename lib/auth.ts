import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { firebaseCollections } from "@/lib/firebase-collections";
import { getFirebaseServices } from "@/lib/firebase";

export type UserProfile = {
  uid: string;
  name: string;
  email: string | null;
  photoURL: string | null;
  whatsappNumber: string | null;
  isWhatsappConnected: boolean;
  contributionCount: number;
  createdAt?: unknown;
};

function normalizeProfile(user: User, existing?: Partial<UserProfile>): UserProfile {
  return {
    uid: user.uid,
    name: existing?.name || user.displayName || "Eco Seller",
    email: existing?.email ?? user.email ?? null,
    photoURL: existing?.photoURL ?? user.photoURL ?? null,
    whatsappNumber: existing?.whatsappNumber ?? null,
    isWhatsappConnected: existing?.isWhatsappConnected ?? false,
    contributionCount: existing?.contributionCount ?? 0,
    createdAt: existing?.createdAt,
  };
}

function normalizeWhatsAppNumber(phoneNumber: string): string {
  const trimmed = phoneNumber.trim().replace(/[\s\-()]/g, "");

  // Already in correct format
  if (trimmed.startsWith("628")) return trimmed;

  // +628xxx format
  if (trimmed.startsWith("+628")) return trimmed.slice(1);

  // 08xxx format
  if (trimmed.startsWith("08")) return `62${trimmed.slice(1)}`;

  // 628xxx without +
  if (trimmed.startsWith("628")) return trimmed;

  return trimmed;
}

export function isValidWhatsAppNumber(phoneNumber: string): boolean {
  const normalized = normalizeWhatsAppNumber(phoneNumber);
  return /^628\d{7,13}$/.test(normalized);
}

export async function upsertUserProfile(user: User) {
  const { db } = getFirebaseServices();
  const userRef = doc(db, firebaseCollections.users, user.uid);
  const snapshot = await getDoc(userRef);
  const existing = snapshot.exists() ? (snapshot.data() as Partial<UserProfile>) : undefined;
  const profile = normalizeProfile(user, existing);

  await setDoc(
    userRef,
    {
      ...profile,
      createdAt: existing?.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return profile;
}

export async function updateUserWhatsApp(userId: string, whatsappNumber: string) {
  const { db } = getFirebaseServices();
  const normalized = normalizeWhatsAppNumber(whatsappNumber);

  if (!isValidWhatsAppNumber(whatsappNumber)) {
    throw new Error("Format nomor WhatsApp tidak valid. Gunakan 08xx atau 62xx.");
  }

  const userRef = doc(db, firebaseCollections.users, userId);

  await setDoc(
    userRef,
    {
      whatsappNumber: normalized,
      isWhatsappConnected: true,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function subscribeToUserProfile(
  uid: string,
  onProfile: (profile: UserProfile | null) => void,
  onError: (message: string) => void,
) {
  const { db } = getFirebaseServices();
  return onSnapshot(
    doc(db, firebaseCollections.users, uid),
    (snapshot) => {
      onProfile(snapshot.exists() ? (snapshot.data() as UserProfile) : null);
    },
    (error) => onError(error.message),
  );
}

export async function loginWithGooglePopup() {
  const { auth } = getFirebaseServices();
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  await upsertUserProfile(result.user);
  return result.user;
}

export async function logoutUser() {
  const { auth } = getFirebaseServices();
  await signOut(auth);
}
