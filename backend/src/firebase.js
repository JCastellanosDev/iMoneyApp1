// ════════════════════════════════════════════════════════════════
//  Inicialización de Firebase Admin SDK.
//  Soporta cuatro modos de autenticación (en orden de prioridad):
//    1. FIREBASE_SERVICE_ACCOUNT      → Contenido JSON completo (String) en variable de entorno
//    2. FIREBASE_SERVICE_ACCOUNT_PATH → Ruta física a un archivo JSON de cuenta de servicio
//    3. FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY → vars individuales
//    4. Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS, Cloud Run, etc.)
// ════════════════════════════════════════════════════════════════
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

function init() {
  if (getApps().length > 0) return getFirestore();

  const saJsonString = process.env.FIREBASE_SERVICE_ACCOUNT;
  const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  // 1. Prioridad Máxima: Leer el string con todo el JSON (Ideal para Vercel)
  if (saJsonString) {
    try {
      const serviceAccount = JSON.parse(saJsonString);
      initializeApp({ credential: cert(serviceAccount) });
      console.log("[Firebase] Inicializado correctamente desde FIREBASE_SERVICE_ACCOUNT.");
    } catch (err) {
      console.error("[Firebase] Error al parsear el JSON de la variable FIREBASE_SERVICE_ACCOUNT:", err.message);
      process.exit(1);
    }
  }
  // 2. Segunda opción: Buscar por ruta física de archivo local (Tu entorno de desarrollo)
  else if (saPath) {
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(readFileSync(saPath, "utf8"));
    } catch (err) {
      console.error(`[Firebase] No se pudo leer el archivo de credenciales "${saPath}":`, err.message);
      process.exit(1);
    }
    initializeApp({ credential: cert(serviceAccount) });
  }
  // 3. Tercera opción: Variables individuales
  else if (process.env.FIREBASE_PROJECT_ID) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
      }),
    });
  }
  // 4. Última opción: Credenciales por defecto
  else {
    initializeApp();
  }

  const firestore = getFirestore();
  firestore.settings({ ignoreUndefinedProperties: true });
  return firestore;
}

export const db = init();