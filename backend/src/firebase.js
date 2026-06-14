// ════════════════════════════════════════════════════════════════
//  Inicialización de Firebase Admin SDK.
//  Soporta tres modos de autenticación (en orden de prioridad):
//    1. FIREBASE_SERVICE_ACCOUNT_PATH → ruta a un archivo JSON de cuenta de servicio
//    2. FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY → vars individuales
//    3. Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS, Cloud Run, etc.)
// ════════════════════════════════════════════════════════════════
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

function init() {
  if (getApps().length > 0) return getFirestore();

  const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (saPath) {
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(readFileSync(saPath, "utf8"));
    } catch (err) {
      console.error(`[Firebase] No se pudo leer el archivo de credenciales "${saPath}":`, err.message);
      process.exit(1);
    }
    initializeApp({ credential: cert(serviceAccount) });
  } else if (process.env.FIREBASE_PROJECT_ID) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
      }),
    });
  } else {
    // Application Default Credentials (gcloud auth login, Cloud Run, etc.)
    initializeApp();
  }

  const firestore = getFirestore();
  firestore.settings({ ignoreUndefinedProperties: true });
  return firestore;
}

export const db = init();
