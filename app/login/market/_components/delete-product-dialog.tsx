"use client";

import { useState } from "react";

type DeleteProductDialogProps = {
  productName: string;
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
};

export function DeleteProductDialog({
  productName,
  isOpen,
  isLoading,
  error,
  onCancel,
  onConfirm,
}: DeleteProductDialogProps) {
  const [localError, setLocalError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setLocalError(null);
    try {
      await onConfirm();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus produk");
    }
  };

  if (!isOpen) return null;

  const displayError = error || localError;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-slate-950/30 transition-opacity"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-sm rounded-3xl border border-red-100 bg-white shadow-xl">
          {/* Close button */}
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="absolute right-4 top-4 text-slate-400 transition hover:text-slate-600 disabled:opacity-50"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Content */}
          <div className="space-y-5 p-6">
            {/* Icon */}
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>

            {/* Title & Description */}
            <div>
              <h2 className="text-xl font-black text-slate-950">Hapus Produk?</h2>
              <p className="mt-2 text-sm text-slate-600">
                Yakin ingin menghapus &ldquo;<span className="font-bold text-slate-800">{productName}</span>&rdquo;?
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Produk akan hilang dari marketplace dan tidak bisa dipulihkan.
              </p>
            </div>

            {/* Error message */}
            {displayError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-semibold text-red-800">{displayError}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="grid gap-3 sm:grid-cols-2 pt-4">
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isLoading}
                className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Menghapus...
                  </>
                ) : (
                  "Hapus"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
