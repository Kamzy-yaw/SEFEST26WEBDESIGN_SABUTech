"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ConfirmationResult, RecaptchaVerifier } from "firebase/auth";
import { useAuth } from "@/hooks/useAuth";
import { confirmPhoneOtp, createRecaptchaVerifier, sendPhoneOtp } from "@/lib/auth";

function normalizeIndonesianPhone(value: string) {
  const trimmed = value.trim().replace(/[\s-]/g, "");

  if (trimmed.startsWith("+628")) return trimmed;
  if (trimmed.startsWith("08")) return `+62${trimmed.slice(1)}`;
  if (trimmed.startsWith("628")) return `+${trimmed}`;

  return trimmed;
}

function VerifyPhonePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/sell";
  const { user, profile, loading: authLoading } = useAuth();
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedPhone = useMemo(() => normalizeIndonesianPhone(phoneNumber), [phoneNumber]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(
        `/login?redirect=${encodeURIComponent(`/verify-phone?redirect=${encodeURIComponent(redirectTo)}`)}`,
      );
      return;
    }
    if (profile?.isPhoneVerified) {
      router.replace(redirectTo);
    }
  }, [authLoading, profile?.isPhoneVerified, redirectTo, router, user]);

  useEffect(() => {
    if (!user || recaptchaRef.current) return;
    recaptchaRef.current = createRecaptchaVerifier("recaptcha-container");

    return () => {
      recaptchaRef.current?.clear();
      recaptchaRef.current = null;
    };
  }, [user]);

  const handleSendOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!user || !recaptchaRef.current) {
      setError("Login Google diperlukan sebelum verifikasi nomor.");
      return;
    }

    if (!/^\+628\d{7,13}$/.test(normalizedPhone)) {
      setError("Gunakan format nomor Indonesia, contoh: +6281234567890.");
      return;
    }

    setLoading(true);
    try {
      const result = await sendPhoneOtp(user, normalizedPhone, recaptchaRef.current);
      setConfirmationResult(result);
    } catch (err) {
      recaptchaRef.current?.clear();
      recaptchaRef.current = createRecaptchaVerifier("recaptcha-container");
      setError(err instanceof Error ? err.message : "Gagal mengirim OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!confirmationResult) {
      setError("Kirim OTP terlebih dahulu.");
      return;
    }

    if (!otp.trim()) {
      setError("Masukkan kode OTP.");
      return;
    }

    setLoading(true);
    try {
      await confirmPhoneOtp(confirmationResult, otp.trim(), normalizedPhone);
      router.replace(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP tidak valid.");
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
          <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-700">Verified Seller</p>
          <h1 className="mt-3 text-4xl font-black text-slate-950">Verifikasi Nomor HP</h1>
          <p className="mt-2 text-slate-600">
            Nomor terverifikasi membuat buyer lebih percaya dan dipakai untuk tombol WhatsApp.
          </p>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-bold text-red-900">{error}</p>
            </div>
          ) : null}

          <form onSubmit={handleSendOtp} className="mt-8 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Nomor HP Indonesia</label>
              <input
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="+6281234567890"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
              <p className="mt-2 text-xs font-semibold text-slate-500">
                Format otomatis mendukung 08..., 628..., atau +628...
              </p>
            </div>

            <div id="recaptcha-container" />

            <button
              type="submit"
              disabled={loading || !user}
              className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "Mengirim..." : confirmationResult ? "Kirim Ulang OTP" : "Kirim OTP"}
            </button>
          </form>

          {confirmationResult ? (
            <form onSubmit={handleConfirmOtp} className="mt-6 space-y-4 border-t border-emerald-100 pt-6">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Kode OTP</label>
                <input
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  placeholder="6 digit kode"
                  inputMode="numeric"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? "Memverifikasi..." : "Verifikasi Nomor"}
              </button>
            </form>
          ) : null}
        </section>
      </div>
    </main>
  );
}

export default function VerifyPhonePage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f6fbf6]" />}>
      <VerifyPhonePageContent />
    </Suspense>
  );
}
