// ════════════════════════════════════════════════════════════════
//  Servidor REST de FinFlow / ¡Money.
//  Monta todas las rutas bajo /api, habilita CORS para que la interfaz
//  (servida en otro origen/puerto) pueda llamarlo, y centraliza el
//  manejo de errores en el formato estándar { success, error, message }.
//
//  Arranque:  node src/server.js   (o npm start / npm run dev)
// ════════════════════════════════════════════════════════════════
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cron from "node-cron";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { ok, fail } from "./http.js";
import authRoutes from "./routes/auth.routes.js";
import transaccionesRoutes from "./routes/transacciones.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import iaRoutes from "./routes/ia.routes.js";
import reportesRoutes, { generarReporteMes } from "./routes/reportes.routes.js";
import { CATEGORIAS, COLOR_CATEGORIA } from "./data/categorias.js";
import { usuarios } from "./store.js";

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares globales ──────────────────────────────────────────
// Cabeceras de seguridad HTTP (XSS, clickjacking, sniffing, etc.)
app.use(helmet({ contentSecurityPolicy: false })); // CSP desactivado: la UI usa CDN de Tailwind/Google

const origenes = (process.env.CORS_ORIGIN || "*").split(",").map((s) => s.trim());
app.use(cors({ origin: origenes.includes("*") ? true : origenes }));

// Límite pequeño para todas las rutas; la de escaneo de ticket lo sobreescribe más abajo.
app.use(express.json({ limit: "100kb" }));

// ── Rutas públicas utilitarias ────────────────────────────────────
app.get("/api/health", (req, res) => ok(res, { status: "up", hora: new Date().toISOString() }, "API operativa"));

app.get("/api/categorias", (req, res) =>
  ok(res, CATEGORIAS.map((c) => ({ nombre: c, color: COLOR_CATEGORIA[c] })), "Categorías disponibles")
);

// ── Rutas de la aplicación (todas bajo /api) ──────────────────────
app.use("/api", authRoutes); // /api/auth/*, /api/perfil
app.use("/api/transacciones", transaccionesRoutes);
app.use("/api", dashboardRoutes); // /api/dashboard, /api/config/ingreso, /api/ahorros
// La ruta de escaneo de ticket acepta imágenes en base64 (hasta 15 MB).
app.use("/api/leer-ticket", express.json({ limit: "15mb" }));
app.use("/api", iaRoutes);      // /api/leer-ticket, /api/coach
app.use("/api", reportesRoutes); // /api/reporte, /api/reporte/:mes, /api/reporte/generar

// ── Frontend estático ─────────────────────────────────────────────
// Sirve los mockups HTML/JS desde la raíz del repo, así la interfaz y el
// API comparten origen (http://localhost:3000) y no hay problemas de CORS.
const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = join(__dirname, "..", ".."); // raíz del repo (padre de backend/)

// La raíz "/" abre directamente la pantalla de login (antes del static,
// para que no sirva index.html en su lugar).
app.get("/", (req, res) =>
  res.redirect("/login_compacto_gesti_n_de_ahorro/inicioSesion.html")
);

app.use(express.static(FRONTEND_DIR));

// ── 404 ───────────────────────────────────────────────────────────
// Solo las rutas /api/* desconocidas devuelven JSON; el resto cae aquí
// como recurso estático no encontrado.
app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return fail(res, 404, "RUTA_NO_ENCONTRADA", `No existe ${req.method} ${req.path}`);
  }
  fail(res, 404, "RECURSO_NO_ENCONTRADO", `No se encontró ${req.path}`);
});

// ── Manejador de errores central ──────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("[error]", err);
  // En producción no exponemos detalles internos; en desarrollo sí.
  const mensaje = process.env.NODE_ENV === "production"
    ? "Error interno del servidor"
    : (err.message || "Error interno del servidor");
  fail(res, 500, "ERROR_INTERNO", mensaje);
});

// ── Cron: reporte mensual automático ─────────────────────────────
// Corre a las 00:00 del día 1 de cada mes.
// Genera el reporte del mes anterior para todos los usuarios y
// elimina sus transacciones de Firestore para liberar espacio.
cron.schedule("0 0 1 * *", async () => {
  const d = new Date();
  const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  const mes = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
  console.log(`[cron] Generando reportes mensuales para ${mes}...`);
  try {
    const todos = await usuarios.todos();
    let okCount = 0;
    for (const u of todos) {
      await generarReporteMes(u.id, mes);
      okCount++;
    }
    console.log(`[cron] Reportes de ${mes} listos para ${okCount}/${todos.length} usuario(s).`);
  } catch (err) {
    console.error("[cron] Error al generar reportes:", err.message);
  }
});

app.listen(PORT, () => {
  console.log(`\n✅ FinFlow API en http://localhost:${PORT}`);
  console.log(`   GET  /api/health`);
  console.log(`   POST /api/auth/register | /api/auth/login | /api/auth/google`);
  console.log(`   CRUD /api/transacciones`);
  console.log(`   GET  /api/dashboard`);
  console.log(`   POST /api/leer-ticket | /api/coach`);
  console.log(`   GET  /api/reporte | POST /api/reporte/generar`);
  console.log(`   IA   ${process.env.GEMINI_API_KEY ? "Gemini ACTIVA" : "modo DEMO (sin GEMINI_API_KEY)"}`);
  console.log(`   DB   Firestore (Firebase)\n`);
});

export default app;
