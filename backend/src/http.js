// ════════════════════════════════════════════════════════════════
//  Helpers para responder SIEMPRE con la estructura estándar que la
//  interfaz espera. Centralizar esto evita inconsistencias.
//
//    Éxito:  { success: true,  data: {...}, message: "..." }
//    Error:  { success: false, error: "CODIGO", message: "..." }
// ════════════════════════════════════════════════════════════════

/** Respuesta exitosa. `code` por defecto 200. */
export function ok(res, data = null, message = "OK", code = 200) {
  return res.status(code).json({ success: true, data, message });
}

/** Respuesta de error con código HTTP y un código de error legible. */
export function fail(res, code = 400, error = "BAD_REQUEST", message = "Solicitud inválida") {
  return res.status(code).json({ success: false, error, message });
}

/** Envuelve un handler async para que cualquier excepción caiga en el manejador de errores. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
