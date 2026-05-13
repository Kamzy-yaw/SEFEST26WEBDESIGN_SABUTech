"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/logic/auth.logic";
import { useProductDetail } from "@/logic/products.logic";
import { DeleteProductDialog } from "@/components/DeleteProductDialog";
import { ProductGallery } from "@/components/ProductGallery";
import { SellerInfo } from "@/components/SellerInfo";
import { formatCondition, formatRelativeTime, formatRupiah } from "@/lib/format";

export function ProductDetailView() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
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

  return (
    <main className="min-h-screen bg-[#f6fbf6] py-10 text-slate-950">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
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

        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <ProductGallery
            images={productImages}
            selectedImage={selectedImage}
            onSelectImage={setSelectedImage}
          />

          <aside className="space-y-5 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm shadow-emerald-950/5">
            <div className="flex flex-wrap gap-2">
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
              <h1 className="text-3xl font-black tracking-tight text-slate-950">{product.name}</h1>
              <p className="mt-3 text-3xl font-black text-emerald-600">
                {formatRupiah(product.price)}
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Upload {formatRelativeTime(product.createdAt)}
              </p>
            </div>

            {product.description ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                <p className="text-sm font-black text-emerald-900">Deskripsi Produk</p>
                <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-6 text-slate-700">
                  {product.description}
                </p>
              </div>
            ) : null}

            <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-4">
                <span>Tahun</span>
                <span className="font-bold text-slate-800">{product.year}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Lokasi</span>
                <span className="font-bold text-slate-800">{product.location}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Dampak</span>
                <span className="font-bold text-emerald-700">
                  🔥 {product.ecoSaved} barang berhasil diselamatkan
                </span>
              </div>
            </div>

            {product.condition === "minus" && minusDetail ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-black text-amber-900">Detail minus</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-amber-800">{minusDetail}</p>
              </div>
            ) : null}

            <SellerInfo
              name={sellerName}
              avatar={sellerAvatar}
              status={product.sellerStatus}
              contributionCount={product.sellerContributionCount}
              isWhatsappConnected={isWhatsappConnected}
            />

            <div className={`grid gap-3 ${isOwner ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                aria-disabled={!isWhatsappConnected}
                className={`rounded-2xl border px-4 py-3 text-center text-sm font-bold transition ${
                  isWhatsappConnected
                    ? "border-emerald-200 bg-emerald-600 text-white hover:bg-emerald-700"
                    : "pointer-events-none border-slate-200 bg-slate-100 text-slate-400"
                }`}
              >
                {isWhatsappConnected ? "Chat Seller" : "WhatsApp seller belum tersedia"}
              </a>
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
    </main>
  );
}
