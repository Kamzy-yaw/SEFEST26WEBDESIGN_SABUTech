import { SafeImage } from "@/components/SafeImage";

type SellerInfoProps = {
  name: string;
  avatar: string;
  contributionCount: number;
  isWhatsappConnected: boolean;
};

export function SellerInfo({
  name,
  avatar,
  contributionCount,
  isWhatsappConnected,
}: SellerInfoProps) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
      <SafeImage
        src={avatar}
        fallbackSrc="/default-avatar.png"
        alt=""
        className="h-12 w-12 rounded-2xl object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-slate-900">{name}</p>
        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          {isWhatsappConnected ? (
            <span className="whitespace-nowrap rounded-full bg-green-100 px-2 py-0.5 text-xs font-black text-green-700">
              WhatsApp Terhubung
            </span>
          ) : null}
          <span className="break-words text-xs font-bold text-emerald-700">
            {contributionCount} barang terselamatkan
          </span>
        </div>
      </div>
    </div>
  );
}
