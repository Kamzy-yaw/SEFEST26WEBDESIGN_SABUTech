"use client";

import { useAuth } from "@/hooks/useAuth";

type UserSectionProps = {
  compact?: boolean;
};

export function UserSection({ compact = false }: UserSectionProps) {
  const { user, profile, loading, error, loginWithGoogle, logout } = useAuth();
  const avatar = profile?.photoURL || user?.photoURL || "/default-avatar.png";
  const name = profile?.name || user?.displayName || "Eco Seller";

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
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white/80 px-3 py-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatar} alt={name} className="h-9 w-9 rounded-xl object-cover" />
        {!compact ? (
          <div>
            <p className="text-sm font-black text-slate-900">{name}</p>
            <p className="text-xs font-bold text-emerald-700">
              {profile?.isPhoneVerified ? "Verified Seller" : "Belum verifikasi HP"}
            </p>
          </div>
        ) : null}
      </div>
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
