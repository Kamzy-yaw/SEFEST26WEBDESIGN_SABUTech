export function normalizeWhatsAppNumber(phoneNumber: string): string {
  const trimmed = phoneNumber.trim().replace(/[\s\-()]/g, "");

  if (trimmed.startsWith("+628")) return trimmed.slice(1);
  if (trimmed.startsWith("08")) return `62${trimmed.slice(1)}`;
  if (trimmed.startsWith("628")) return trimmed;

  return trimmed;
}

export function isValidWhatsAppNumber(phoneNumber: string): boolean {
  const normalized = normalizeWhatsAppNumber(phoneNumber);
  return /^628\d{7,13}$/.test(normalized);
}
