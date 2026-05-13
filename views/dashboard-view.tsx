"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/logic/auth.logic";
import { useSellerProducts } from "@/logic/products.logic";
import { formatRelativeTime, formatRupiah } from "@/lib/format";

export function DashboardView() {
  const router = useRouter();
  const { user, profile, loading: authLoading, error: authError } = useAuth();
  const {
    products,
    loading: loadingProducts,
    error,
    deletingId,
    stats,
    removeProduct,
  } = useSellerProducts(user?.uid);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/dashboard");
    }
  }, [authLoading, router, user]);

  if (authLoading || (!user && !authError)) {
    return (
      <main className="min-h-screen bg-[#f6fbf6] px-4 py-10 text-slate-950">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="h-10 w-64 animate-pulse rounded-2xl bg-emerald-100" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-32 animate-pulse rounded-3xl bg-white" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  const avatarUrl = profile?.photoURL || user?.photoURL || "/default-avatar.png";
  const sellerName = profile?.name || user?.displayName || "Eco Seller";
  const isWhatsappConnected = Boolean(profile?.isWhatsappConnected && profile?.whatsappNumber);

  return (
    <main className="min-h-screen bg-[#f6fbf6] px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm shadow-emerald-950/5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl}
              alt={sellerName}
              className="h-16 w-16 rounded-2xl border border-emerald-100 object-cover"
            />
            <div>
              <p className="text-sm font-bold text-emerald-700">Dashboard Seller</p>
              <h1 className="text-2xl font-black tracking-tight">Halo, {sellerName}</h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {isWhatsappConnected ? "WhatsApp Connected" : "WhatsApp belum terhubung"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/settings"
              className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
            >
              Settings
            </Link>
            <Link
              href="/sell"
              className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              Jual Barang
            </Link>
          </div>
        </header>

        {(error || authError) && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error || authError}
          </div>
        )}

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm shadow-emerald-950/5">
            <p className="text-sm font-bold text-slate-500">Produk aktif</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{stats.activeProducts}</p>
          </div>
          <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm shadow-emerald-950/5">
            <p className="text-sm font-bold text-slate-500">Barang diselamatkan</p>
            <p className="mt-2 text-3xl font-black text-emerald-600">{stats.totalEcoSaved}</p>
          </div>
          <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm shadow-emerald-950/5">
            <p className="text-sm font-bold text-slate-500">Estimasi nilai produk</p>
            <p className="mt-2 text-3xl font-black text-emerald-600">
              {formatRupiah(stats.totalValue)}
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm shadow-emerald-950/5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black tracking-tight">Produk Saya</h2>
              <p className="text-sm font-semibold text-slate-500">
                Produk yang tampil hanya milik akun login saat ini.
              </p>
            </div>
            <Link
              href="/login/market"
              className="text-sm font-bold text-emerald-700 transition hover:text-emerald-900"
            >
              Lihat Marketplace
            </Link>
          </div>

          {loadingProducts ? (
            <div className="mt-5 space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-28 animate-pulse rounded-2xl bg-emerald-50" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/70 p-8 text-center">
              <p className="text-lg font-black text-slate-900">Belum ada produk aktif.</p>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Tambahkan barang bekas pertama kamu untuk mulai membangun kontribusi.
              </p>
              <Link
                href="/sell"
                className="mt-5 inline-flex rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                Jual Barang
              </Link>
            </div>
          ) : (
            <div className="mt-5 divide-y divide-emerald-100">
              {products.map((product) => {
                const coverUrl =
                  product.imageUrls?.[0] || product.imageUrl || "/placeholder-product.svg";
                const isDeleting = deletingId === product.id;

                return (
                  <article
                    key={product.id}
                    className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverUrl}
                      alt={product.name}
                      className="h-28 w-full rounded-2xl bg-emerald-50 object-cover sm:w-32"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-black text-slate-950">
                          {product.name}
                        </h3>
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700">
                          Aktif
                        </span>
                      </div>
                      <p className="mt-1 text-xl font-black text-emerald-600">
                        {formatRupiah(product.price)}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {product.location} - Upload {formatRelativeTime(product.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <Link
                        href={`/login/market/${product.id}`}
                        className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
                      >
                        Lihat Detail
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeProduct(product.id)}
                        disabled={isDeleting}
                        className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isDeleting ? "Menghapus..." : "Hapus Produk"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
