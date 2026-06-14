// ════════════════════════════════════════════════════════════════
//  Cálculos financieros del usuario. Toda la "cuenta" vive aquí para
//  que el dashboard y el coach IA usen exactamente los mismos números.
// ════════════════════════════════════════════════════════════════
import { transacciones } from "./store.js";
import { COLOR_CATEGORIA } from "./data/categorias.js";

const dosDecimales = (n) => Math.round(n * 100) / 100;

/**
 * Construye el resumen financiero de un usuario:
 *   - disponible:   ingresos - gastos
 *   - gastado:      suma de gastos
 *   - ingresos:     suma de ingresos
 *   - ahorros:      meta/actual configurados en el perfil
 *   - distribucion: gasto por categoría con porcentaje y color
 *   - recientes:    últimas N transacciones
 */
export async function calcularResumen(usuario, { limiteRecientes = 5 } = {}) {
  const lista = await transacciones.porUsuario(usuario.id);

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

  const distribucion = Object.entries(porCategoria)
    .map(([categoria, monto]) => ({
      categoria,
      monto: dosDecimales(monto),
      porcentaje: gastado > 0 ? dosDecimales((monto / gastado) * 100) : 0,
      color: COLOR_CATEGORIA[categoria] || COLOR_CATEGORIA.Otros,
    }))
    .sort((a, b) => b.monto - a.monto);

  return {
    disponible: dosDecimales(ingresos - gastado),
    ingresos: dosDecimales(ingresos),
    gastado: dosDecimales(gastado),
    ahorros: usuario.ahorros || { meta: 0, actual: 0 },
    distribucion,
    recientes: lista.slice(0, limiteRecientes),
    total_transacciones: lista.length,
  };
}
