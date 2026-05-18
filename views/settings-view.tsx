"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/logic/auth.logic";
import {
  isValidWhatsAppNumber,
  normalizeWhatsAppNumber,
  updateUserName,
} from "@/logic/users.logic";
import { requestWhatsAppOtp, verifyWhatsAppOtp } from "@/logic/whatsapp.logic";
import { SafeImage } from "@/components/SafeImage";

type WhatsAppChangeStep = "phone" | "code";

export function SettingsView() {
  const router = useRouter();
  const { user, profile, loading: authLoading, error: authError } = useAuth();
  const [name, setName] = useState("");
  const [syncedProfileId, setSyncedProfileId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChangingWhatsapp, setIsChangingWhatsapp] = useState(false);
  const [newWhatsappNumber, setNewWhatsappNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [whatsappStep, setWhatsappStep] = useState<WhatsAppChangeStep>("phone");
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  const [whatsappSuccess, setWhatsappSuccess] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/settings");
    }
  }, [authLoading, router, user]);

  useEffect(() => {
    if (!profile || syncedProfileId === profile.uid) return;

    // Sync the loaded Firestore profile into the editable form once per user.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(profile.name || "");
    setSyncedProfileId(profile.uid);
  }, [profile, syncedProfileId]);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = window.setTimeout(() => {
      setCountdown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [countdown]);

  const currentWhatsapp = profile?.whatsappNumber || "";
  const isWhatsappConnected = Boolean(profile?.isWhatsappConnected && currentWhatsapp);

  const resetWhatsappChange = () => {
    setIsChangingWhatsapp(false);
    setNewWhatsappNumber("");
    setOtpCode("");
    setWhatsappStep("phone");
    setWhatsappError(null);
    setCountdown(0);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) return;

    const nextName = name.trim();

    setSuccess(null);
    setError(null);

    if (!nextName) {
      setError("Nama penjual wajib diisi.");
      return;
    }

    setSaving(true);

    try {
      await updateUserName(user.uid, nextName);
      setSuccess("Profil penjual berhasil diperbarui.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan profil penjual.");
    } finally {
      setSaving(false);
    }
  };

  const handleRequestWhatsappCode = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    if (!user) return;

    setWhatsappError(null);
    setWhatsappSuccess(null);

    if (!newWhatsappNumber.trim()) {
      setWhatsappError("Masukkan nomor WhatsApp baru.");
      return;
    }

    if (!isValidWhatsAppNumber(newWhatsappNumber)) {
      setWhatsappError("Format WhatsApp harus 08xxxx, 628xxxx, atau +628xxxx.");
      return;
    }

    const normalizedNewPhone = normalizeWhatsAppNumber(newWhatsappNumber);

    if (normalizedNewPhone === currentWhatsapp) {
      setWhatsappError("Nomor ini sudah terhubung.");
      return;
    }

    setWhatsappLoading(true);

    try {
      const idToken = await user.getIdToken();
      const message = await requestWhatsAppOtp(idToken, newWhatsappNumber, "change");
      setWhatsappSuccess(message);
      setWhatsappStep("code");
      setCountdown(60);
    } catch (err) {
      setWhatsappError(err instanceof Error ? err.message : "Gagal mengirim kode verifikasi.");
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleVerifyNewWhatsapp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) return;

    setWhatsappError(null);
    setWhatsappSuccess(null);

    if (!/^\d{6}$/.test(otpCode.trim())) {
      setWhatsappError("Masukkan kode OTP 6 digit.");
      return;
    }

    setWhatsappLoading(true);

    try {
      const idToken = await user.getIdToken();
      await verifyWhatsAppOtp(idToken, otpCode, "change");
      setWhatsappSuccess("Nomor WhatsApp berhasil diperbarui.");
      resetWhatsappChange();
    } catch (err) {
      setWhatsappError(err instanceof Error ? err.message : "Gagal memverifikasi nomor baru.");
    } finally {
      setWhatsappLoading(false);
    }
  };

  if (authLoading || (!user && !authError)) {
    return (
      <main className="min-h-screen bg-[#f6fbf6] px-4 py-10 text-slate-950">
        <div className="mx-auto max-w-3xl rounded-3xl border border-emerald-100 bg-white p-6">
          <div className="h-8 w-48 animate-pulse rounded bg-emerald-100" />
          <div className="mt-6 h-56 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </main>
    );
  }

  const avatarUrl = profile?.photoURL || user?.photoURL || "/default-avatar.png";
  const sellerName = profile?.name || user?.displayName || "Penjual Eco";
  const email = profile?.email || user?.email || "-";

  return (
    <main className="min-h-screen bg-[#f6fbf6] px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="text-sm font-bold text-slate-600 transition hover:text-slate-900"
          >
            Kembali ke Dashboard
          </Link>
          <Link
            href="/login/market"
            className="text-sm font-bold text-emerald-700 transition hover:text-emerald-900"
          >
            Marketplace
          </Link>
        </div>

        <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm shadow-emerald-950/5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <SafeImage
              src={avatarUrl}
              fallbackSrc="/default-avatar.png"
              alt=""
              className="h-20 w-20 rounded-3xl border border-emerald-100 object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-emerald-700">Pengaturan Akun</p>
              <h1 className="truncate text-3xl font-black tracking-tight">{sellerName}</h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">{email}</p>
            </div>
            <span
              className={`w-fit rounded-full px-3 py-1 text-xs font-black ${
                isWhatsappConnected
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {isWhatsappConnected ? "WhatsApp Terhubung" : "Belum Terhubung"}
            </span>
          </div>

          {(error || authError) && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error || authError}
            </div>
          )}

          {success && (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label htmlFor="seller-name" className="text-sm font-black text-slate-900">
                Nama Penjual
              </label>
              <input
                id="seller-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Contoh: Zys"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan Profil"}
            </button>
          </form>
        </section>

        <section className="mt-6 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm shadow-emerald-950/5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-black tracking-tight">WhatsApp</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {isWhatsappConnected ? "WhatsApp Terhubung" : "WhatsApp belum terhubung"}
              </p>
              <p className="mt-2 text-sm font-bold text-slate-800">
                Nomor: {currentWhatsapp || "Belum ada nomor"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsChangingWhatsapp((current) => !current);
                setWhatsappError(null);
                setWhatsappSuccess(null);
              }}
              className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
            >
              Ganti Nomor
            </button>
          </div>

          {whatsappError ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {whatsappError}
            </div>
          ) : null}

          {whatsappSuccess ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              {whatsappSuccess}
            </div>
          ) : null}

          {isChangingWhatsapp && whatsappStep === "phone" ? (
            <form onSubmit={handleRequestWhatsappCode} className="mt-6 space-y-4">
              <div>
                <label htmlFor="new-whatsapp-number" className="text-sm font-black text-slate-900">
                  Nomor WhatsApp Baru
                </label>
                <input
                  id="new-whatsapp-number"
                  value={newWhatsappNumber}
                  onChange={(event) => setNewWhatsappNumber(event.target.value)}
                  placeholder="Contoh: 081234567890"
                  inputMode="tel"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  disabled={whatsappLoading}
                />
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  Format 08xxxx, 628xxxx, atau +628xxxx akan dinormalisasi menjadi 628xxxx.
                </p>
              </div>

              <button
                type="submit"
                disabled={whatsappLoading}
                className="w-full rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {whatsappLoading ? "Mengirim kode..." : "Kirim Kode"}
              </button>
            </form>
          ) : null}

          {isChangingWhatsapp && whatsappStep === "code" ? (
            <form onSubmit={handleVerifyNewWhatsapp} className="mt-6 space-y-4">
              <div>
                <label htmlFor="new-whatsapp-otp" className="text-sm font-black text-slate-900">
                  Kode OTP
                </label>
                <input
                  id="new-whatsapp-otp"
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  inputMode="numeric"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-lg font-black tracking-[0.35em] outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  disabled={whatsappLoading}
                />
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  Masukkan 6 digit kode yang dikirim ke nomor baru.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={whatsappLoading || countdown > 0}
                  onClick={() => void handleRequestWhatsappCode()}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {countdown > 0 ? `Kirim ulang ${countdown} detik` : "Kirim Ulang Kode"}
                </button>
                <button
                  type="submit"
                  disabled={whatsappLoading}
                  className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {whatsappLoading ? "Memverifikasi..." : "Verifikasi Nomor Baru"}
                </button>
              </div>
            </form>
          ) : null}
        </section>
      </div>
    </main>
  );
}
