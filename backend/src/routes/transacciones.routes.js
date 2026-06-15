// ════════════════════════════════════════════════════════════════
//  CRUD de transacciones (ingresos y gastos en una sola colección,
//  diferenciados por `tipo`). Cubre las pantallas:
//    - Anadir Gasto / Gasto Completado
//    - Agregar Ingreso / Ingreso Correcto
//    - Historial de Transacciones (con filtros all/income/expenses)
//
//    GET    /api/transacciones?tipo=ingreso|gasto&limite=N
//    POST   /api/transacciones
//    GET    /api/transacciones/:id
//    PUT    /api/transacciones/:id
//    DELETE /api/transacciones/:id
// ════════════════════════════════════════════════════════════════
import { Router } from "express";
import { ok, fail, asyncHandler } from "../http.js";
import { transacciones, generarId } from "../store.js";
import { requireAuth } from "../auth.js";
import { CATEGORIAS } from "../data/categorias.js";
import { limpiar, validarFecha } from "../utils.js";

const router = Router();
router.use(requireAuth);

// Normaliza y valida el cuerpo de una transacción entrante.
function construirTransaccion(body, usuarioId) {
  const tipo = body.tipo === "ingreso" ? "ingreso" : "gasto";
  const monto = Number(body.monto);
  if (!Number.isFinite(monto) || monto <= 0) {
    return { error: "El monto debe ser un número mayor a 0" };
  }

  let fecha = new Date().toISOString();
  if (body.fecha) {
    const f = validarFecha(body.fecha);
    if (!f) return { error: "La fecha proporcionada no es válida" };
    fecha = f;
  }

  const categoria = CATEGORIAS.includes(body.categoria)
    ? body.categoria
    : tipo === "ingreso"
      ? "Nómina"
      : "Otros";

  return {
    tx: {
      id: generarId(),
      usuarioId,
      tipo,
      monto,
      descripcion: limpiar(body.descripcion, 200) || (tipo === "ingreso" ? "Ingreso" : "Gasto"),
      categoria,
      metodo_pago: tipo === "gasto" ? limpiar(body.metodo_pago || "Efectivo", 50) : null,
      comercio: body.comercio ? limpiar(body.comercio, 100) : null,
      fecha,
      recurrente: Boolean(body.recurrente),
      frecuencia: body.recurrente ? body.frecuencia || "mensual" : null,
      creado_en: new Date().toISOString(),
    },
  };
}

// ── Listar (con filtro por tipo y límite opcional) ────────────────
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { tipo, limite } = req.query;
    if (tipo && !["ingreso", "gasto"].includes(tipo)) {
      return fail(res, 400, "TIPO_INVALIDO", "tipo debe ser 'ingreso' o 'gasto'");
    }
    let lista = await transacciones.porUsuario(req.usuario.id, { tipo });
    if (limite) lista = lista.slice(0, Number(limite));
    return ok(res, lista, "Transacciones obtenidas");
  })
);

// ── Crear ─────────────────────────────────────────────────────────
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { tx, error } = construirTransaccion(req.body || {}, req.usuario.id);
    if (error) return fail(res, 422, "VALIDACION", error);
    await transacciones.crear(tx);
    return ok(res, tx, "Transacción registrada", 201);
  })
);

// Helper: busca la transacción y verifica que pertenezca al usuario.
async function buscarPropia(req, res) {
  const t = await transacciones.porId(req.params.id);
  if (!t || t.usuarioId !== req.usuario.id) {
    fail(res, 404, "NO_ENCONTRADA", "Transacción no encontrada");
    return null;
  }
  return t;
}

// ── Obtener una ───────────────────────────────────────────────────
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const t = await buscarPropia(req, res);
    if (t) return ok(res, t, "Transacción obtenida");
  })
);

// ── Actualizar ────────────────────────────────────────────────────
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const t = await buscarPropia(req, res);
    if (!t) return;
    const cambios = {};
    if (req.body.monto != null) {
      const monto = Number(req.body.monto);
      if (!Number.isFinite(monto) || monto <= 0) {
        return fail(res, 422, "VALIDACION", "El monto debe ser mayor a 0");
      }
      cambios.monto = monto;
    }
    for (const campo of ["descripcion", "comercio", "metodo_pago", "frecuencia"]) {
      if (req.body[campo] != null) cambios[campo] = req.body[campo];
    }
    if (req.body.categoria && CATEGORIAS.includes(req.body.categoria)) {
      cambios.categoria = req.body.categoria;
    }
    if (req.body.fecha) cambios.fecha = new Date(req.body.fecha).toISOString();
    if (req.body.recurrente != null) cambios.recurrente = Boolean(req.body.recurrente);
    const actualizada = await transacciones.actualizar(t.id, cambios);
    return ok(res, actualizada, "Transacción actualizada");
  })
);

// ── Borrar ────────────────────────────────────────────────────────
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const t = await buscarPropia(req, res);
    if (!t) return;
    await transacciones.borrar(t.id);
    return ok(res, { id: t.id }, "Transacción eliminada");
  })
);

export default router;
