// ════════════════════════════════════════════════════════════════
//  Datos de demostración. Crea un usuario de prueba con transacciones
//  para que el dashboard y el historial se vean poblados de inmediato.
//
//    Usuario:  demo@finflow.mx
//    Password: demo1234
//
//  Ejecuta:  npm run seed
// ════════════════════════════════════════════════════════════════
import bcrypt from "bcryptjs";
import { reemplazarTodo, generarId } from "./store.js";

const usuarioId = generarId();
const passwordHash = bcrypt.hashSync("demo1234", 10);
const hoy = new Date();
const dia = (n) => new Date(hoy.getTime() - n * 86400000).toISOString();

const usuario = {
  id: usuarioId,
  nombre: "Alex Demo",
  email: "demo@finflow.mx",
  passwordHash,
  googleId: null,
  avatar: null,
  ajustes: { notificaciones: true, biometria: false },
  ingreso: { monto: 2850, frecuencia: "mensual", mensual_estimado: 2850 },
  ahorros: { meta: 10000, actual: 4800 },
  creado_en: dia(40),
};

const g = (monto, descripcion, categoria, metodo_pago, comercio, d) => ({
  id: generarId(),
  usuarioId,
  tipo: "gasto",
  monto,
  descripcion,
  categoria,
  metodo_pago,
  comercio,
  fecha: dia(d),
  recurrente: false,
  frecuencia: null,
  creado_en: dia(d),
});

const i = (monto, descripcion, recurrente, frecuencia, d) => ({
  id: generarId(),
  usuarioId,
  tipo: "ingreso",
  monto,
  descripcion,
  categoria: "Nómina",
  metodo_pago: null,
  comercio: null,
  fecha: dia(d),
  recurrente,
  frecuencia,
  creado_en: dia(d),
});

const transacciones = [
  i(2850, "Nómina Mensual", true, "mensual", 1),
  g(84.5, "Supermercado Central", "Comida", "Tarjeta", "Supermercado Central", 0),
  g(120.0, "La Parrilla Gourmet", "Comida", "Tarjeta", "La Parrilla Gourmet", 1),
  g(55.2, "Gasolinera Repsol", "Transporte", "Tarjeta", "Gasolinera Repsol", 2),
  g(64.2, "Factura Luz", "Servicios", "Tarjeta", "Iberdrola", 3),
  g(85.0, "Zara Fashion", "Compras", "Tarjeta", "Zara", 4),
  g(12.3, "Uber Trip", "Transporte", "Tarjeta", "Uber", 5),
  g(450.0, "Renta", "Vivienda", "Tarjeta", null, 6),
  g(30.0, "Cine", "Ocio", "Efectivo", "Cinépolis", 7),
];

await reemplazarTodo({ usuarios: [usuario], transacciones });

console.log("✅ Datos demo cargados en Firestore.");
console.log("   Usuario:  demo@finflow.mx");
console.log("   Password: demo1234");
console.log(`   ${transacciones.length} transacciones creadas.`);

process.exit(0);
