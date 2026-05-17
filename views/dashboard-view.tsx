"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/logic/auth.logic";
import { useSellerProducts } from "@/logic/products.logic";
import { useTransactions } from "@/logic/transactions.logic";
import { formatRelativeTime, formatRupiah } from "@/lib/format";
import type { Transaction, TransactionMethod, TransactionStatus } from "@/lib/types";
import { SafeImage } from "@/components/SafeImage";

function formatMethod(method: TransactionMethod) {
  return method === "cod" ? "COD" : "Kirim Kurir";
}

function formatStatus(status: TransactionStatus) {
  const labels: Record<TransactionStatus, string> = {
    interested: "Menunggu penjual",
    accepted: "Diterima",
    shipping: "Dikirim",
    completed: "Selesai",
    cancelled: "Dibatalkan",
  };

  return labels[status];
}

function getBuyerWhatsAppUrl(transaction: Transaction) {
  const phone = transaction.buyerWhatsapp?.replace(/[^\d]/g, "");
  const message = `Halo ${transaction.buyerName}, terima kasih sudah tertarik dengan produk ${transaction.productName} di Eco Market.`;

  return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : "#";
}

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
  const {
    sellerTransactions,
    buyerTransactions,
    loadingSellerTransactions,
    loadingBuyerTransactions,
    error: transactionError,
    actionId,
    accept,
    cancel,
    complete,
    markShipping,
  } = useTransactions(user?.uid);
  const [shippingForms, setShippingForms] = useState<
    Record<string, { trackingNumber: string; shippingNote: string }>
  >({});

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
  const sellerName = profile?.name || user?.displayName || "Penjual Eco";
  const isWhatsappConnected = Boolean(profile?.isWhatsappConnected && profile?.whatsappNumber);
  const sellHref = isWhatsappConnected ? "/sell" : "/verify-phone?redirect=%2Fsell";

  return (
    <main className="min-h-screen bg-[#f6fbf6] px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm shadow-emerald-950/5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <SafeImage
              src={avatarUrl}
              fallbackSrc="/default-avatar.png"
              alt=""
              className="h-16 w-16 rounded-2xl border border-emerald-100 object-cover"
            />
            <div>
              <p className="text-sm font-bold text-emerald-700">Dashboard Penjual</p>
              <h1 className="text-2xl font-black tracking-tight">Halo, {sellerName}</h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {isWhatsappConnected ? "WhatsApp Terhubung" : "WhatsApp belum terhubung"}
              </p>
              {!isWhatsappConnected ? (
                <Link
                  href="/verify-phone?redirect=%2Fdashboard"
                  className="mt-2 inline-flex text-sm font-bold text-emerald-700 transition hover:text-emerald-900"
                >
                  Verifikasi WhatsApp dulu
                </Link>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/login/market"
              className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
            >
              Marketplace
            </Link>
            <Link
              href="/settings"
              className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
            >
              Pengaturan
            </Link>
            <Link
              href={sellHref}
              className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              Jual Barang
            </Link>
          </div>
        </header>

        {(error || authError || transactionError) && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error || authError || transactionError}
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
                href={sellHref}
                className="mt-5 inline-flex rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                {isWhatsappConnected ? "Jual Barang" : "Verifikasi WhatsApp dulu"}
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
                    <SafeImage
                      src={coverUrl}
                      fallbackSrc="/placeholder-product.svg"
                      alt=""
                      className="h-28 w-full rounded-2xl bg-emerald-50 object-cover sm:w-32"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-black text-slate-950">
                          {product.name}
                        </h3>
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700">
                          {product.status === "sold"
                            ? "Terjual"
                            : product.status === "reserved"
                              ? "Dalam Transaksi"
                              : "Aktif"}
                        </span>
                      </div>
                      <p className="mt-1 text-xl font-black text-emerald-600">
                        {formatRupiah(product.price)}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {product.location} - Diunggah {formatRelativeTime(product.createdAt)}
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

        <section className="mt-6 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm shadow-emerald-950/5">
          <div>
            <h2 className="text-xl font-black tracking-tight">Transaksi Masuk</h2>
            <p className="text-sm font-semibold text-slate-500">
              Kelola minat pembeli tanpa sistem pembayaran otomatis. Lanjutkan kesepakatan lewat WhatsApp.
            </p>
          </div>

          <p className="mt-4 rounded-2xl bg-emerald-50 p-4 text-xs font-semibold leading-5 text-emerald-800">
            Pembayaran dan pengiriman dilakukan berdasarkan kesepakatan pembeli dan penjual. Eco Market membantu pencatatan transaksi dan dampak barang diselamatkan.
          </p>

          {loadingSellerTransactions ? (
            <div className="mt-5 space-y-3">
              {[1, 2].map((item) => (
                <div key={item} className="h-32 animate-pulse rounded-2xl bg-emerald-50" />
              ))}
            </div>
          ) : sellerTransactions.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/70 p-8 text-center">
              <p className="text-lg font-black text-slate-900">Belum ada transaksi masuk.</p>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Minat pembeli akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {sellerTransactions.map((transaction) => {
                const isActionLoading = actionId === transaction.id;
                const buyerChatUrl = getBuyerWhatsAppUrl(transaction);
                const shippingForm = shippingForms[transaction.id] ?? {
                  trackingNumber: transaction.trackingNumber ?? "",
                  shippingNote: transaction.shippingNote ?? "",
                };

                return (
                  <article
                    key={transaction.id}
                    className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-950/5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <SafeImage
                        src={transaction.buyerAvatar || "/default-avatar.png"}
                        fallbackSrc="/default-avatar.png"
                        alt=""
                        className="h-14 w-14 rounded-2xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-black text-slate-950">
                            {transaction.buyerName}
                          </h3>
                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700">
                            {formatMethod(transaction.method)}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-700">
                            {formatStatus(transaction.status)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          {transaction.productName} - {formatRelativeTime(transaction.createdAt)}
                        </p>
                        <p className="mt-2 text-xl font-black text-emerald-600">
                          {formatRupiah(transaction.productPrice)}
                        </p>
                      </div>
                    </div>

                    {transaction.method === "shipping" && transaction.status === "accepted" ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <input
                          value={shippingForm.trackingNumber}
                          onChange={(event) =>
                            setShippingForms((prev) => ({
                              ...prev,
                              [transaction.id]: {
                                ...shippingForm,
                                trackingNumber: event.target.value,
                              },
                            }))
                          }
                          placeholder="Nomor resi"
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                        />
                        <input
                          value={shippingForm.shippingNote}
                          onChange={(event) =>
                            setShippingForms((prev) => ({
                              ...prev,
                              [transaction.id]: {
                                ...shippingForm,
                                shippingNote: event.target.value,
                              },
                            }))
                          }
                          placeholder="Catatan pengiriman"
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                        />
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <a
                        href={buyerChatUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-disabled={!transaction.buyerWhatsapp}
                        className={`rounded-2xl border px-4 py-3 text-sm font-bold transition ${
                          transaction.buyerWhatsapp
                            ? "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                            : "pointer-events-none border-slate-200 bg-slate-100 text-slate-400"
                        }`}
                      >
                        Chat Pembeli
                      </a>
                      {transaction.status === "interested" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => accept(transaction)}
                            disabled={isActionLoading}
                            className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                          >
                            Terima Minat
                          </button>
                          <button
                            type="button"
                            onClick={() => cancel(transaction)}
                            disabled={isActionLoading}
                            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                          >
                            Batalkan
                          </button>
                        </>
                      ) : null}
                      {transaction.method === "cod" && transaction.status === "accepted" ? (
                        <button
                          type="button"
                          onClick={() => complete(transaction)}
                          disabled={isActionLoading}
                          className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                        >
                          Tandai Terjual
                        </button>
                      ) : null}
                      {transaction.method === "shipping" && transaction.status === "accepted" ? (
                        <button
                          type="button"
                          onClick={() => markShipping(transaction, shippingForm)}
                          disabled={isActionLoading}
                          className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                        >
                          Tandai Dikirim
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm shadow-emerald-950/5">
          <div>
            <h2 className="text-xl font-black tracking-tight">Transaksi Saya</h2>
            <p className="text-sm font-semibold text-slate-500">
              Produk yang kamu minati sebagai pembeli.
            </p>
          </div>

          {loadingBuyerTransactions ? (
            <div className="mt-5 space-y-3">
              {[1, 2].map((item) => (
                <div key={item} className="h-28 animate-pulse rounded-2xl bg-emerald-50" />
              ))}
            </div>
          ) : buyerTransactions.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/70 p-8 text-center">
              <p className="text-lg font-black text-slate-900">Kamu belum meminati produk apa pun.</p>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Klik Saya Minat di detail produk untuk memulai transaksi.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {buyerTransactions.map((transaction) => {
                const isActionLoading = actionId === transaction.id;

                return (
                  <article
                    key={transaction.id}
                    className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-950/5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <SafeImage
                        src={transaction.productImage || "/placeholder-product.svg"}
                        fallbackSrc="/placeholder-product.svg"
                        alt=""
                        className="h-20 w-full rounded-2xl object-cover sm:w-24"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-black text-slate-950">
                            {transaction.productName}
                          </h3>
                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700">
                            {formatMethod(transaction.method)}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-700">
                            {formatStatus(transaction.status)}
                          </span>
                        </div>
                        <p className="mt-1 text-xl font-black text-emerald-600">
                          {formatRupiah(transaction.productPrice)}
                        </p>
                        {transaction.status === "shipping" ? (
                          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                            Resi: {transaction.trackingNumber || "-"} | Catatan:{" "}
                            {transaction.shippingNote || "-"}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    {transaction.status === "shipping" ? (
                      <button
                        type="button"
                        onClick={() => complete(transaction)}
                        disabled={isActionLoading}
                        className="mt-4 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                      >
                        Barang Diterima
                      </button>
                    ) : null}
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
