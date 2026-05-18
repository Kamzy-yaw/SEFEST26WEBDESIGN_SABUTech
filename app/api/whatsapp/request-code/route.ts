import { NextResponse } from "next/server";
import {
  OTP_RESEND_COOLDOWN_MS,
  createVerification,
  generateOtpCode,
  getWhatsappVerification,
  getUserWhatsappNumber,
  normalizeAndValidateWhatsApp,
  requireFirebaseUser,
  saveWhatsappVerification,
  sendOtpToBot,
} from "@/lib/whatsapp-otp-server";

export const runtime = "nodejs";

type RequestCodeBody = {
  phone?: unknown;
  purpose?: unknown;
};

function parsePurpose(purpose: unknown) {
  return purpose === "change" ? "change" : "connect";
}

export async function POST(request: Request) {
  try {
    const { user } = await requireFirebaseUser(request);
    const body = (await request.json()) as RequestCodeBody;
    const phone = normalizeAndValidateWhatsApp(body.phone);
    const purpose = parsePurpose(body.purpose);
    const existing = await getWhatsappVerification(user.uid);
    const now = Date.now();

    if (purpose === "change") {
      const currentWhatsapp = await getUserWhatsappNumber(user.uid);

      if (currentWhatsapp === phone) {
        return NextResponse.json(
          { success: false, error: "Nomor ini sudah terhubung." },
          { status: 400 },
        );
      }
    }

    if (
      existing?.lastSentAt &&
      existing.status !== "verified" &&
      now - existing.lastSentAt < OTP_RESEND_COOLDOWN_MS
    ) {
      const remainingSeconds = Math.ceil(
        (OTP_RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000,
      );

      return NextResponse.json(
        { success: false, error: `Tunggu ${remainingSeconds} detik sebelum kirim ulang kode.` },
        { status: 429 },
      );
    }

    const verification = createVerification(user.uid, phone, generateOtpCode(), purpose);
    await saveWhatsappVerification(verification);

    try {
      await sendOtpToBot(phone, verification.code);
    } catch (error) {
      await saveWhatsappVerification({ ...verification, status: "expired" });
      throw error;
    }

    await saveWhatsappVerification({ ...verification, status: "sent" });

    return NextResponse.json({
      success: true,
      message:
        purpose === "change"
          ? "Kode verifikasi sudah dikirim ke nomor baru Anda."
          : "Kode verifikasi sudah dikirim ke WhatsApp Anda.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengirim kode WhatsApp.";
    const status = message.includes("Login") || message.includes("Sesi") ? 401 : 400;

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
