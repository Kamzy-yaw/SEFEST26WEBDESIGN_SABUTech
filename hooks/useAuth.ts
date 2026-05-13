"use client";

import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getFirebaseServices, isFirebaseConfigured } from "@/lib/firebase";
import {
  loginWithGooglePopup,
  logoutUser,
  subscribeToUserProfile,
  upsertUserProfile,
  type UserProfile,
} from "@/lib/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      window.setTimeout(() => {
        setError("Konfigurasi Firebase belum lengkap di .env.local");
        setLoading(false);
      }, 0);
      return;
    }

    const { auth } = getFirebaseServices();
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (nextUser) => {
      unsubscribeProfile?.();
      setUser(nextUser);

      if (!nextUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      upsertUserProfile(nextUser).catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Gagal menyimpan profil user");
      });

      unsubscribeProfile = subscribeToUserProfile(
        nextUser.uid,
        (nextProfile) => {
          setProfile(nextProfile);
          setLoading(false);
        },
        (message) => {
          setError(message);
          setLoading(false);
        },
      );
    });

    return () => {
      unsubscribeProfile?.();
      unsubscribeAuth();
    };
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      setError(null);
      await loginWithGooglePopup();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal login dengan Google");
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
  }, []);

  return {
    user,
    profile,
    loading,
    error,
    loginWithGoogle,
    logout,
  };
}
