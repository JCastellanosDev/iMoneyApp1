// ════════════════════════════════════════════════════════════════
//  Capa de persistencia respaldada por Cloud Firestore (Firebase).
//
//  Colecciones:
//    usuarios      — documento por usuario (id = UUID del usuario)
//    transacciones — documento por transacción (id = UUID)
//    reportes      — reportes mensuales archivados (id = UUID)
//
//  Todas las funciones son async para que Express asyncHandler las maneje.
// ════════════════════════════════════════════════════════════════
import { db } from "./firebase.js";
import { randomUUID } from "crypto";

export function generarId() {
  return randomUUID();
}

// ── Usuarios ─────────────────────────────────────────────────────
export const usuarios = {
  async todos() {
    const snap = await db.collection("usuarios").get();
    return snap.docs.map((d) => d.data());
  },

  async porId(id) {
    const doc = await db.collection("usuarios").doc(id).get();
    return doc.exists ? doc.data() : null;
  },

  async porEmail(email) {
    const snap = await db
      .collection("usuarios")
      .where("email", "==", String(email).toLowerCase())
      .limit(1)
      .get();
    return snap.empty ? null : snap.docs[0].data();
  },

  async crear(usuario) {
    await db.collection("usuarios").doc(usuario.id).set(usuario);
    return usuario;
  },

  async actualizar(id, cambios) {
    const ref = db.collection("usuarios").doc(id);
    const doc = await ref.get();
    if (!doc.exists) return null;
    await ref.update(cambios);
    // Re-lee para devolver el estado real guardado en Firestore.
    const actualizado = await ref.get();
    return actualizado.data();
  },
};

// ── Transacciones ────────────────────────────────────────────────
export const transacciones = {
  async porUsuario(usuarioId, { tipo } = {}) {
    const snap = await db
      .collection("transacciones")
      .where("usuarioId", "==", usuarioId)
      .get();
    let lista = snap.docs.map((d) => d.data());
    if (tipo) lista = lista.filter((t) => t.tipo === tipo);
    return lista.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  },

  async porId(id) {
    const doc = await db.collection("transacciones").doc(id).get();
    return doc.exists ? doc.data() : null;
  },

  async crear(tx) {
    await db.collection("transacciones").doc(tx.id).set(tx);
    return tx;
  },

  async actualizar(id, cambios) {
    const ref = db.collection("transacciones").doc(id);
    const doc = await ref.get();
    if (!doc.exists) return null;
    await ref.update(cambios);
    const actualizado = await ref.get();
    return actualizado.data();
  },

  async borrar(id) {
    const ref = db.collection("transacciones").doc(id);
    const doc = await ref.get();
    if (!doc.exists) return false;
    await ref.delete();
    return true;
  },

  // Devuelve las transacciones de un usuario en el mes indicado (YYYY-MM).
  async porMes(usuarioId, mes) {
    const snap = await db
      .collection("transacciones")
      .where("usuarioId", "==", usuarioId)
      .get();
    return snap.docs
      .map((d) => d.data())
      .filter((t) => t.fecha.startsWith(mes))
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  },

  // Elimina en lote las transacciones de un usuario en el mes indicado.
  async borrarDelMes(usuarioId, mes) {
    const snap = await db
      .collection("transacciones")
      .where("usuarioId", "==", usuarioId)
      .get();
    const docs = snap.docs.filter((d) => d.data().fecha.startsWith(mes));
    if (docs.length === 0) return 0;
    // Firestore limita a 500 operaciones por batch; para un uso normal esto es suficiente.
    const batch = db.batch();
    docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    return docs.length;
  },
};

// ── Reportes mensuales ───────────────────────────────────────────
export const reportes = {
  async porUsuario(usuarioId) {
    const snap = await db
      .collection("reportes")
      .where("usuarioId", "==", usuarioId)
      .get();
    return snap.docs
      .map((d) => d.data())
      .sort((a, b) => b.mes.localeCompare(a.mes));
  },

  async porMes(usuarioId, mes) {
    const snap = await db
      .collection("reportes")
      .where("usuarioId", "==", usuarioId)
      .where("mes", "==", mes)
      .limit(1)
      .get();
    return snap.empty ? null : snap.docs[0].data();
  },

  async crear(reporte) {
    await db.collection("reportes").doc(reporte.id).set(reporte);
    return reporte;
  },
};

// ── Seed helper ──────────────────────────────────────────────────
/** Borra todo y carga datos frescos. Solo para npm run seed. */
export async function reemplazarTodo(nuevo) {
  const batch1 = db.batch();
  const [uSnap, tSnap] = await Promise.all([
    db.collection("usuarios").get(),
    db.collection("transacciones").get(),
  ]);
  uSnap.docs.forEach((d) => batch1.delete(d.ref));
  tSnap.docs.forEach((d) => batch1.delete(d.ref));
  await batch1.commit();

  const batch2 = db.batch();
  for (const u of nuevo.usuarios || []) {
    batch2.set(db.collection("usuarios").doc(u.id), u);
  }
  for (const t of nuevo.transacciones || []) {
    batch2.set(db.collection("transacciones").doc(t.id), t);
  }
  await batch2.commit();
}
