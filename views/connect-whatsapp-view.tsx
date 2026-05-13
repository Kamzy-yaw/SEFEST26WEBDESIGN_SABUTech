"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/logic/auth.logic";
import { updateUserWhatsApp, isValidWhatsAppNumber } from "@/logic/whatsapp.logic";

function ConnectWhatsAppPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/sell";
  const { user, profile, loading: authLoading } = useAuth();
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(
        `/login?redirect=${encodeURIComponent(`/verify-phone?redirect=${encodeURIComponent(redirectTo)}`)}`,
      );
      return;
    }
    if (profile?.isWhatsappConnected) {
      router.replace(redirectTo);
    }
  }, [authLoading, profile?.isWhatsappConnected, redirectTo, router, user]);

  const handleConnectWhatsApp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (!user) {
      setError("Login Google diperlukan terlebih dahulu.");
      return;
    }

    if (!whatsappNumber.trim()) {
      setError("Masukkan nomor WhatsApp Anda.");
      return;
    }

    if (!isValidWhatsAppNumber(whatsappNumber)) {
      setError(
        "Format nomor tidak valid. Gunakan 08xx (misal: 081234567890) atau 62xx (misal: 6281234567890).",
      );
      return;
    }

    setLoading(true);
    try {
      await updateUserWhatsApp(user.uid, whatsappNumber);
      setSuccess(true);
      setTimeout(() => {
        router.replace(redirectTo);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan nomor WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6fbf6] py-12 text-slate-950">
      <div className="mx-auto flex max-w-xl flex-col px-4 sm:px-6 lg:px-8">
        <Link href="/market" className="mb-8 text-sm font-bold text-slate-600 transition hover:text-slate-900">
          Kembali ke marketplace
        </Link>

        <section className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm shadow-emerald-950/5">
          <h1 className="mt-3 text-4xl font-black text-slate-950">Hubungkan WhatsApp</h1>
          <p className="mt-2 leading-relaxed text-slate-600">
                Nomor WhatsApp digunakan untuk tombol obrolan penjual agar pembeli bisa langsung menghubungi Anda.
            Nomor akan tersimpan di profil dan setiap produk yang Anda jual.
          </p>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-bold text-red-900">{error}</p>
            </div>
          ) : null}

          {success ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-bold text-emerald-900">✓ WhatsApp berhasil tersimpan!</p>
            </div>
          ) : null}

          <form onSubmit={handleConnectWhatsApp} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Nomor WhatsApp</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-sm font-bold text-slate-500">🇮🇩</span>
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(event) => setWhatsappNumber(event.target.value)}
                  placeholder="081234567890"
                  inputMode="tel"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-14 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  disabled={loading}
                />
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-500">
                Format: 08xxxxxxxx atau 62xxxxxxxx (tanpa +/-)
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !user || success}
              className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Menyimpan..." : success ? "Berhasil tersimpan" : "Hubungkan WhatsApp"}
            </button>

            <button
              type="button"
              onClick={() => router.replace(redirectTo)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Lewati untuk Sekarang
            </button>
          </form>

          <div className="mt-8 space-y-3 border-t border-slate-100 pt-6">
            <h3 className="font-bold text-slate-900">Mengapa WhatsApp diperlukan?</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>Pembeli bisa menghubungi Anda langsung dari marketplace</li>
              <li>Meningkatkan kepercayaan pembeli terhadap produk Anda</li>
              <li>Nomor akan ditampilkan di profil penjual dan setiap produk</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}

export function ConnectWhatsAppView() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f6fbf6]" />}>
      <ConnectWhatsAppPageContent />
    </Suspense>
  );
}
