// ════════════════════════════════════════════════════════════════
//  Datos agregados para las pantallas Dashboard y Cartera.
//    GET /api/dashboard          → resumen completo (balance, gastado,
//                                   ahorros, distribución, recientes)
//    GET /api/config/ingreso     → configuración de ingreso
//    PUT /api/config/ingreso     → guardar ingreso (monto, frecuencia)
//    GET /api/ahorros            → meta y monto actual de ahorro
//    PUT /api/ahorros            → actualizar ahorro
// ════════════════════════════════════════════════════════════════
import { Router } from "express";
import { ok, fail, asyncHandler } from "../http.js";
import { usuarios } from "../store.js";
import { requireAuth } from "../auth.js";
import { calcularResumen } from "../resumen.js";
import { FACTOR_MENSUAL } from "../data/categorias.js";

const router = Router();

// ── Dashboard / Cartera ───────────────────────────────────────────
router.get(
  "/dashboard",
  requireAuth,
  asyncHandler(async (req, res) => {
    const resumen = await calcularResumen(req.usuario);
    return ok(res, resumen, "Dashboard obtenido");
  })
);

// ── Configuración de ingreso ──────────────────────────────────────
router.get(
  "/config/ingreso",
  requireAuth,
  asyncHandler(async (req, res) => ok(res, req.usuario.ingreso, "Configuración de ingreso"))
);

router.put(
  "/config/ingreso",
  requireAuth,
  asyncHandler(async (req, res) => {
    const monto = Number(req.body?.monto);
    const frecuencia = req.body?.frecuencia || "mensual";
    if (!Number.isFinite(monto) || monto < 0) {
      return fail(res, 422, "VALIDACION", "monto debe ser un número >= 0");
    }
    if (!FACTOR_MENSUAL[frecuencia]) {
      return fail(res, 422, "VALIDACION", `frecuencia inválida (${Object.keys(FACTOR_MENSUAL).join(", ")})`);
    }
    const ingreso = {
      monto,
      frecuencia,
      mensual_estimado: Math.round(monto * FACTOR_MENSUAL[frecuencia] * 100) / 100,
    };
    await usuarios.actualizar(req.usuario.id, { ingreso });
    return ok(res, ingreso, "Ingreso actualizado");
  })
);

// ── Ahorros ───────────────────────────────────────────────────────
router.get(
  "/ahorros",
  requireAuth,
  asyncHandler(async (req, res) => ok(res, req.usuario.ahorros, "Ahorros obtenidos"))
);

router.put(
  "/ahorros",
  requireAuth,
  asyncHandler(async (req, res) => {
    const meta = req.body?.meta != null ? Number(req.body.meta) : req.usuario.ahorros.meta;
    const actual = req.body?.actual != null ? Number(req.body.actual) : req.usuario.ahorros.actual;
    if (![meta, actual].every((n) => Number.isFinite(n) && n >= 0)) {
      return fail(res, 422, "VALIDACION", "meta y actual deben ser números >= 0");
    }
    const ahorros = { meta, actual };
    await usuarios.actualizar(req.usuario.id, { ahorros });
    return ok(res, ahorros, "Ahorros actualizados");
  })
);

export default router;
