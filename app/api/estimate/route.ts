import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { ProductCondition } from "@/lib/types";

type EstimateRequestBody = {
  name?: string;
  year?: number | string;
  condition?: ProductCondition;
  minusDetail?: string;
};

type SerpApiShoppingResult = {
  price?: string;
};

type SerpApiOrganicResult = {
  snippet?: string;
};

type SerpApiResponse = {
  shopping_results?: SerpApiShoppingResult[];
  organic_results?: SerpApiOrganicResult[];
};

type AiEstimateResult = {
  price: string;
  reason: string;
  confidence: "Low" | "Medium" | "High";
  conditionSummary: string;
};

const validConditions: ProductCondition[] = ["like_new", "good", "minus"];

function getConditionLabel(condition: ProductCondition) {
  const labels: Record<ProductCondition, string> = {
    like_new: "Seperti Baru",
    good: "Bagus",
    minus: "Minus",
  };

  return labels[condition];
}

function parsePrice(value: string | undefined) {
  const parsed = Number(value?.replace(/[^\d]/g, "") ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseAiJson(value: string): Partial<AiEstimateResult> | null {
  try {
    const jsonMatch = value.match(/\{[\s\S]*\}/);
    return jsonMatch ? (JSON.parse(jsonMatch[0]) as Partial<AiEstimateResult>) : null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as EstimateRequestBody;
    const {
      name,
      year,
      condition = "good",
      minusDetail,
    } = body;

    if (!name?.trim() || year === undefined) {
      return NextResponse.json(
        { success: false, error: "Nama produk dan tahun harus diisi" },
        { status: 400 }
      );
    }

    if (!validConditions.includes(condition)) {
      return NextResponse.json(
        { success: false, error: "Kondisi produk tidak valid" },
        { status: 400 }
      );
    }

    if (condition === "minus" && !minusDetail?.trim()) {
      return NextResponse.json(
        { success: false, error: "Detail kerusakan wajib diisi untuk kondisi minus" },
        { status: 400 }
      );
    }

    const cleanName = name.trim();
    const cleanMinusDetail = minusDetail?.trim() || "-";
    const conditionLabel = getConditionLabel(condition);
    const query = [
      cleanName,
      "bekas harga",
      year,
      conditionLabel,
      "Indonesia",
    ]
      .filter(Boolean)
      .join(" ");

    let prices: number[] = [];

    if (process.env.SERP_API_KEY) {
      const res = await fetch(
        `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${process.env.SERP_API_KEY}&gl=id&hl=id&google_domain=google.co.id`
      );
      const data = (await res.json()) as SerpApiResponse;

      if (data.shopping_results) {
        prices = data.shopping_results
          .map((item) => parsePrice(item.price))
          .filter((price): price is number => price !== null);
      }

      if (prices.length === 0 && data.organic_results) {
        prices = data.organic_results
          .map((item) => parsePrice(item.snippet?.match(/Rp[\d.]+/)?.[0]))
          .filter((price): price is number => price !== null);
      }
    }

    let estimatedPrice = "Tidak ditemukan";
    let confidence = "Low";

    if (prices && prices.length > 0) {
      // Sort untuk cari median
      prices.sort((a, b) => a - b);

      const median = prices[Math.floor(prices.length / 2)];

      // Ambil harga dalam range 70%-130% dari median (exclude outliers)
      const nearMedian = prices.filter(
        p => p > median * 0.7 && p < median * 1.3
      );

      if (nearMedian.length > 0) {
        // Hitung average dari harga yang masuk akal
        const avg = Math.floor(
          nearMedian.reduce((a, b) => a + b, 0) / nearMedian.length
        );

        estimatedPrice = `Rp${avg.toLocaleString("id-ID")}`;

        // Confidence level
        confidence = nearMedian.length > 5 ? "High" : "Low";
      }
    }

    let aiResult: AiEstimateResult = {
      price: estimatedPrice,
      reason:
        "Harga diperkirakan dari data pasar Indonesia, tahun pembelian, kondisi barang, dan detail minus yang tersedia.",
      confidence: confidence as AiEstimateResult["confidence"],
      conditionSummary: `${conditionLabel} - tahun pembelian ${year}${
        condition === "minus" ? `, minus: ${cleanMinusDetail}` : ""
      }`,
    };

    if (process.env.GROQ_API_KEY) {
      try {
        const client = new OpenAI({
          apiKey: process.env.GROQ_API_KEY,
          baseURL: "https://api.groq.com/openai/v1",
        });

        const aiResponse = await client.chat.completions.create({
          model: "openai/gpt-oss-120b",
          messages: [
            {
              role: "system",
              content:
                "Kamu adalah AI estimator harga barang bekas di Indonesia yang ahli membaca kondisi barang, umur pakai, minus, dan harga pasar lokal.",
            },
            {
              role: "user",
              content: `
Produk: ${cleanName}
Tahun pembelian: ${year}
Kondisi: ${conditionLabel}
Detail kerusakan: ${condition === "minus" ? cleanMinusDetail : "-"}
Data harga dari pasar: ${prices.length > 0 ? prices.join(", ") : "tidak tersedia"}

Berikan estimasi harga bekas di Indonesia berdasarkan kondisi pasar dan kondisi barang.

Return JSON:
{
  "price": "Rp[angka dengan format lokal]",
  "reason": "[Penjelasan 1-2 kalimat singkat mengapa harga segitu berdasarkan tahun pembelian, kondisi, minus, dan data pasar]",
  "confidence": "Low/Medium/High",
  "conditionSummary": "[Ringkasan kondisi singkat]"
}

Penting:
- Gunakan data harga yang valid sebagai acuan
- Format currency dengan Rp dan titik untuk pemisah ribuan
- Turunkan estimasi untuk tahun pembelian lama, kondisi Minus, dan kerusakan penting
- Naikkan estimasi jika barang Seperti Baru
- Jawab hanya JSON, tanpa penjelasan tambahan
`,
            },
          ],
        });

        const aiResultText = aiResponse.choices[0].message.content || "{}";
        const parsed = parseAiJson(aiResultText);

        if (parsed) {
          const parsedConfidence =
            parsed.confidence === "Low" ||
            parsed.confidence === "Medium" ||
            parsed.confidence === "High"
              ? parsed.confidence
              : aiResult.confidence;

          aiResult = {
            price: parsed.price || aiResult.price,
            reason: parsed.reason || aiResult.reason,
            confidence: parsedConfidence,
            conditionSummary: parsed.conditionSummary || aiResult.conditionSummary,
          };
        }
      } catch (error) {
        console.error("Groq AI gagal, memakai fallback SerpAPI:", error);
      }
    }

    return NextResponse.json({
      success: true,
      product: cleanName,
      year: Number(year),
      condition,
      minusDetail: condition === "minus" ? cleanMinusDetail : undefined,
      price: aiResult.price,
      estimate: aiResult.price,
      reason: aiResult.reason,
      confidence: aiResult.confidence,
      conditionSummary: aiResult.conditionSummary,
    });
  } catch (err) {
    console.error("Error in estimate route:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
