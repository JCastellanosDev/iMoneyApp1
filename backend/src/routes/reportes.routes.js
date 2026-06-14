// ════════════════════════════════════════════════════════════════
//  Reportes mensuales de salud financiera.
//
//  Flujo automático: el cron en server.js llama a generarReporteMes()
//  el día 1 de cada mes a las 00:00 para el mes anterior.
//  Tras generar el reporte, las transacciones de ese mes se eliminan
//  de Firestore para no ocupar espacio.
//
//    GET  /api/reporte             → lista los reportes del usuario
//    GET  /api/reporte/:mes        → reporte de un mes (YYYY-MM)
//    POST /api/reporte/generar     → genera manualmente (body: { mes })
// ════════════════════════════════════════════════════════════════
import { Router } from "express";
import { ok, fail, asyncHandler } from "../http.js";
import { requireAuth } from "../auth.js";
import { usuarios, transacciones, reportes, generarId } from "../store.js";
import { COLOR_CATEGORIA } from "../data/categorias.js";

const router = Router();

// ── Cálculo de salud financiera ───────────────────────────────────

function calcularScore(ingresos, gastado, porCategoria) {
  let score = 0;

  if (ingresos > 0) {
    const tasaGasto = gastado / ingresos;

    // Control del gasto (50 puntos)
    if (tasaGasto <= 0.7) score += 50;
    else if (tasaGasto <= 0.8) score += 35;
    else if (tasaGasto <= 0.9) score += 20;
    else if (tasaGasto <= 1.0) score += 10;

    // Tasa de ahorro (30 puntos)
    const tasaAhorro = (ingresos - gastado) / ingresos;
    if (tasaAhorro >= 0.2) score += 30;
    else if (tasaAhorro >= 0.1) score += 20;
    else if (tasaAhorro >= 0.05) score += 10;
  }

  // Diversidad de categorías (20 puntos)
  const numCat = Object.keys(porCategoria).length;
  if (numCat >= 5) score += 20;
  else if (numCat >= 3) score += 15;
  else if (numCat >= 2) score += 10;
  else if (numCat >= 1) score += 5;

  return Math.min(100, score);
}

function etiquetaSalud(score) {
  if (score >= 80) return "Excelente";
  if (score >= 60) return "Buena";
  if (score >= 40) return "Regular";
  return "Crítica";
}

// Devuelve "YYYY-MM" del mes anterior al actual.
function mesAnterior() {
  const d = new Date();
  const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
}

// ── Lógica principal (exportada para el cron) ─────────────────────

/**
 * Genera el reporte del mes indicado para un usuario.
 * Si ya existe, devuelve el existente sin duplicar.
 * Al terminar, elimina las transacciones de ese mes de Firestore.
 */
export async function generarReporteMes(usuarioId, mes) {
  const existente = await reportes.porMes(usuarioId, mes);
  if (existente) return existente;

  const usuario = await usuarios.porId(usuarioId);
  if (!usuario) return null;

  const lista = await transacciones.porMes(usuarioId, mes);

  let ingresos = 0;
  let gastado = 0;
  const porCategoria = {};

  for (const t of lista) {
    if (t.tipo === "ingreso") {
      ingresos += t.monto;
    } else {
      gastado += t.monto;
      porCategoria[t.categoria] = (porCategoria[t.categoria] || 0) + t.monto;
    }
  }

  const r2 = (n) => Math.round(n * 100) / 100;

  const distribucion = Object.entries(porCategoria)
    .map(([categoria, monto]) => ({
      categoria,
      monto: r2(monto),
      porcentaje: gastado > 0 ? r2((monto / gastado) * 100) : 0,
      color: COLOR_CATEGORIA[categoria] || COLOR_CATEGORIA.Otros,
    }))
    .sort((a, b) => b.monto - a.monto);

  const score = calcularScore(ingresos, gastado, porCategoria);
  const ahorro_neto = r2(ingresos - gastado);
  const tasa_ahorro = ingresos > 0 ? r2(((ingresos - gastado) / ingresos) * 100) : 0;

  // Observaciones automáticas sobre la salud financiera
  const observaciones = [];
  if (ingresos === 0) {
    observaciones.push("No se registraron ingresos este mes.");
  } else {
    observaciones.push(
      `Gastaste el ${r2((gastado / ingresos) * 100)}% de tus ingresos (${
        gastado <= ingresos ? "dentro" : "por encima"
      } de tu presupuesto).`
    );
  }
  if (ahorro_neto >= 0) {
    observaciones.push(
      `Ahorraste $${ahorro_neto.toLocaleString("es-MX")} MXN — el ${tasa_ahorro}% de tus ingresos del mes.`
    );
  } else {
    observaciones.push(
      `Tus gastos superaron tus ingresos por $${Math.abs(ahorro_neto).toLocaleString("es-MX")} MXN.`
    );
  }
  if (distribucion.length > 0) {
    const top = distribucion[0];
    observaciones.push(
      `Tu mayor categoría de gasto fue "${top.categoria}" con $${top.monto.toLocaleString("es-MX")} MXN (${top.porcentaje}% del total gastado).`
    );
  }

  // Período: primer y último día del mes
  const [anio, numMes] = mes.split("-").map(Number);
  const ultimoDia = new Date(anio, numMes, 0).toISOString().slice(0, 10);

  const reporte = {
    id: generarId(),
    usuarioId,
    mes,
    generado_en: new Date().toISOString(),
    periodo: { inicio: `${mes}-01`, fin: ultimoDia },
    resumen: {
      ingresos: r2(ingresos),
      gastado: r2(gastado),
      ahorro_neto,
      tasa_ahorro,
      score,
      salud_financiera: etiquetaSalud(score),
      distribucion,
      top_categorias: distribucion.slice(0, 3),
      observaciones,
    },
    transacciones_archivadas: lista.length,
  };

  await reportes.crear(reporte);

  // Liberar espacio: eliminar las transacciones del mes ya archivado
  await transacciones.borrarDelMes(usuarioId, mes);

  return reporte;
}

// ── Rutas ─────────────────────────────────────────────────────────

// Lista todos los reportes del usuario, ordenados del más reciente al más antiguo.
router.get(
  "/reporte",
  requireAuth,
  asyncHandler(async (req, res) => {
    const lista = await reportes.porUsuario(req.usuario.id);
    return ok(res, lista, "Reportes obtenidos");
  })
);

// Devuelve el reporte de un mes específico.
router.get(
  "/reporte/:mes",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { mes } = req.params;
    if (!/^\d{4}-\d{2}$/.test(mes)) {
      return fail(res, 400, "FORMATO_INVALIDO", "El mes debe tener formato YYYY-MM (ej: 2026-06)");
    }
    const reporte = await reportes.porMes(req.usuario.id, mes);
    if (!reporte) return fail(res, 404, "NO_ENCONTRADO", `No hay reporte para ${mes}`);
    return ok(res, reporte, "Reporte obtenido");
  })
);

// Genera (o devuelve si ya existe) el reporte del mes indicado.
// Body opcional: { "mes": "2026-05" }  — si se omite, usa el mes anterior.
router.post(
  "/reporte/generar",
  requireAuth,
  asyncHandler(async (req, res) => {
    const mes = req.body?.mes || mesAnterior();
    if (!/^\d{4}-\d{2}$/.test(mes)) {
      return fail(res, 400, "FORMATO_INVALIDO", "El mes debe tener formato YYYY-MM (ej: 2026-06)");
    }
    const reporte = await generarReporteMes(req.usuario.id, mes);
    if (!reporte) return fail(res, 500, "ERROR_INTERNO", "No se pudo generar el reporte");
    const yaExistia = reporte.generado_en < new Date(Date.now() - 2000).toISOString();
    return ok(res, reporte, yaExistia ? `Reporte de ${mes} ya existía` : `Reporte de ${mes} generado`);
  })
);

export default router;
