"use client";

import { useCallback, useEffect, useState } from "react";
import { Product, ProductCondition } from "@/lib/types";

type EstimateResult = {
  success: boolean;
  product: string;
  year: number;
  estimate: string;
  reason?: string;
  marketTrend?: string;
  confidence?: string;
};

export default function Home() {
  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [condition, setCondition] = useState<ProductCondition>("good");
  const [conditionDetail, setConditionDetail] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/product");
      if (res.ok) {
        const data = (await res.json()) as Product[];
        setProducts(data);
      }
    } catch (err) {
      console.error("Gagal fetch products:", err);
    }
  }, []);

  // Fetch products saat component mount
  useEffect(() => {
    // Client-side refresh after product creation keeps the sidebar in sync.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
  }, [fetchProducts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!name.trim() || !year.trim()) {
      setError("Nama produk dan tahun harus diisi!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, year: Number(year) })
      });

      if (!res.ok) {
        throw new Error("Gagal mengambil data");
      }

      const data = (await res.json()) as EstimateResult;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!result) return;
    if (condition === "minus" && !conditionDetail.trim()) {
      setError("Jelaskan kekurangan barang untuk kondisi minus.");
      return;
    }

    setSubmitting(true);
    try {
      // Extract harga dari estimate
      const priceString = result.estimate.replace(/[^\d]/g, "");
      const price = parseInt(priceString) || 0;

      const res = await fetch("/api/product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          year: Number(year),
          price,
          condition,
          conditionDetail: condition === "minus" ? conditionDetail.trim() : undefined,
          imageUrl: imageUrl.trim() || undefined,
          location: location || "Indonesia"
        })
      });

      if (!res.ok) {
        throw new Error("Gagal menyimpan produk");
      }

      // Reset form
      setName("");
      setYear("");
      setCondition("good");
      setConditionDetail("");
      setImageUrl("");
      setLocation("");
      setResult(null);

      // Fetch products lagi
      await fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan produk");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      <main className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 mb-2">
            Eco Market 🌱
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Cek harga barang bekas dengan AI & jual sekarang</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Estimate Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                📝 Cek Harga Produk
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    Nama Produk
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: iPhone 12, Laptop Dell, Kursi Gaming"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:border-green-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    Tahun
                  </label>
                  <input
                    type="number"
                    placeholder="Contoh: 2022"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:border-green-500 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      Loading...
                    </>
                  ) : (
                    "🔍 Cek Harga"
                  )}
                </button>
              </form>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 border-l-4 border-red-500 rounded">
                  <p className="text-red-700 dark:text-red-100 font-medium">❌ {error}</p>
                </div>
              )}
            </div>

            {/* Result Card with Save Option */}
            {result && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 animate-in fade-in duration-300">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  📊 Hasil Estimasi
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-700 dark:to-slate-600 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Produk</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{result.product}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-slate-700 dark:to-slate-600 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Tahun</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{result.year}</p>
                  </div>
                </div>

                {/* Price Section */}
                <div className="bg-gradient-to-r from-green-500 to-blue-500 p-6 rounded-xl mb-6 text-white">
                  <p className="text-sm font-semibold opacity-90 mb-1">💰 Estimasi Harga</p>
                  <p className="text-4xl font-bold">{result.estimate}</p>
                </div>

                {/* Reason */}
                {result.reason && (
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-slate-700 rounded-lg border-l-4 border-blue-500">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">💡 Alasan</p>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{result.reason}</p>
                  </div>
                )}

                {/* Market Trend */}
                {result.marketTrend && (
                  <div className="p-4 bg-amber-50 dark:bg-slate-700 rounded-lg border-l-4 border-amber-500">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">📈 Trend Pasar</p>
                    <p className="text-gray-700 dark:text-gray-300">{result.marketTrend}</p>
                  </div>
                )}

                {/* Product Details Form */}
                <div className="mt-6 pt-6 border-t-2 border-gray-200 dark:border-slate-700 space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">🛒 Detail Produk</h3>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Kondisi
                    </label>
                    <select
                      value={condition}
                      onChange={(e) => {
                        const nextCondition = e.target.value as ProductCondition;
                        setCondition(nextCondition);
                        if (nextCondition !== "minus") setConditionDetail("");
                      }}
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:border-green-500"
                    >
                      <option value="like_new">Seperti Baru</option>
                      <option value="good">Bagus</option>
                      <option value="minus">Minus</option>
                    </select>
                  </div>

                  {condition === "minus" && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        Jelaskan kekurangan barang
                      </label>
                      <textarea
                        value={conditionDetail}
                        onChange={(e) => setConditionDetail(e.target.value)}
                        placeholder="Contoh: Ada lecet kecil, baterai sudah menurun, atau dus tidak lengkap"
                        required
                        rows={4}
                        className="w-full px-4 py-3 rounded-lg border-2 border-amber-200 bg-amber-50/40 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Image URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com/foto-produk.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:border-green-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Lokasi
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Jakarta, Surabaya, Bandung"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:border-green-500 transition-colors"
                    />
                  </div>

                  <button
                    onClick={handleSaveProduct}
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                        Menyimpan...
                      </>
                    ) : (
                      "✅ Simpan Produk"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!result && !loading && (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
                <p className="text-gray-500 dark:text-gray-400 text-lg">Belum ada estimasi. Cek harga sekarang! 👆</p>
              </div>
            )}
          </div>

          {/* Products List Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 sticky top-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                📦 Produk Saya ({products.length})
              </h2>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {products.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4">Belum ada produk</p>
                ) : (
                  products.map((product) => (
                    <div
                      key={product.id}
                      className="p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-slate-700 dark:to-slate-600 rounded-lg border-l-4 border-green-500"
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {product.year} • {product.condition}
                      </p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-2">
                        Rp{product.price.toLocaleString("id-ID")}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        📍 {product.location}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
