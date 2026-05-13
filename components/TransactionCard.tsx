import type { Transaction } from "@/lib/types";
import { formatRelativeTime } from "@/lib/format";

type TransactionCardProps = {
  transaction: Transaction;
};

export function TransactionCard({ transaction }: TransactionCardProps) {
  return (
    <article className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-950/5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-950">{transaction.productName}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {formatRelativeTime(transaction.createdAt)}
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
          {transaction.status}
        </span>
      </div>
      {transaction.message ? (
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{transaction.message}</p>
      ) : null}
    </article>
  );
}
