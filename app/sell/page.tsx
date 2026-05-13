"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { categoryDefinitions, getSubcategories } from "@/app/login/market/_data/categories";
import type { ProductCategory, ProductCondition, ProductSubcategory } from "@/lib/types";
import { useProductDraft } from "@/hooks/useProductDraft";
import { parseEstimatedPrice } from "@/utils/storage";
import { useAuth } from "@/hooks/useAuth";
import { createProduct } from "@/lib/firebase-products";
import {
  compressImageToBase64,
  isCompressedImageValid,
  MAX_PRODUCT_PHOTOS,
} from "@/utils/image";
import { formatRupiah, parseRupiah } from "@/utils/price";

type SellFormData = {
  name: string;
  description: string;
  year: string;
  price: string;
  category: ProductCategory | "";
  subcategory: ProductSubcategory | "";
  condition: ProductCondition;
  conditionDetail: string;
  imageUrl: string;
  location: string;
};

function SellFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { draft, loaded: draftLoaded, clearDraft } = useProductDraft();
  const { user, profile, loading: authLoading, error: authError, loginWithGoogle, logout } = useAuth();
  const queryCondition = searchParams.get("condition") as ProductCondition | null;
  const initialCondition: ProductCondition =
    queryCondition === "like_new" || queryCondition === "good" || queryCondition === "minus"
      ? queryCondition
      : "good";

  const [formData, setFormData] = useState<SellFormData>(() => ({
    name: searchParams.get("name") || "",
    description: "",
    year: searchParams.get("year") || String(new Date().getFullYear()),
    price: searchParams.get("price")
      ? formatRupiah(Number(searchParams.get("price")?.replace(/[^\d]/g, "") ?? 0))
      : "",
    category: (searchParams.get("category") as ProductCategory | null) || "",
    subcategory: (searchParams.get("subcategory") as ProductSubcategory | null) || "",
    condition: initialCondition,
    conditionDetail: searchParams.get("conditionDetail") || "",
    imageUrl: "",
    location: "",
  }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent("/sell")}`);
      return;
    }
    if (profile && !profile.isWhatsappConnected) {
      router.replace(`/verify-phone?redirect=${encodeURIComponent("/sell")}`);
    }
  }, [authLoading, profile, router, user]);

  useEffect(() => {
    const getInitialFormData = (): SellFormData => ({
      name: searchParams.get("name") || "",
      description: "",
      year: searchParams.get("year") || String(new Date().getFullYear()),
      price: searchParams.get("price")
        ? formatRupiah(Number(searchParams.get("price")?.replace(/[^\d]/g, "") ?? 0))
        : "",
      category: (searchParams.get("category") as ProductCategory | null) || "",
      subcategory: (searchParams.get("subcategory") as ProductSubcategory | null) || "",
      condition: initialCondition,
      conditionDetail: searchParams.get("conditionDetail") || "",
      imageUrl: "",
      location: "",
    });
    // Sync values when returning from the estimator with query params.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData(getInitialFormData());
  }, [searchParams, initialCondition]);

  useEffect(() => {
    if (!draftLoaded || !draft) return;

    // Load estimator result once the client-side localStorage draft is available.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData((prev) => ({
      ...prev,
      name: draft.productName,
      year: draft.year,
      price: formatRupiah(Number(parseEstimatedPrice(draft.estimatedPrice))),
      condition: draft.condition,
      conditionDetail: draft.condition === "minus" ? draft.minusDetail : "",
    }));
  }, [draft, draftLoaded]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "category"
        ? { subcategory: getSubcategories(value as ProductCategory)[0] ?? "" }
        : {}),
      ...(name === "condition" && value !== "minus" ? { conditionDetail: "" } : {}),
    }));
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length === 0) return;

    if (imageUrls.length + selectedFiles.length > MAX_PRODUCT_PHOTOS) {
      setError(`Maksimal ${MAX_PRODUCT_PHOTOS} foto produk untuk MVP ini.`);
      event.target.value = "";
      return;
    }

    if (selectedFiles.some((file) => !file.type.startsWith("image/"))) {
      setError("File harus berupa gambar.");
      event.target.value = "";
      return;
    }

    setImageLoading(true);

    try {
      const compressedImages = await Promise.all(
        selectedFiles.map((file) => compressImageToBase64(file)),
      );

      if (compressedImages.some((imageUrl) => !isCompressedImageValid(imageUrl))) {
        setError("Ada foto yang masih lebih dari 500KB setelah dikompres.");
        return;
      }

      setImageUrls((prev) => [...prev, ...compressedImages]);
      setFormData((prev) => ({
        ...prev,
        imageUrl: prev.imageUrl || compressedImages[0] || "",
      }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memproses foto. Coba pilih file lain.");
    } finally {
      setImageLoading(false);
      event.target.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) => {
      const nextImages = prev.filter((_, itemIndex) => itemIndex !== index);
      setFormData((current) => ({
        ...current,
        imageUrl: nextImages[0] || "",
      }));
      return nextImages;
    });
  };

  const handlePriceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const priceValue = parseRupiah(event.target.value);
    setFormData((prev) => ({
      ...prev,
      price: formatRupiah(priceValue),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.condition === "minus" && !formData.conditionDetail.trim()) {
      setError("Jelaskan kekurangan barang untuk kondisi minus.");
      setLoading(false);
      return;
    }

    if (formData.description.trim().length < 20) {
      setError("Deskripsi produk wajib diisi minimal 20 karakter.");
      setLoading(false);
      return;
    }

    if (imageUrls.length === 0) {
      setError("Upload minimal 1 foto produk.");
      setLoading(false);
      return;
    }

    const parsedPrice = parseRupiah(formData.price);
    if (parsedPrice <= 0) {
      setError("Harga wajib diisi dan harus lebih dari 0.");
      setLoading(false);
      return;
    }

    if (!formData.category || !formData.subcategory) {
      setError("Kategori dan subkategori harus diisi.");
      setLoading(false);
      return;
    }

    if (!user) {
      setError("Login dengan Google dulu sebelum menjual barang.");
      setLoading(false);
      return;
    }

    if (!profile?.isWhatsappConnected) {
      setError("Hubungkan WhatsApp dulu sebelum menjual barang.");
      setLoading(false);
      router.push(`/verify-phone?redirect=${encodeURIComponent("/sell")}`);
      return;
    }

    try {
      await createProduct({
        name: formData.name,
        year: Number(formData.year),
        price: parsedPrice,
        description: formData.description.trim(),
        category: formData.category,
        subcategory: formData.subcategory,
        condition: formData.condition,
        conditionDetail:
          formData.condition === "minus" ? formData.conditionDetail.trim() : undefined,
        imageUrls,
        location: formData.location,
        seller: {
          uid: user.uid,
          name: profile.name || user.displayName || "Eco Seller",
          avatar: profile.photoURL || user.photoURL || undefined,
          phoneNumber: profile.whatsappNumber,
          isPhoneVerified: profile.isWhatsappConnected,
        },
      });

      setSuccess(true);
      clearDraft();

      setTimeout(() => {
        router.push("/login/market");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-[#f6fbf6]">
        <div className="mx-auto flex max-w-2xl items-center justify-center px-4 py-20">
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-2xl font-black text-white">
              OK
            </div>
            <h1 className="mt-4 text-2xl font-black text-emerald-900">Berhasil ditambahkan</h1>
            <p className="mt-2 text-sm text-emerald-700">Produkmu sekarang tersedia di marketplace.</p>
            <p className="mt-4 text-xs font-semibold text-emerald-600">Mengarahkan ke marketplace...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6fbf6] py-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-slate-900"
          >
            Kembali
          </button>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-700">Eco Market</p>
          <h1 className="mt-3 text-4xl font-black text-slate-950">Jual Barangmu</h1>
          <p className="mt-2 text-slate-600">
            Lengkapi kondisi, detail, dan foto barang agar pembeli lebih percaya.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm shadow-emerald-950/5"
        >
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-bold text-red-900">{error}</p>
            </div>
          ) : null}

          {authError ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-bold text-amber-900">{authError}</p>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-50 px-4 py-3">
            <div>
              <p className="text-sm font-black text-emerald-900">
                {user ? profile?.name || user.displayName || "Eco Seller" : "Login seller"}
              </p>
              <p className="text-xs font-semibold text-emerald-700">
                {user && profile?.isWhatsappConnected
                  ? "Akun sudah terhubung WhatsApp dan siap menerima pesan pembeli."
                  : user
                    ? "Hubungkan WhatsApp untuk bisa menjual barang."
                  : "Login dengan Google untuk memulai menjual."}
              </p>
            </div>
            <button
              type="button"
              onClick={user ? logout : loginWithGoogle}
              disabled={authLoading}
              className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {authLoading ? "Memuat..." : user ? "Logout" : "Login Google"}
            </button>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Nama Produk *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Contoh: MacBook Air M1 2021"
              required
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Deskripsi Produk *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Contoh: Pemakaian normal, masih mulus, kelengkapan charger dan box ada, dijual karena upgrade."
              required
              rows={4}
              className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
            <p className="mt-2 text-xs font-semibold text-slate-500">
              Minimal 20 karakter. Ceritakan kondisi, kelengkapan, dan alasan dijual.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Tahun Pembelian *</label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                min="2000"
                max={new Date().getFullYear()}
                required
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Kategori *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="">Pilih kategori</option>
                {categoryDefinitions.map((category) => (
                  <option key={category.label} value={category.label}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Subkategori *</label>
              <select
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                required
                disabled={!formData.category}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">Pilih subkategori</option>
                {formData.category
                  ? getSubcategories(formData.category).map((subcategory) => (
                      <option key={subcategory} value={subcategory}>
                        {subcategory}
                      </option>
                    ))
                  : null}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Kondisi *</label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="like_new">Seperti Baru</option>
                <option value="good">Bagus</option>
                <option value="minus">Minus</option>
              </select>
            </div>
          </div>

          {formData.condition === "minus" ? (
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Jelaskan kekurangan barang *
              </label>
              <textarea
                name="conditionDetail"
                value={formData.conditionDetail}
                onChange={handleChange}
                placeholder="Contoh: Ada lecet kecil di sudut, baterai sekitar 85%."
                required
                rows={4}
                className="w-full resize-none rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
              />
            </div>
          ) : null}

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Foto Produk</label>
            <div className="grid gap-4">
              {imageUrls.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {imageUrls.map((preview, index) => (
                    <div
                      key={`${index}-${preview.length}`}
                      className="relative aspect-square overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preview}
                        alt={`Preview foto produk ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      {index === 0 ? (
                        <span className="absolute left-2 top-2 rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-black text-white">
                          Cover
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-black text-slate-700 shadow-sm"
                      >
                        Hapus
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50">
                  <span className="px-4 text-center text-sm font-bold text-emerald-700">
                    {imageLoading ? "Memproses foto..." : "Belum ada foto"}
                  </span>
                </div>
              )}
              <div className="flex flex-col justify-center gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="cursor-pointer rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-center text-sm font-bold text-emerald-700 transition hover:bg-emerald-50">
                    {imageLoading ? "Memproses..." : "Upload Foto"}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={imageLoading || imageUrls.length >= MAX_PRODUCT_PHOTOS}
                      onChange={handleImageChange}
                      className="sr-only"
                    />
                  </label>
                  <label className="cursor-pointer rounded-2xl bg-emerald-600 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-emerald-700">
                    {imageLoading ? "Memproses..." : "Buka Kamera"}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      multiple
                      disabled={imageLoading || imageUrls.length >= MAX_PRODUCT_PHOTOS}
                      onChange={handleImageChange}
                      className="sr-only"
                    />
                  </label>
                </div>
                <p className="text-xs font-semibold leading-5 text-slate-500">
                  Upload 1 sampai 2 foto. Foto pertama menjadi cover. Maksimal 500KB per foto setelah kompres.
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <label className="block text-sm font-bold text-slate-700">Harga (Rp) *</label>
              <button
                type="button"
                onClick={() => {
                  const params = new URLSearchParams({
                    name: formData.name,
                    year: formData.year,
                    condition: formData.condition,
                  });
                  if (formData.condition === "minus" && formData.conditionDetail) {
                    params.set("conditionDetail", formData.conditionDetail);
                  }
                  router.push(`/sell/estimate?${params.toString()}`);
                }}
                className="text-xs font-bold text-emerald-600 transition hover:text-emerald-700 underline"
              >
                Bingung kasih harga?
              </button>
            </div>
            <input
              type="text"
              name="price"
              value={formData.price}
              onChange={handlePriceChange}
              placeholder="Contoh: Rp530.000"
              inputMode="numeric"
              required
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Lokasi *</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Contoh: Jakarta Selatan"
              required
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || imageLoading}
              className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "Sedang menyimpan..." : "Jual Barang"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function SellPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f6fbf6]" />}>
      <SellFormContent />
    </Suspense>
  );
}
