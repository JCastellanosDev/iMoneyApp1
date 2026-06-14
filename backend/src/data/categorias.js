// ════════════════════════════════════════════════════════════════
//  Categorías oficiales del sistema (alineadas con la interfaz y con
//  el prompt de /api/leer-ticket). Si agregas una, refléjala también
//  en el prompt de IA para que clasifique con las mismas opciones.
// ════════════════════════════════════════════════════════════════
export const CATEGORIAS = [
  "Comida",
  "Transporte",
  "Compras",
  "Servicios",
  "Salud",
  "Entretenimiento",
  "Vivienda",
  "Ocio",
  "Nómina",
  "Otros",
];

// Color por categoría — lo usa la gráfica de "Distribución de Gastos".
export const COLOR_CATEGORIA = {
  Comida: "#f97316",
  Transporte: "#3b82f6",
  Compras: "#a855f7",
  Servicios: "#14b8a6",
  Salud: "#ef4444",
  Entretenimiento: "#eab308",
  Vivienda: "#2563eb",
  Ocio: "#ec4899",
  Nómina: "#22c55e",
  Otros: "#6b7280",
};

// Cuántas veces multiplicar un ingreso para normalizarlo a "mensual".
export const FACTOR_MENSUAL = {
  diario: 30,
  semanal: 4.33,
  quincenal: 2,
  mensual: 1,
};
