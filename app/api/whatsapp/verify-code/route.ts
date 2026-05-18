import { NextResponse } from "next/server";
import {
  OTP_MAX_ATTEMPTS,
  getWhatsappVerification,
  markUserWhatsappVerified,
  requireFirebaseUser,
  saveWhatsappVerification,
} from "@/lib/whatsapp-otp-server";

export const runtime = "nodejs";

type VerifyCodeBody = {
  code?: unknown;
  purpose?: unknown;
};

function normalizeCode(code: unknown) {
  if (typeof code !== "string") return "";
  return code.replace(/\D/g, "").slice(0, 6);
}

export async function POST(request: Request) {
  try {
    const { user } = await requireFirebaseUser(request);
    const body = (await request.json()) as VerifyCodeBody;
    const code = normalizeCode(body.code);
    const requestedPurpose = body.purpose === "change" ? "change" : "connect";

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { success: false, error: "Masukkan kode OTP 6 digit." },
        { status: 400 },
      );
    }

    const verification = await getWhatsappVerification(user.uid);

    if (!verification || !["pending", "sent"].includes(verification.status)) {
      return NextResponse.json(
        { success: false, error: "Kode verifikasi belum diminta atau sudah tidak aktif." },
        { status: 400 },
      );
    }

    const verificationPurpose = verification.purpose ?? "connect";

    if (verificationPurpose !== requestedPurpose) {
      return NextResponse.json(
        { success: false, error: "Kode verifikasi tidak sesuai dengan permintaan terbaru." },
        { status: 400 },
      );
    }

    if (Date.now() > verification.expiresAt) {
      await saveWhatsappVerification({ ...verification, status: "expired" });
      return NextResponse.json(
        { success: false, error: "Kode verifikasi sudah kedaluwarsa. Kirim kode baru." },
        { status: 400 },
      );
    }

    if (verification.attempts >= OTP_MAX_ATTEMPTS) {
      return NextResponse.json(
        { success: false, error: "Percobaan verifikasi terlalu banyak. Kirim kode baru." },
        { status: 429 },
      );
    }

    if (verification.code !== code) {
      await saveWhatsappVerification(
        { ...verification, attempts: verification.attempts + 1 },
      );

      return NextResponse.json(
        { success: false, error: "Kode verifikasi salah." },
        { status: 400 },
      );
    }

    await markUserWhatsappVerified(user.uid, verification.phone);
    await saveWhatsappVerification({ ...verification, status: "verified" });

    return NextResponse.json({
      success: true,
      message:
        verificationPurpose === "change"
          ? "Nomor WhatsApp berhasil diperbarui."
          : "WhatsApp berhasil terverifikasi.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memverifikasi kode.";
    const status = message.includes("Login") || message.includes("Sesi") ? 401 : 400;

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
