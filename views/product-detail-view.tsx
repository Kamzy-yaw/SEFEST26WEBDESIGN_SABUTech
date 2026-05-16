"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/logic/auth.logic";
import { useProductDetail } from "@/logic/products.logic";
import { createInterestTransaction } from "@/logic/transactions.logic";
import { DeleteProductDialog } from "@/components/DeleteProductDialog";
import { ProductGallery } from "@/components/ProductGallery";
import { SellerInfo } from "@/components/SellerInfo";
import { formatCondition, formatRelativeTime, formatRupiah } from "@/lib/format";
import type { TransactionMethod } from "@/lib/types";

export function ProductDetailView() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user, profile, loading: authLoading } = useAuth();
  const [isInterestModalOpen, setIsInterestModalOpen] = useState(false);
  const [interestMethod, setInterestMethod] = useState<TransactionMethod>("cod");
  const [interestLoading, setInterestLoading] = useState(false);
  const [interestError, setInterestError] = useState<string | null>(null);
  const [interestSuccess, setInterestSuccess] = useState<string | null>(null);
  const {
    product,
    selectedImage,
    setSelectedImage,
    productImages,
    sellerAvatar,
    sellerName,
    isWhatsappConnected,
    isOwner,
    whatsappUrl,
    loading,
    error,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isDeleting,
    deleteError,
    setDeleteError,
    handleDeleteProduct,
  } = useProductDetail(params.id, user?.uid);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6fbf6] py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="h-8 w-32 animate-pulse rounded bg-emerald-100" />
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_420px]">
            <div className="aspect-[4/3] animate-pulse rounded-3xl bg-emerald-50" />
            <div className="space-y-4 rounded-3xl border border-emerald-100 bg-white p-6">
              <div className="h-8 w-3/4 animate-pulse rounded bg-slate-100" />
              <div className="h-10 w-1/2 animate-pulse rounded bg-emerald-100" />
              <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-[#f6fbf6] py-10">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-red-200 bg-red-50 p-10">
            <p className="text-xl font-black text-red-900">{error || "Produk tidak ditemukan."}</p>
            <Link
              href="/login/market"
              className="mt-6 inline-flex rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              Kembali ke Marketplace
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const minusDetail = product.minusDetail ?? product.conditionDetail;
  const productStatus = product.status ?? "active";
  const isSold = productStatus === "sold";
  const isActive = productStatus === "active";

  const handleOpenInterest = () => {
    setInterestError(null);
    setInterestSuccess(null);

    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/login/market/${product.id}`)}`);
      return;
    }

    if (!profile?.isWhatsappConnected || !profile.whatsappNumber) {
      router.push(`/verify-phone?redirect=${encodeURIComponent(`/login/market/${product.id}`)}`);
      return;
    }

    setIsInterestModalOpen(true);
  };

  const handleSubmitInterest = async () => {
    if (!user) return;

    if (!profile?.isWhatsappConnected || !profile.whatsappNumber) {
      router.push(`/verify-phone?redirect=${encodeURIComponent(`/login/market/${product.id}`)}`);
      return;
    }

    setInterestLoading(true);
    setInterestError(null);
    setInterestSuccess(null);

    try {
      await createInterestTransaction({
        product,
        buyerId: user.uid,
        buyerName: profile?.name || user.displayName || "Pembeli Eco Market",
        buyerAvatar: profile?.photoURL || user.photoURL || null,
        buyerWhatsapp: profile?.whatsappNumber ?? null,
        method: interestMethod,
      });
      setInterestSuccess("Minat kamu sudah dikirim ke penjual.");
      setIsInterestModalOpen(false);
    } catch (err) {
      setInterestError(err instanceof Error ? err.message : "Gagal mengirim minat.");
    } finally {
      setInterestLoading(false);
    }
  };

  const handleChatSeller = () => {
    setInterestError(null);
    setInterestSuccess(null);

    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/login/market/${product.id}`)}`);
      return;
    }

    if (!profile?.isWhatsappConnected || !profile.whatsappNumber) {
      router.push(`/verify-phone?redirect=${encodeURIComponent(`/login/market/${product.id}`)}`);
      return;
    }

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f6fbf6] py-10 text-slate-950">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 text-sm font-bold text-slate-600 transition hover:text-slate-900"
        >
          Kembali
        </button>
        <Link
          href="/login/market"
          className="mb-6 ml-4 inline-flex text-sm font-bold text-emerald-700 transition hover:text-emerald-900"
        >
          Kembali ke Marketplace
        </Link>

        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <ProductGallery
            images={productImages}
            selectedImage={selectedImage}
            onSelectImage={setSelectedImage}
          />

          <aside className="min-w-0 space-y-5 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm shadow-emerald-950/5">
            <div className="flex flex-wrap gap-2">
              {isSold ? (
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-red-700">
                  Terjual
                </span>
              ) : productStatus === "reserved" ? (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-amber-700">
                  Dalam Transaksi
                </span>
              ) : null}
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
                {product.category}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                {product.subcategory}
              </span>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-700">
                {formatCondition(product.condition)}
              </span>
            </div>

            <div>
              <h1 className="break-words text-3xl font-black tracking-tight text-slate-950">{product.name}</h1>
              <p className="mt-3 break-words text-3xl font-black text-emerald-600">
                {formatRupiah(product.price)}
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Diunggah {formatRelativeTime(product.createdAt)}
              </p>
            </div>

            {product.description ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                <p className="text-sm font-black text-emerald-900">Deskripsi Produk</p>
                <p className="mt-2 whitespace-pre-line break-words text-sm font-semibold leading-6 text-slate-700">
                  {product.description}
                </p>
              </div>
            ) : null}

            <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>Tahun</span>
                <span className="font-bold text-slate-800">{product.year}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>Lokasi</span>
                <span className="break-words text-right font-bold text-slate-800">{product.location}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>Dampak</span>
                <span className="break-words text-right font-bold text-emerald-700">
                  🔥 {product.ecoSaved} barang berhasil diselamatkan
                </span>
              </div>
            </div>

            {product.condition === "minus" && minusDetail ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-black text-amber-900">Detail minus</p>
                <p className="mt-2 break-words text-sm font-semibold leading-6 text-amber-800">{minusDetail}</p>
              </div>
            ) : null}

            <SellerInfo
              name={sellerName}
              avatar={sellerAvatar}
              contributionCount={product.sellerContributionCount}
              isWhatsappConnected={isWhatsappConnected}
            />

            {interestSuccess ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-bold text-emerald-800">{interestSuccess}</p>
              </div>
            ) : null}

            {isSold ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-bold text-red-800">
                  Produk ini sudah terjual dan tidak menerima transaksi baru.
                </p>
              </div>
            ) : null}

            <div className={`grid gap-3 ${isOwner ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
              {!isOwner ? (
                <>
                  <button
                    type="button"
                    onClick={handleOpenInterest}
                    disabled={!isActive}
                    className="rounded-2xl border border-emerald-200 bg-emerald-600 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    Saya Minat
                  </button>
                  <button
                    type="button"
                    onClick={handleChatSeller}
                    disabled={!isWhatsappConnected || !isActive}
                    className={`rounded-2xl border px-4 py-3 text-center text-sm font-bold transition ${
                      isWhatsappConnected && isActive
                        ? "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                        : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                    }`}
                  >
                    {isWhatsappConnected ? "Chat Penjual" : "WhatsApp penjual belum tersedia"}
                  </button>
                </>
              ) : null}
              <Link
                href="/login/market"
                className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-center text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
              >
                Kembali ke Marketplace
              </Link>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isDeleting || authLoading}
                  className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hapus
                </button>
              )}
            </div>

            {/* Delete confirmation dialog */}
            <DeleteProductDialog
              productName={product.name}
              isOpen={isDeleteDialogOpen}
              isLoading={isDeleting}
              error={deleteError}
              onCancel={() => {
                setIsDeleteDialogOpen(false);
                setDeleteError(null);
              }}
              onConfirm={handleDeleteProduct}
            />
          </aside>
        </div>
      </div>

      {isInterestModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4">
          <div className="w-full max-w-md rounded-3xl border border-emerald-100 bg-white p-6 shadow-xl">
            <h2 className="text-xl font-black text-slate-950">Pilih metode transaksi</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              Pembayaran dan pengiriman dilakukan berdasarkan kesepakatan pembeli dan penjual. Eco Market membantu pencatatan transaksi dan dampak barang diselamatkan.
            </p>

            {interestError ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-bold text-red-800">{interestError}</p>
              </div>
            ) : null}

            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={() => setInterestMethod("cod")}
                className={`rounded-2xl border p-4 text-left transition ${
                  interestMethod === "cod"
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <p className="font-black text-slate-950">COD / Janjian</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Bertemu langsung dan selesaikan transaksi sesuai kesepakatan.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setInterestMethod("shipping")}
                className={`rounded-2xl border p-4 text-left transition ${
                  interestMethod === "shipping"
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <p className="font-black text-slate-950">Kirim Kurir</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Penjual akan mengirim barang setelah kesepakatan di WhatsApp.
                </p>
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setIsInterestModalOpen(false)}
                disabled={interestLoading}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmitInterest}
                disabled={interestLoading}
                className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {interestLoading ? "Mengirim..." : "Kirim Minat"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
