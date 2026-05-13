"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import { isFirebaseConfigured } from "@/lib/firebase";
import { getProductById } from "@/lib/firebase-products";
import { formatCondition, formatRelativeTime, formatRupiah } from "../_utils/format";

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProduct() {
      if (!isFirebaseConfigured) {
        setError("Konfigurasi Firebase belum lengkap. Isi NEXT_PUBLIC_FIREBASE_* di .env.local.");
        setLoading(false);
        return;
      }

      try {
        const productData = await getProductById(params.id);
        if (!active) return;

        if (!productData) {
          setError("Produk tidak ditemukan.");
          return;
        }

        setProduct(productData);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Gagal memuat detail produk.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProduct();

    return () => {
      active = false;
    };
  }, [params.id]);

  const whatsappUrl = useMemo(() => {
    if (!product) return "#";

    const sellerPhone = product.sellerPhone?.replace(/[^\d]/g, "");
    const message = `Halo, saya tertarik dengan produk ${product.name} yang Anda jual di Eco Market.`;

    return sellerPhone ? `https://wa.me/${sellerPhone}?text=${encodeURIComponent(message)}` : "#";
  }, [product]);

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
              href="/market"
              className="mt-6 inline-flex rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              Kembali ke Marketplace
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const sellerAvatar = product.sellerAvatar || "/default-avatar.png";
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

        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm shadow-emerald-950/5">
            <div
              className="aspect-[4/3] bg-[radial-gradient(circle_at_20%_20%,#bbf7d0_0,#ecfdf5_32%,#f8fafc_70%)] bg-cover bg-center"
              style={product.imageUrl ? { backgroundImage: `url(${product.imageUrl})` } : undefined}
            />
          </section>

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
                  {product.ecoSaved} barang berhasil diselamatkan dari limbah
                </span>
              </div>
            </div>

            {product.condition === "minus" && minusDetail ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-black text-amber-900">Detail minus</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-amber-800">{minusDetail}</p>
              </div>
            ) : null}

            <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sellerAvatar}
                alt={product.sellerName || "Seller Eco Market"}
                className="h-12 w-12 rounded-2xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-slate-900">{product.sellerName}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-black text-emerald-700">
                    {product.sellerStatus || "Eco Seller"}
                  </span>
                  {product.sellerVerified ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-black text-green-700">
                      Verified Seller
                    </span>
                  ) : null}
                  <span className="text-xs font-bold text-emerald-700">
                    {product.sellerContributionCount} barang terselamatkan
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                aria-disabled={!product.sellerPhone}
                className={`rounded-2xl px-4 py-3 text-center text-sm font-bold text-white transition ${
                  product.sellerPhone
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "pointer-events-none bg-slate-300"
                }`}
              >
                Saya Minat
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                aria-disabled={!product.sellerPhone}
                className={`rounded-2xl border px-4 py-3 text-center text-sm font-bold transition ${
                  product.sellerPhone
                    ? "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                    : "pointer-events-none border-slate-200 bg-slate-100 text-slate-400"
                }`}
              >
                Chat Seller
              </a>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
