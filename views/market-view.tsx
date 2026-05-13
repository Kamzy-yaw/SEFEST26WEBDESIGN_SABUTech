"use client";

import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { categoryOptions } from "@/app/login/market/_data/categories";
import type { ProductCategory, ProductSubcategory } from "@/lib/types";
import { useProducts } from "@/logic/products.logic";
import { UserSection } from "@/app/_components/user-section";

export function MarketView() {
  const {
    products,
    filteredProducts,
    loading,
    error,
    selectedCategory,
    setSelectedCategory,
    selectedSubcategory,
    setSelectedSubcategory,
    locationQuery,
    setLocationQuery,
    subcategoryOptions,
    totalSaved,
    resetFilters,
  } = useProducts();
  const skeletonItems = Array.from({ length: 6 }, (_, index) => index);

  return (
    <main className="min-h-screen bg-[#f6fbf6] text-slate-950">
      <section className="relative overflow-hidden border-b border-emerald-100 bg-[linear-gradient(135deg,#ecfdf5_0%,#f7fee7_48%,#ffffff_100%)]">
        <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-emerald-200/60 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-lime-200/60 blur-3xl" />

        <div className="relative mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-14">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-emerald-700">Eco Market</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Marketplace barang bekas berkualitas untuk ekonomi sirkular.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Temukan elektronik, buku, fashion, dan perabot second yang masih layak pakai.
              Hemat biaya, kurangi limbah, dan bantu barang bagus menemukan rumah baru.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/sell"
                className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-700"
              >
                Jual Barang
              </Link>
              <button 
                type="button"
                onClick={() => {
                  const el = document.getElementById("filter-section");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="rounded-2xl border border-emerald-200 bg-white/80 px-5 py-3 text-sm font-bold text-emerald-800 transition hover:border-emerald-400 hover:bg-white">
                Cari Terdekat
              </button>
              <UserSection compact />
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/80 bg-white/70 p-4 shadow-2xl shadow-emerald-950/10 backdrop-blur">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-3xl bg-slate-950 p-5 text-white">
                <p className="text-3xl font-black">{products.length}</p>
                <p className="mt-1 text-sm text-slate-300">Barang Dijual</p>
              </div>
              <div className="rounded-3xl bg-emerald-600 p-5 text-white">
                <p className="text-3xl font-black">🔥 {totalSaved}</p>
                <p className="mt-1 text-sm text-emerald-50">Barang Diselamatkan</p>
              </div>
              <div className="col-span-2 rounded-3xl bg-white p-5">
                <p className="text-sm font-bold text-slate-500">Kategori Populer</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {categoryOptions.slice(1).map((category) => (
                    <span
                      key={category.value}
                      className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700"
                    >
                      {category.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8" id="filter-section">
        <div className="mb-6 grid gap-4 rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm md:grid-cols-[220px_220px_1fr_auto]">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">Kategori</span>
            <select
              value={selectedCategory}
              onChange={(event) => {
                setSelectedCategory(event.target.value as ProductCategory | "all");
                setSelectedSubcategory("all");
              }}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">Subkategori</span>
            <select
              value={selectedSubcategory}
              onChange={(event) => setSelectedSubcategory(event.target.value as ProductSubcategory | "all")}
              disabled={selectedCategory === "all"}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="all">Semua subkategori</option>
              {subcategoryOptions.map((subcategory) => (
                <option key={subcategory} value={subcategory}>
                  {subcategory}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">Lokasi</span>
            <input
              value={locationQuery}
              onChange={(event) => setLocationQuery(event.target.value)}
              placeholder="Cari kota/lokasi, contoh: Jakarta"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={resetFilters}
              className="w-full rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200 sm:w-auto"
            >
              Reset
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center">
            <p className="text-lg font-black text-red-900">Error: {error}</p>
            <p className="mt-2 text-sm text-red-700">Gagal memuat data produk. Silakan refresh halaman.</p>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {skeletonItems.map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm shadow-emerald-950/5"
              >
                <div className="h-44 animate-pulse bg-emerald-50" />
                <div className="space-y-4 p-5">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                  <div className="h-7 w-full animate-pulse rounded bg-slate-100" />
                  <div className="h-6 w-1/2 animate-pulse rounded bg-emerald-100" />
                  <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="rounded-3xl border border-dashed border-emerald-200 bg-white p-10 text-center">
            <p className="text-lg font-black text-slate-900">Belum ada produk</p>
            <p className="mt-2 text-sm text-slate-500">
              Mulai jual barangmu sekarang dan tunjukkan kepada pembeli lain!
            </p>
          </div>
        )}

        {!loading && !error && products.length > 0 && filteredProducts.length === 0 && (
          <div className="rounded-3xl border border-dashed border-emerald-200 bg-white p-10 text-center">
            <p className="text-lg font-black text-slate-900">Produk tidak ditemukan</p>
            <p className="mt-2 text-sm text-slate-500">
              Coba ubah kategori, subkategori, atau kata kunci lokasi.
            </p>
          </div>
        )}

        {!loading && !error && filteredProducts.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
