export {
  getUserProfile,
  loginWithGooglePopup,
  logoutUser,
  subscribeToUserProfile,
  updateUserProfile,
  updateUserWhatsApp,
  upsertUserProfile,
  type UserProfile,
} from "@/lib/auth";

export { isValidWhatsAppNumber, normalizeWhatsAppNumber } from "@/lib/whatsapp";
