"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { SafeImage } from "@/components/SafeImage";

type UserSectionProps = {
  compact?: boolean;
};

export function UserSection({ compact = false }: UserSectionProps) {
  const { user, profile, loading, error, loginWithGoogle, logout } = useAuth();
  const avatar = profile?.photoURL || user?.photoURL || "/default-avatar.png";
  const name = profile?.name || user?.displayName || "Penjual Eco";
  const isWhatsappConnected = Boolean(profile?.isWhatsappConnected && profile?.whatsappNumber);

  if (!user) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={loginWithGoogle}
          disabled={loading}
          className="rounded-2xl border border-emerald-200 bg-white/80 px-5 py-3 text-sm font-bold text-emerald-800 transition hover:border-emerald-400 hover:bg-white disabled:opacity-50"
        >
          {loading ? "Memuat..." : "Login dengan Google"}
        </button>
        {error ? <p className="text-sm font-semibold text-amber-700">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href="/dashboard"
        aria-label="Buka dashboard penjual"
        title="Dashboard penjual"
        className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white/80 px-3 py-2 transition hover:border-emerald-300 hover:bg-white hover:shadow-sm"
      >
        <SafeImage
          src={avatar}
          fallbackSrc="/default-avatar.png"
          alt=""
          className="h-9 w-9 rounded-xl object-cover"
        />
        {!compact ? (
          <div>
            <p className="text-sm font-black text-slate-900">{name}</p>
            <p className="text-xs font-bold text-emerald-700">
              {isWhatsappConnected ? "WhatsApp Terhubung" : "WhatsApp belum terhubung"}
            </p>
          </div>
        ) : null}
      </Link>
      {!isWhatsappConnected ? (
        <Link
          href="/verify-phone?redirect=%2Flogin%2Fmarket"
          className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 transition hover:bg-amber-100"
        >
          Verifikasi WA
        </Link>
      ) : null}
      <button
        type="button"
        onClick={logout}
        className="rounded-2xl border border-slate-200 bg-white/80 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-white"
      >
        Logout
      </button>
    </div>
  );
}
