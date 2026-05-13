"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/logic/auth.logic";
import {
  isValidWhatsAppNumber,
  normalizeWhatsAppNumber,
  updateUserProfile,
} from "@/logic/users.logic";

export function SettingsView() {
  const router = useRouter();
  const { user, profile, loading: authLoading, error: authError } = useAuth();
  const [name, setName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [syncedProfileId, setSyncedProfileId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    setWhatsappNumber(profile.whatsappNumber || "");
    setSyncedProfileId(profile.uid);
  }, [profile, syncedProfileId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) return;

    const nextName = name.trim();
    const nextWhatsappNumber = whatsappNumber.trim();

    setSuccess(null);
    setError(null);

    if (!nextName) {
      setError("Nama seller wajib diisi.");
      return;
    }

    if (!isValidWhatsAppNumber(nextWhatsappNumber)) {
      setError("Format WhatsApp harus 08xxxx, 628xxxx, atau +628xxxx.");
      return;
    }

    setSaving(true);

    try {
      await updateUserProfile(user.uid, {
        name: nextName,
        whatsappNumber: nextWhatsappNumber,
      });
      setWhatsappNumber(normalizeWhatsAppNumber(nextWhatsappNumber));
      setSuccess("Profil seller berhasil diperbarui.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan profil seller.");
    } finally {
      setSaving(false);
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
  const sellerName = profile?.name || user?.displayName || "Eco Seller";
  const email = profile?.email || user?.email || "-";
  const isWhatsappConnected = Boolean(profile?.isWhatsappConnected && profile?.whatsappNumber);

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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl}
              alt={sellerName}
              className="h-20 w-20 rounded-3xl border border-emerald-100 object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-emerald-700">Profile Seller</p>
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
              {isWhatsappConnected ? "WhatsApp Connected" : "Belum Terhubung"}
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
                Nama Seller
              </label>
              <input
                id="seller-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Contoh: Zys"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label htmlFor="whatsapp-number" className="text-sm font-black text-slate-900">
                Nomor WhatsApp
              </label>
              <input
                id="whatsapp-number"
                value={whatsappNumber}
                onChange={(event) => setWhatsappNumber(event.target.value)}
                placeholder="Contoh: 081234567890"
                inputMode="tel"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
              <p className="mt-2 text-xs font-semibold text-slate-500">
                Format 08xxxx, 628xxxx, atau +628xxxx akan disimpan sebagai 628xxxx.
              </p>
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
      </div>
    </main>
  );
}
