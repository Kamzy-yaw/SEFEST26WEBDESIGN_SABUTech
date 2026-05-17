import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { firebaseCollections } from "@/lib/firebase-collections";
import { getFirebaseServices } from "@/lib/firebase";
import { isValidWhatsAppNumber, normalizeWhatsAppNumber } from "@/lib/whatsapp";

export type UserProfile = {
  uid: string;
  name: string;
  email: string | null;
  photoURL: string | null;
  whatsappNumber: string | null;
  isWhatsappConnected: boolean;
  contributionCount: number;
  createdAt?: unknown;
  updatedAt?: unknown;
};

function normalizeProfile(user: User, existing?: Partial<UserProfile>): UserProfile {
  return {
    uid: user.uid,
    name: existing?.name || user.displayName || "Penjual Eco",
    email: existing?.email ?? user.email ?? null,
    photoURL: existing?.photoURL ?? user.photoURL ?? null,
    whatsappNumber: existing?.whatsappNumber ?? null,
    isWhatsappConnected: existing?.isWhatsappConnected ?? false,
    contributionCount: existing?.contributionCount ?? 0,
    createdAt: existing?.createdAt,
  };
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
  void userId;
  void whatsappNumber;
  throw new Error("Verifikasi WhatsApp harus melalui kode OTP.");
}

export async function updateUserProfile(
  userId: string,
  input: {
    name: string;
    whatsappNumber: string;
  },
) {
  const { db } = getFirebaseServices();
  const name = input.name.trim();
  const normalizedWhatsapp = normalizeWhatsAppNumber(input.whatsappNumber);

  if (!name) {
    throw new Error("Nama penjual wajib diisi.");
  }

  if (!isValidWhatsAppNumber(input.whatsappNumber)) {
    throw new Error("Format nomor WhatsApp tidak valid. Gunakan 08xx, 628xx, atau +628xx.");
  }

  const userRef = doc(db, firebaseCollections.users, userId);
  const snapshot = await getDoc(userRef);
  const existing = snapshot.exists() ? (snapshot.data() as Partial<UserProfile>) : null;

  if (existing?.whatsappNumber !== normalizedWhatsapp || !existing?.isWhatsappConnected) {
    throw new Error("Ganti nomor WhatsApp harus melalui verifikasi OTP.");
  }

  await setDoc(
    userRef,
    {
      uid: userId,
      name,
      whatsappNumber: normalizedWhatsapp,
      isWhatsappConnected: true,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function getUserProfile(userId: string) {
  const { db } = getFirebaseServices();
  const userSnapshot = await getDoc(doc(db, firebaseCollections.users, userId));

  return userSnapshot.exists() ? (userSnapshot.data() as UserProfile) : null;
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
