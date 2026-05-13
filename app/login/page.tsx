"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/market";
  const { user, profile, loading, error, loginWithGoogle } = useAuth();

  useEffect(() => {
    if (loading || !user || !profile) return;

    if (!profile.isWhatsappConnected) {
      if (redirectTo.startsWith("/verify-phone")) {
        router.replace(redirectTo);
        return;
      }

      router.replace(`/verify-phone?redirect=${encodeURIComponent(redirectTo)}`);
      return;
    }

    router.replace(redirectTo);
  }, [loading, profile, redirectTo, router, user]);

  return (
    <main className="min-h-screen bg-[#f6fbf6] py-12 text-slate-950">
      <div className="mx-auto flex max-w-xl flex-col px-4 sm:px-6 lg:px-8">
        <Link href="/market" className="mb-8 text-sm font-bold text-slate-600 transition hover:text-slate-900">
          Kembali ke marketplace
        </Link>

        <section className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm shadow-emerald-950/5">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-700">Eco Market</p>
          <h1 className="mt-3 text-4xl font-black text-slate-950">Login Seller</h1>
          <p className="mt-2 text-slate-600">
            Masuk dengan Google untuk mulai menjual barang bekas dan berkontribusi pada ekonomi sirkular.
          </p>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-bold text-red-900">{error}</p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={loginWithGoogle}
            disabled={loading}
            className="mt-8 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Memuat..." : "Login dengan Google"}
          </button>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f6fbf6]" />}>
      <LoginPageContent />
    </Suspense>
  );
}
