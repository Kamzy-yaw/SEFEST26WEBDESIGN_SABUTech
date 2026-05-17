"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/logic/auth.logic";
import {
  isValidWhatsAppNumber,
  requestWhatsAppOtp,
  verifyWhatsAppOtp,
} from "@/logic/whatsapp.logic";

type VerificationStep = "phone" | "code";

function ConnectWhatsAppPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/sell";
  const prefilledPhone = searchParams.get("phone") || "";
  const { user, profile, loading: authLoading } = useAuth();
  const [whatsappNumber, setWhatsappNumber] = useState(prefilledPhone);
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<VerificationStep>("phone");
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = window.setTimeout(() => {
      setCountdown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [countdown]);

  const handleRequestCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user) {
      setError("Login Google diperlukan terlebih dahulu.");
      return;
    }

    if (!whatsappNumber.trim()) {
      setError("Masukkan nomor WhatsApp Anda.");
      return;
    }

    if (!isValidWhatsAppNumber(whatsappNumber)) {
      setError("Format nomor tidak valid. Gunakan 08xxxx, 628xxxx, atau +628xxxx.");
      return;
    }

    setLoading(true);
    try {
      const idToken = await user.getIdToken();
      const message = await requestWhatsAppOtp(idToken, whatsappNumber);
      setSuccess(message);
      setStep("code");
      setCountdown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim kode verifikasi.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user) {
      setError("Login Google diperlukan terlebih dahulu.");
      return;
    }

    if (!/^\d{6}$/.test(otpCode.trim())) {
      setError("Masukkan kode OTP 6 digit.");
      return;
    }

    setLoading(true);
    try {
      const idToken = await user.getIdToken();
      const message = await verifyWhatsAppOtp(idToken, otpCode);
      setSuccess(message);
      setTimeout(() => {
        router.replace(redirectTo);
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memverifikasi kode.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!user || countdown > 0) return;

    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const idToken = await user.getIdToken();
      const message = await requestWhatsAppOtp(idToken, whatsappNumber);
      setSuccess(message);
      setCountdown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim ulang kode.");
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
            Nomor WhatsApp digunakan agar pembeli dan penjual bisa saling menghubungi dengan aman.
          </p>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-bold text-red-900">{error}</p>
            </div>
          ) : null}

          {success ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-bold text-emerald-900">{success}</p>
            </div>
          ) : null}

          {step === "phone" ? (
            <form onSubmit={handleRequestCode} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Nomor WhatsApp</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-sm font-bold text-slate-500">ID</span>
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
                  Format: 08xxxx, 628xxxx, atau +628xxxx.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !user}
                className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Mengirim kode..." : "Kirim Kode"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Kode OTP</label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  inputMode="numeric"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-lg font-black tracking-[0.35em] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  disabled={loading}
                />
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  Masukkan 6 digit kode yang dikirim ke WhatsApp Anda.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !user}
                className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Memverifikasi..." : "Verifikasi"}
              </button>

              <button
                type="button"
                disabled={loading || countdown > 0}
                onClick={handleResendCode}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {countdown > 0 ? `Kirim ulang dalam ${countdown} detik` : "Kirim Ulang Kode"}
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setStep("phone");
                  setOtpCode("");
                  setSuccess(null);
                  setError(null);
                }}
                className="w-full text-sm font-bold text-slate-500 transition hover:text-slate-900"
              >
                Ubah nomor WhatsApp
              </button>
            </form>
          )}

          <div className="mt-8 space-y-3 border-t border-slate-100 pt-6">
            <h3 className="font-bold text-slate-900">Mengapa WhatsApp diperlukan?</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>Pembeli dan penjual bisa berkomunikasi langsung</li>
              <li>COD, pengiriman, dan pengecekan kondisi barang jadi lebih jelas</li>
              <li>Transaksi tidak bisa dilanjutkan tanpa nomor WhatsApp aktif</li>
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
