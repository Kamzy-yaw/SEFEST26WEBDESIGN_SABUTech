"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { isFirebaseConfigured } from "@/lib/firebase";
import { deleteProduct, getProductById } from "@/lib/products";
import { getUserProfile, type UserProfile } from "@/lib/users";
import type { Product } from "@/lib/types";

export function useProductDetail(productId: string, currentUserId?: string) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [sellerProfile, setSellerProfile] = useState<UserProfile | null>(null);
  const [selectedImage, setSelectedImage] = useState("/placeholder-product.svg");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProduct() {
      if (!isFirebaseConfigured) {
        setError("Konfigurasi Firebase belum lengkap. Isi NEXT_PUBLIC_FIREBASE_* di .env.local.");
        setLoading(false);
        return;
      }

      try {
        const productData = await getProductById(productId);
        if (!active) return;

        if (!productData) {
          setError("Produk tidak ditemukan.");
          return;
        }

        setProduct(productData);
        setSelectedImage(productData.imageUrls?.[0] || productData.imageUrl || "/placeholder-product.svg");

        try {
          setSellerProfile(await getUserProfile(productData.sellerId));
        } catch {
          setSellerProfile(null);
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Gagal memuat detail produk.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProduct();

    return () => {
      active = false;
    };
  }, [productId]);

  const productImages = useMemo(() => {
    if (!product) return ["/placeholder-product.svg"];
    return product.imageUrls && product.imageUrls.length > 0
      ? product.imageUrls
      : [product.imageUrl || "/placeholder-product.svg"];
  }, [product]);

  const sellerAvatar = sellerProfile?.photoURL || product?.sellerAvatar || "/default-avatar.png";
  const sellerName = sellerProfile?.name || product?.sellerName || "Eco Seller";
  const sellerWhatsapp = sellerProfile?.whatsappNumber;
  const isWhatsappConnected = Boolean(sellerWhatsapp);
  const isOwner = Boolean(currentUserId && product?.sellerId === currentUserId);

  const whatsappUrl = useMemo(() => {
    if (!product) return "#";

    const sellerPhone = sellerWhatsapp?.replace(/[^\d]/g, "");
    const message = `Halo, saya tertarik dengan produk ${product.name} yang Anda jual di Eco Market.`;

    return sellerPhone ? `https://wa.me/${sellerPhone}?text=${encodeURIComponent(message)}` : "#";
  }, [product, sellerWhatsapp]);

  const handleDeleteProduct = async () => {
    if (!currentUserId) {
      setDeleteError("Anda harus login untuk menghapus produk");
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteProduct(productId, currentUserId);
      setIsDeleteDialogOpen(false);
      router.push("/login/market?deleted=true");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Gagal menghapus produk");
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    product,
    sellerProfile,
    selectedImage,
    setSelectedImage,
    productImages,
    sellerAvatar,
    sellerName,
    sellerWhatsapp,
    isWhatsappConnected,
    isOwner,
    whatsappUrl,
    loading,
    error,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isDeleting,
    deleteError,
    setDeleteError,
    handleDeleteProduct,
  };
}
