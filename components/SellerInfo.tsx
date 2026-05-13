type SellerInfoProps = {
  name: string;
  avatar: string;
  status?: string;
  contributionCount: number;
  isWhatsappConnected: boolean;
};

export function SellerInfo({
  name,
  avatar,
  status,
  contributionCount,
  isWhatsappConnected,
}: SellerInfoProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={avatar} alt={name} className="h-12 w-12 rounded-2xl object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-slate-900">{name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-black text-emerald-700">
            {status || "Penjual Eco"}
          </span>
          {isWhatsappConnected ? (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-black text-green-700">
              WhatsApp Terhubung
            </span>
          ) : null}
          <span className="text-xs font-bold text-emerald-700">
            {contributionCount} barang terselamatkan
          </span>
        </div>
      </div>
    </div>
  );
}
