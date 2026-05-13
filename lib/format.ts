import type { ProductCondition } from "@/lib/types";

export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCondition(value: ProductCondition) {
  const labels: Record<ProductCondition, string> = {
    like_new: "Seperti baru",
    good: "Bagus",
    minus: "Minus",
  };

  return labels[value];
}

export function formatRelativeTime(value: string) {
  const createdAt = new Date(value).getTime();

  if (!Number.isFinite(createdAt)) {
    return "Baru saja";
  }

  const diffMs = Date.now() - createdAt;
  const diffMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Baru saja";
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays === 1) return "Kemarin";

  return `${diffDays} hari lalu`;
}
