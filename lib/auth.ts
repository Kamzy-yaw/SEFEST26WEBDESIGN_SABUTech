import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  linkWithPhoneNumber,
  signInWithPopup,
  signOut,
  type ApplicationVerifier,
  type ConfirmationResult,
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
  phoneNumber: string | null;
  isPhoneVerified: boolean;
  contributionCount: number;
  createdAt?: unknown;
};

function normalizeProfile(user: User, existing?: Partial<UserProfile>): UserProfile {
  return {
    uid: user.uid,
    name: existing?.name || user.displayName || "Eco Seller",
    email: existing?.email ?? user.email ?? null,
    photoURL: existing?.photoURL ?? user.photoURL ?? null,
    phoneNumber: existing?.phoneNumber ?? user.phoneNumber ?? null,
    isPhoneVerified: existing?.isPhoneVerified ?? Boolean(user.phoneNumber),
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

export function createRecaptchaVerifier(containerId: string) {
  const { auth } = getFirebaseServices();
  return new RecaptchaVerifier(auth, containerId, {
    size: "normal",
  });
}

export async function sendPhoneOtp(user: User, phoneNumber: string, verifier: ApplicationVerifier) {
  return linkWithPhoneNumber(user, phoneNumber, verifier);
}

export async function confirmPhoneOtp(
  confirmationResult: ConfirmationResult,
  code: string,
  phoneNumber: string,
) {
  const result = await confirmationResult.confirm(code);
  const { db } = getFirebaseServices();

  await setDoc(
    doc(db, firebaseCollections.users, result.user.uid),
    {
      phoneNumber,
      isPhoneVerified: true,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return result.user;
}
