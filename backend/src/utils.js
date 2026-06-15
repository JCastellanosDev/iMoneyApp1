// Shared validation and sanitization utilities used by multiple route handlers.

/** Strips HTML tags, trims whitespace, and enforces a maximum length. */
export function limpiar(val, max = 200) {
  return String(val ?? "").replace(/<[^>]*>/g, "").trim().slice(0, max);
}

/**
 * Parses a date value and returns an ISO string.
 * Returns null — never throws — so callers can return a 422 instead of crashing.
 */
export function validarFecha(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString();
}
