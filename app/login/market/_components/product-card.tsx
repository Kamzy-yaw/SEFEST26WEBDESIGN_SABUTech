import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatCondition, formatRelativeTime, formatRupiah } from "../_utils/format";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const sellerAvatar = product.sellerAvatar || "/default-avatar.png";
  const minusDetail = product.minusDetail ?? product.conditionDetail;
  const conditionTone =
    product.condition === "minus"
      ? "bg-amber-100 text-amber-800"
      : product.condition === "like_new"
        ? "bg-emerald-100 text-emerald-800"
        : "bg-sky-100 text-sky-800";

  return (
    <article className="group overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm shadow-emerald-950/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-950/10">
      <div
        className="relative h-44 bg-[radial-gradient(circle_at_20%_20%,#bbf7d0_0,#ecfdf5_32%,#f8fafc_70%)] bg-cover bg-center"
        style={product.imageUrl ? { backgroundImage: `url(${product.imageUrl})` } : undefined}
      >
        {product.imageUrl ? (
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 to-transparent" />
        ) : null}
        <div className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 shadow-sm">
          {product.category}
        </div>
        <div className="absolute bottom-5 right-5 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-emerald-500 text-2xl font-black text-white shadow-lg shadow-emerald-800/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sellerAvatar}
            alt={product.sellerName || "Seller Eco Market"}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
            <span>{product.year}</span>
            <span className="font-bold text-emerald-700">{product.subcategory}</span>
            <span className={`rounded-full px-3 py-1 text-xs font-black ${conditionTone}`}>
              {formatCondition(product.condition)}
            </span>
          </div>
          <h2 className="mt-2 line-clamp-2 min-h-14 text-xl font-black tracking-tight text-slate-950">
            {product.name}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
            <span>
              Oleh: <span className="font-black text-slate-800">{product.sellerName}</span>
            </span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-black text-emerald-700">
              {product.sellerStatus || "Penjual Eco"}
            </span>
            {product.sellerVerified ? (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-black text-green-700">
                WhatsApp Terhubung
              </span>
            ) : null}
            <span className="text-slate-400">-</span>
            <span>{formatRelativeTime(product.createdAt)}</span>
          </div>
        </div>

        {product.condition === "minus" && minusDetail ? (
          <p className="line-clamp-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
            Minus: {minusDetail}
          </p>
        ) : null}

        <p className="text-2xl font-black text-emerald-600">{formatRupiah(product.price)}</p>

        <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <div className="flex items-center justify-between gap-4">
            <span>Lokasi</span>
            <span className="font-bold text-slate-800">{product.location}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Seller</span>
            <span className="font-bold text-emerald-700">
              {product.sellerContributionCount} barang terselamatkan
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Dampak</span>
            <span className="font-bold text-emerald-700">
              {product.ecoSaved} barang diselamatkan
            </span>
          </div>
        </div>

        <Link
          href={`/market/${product.id}`}
          className="block w-full rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-bold text-white transition group-hover:bg-emerald-600"
        >
          Lihat Produk
        </Link>
      </div>
    </article>
  );
}
