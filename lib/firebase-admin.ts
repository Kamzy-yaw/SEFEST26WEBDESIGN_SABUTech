import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getServiceAccount() {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    try {
      const parsed = JSON.parse(serviceAccountKey) as
        | string
        | {
            project_id?: string;
            client_email?: string;
            private_key?: string;
          };
      const serviceAccount = typeof parsed === "string" ? JSON.parse(parsed) : parsed;

      if (serviceAccount.client_email && serviceAccount.private_key) {
        return {
          project_id: serviceAccount.project_id || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          client_email: serviceAccount.client_email,
          private_key: serviceAccount.private_key.replace(/\\n/g, "\n"),
        };
      }
    } catch {
      // Fall back to split Firebase Admin env below.
    }
  }

  return {
    project_id: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  };
}

export function getFirebaseAdminServices() {
  const serviceAccount = getServiceAccount();
  const projectId = serviceAccount.project_id;
  const clientEmail = serviceAccount.client_email;
  const privateKey = serviceAccount.private_key;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Konfigurasi Firebase Admin belum lengkap. Isi FIREBASE_SERVICE_ACCOUNT_KEY atau FIREBASE_CLIENT_EMAIL dan FIREBASE_PRIVATE_KEY.",
    );
  }

  const app =
    getApps().length > 0
      ? getApps()[0]
      : initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });

  return {
    adminAuth: getAuth(app),
    adminDb: getFirestore(app),
  };
}
