"use client";

import { useState } from "react";
import {
  compressImageToBase64,
  isCompressedImageValid,
  MAX_PRODUCT_PHOTOS,
} from "@/utils/image";

export function useProductImageUpload() {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const addImages = async (files: File[]) => {
    if (files.length === 0) return null;

    if (imageUrls.length + files.length > MAX_PRODUCT_PHOTOS) {
      const message = `Maksimal ${MAX_PRODUCT_PHOTOS} foto produk untuk MVP ini.`;
      setImageError(message);
      return message;
    }

    if (files.some((file) => !file.type.startsWith("image/"))) {
      const message = "File harus berupa gambar.";
      setImageError(message);
      return message;
    }

    setImageLoading(true);
    setImageError(null);

    try {
      const compressedImages = await Promise.all(
        files.map((file) => compressImageToBase64(file)),
      );

      if (compressedImages.some((imageUrl) => !isCompressedImageValid(imageUrl))) {
        const message = "Ada foto yang masih lebih dari 500KB setelah dikompres.";
        setImageError(message);
        return message;
      }

      setImageUrls((prev) => [...prev, ...compressedImages]);
      return null;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal memproses foto. Coba pilih file lain.";
      setImageError(message);
      return message;
    } finally {
      setImageLoading(false);
    }
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  return {
    imageUrls,
    imageLoading,
    imageError,
    maxPhotos: MAX_PRODUCT_PHOTOS,
    addImages,
    removeImage,
  };
}
