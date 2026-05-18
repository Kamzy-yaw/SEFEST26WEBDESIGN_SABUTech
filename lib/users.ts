export {
  getUserProfile,
  loginWithGooglePopup,
  logoutUser,
  subscribeToUserProfile,
  updateUserName,
  updateUserProfile,
  updateUserWhatsApp,
  upsertUserProfile,
  type UserProfile,
} from "@/lib/auth";

export { isValidWhatsAppNumber, normalizeWhatsAppNumber } from "@/lib/whatsapp";
