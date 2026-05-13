import { NextResponse } from "next/server";
import { getProducts, addProduct } from "@/lib/storage";
import { Product, ProductCategory, ProductCondition, ProductSubcategory } from "@/lib/types";
import { randomUUID } from "crypto";
import { detectCategory, calculateEcoSaved } from "@/lib/utils";
import { isProductCategory, isProductSubcategory } from "@/app/login/market/_data/categories";

type ProductRequestBody = {
  name?: string;
  year?: number | string;
  price?: number | string;
  description?: string;
  condition?: ProductCondition;
  conditionDetail?: string;
  imageUrl?: string;
  location?: string;
  category?: ProductCategory;
  subcategory?: ProductSubcategory;
  sellerName?: string;
  sellerAvatar?: string;
  sellerContributionCount?: number;
  sellerStatus?: string;
};

const validConditions: ProductCondition[] = ["like_new", "good", "minus"];

export async function GET() {
  try {
    const products = getProducts();
    return NextResponse.json(products);
  } catch (error) {
    console.error("Gagal mengambil produk:", error);
    return NextResponse.json(
      { error: "Gagal mengambil produk" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ProductRequestBody;
    const {
      name,
      year,
      price,
      description,
      condition = "good",
      conditionDetail,
      imageUrl,
      location,
      category,
      subcategory,
      sellerName,
      sellerAvatar,
      sellerContributionCount,
      sellerStatus,
    } = body;

    if (!name || year === undefined || price === undefined) {
      return NextResponse.json(
        { error: "Nama, tahun, dan harga harus diisi" },
        { status: 400 }
      );
    }

    if (!validConditions.includes(condition)) {
      return NextResponse.json(
        { error: "Kondisi produk tidak valid" },
        { status: 400 }
      );
    }

    const cleanConditionDetail = conditionDetail?.trim();

    if (condition === "minus" && !cleanConditionDetail) {
      return NextResponse.json(
        { error: "Detail kekurangan wajib diisi untuk barang minus" },
        { status: 400 }
      );
    }

    const detectedCategory = detectCategory(name);
    const productCategory = category ?? detectedCategory.category;
    const productSubcategory = subcategory ?? detectedCategory.subcategory;

    if (!isProductCategory(productCategory)) {
      return NextResponse.json(
        { error: "Kategori produk tidak valid" },
        { status: 400 }
      );
    }

    if (!isProductSubcategory(productCategory, productSubcategory)) {
      return NextResponse.json(
        { error: "Subkategori produk tidak sesuai kategori" },
        { status: 400 }
      );
    }

    const ecoSaved = calculateEcoSaved();

    const newProduct: Product = {
      id: randomUUID(),
      name,
      year: Number(year),
      price: Number(price),
      description: description?.trim() || "Deskripsi produk belum tersedia.",
      condition,
      conditionDetail: condition === "minus" ? cleanConditionDetail : undefined,
      imageUrl: imageUrl?.trim() || undefined,
      imageUrls: imageUrl?.trim() ? [imageUrl.trim()] : undefined,
      location: location || "Indonesia",
      city: location?.split(",")[0].trim() || "Indonesia",
      category: productCategory,
      subcategory: productSubcategory,
      sellerId: "mock-seller",
      sellerName: sellerName?.trim() || "Zys",
      sellerAvatar: sellerAvatar?.trim() || undefined,
      sellerPhone: "+6281234567890",
      sellerVerified: true,
      sellerContributionCount: sellerContributionCount ?? 1,
      sellerStatus: sellerStatus?.trim() || "Eco Seller",
      ecoSaved,
      createdAt: new Date().toISOString(),
    };

    addProduct(newProduct);

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Gagal membuat produk:", error);
    return NextResponse.json(
      { error: "Gagal membuat produk" },
      { status: 500 }
    );
  }
}
