"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ProductCondition } from "@/lib/types";
import { useProductDraft } from "@/hooks/useProductDraft";

type EstimateFormData = {
  name: string;
  year: string;
  condition: ProductCondition;
  minusDetail: string;
};

type EstimateResult = {
  price: string;
  reason: string;
  confidence: string;
  conditionSummary: string;
};

function EstimateFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { saveDraft } = useProductDraft();
  const queryCondition = searchParams.get("condition") as ProductCondition | null;
  const initialCondition: ProductCondition =
    queryCondition === "like_new" || queryCondition === "good" || queryCondition === "minus"
      ? queryCondition
      : "good";
  
  const [formData, setFormData] = useState<EstimateFormData>({
    name: searchParams.get("name") || "",
    year: searchParams.get("year") || new Date().getFullYear().toString(),
    condition: initialCondition,
    minusDetail: searchParams.get("conditionDetail") || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EstimateResult | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "condition" && value !== "minus" ? { minusDetail: "" } : {}),
    }));
  };

  const handleEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    if (formData.condition === "minus" && !formData.minusDetail.trim()) {
      setError("Detail kerusakan wajib diisi untuk kondisi minus.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          year: Number(formData.year),
          condition: formData.condition,
          minusDetail: formData.minusDetail.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Gagal mengestimasi harga");
      }

      const data = await response.json();
      setResult({
        price: data.price || data.estimate || "Tidak ditemukan",
        reason: data.reason || "Estimasi dibuat dari data pasar dan kondisi barang.",
        confidence: data.confidence || "Low",
        conditionSummary:
          data.conditionSummary ||
          `${formData.condition === "like_new" ? "Seperti Baru" : formData.condition === "good" ? "Bagus" : "Minus"} - tahun pembelian ${formData.year}`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleUsePrice = () => {
    if (!result?.price || result.price === "Tidak ditemukan") {
      setError("Harga tidak valid untuk digunakan");
      return;
    }

    saveDraft({
      productName: formData.name,
      year: formData.year,
      condition: formData.condition,
      minusDetail: formData.condition === "minus" ? formData.minusDetail.trim() : "",
      estimatedPrice: result.price,
      updatedAt: new Date().toISOString(),
    });

    router.push("/sell");
  };

  return (
    <main className="min-h-screen bg-[#f6fbf6] py-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-slate-900"
          >
            ← Kembali
          </button>
          <h1 className="text-4xl font-black text-slate-950">AI Estimator Harga</h1>
          <p className="mt-2 text-slate-600">
            Masukkan nama produk, tahun pembelian, dan kondisi barang untuk estimasi harga yang praktis.
          </p>
        </div>

        <div className="space-y-6 rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
          <form onSubmit={handleEstimate} className="space-y-6">
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-bold text-red-900">❌ {error}</p>
              </div>
            )}

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
                <label className="mb-2 block text-sm font-bold text-slate-700">Kondisi Produk *</label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  required
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
                  Minus / Detail Kerusakan *
                </label>
                <textarea
                  name="minusDetail"
                  value={formData.minusDetail}
                  onChange={handleChange}
                  placeholder="Contoh: baterai cepat habis, layar retak, tombol rusak"
                  required
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                />
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "Sedang mengestimasi..." : "Estimasi Harga"}
            </button>
          </form>

          {result && (
            <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-700">Hasil Estimasi</p>
                <p className="mt-3 text-3xl font-black text-emerald-900">{result.price}</p>
                <p className="mt-1 text-xs text-emerald-700">Tingkat kepercayaan: {result.confidence}</p>
              </div>
              <div className="grid gap-3 rounded-2xl bg-white p-4 text-sm text-slate-700">
                <p>
                  <span className="font-black text-slate-900">Alasan AI:</span> {result.reason}
                </p>
                <p>
                  <span className="font-black text-slate-900">Ringkasan kondisi:</span>{" "}
                  {result.conditionSummary}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleEstimate}
                  className="flex-1 rounded-2xl border border-emerald-300 bg-white px-4 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
                >
                  Cari Ulang
                </button>
                <button
                  onClick={handleUsePrice}
                  className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
                >
                  Gunakan Harga Ini
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function EstimatePage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f6fbf6]" />}>
      <EstimateFormContent />
    </Suspense>
  );
}
